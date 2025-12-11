import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { WebhookController, WebhookConfig, WebhookPayload } from './WebhookController.js';
import crypto from 'crypto';

/**
 * Integration tests for WebhookController
 * Tests the complete webhook processing flow with real database operations
 */
describe('WebhookController Integration Tests', () => {
  let pool: Pool;
  let webhookController: WebhookController;
  let webhookConfig: WebhookConfig;

  beforeAll(async () => {
    // Setup test database connection
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'quadro_lotacao_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    webhookConfig = {
      secretKey: 'test-secret-key',
      retryAttempts: 2,
      retryDelayMs: 100,
      maxRetryDelayMs: 500
    };

    webhookController = new WebhookController(pool, webhookConfig);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Webhook Signature Validation', () => {
    it('should validate webhook signatures correctly', () => {
      const payload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'test_001',
          nome: 'Test User',
          cpf: '123.456.789-00',
          cargo_id: 'test_cargo',
          centro_custo_id: 'test_centro',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      const validSignature = crypto
        .createHmac('sha256', webhookConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      const headers = {
        'x-webhook-signature': `sha256=${validSignature}`
      };

      // Access private method for testing
      const isValid = (webhookController as any).validateWebhookSignature(headers, payload);
      expect(isValid).toBe(true);

      // Test invalid signature
      const invalidHeaders = {
        'x-webhook-signature': 'sha256=invalid-signature'
      };

      const isInvalid = (webhookController as any).validateWebhookSignature(invalidHeaders, payload);
      expect(isInvalid).toBe(false);
    });

    it('should reject webhooks without signature', () => {
      const payload = { test: 'data' };
      const headers = {};

      const isValid = (webhookController as any).validateWebhookSignature(headers, payload);
      expect(isValid).toBe(false);
    });
  });

  describe('Payload Validation', () => {
    it('should validate admission payload correctly', () => {
      const validPayload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'test_001',
          nome: 'Test User',
          cpf: '123.456.789-00',
          cargo_id: 'test_cargo',
          centro_custo_id: 'test_centro',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
        }
      };

      const errors = (webhookController as any).validateAdmissaoPayload(validPayload);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidPayload: WebhookPayload = {
        event_type: 'colaborador.admitido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: '',
          nome: '',
          cpf: '',
          cargo_id: '',
          centro_custo_id: '',
          turno: '',
          data_admissao: '',
          pcd: 'invalid' as any,
          status: 'invalid' as any
        }
      };

      const errors = (webhookController as any).validateAdmissaoPayload(invalidPayload);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('colaborador_id é obrigatório');
      expect(errors).toContain('nome é obrigatório');
      expect(errors).toContain('cpf é obrigatório');
    });

    it('should validate transfer payload with additional fields', () => {
      const transferPayload: WebhookPayload = {
        event_type: 'colaborador.transferido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'test_001',
          nome: 'Test User',
          cpf: '123.456.789-00',
          cargo_id: 'test_cargo',
          centro_custo_id: 'test_centro_new',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo',
          centro_custo_anterior: 'test_centro_old'
        }
      };

      const errors = (webhookController as any).validateTransferenciaPayload(transferPayload);
      expect(errors).toHaveLength(0);
    });

    it('should require centro_custo_anterior for transfers', () => {
      const invalidTransferPayload: WebhookPayload = {
        event_type: 'colaborador.transferido',
        timestamp: new Date().toISOString(),
        data: {
          colaborador_id: 'test_001',
          nome: 'Test User',
          cpf: '123.456.789-00',
          cargo_id: 'test_cargo',
          centro_custo_id: 'test_centro_new',
          turno: 'integral',
          data_admissao: '2025-01-15',
          pcd: false,
          status: 'ativo'
          // Missing centro_custo_anterior
        }
      };

      const errors = (webhookController as any).validateTransferenciaPayload(invalidTransferPayload);
      expect(errors).toContain('centro_custo_anterior é obrigatório para transferência');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const mockRequest = {} as any;
      const mockResponse = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      } as any;

      await webhookController.healthCheck(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'webhook-controller',
        version: '1.0.0'
      });
    });
  });

  describe('Cargo Discrepancy Detection', () => {
    it('should detect when no quadro exists for the position', async () => {
      const event = {
        colaboradorId: 'test_001',
        nome: 'Test User',
        cpf: '123.456.789-00',
        cargoId: 'nonexistent_cargo',
        centroCustoId: 'nonexistent_centro',
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
          colaborador_id: event.colaboradorId,
          nome: event.nome,
          cpf: event.cpf,
          cargo_id: event.cargoId,
          centro_custo_id: event.centroCustoId,
          turno: event.turno,
          data_admissao: event.dataAdmissao.toISOString(),
          pcd: event.pcd,
          status: event.status
        }
      };

      // This should not throw an error but handle gracefully
      const result = await (webhookController as any).handleCargoDiscrepancy(event, payload);
      
      expect(result).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Create a webhook controller with invalid pool to simulate connection error
      const invalidPool = new Pool({
        host: 'invalid-host',
        port: 9999,
        database: 'invalid-db',
        user: 'invalid-user',
        password: 'invalid-password',
        connectionTimeoutMillis: 100
      });

      const errorWebhookController = new WebhookController(invalidPool, webhookConfig);

      const event = {
        colaboradorId: 'test_001',
        nome: 'Test User',
        cpf: '123.456.789-00',
        cargoId: 'test_cargo',
        centroCustoId: 'test_centro',
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
          colaborador_id: event.colaboradorId,
          nome: event.nome,
          cpf: event.cpf,
          cargo_id: event.cargoId,
          centro_custo_id: event.centroCustoId,
          turno: event.turno,
          data_admissao: event.dataAdmissao.toISOString(),
          pcd: event.pcd,
          status: event.status
        }
      };

      // Should handle error gracefully and default to 'bloquear'
      const result = await (errorWebhookController as any).handleCargoDiscrepancy(event, payload);
      
      expect(result.action).toBe('bloquear');
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Error processing cargo discrepancy');

      await invalidPool.end();
    });
  });
});