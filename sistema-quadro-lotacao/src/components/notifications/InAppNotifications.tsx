import React, { useState, useEffect, useCallback } from 'react';
import type { InAppNotification } from '../../services/NotificationService.js';
import { NotificationHistory } from './NotificationHistory.js';
import './InAppNotifications.css';

interface InAppNotificationsProps {
  userId: string;
  maxVisible?: number;
  showHistory?: boolean;
  onNotificationClick?: (notification: NotificationWithId) => void;
}

interface NotificationWithId extends InAppNotification {
  id: string;
  timestamp: Date;
  read: boolean;
}

export const InAppNotifications: React.FC<InAppNotificationsProps> = ({
  userId,
  maxVisible = 5,
  showHistory = false,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'history'>('recent');

  // Load notifications from localStorage on mount
  useEffect(() => {
    loadRecentNotifications();
    
    // Listen for storage changes (notifications from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `notifications_${userId}`) {
        loadRecentNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  const loadRecentNotifications = useCallback(() => {
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const recent = parsed
          .slice(0, maxVisible)
          .map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
        setNotifications(recent);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [userId, maxVisible]);

  // addNotification is now handled by RealTimeNotificationManager

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    
    // Update localStorage
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map((n: any) => 
          n.id === id ? { ...n, read: true } : n
        );
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    // Clear from localStorage as well
    localStorage.removeItem(`notifications_${userId}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h4>Notificações</h4>
            <div className="notification-header-actions">
              {showHistory && (
                <div className="notification-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recent')}
                  >
                    Recentes
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    Histórico
                  </button>
                </div>
              )}
              {activeTab === 'recent' && notifications.length > 0 && (
                <button onClick={clearAll} className="clear-all-btn">
                  Limpar Todas
                </button>
              )}
            </div>
          </div>

          {activeTab === 'recent' ? (
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <p>Nenhuma notificação recente</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      markAsRead(notification.id);
                      onNotificationClick?.(notification);
                    }}
                  >
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-timestamp">
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>
                    
                    {notification.actionUrl && notification.actionText && (
                      <div className="notification-action">
                        <a
                          href={notification.actionUrl}
                          className="action-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.actionText}
                        </a>
                      </div>
                    )}

                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="notification-history-container">
              <NotificationHistory 
                userId={userId}
                onNotificationClick={(notification) => {
                  onNotificationClick?.(notification);
                  setIsOpen(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'Agora';
  } else if (minutes < 60) {
    return `${minutes}m atrás`;
  } else if (hours < 24) {
    return `${hours}h atrás`;
  } else if (days < 7) {
    return `${days}d atrás`;
  } else {
    return timestamp.toLocaleDateString('pt-BR');
  }
};