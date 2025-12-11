import React from 'react';
import { KPIData } from '../../services/DashboardService.js';
import './KPICard.css';

interface KPICardProps {
  kpi: KPIData;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, onClick }) => {
  const getTrendIcon = () => {
    if (!kpi.trend) return null;
    
    switch (kpi.trend.direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return null;
    }
  };

  const getTrendClass = () => {
    if (!kpi.trend) return '';
    
    switch (kpi.trend.direction) {
      case 'up':
        return 'kpi-card__trend--up';
      case 'down':
        return 'kpi-card__trend--down';
      case 'stable':
        return 'kpi-card__trend--stable';
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    switch (kpi.status) {
      case 'success':
        return 'kpi-card--success';
      case 'warning':
        return 'kpi-card--warning';
      case 'error':
        return 'kpi-card--error';
      case 'info':
      default:
        return 'kpi-card--info';
    }
  };

  const getIcon = () => {
    if (kpi.icon) {
      // Map icon names to emoji or use a proper icon library
      const iconMap: Record<string, string> = {
        'users': '👥',
        'dollar-sign': '💰',
        'accessibility': '♿',
        'heart': '❤️',
        'star': '⭐',
        'alert-circle': '⚠️',
        'trending-up': '📈',
        'trending-down': '📉'
      };
      return iconMap[kpi.icon] || '📊';
    }
    return '📊';
  };

  return (
    <div 
      className={`kpi-card ${getStatusClass()} ${onClick ? 'kpi-card--clickable' : ''}`}
      onClick={onClick}
      style={{ '--kpi-color': kpi.color } as React.CSSProperties}
    >
      <div className="kpi-card__header">
        <div className="kpi-card__icon">
          {getIcon()}
        </div>
        <h3 className="kpi-card__title">{kpi.title}</h3>
      </div>
      
      <div className="kpi-card__content">
        <div className="kpi-card__value">
          {kpi.value}
        </div>
        <div className="kpi-card__label">
          {kpi.label}
        </div>
        
        {kpi.trend && (
          <div className={`kpi-card__trend ${getTrendClass()}`}>
            <span className="kpi-card__trend-icon">
              {getTrendIcon()}
            </span>
            <span className="kpi-card__trend-value">
              {kpi.trend.percentage.toFixed(1)}%
            </span>
            <span className="kpi-card__trend-period">
              {kpi.trend.period}
            </span>
          </div>
        )}
      </div>
      
      <div className="kpi-card__status-indicator" />
    </div>
  );
};