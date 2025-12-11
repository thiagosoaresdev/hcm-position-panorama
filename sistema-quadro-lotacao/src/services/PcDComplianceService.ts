import { ColaboradorModel } from '../models/Colaborador.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';

export interface PcDComplianceData {
  empresaId: string;
  totalColaboradores: number;
  totalPcD: number;
  percentualAtual: number;
  percentualObrigatorio: number;
  quantidadeObrigatoria: number;
  deficit: number;
  conforme: boolean;
  faixaLei: string;
}

export interface PcDAlert {
  empresaId: string;
  tipo: 'deficit' | 'conformidade' | 'risco';
  mensagem: string;
  acoesSugeridas: string[];
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  dataDeteccao: Date;
}

export interface PcDReport {
  empresaId: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  compliance: PcDComplianceData;
  historico: PcDComplianceData[];
  alertas: PcDAlert[];
  recomendacoes: string[];
  geradoEm: Date;
}

export class PcDComplianceService {
  constructor(
    private auditService: AuditService,
    private notificationService: NotificationService
  ) {}

  /**
   * Calcula conformidade PcD conforme Lei 8.213
   * 2% para 50-200, 3% para 201-500, 4% para 501-1000, 5% para >1000 colaboradores
   */
  async calculateCompliance(empresaId: string, colaboradores: ColaboradorModel[]): Promise<PcDComplianceData> {
    const colaboradoresAtivos = colaboradores.filter(c => c.isActive());
    const totalColaboradores = colaboradoresAtivos.length;
    const totalPcD = colaboradoresAtivos.filter(c => c.isPcD()).length;

    // Aplicar percentuais conforme Lei 8.213
    const percentualObrigatorio = this.getPercentualObrigatorio(totalColaboradores);
    const quantidadeObrigatoria = this.calculateQuantidadeObrigatoria(totalColaboradores, percentualObrigatorio);
    const percentualAtual = totalColaboradores > 0 ? (totalPcD / totalColaboradores) * 100 : 0;
    const deficit = Math.max(0, quantidadeObrigatoria - totalPcD);
    const conforme = totalPcD >= quantidadeObrigatoria;
    const faixaLei = this.getFaixaLei(totalColaboradores);

    const complianceData: PcDComplianceData = {
      empresaId,
      totalColaboradores,
      totalPcD,
      percentualAtual,
      percentualObrigatorio,
      quantidadeObrigatoria,
      deficit,
      conforme,
      faixaLei
    };

    // Registrar auditoria
    await this.auditService.logAction({
      entidadeId: empresaId,
      entidadeTipo: 'empresa',
      acao: 'calculo_pcd',
      usuarioId: 'sistema',
      usuarioNome: 'Sistema PcD',
      motivo: 'Cálculo automático de conformidade PcD',
      valoresDepois: complianceData,
      timestamp: new Date()
    });

    return complianceData;
  }

  /**
   * Retorna percentual obrigatório conforme Lei 8.213
   */
  private getPercentualObrigatorio(totalColaboradores: number): number {
    if (totalColaboradores < 50) return 0;
    if (totalColaboradores <= 200) return 2;
    if (totalColaboradores <= 500) return 3;
    if (totalColaboradores <= 1000) return 4;
    return 5;
  }

  /**
   * Calcula quantidade obrigatória com arredondamento para cima
   */
  private calculateQuantidadeObrigatoria(totalColaboradores: number, percentual: number): number {
    if (percentual === 0) return 0;
    return Math.ceil((totalColaboradores * percentual) / 100);
  }

  /**
   * Retorna faixa da Lei 8.213 aplicável
   */
  private getFaixaLei(totalColaboradores: number): string {
    if (totalColaboradores < 50) return 'Não aplicável (< 50 colaboradores)';
    if (totalColaboradores <= 200) return '50-200 colaboradores (2%)';
    if (totalColaboradores <= 500) return '201-500 colaboradores (3%)';
    if (totalColaboradores <= 1000) return '501-1000 colaboradores (4%)';
    return '>1000 colaboradores (5%)';
  }

  /**
   * Monitora conformidade e gera alertas
   */
  async monitorCompliance(empresaId: string, colaboradores: ColaboradorModel[]): Promise<PcDAlert[]> {
    const compliance = await this.calculateCompliance(empresaId, colaboradores);
    const alertas: PcDAlert[] = [];

    // Alerta de déficit crítico
    if (!compliance.conforme && compliance.deficit > 0) {
      const percentualDeficit = (compliance.deficit / compliance.quantidadeObrigatoria) * 100;
      
      let prioridade: 'baixa' | 'media' | 'alta' | 'critica' = 'media';
      if (percentualDeficit >= 50) prioridade = 'critica';
      else if (percentualDeficit >= 25) prioridade = 'alta';

      alertas.push({
        empresaId,
        tipo: 'deficit',
        mensagem: `Déficit de ${compliance.deficit} colaboradores PcD. Percentual atual: ${compliance.percentualAtual.toFixed(1)}%, obrigatório: ${compliance.percentualObrigatorio}%`,
        acoesSugeridas: [
          'Priorizar contratação de pessoas com deficiência',
          'Revisar processos seletivos para inclusão',
          'Contactar organizações especializadas em PcD',
          'Avaliar adequação de postos de trabalho'
        ],
        prioridade,
        dataDeteccao: new Date()
      });
    }

    // Alerta de risco (próximo ao limite)
    if (compliance.conforme && compliance.deficit === 0) {
      const margem = compliance.totalPcD - compliance.quantidadeObrigatoria;
      if (margem <= 2) {
        alertas.push({
          empresaId,
          tipo: 'risco',
          mensagem: `Conformidade PcD em risco. Margem de apenas ${margem} colaborador(es) acima do mínimo obrigatório`,
          acoesSugeridas: [
            'Manter atenção em desligamentos de PcD',
            'Planejar contratações futuras considerando PcD',
            'Implementar programa de retenção para PcD'
          ],
          prioridade: 'media',
          dataDeteccao: new Date()
        });
      }
    }

    // Alerta de conformidade (positivo)
    if (compliance.conforme && compliance.deficit === 0) {
      alertas.push({
        empresaId,
        tipo: 'conformidade',
        mensagem: `Empresa em conformidade com Lei 8.213. ${compliance.totalPcD} PcD de ${compliance.quantidadeObrigatoria} obrigatórios`,
        acoesSugeridas: [
          'Manter programas de inclusão',
          'Continuar monitoramento regular',
          'Compartilhar boas práticas'
        ],
        prioridade: 'baixa',
        dataDeteccao: new Date()
      });
    }

    // Enviar notificações para alertas críticos
    for (const alerta of alertas) {
      if (alerta.prioridade === 'critica' || alerta.prioridade === 'alta') {
        await this.sendComplianceAlert(alerta);
      }
    }

    return alertas;
  }

  /**
   * Envia notificação de alerta PcD
   */
  private async sendComplianceAlert(alerta: PcDAlert): Promise<void> {
    try {
      // Notificar RH e Diretor conforme requirement 7.4
      const recipients = ['rh@empresa.com', 'diretor@empresa.com']; // Em produção, buscar da configuração

      for (const recipient of recipients) {
        await this.notificationService.sendEmail({
          recipient,
          template: 'pcd_alert',
          subject: `Alerta PcD - ${alerta.tipo.toUpperCase()}`,
          variables: {
            tipo: alerta.tipo,
            mensagem: alerta.mensagem,
            acoesSugeridas: alerta.acoesSugeridas,
            prioridade: alerta.prioridade,
            dataDeteccao: alerta.dataDeteccao.toISOString()
          },
          priority: alerta.prioridade === 'critica' ? 'high' : 'normal'
        });

        await this.notificationService.sendInApp({
          userId: recipient,
          title: `Alerta PcD - ${alerta.tipo}`,
          message: alerta.mensagem,
          type: alerta.prioridade === 'critica' ? 'error' : 'warning',
          actions: alerta.acoesSugeridas.map(acao => ({
            label: acao,
            action: 'view_pcd_dashboard'
          }))
        });
      }
    } catch (error) {
      console.error('Erro ao enviar alerta PcD:', error);
      // Registrar erro na auditoria
      await this.auditService.logAction({
        entidadeId: alerta.empresaId,
        entidadeTipo: 'empresa',
        acao: 'erro_notificacao_pcd',
        usuarioId: 'sistema',
        usuarioNome: 'Sistema PcD',
        motivo: 'Erro ao enviar notificação de alerta PcD',
        valoresAntes: { alerta },
        valoresDepois: { error: error.message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Gera relatório completo de conformidade PcD
   */
  async generateComplianceReport(
    empresaId: string, 
    colaboradores: ColaboradorModel[],
    periodoInicio: Date,
    periodoFim: Date
  ): Promise<PcDReport> {
    const compliance = await this.calculateCompliance(empresaId, colaboradores);
    const alertas = await this.monitorCompliance(empresaId, colaboradores);

    // Buscar histórico (em produção, buscar do banco de dados)
    const historico: PcDComplianceData[] = [compliance]; // Simplificado para esta implementação

    const recomendacoes = this.generateRecommendations(compliance, alertas);

    const report: PcDReport = {
      empresaId,
      periodo: {
        inicio: periodoInicio,
        fim: periodoFim
      },
      compliance,
      historico,
      alertas,
      recomendacoes,
      geradoEm: new Date()
    };

    // Registrar geração do relatório
    await this.auditService.logAction({
      entidadeId: empresaId,
      entidadeTipo: 'empresa',
      acao: 'gerar_relatorio_pcd',
      usuarioId: 'sistema',
      usuarioNome: 'Sistema PcD',
      motivo: 'Geração de relatório de conformidade PcD',
      valoresDepois: { 
        periodo: report.periodo,
        conforme: compliance.conforme,
        deficit: compliance.deficit
      },
      timestamp: new Date()
    });

    return report;
  }

  /**
   * Gera recomendações baseadas na análise de conformidade
   */
  private generateRecommendations(compliance: PcDComplianceData, alertas: PcDAlert[]): string[] {
    const recomendacoes: string[] = [];

    if (!compliance.conforme) {
      recomendacoes.push(
        'Implementar programa estruturado de contratação de PcD',
        'Revisar descrições de cargos para inclusão de PcD',
        'Estabelecer parcerias com organizações especializadas',
        'Adequar infraestrutura e postos de trabalho'
      );
    }

    if (compliance.totalColaboradores > 0 && compliance.percentualAtual < compliance.percentualObrigatorio * 0.8) {
      recomendacoes.push(
        'Criar programa de trainee específico para PcD',
        'Implementar política de cotas internas por área',
        'Desenvolver programa de mentoria para PcD'
      );
    }

    if (alertas.some(a => a.tipo === 'risco')) {
      recomendacoes.push(
        'Implementar programa de retenção para colaboradores PcD',
        'Monitorar satisfação e engajamento de PcD',
        'Criar plano de sucessão considerando diversidade'
      );
    }

    if (compliance.conforme) {
      recomendacoes.push(
        'Manter programas de inclusão e diversidade',
        'Compartilhar boas práticas com outras empresas',
        'Considerar certificações de diversidade e inclusão'
      );
    }

    return recomendacoes;
  }

  /**
   * Calcula projeção de conformidade baseada em cenários
   */
  async projectCompliance(
    empresaId: string,
    colaboradoresAtuais: ColaboradorModel[],
    cenarios: {
      novasContratacoes: number;
      novasContratacoesPcD: number;
      desligamentos: number;
      desligamentosPcD: number;
    }
  ): Promise<PcDComplianceData> {
    // Simular cenário futuro
    const totalFuturo = colaboradoresAtuais.filter(c => c.isActive()).length + 
                       cenarios.novasContratacoes - cenarios.desligamentos;
    
    const pcdFuturo = colaboradoresAtuais.filter(c => c.isActive() && c.isPcD()).length + 
                     cenarios.novasContratacoesPcD - cenarios.desligamentosPcD;

    const percentualObrigatorio = this.getPercentualObrigatorio(totalFuturo);
    const quantidadeObrigatoria = this.calculateQuantidadeObrigatoria(totalFuturo, percentualObrigatorio);
    const percentualAtual = totalFuturo > 0 ? (pcdFuturo / totalFuturo) * 100 : 0;
    const deficit = Math.max(0, quantidadeObrigatoria - pcdFuturo);
    const conforme = pcdFuturo >= quantidadeObrigatoria;
    const faixaLei = this.getFaixaLei(totalFuturo);

    return {
      empresaId,
      totalColaboradores: totalFuturo,
      totalPcD: pcdFuturo,
      percentualAtual,
      percentualObrigatorio,
      quantidadeObrigatoria,
      deficit,
      conforme,
      faixaLei
    };
  }

  /**
   * Valida se colaborador pode ser marcado como PcD
   */
  validatePcDStatus(colaborador: ColaboradorModel, documentacao?: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!colaborador.isActive()) {
      errors.push('Colaborador deve estar ativo para ser marcado como PcD');
    }

    // Em produção, validar documentação obrigatória
    if (!documentacao || documentacao.length === 0) {
      errors.push('Documentação comprobatória é obrigatória');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Atualiza status PcD de colaborador com auditoria
   */
  async updatePcDStatus(
    colaborador: ColaboradorModel, 
    isPcD: boolean, 
    usuarioId: string, 
    motivo: string,
    documentacao?: string[]
  ): Promise<void> {
    const validation = this.validatePcDStatus(colaborador, documentacao);
    if (!validation.valid) {
      throw new Error(`Erro na validação PcD: ${validation.errors.join(', ')}`);
    }

    const valorAntes = { pcd: colaborador.pcd };
    
    if (isPcD) {
      colaborador.markAsPcD();
    } else {
      colaborador.unmarkAsPcD();
    }

    const valorDepois = { pcd: colaborador.pcd };

    // Registrar auditoria
    await this.auditService.logAction({
      entidadeId: colaborador.id,
      entidadeTipo: 'colaborador',
      acao: isPcD ? 'marcar_pcd' : 'desmarcar_pcd',
      usuarioId,
      usuarioNome: 'Usuário', // Em produção, buscar nome do usuário
      motivo,
      valoresAntes: valorAntes,
      valoresDepois: valorDepois,
      timestamp: new Date()
    });
  }
}