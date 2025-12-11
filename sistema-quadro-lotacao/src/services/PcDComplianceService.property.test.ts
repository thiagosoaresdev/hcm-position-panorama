import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PcDComplianceService } from './PcDComplianceService.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';

/**
 * **Feature: sistema-quadro-lotacao, Property 8: PcD Compliance Calculation**
 * Property-based tests for PcD compliance calculation following Lei 8.213
 */
describe('PcDComplianceService - Property Tests', () => {
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

  /**
   * **Feature: sistema-quadro-lotacao, Property 8: PcD Compliance Calculation**
   * Property: For any company with a given number of employees, when calculating PcD compliance, 
   * then the system should apply the correct percentage according to Lei 8.213 
   * (2% for 50-200, 3% for 201-500, 4% for 501-1000, 5% for >1000)
   * **Validates: Requirements 5.1**
   */
  it('should apply correct Lei 8.213 percentages for any number of employees', async () => {
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 0, max: 2000 }), // Total employees
      fc.integer({ min: 0, max: 100 }), // Number of PcD employees (will be capped by total)
      async (totalEmployees, pcdCount) => {
        // Ensure PcD count doesn't exceed total employees
        const actualPcdCount = Math.min(pcdCount, totalEmployees);
        
        // Generate colaboradores
        const colaboradores = Array.from({ length: totalEmployees }, (_, i) => 
          new ColaboradorModel(
            `emp_${i}`,
            `Colaborador ${i}`,
            `123.456.789-${i.toString().padStart(2, '0')}`,
            'cargo1',
            'cc1',
            'manhã',
            new Date('2020-01-01'),
            i < actualPcdCount, // First N are PcD
            'ativo'
          )
        );

        const result = await pcdService.calculateCompliance('empresa_test', colaboradores);

        // Verify total counts
        expect(result.totalColaboradores).toBe(totalEmployees);
        expect(result.totalPcD).toBe(actualPcdCount);

        // Verify Lei 8.213 percentage rules
        if (totalEmployees < 50) {
          expect(result.percentualObrigatorio).toBe(0);
          expect(result.quantidadeObrigatoria).toBe(0);
          expect(result.faixaLei).toBe('Não aplicável (< 50 colaboradores)');
        } else if (totalEmployees <= 200) {
          expect(result.percentualObrigatorio).toBe(2);
          expect(result.quantidadeObrigatoria).toBe(Math.ceil(totalEmployees * 2 / 100));
          expect(result.faixaLei).toBe('50-200 colaboradores (2%)');
        } else if (totalEmployees <= 500) {
          expect(result.percentualObrigatorio).toBe(3);
          expect(result.quantidadeObrigatoria).toBe(Math.ceil(totalEmployees * 3 / 100));
          expect(result.faixaLei).toBe('201-500 colaboradores (3%)');
        } else if (totalEmployees <= 1000) {
          expect(result.percentualObrigatorio).toBe(4);
          expect(result.quantidadeObrigatoria).toBe(Math.ceil(totalEmployees * 4 / 100));
          expect(result.faixaLei).toBe('501-1000 colaboradores (4%)');
        } else {
          expect(result.percentualObrigatorio).toBe(5);
          expect(result.quantidadeObrigatoria).toBe(Math.ceil(totalEmployees * 5 / 100));
          expect(result.faixaLei).toBe('>1000 colaboradores (5%)');
        }

        // Verify compliance calculation
        const expectedDeficit = Math.max(0, result.quantidadeObrigatoria - actualPcdCount);
        expect(result.deficit).toBe(expectedDeficit);
        expect(result.conforme).toBe(actualPcdCount >= result.quantidadeObrigatoria);

        // Verify percentage calculation
        const expectedPercentual = totalEmployees > 0 ? (actualPcdCount / totalEmployees) * 100 : 0;
        expect(result.percentualAtual).toBeCloseTo(expectedPercentual, 2);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Quantity calculation should always round up (Math.ceil)
   */
  it('should always round up the required PcD quantity', async () => {
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 50, max: 1000 }), // Companies subject to Lei 8.213
      async (totalEmployees) => {
        const colaboradores = Array.from({ length: totalEmployees }, (_, i) => 
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

        const result = await pcdService.calculateCompliance('empresa_test', colaboradores);

        // Calculate expected quantity with Math.ceil
        const expectedQuantity = Math.ceil((totalEmployees * result.percentualObrigatorio) / 100);
        expect(result.quantidadeObrigatoria).toBe(expectedQuantity);

        // Verify it's always >= the exact calculation
        const exactCalculation = (totalEmployees * result.percentualObrigatorio) / 100;
        expect(result.quantidadeObrigatoria).toBeGreaterThanOrEqual(exactCalculation);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Only active employees should be counted
   */
  it('should only count active employees in compliance calculation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 50, max: 200 }),
      fc.integer({ min: 0, max: 50 }),
      fc.integer({ min: 0, max: 10 }),
      async (activeCount, inactiveCount, pcdActiveCount) => {
        const actualPcdActive = Math.min(pcdActiveCount, activeCount);
        
        const colaboradores = [
          // Active employees
          ...Array.from({ length: activeCount }, (_, i) => 
            new ColaboradorModel(
              `active_${i}`,
              `Ativo ${i}`,
              `123.456.789-${i.toString().padStart(2, '0')}`,
              'cargo1',
              'cc1',
              'manhã',
              new Date('2020-01-01'),
              i < actualPcdActive,
              'ativo'
            )
          ),
          // Inactive employees (should be ignored)
          ...Array.from({ length: inactiveCount }, (_, i) => 
            new ColaboradorModel(
              `inactive_${i}`,
              `Inativo ${i}`,
              `987.654.321-${i.toString().padStart(2, '0')}`,
              'cargo1',
              'cc1',
              'manhã',
              new Date('2020-01-01'),
              true, // All inactive are PcD, but should be ignored
              'inativo'
            )
          )
        ];

        const result = await pcdService.calculateCompliance('empresa_test', colaboradores);

        // Should only count active employees
        expect(result.totalColaboradores).toBe(activeCount);
        expect(result.totalPcD).toBe(actualPcdActive);

        // Compliance calculation should be based only on active employees
        if (activeCount >= 50) {
          const expectedPercentage = activeCount <= 200 ? 2 : 3;
          expect(result.percentualObrigatorio).toBe(expectedPercentage);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property: Deficit calculation should never be negative
   */
  it('should never have negative deficit', async () => {
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 50, max: 500 }),
      fc.integer({ min: 0, max: 100 }),
      async (totalEmployees, pcdCount) => {
        const actualPcdCount = Math.min(pcdCount, totalEmployees);
        
        const colaboradores = Array.from({ length: totalEmployees }, (_, i) => 
          new ColaboradorModel(
            `emp_${i}`,
            `Colaborador ${i}`,
            `123.456.789-${i.toString().padStart(2, '0')}`,
            'cargo1',
            'cc1',
            'manhã',
            new Date('2020-01-01'),
            i < actualPcdCount
          )
        );

        const result = await pcdService.calculateCompliance('empresa_test', colaboradores);

        // Deficit should never be negative
        expect(result.deficit).toBeGreaterThanOrEqual(0);
        
        // If we have more PcD than required, deficit should be 0
        if (actualPcdCount >= result.quantidadeObrigatoria) {
          expect(result.deficit).toBe(0);
          expect(result.conforme).toBe(true);
        } else {
          expect(result.deficit).toBe(result.quantidadeObrigatoria - actualPcdCount);
          expect(result.conforme).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });
});