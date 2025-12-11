import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropostaController } from './PropostaController.js';
import { PropostaService } from '../services/PropostaService.js';
import { PropostaModel } from '../models/Proposta.js';
import type { Pool } from 'pg';

// Mock the PropostaService
vi.mock('../services/PropostaService.js');

describe('PropostaController', () => {
  let controller: PropostaController;
  let mockPool: Pool;
  let mockPropostaService: any;

  beforeEach(() => {
    mockPool = {} as Pool;
    controller = new PropostaController(mockPool);
    mockPropostaService = vi.mocked(PropostaService.prototype);
  });

  describe('createProposta', () => {
    it('should create proposta successfully', async () => {
      const mockProposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento da nova vaga',
        'user-1',
        'quadro-1',
        'rascunho',
        undefined,
        'Analista',
        undefined,
        2,
        undefined,
        'R$ 10.000',
        'Impacto positivo',
        [],
        new Date(),
        new Date()
      );

      mockPropostaService.createProposta = vi.fn().mockResolvedValue(mockProposta);

      const mockReq = {
        body: {
          tipo: 'inclusao',
          descricao: 'Nova vaga',
          detalhamento: 'Detalhamento da nova vaga',
          solicitanteId: 'user-1',
          quadroLotacaoId: 'quadro-1',
          cargoNovo: 'Analista',
          vagasSolicitadas: '2',
          impactoOrcamentario: 'R$ 10.000',
          analiseImpacto: 'Impacto positivo'
        },
        user: {
          id: 'user-1',
          nome: 'Test User'
        },
        params: {},
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.createProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposta.toJSON(),
        message: 'Proposta criada com sucesso'
      });
    });

    it('should handle validation errors', async () => {
      mockPropostaService.createProposta = vi.fn().mockRejectedValue(
        new Error('Dados inválidos: Descrição é obrigatória')
      );

      const mockReq = {
        body: {
          tipo: 'inclusao',
          descricao: '', // Invalid empty description
          detalhamento: 'Detalhamento da nova vaga',
          quadroLotacaoId: 'quadro-1'
        },
        user: {
          id: 'user-1',
          nome: 'Test User'
        },
        params: {},
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.createProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Dados inválidos: Descrição é obrigatória'
      });
    });

    it('should handle not found errors', async () => {
      mockPropostaService.createProposta = vi.fn().mockRejectedValue(
        new Error('Quadro de lotação não encontrado')
      );

      const mockReq = {
        body: {
          tipo: 'inclusao',
          descricao: 'Nova vaga',
          detalhamento: 'Detalhamento da nova vaga',
          quadroLotacaoId: 'invalid-quadro'
        },
        user: {
          id: 'user-1',
          nome: 'Test User'
        },
        params: {},
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.createProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Quadro de lotação não encontrado'
      });
    });
  });

  describe('approveProposta', () => {
    it('should approve proposta successfully', async () => {
      const mockProposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento da nova vaga',
        'user-1',
        'quadro-1',
        'nivel_2', // Moved to next level
        undefined,
        'Analista',
        undefined,
        2,
        undefined,
        'R$ 10.000',
        'Impacto positivo',
        [],
        new Date(),
        new Date()
      );

      mockPropostaService.approveProposta = vi.fn().mockResolvedValue(mockProposta);

      const mockReq = {
        params: { id: 'prop-1' },
        body: {
          aprovadorId: 'approver-1',
          comentario: 'Aprovado'
        },
        user: {
          id: 'approver-1',
          nome: 'Approver User'
        },
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.approveProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposta.toJSON(),
        message: 'Proposta aprovada com sucesso'
      });
    });

    it('should handle unauthorized approval', async () => {
      mockPropostaService.approveProposta = vi.fn().mockRejectedValue(
        new Error('Usuário não autorizado para esta aprovação')
      );

      const mockReq = {
        params: { id: 'prop-1' },
        body: {
          aprovadorId: 'unauthorized-user',
          comentario: 'Tentativa de aprovação'
        },
        user: {
          id: 'unauthorized-user',
          nome: 'Unauthorized User'
        },
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.approveProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Usuário não autorizado para esta aprovação'
      });
    });
  });

  describe('rejectProposta', () => {
    it('should reject proposta successfully', async () => {
      const mockProposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento da nova vaga',
        'user-1',
        'quadro-1',
        'rascunho', // Returned to draft
        undefined,
        'Analista',
        undefined,
        2,
        undefined,
        'R$ 10.000',
        'Impacto positivo',
        [],
        new Date(),
        new Date()
      );

      mockPropostaService.rejectProposta = vi.fn().mockResolvedValue(mockProposta);

      const mockReq = {
        params: { id: 'prop-1' },
        body: {
          aprovadorId: 'approver-1',
          comentario: 'Precisa de mais informações',
          motivo: 'Informações insuficientes'
        },
        user: {
          id: 'approver-1',
          nome: 'Approver User'
        },
        query: {}
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.rejectProposta(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposta.toJSON(),
        message: 'Proposta rejeitada com sucesso'
      });
    });
  });

  describe('listPropostas', () => {
    it('should list propostas with filters', async () => {
      const mockPropostas = [
        new PropostaModel(
          'prop-1',
          'inclusao',
          'Nova vaga 1',
          'Detalhamento 1',
          'user-1',
          'quadro-1',
          'rascunho'
        ),
        new PropostaModel(
          'prop-2',
          'alteracao',
          'Alteração vaga 2',
          'Detalhamento 2',
          'user-2',
          'quadro-2',
          'nivel_1'
        )
      ];

      mockPropostaService.listPropostas = vi.fn().mockResolvedValue(mockPropostas);

      const mockReq = {
        params: {},
        body: {},
        query: {
          status: 'rascunho',
          tipo: 'inclusao'
        },
        user: {
          id: 'user-1',
          nome: 'Test User'
        }
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.listPropostas(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPropostas.map(p => p.toJSON()),
        message: '2 propostas encontradas'
      });
    });
  });

  describe('getPendingPropostas', () => {
    it('should get pending propostas for approver', async () => {
      const mockPropostas = [
        new PropostaModel(
          'prop-1',
          'inclusao',
          'Nova vaga 1',
          'Detalhamento 1',
          'user-1',
          'quadro-1',
          'nivel_1'
        )
      ];

      mockPropostaService.getPendingPropostasForApprover = vi.fn().mockResolvedValue(mockPropostas);

      const mockReq = {
        params: {},
        body: {},
        query: {},
        user: {
          id: 'approver-1',
          nome: 'Approver User'
        }
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.getPendingPropostas(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPropostas.map(p => p.toJSON()),
        message: '1 propostas pendentes encontradas'
      });
    });

    it('should handle unauthenticated user', async () => {
      const mockReq = {
        params: {},
        body: {},
        query: {},
        user: undefined // No authenticated user
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      await controller.getPendingPropostas(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Usuário não autenticado'
      });
    });
  });
});