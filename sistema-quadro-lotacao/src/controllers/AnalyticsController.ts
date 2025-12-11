import { Request, Response } from 'express';
import { 
  AnalyticsService, 
  AnalyticsFilters, 
  ExportOptions 
} from '../services/AnalyticsService.js';
import { AuditService } from '../services/AuditService.js';

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private auditService: AuditService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.auditService = new AuditService();
  }

  /**
   * GET /api/analytics/occupancy/cargo
   * Get occupancy rates by cargo
   */
  async getOccupancyRatesByCargo(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const occupancyRates = await this.analyticsService.getOccupancyRatesByCargo(filters);

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'consulta_ocupacao_cargo',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: 'Consulta de taxas de ocupação por cargo',
        valoresAntes: null,
        valoresDepois: { filtros: filters, resultados: occupancyRates.length },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: occupancyRates,
        total: occupancyRates.length,
        filters: filters
      });
    } catch (error) {
      console.error('Error getting occupancy rates by cargo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter taxas de ocupação por cargo',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/analytics/occupancy/centro
   * Get occupancy rates by centro de custo
   */
  async getOccupancyRatesByCentro(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const occupancyRates = await this.analyticsService.getOccupancyRatesByCentro(filters);

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'consulta_ocupacao_centro',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: 'Consulta de taxas de ocupação por centro de custo',
        valoresAntes: null,
        valoresDepois: { filtros: filters, resultados: occupancyRates.length },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: occupancyRates,
        total: occupancyRates.length,
        filters: filters
      });
    } catch (error) {
      console.error('Error getting occupancy rates by centro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter taxas de ocupação por centro de custo',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/analytics/trends
   * Get trend data
   */
  async getTrendData(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const granularidade = (req.query.granularidade as 'mensal' | 'trimestral') || 'mensal';
      
      const trendData = await this.analyticsService.getTrendData(filters, granularidade);

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'consulta_tendencias',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: 'Consulta de dados de tendência',
        valoresAntes: null,
        valoresDepois: { filtros: filters, granularidade, resultados: trendData.length },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: trendData,
        total: trendData.length,
        filters: filters,
        granularidade: granularidade
      });
    } catch (error) {
      console.error('Error getting trend data:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter dados de tendência',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/analytics/compare-periods
   * Compare data between two periods
   */
  async comparePeriods(req: Request, res: Response): Promise<void> {
    try {
      const { periodo1Id, periodo2Id, filters } = req.body;

      if (!periodo1Id || !periodo2Id) {
        res.status(400).json({
          success: false,
          error: 'IDs dos períodos são obrigatórios'
        });
        return;
      }

      const comparison = await this.analyticsService.comparePeriods(
        periodo1Id, 
        periodo2Id, 
        filters || {}
      );

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'comparacao_periodos',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: 'Comparação entre períodos',
        valoresAntes: null,
        valoresDepois: { periodo1Id, periodo2Id, filtros: filters },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      console.error('Error comparing periods:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao comparar períodos',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/analytics/report
   * Generate complete analytics report
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const report = await this.analyticsService.generateAnalyticsReport(filters);

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'geracao_relatorio',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: 'Geração de relatório completo de analytics',
        valoresAntes: null,
        valoresDepois: { 
          filtros: filters, 
          resumo: report.resumo,
          totalCargos: report.ocupacaoPorCargo.length,
          totalCentros: report.ocupacaoPorCentro.length
        },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: report,
        filters: filters
      });
    } catch (error) {
      console.error('Error generating analytics report:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório de analytics',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/analytics/export
   * Export analytics data
   */
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const options: ExportOptions = req.body;

      if (!options.formato || !['pdf', 'excel', 'csv'].includes(options.formato)) {
        res.status(400).json({
          success: false,
          error: 'Formato de exportação inválido'
        });
        return;
      }

      const data = await this.analyticsService.exportData(options);

      // Log audit trail
      await this.auditService.logAction({
        entidadeId: 'analytics',
        entidadeTipo: 'analytics',
        acao: 'exportacao_dados',
        usuarioId: req.user?.id || 'anonymous',
        usuarioNome: req.user?.nome || 'Anonymous',
        motivo: `Exportação de dados em formato ${options.formato}`,
        valoresAntes: null,
        valoresDepois: { 
          formato: options.formato,
          incluirGraficos: options.incluirGraficos,
          incluirDetalhes: options.incluirDetalhes,
          filtros: options.filtros
        },
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Set appropriate headers for download
      const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.${options.formato}`;
      let contentType: string;
      
      switch (options.formato) {
        case 'csv':
          contentType = 'text/csv';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
        default:
          contentType = 'application/octet-stream';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao exportar dados de analytics',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  /**
   * Parse query parameters into AnalyticsFilters
   */
  private parseFilters(query: any): AnalyticsFilters {
    const filters: AnalyticsFilters = {};

    if (query.empresaId) {
      filters.empresaId = query.empresaId;
    }

    if (query.planoVagasId) {
      filters.planoVagasId = query.planoVagasId;
    }

    if (query.centroCustoIds) {
      filters.centroCustoIds = Array.isArray(query.centroCustoIds) 
        ? query.centroCustoIds 
        : [query.centroCustoIds];
    }

    if (query.cargoIds) {
      filters.cargoIds = Array.isArray(query.cargoIds) 
        ? query.cargoIds 
        : [query.cargoIds];
    }

    if (query.dataInicio) {
      filters.dataInicio = new Date(query.dataInicio);
    }

    if (query.dataFim) {
      filters.dataFim = new Date(query.dataFim);
    }

    if (query.tipoControle && ['diario', 'competencia'].includes(query.tipoControle)) {
      filters.tipoControle = query.tipoControle;
    }

    if (query.status && ['ativo', 'inativo'].includes(query.status)) {
      filters.status = query.status;
    }

    return filters;
  }
}

// Export singleton instance
export const analyticsController = new AnalyticsController();