import React from 'react';
import { ActivityItem } from '../../services/DashboardService.js';
import './ActivityTimeline.css';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities, 
  maxItems = 10,
  onViewAll 
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'vaga_criada':
        return '➕';
      case 'proposta_aprovada':
        return '✅';
      case 'normalizacao':
        return '🔄';
      case 'pcd_alert':
        return '⚠️';
      case 'colaborador_admitido':
        return '👤';
      default:
        return '📋';
    }
  };

  const getStatusClass = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'activity-timeline__item--success';
      case 'warning':
        return 'activity-timeline__item--warning';
      case 'error':
        return 'activity-timeline__item--error';
      case 'info':
      default:
        return 'activity-timeline__item--info';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return timestamp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (displayedActivities.length === 0) {
    return (
      <div className="activity-timeline activity-timeline--empty">
        <div className="activity-timeline__empty-state">
          <div className="activity-timeline__empty-icon">📋</div>
          <h3 className="activity-timeline__empty-title">
            Nenhuma atividade recente
          </h3>
          <p className="activity-timeline__empty-description">
            As atividades do sistema aparecerão aqui quando ocorrerem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      <div className="activity-timeline__header">
        <h3 className="activity-timeline__title">Atividades Recentes</h3>
        {onViewAll && activities.length > maxItems && (
          <button 
            className="activity-timeline__view-all"
            onClick={onViewAll}
          >
            Ver todas ({activities.length})
          </button>
        )}
      </div>

      <div className="activity-timeline__list">
        {displayedActivities.map((activity, index) => (
          <div 
            key={activity.id}
            className={`activity-timeline__item ${getStatusClass(activity.status)}`}
          >
            <div className="activity-timeline__item-icon">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="activity-timeline__item-content">
              <div className="activity-timeline__item-header">
                <h4 className="activity-timeline__item-title">
                  {activity.title}
                </h4>
                <span className="activity-timeline__item-time">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              
              <p className="activity-timeline__item-description">
                {activity.description}
              </p>
              
              {activity.user && (
                <div className="activity-timeline__item-user">
                  <span className="activity-timeline__item-user-label">Por:</span>
                  <span className="activity-timeline__item-user-name">
                    {activity.user}
                  </span>
                </div>
              )}
            </div>
            
            <div className="activity-timeline__item-connector" />
          </div>
        ))}
      </div>

      {activities.length > displayedActivities.length && (
        <div className="activity-timeline__footer">
          <p className="activity-timeline__more-count">
            +{activities.length - displayedActivities.length} atividades mais antigas
          </p>
          {onViewAll && (
            <button 
              className="activity-timeline__view-all-footer"
              onClick={onViewAll}
            >
              Ver histórico completo
            </button>
          )}
        </div>
      )}
    </div>
  );
};