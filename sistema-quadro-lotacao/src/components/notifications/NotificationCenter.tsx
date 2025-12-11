import React, { useState } from 'react';
import { InAppNotifications } from './InAppNotifications.js';
import { NotificationPreferences } from './NotificationPreferences.js';
import { RealTimeNotificationManager } from './RealTimeNotificationManager.js';
import type { InAppNotification } from '../../services/NotificationService.js';
import './NotificationCenter.css';

interface NotificationCenterProps {
  userId: string;
  enableRealTime?: boolean;
  showPreferences?: boolean;
  maxFloatingNotifications?: number;
  onNotificationAction?: (action: string, notificationId: string, notification: any) => void;
}

interface NotificationWithId extends InAppNotification {
  id: string;
  timestamp: Date;
  read?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  enableRealTime = true,
  showPreferences = true,
  maxFloatingNotifications = 3,
  onNotificationAction
}) => {
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const handleNotificationReceived = (notification: NotificationWithId) => {
    console.log('New notification received:', notification);
    
    // You can add custom logic here for specific notification types
    if (notification.type === 'error') {
      // Log critical errors
      console.error('Critical notification:', notification);
    }
  };

  const handleNotificationClick = (notification: NotificationWithId) => {
    console.log('Notification clicked:', notification);
    
    // Handle navigation or custom actions
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleNotificationAction = (action: string, notificationId: string, notification: NotificationWithId) => {
    console.log('Notification action:', action, notificationId);
    
    // Handle custom actions
    onNotificationAction?.(action, notificationId, notification);
  };

  return (
    <div className="notification-center">
      {/* Real-time notification manager */}
      {enableRealTime && (
        <RealTimeNotificationManager
          userId={userId}
          maxFloatingNotifications={maxFloatingNotifications}
          onNotificationReceived={handleNotificationReceived}
          onNotificationAction={handleNotificationAction}
        />
      )}

      {/* Notification bell and dropdown */}
      <div className="notification-center-container">
        <InAppNotifications
          userId={userId}
          showHistory={true}
          onNotificationClick={handleNotificationClick}
        />
        
        {showPreferences && (
          <button
            className="preferences-btn"
            onClick={() => setShowPreferencesModal(true)}
            title="Configurações de Notificação"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* Preferences modal */}
      {showPreferencesModal && (
        <div className="preferences-modal-overlay">
          <div className="preferences-modal">
            <div className="preferences-modal-header">
              <h3>Configurações de Notificação</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowPreferencesModal(false)}
              >
                ×
              </button>
            </div>
            <div className="preferences-modal-body">
              <NotificationPreferences
                userId={userId}
                onSave={() => setShowPreferencesModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};