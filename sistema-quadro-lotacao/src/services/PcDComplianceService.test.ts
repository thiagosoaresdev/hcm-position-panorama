import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PcDComplianceService } from './PcDComplianceService.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';

describe('PcDComplianceService', () => {
  let pcdService: PcDComplianceService;
  let mockAuditService: AuditService;
  let mockNotificationService: NotificationService;

  beforeEach(() => {
    mockAuditService = {
      logAction: vi.fn().mockResolvedValue(undefined)
    } as any;

    mockNotificationService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
      sendInApp: vi.fn().mockResolvedValue(undefined)
    } as any;

    pcdService = new PcDComplianceService(mockAuditService, mockNotificationService);
  });

  describe('calculateCompliance', () => {
    it('should calculate 2% for companies with 50-200 employees', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 2 // 2 PcD
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(100);
      expect(result.totalPcD).toBe(2);
      expect(result.percentualObrigatorio).toBe(2);
      expect(result.quantidadeObrigatoria).toBe(2);
      expect(result.deficit).toBe(0);
      expect(result.conforme).toBe(true);
      expect(result.faixaLei).toBe('50-200 colaboradores (2%)');
    });

    it('should calculate 3% for companies with 201-500 employees', async () => {
      const colaboradores = Array.from({ length: 300 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 8 // 8 PcD (menos que os 9 obrigatórios)
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(300);
      expect(result.totalPcD).toBe(8);
      expect(result.percentualObrigatorio).toBe(3);
      expect(result.quantidadeObrigatoria).toBe(9); // Math.ceil(300 * 3 / 100)
      expect(result.deficit).toBe(1);
      expect(result.conforme).toBe(false);
      expect(result.faixaLei).toBe('201-500 colaboradores (3%)');
    });

    it('should calculate 4% for companies with 501-1000 employees', async () => {
      const colaboradores = Array.from({ length: 750 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 30 // 30 PcD
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(750);
      expect(result.totalPcD).toBe(30);
      expect(result.percentualObrigatorio).toBe(4);
      expect(result.quantidadeObrigatoria).toBe(30); // Math.ceil(750 * 4 / 100)
      expect(result.deficit).toBe(0);
      expect(result.conforme).toBe(true);
      expect(result.faixaLei).toBe('501-1000 colaboradores (4%)');
    });

    it('should calculate 5% for companies with >1000 employees', async () => {
      const colaboradores = Array.from({ length: 1200 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 60 // 60 PcD
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(1200);
      expect(result.totalPcD).toBe(60);
      expect(result.percentualObrigatorio).toBe(5);
      expect(result.quantidadeObrigatoria).toBe(60); // Math.ceil(1200 * 5 / 100)
      expect(result.deficit).toBe(0);
      expect(result.conforme).toBe(true);
      expect(result.faixaLei).toBe('>1000 colaboradores (5%)');
    });

    it('should return 0% for companies with <50 employees', async () => {
      const colaboradores = Array.from({ length: 30 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          false
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(30);
      expect(result.percentualObrigatorio).toBe(0);
      expect(result.quantidadeObrigatoria).toBe(0);
      expect(result.conforme).toBe(true);
      expect(result.faixaLei).toBe('Não aplicável (< 50 colaboradores)');
    });

    it('should only count active employees', async () => {
      const colaboradores = [
        new ColaboradorModel('1', 'Ativo PcD', '123.456.789-01', 'cargo1', 'cc1', 'manhã', new Date('2020-01-01'), true, 'ativo'),
        new ColaboradorModel('2', 'Ativo Normal', '123.456.789-02', 'cargo1', 'cc1', 'manhã', new Date('2020-01-01'), false, 'ativo'),
        new ColaboradorModel('3', 'Inativo PcD', '123.456.789-03', 'cargo1', 'cc1', 'manhã', new Date('2020-01-01'), true, 'inativo'),
        ...Array.from({ length: 97 }, (_, i) => 
          new ColaboradorModel(
            `emp_${i + 4}`,
            `Colaborador ${i + 4}`,
            `123.456.789-${(i + 4).toString().padStart(2, '0')}`,
            'cargo1',
            'cc1',
            'manhã',
            new Date('2020-01-01'),
            false,
            'ativo'
          )
        )
      ];

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.totalColaboradores).toBe(99); // Apenas ativos
      expect(result.totalPcD).toBe(1); // Apenas o ativo PcD
    });

    it('should round up the required quantity', async () => {
      // 101 colaboradores * 2% = 2.02 -> deve arredondar para 3
      const colaboradores = Array.from({ length: 101 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 2 // 2 PcD (menos que os 3 obrigatórios)
        )
      );

      const result = await pcdService.calculateCompliance('empresa1', colaboradores);

      expect(result.quantidadeObrigatoria).toBe(3); // Math.ceil(101 * 2 / 100)
      expect(result.deficit).toBe(1);
      expect(result.conforme).toBe(false);
    });
  });

  describe('monitorCompliance', () => {
    it('should generate deficit alert for non-compliant companies', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 1 // Apenas 1 PcD, precisa de 2
        )
      );

      const alerts = await pcdService.monitorCompliance('empresa1', colaboradores);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].tipo).toBe('deficit');
      expect(alerts[0].prioridade).toBe('media');
      expect(alerts[0].mensagem).toContain('Déficit de 1 colaboradores PcD');
    });

    it('should generate critical alert for high deficit', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          false // Nenhum PcD, precisa de 2
        )
      );

      const alerts = await pcdService.monitorCompliance('empresa1', colaboradores);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].tipo).toBe('deficit');
      expect(alerts[0].prioridade).toBe('critica'); // 100% de déficit
    });

    it('should generate risk alert for companies at the limit', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 3 // 3 PcD (1 a mais que o obrigatório)
        )
      );

      const alerts = await pcdService.monitorCompliance('empresa1', colaboradores);

      expect(alerts).toHaveLength(2); // Conformidade + Risco
      const riskAlert = alerts.find(a => a.tipo === 'risco');
      expect(riskAlert).toBeDefined();
      expect(riskAlert?.prioridade).toBe('media');
      expect(riskAlert?.mensagem).toContain('Margem de apenas 1 colaborador');
    });

    it('should generate compliance alert for compliant companies', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 5 // 5 PcD (bem acima do obrigatório)
        )
      );

      const alerts = await pcdService.monitorCompliance('empresa1', colaboradores);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].tipo).toBe('conformidade');
      expect(alerts[0].prioridade).toBe('baixa');
      expect(alerts[0].mensagem).toContain('Empresa em conformidade');
    });
  });

  describe('projectCompliance', () => {
    it('should project future compliance based on scenarios', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 2 // 2 PcD atuais
        )
      );

      const cenarios = {
        novasContratacoes: 50,
        novasContratacoesPcD: 2,
        desligamentos: 10,
        desligamentosPcD: 0
      };

      const projection = await pcdService.projectCompliance('empresa1', colaboradores, cenarios);

      expect(projection.totalColaboradores).toBe(140); // 100 + 50 - 10
      expect(projection.totalPcD).toBe(4); // 2 + 2 - 0
      expect(projection.percentualObrigatorio).toBe(2); // Ainda na faixa 50-200
      expect(projection.quantidadeObrigatoria).toBe(3); // Math.ceil(140 * 2 / 100)
      expect(projection.conforme).toBe(true); // 4 >= 3
    });
  });

  describe('updatePcDStatus', () => {
    it('should update PcD status with audit trail', async () => {
      const colaborador = new ColaboradorModel(
        '1',
        'João Silva',
        '123.456.789-01',
        'cargo1',
        'cc1',
        'manhã',
        new Date('2020-01-01'),
        false
      );

      await pcdService.updatePcDStatus(colaborador, true, 'user1', 'Documentação apresentada', ['doc1.pdf']);

      expect(colaborador.pcd).toBe(true);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entidadeId: '1',
          entidadeTipo: 'colaborador',
          acao: 'marcar_pcd',
          usuarioId: 'user1',
          motivo: 'Documentação apresentada'
        })
      );
    });

    it('should validate PcD status before updating', async () => {
      const colaborador = new ColaboradorModel(
        '1',
        'João Silva',
        '123.456.789-01',
        'cargo1',
        'cc1',
        'manhã',
        new Date('2020-01-01'),
        false,
        'inativo' // Colaborador inativo
      );

      await expect(
        pcdService.updatePcDStatus(colaborador, true, 'user1', 'Teste')
      ).rejects.toThrow('Colaborador deve estar ativo');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate complete compliance report', async () => {
      const colaboradores = Array.from({ length: 100 }, (_, i) => 
        new ColaboradorModel(
          `emp_${i}`,
          `Colaborador ${i}`,
          `123.456.789-${i.toString().padStart(2, '0')}`,
          'cargo1',
          'cc1',
          'manhã',
          new Date('2020-01-01'),
          i < 2 // 2 PcD
        )
      );

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await pcdService.generateComplianceReport('empresa1', colaboradores, startDate, endDate);

      expect(report.empresaId).toBe('empresa1');
      expect(report.periodo.inicio).toEqual(startDate);
      expect(report.periodo.fim).toEqual(endDate);
      expect(report.compliance).toBeDefined();
      expect(report.alertas).toBeDefined();
      expect(report.recomendacoes).toBeDefined();
      expect(report.geradoEm).toBeInstanceOf(Date);
    });
  });
});