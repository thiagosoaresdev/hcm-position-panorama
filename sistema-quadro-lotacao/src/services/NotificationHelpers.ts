import { notificationService, NotificationRequest } from './NotificationService.js';
import { Proposta, Colaborador } from '../types/index.js';

/**
 * Helper functions for common notification scenarios
 */
export class NotificationHelpers {
  
  /**
   * Send notification when a new proposta is created
   */
  static async notifyPropostaCriada(
    proposta: Proposta,
    solicitanteNome: string,
    aprovadorId: string
  ): Promise<void> {
    const request: NotificationRequest = {
      templateId: 'proposta_criada',
      recipient: aprovadorId,
      variables: {
        descricao: proposta.descricao,
        solicitante: solicitanteNome,
        tipo: proposta.tipo,
        impactoOrcamentario: proposta.impactoOrcamentario || 'Não informado',
        actionUrl: `/propostas/${proposta.id}`
      },
      priority: 'normal'
    };

    const results = await notificationService.sendNotification(request);
    console.log('Proposta criada notification results:', results);
  }

  /**
   * Send notification when a proposta is approved
   */
  static async notifyPropostaAprovada(
    proposta: Proposta,
    aprovadorNome: string,
    comentario?: string
  ): Promise<void> {
    const request: NotificationRequest = {
      templateId: 'proposta_aprovada',
      recipient: proposta.solicitanteId,
      variables: {
        descricao: proposta.descricao,
        aprovador: aprovadorNome,
        comentario: comentario || 'Sem comentários'
      },
      priority: 'high'
    };

    const results = await notificationService.sendNotification(request);
    console.log('Proposta aprovada notification results:', results);
  }

  /**
   * Send notification when a proposta is rejected
   */
  static async notifyPropostaRejeitada(
    proposta: Proposta,
    aprovadorNome: string,
    comentario: string
  ): Promise<void> {
    const request: NotificationRequest = {
      templateId: 'proposta_rejeitada',
      recipient: proposta.solicitanteId,
      variables: {
        descricao: proposta.descricao,
        aprovador: aprovadorNome,
        comentario: comentario
      },
      priority: 'high'
    };

    const results = await notificationService.sendNotification(request);
    console.log('Proposta rejeitada notification results:', results);
  }

  /**
   * Send notification when normalization is completed
   */
  static async notifyNormalizacaoConcluida(
    postosProcessados: number,
    alteracoes: number,
    tempoExecucao: string,
    responsavelRH: string
  ): Promise<void> {
    const request: NotificationRequest = {
      templateId: 'normalizacao_concluida',
      recipient: responsavelRH,
      variables: {
        postosProcessados: postosProcessados.toString(),
        alteracoes: alteracoes.toString(),
        tempoExecucao,
        actionUrl: '/normalizacao/historico'
      },
      priority: 'normal'
    };

    const results = await notificationService.sendNotification(request);
    console.log('Normalização concluída notification results:', results);
  }
  /**
   * Send PcD compliance alert
   */
  static async notifyPcDAlert(
    empresaNome: string,
    pcdAtual: number,
    percentualAtual: number,
    pcdMeta: number,
    percentualMeta: number,
    responsavelRH: string,
    diretorId?: string
  ): Promise<void> {
    const deficit = pcdMeta - pcdAtual;
    
    const request: NotificationRequest = {
      templateId: 'pcd_alerta',
      recipient: responsavelRH,
      variables: {
        empresa: empresaNome,
        pcdAtual: pcdAtual.toString(),
        percentualAtual: percentualAtual.toFixed(1),
        pcdMeta: pcdMeta.toString(),
        percentualMeta: percentualMeta.toFixed(1),
        deficit: deficit.toString()
      },
      priority: 'urgent'
    };

    const results = await notificationService.sendNotification(request);
    console.log('PcD alert notification results:', results);

    // Also notify director if provided
    if (diretorId) {
      const directorRequest: NotificationRequest = {
        ...request,
        recipient: diretorId
      };
      
      const directorResults = await notificationService.sendNotification(directorRequest);
      console.log('PcD alert director notification results:', directorResults);
    }
  }

  /**
   * Send notification for colaborador admission
   */
  static async notifyColaboradorAdmitido(
    colaborador: Colaborador,
    responsavelRH: string,
    supervisorId?: string
  ): Promise<void> {
    const request: NotificationRequest = {
      templateId: 'colaborador_admitido',
      recipient: responsavelRH,
      variables: {
        colaboradorNome: colaborador.nome,
        cargo: colaborador.cargoId,
        centroCusto: colaborador.centroCustoId,
        dataAdmissao: colaborador.dataAdmissao.toLocaleDateString('pt-BR'),
        pcd: colaborador.pcd ? 'Sim' : 'Não'
      },
      priority: 'normal'
    };

    // Add template if not exists
    if (!notificationService.getTemplate('colaborador_admitido')) {
      notificationService.setTemplate({
        id: 'colaborador_admitido',
        name: 'Colaborador Admitido',
        subject: 'Novo colaborador admitido: {{colaboradorNome}}',
        body: 'Um novo colaborador foi admitido no sistema.\n\nNome: {{colaboradorNome}}\nCargo: {{cargo}}\nCentro de Custo: {{centroCusto}}\nData de Admissão: {{dataAdmissao}}\nPcD: {{pcd}}\n\nO quadro efetivo foi atualizado automaticamente.',
        variables: ['colaboradorNome', 'cargo', 'centroCusto', 'dataAdmissao', 'pcd'],
        channels: ['email', 'inapp']
      });
    }

    const results = await notificationService.sendNotification(request);
    console.log('Colaborador admitido notification results:', results);

    // Also notify supervisor if provided
    if (supervisorId) {
      const supervisorRequest: NotificationRequest = {
        ...request,
        recipient: supervisorId
      };
      
      const supervisorResults = await notificationService.sendNotification(supervisorRequest);
      console.log('Colaborador admitido supervisor notification results:', supervisorResults);
    }
  }

  /**
   * Send bulk notifications to multiple recipients
   */
  static async sendBulkNotifications(
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    const promises = recipients.map(recipient => {
      const request: NotificationRequest = {
        templateId,
        recipient,
        variables,
        priority
      };
      
      return notificationService.sendNotification(request);
    });

    const results = await Promise.all(promises);
    console.log(`Bulk notifications sent to ${recipients.length} recipients:`, results);
  }
}