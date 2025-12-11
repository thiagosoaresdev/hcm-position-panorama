/**
 * Example showing how to integrate the notification service with existing controllers
 * This demonstrates the notification patterns for different scenarios
 */

import { notificationService, NotificationHelpers } from '../services/index.js';
import type { Proposta, Colaborador } from '../types/index.js';

/**
 * Example: Integrating notifications in PropostaController
 */
export class NotificationIntegrationExample {

  /**
   * Example: Send notification when proposta is created
   */
  static async handlePropostaCreated(proposta: Proposta, solicitanteNome: string, aprovadorId: string) {
    try {
      await NotificationHelpers.notifyPropostaCriada(
        proposta,
        solicitanteNome,
        aprovadorId
      );
      console.log('Proposta creation notification sent successfully');
    } catch (error) {
      console.error('Failed to send proposta creation notification:', error);
    }
  }

  /**
   * Example: Send notification when proposta is approved
   */
  static async handlePropostaApproved(proposta: Proposta, aprovadorNome: string, comentario?: string) {
    try {
      await NotificationHelpers.notifyPropostaAprovada(
        proposta,
        aprovadorNome,
        comentario
      );
      console.log('Proposta approval notification sent successfully');
    } catch (error) {
      console.error('Failed to send proposta approval notification:', error);
    }
  }

  /**
   * Example: Send notification when normalization is completed
   */
  static async handleNormalizacaoCompleted(
    postosProcessados: number,
    alteracoes: number,
    tempoExecucao: string,
    responsavelRH: string
  ) {
    try {
      await NotificationHelpers.notifyNormalizacaoConcluida(
        postosProcessados,
        alteracoes,
        tempoExecucao,
        responsavelRH
      );
      console.log('Normalization completion notification sent successfully');
    } catch (error) {
      console.error('Failed to send normalization completion notification:', error);
    }
  }

  /**
   * Example: Send PcD compliance alert
   */
  static async handlePcDComplianceAlert(
    empresaNome: string,
    pcdAtual: number,
    percentualAtual: number,
    pcdMeta: number,
    percentualMeta: number,
    responsavelRH: string,
    diretorId?: string
  ) {
    try {
      await NotificationHelpers.notifyPcDAlert(
        empresaNome,
        pcdAtual,
        percentualAtual,
        pcdMeta,
        percentualMeta,
        responsavelRH,
        diretorId
      );
      console.log('PcD compliance alert sent successfully');
    } catch (error) {
      console.error('Failed to send PcD compliance alert:', error);
    }
  }

  /**
   * Example: Send custom notification using the service directly
   */
  static async sendCustomNotification(
    templateId: string,
    recipient: string,
    variables: Record<string, any>,
    channels?: ('email' | 'sms' | 'inapp')[],
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  ) {
    try {
      const results = await notificationService.sendNotification({
        templateId,
        recipient,
        variables,
        channels,
        priority: priority || 'normal'
      });

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Custom notification sent: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        const errors = results.filter(r => !r.success).map(r => r.error);
        console.error('Notification errors:', errors);
      }

      return results;
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      throw error;
    }
  }

  /**
   * Example: Update user notification preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      inapp?: boolean;
      propostas?: boolean;
      normalizacao?: boolean;
      pcdAlerts?: boolean;
      auditoria?: boolean;
    }
  ) {
    try {
      const channels = [];
      
      if (preferences.email !== undefined) {
        channels.push({ type: 'email' as const, enabled: preferences.email });
      }
      if (preferences.sms !== undefined) {
        channels.push({ type: 'sms' as const, enabled: preferences.sms });
      }
      if (preferences.inapp !== undefined) {
        channels.push({ type: 'inapp' as const, enabled: preferences.inapp });
      }

      const updateData: any = {};
      if (channels.length > 0) updateData.channels = channels;
      if (preferences.propostas !== undefined) updateData.propostas = preferences.propostas;
      if (preferences.normalizacao !== undefined) updateData.normalizacao = preferences.normalizacao;
      if (preferences.pcdAlerts !== undefined) updateData.pcdAlerts = preferences.pcdAlerts;
      if (preferences.auditoria !== undefined) updateData.auditoria = preferences.auditoria;

      const success = await notificationService.updateUserPreferences(userId, updateData);
      
      if (success) {
        console.log('User notification preferences updated successfully');
      } else {
        console.error('Failed to update user notification preferences');
      }

      return success;
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      throw error;
    }
  }

  /**
   * Example: Test notification delivery
   */
  static async testNotificationDelivery(recipient: string, channel: 'email' | 'sms' | 'inapp') {
    try {
      const results = await notificationService.sendNotification({
        templateId: 'test_notification',
        recipient,
        variables: {
          timestamp: new Date().toISOString(),
          testMessage: 'This is a test notification from Sistema Quadro de Lotação'
        },
        channels: [channel],
        priority: 'low'
      });

      console.log('Test notification results:', results);
      return results;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Example: Send scheduled reminders (could be used in a cron job)
   */
  static async sendScheduledReminders() {
    try {
      // Example: Send reminders for pending approvals older than 2 days
      console.log('Sending scheduled reminders...');

      // This would typically query the database for pending items
      // For demonstration, we'll show the pattern

      const pendingPropostas = []; // Would be fetched from database
      const overdueNormalizations = []; // Would be fetched from database

      // Send proposta reminders
      for (const proposta of pendingPropostas) {
        // Implementation would go here
      }

      // Send normalization reminders
      for (const normalization of overdueNormalizations) {
        // Implementation would go here
      }

      console.log('Scheduled reminders sent successfully');
    } catch (error) {
      console.error('Failed to send scheduled reminders:', error);
    }
  }
}