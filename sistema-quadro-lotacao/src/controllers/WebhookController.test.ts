import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Pool } from 'pg';
import { WebhookController, type WebhookPayload, type WebhookConfig } from './WebhookController.js';
import type { Request, Response } from 'express';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../services/NormalizacaoService.js');
vi.mock('../services/AuditService.js');
vi.mock('../services/NotificationService.js');
vi.mock('../services/PropostaService.js');
vi.mock('../repositories/EmpresaRepository.js');
vi.mock('../repositories/QuadroLotacaoRepository.js');

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let mockPool: Pool;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let webhookConfig: WebhookConfig;

  beforeEach(() => {
    // Setup mock pool
    mockPool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn(),
        release: vi.fn()
      }),
      query: vi.fn()
    } as any;

    // Setup webhook config
    webhookConfig = {
      secretKey: 'test-secret-key',
      retryAttempts: 3,
      retryDelayMs: 100,
      maxRetryDelayMs: 1000
    };

    webhookController = new WebhookController(mockPool, webhookConfig);

    // Setup mock request and response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleColaboradorAdmitido', () => {
    it('should process valid admission webhook successfully', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      // Mock successful processing
      vi.spyOn(webhookController as any, 'handleCargoDiscrepancy').mockResolvedValue({
        action: 'permitir',
        allowed: true,
        message: 'No discrepancy detected',
        requiresApproval: false
      });

      vi.spyOn(webhookController as any, 'processWithRetry').mockResolvedValue(undefined);

      await webhookController.handleColaboradorAdmitido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        acknowledged: true,
        message: 'Admission processed successfully',
        colaborador_id: 'col_001'
      });
    });

    it('should reject webhook with invalid signature', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': 'invalid-signature'
        }
      };

      await webhookController.handleColaboradorAdmitido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid webhook signature',
        acknowledged: false
      });
    });

    it('should handle cargo discrepancy with BLOQUEAR action', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      // Mock cargo discrepancy with BLOQUEAR action
      vi.spyOn(webhookController as any, 'handleCargoDiscrepancy').mockResolvedValue({
        action: 'bloquear',
        allowed: false,
        message: 'Admission blocked due to cargo discrepancy',
        requiresApproval: false
      });

      await webhookController.handleColaboradorAdmitido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cargo discrepancy detected',
        message: 'Admission blocked due to cargo discrepancy',
        action: 'bloquear',
        acknowledged: false,
        colaborador_id: 'col_001',
        proposta_id: undefined
      });
    });

    it('should handle cargo discrepancy with EXIGIR_APROVACAO action', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      // Mock cargo discrepancy with EXIGIR_APROVACAO action
      vi.spyOn(webhookController as any, 'handleCargoDiscrepancy').mockResolvedValue({
        action: 'exigir_aprovacao',
        allowed: false,
        message: 'Proposal created for approval',
        requiresApproval: true,
        propostaId: 'prop_001'
      });

      await webhookController.handleColaboradorAdmitido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cargo discrepancy detected',
        message: 'Proposal created for approval',
        action: 'exigir_aprovacao',
        acknowledged: false,
        colaborador_id: 'col_001',
        proposta_id: 'prop_001'
      });
    });

    it('should validate required payload fields', async () => {
      const invalidPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          // Missing required fields
          nome: '',
          cpf: '',
          cargo_id: '',
          centro_custo_id: '',
          turno: '',
          data_admissao: '',
          pcd: 'invalid',
          status: 'invalid'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(invalidPayload))
        .digest('hex');

      mockRequest = {
        body: invalidPayload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      await webhookController.handleColaboradorAdmitido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid payload',
          details: expect.arrayContaining([
            expect.stringContaining('nome é obrigatório'),
            expect.stringContaining('cpf é obrigatório'),
            expect.stringContaining('cargo_id é obrigatório')
          ]),
          acknowledged: false
        })
      );
    });
  });

  describe('handleColaboradorTransferido', () => {
    it('should process valid transfer webhook successfully', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.transferido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo',
          centro_custo_anterior: 'cc_rh',
          cargo_anterior: 'cargo_analista',
          data_evento: '2025-01-20'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      vi.spyOn(webhookController as any, 'processWithRetry').mockResolvedValue(undefined);

      await webhookController.handleColaboradorTransferido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        acknowledged: true,
        message: 'Transfer processed successfully',
        colaborador_id: 'col_001'
      });
    });

    it('should require centro_custo_anterior for transfer', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.transferido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
          // Missing centro_custo_anterior
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      await webhookController.handleColaboradorTransferido(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid payload',
          details: expect.arrayContaining([
            'centro_custo_anterior é obrigatório para transferência'
          ]),
          acknowledged: false
        })
      );
    });
  });

  describe('handleColaboradorDesligado', () => {
    it('should process valid termination webhook successfully', async () => {
      const payload: WebhookPayload = {
        event_type: 'colaborador.desligado',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          data_desligamento: '2025-01-30',
          pcd: false,
          status: 'inativo'
        }
      };

      const signature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      mockRequest = {
        body: payload,
        headers: {
          'x-webhook-signature': `sha256=${signature}`
        }
      };

      vi.spyOn(webhookController as any, 'processWithRetry').mockResolvedValue(undefined);

      await webhookController.handleColaboradorDesligado(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        acknowledged: true,
        message: 'Termination processed successfully',
        colaborador_id: 'col_001'
      });
    });
  });

  describe('processWithRetry', () => {
    it('should retry failed operations with exponential backoff', async () => {
      const event = {
        colaboradorId: 'col_001',
        nome: 'João Silva',
        cpf: '123.456.789-00',
        cargoId: 'cargo_dev_junior',
        centroCustoId: 'cc_ti',
        turno: 'integral',
        dataAdmissao: new Date(),
        pcd: false,
        status: 'ativo' as const,
        eventType: 'admissao' as const
      };

      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      // Mock normalization service to fail twice then succeed
      const mockNormalizacaoService = {
        processColaboradorEvent: vi.fn()
          .mockRejectedValueOnce(new Error('Database connection failed'))
          .mockRejectedValueOnce(new Error('Temporary error'))
          .mockResolvedValueOnce(undefined)
      };

      (webhookController as any).normalizacaoService = mockNormalizacaoService;

      // Mock audit service
      const mockAuditService = {
        logAction: vi.fn().mockResolvedValue(undefined)
      };
      (webhookController as any).auditService = mockAuditService;

      // Call processWithRetry directly
      await (webhookController as any).processWithRetry(event, payload);

      // Should have been called 3 times (2 failures + 1 success)
      expect(mockNormalizacaoService.processColaboradorEvent).toHaveBeenCalledTimes(3);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'webhook_retry'
        })
      );
    });

    it('should throw error after max retry attempts', async () => {
      const event = {
        colaboradorId: 'col_001',
        nome: 'João Silva',
        cpf: '123.456.789-00',
        cargoId: 'cargo_dev_junior',
        centroCustoId: 'cc_ti',
        turno: 'integral',
        dataAdmissao: new Date(),
        pcd: false,
        status: 'ativo' as const,
        eventType: 'admissao' as const
      };

      const payload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'col_001',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          cargo_id: 'cargo_dev_junior',
          centro_custo_id: 'cc_ti',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      // Mock normalization service to always fail
      const mockNormalizacaoService = {
        processColaboradorEvent: vi.fn().mockRejectedValue(new Error('Persistent error'))
      };

      (webhookController as any).normalizacaoService = mockNormalizacaoService;

      // Mock audit service
      const mockAuditService = {
        logAction: vi.fn().mockResolvedValue(undefined)
      };
      (webhookController as any).auditService = mockAuditService;

      // Should throw after max attempts
      await expect(
        (webhookController as any).processWithRetry(event, payload)
      ).rejects.toThrow('Persistent error');

      // Should have been called max retry attempts times
      expect(mockNormalizacaoService.processColaboradorEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockRequest = {};

      await webhookController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'webhook-controller',
        version: '1.0.0'
      });
    });
  });
});