import React from 'react';
import { DashboardAlert } from '../../services/DashboardService.js';
import './AlertCard.css';

interface AlertCardProps {
  alert: DashboardAlert;
  onActionClick?: (action: string, url?: string) => void;
  onDismiss?: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ 
  alert, 
  onActionClick, 
  onDismiss 
}) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getAlertClass = () => {
    switch (alert.type) {
      case 'critical':
        return 'alert-card--critical';
      case 'warning':
        return 'alert-card--warning';
      case 'info':
        return 'alert-card--info';
      case 'success':
        return 'alert-card--success';
      default:
        return 'alert-card--info';
    }
  };

  const getPriorityClass = () => {
    switch (alert.priority) {
      case 'high':
        return 'alert-card--high-priority';
      case 'medium':
        return 'alert-card--medium-priority';
      case 'low':
        return 'alert-card--low-priority';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    
    return timestamp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleActionClick = (action: string, url?: string) => {
    if (onActionClick) {
      onActionClick(action, url);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(alert.id);
    }
  };

  return (
    <div className={`alert-card ${getAlertClass()} ${getPriorityClass()}`}>
      <div className="alert-card__header">
        <div className="alert-card__icon">
          {getAlertIcon()}
        </div>
        <div className="alert-card__title-section">
          <h4 className="alert-card__title">{alert.title}</h4>
          <span className="alert-card__timestamp">
            {formatTimestamp(alert.timestamp)}
          </span>
        </div>
        {onDismiss && (
          <button 
            className="alert-card__dismiss"
            onClick={handleDismiss}
            aria-label="Dispensar alerta"
          >
            ✕
          </button>
        )}
      </div>

      <div className="alert-card__content">
        <p className="alert-card__message">{alert.message}</p>
        
        {alert.actions && alert.actions.length > 0 && (
          <div className="alert-card__actions">
            {alert.actions.map((action, index) => (
              <button
                key={index}
                className="alert-card__action-button"
                onClick={() => handleActionClick(action.action, action.url)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="alert-card__priority-indicator" />
    </div>
  );
};