import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InAppNotification } from '../../services/NotificationService.js';
import { FloatingNotificationCard } from './FloatingNotificationCard.js';

interface NotificationWithId extends InAppNotification {
  id: string;
  timestamp: Date;
}

interface RealTimeNotificationManagerProps {
  userId: string;
  maxFloatingNotifications?: number;
  enableWebSocket?: boolean;
  pollingInterval?: number;
  onNotificationReceived?: (notification: NotificationWithId) => void;
  onNotificationAction?: (action: string, notificationId: string, notification: NotificationWithId) => void;
}

export const RealTimeNotificationManager: React.FC<RealTimeNotificationManagerProps> = ({
  userId,
  maxFloatingNotifications = 3,
  enableWebSocket = true,
  pollingInterval = 30000,
  onNotificationReceived,
  onNotificationAction
}) => {
  const [floatingNotifications, setFloatingNotifications] = useState<NotificationWithId[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize real-time connection
  useEffect(() => {
    if (enableWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      cleanup();
    };
  }, [userId, enableWebSocket]);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connectWebSocket = () => {
    try {
      // In a real implementation, this would connect to your WebSocket server
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications/${userId}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            handleNewNotification(data.notification);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else {
          // Fall back to polling if WebSocket fails
          console.log('WebSocket failed, falling back to polling');
          startPolling();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      fetchNewNotifications();
    }, pollingInterval);

    // Initial fetch
    fetchNewNotifications();
  };

  const fetchNewNotifications = async () => {
    try {
      // In a real implementation, this would fetch from your API
      const response = await fetch(`/api/notifications/recent/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notifications) {
          data.notifications.forEach((notification: any) => {
            handleNewNotification(notification);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewNotification = useCallback((notification: InAppNotification) => {
    const notificationWithId: NotificationWithId = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add to floating notifications (limit to max)
    setFloatingNotifications(prev => {
      const updated = [notificationWithId, ...prev];
      return updated.slice(0, maxFloatingNotifications);
    });

    // Store in localStorage for history
    const stored = localStorage.getItem(`notifications_${userId}`) || '[]';
    const notifications = JSON.parse(stored);
    notifications.unshift({
      ...notificationWithId,
      read: false,
      archived: false
    });
    
    // Keep only last 100 notifications in history
    const trimmed = notifications.slice(0, 100);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(trimmed));

    // Call callback
    onNotificationReceived?.(notificationWithId);

    // Play notification sound (if enabled)
    playNotificationSound();

    // Show browser notification (if permission granted)
    showBrowserNotification(notificationWithId);

  }, [userId, maxFloatingNotifications, onNotificationReceived]);

  const playNotificationSound = () => {
    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Ignore audio errors
    }
  };

  const showBrowserNotification = (notification: NotificationWithId) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'error'
      });
    }
  };

  const handleNotificationAction = (action: string, notificationId: string) => {
    const notification = floatingNotifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Handle built-in actions
    switch (action) {
      case 'dismiss':
        dismissNotification(notificationId);
        break;
      
      case 'approve':
        // Handle approval action
        if (notification.data?.propostaId) {
          handlePropostaAction('approve', notification.data.propostaId);
        }
        break;
      
      case 'reject':
        // Handle rejection action
        if (notification.data?.propostaId) {
          handlePropostaAction('reject', notification.data.propostaId);
        }
        break;
      
      default:
        // Custom action
        onNotificationAction?.(action, notificationId, notification);
        break;
    }
  };

  const handlePropostaAction = async (action: 'approve' | 'reject', propostaId: string) => {
    try {
      const response = await fetch(`/api/propostas/${propostaId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comentario: action === 'approve' ? 'Aprovado via notificação' : 'Rejeitado via notificação'
        })
      });

      if (response.ok) {
        // Show success notification
        handleNewNotification({
          userId,
          title: action === 'approve' ? 'Proposta Aprovada' : 'Proposta Rejeitada',
          message: `A proposta foi ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso.`,
          type: 'success'
        });
      } else {
        throw new Error('Falha na ação');
      }
    } catch (error) {
      // Show error notification
      handleNewNotification({
        userId,
        title: 'Erro na Ação',
        message: 'Não foi possível executar a ação. Tente novamente.',
        type: 'error'
      });
    }
  };

  const dismissNotification = (notificationId: string) => {
    setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Simulate receiving notifications for demo purposes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const demoTimer = setTimeout(() => {
        handleNewNotification({
          userId,
          title: 'Bem-vindo ao Sistema!',
          message: 'Sistema de notificações em tempo real está funcionando.',
          type: 'info',
          actionText: 'Ver Dashboard',
          actionUrl: '/dashboard'
        });
      }, 3000);

      return () => clearTimeout(demoTimer);
    }
  }, [userId, handleNewNotification]);

  return (
    <>
      {/* Connection status indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: isConnected ? '#28A745' : '#DC3545',
            color: 'white',
            zIndex: 10000
          }}
        >
          {isConnected ? 'WebSocket Connected' : 'Polling Mode'}
        </div>
      )}

      {/* Floating notifications */}
      {floatingNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${24 + index * 120}px`,
            right: '24px',
            zIndex: 9999 - index
          }}
        >
          <FloatingNotificationCard
            notification={notification}
            onAction={handleNotificationAction}
            onDismiss={dismissNotification}
            autoHideDelay={notification.type === 'error' ? 0 : 8000}
          />
        </div>
      ))}
    </>
  );
};