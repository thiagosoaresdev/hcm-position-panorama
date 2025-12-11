import { PropostaService, type CreatePropostaRequest, type ApprovalRequest, type RejectionRequest } from './PropostaService.js';
import { NotificationHelpers } from './NotificationHelpers.js';
import { PropostaModel } from '../models/Proposta.js';
import type { WorkflowConfig } from '../types/index.js';

/**
 * Enhanced PropostaService with notification integration
 * Extends the base PropostaService to add notification capabilities
 */
export class PropostaServiceWithNotifications extends PropostaService {

  /**
   * Create proposta and send notification to first approver
   */
  async createProposta(
    request: CreatePropostaRequest,
    workflowConfig: WorkflowConfig,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    // Create proposta using parent method
    const proposta = await super.createProposta(request, auditContext);

    try {
      // Send notification to first approver
      const firstLevel = workflowConfig.niveis.find(n => n.ordem === 1);
      if (firstLevel && firstLevel.aprovadores.length > 0) {
        // Send notification to all first level approvers
        for (const aprovadorId of firstLevel.aprovadores) {
          await NotificationHelpers.notifyPropostaCriada(
            proposta.toJSON(),
            auditContext.userName,
            aprovadorId
          );
        }
      }
    } catch (error) {
      console.error('Failed to send proposta creation notification:', error);
      // Don't fail the operation if notification fails
    }

    return proposta;
  }

  /**
   * Submit proposta for approval and notify first level approvers
   */
  async submitProposta(
    id: string,
    workflowConfig: WorkflowConfig,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    // Submit proposta using parent method
    const proposta = await super.submitProposta(id, workflowConfig, auditContext);

    try {
      // Send notification to first level approvers
      const firstLevel = workflowConfig.niveis.find(n => n.ordem === 1);
      if (firstLevel && firstLevel.aprovadores.length > 0) {
        for (const aprovadorId of firstLevel.aprovadores) {
          await NotificationHelpers.notifyPropostaCriada(
            proposta.toJSON(),
            auditContext.userName,
            aprovadorId
          );
        }
      }
    } catch (error) {
      console.error('Failed to send proposta submission notification:', error);
    }

    return proposta;
  }

  /**
   * Approve proposta and send notifications
   */
  async approveProposta(
    id: string,
    request: ApprovalRequest,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    // Get proposta before approval to check status
    const propostaBeforeApproval = await this.getPropostaById(id);
    if (!propostaBeforeApproval) {
      throw new Error('Proposta não encontrada');
    }

    // Approve proposta using parent method
    const proposta = await super.approveProposta(id, request, auditContext);

    try {
      if (proposta.status === 'aprovada') {
        // Proposta fully approved - notify requester
        await NotificationHelpers.notifyPropostaAprovada(
          proposta.toJSON(),
          auditContext.userName,
          request.comentario
        );
      } else {
        // Proposta moved to next level - notify next approvers
        await this.notifyNextLevelApprovers(proposta, auditContext.userName);
      }
    } catch (error) {
      console.error('Failed to send proposta approval notification:', error);
    }

    return proposta;
  }

  /**
   * Reject proposta and send notification
   */
  async rejectProposta(
    id: string,
    request: RejectionRequest,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    // Reject proposta using parent method
    const proposta = await super.rejectProposta(id, request, auditContext);

    try {
      // Notify requester about rejection
      await NotificationHelpers.notifyPropostaRejeitada(
        proposta.toJSON(),
        auditContext.userName,
        request.comentario
      );
    } catch (error) {
      console.error('Failed to send proposta rejection notification:', error);
    }

    return proposta;
  }
  /**
   * Notify next level approvers
   */
  private async notifyNextLevelApprovers(proposta: PropostaModel, approverName: string): Promise<void> {
    try {
      const currentLevel = proposta.getCurrentApprovalLevel();
      const nextLevel = currentLevel + 1;

      // Get next level approvers from workflow
      // Note: In a real implementation, you would get this from the workflow configuration
      // For now, we'll use a placeholder approach
      const nextLevelApprovers = await this.getApproversForLevel(proposta.id, nextLevel);

      for (const aprovadorId of nextLevelApprovers) {
        await NotificationHelpers.notifyPropostaCriada(
          proposta.toJSON(),
          approverName,
          aprovadorId
        );
      }
    } catch (error) {
      console.error('Failed to notify next level approvers:', error);
    }
  }

  /**
   * Get approvers for a specific level
   * This is a placeholder - in real implementation, this would query the workflow configuration
   */
  private async getApproversForLevel(propostaId: string, level: number): Promise<string[]> {
    // Placeholder implementation
    // In real app, this would query the aprovacao table or workflow configuration
    const aprovacoes = await this.aprovacaoRepository.findByPropostaAndNivel(propostaId, level);
    return aprovacoes ? [aprovacoes.aprovadorId] : [];
  }

  /**
   * Send bulk notifications for multiple propostas
   */
  async notifyBulkPropostaStatus(
    propostaIds: string[],
    templateId: string,
    variables: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    try {
      const propostas = await Promise.all(
        propostaIds.map(id => this.getPropostaById(id))
      );

      const validPropostas = propostas.filter(p => p !== null);
      const recipients = [...new Set(validPropostas.map(p => p!.solicitanteId))];

      await NotificationHelpers.sendBulkNotifications(
        templateId,
        recipients,
        variables,
        priority
      );
    } catch (error) {
      console.error('Failed to send bulk proposta notifications:', error);
    }
  }

  /**
   * Send reminder notifications for pending approvals
   */
  async sendPendingApprovalReminders(): Promise<void> {
    try {
      // Get all propostas with pending approvals
      const pendingPropostas = await this.getPropostasByStatus(['nivel_1', 'nivel_2', 'nivel_3', 'rh']);

      for (const proposta of pendingPropostas) {
        const currentLevel = proposta.getCurrentApprovalLevel();
        const approvers = await this.getApproversForLevel(proposta.id, currentLevel);

        for (const aprovadorId of approvers) {
          await NotificationHelpers.notifyPropostaCriada(
            proposta.toJSON(),
            'Sistema',
            aprovadorId
          );
        }
      }
    } catch (error) {
      console.error('Failed to send pending approval reminders:', error);
    }
  }

  /**
   * Send notification when proposta deadline is approaching
   */
  async sendDeadlineReminders(daysBeforeDeadline: number = 2): Promise<void> {
    try {
      // This would typically query propostas that are approaching their deadline
      // For now, this is a placeholder implementation
      const propostas = await this.getPropostasNearDeadline(daysBeforeDeadline);

      for (const proposta of propostas) {
        const currentLevel = proposta.getCurrentApprovalLevel();
        const approvers = await this.getApproversForLevel(proposta.id, currentLevel);

        const variables = {
          descricao: proposta.descricao,
          diasRestantes: daysBeforeDeadline.toString(),
          actionUrl: `/propostas/${proposta.id}`
        };

        for (const aprovadorId of approvers) {
          // Use a custom template for deadline reminders
          await NotificationHelpers.sendBulkNotifications(
            'proposta_deadline_reminder',
            [aprovadorId],
            variables,
            'high'
          );
        }
      }
    } catch (error) {
      console.error('Failed to send deadline reminders:', error);
    }
  }

  /**
   * Get propostas near deadline (placeholder implementation)
   */
  private async getPropostasNearDeadline(days: number): Promise<PropostaModel[]> {
    // Placeholder - in real implementation, this would query based on creation date + SLA
    return [];
  }
}