import React, { useState, useEffect } from 'react';
import { NotificationPreferences as INotificationPreferences, NotificationChannel } from '../../services/NotificationService.js';
import './NotificationPreferences.css';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: INotificationPreferences) => void;
  onCancel?: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onSave,
  onCancel
}) => {
  const [preferences, setPreferences] = useState<INotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/preferences/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
      } else {
        setError(data.message || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load preferences');
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channelType: 'email' | 'sms' | 'inapp') => {
    if (!preferences) return;

    const updatedChannels = preferences.channels.map(channel =>
      channel.type === channelType
        ? { ...channel, enabled: !channel.enabled }
        : channel
    );

    setPreferences({
      ...preferences,
      channels: updatedChannels
    });
  };

  const handleCategoryToggle = (category: keyof Omit<INotificationPreferences, 'userId' | 'channels'>) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [category]: !preferences[category]
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channels: preferences.channels,
          propostas: preferences.propostas,
          normalizacao: preferences.normalizacao,
          pcdAlerts: preferences.pcdAlerts,
          auditoria: preferences.auditoria
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
        onSave?.(data.data);
      } else {
        setError(data.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="notification-preferences loading">
        <div className="loading-spinner"></div>
        <p>Carregando preferências...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-preferences error">
        <p className="error-message">{error}</p>
        <button onClick={loadPreferences} className="btn btn-secondary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }
  return (
    <div className="notification-preferences">
      <div className="preferences-header">
        <h3>Preferências de Notificação</h3>
        <p>Configure como você deseja receber notificações do sistema</p>
      </div>

      <div className="preferences-content">
        {/* Channels Section */}
        <div className="preferences-section">
          <h4>Canais de Notificação</h4>
          <div className="channels-grid">
            {preferences.channels.map((channel) => (
              <div key={channel.type} className="channel-item">
                <label className="channel-label">
                  <input
                    type="checkbox"
                    checked={channel.enabled}
                    onChange={() => handleChannelToggle(channel.type)}
                    className="channel-checkbox"
                  />
                  <span className="channel-name">
                    {getChannelDisplayName(channel.type)}
                  </span>
                  <span className="channel-description">
                    {getChannelDescription(channel.type)}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="preferences-section">
          <h4>Tipos de Notificação</h4>
          <div className="categories-grid">
            <div className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={preferences.propostas}
                  onChange={() => handleCategoryToggle('propostas')}
                  className="category-checkbox"
                />
                <span className="category-name">Propostas</span>
                <span className="category-description">
                  Notificações sobre criação, aprovação e rejeição de propostas
                </span>
              </label>
            </div>

            <div className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={preferences.normalizacao}
                  onChange={() => handleCategoryToggle('normalizacao')}
                  className="category-checkbox"
                />
                <span className="category-name">Normalização</span>
                <span className="category-description">
                  Notificações sobre processos de normalização do quadro
                </span>
              </label>
            </div>

            <div className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={preferences.pcdAlerts}
                  onChange={() => handleCategoryToggle('pcdAlerts')}
                  className="category-checkbox"
                />
                <span className="category-name">Alertas PcD</span>
                <span className="category-description">
                  Alertas sobre conformidade com a Lei 8.213 (PcD)
                </span>
              </label>
            </div>

            <div className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={preferences.auditoria}
                  onChange={() => handleCategoryToggle('auditoria')}
                  className="category-checkbox"
                />
                <span className="category-name">Auditoria</span>
                <span className="category-description">
                  Notificações sobre atividades de auditoria e logs
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="preferences-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={saving}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getChannelDisplayName = (type: string): string => {
  switch (type) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'inapp':
      return 'No Sistema';
    default:
      return type;
  }
};

const getChannelDescription = (type: string): string => {
  switch (type) {
    case 'email':
      return 'Receber notificações por email';
    case 'sms':
      return 'Receber notificações por SMS';
    case 'inapp':
      return 'Receber notificações dentro do sistema';
    default:
      return '';
  }
};