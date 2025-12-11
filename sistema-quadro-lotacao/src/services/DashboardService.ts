import { AnalyticsService } from './AnalyticsService.js';
import { PcDComplianceService } from './PcDComplianceService.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';
import { PropostaModel } from '../models/Proposta.js';
import { AuditService } from './AuditService.js';

export interface KPIData {
  id: string;
  title: string;
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  status: 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  color?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardFilters {
  empresaId?: string;
  planoVagasId?: string;
  centroCustoIds?: string[];
  dataInicio?: Date;
  dataFim?: Date;
}

export interface DashboardData {
  kpis: KPIData[];
  alerts: DashboardAlert[];
  recentActivities: ActivityItem[];
  lastUpdated: Date;
}

export interface ActivityItem {
  id: string;
  type: 'vaga_criada' | 'proposta_aprovada' | 'normalizacao' | 'pcd_alert' | 'colaborador_admitido';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  entityId?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export class DashboardService {
  constructor(
    private analyticsService: AnalyticsService,
    private pcdComplianceService: PcDComplianceService,
    private auditService: AuditService
  ) {}

  /**
   * Obtém dados completos do dashboard executivo
   */
  async getDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
    try {
      const [kpis, alerts, recentActivities] = await Promise.all([
        this.calculateKPIs(filters),
        this.getActiveAlerts(filters),
        this.getRecentActivities(filters)
      ]);

      return {
        kpis,
        alerts,
        recentActivities,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Erro ao carregar dados do dashboard');
    }
  }

  /**
   * Calcula KPIs principais do dashboard
   */
  private async calculateKPIs(filters: DashboardFilters): Promise<KPIData[]> {
    const kpis: KPIData[] = [];

    try {
      // 1. Taxa de Ocupação
      const analyticsReport = await this.analyticsService.generateAnalyticsReport(filters);
      const taxaOcupacao = analyticsReport.resumo.taxaOcupacaoGeral;
      
      kpis.push({
        id: 'taxa_ocupacao',
        title: 'Taxa de Ocupação',
        value: `${taxaOcupacao.toFixed(1)}%`,
        label: 'Ocupação Atual',
        status: taxaOcupacao >= 95 ? 'success' : taxaOcupacao >= 80 ? 'warning' : 'error',
        trend: {
          direction: taxaOcupacao >= 90 ? 'up' : 'down',
          percentage: Math.abs(taxaOcupacao - 85), // Simulated comparison
          period: 'vs mês anterior'
        },
        icon: 'users',
        color: taxaOcupacao >= 95 ? '#28A745' : taxaOcupacao >= 80 ? '#FFC107' : '#DC3545'
      });

      // 2. Custo por Contratação (simulado)
      const custoContratacao = this.calculateCustoContratacao(analyticsReport);
      kpis.push({
        id: 'custo_contratacao',
        title: 'Custo por Contratação',
        value: `R$ ${custoContratacao.toLocaleString('pt-BR')}`,
        label: 'Média Mensal',
        status: custoContratacao <= 3000 ? 'success' : custoContratacao <= 5000 ? 'warning' : 'error',
        trend: {
          direction: custoContratacao <= 3500 ? 'down' : 'up',
          percentage: Math.abs((custoContratacao - 3250) / 3250 * 100),
          period: 'vs mês anterior'
        },
        icon: 'dollar-sign',
        color: custoContratacao <= 3000 ? '#28A745' : custoContratacao <= 5000 ? '#FFC107' : '#DC3545'
      });

      // 3. Conformidade PcD
      const colaboradores = await ColaboradorModel.find({ 
        ...(filters.empresaId && { empresaId: filters.empresaId })
      });
      
      if (colaboradores.length > 0) {
        const pcdCompliance = await this.pcdComplianceService.calculateCompliance(
          filters.empresaId || 'default',
          colaboradores
        );

        kpis.push({
          id: 'conformidade_pcd',
          title: 'Conformidade PcD',
          value: `${pcdCompliance.percentualAtual.toFixed(1)}%`,
          label: `Meta: ${pcdCompliance.percentualObrigatorio}%`,
          status: pcdCompliance.conforme ? 'success' : pcdCompliance.deficit <= 2 ? 'warning' : 'error',
          trend: {
            direction: pcdCompliance.conforme ? 'stable' : 'down',
            percentage: Math.abs(pcdCompliance.percentualAtual - pcdCompliance.percentualObrigatorio),
            period: 'vs meta legal'
          },
          icon: 'accessibility',
          color: pcdCompliance.conforme ? '#28A745' : pcdCompliance.deficit <= 2 ? '#FFC107' : '#DC3545'
        });
      }

      // 4. Retenção de Talentos (simulado)
      const retencaoTalentos = this.calculateRetencaoTalentos(colaboradores);
      kpis.push({
        id: 'retencao_talentos',
        title: 'Retenção de Talentos',
        value: `${retencaoTalentos.toFixed(1)}%`,
        label: 'Últimos 12 meses',
        status: retencaoTalentos >= 90 ? 'success' : retencaoTalentos >= 80 ? 'warning' : 'error',
        trend: {
          direction: retencaoTalentos >= 85 ? 'up' : 'down',
          percentage: Math.abs(retencaoTalentos - 88),
          period: 'vs ano anterior'
        },
        icon: 'heart',
        color: retencaoTalentos >= 90 ? '#28A745' : retencaoTalentos >= 80 ? '#FFC107' : '#DC3545'
      });

      // 5. Qualidade de Contratação (simulado)
      const qualidadeContratacao = this.calculateQualidadeContratacao();
      kpis.push({
        id: 'qualidade_contratacao',
        title: 'Qualidade de Contratação',
        value: `${qualidadeContratacao.toFixed(1)}%`,
        label: 'Aprovação em 90 dias',
        status: qualidadeContratacao >= 85 ? 'success' : qualidadeContratacao >= 70 ? 'warning' : 'error',
        trend: {
          direction: qualidadeContratacao >= 80 ? 'up' : 'down',
          percentage: Math.abs(qualidadeContratacao - 82),
          period: 'vs trimestre anterior'
        },
        icon: 'star',
        color: qualidadeContratacao >= 85 ? '#28A745' : qualidadeContratacao >= 70 ? '#FFC107' : '#DC3545'
      });

    } catch (error) {
      console.error('Error calculating KPIs:', error);
      // Return default KPIs in case of error
      kpis.push({
        id: 'error',
        title: 'Erro no Carregamento',
        value: 'N/A',
        label: 'Dados indisponíveis',
        status: 'error',
        icon: 'alert-circle',
        color: '#DC3545'
      });
    }

    return kpis;
  }

  /**
   * Obtém alertas ativos do sistema
   */
  private async getActiveAlerts(filters: DashboardFilters): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    try {
      // Alertas de PcD
      if (filters.empresaId) {
        const colaboradores = await ColaboradorModel.find({ empresaId: filters.empresaId });
        const pcdAlerts = await this.pcdComplianceService.monitorCompliance(filters.empresaId, colaboradores);
        
        for (const pcdAlert of pcdAlerts) {
          if (pcdAlert.prioridade === 'critica' || pcdAlert.prioridade === 'alta') {
            alerts.push({
              id: `pcd_${pcdAlert.tipo}_${Date.now()}`,
              type: pcdAlert.prioridade === 'critica' ? 'critical' : 'warning',
              title: `Alerta PcD - ${pcdAlert.tipo.toUpperCase()}`,
              message: pcdAlert.mensagem,
              timestamp: pcdAlert.dataDeteccao,
              actions: pcdAlert.acoesSugeridas.slice(0, 2).map(acao => ({
                label: acao,
                action: 'view_pcd_dashboard',
                url: '/analytics/pcd'
              })),
              priority: pcdAlert.prioridade === 'critica' ? 'high' : 'medium'
            });
          }
        }
      }

      // Alertas de ocupação crítica
      const analyticsReport = await this.analyticsService.generateAnalyticsReport(filters);
      if (analyticsReport.resumo.cargosCriticos > 0) {
        alerts.push({
          id: `ocupacao_critica_${Date.now()}`,
          type: 'warning',
          title: 'Ocupação Crítica Detectada',
          message: `${analyticsReport.resumo.cargosCriticos} cargo(s) com ocupação abaixo de 50%`,
          timestamp: new Date(),
          actions: [
            {
              label: 'Ver Detalhes',
              action: 'view_analytics',
              url: '/analytics'
            },
            {
              label: 'Criar Proposta',
              action: 'create_proposal',
              url: '/propostas/nova'
            }
          ],
          priority: 'medium'
        });
      }

      // Alertas de propostas pendentes
      const propostas = await PropostaModel.find({
        status: { $in: ['nivel_1', 'nivel_2', 'nivel_3', 'rh'] },
        ...(filters.empresaId && { empresaId: filters.empresaId })
      });

      const propostasVencidas = propostas.filter(p => {
        const diasPendente = Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return diasPendente > 5; // Mais de 5 dias pendente
      });

      if (propostasVencidas.length > 0) {
        alerts.push({
          id: `propostas_vencidas_${Date.now()}`,
          type: 'warning',
          title: 'Propostas Pendentes',
          message: `${propostasVencidas.length} proposta(s) pendente(s) há mais de 5 dias`,
          timestamp: new Date(),
          actions: [
            {
              label: 'Ver Propostas',
              action: 'view_proposals',
              url: '/propostas'
            }
          ],
          priority: 'medium'
        });
      }

      // Alerta de sucesso se tudo estiver bem
      if (alerts.length === 0) {
        alerts.push({
          id: `status_ok_${Date.now()}`,
          type: 'success',
          title: 'Sistema Operacional',
          message: 'Todos os indicadores estão dentro dos parâmetros normais',
          timestamp: new Date(),
          priority: 'low'
        });
      }

    } catch (error) {
      console.error('Error getting active alerts:', error);
      alerts.push({
        id: `error_alerts_${Date.now()}`,
        type: 'critical',
        title: 'Erro no Sistema de Alertas',
        message: 'Não foi possível carregar os alertas do sistema',
        timestamp: new Date(),
        priority: 'high'
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Obtém atividades recentes do sistema
   */
  private async getRecentActivities(filters: DashboardFilters): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    try {
      // Buscar logs de auditoria recentes
      const recentAudits = await this.auditService.getRecentActivities({
        limit: 10,
        ...(filters.empresaId && { empresaId: filters.empresaId })
      });

      for (const audit of recentAudits) {
        let activityType: ActivityItem['type'] = 'vaga_criada';
        let status: ActivityItem['status'] = 'info';

        switch (audit.acao) {
          case 'criar_vaga':
            activityType = 'vaga_criada';
            status = 'success';
            break;
          case 'aprovar_proposta':
            activityType = 'proposta_aprovada';
            status = 'success';
            break;
          case 'executar_normalizacao':
            activityType = 'normalizacao';
            status = 'info';
            break;
          case 'admitir_colaborador':
            activityType = 'colaborador_admitido';
            status = 'success';
            break;
          case 'alerta_pcd':
            activityType = 'pcd_alert';
            status = 'warning';
            break;
        }

        activities.push({
          id: audit.id,
          type: activityType,
          title: this.getActivityTitle(audit.acao),
          description: audit.motivo || 'Ação realizada no sistema',
          timestamp: audit.timestamp,
          user: audit.usuarioNome,
          entityId: audit.entidadeId,
          status
        });
      }

      // Se não há atividades recentes, adicionar placeholder
      if (activities.length === 0) {
        activities.push({
          id: 'no_activities',
          type: 'vaga_criada',
          title: 'Nenhuma atividade recente',
          description: 'Não há atividades registradas nos últimos 7 dias',
          timestamp: new Date(),
          status: 'info'
        });
      }

    } catch (error) {
      console.error('Error getting recent activities:', error);
      activities.push({
        id: 'error_activities',
        type: 'vaga_criada',
        title: 'Erro ao carregar atividades',
        description: 'Não foi possível carregar as atividades recentes',
        timestamp: new Date(),
        status: 'error'
      });
    }

    return activities.slice(0, 10); // Limitar a 10 atividades
  }

  /**
   * Calcula custo por contratação (simulado)
   */
  private calculateCustoContratacao(analyticsReport: any): number {
    // Simulação baseada no número de vagas efetivas
    const baseValue = 3250;
    const variation = (analyticsReport.resumo.totalVagasEfetivas % 10) * 100;
    return baseValue + variation - 500;
  }

  /**
   * Calcula retenção de talentos (simulado)
   */
  private calculateRetencaoTalentos(colaboradores: ColaboradorModel[]): number {
    if (colaboradores.length === 0) return 0;
    
    const colaboradoresAtivos = colaboradores.filter(c => c.isActive());
    const baseRetention = 88;
    const variation = (colaboradoresAtivos.length % 20) * 0.5;
    
    return Math.min(100, baseRetention + variation);
  }

  /**
   * Calcula qualidade de contratação (simulado)
   */
  private calculateQualidadeContratacao(): number {
    const baseQuality = 82;
    const variation = Math.random() * 10 - 5; // -5 to +5
    return Math.max(0, Math.min(100, baseQuality + variation));
  }

  /**
   * Obtém título da atividade baseado na ação
   */
  private getActivityTitle(acao: string): string {
    const titles: Record<string, string> = {
      'criar_vaga': 'Nova vaga criada',
      'aprovar_proposta': 'Proposta aprovada',
      'executar_normalizacao': 'Normalização executada',
      'admitir_colaborador': 'Colaborador admitido',
      'alerta_pcd': 'Alerta PcD gerado',
      'atualizar_quadro': 'Quadro atualizado',
      'rejeitar_proposta': 'Proposta rejeitada'
    };

    return titles[acao] || 'Atividade do sistema';
  }

  /**
   * Atualiza dados do dashboard em tempo real
   */
  async refreshDashboard(filters: DashboardFilters = {}): Promise<DashboardData> {
    // Registrar atualização na auditoria
    await this.auditService.logAction({
      entidadeId: 'dashboard',
      entidadeTipo: 'sistema',
      acao: 'refresh_dashboard',
      usuarioId: 'sistema',
      usuarioNome: 'Sistema Dashboard',
      motivo: 'Atualização automática do dashboard',
      timestamp: new Date()
    });

    return this.getDashboardData(filters);
  }

  /**
   * Obtém configurações globais do dashboard
   */
  async getDashboardConfig(): Promise<{
    refreshInterval: number;
    alertsEnabled: boolean;
    kpiThresholds: Record<string, any>;
  }> {
    return {
      refreshInterval: 30000, // 30 segundos
      alertsEnabled: true,
      kpiThresholds: {
        taxaOcupacao: { warning: 80, error: 70 },
        custoContratacao: { warning: 5000, error: 7000 },
        retencaoTalentos: { warning: 80, error: 70 },
        qualidadeContratacao: { warning: 70, error: 60 }
      }
    };
  }
}

// Export class for dependency injection
export { DashboardService };

// Create singleton instance with proper dependencies
import { Pool } from 'pg';
import { NotificationService } from './NotificationService.js';

// This will be properly initialized in the application startup
let dashboardServiceInstance: DashboardService | null = null;

export const initializeDashboardService = (
  pool: Pool,
  notificationService: NotificationService
): DashboardService => {
  const analyticsService = new AnalyticsService();
  const auditService = new AuditService(pool);
  const pcdComplianceService = new PcDComplianceService(auditService, notificationService);
  
  dashboardServiceInstance = new DashboardService(
    analyticsService,
    pcdComplianceService,
    auditService
  );
  
  return dashboardServiceInstance;
};

export const getDashboardService = (): DashboardService => {
  if (!dashboardServiceInstance) {
    throw new Error('Dashboard service not initialized. Call initializeDashboardService first.');
  }
  return dashboardServiceInstance;
};