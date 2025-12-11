import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { AuditService, type AuditContext } from './AuditService.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { AuditLogModel } from '../models/AuditLog.js';

// Mock the dependencies
vi.mock('pg');
vi.mock('../repositories/AuditLogRepository.js');
vi.mock('../models/AuditLog.js');

describe('AuditService', () => {
  let auditService: AuditService;
  let mockPool: Pool;
  let mockRepository: AuditLogRepository;
  let mockAuditContext: AuditContext;

  beforeEach(() => {
    mockPool = vi.mocked(new Pool());
    mockRepository = new AuditLogRepository(mockPool);
    auditService = new AuditService(mockPool);
    
    mockAuditContext = {
      userId: 'user123',
      userName: 'João Silva',
      motivo: 'Teste de auditoria',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session123'
    };

    // Mock repository methods
    vi.mocked(mockRepository.create).mockResolvedValue(new AuditLogModel(
      'audit123',
      'entity123',
      'QuadroLotacao',
      'create',
      'user123',
      'João Silva'
    ));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logAction', () => {
    it('should create audit log with complete information', async () => {
      const valoresAntes = { vagas: 5 };
      const valoresDepois = { vagas: 8 };

      const result = await auditService.logAction(
        'entity123',
        'QuadroLotacao',
        'update',
        mockAuditContext,
        valoresAntes,
        valoresDepois
      );

      expect(result).toBeInstanceOf(AuditLogModel);
      expect(result.entidadeId).toBe('entity123');
      expect(result.entidadeTipo).toBe('QuadroLotacao');
      expect(result.acao).toBe('update');
      expect(result.usuarioId).toBe('user123');
      expect(result.usuarioNome).toBe('João Silva');
    });

    it('should validate audit log before saving', async () => {
      const invalidContext = { ...mockAuditContext, userId: '' };

      await expect(
        auditService.logAction('entity123', 'QuadroLotacao', 'update', invalidContext)
      ).rejects.toThrow('Erro na validação do log de auditoria');
    });
  });

  describe('logCreate', () => {
    it('should log entity creation', async () => {
      const valoresDepois = { id: 'entity123', nome: 'Nova Entidade' };

      const result = await auditService.logCreate(
        'entity123',
        'QuadroLotacao',
        mockAuditContext,
        valoresDepois
      );

      expect(result.acao).toBe('create');
      expect(result.valoresDepois).toEqual(valoresDepois);
      expect(result.valoresAntes).toBeUndefined();
    });
  });

  describe('logUpdate', () => {
    it('should log entity update with before and after values', async () => {
      const valoresAntes = { vagas: 5, ativo: true };
      const valoresDepois = { vagas: 8, ativo: true };

      const result = await auditService.logUpdate(
        'entity123',
        'QuadroLotacao',
        mockAuditContext,
        valoresAntes,
        valoresDepois
      );

      expect(result.acao).toBe('update');
      expect(result.valoresAntes).toEqual(valoresAntes);
      expect(result.valoresDepois).toEqual(valoresDepois);
    });
  });

  describe('logDelete', () => {
    it('should log entity deletion', async () => {
      const valoresAntes = { id: 'entity123', nome: 'Entidade Deletada' };

      const result = await auditService.logDelete(
        'entity123',
        'QuadroLotacao',
        mockAuditContext,
        valoresAntes
      );

      expect(result.acao).toBe('delete');
      expect(result.valoresAntes).toEqual(valoresAntes);
      expect(result.valoresDepois).toBeUndefined();
    });
  });

  describe('logApproval', () => {
    it('should log approval with approver information', async () => {
      const result = await auditService.logApproval(
        'proposta123',
        'Proposta',
        mockAuditContext,
        'approver456',
        'Aprovado conforme análise'
      );

      expect(result.acao).toBe('approve');
      expect(result.aprovadorId).toBe('approver456');
      expect(result.motivo).toBe('Aprovado conforme análise');
    });
  });

  describe('logRejection', () => {
    it('should log rejection with approver information', async () => {
      const result = await auditService.logRejection(
        'proposta123',
        'Proposta',
        mockAuditContext,
        'approver456',
        'Rejeitado por falta de documentação'
      );

      expect(result.acao).toBe('reject');
      expect(result.aprovadorId).toBe('approver456');
      expect(result.motivo).toBe('Rejeitado por falta de documentação');
    });
  });

  describe('logSystemAction', () => {
    it('should log automated system actions', async () => {
      const result = await auditService.logSystemAction(
        'quadro123',
        'QuadroLotacao',
        'normalizacao',
        'Normalização automática via webhook RH Legado'
      );

      expect(result.usuarioId).toBe('sistema');
      expect(result.usuarioNome).toBe('Sistema Automático');
      expect(result.acao).toBe('normalizacao');
      expect(result.motivo).toBe('Normalização automática via webhook RH Legado');
    });
  });
});