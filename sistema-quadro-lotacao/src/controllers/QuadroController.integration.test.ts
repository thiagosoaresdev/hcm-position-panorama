import { describe, it, expect } from 'vitest';
import { QuadroController } from './QuadroController.js';
import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';

describe('QuadroController Integration', () => {
  it('should create controller instance', () => {
    const mockPool = {} as any;
    const controller = new QuadroController(mockPool);
    
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(QuadroController);
  });

  it('should validate QuadroLotacaoModel integration', () => {
    const quadro = new QuadroLotacaoModel(
      'test-id',
      'plano-id',
      'posto-id',
      'cargo-id',
      5,
      0,
      0,
      new Date('2025-01-01'),
      'diario'
    );

    expect(quadro.validate()).toEqual([]);
    expect(quadro.getVagasDisponiveis()).toBe(5);
    expect(quadro.getTaxaOcupacao()).toBe(0);
    expect(quadro.canAddColaborador()).toBe(true);
  });

  it('should validate business rules in model', () => {
    const quadro = new QuadroLotacaoModel(
      'test-id',
      'plano-id',
      'posto-id',
      'cargo-id',
      5,
      3,
      1,
      new Date('2025-01-01'),
      'diario'
    );

    expect(quadro.getVagasDisponiveis()).toBe(1); // 5 - 3 - 1 = 1
    expect(quadro.getTaxaOcupacao()).toBe(60); // 3/5 * 100 = 60%
    expect(quadro.hasDeficit()).toBe(false);
    expect(quadro.canAddColaborador()).toBe(true);
  });

  it('should handle deficit scenario', () => {
    const quadro = new QuadroLotacaoModel(
      'test-id',
      'plano-id',
      'posto-id',
      'cargo-id',
      5,
      7, // more than planned
      0,
      new Date('2025-01-01'),
      'diario'
    );

    expect(quadro.hasDeficit()).toBe(true);
    expect(quadro.getDeficit()).toBe(2); // 7 - 5 = 2
    expect(quadro.getTaxaOcupacao()).toBe(140); // 7/5 * 100 = 140%
    expect(quadro.canAddColaborador()).toBe(false);
  });
});