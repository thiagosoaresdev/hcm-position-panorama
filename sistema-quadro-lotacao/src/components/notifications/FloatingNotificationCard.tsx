import React, { useState, useEffect } from 'react';
import { InAppNotification } from '../../services/NotificationService.js';
import './FloatingNotificationCard.css';

interface FloatingNotificationCardProps {
  notification: InAppNotification & { id: string; timestamp: Date };
  onAction?: (action: string, notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const FloatingNotificationCard: React.FC<FloatingNotificationCardProps> = ({
  notification,
  onAction,
  onDismiss,
  autoHideDelay = 8000,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after delay
    let autoHideTimer: NodeJS.Timeout;
    if (autoHideDelay > 0) {
      autoHideTimer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);
    }

    return () => {
      clearTimeout(timer);
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [autoHideDelay]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleAction = (action: string) => {
    onAction?.(action, notification.id);
    handleDismiss();
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    // Primary action from notification
    if (notification.actionUrl && notification.actionText) {
      buttons.push({
        text: notification.actionText,
        action: 'primary',
        url: notification.actionUrl,
        primary: true
      });
    }

    // Context-specific actions based on notification data
    if (notification.data) {
      const { type: dataType, propostaId, normalizacaoId } = notification.data;

      switch (dataType) {
        case 'proposta_pendente':
          buttons.push(
            {
              text: 'Aprovar',
              action: 'approve',
              primary: true,
              style: 'success'
            },
            {
              text: 'Rejeitar',
              action: 'reject',
              style: 'danger'
            },
            {
              text: 'Ver Detalhes',
              action: 'view',
              url: `/propostas/${propostaId}`
            }
          );
          break;

        case 'normalizacao_concluida':
          buttons.push(
            {
              text: 'Ver Relatório',
              action: 'view_report',
              url: `/normalizacao/relatorio/${normalizacaoId}`,
              primary: true
            }
          );
          break;

        case 'pcd_alerta':
          buttons.push(
            {
              text: 'Ver Dashboard PcD',
              action: 'view_pcd',
              url: '/analytics/pcd',
              primary: true
            },
            {
              text: 'Criar Vaga PcD',
              action: 'create_pcd_vaga',
              url: '/quadro/nova-vaga?pcd=true'
            }
          );
          break;

        case 'auditoria':
          buttons.push(
            {
              text: 'Ver Auditoria',
              action: 'view_audit',
              url: '/auditoria',
              primary: true
            }
          );
          break;
      }
    }

    // Always add dismiss action
    buttons.push({
      text: 'Dispensar',
      action: 'dismiss',
      style: 'secondary'
    });

    return buttons;
  };

  const actionButtons = getActionButtons();

  return (
    <div 
      className={`floating-notification-card ${notification.type} ${position} ${
        isVisible ? 'visible' : ''
      } ${isExiting ? 'exiting' : ''}`}
    >
      <div className="notification-card-header">
        <div className="notification-icon">
          {getTypeIcon()}
        </div>
        <div className="notification-title">
          {notification.title}
        </div>
        <button 
          className="close-btn"
          onClick={handleDismiss}
          aria-label="Fechar notificação"
        >
          ×
        </button>
      </div>

      <div className="notification-card-body">
        <div className="notification-message">
          {notification.message}
        </div>
        
        <div className="notification-timestamp">
          {notification.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {actionButtons.length > 0 && (
        <div className="notification-card-actions">
          {actionButtons.map((button, index) => (
            <button
              key={index}
              className={`action-btn ${button.style || 'default'} ${
                button.primary ? 'primary' : ''
              }`}
              onClick={() => {
                if (button.url) {
                  window.location.href = button.url;
                } else {
                  handleAction(button.action);
                }
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar for auto-hide */}
      {autoHideDelay > 0 && (
        <div className="auto-hide-progress">
          <div 
            className="progress-bar"
            style={{
              animationDuration: `${autoHideDelay}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};