import React, { useState, useEffect } from 'react';
import { InAppNotification } from '../../services/NotificationService.js';
import './NotificationHistory.css';

interface NotificationHistoryItem extends InAppNotification {
  id: string;
  timestamp: Date;
  read: boolean;
  archived: boolean;
}

interface NotificationHistoryProps {
  userId: string;
  onNotificationClick?: (notification: NotificationHistoryItem) => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  userId,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadNotificationHistory();
  }, [userId]);

  const loadNotificationHistory = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with localStorage
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    
    // Update localStorage
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const markAsUnread = async (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: false } : notif
      )
    );
    
    // Update localStorage
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: false } : n
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const archiveNotification = async (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, archived: true } : notif
      )
    );
    
    // Update localStorage
    const updated = notifications.map(n => 
      n.id === id ? { ...n, archived: true } : n
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Update localStorage
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const clearAll = async () => {
    setNotifications([]);
    localStorage.removeItem(`notifications_${userId}`);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Status filter
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    if (filter === 'archived' && !notification.archived) return false;
    if (filter !== 'archived' && notification.archived) return false;

    // Type filter
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return timestamp.toLocaleDateString('pt-BR');
    }
  };

  if (loading) {
    return (
      <div className="notification-history-loading">
        <div className="loading-spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="notification-history">
      <div className="notification-history-header">
        <h3>Histórico de Notificações</h3>
        <div className="notification-actions">
          {filteredNotifications.some(n => !n.read) && (
            <button onClick={markAllAsRead} className="mark-all-read-btn">
              Marcar Todas como Lidas
            </button>
          )}
          <button onClick={clearAll} className="clear-all-btn">
            Limpar Histórico
          </button>
        </div>
      </div>

      <div className="notification-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Todas</option>
            <option value="unread">Não Lidas</option>
            <option value="read">Lidas</option>
            <option value="archived">Arquivadas</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="info">Informação</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="error">Erro</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Buscar:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar notificações..."
            className="search-input"
          />
        </div>
      </div>

      <div className="notification-stats">
        <span>Total: {filteredNotifications.length}</span>
        <span>Não lidas: {filteredNotifications.filter(n => !n.read).length}</span>
        <span>Arquivadas: {notifications.filter(n => n.archived).length}</span>
      </div>

      <div className="notification-history-list">
        {paginatedNotifications.length === 0 ? (
          <div className="no-notifications">
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-history-item ${notification.type} ${
                notification.read ? 'read' : 'unread'
              } ${notification.archived ? 'archived' : ''}`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                onNotificationClick?.(notification);
              }}
            >
              <div className="notification-icon">
                {getTypeIcon(notification.type)}
              </div>
              
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

              <div className="notification-actions">
                {!notification.read ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="action-btn read-btn"
                    title="Marcar como lida"
                  >
                    👁️
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsUnread(notification.id);
                    }}
                    className="action-btn unread-btn"
                    title="Marcar como não lida"
                  >
                    👁️‍🗨️
                  </button>
                )}

                {!notification.archived && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(notification.id);
                    }}
                    className="action-btn archive-btn"
                    title="Arquivar"
                  >
                    📁
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="action-btn delete-btn"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>

              {notification.actionUrl && notification.actionText && (
                <div className="notification-action-link">
                  <a
                    href={notification.actionUrl}
                    className="action-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {notification.actionText}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};