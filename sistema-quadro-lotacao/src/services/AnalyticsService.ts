import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { CargoModel } from '../models/Cargo.js';
import { CentroCustoModel } from '../models/CentroCusto.js';
import { PlanoVagasModel } from '../models/PlanoVagas.js';

// Types for analytics data
export interface OccupancyRate {
  cargoId: string;
  cargoNome: string;
  centroCustoId: string;
  centroCustoNome: string;
  vagasPrevistas: number;
  vagasEfetivas: number;
  vagasReservadas: number;
  taxaOcupacao: number;
  status: 'critico' | 'baixo' | 'normal' | 'alto';
}

export interface PeriodComparison {
  periodo1: {
    nome: string;
    dataInicio: Date;
    dataFim: Date;
  };
  periodo2: {
    nome: string;
    dataInicio: Date;
    dataFim: Date;
  };
  comparacao: {
    vagasPrevisasDelta: number;
    vagasEfetivasDelta: number;
    taxaOcupacaoDelta: number;
    variacao: 'aumento' | 'reducao' | 'estavel';
  };
}

export interface AnalyticsFilters {
  empresaId?: string;
  planoVagasId?: string;
  centroCustoIds?: string[];
  cargoIds?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  tipoControle?: 'diario' | 'competencia';
  status?: 'ativo' | 'inativo';
}

export interface TrendData {
  periodo: string;
  data: Date;
  vagasPrevistas: number;
  vagasEfetivas: number;
  taxaOcupacao: number;
}

export interface AnalyticsReport {
  resumo: {
    totalVagasPrevistas: number;
    totalVagasEfetivas: number;
    totalVagasReservadas: number;
    taxaOcupacaoGeral: number;
    cargosCriticos: number;
  };
  ocupacaoPorCargo: OccupancyRate[];
  ocupacaoPorCentro: OccupancyRate[];
  tendencias: TrendData[];
  comparacaoPeriodos?: PeriodComparison;
}

export interface ExportOptions {
  formato: 'pdf' | 'excel' | 'csv';
  incluirGraficos: boolean;
  incluirDetalhes: boolean;
  filtros: AnalyticsFilters;
}

export class AnalyticsService {
  /**
   * Calcula taxas de ocupação por cargo
   */
  async getOccupancyRatesByCargo(filters: AnalyticsFilters): Promise<OccupancyRate[]> {
    try {
      // Build query conditions
      const whereConditions: any = {
        ativo: true
      };

      if (filters.empresaId) {
        whereConditions.planoVagas = {
          empresaId: filters.empresaId
        };
      }

      if (filters.planoVagasId) {
        whereConditions.planoVagasId = filters.planoVagasId;
      }

      if (filters.centroCustoIds && filters.centroCustoIds.length > 0) {
        whereConditions.postoTrabalho = {
          centroCustoId: { $in: filters.centroCustoIds }
        };
      }

      if (filters.cargoIds && filters.cargoIds.length > 0) {
        whereConditions.cargoId = { $in: filters.cargoIds };
      }

      if (filters.tipoControle) {
        whereConditions.tipoControle = filters.tipoControle;
      }

      // Get quadro data with related entities
      const quadroData = await QuadroLotacaoModel.find(whereConditions)
        .populate('cargo')
        .populate({
          path: 'postoTrabalho',
          populate: {
            path: 'centroCusto'
          }
        })
        .exec();

      // Group by cargo and calculate occupancy rates
      const occupancyMap = new Map<string, {
        cargoId: string;
        cargoNome: string;
        centroCustoId: string;
        centroCustoNome: string;
        vagasPrevistas: number;
        vagasEfetivas: number;
        vagasReservadas: number;
      }>();

      for (const quadro of quadroData) {
        const key = `${quadro.cargoId}-${quadro.postoTrabalho.centroCustoId}`;
        
        if (!occupancyMap.has(key)) {
          occupancyMap.set(key, {
            cargoId: quadro.cargoId,
            cargoNome: quadro.cargo.nome,
            centroCustoId: quadro.postoTrabalho.centroCustoId,
            centroCustoNome: quadro.postoTrabalho.centroCusto.nome,
            vagasPrevistas: 0,
            vagasEfetivas: 0,
            vagasReservadas: 0
          });
        }

        const entry = occupancyMap.get(key)!;
        entry.vagasPrevistas += quadro.vagasPrevistas;
        entry.vagasEfetivas += quadro.vagasEfetivas;
        entry.vagasReservadas += quadro.vagasReservadas;
      }

      // Calculate occupancy rates and status
      const occupancyRates: OccupancyRate[] = Array.from(occupancyMap.values()).map(entry => {
        const taxaOcupacao = entry.vagasPrevistas > 0 
          ? (entry.vagasEfetivas / entry.vagasPrevistas) * 100 
          : 0;

        let status: 'critico' | 'baixo' | 'normal' | 'alto';
        if (taxaOcupacao < 50) {
          status = 'critico';
        } else if (taxaOcupacao < 75) {
          status = 'baixo';
        } else if (taxaOcupacao <= 100) {
          status = 'normal';
        } else {
          status = 'alto';
        }

        return {
          ...entry,
          taxaOcupacao,
          status
        };
      });

      return occupancyRates.sort((a, b) => a.taxaOcupacao - b.taxaOcupacao);
    } catch (error) {
      console.error('Error calculating occupancy rates by cargo:', error);
      throw new Error('Erro ao calcular taxas de ocupação por cargo');
    }
  }

  /**
   * Calcula taxas de ocupação por centro de custo
   */
  async getOccupancyRatesByCentro(filters: AnalyticsFilters): Promise<OccupancyRate[]> {
    try {
      const occupancyByCargo = await this.getOccupancyRatesByCargo(filters);
      
      // Group by centro de custo
      const centroMap = new Map<string, {
        centroCustoId: string;
        centroCustoNome: string;
        vagasPrevistas: number;
        vagasEfetivas: number;
        vagasReservadas: number;
      }>();

      for (const cargo of occupancyByCargo) {
        if (!centroMap.has(cargo.centroCustoId)) {
          centroMap.set(cargo.centroCustoId, {
            centroCustoId: cargo.centroCustoId,
            centroCustoNome: cargo.centroCustoNome,
            vagasPrevistas: 0,
            vagasEfetivas: 0,
            vagasReservadas: 0
          });
        }

        const entry = centroMap.get(cargo.centroCustoId)!;
        entry.vagasPrevistas += cargo.vagasPrevistas;
        entry.vagasEfetivas += cargo.vagasEfetivas;
        entry.vagasReservadas += cargo.vagasReservadas;
      }

      // Calculate occupancy rates for centros
      const occupancyRates: OccupancyRate[] = Array.from(centroMap.values()).map(entry => {
        const taxaOcupacao = entry.vagasPrevistas > 0 
          ? (entry.vagasEfetivas / entry.vagasPrevistas) * 100 
          : 0;

        let status: 'critico' | 'baixo' | 'normal' | 'alto';
        if (taxaOcupacao < 50) {
          status = 'critico';
        } else if (taxaOcupacao < 75) {
          status = 'baixo';
        } else if (taxaOcupacao <= 100) {
          status = 'normal';
        } else {
          status = 'alto';
        }

        return {
          cargoId: '', // Not applicable for centro aggregation
          cargoNome: 'Todos os Cargos',
          centroCustoId: entry.centroCustoId,
          centroCustoNome: entry.centroCustoNome,
          vagasPrevistas: entry.vagasPrevistas,
          vagasEfetivas: entry.vagasEfetivas,
          vagasReservadas: entry.vagasReservadas,
          taxaOcupacao,
          status
        };
      });

      return occupancyRates.sort((a, b) => a.taxaOcupacao - b.taxaOcupacao);
    } catch (error) {
      console.error('Error calculating occupancy rates by centro:', error);
      throw new Error('Erro ao calcular taxas de ocupação por centro de custo');
    }
  }

  /**
   * Compara dados entre dois períodos
   */
  async comparePeriods(
    periodo1Id: string, 
    periodo2Id: string, 
    filters: Omit<AnalyticsFilters, 'planoVagasId'>
  ): Promise<PeriodComparison> {
    try {
      // Get period information
      const [plano1, plano2] = await Promise.all([
        PlanoVagasModel.findById(periodo1Id),
        PlanoVagasModel.findById(periodo2Id)
      ]);

      if (!plano1 || !plano2) {
        throw new Error('Períodos não encontrados');
      }

      // Get occupancy data for both periods
      const [dados1, dados2] = await Promise.all([
        this.getOccupancyRatesByCargo({ ...filters, planoVagasId: periodo1Id }),
        this.getOccupancyRatesByCargo({ ...filters, planoVagasId: periodo2Id })
      ]);

      // Calculate totals for each period
      const totals1 = dados1.reduce((acc, item) => ({
        vagasPrevistas: acc.vagasPrevistas + item.vagasPrevistas,
        vagasEfetivas: acc.vagasEfetivas + item.vagasEfetivas
      }), { vagasPrevistas: 0, vagasEfetivas: 0 });

      const totals2 = dados2.reduce((acc, item) => ({
        vagasPrevistas: acc.vagasPrevistas + item.vagasPrevistas,
        vagasEfetivas: acc.vagasEfetivas + item.vagasEfetivas
      }), { vagasPrevistas: 0, vagasEfetivas: 0 });

      const taxaOcupacao1 = totals1.vagasPrevistas > 0 
        ? (totals1.vagasEfetivas / totals1.vagasPrevistas) * 100 
        : 0;
      const taxaOcupacao2 = totals2.vagasPrevistas > 0 
        ? (totals2.vagasEfetivas / totals2.vagasPrevistas) * 100 
        : 0;

      // Calculate deltas
      const vagasPrevisasDelta = totals2.vagasPrevistas - totals1.vagasPrevistas;
      const vagasEfetivasDelta = totals2.vagasEfetivas - totals1.vagasEfetivas;
      const taxaOcupacaoDelta = taxaOcupacao2 - taxaOcupacao1;

      let variacao: 'aumento' | 'reducao' | 'estavel';
      if (Math.abs(taxaOcupacaoDelta) < 1) {
        variacao = 'estavel';
      } else if (taxaOcupacaoDelta > 0) {
        variacao = 'aumento';
      } else {
        variacao = 'reducao';
      }

      return {
        periodo1: {
          nome: plano1.nome,
          dataInicio: plano1.dataInicio,
          dataFim: plano1.dataFim
        },
        periodo2: {
          nome: plano2.nome,
          dataInicio: plano2.dataInicio,
          dataFim: plano2.dataFim
        },
        comparacao: {
          vagasPrevisasDelta,
          vagasEfetivasDelta,
          taxaOcupacaoDelta,
          variacao
        }
      };
    } catch (error) {
      console.error('Error comparing periods:', error);
      throw new Error('Erro ao comparar períodos');
    }
  }

  /**
   * Gera dados de tendência temporal
   */
  async getTrendData(filters: AnalyticsFilters, granularidade: 'mensal' | 'trimestral' = 'mensal'): Promise<TrendData[]> {
    try {
      const dataInicio = filters.dataInicio || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const dataFim = filters.dataFim || new Date();

      // Generate time periods based on granularity
      const periods: { inicio: Date; fim: Date; label: string }[] = [];
      const current = new Date(dataInicio);
      
      while (current <= dataFim) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current);
        
        if (granularidade === 'mensal') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0); // Last day of month
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 3);
          periodEnd.setDate(0); // Last day of quarter
        }

        if (periodEnd > dataFim) {
          periodEnd.setTime(dataFim.getTime());
        }

        periods.push({
          inicio: new Date(periodStart),
          fim: new Date(periodEnd),
          label: granularidade === 'mensal' 
            ? periodStart.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
            : `Q${Math.ceil((periodStart.getMonth() + 1) / 3)}/${periodStart.getFullYear()}`
        });

        if (granularidade === 'mensal') {
          current.setMonth(current.getMonth() + 1);
        } else {
          current.setMonth(current.getMonth() + 3);
        }
      }

      // Get data for each period
      const trendData: TrendData[] = [];
      
      for (const period of periods) {
        const periodFilters = {
          ...filters,
          dataInicio: period.inicio,
          dataFim: period.fim
        };

        const occupancyData = await this.getOccupancyRatesByCargo(periodFilters);
        
        const totals = occupancyData.reduce((acc, item) => ({
          vagasPrevistas: acc.vagasPrevistas + item.vagasPrevistas,
          vagasEfetivas: acc.vagasEfetivas + item.vagasEfetivas
        }), { vagasPrevistas: 0, vagasEfetivas: 0 });

        const taxaOcupacao = totals.vagasPrevistas > 0 
          ? (totals.vagasEfetivas / totals.vagasPrevistas) * 100 
          : 0;

        trendData.push({
          periodo: period.label,
          data: period.inicio,
          vagasPrevistas: totals.vagasPrevistas,
          vagasEfetivas: totals.vagasEfetivas,
          taxaOcupacao
        });
      }

      return trendData;
    } catch (error) {
      console.error('Error generating trend data:', error);
      throw new Error('Erro ao gerar dados de tendência');
    }
  }

  /**
   * Gera relatório completo de analytics
   */
  async generateAnalyticsReport(filters: AnalyticsFilters): Promise<AnalyticsReport> {
    try {
      const [ocupacaoPorCargo, ocupacaoPorCentro, tendencias] = await Promise.all([
        this.getOccupancyRatesByCargo(filters),
        this.getOccupancyRatesByCentro(filters),
        this.getTrendData(filters)
      ]);

      // Calculate summary
      const totalVagasPrevistas = ocupacaoPorCargo.reduce((sum, item) => sum + item.vagasPrevistas, 0);
      const totalVagasEfetivas = ocupacaoPorCargo.reduce((sum, item) => sum + item.vagasEfetivas, 0);
      const totalVagasReservadas = ocupacaoPorCargo.reduce((sum, item) => sum + item.vagasReservadas, 0);
      const taxaOcupacaoGeral = totalVagasPrevistas > 0 
        ? (totalVagasEfetivas / totalVagasPrevistas) * 100 
        : 0;
      const cargosCriticos = ocupacaoPorCargo.filter(item => item.status === 'critico').length;

      return {
        resumo: {
          totalVagasPrevistas,
          totalVagasEfetivas,
          totalVagasReservadas,
          taxaOcupacaoGeral,
          cargosCriticos
        },
        ocupacaoPorCargo,
        ocupacaoPorCentro,
        tendencias
      };
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw new Error('Erro ao gerar relatório de analytics');
    }
  }

  /**
   * Exporta dados em diferentes formatos
   */
  async exportData(options: ExportOptions): Promise<Buffer | string> {
    try {
      const report = await this.generateAnalyticsReport(options.filtros);

      switch (options.formato) {
        case 'csv':
          return this.exportToCSV(report, options);
        case 'excel':
          return this.exportToExcel(report, options);
        case 'pdf':
          return this.exportToPDF(report, options);
        default:
          throw new Error('Formato de exportação não suportado');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Erro ao exportar dados');
    }
  }

  private exportToCSV(report: AnalyticsReport, options: ExportOptions): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Relatório de Analytics - Sistema de Quadro de Lotação');
    lines.push(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');

    // Summary
    lines.push('RESUMO EXECUTIVO');
    lines.push(`Total Vagas Previstas,${report.resumo.totalVagasPrevistas}`);
    lines.push(`Total Vagas Efetivas,${report.resumo.totalVagasEfetivas}`);
    lines.push(`Total Vagas Reservadas,${report.resumo.totalVagasReservadas}`);
    lines.push(`Taxa Ocupação Geral,${report.resumo.taxaOcupacaoGeral.toFixed(2)}%`);
    lines.push(`Cargos Críticos,${report.resumo.cargosCriticos}`);
    lines.push('');

    // Occupancy by cargo
    if (options.incluirDetalhes) {
      lines.push('OCUPAÇÃO POR CARGO');
      lines.push('Cargo,Centro de Custo,Vagas Previstas,Vagas Efetivas,Vagas Reservadas,Taxa Ocupação (%),Status');
      
      for (const item of report.ocupacaoPorCargo) {
        lines.push([
          item.cargoNome,
          item.centroCustoNome,
          item.vagasPrevistas,
          item.vagasEfetivas,
          item.vagasReservadas,
          item.taxaOcupacao.toFixed(2),
          item.status
        ].join(','));
      }
      lines.push('');

      // Occupancy by centro
      lines.push('OCUPAÇÃO POR CENTRO DE CUSTO');
      lines.push('Centro de Custo,Vagas Previstas,Vagas Efetivas,Vagas Reservadas,Taxa Ocupação (%),Status');
      
      for (const item of report.ocupacaoPorCentro) {
        lines.push([
          item.centroCustoNome,
          item.vagasPrevistas,
          item.vagasEfetivas,
          item.vagasReservadas,
          item.taxaOcupacao.toFixed(2),
          item.status
        ].join(','));
      }
    }

    return lines.join('\n');
  }

  private async exportToExcel(report: AnalyticsReport, options: ExportOptions): Promise<Buffer> {
    // This would require a library like xlsx or exceljs
    // For now, return CSV as buffer
    const csvData = this.exportToCSV(report, options);
    return Buffer.from(csvData, 'utf-8');
  }

  private async exportToPDF(report: AnalyticsReport, options: ExportOptions): Promise<Buffer> {
    // This would require a library like puppeteer or pdfkit
    // For now, return CSV as buffer
    const csvData = this.exportToCSV(report, options);
    return Buffer.from(csvData, 'utf-8');
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();