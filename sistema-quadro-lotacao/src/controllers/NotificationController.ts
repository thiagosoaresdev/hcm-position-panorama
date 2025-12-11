import { Request, Response } from 'express';
import { notificationService, NotificationRequest, NotificationPreferences } from '../services/NotificationService.js';
import { z } from 'zod';

// Validation schemas
const sendNotificationSchema = z.object({
  templateId: z.string().min(1),
  recipient: z.string().min(1),
  variables: z.record(z.any()),
  channels: z.array(z.enum(['email', 'sms', 'inapp'])).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
});

const updatePreferencesSchema = z.object({
  channels: z.array(z.object({
    type: z.enum(['email', 'sms', 'inapp']),
    enabled: z.boolean()
  })).optional(),
  propostas: z.boolean().optional(),
  normalizacao: z.boolean().optional(),
  pcdAlerts: z.boolean().optional(),
  auditoria: z.boolean().optional()
});

/**
 * NotificationController - Handles notification-related API endpoints
 */
export class NotificationController {
  
  /**
   * Send a notification
   * POST /api/notifications/send
   */
  static async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = sendNotificationSchema.parse(req.body);
      
      const request: NotificationRequest = {
        templateId: validatedData.templateId,
        recipient: validatedData.recipient,
        variables: validatedData.variables,
        channels: validatedData.channels,
        priority: validatedData.priority || 'normal'
      };

      const results = await notificationService.sendNotification(request);
      
      const hasFailures = results.some(result => !result.success);
      
      res.status(hasFailures ? 207 : 200).json({
        success: !hasFailures,
        message: hasFailures ? 'Some notifications failed' : 'Notifications sent successfully',
        data: results
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification'
      });
    }
  }

  /**
   * Get user notification preferences
   * GET /api/notifications/preferences/:userId
   */
  static async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const preferences = await notificationService.getUserPreferences(userId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user preferences'
      });
    }
  }
  /**
   * Update user notification preferences
   * PUT /api/notifications/preferences/:userId
   */
  static async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const validatedData = updatePreferencesSchema.parse(req.body);
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const success = await notificationService.updateUserPreferences(userId, validatedData);
      
      if (success) {
        const updatedPreferences = await notificationService.getUserPreferences(userId);
        res.json({
          success: true,
          message: 'Preferences updated successfully',
          data: updatedPreferences
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update preferences'
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update preferences'
      });
    }
  }

  /**
   * Get all available notification templates
   * GET /api/notifications/templates
   */
  static async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = notificationService.getAllTemplates();
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get templates'
      });
    }
  }

  /**
   * Get a specific notification template
   * GET /api/notifications/templates/:templateId
   */
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      
      if (!templateId) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required'
        });
        return;
      }

      const template = notificationService.getTemplate(templateId);
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error getting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get template'
      });
    }
  }

  /**
   * Test notification delivery
   * POST /api/notifications/test
   */
  static async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const { recipient, channel } = req.body;
      
      if (!recipient || !channel) {
        res.status(400).json({
          success: false,
          message: 'Recipient and channel are required'
        });
        return;
      }

      const request: NotificationRequest = {
        templateId: 'test_notification',
        recipient,
        variables: {
          timestamp: new Date().toISOString(),
          testMessage: 'This is a test notification from Sistema Quadro de Lotação'
        },
        channels: [channel],
        priority: 'low'
      };

      // Add test template if not exists
      if (!notificationService.getTemplate('test_notification')) {
        notificationService.setTemplate({
          id: 'test_notification',
          name: 'Test Notification',
          subject: 'Test Notification - {{timestamp}}',
          body: '{{testMessage}}\n\nSent at: {{timestamp}}',
          variables: ['timestamp', 'testMessage'],
          channels: ['email', 'sms', 'inapp']
        });
      }

      const results = await notificationService.sendNotification(request);
      
      res.json({
        success: results.every(r => r.success),
        message: 'Test notification sent',
        data: results
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  }
}