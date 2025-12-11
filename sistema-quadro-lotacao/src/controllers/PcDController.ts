import { Request, Response } from 'express';
import { PcDComplianceService, PcDComplianceData, PcDAlert, PcDReport } from '../services/PcDComplianceService.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AuditService } from '../services/AuditService.js';
import { NotificationService } from '../services/NotificationService.js';

export class PcDController {
  private pcdService: PcDComplianceService;

  constructor(
    auditService: AuditService,
    notificationService: NotificationService
  ) {
    this.pcdService = new PcDComplianceService(auditService, notificationService);
  }

  /**
   * GET /api/pcd/compliance/:empresaId
   * Retorna dados de conformidade PcD para uma empresa
   */
  async getCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { period = 'mes' } = req.query;

      if (!empresaId) {
        res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
        return;
      }

      // Em produção, buscar colaboradores do banco de dados
      const colaboradores = await this.getColaboradoresByEmpresa(empresaId);
      
      const compliance = await this.pcdService.calculateCompliance(empresaId, colaboradores);
      const alerts = await this.pcdService.monitorCompliance(empresaId, colaboradores);

      res.json({
        success: true,
        data: {
          compliance,
          alerts,
          period,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao buscar conformidade PcD:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/pcd/alerts/:empresaId
   * Retorna alertas de conformidade PcD para uma empresa
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { priority } = req.query;

      if (!empresaId) {
        res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
        return;
      }

      const colaboradores = await this.getColaboradoresByEmpresa(empresaId);
      let alerts = await this.pcdService.monitorCompliance(empresaId, colaboradores);

      // Filtrar por prioridade se especificado
      if (priority) {
        alerts = alerts.filter(alert => alert.prioridade === priority);
      }

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Erro ao buscar alertas PcD:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/pcd/report/:empresaId
   * Gera relatório completo de conformidade PcD
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { startDate, endDate, format = 'json' } = req.query;

      if (!empresaId) {
        res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
        return;
      }

      const periodoInicio = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodoFim = endDate ? new Date(endDate as string) : new Date();

      const colaboradores = await this.getColaboradoresByEmpresa(empresaId);
      const report = await this.pcdService.generateComplianceReport(
        empresaId,
        colaboradores,
        periodoInicio,
        periodoFim
      );

      if (format === 'pdf') {
        // Em produção, gerar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-pcd-${empresaId}.pdf"`);
        // Implementar geração de PDF
        res.status(501).json({ message: 'Geração de PDF não implementada' });
        return;
      }

      if (format === 'excel') {
        // Em produção, gerar Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-pcd-${empresaId}.xlsx"`);
        // Implementar geração de Excel
        res.status(501).json({ message: 'Geração de Excel não implementada' });
        return;
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Erro ao gerar relatório PcD:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * POST /api/pcd/projection/:empresaId
   * Calcula projeção de conformidade baseada em cenários
   */
  async calculateProjection(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { cenarios } = req.body;

      if (!empresaId) {
        res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
        return;
      }

      if (!cenarios) {
        res.status(400).json({
          success: false,
          message: 'Cenários são obrigatórios'
        });
        return;
      }

      const colaboradores = await this.getColaboradoresByEmpresa(empresaId);
      const projection = await this.pcdService.projectCompliance(empresaId, colaboradores, cenarios);

      res.json({
        success: true,
        data: {
          projection,
          scenarios: cenarios,
          calculatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao calcular projeção PcD:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * PUT /api/pcd/colaborador/:colaboradorId/status
   * Atualiza status PcD de um colaborador
   */
  async updatePcDStatus(req: Request, res: Response): Promise<void> {
    try {
      const { colaboradorId } = req.params;
      const { isPcD, motivo, documentacao } = req.body;
      const usuarioId = req.user?.id || 'unknown'; // Em produção, pegar do token JWT

      if (!colaboradorId) {
        res.status(400).json({
          success: false,
          message: 'ID do colaborador é obrigatório'
        });
        return;
      }

      if (typeof isPcD !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Status PcD deve ser boolean'
        });
        return;
      }

      if (!motivo) {
        res.status(400).json({
          success: false,
          message: 'Motivo é obrigatório'
        });
        return;
      }

      // Em produção, buscar colaborador do banco de dados
      const colaborador = await this.getColaboradorById(colaboradorId);
      if (!colaborador) {
        res.status(404).json({
          success: false,
          message: 'Colaborador não encontrado'
        });
        return;
      }

      await this.pcdService.updatePcDStatus(colaborador, isPcD, usuarioId, motivo, documentacao);

      // Em produção, salvar colaborador no banco de dados
      await this.saveColaborador(colaborador);

      res.json({
        success: true,
        message: `Status PcD ${isPcD ? 'ativado' : 'desativado'} com sucesso`,
        data: {
          colaboradorId,
          isPcD,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar status PcD:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/pcd/dashboard/:empresaId
   * Retorna dados para o dashboard PcD
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;

      if (!empresaId) {
        res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
        return;
      }

      const colaboradores = await this.getColaboradoresByEmpresa(empresaId);
      const compliance = await this.pcdService.calculateCompliance(empresaId, colaboradores);
      const alerts = await this.pcdService.monitorCompliance(empresaId, colaboradores);

      // Calcular métricas adicionais para o dashboard
      const colaboradoresAtivos = colaboradores.filter(c => c.isActive());
      const pcdPorCargo = this.calculatePcDByRole(colaboradoresAtivos);
      const pcdPorCentro = this.calculatePcDByCostCenter(colaboradoresAtivos);
      const tendencia = await this.calculateTrend(empresaId);

      res.json({
        success: true,
        data: {
          compliance,
          alerts: alerts.filter(a => a.prioridade === 'alta' || a.prioridade === 'critica'),
          metrics: {
            pcdPorCargo,
            pcdPorCentro,
            tendencia
          },
          lastUpdate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard PcD:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // Métodos auxiliares (em produção, implementar com acesso ao banco de dados)
  private async getColaboradoresByEmpresa(empresaId: string): Promise<ColaboradorModel[]> {
    // Mock data - em produção, buscar do banco de dados
    return [
      new ColaboradorModel('1', 'João Silva', '123.456.789-01', 'cargo1', 'cc1', 'manhã', new Date('2020-01-01'), true),
      new ColaboradorModel('2', 'Maria Santos', '987.654.321-02', 'cargo2', 'cc1', 'tarde', new Date('2021-01-01'), false),
      new ColaboradorModel('3', 'Pedro Costa', '456.789.123-03', 'cargo1', 'cc2', 'manhã', new Date('2022-01-01'), true),
      // Adicionar mais dados mock conforme necessário
    ];
  }

  private async getColaboradorById(colaboradorId: string): Promise<ColaboradorModel | null> {
    // Mock data - em produção, buscar do banco de dados
    const colaboradores = await this.getColaboradoresByEmpresa('mock');
    return colaboradores.find(c => c.id === colaboradorId) || null;
  }

  private async saveColaborador(colaborador: ColaboradorModel): Promise<void> {
    // Em produção, salvar no banco de dados
    console.log('Salvando colaborador:', colaborador.id);
  }

  private calculatePcDByRole(colaboradores: ColaboradorModel[]): Record<string, { total: number; pcd: number; percentual: number }> {
    const result: Record<string, { total: number; pcd: number; percentual: number }> = {};

    colaboradores.forEach(colaborador => {
      if (!result[colaborador.cargoId]) {
        result[colaborador.cargoId] = { total: 0, pcd: 0, percentual: 0 };
      }
      result[colaborador.cargoId].total++;
      if (colaborador.isPcD()) {
        result[colaborador.cargoId].pcd++;
      }
    });

    // Calcular percentuais
    Object.keys(result).forEach(cargoId => {
      const data = result[cargoId];
      data.percentual = data.total > 0 ? (data.pcd / data.total) * 100 : 0;
    });

    return result;
  }

  private calculatePcDByCostCenter(colaboradores: ColaboradorModel[]): Record<string, { total: number; pcd: number; percentual: number }> {
    const result: Record<string, { total: number; pcd: number; percentual: number }> = {};

    colaboradores.forEach(colaborador => {
      if (!result[colaborador.centroCustoId]) {
        result[colaborador.centroCustoId] = { total: 0, pcd: 0, percentual: 0 };
      }
      result[colaborador.centroCustoId].total++;
      if (colaborador.isPcD()) {
        result[colaborador.centroCustoId].pcd++;
      }
    });

    // Calcular percentuais
    Object.keys(result).forEach(centroCustoId => {
      const data = result[centroCustoId];
      data.percentual = data.total > 0 ? (data.pcd / data.total) * 100 : 0;
    });

    return result;
  }

  private async calculateTrend(empresaId: string): Promise<{ periodo: string; percentual: number }[]> {
    // Mock data - em produção, buscar histórico do banco de dados
    return [
      { periodo: '2024-08', percentual: 2.1 },
      { periodo: '2024-09', percentual: 2.3 },
      { periodo: '2024-10', percentual: 2.5 },
      { periodo: '2024-11', percentual: 2.8 },
      { periodo: '2024-12', percentual: 3.0 }
    ];
  }
}