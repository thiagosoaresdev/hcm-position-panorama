import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropostaService } from './PropostaService.js';
import { PropostaModel } from '../models/Proposta.js';
import type { Pool } from 'pg';

// Mock the dependencies
vi.mock('../repositories/PropostaRepository.js');
vi.mock('../repositories/AprovacaoRepository.js');
vi.mock('../repositories/QuadroLotacaoRepository.js');
vi.mock('./AuditService.js');

describe('PropostaService', () => {
  let propostaService: PropostaService;
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {} as Pool;
    propostaService = new PropostaService(mockPool);
  });

  describe('createProposta', () => {
    it('should create a new proposta with valid data', async () => {
      // Mock the repository methods
      const mockQuadro = { id: 'quadro-1', vagasPrevistas: 5 };
      const mockCreatedProposta = new PropostaModel(
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

      // Mock repository methods
      vi.spyOn(propostaService['quadroRepository'], 'findById').mockResolvedValue(mockQuadro as any);
      vi.spyOn(propostaService['propostaRepository'], 'create').mockResolvedValue(mockCreatedProposta);
      vi.spyOn(propostaService['auditService'], 'logAction').mockResolvedValue({} as any);

      const request = {
        tipo: 'inclusao' as const,
        descricao: 'Nova vaga',
        detalhamento: 'Detalhamento da nova vaga',
        solicitanteId: 'user-1',
        quadroLotacaoId: 'quadro-1',
        cargoNovo: 'Analista',
        vagasSolicitadas: 2,
        impactoOrcamentario: 'R$ 10.000',
        analiseImpacto: 'Impacto positivo'
      };

      const auditContext = {
        userId: 'user-1',
        userName: 'Test User',
        motivo: 'Test creation'
      };

      const result = await propostaService.createProposta(request, auditContext);

      expect(result).toBeDefined();
      expect(result.tipo).toBe('inclusao');
      expect(result.descricao).toBe('Nova vaga');
      expect(result.status).toBe('rascunho');
    });

    it('should throw error when quadro not found', async () => {
      vi.spyOn(propostaService['quadroRepository'], 'findById').mockResolvedValue(null);

      const request = {
        tipo: 'inclusao' as const,
        descricao: 'Nova vaga',
        detalhamento: 'Detalhamento da nova vaga',
        solicitanteId: 'user-1',
        quadroLotacaoId: 'invalid-quadro'
      };

      const auditContext = {
        userId: 'user-1',
        userName: 'Test User'
      };

      await expect(propostaService.createProposta(request, auditContext))
        .rejects.toThrow('Quadro de lotação não encontrado');
    });

    it('should validate proposta data', async () => {
      const mockQuadro = { id: 'quadro-1', vagasPrevistas: 5 };
      vi.spyOn(propostaService['quadroRepository'], 'findById').mockResolvedValue(mockQuadro as any);

      const request = {
        tipo: 'inclusao' as const,
        descricao: '', // Invalid empty description
        detalhamento: 'Detalhamento da nova vaga',
        solicitanteId: 'user-1',
        quadroLotacaoId: 'quadro-1'
      };

      const auditContext = {
        userId: 'user-1',
        userName: 'Test User'
      };

      await expect(propostaService.createProposta(request, auditContext))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('submitProposta', () => {
    it('should submit proposta for approval', async () => {
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

      const updatedProposta = { ...mockProposta, status: 'nivel_1' as const };

      vi.spyOn(propostaService['propostaRepository'], 'findById').mockResolvedValue(mockProposta);
      vi.spyOn(propostaService['propostaRepository'], 'update').mockResolvedValue(updatedProposta as any);
      vi.spyOn(propostaService['aprovacaoRepository'], 'createWorkflowAprovacoes').mockResolvedValue([]);
      vi.spyOn(propostaService['auditService'], 'logAction').mockResolvedValue({} as any);

      const workflowConfig = {
        niveis: [
          { ordem: 1, nome: 'Coordenação', aprovadores: ['coord-1'] },
          { ordem: 2, nome: 'Gerência', aprovadores: ['gerente-1'] },
          { ordem: 3, nome: 'Diretoria', aprovadores: ['diretor-1'] }
        ],
        incluirRH: true
      };

      const auditContext = {
        userId: 'user-1',
        userName: 'Test User'
      };

      const result = await propostaService.submitProposta('prop-1', workflowConfig, auditContext);

      expect(result.status).toBe('nivel_1');
    });

    it('should throw error when proposta cannot be submitted', async () => {
      const mockProposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento da nova vaga',
        'user-1',
        'quadro-1',
        'aprovada', // Already approved, cannot submit
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

      vi.spyOn(propostaService['propostaRepository'], 'findById').mockResolvedValue(mockProposta);

      const workflowConfig = {
        niveis: [{ ordem: 1, nome: 'Coordenação', aprovadores: ['coord-1'] }],
        incluirRH: false
      };

      const auditContext = {
        userId: 'user-1',
        userName: 'Test User'
      };

      await expect(propostaService.submitProposta('prop-1', workflowConfig, auditContext))
        .rejects.toThrow('Proposta não pode ser enviada para aprovação');
    });
  });

  describe('workflow state transitions', () => {
    it('should validate workflow state transitions', () => {
      const proposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento',
        'user-1',
        'quadro-1',
        'rascunho'
      );

      expect(proposta.canSubmit()).toBe(true);
      expect(proposta.canEdit()).toBe(true);
      expect(proposta.canApprove()).toBe(false);

      proposta.submit();
      expect(proposta.status).toBe('nivel_1');
      expect(proposta.canEdit()).toBe(false);
      expect(proposta.canApprove()).toBe(true);
    });

    it('should handle rejection correctly', () => {
      const proposta = new PropostaModel(
        'prop-1',
        'inclusao',
        'Nova vaga',
        'Detalhamento',
        'user-1',
        'quadro-1',
        'nivel_1'
      );

      expect(proposta.canReject()).toBe(true);

      proposta.reject();
      expect(proposta.status).toBe('rascunho');
      expect(proposta.canEdit()).toBe(true);
    });
  });
});