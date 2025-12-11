import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, AnalyticsFilters } from './AnalyticsService.js';

// Mock the models
vi.mock('../models/QuadroLotacao.js');
vi.mock('../models/PlanoVagas.js');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe('getOccupancyRatesByCargo', () => {
    it('should calculate occupancy rates correctly', async () => {
      // Mock data
      const mockQuadroData = [
        {
          cargoId: 'cargo1',
          cargo: { nome: 'Desenvolvedor Pleno' },
          postoTrabalho: {
            centroCustoId: 'cc1',
            centroCusto: { nome: 'TI' }
          },
          vagasPrevistas: 10,
          vagasEfetivas: 8,
          vagasReservadas: 1
        },
        {
          cargoId: 'cargo2',
          cargo: { nome: 'Analista Junior' },
          postoTrabalho: {
            centroCustoId: 'cc1',
            centroCusto: { nome: 'TI' }
          },
          vagasPrevistas: 5,
          vagasEfetivas: 2,
          vagasReservadas: 0
        }
      ];

      // Mock the database query
      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockQuadroData)
          })
        })
      });

      // Mock QuadroLotacaoModel
      const { QuadroLotacaoModel } = await import('../models/QuadroLotacao.js');
      (QuadroLotacaoModel.find as any) = mockFind;

      const filters: AnalyticsFilters = {
        empresaId: 'emp1'
      };

      const result = await analyticsService.getOccupancyRatesByCargo(filters);

      expect(result).toHaveLength(2);
      
      // Check first item (lower occupancy should come first due to sorting)
      const firstItem = result[0];
      expect(firstItem.cargoNome).toBe('Analista Junior');
      expect(firstItem.taxaOcupacao).toBe(40); // 2/5 * 100
      expect(firstItem.status).toBe('critico'); // < 50%
      
      // Check second item
      const secondItem = result[1];
      expect(secondItem.cargoNome).toBe('Desenvolvedor Pleno');
      expect(secondItem.taxaOcupacao).toBe(80); // 8/10 * 100
      expect(secondItem.status).toBe('normal'); // 75-100%
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty result
      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([])
          })
        })
      });

      const { QuadroLotacaoModel } = await import('../models/QuadroLotacao.js');
      (QuadroLotacaoModel.find as any) = mockFind;

      const result = await analyticsService.getOccupancyRatesByCargo({});

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Mock database error
      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      const { QuadroLotacaoModel } = await import('../models/QuadroLotacao.js');
      (QuadroLotacaoModel.find as any) = mockFind;

      await expect(analyticsService.getOccupancyRatesByCargo({}))
        .rejects.toThrow('Erro ao calcular taxas de ocupação por cargo');
    });
  });

  describe('getTrendData', () => {
    it('should generate trend data for monthly periods', async () => {
      // Mock data for trend analysis
      const mockQuadroData = [
        {
          cargoId: 'cargo1',
          cargo: { nome: 'Desenvolvedor' },
          postoTrabalho: {
            centroCustoId: 'cc1',
            centroCusto: { nome: 'TI' }
          },
          vagasPrevistas: 10,
          vagasEfetivas: 8,
          vagasReservadas: 1
        }
      ];

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockQuadroData)
          })
        })
      });

      const { QuadroLotacaoModel } = await import('../models/QuadroLotacao.js');
      (QuadroLotacaoModel.find as any) = mockFind;

      const filters: AnalyticsFilters = {
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-03-31')
      };

      const result = await analyticsService.getTrendData(filters, 'mensal');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('periodo');
      expect(result[0]).toHaveProperty('data');
      expect(result[0]).toHaveProperty('vagasPrevistas');
      expect(result[0]).toHaveProperty('vagasEfetivas');
      expect(result[0]).toHaveProperty('taxaOcupacao');
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV format correctly', async () => {
      // Create a mock report
      const mockReport = {
        resumo: {
          totalVagasPrevistas: 15,
          totalVagasEfetivas: 10,
          totalVagasReservadas: 1,
          taxaOcupacaoGeral: 66.67,
          cargosCriticos: 1
        },
        ocupacaoPorCargo: [
          {
            cargoId: 'cargo1',
            cargoNome: 'Desenvolvedor',
            centroCustoId: 'cc1',
            centroCustoNome: 'TI',
            vagasPrevistas: 10,
            vagasEfetivas: 8,
            vagasReservadas: 1,
            taxaOcupacao: 80,
            status: 'normal' as const
          }
        ],
        ocupacaoPorCentro: [],
        tendencias: []
      };

      const options = {
        formato: 'csv' as const,
        incluirGraficos: false,
        incluirDetalhes: true,
        filtros: {}
      };

      // Access private method through type assertion
      const csvData = (analyticsService as any).exportToCSV(mockReport, options);

      expect(csvData).toContain('Relatório de Analytics');
      expect(csvData).toContain('RESUMO EXECUTIVO');
      expect(csvData).toContain('Total Vagas Previstas,15');
      expect(csvData).toContain('OCUPAÇÃO POR CARGO');
      expect(csvData).toContain('Desenvolvedor,TI,10,8,1,80.00,normal');
    });
  });

  describe('status calculation', () => {
    it('should classify occupancy status correctly', async () => {
      const testCases = [
        { occupancy: 30, expected: 'critico' },
        { occupancy: 60, expected: 'baixo' },
        { occupancy: 85, expected: 'normal' },
        { occupancy: 110, expected: 'alto' }
      ];

      for (const testCase of testCases) {
        const mockData = [{
          cargoId: 'cargo1',
          cargo: { nome: 'Test Cargo' },
          postoTrabalho: {
            centroCustoId: 'cc1',
            centroCusto: { nome: 'Test Centro' }
          },
          vagasPrevistas: 100,
          vagasEfetivas: testCase.occupancy,
          vagasReservadas: 0
        }];

        const mockFind = vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              exec: vi.fn().mockResolvedValue(mockData)
            })
          })
        });

        const { QuadroLotacaoModel } = await import('../models/QuadroLotacao.js');
        (QuadroLotacaoModel.find as any) = mockFind;

        const result = await analyticsService.getOccupancyRatesByCargo({});
        
        expect(result[0].status).toBe(testCase.expected);
        expect(result[0].taxaOcupacao).toBe(testCase.occupancy);
      }
    });
  });
});