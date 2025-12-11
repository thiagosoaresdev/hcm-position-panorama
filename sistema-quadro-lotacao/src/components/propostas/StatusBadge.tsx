import React from 'react';
import type { PropostaStatus } from '../../types/index.js';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: PropostaStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = (status: PropostaStatus) => {
    const configs = {
      'rascunho': {
        label: 'Rascunho',
        icon: '📝',
        variant: 'draft'
      },
      'nivel_1': {
        label: 'Nível 1',
        icon: '⏳',
        variant: 'pending'
      },
      'nivel_2': {
        label: 'Nível 2',
        icon: '⏳',
        variant: 'pending'
      },
      'nivel_3': {
        label: 'Nível 3',
        icon: '⏳',
        variant: 'pending'
      },
      'rh': {
        label: 'RH',
        icon: '⏳',
        variant: 'pending'
      },
      'aprovada': {
        label: 'Aprovada',
        icon: '✅',
        variant: 'approved'
      },
      'rejeitada': {
        label: 'Rejeitada',
        icon: '❌',
        variant: 'rejected'
      }
    };

    return configs[status] || configs['rascunho'];
  };

  const config = getStatusConfig(status);

  const getProgressPercentage = (status: PropostaStatus): number => {
    const progressMap: Record<PropostaStatus, number> = {
      'rascunho': 0,
      'nivel_1': 25,
      'nivel_2': 50,
      'nivel_3': 75,
      'rh': 90,
      'aprovada': 100,
      'rejeitada': 0
    };
    return progressMap[status];
  };

  const isPending = ['nivel_1', 'nivel_2', 'nivel_3', 'rh'].includes(status);
  const progress = getProgressPercentage(status);

  return (
    <div 
      className={`status-badge status-badge--${config.variant} status-badge--${size} ${className}`}
      title={`Status: ${config.label}${isPending ? ` (${progress}% concluído)` : ''}`}
    >
      {showIcon && (
        <span className="status-badge__icon">
          {config.icon}
        </span>
      )}
      <span className="status-badge__label">
        {config.label}
      </span>
      {isPending && (
        <div className="status-badge__progress">
          <div 
            className="status-badge__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};