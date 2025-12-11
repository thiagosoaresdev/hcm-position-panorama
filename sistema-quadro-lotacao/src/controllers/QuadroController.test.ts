import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Pool } from 'pg';
import { QuadroController, type HttpRequest, type HttpResponse } from './QuadroController.js';
import { QuadroLotacaoService } from '../services/QuadroLotacaoService.js';
import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';

// Mock the service
vi.mock('../services/QuadroLotacaoService.js');
vi.mock('../repositories/QuadroLotacaoRepository.js');
vi.mock('../services/AuditService.js');

describe('QuadroController', () => {
  let controller: QuadroController;
  let mockPool: Pool;
  let mockRequest: HttpRequest;
  let mockResponse: HttpResponse;
  let mockQuadroService: QuadroLotacaoService;

  beforeEach(() => {
    mockPool = {} as Pool;
    controller = new QuadroController(mockPool);
    
    // Mock service methods
    mockQuadroService = {
      createQuadroLotacao: vi.fn(),
      updateVagasPrevistas: vi.fn(),
      softDeleteQuadro: vi.fn(),
      getOccupancyStats: vi.fn(),
      getQuadrosWithDeficit: vi.fn(),
      getQuadrosAvailable: vi.fn(),
      admitirColaborador: vi.fn(),
      desligarColaborador: vi.fn(),
    } as any;

    // Replace the service instance
    (controller as any).quadroService = mockQuadroService;

    // Mock request and response
    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: {
        id: 'user123',
        nome: 'Test User',
        email: 'test@example.com',
        roles: ['admin'],
        permissions: ['quadro:create']
      },
      app: {
        locals: {
          pool: mockPool
        }
      }
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('createVaga', () => {
    it('should create a new vaga successfully', async () => {
      const mockQuadro = new QuadroLotacaoModel(
        'quadro123',
        'plano123',
        'posto123',
        'cargo123',
        5,
        0,
        0,
        new Date('2025-01-01'),
        'diario'
      );

      (mockQuadroService.createQuadroLotacao as Mock).mockResolvedValue(mockQuadro);

      mockRequest.body = {
        id: 'quadro123',
        planoVagasId: 'plano123',
        postoTrabalhoId: 'posto123',
        cargoId: 'cargo123',
        vagasPrevistas: '5',
        dataInicioControle: '2025-01-01',
        tipoControle: 'diario',
        motivo: 'Criação de nova vaga'
      };

      await controller.createVaga(mockRequest, mockResponse);

      expect(mockQuadroService.createQuadroLotacao).toHaveBeenCalledWith(
        {
          id: 'quadro123',
          planoVagasId: 'plano123',
          postoTrabalhoId: 'posto123',
          cargoId: 'cargo123',
          vagasPrevistas: 5,
          dataInicioControle: new Date('2025-01-01'),
          tipoControle: 'diario',
          cargoVaga: undefined,
          observacoes: undefined
        },
        {
          userId: 'user123',
          userName: 'Test User',
          motivo: 'Criação de nova vaga'
        }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuadro.toJSON(),
        message: 'Vaga criada com sucesso'
      });
    });

    it('should handle uniqueness validation error', async () => {
      (mockQuadroService.createQuadroLotacao as Mock).mockRejectedValue(
        new Error('Já existe uma vaga para este cargo no posto de trabalho especificado')
      );

      mockRequest.body = {
        id: 'quadro123',
        planoVagasId: 'plano123',
        postoTrabalhoId: 'posto123',
        cargoId: 'cargo123',
        vagasPrevistas: '5',
        dataInicioControle: '2025-01-01'
      };

      await controller.createVaga(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Já existe uma vaga para este cargo no posto de trabalho especificado'
      });
    });
  });

  describe('updateVaga', () => {
    it('should update vagas previstas successfully', async () => {
      const mockUpdatedQuadro = new QuadroLotacaoModel(
        'quadro123',
        'plano123',
        'posto123',
        'cargo123',
        10,
        5,
        0,
        new Date('2025-01-01'),
        'diario'
      );

      (mockQuadroService.updateVagasPrevistas as Mock).mockResolvedValue(mockUpdatedQuadro);

      mockRequest.params = { id: 'quadro123' };
      mockRequest.body = {
        vagasPrevistas: '10',
        motivo: 'Aumento de vagas'
      };

      await controller.updateVaga(mockRequest, mockResponse);

      expect(mockQuadroService.updateVagasPrevistas).toHaveBeenCalledWith(
        'quadro123',
        10,
        {
          userId: 'user123',
          userName: 'Test User',
          motivo: 'Aumento de vagas'
        }
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedQuadro.toJSON(),
        message: 'Vaga atualizada com sucesso'
      });
    });
  });

  describe('deleteVaga', () => {
    it('should soft delete vaga successfully', async () => {
      const mockDeletedQuadro = new QuadroLotacaoModel(
        'quadro123',
        'plano123',
        'posto123',
        'cargo123',
        5,
        0,
        0,
        new Date('2025-01-01'),
        'diario',
        false // ativo = false after soft delete
      );

      (mockQuadroService.softDeleteQuadro as Mock).mockResolvedValue(mockDeletedQuadro);

      mockRequest.params = { id: 'quadro123' };
      mockRequest.body = {
        motivo: 'Vaga não é mais necessária'
      };

      await controller.deleteVaga(mockRequest, mockResponse);

      expect(mockQuadroService.softDeleteQuadro).toHaveBeenCalledWith(
        'quadro123',
        {
          userId: 'user123',
          userName: 'Test User',
          motivo: 'Vaga não é mais necessária'
        }
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDeletedQuadro.toJSON(),
        message: 'Vaga excluída com sucesso'
      });
    });
  });

  describe('getOccupancyStats', () => {
    it('should return occupancy statistics', async () => {
      const mockStats = {
        totalVagasPrevistas: 100,
        totalVagasEfetivas: 85,
        totalVagasReservadas: 10,
        taxaOcupacao: 85,
        vagasDisponiveis: 5
      };

      (mockQuadroService.getOccupancyStats as Mock).mockResolvedValue(mockStats);

      mockRequest.params = { planoVagasId: 'plano123' };

      await controller.getOccupancyStats(mockRequest, mockResponse);

      expect(mockQuadroService.getOccupancyStats).toHaveBeenCalledWith('plano123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        message: 'Estatísticas de ocupação recuperadas'
      });
    });
  });

  describe('admitirColaborador', () => {
    it('should admit colaborador successfully', async () => {
      const mockUpdatedQuadro = new QuadroLotacaoModel(
        'quadro123',
        'plano123',
        'posto123',
        'cargo123',
        5,
        3, // increased from 2 to 3
        0,
        new Date('2025-01-01'),
        'diario'
      );

      (mockQuadroService.admitirColaborador as Mock).mockResolvedValue(mockUpdatedQuadro);

      mockRequest.params = { id: 'quadro123' };
      mockRequest.body = {
        motivo: 'Nova admissão'
      };

      await controller.admitirColaborador(mockRequest, mockResponse);

      expect(mockQuadroService.admitirColaborador).toHaveBeenCalledWith(
        'quadro123',
        {
          userId: 'user123',
          userName: 'Test User',
          motivo: 'Nova admissão'
        }
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedQuadro.toJSON(),
        message: 'Colaborador admitido com sucesso'
      });
    });
  });
});