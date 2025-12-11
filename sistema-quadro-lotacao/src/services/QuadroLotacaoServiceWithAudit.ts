import type { Pool } from 'pg';
import { QuadroLotacaoRepository } from '../repositories/index.js';
import { QuadroLotacaoModel } from '../models/index.js';
import { AuditService, type AuditContext } from './AuditService.js';
import { AuditUtils } from './AuditUtils.js';

/**
 * Enhanced QuadroLotacaoService with integrated audit logging
 * Demonstrates how to integrate the audit service with business logic
 */
export class QuadroLotacaoServiceWithAudit {
  private quadroRepository: QuadroLotacaoRepository;
  private auditService: AuditService;

  constructor(pool: Pool) {
    this.quadroRepository = new QuadroLotacaoRepository(pool);
    this.auditService = new AuditService(pool);
  }

  async createQuadroLotacao(
    quadroData: {
      id: string;
      planoVagasId: string;
      postoTrabalhoId: string;
      cargoId: string;
      vagasPrevistas: number;
      dataInicioControle: Date;
      tipoControle?: 'diario' | 'competencia';
      cargoVaga?: string;
      observacoes?: string;
    },
    auditContext: AuditContext
  ): Promise<QuadroLotacaoModel> {
    // Validate uniqueness
    const exists = await this.quadroRepository.existsForPlanoPostoCargo(
      quadroData.planoVagasId,
      quadroData.postoTrabalhoId,
      quadroData.cargoId
    );

    if (exists) {
      throw new Error('Já existe uma vaga para este cargo no posto de trabalho especificado');
    }

    // Create model
    const quadro = new QuadroLotacaoModel(
      quadroData.id,
      quadroData.planoVagasId,
      quadroData.postoTrabalhoId,
      quadroData.cargoId,
      quadroData.vagasPrevistas,
      0, // vagas efetivas start at 0
      0, // vagas reservadas start at 0
      quadroData.dataInicioControle,
      quadroData.tipoControle || 'diario',
      true,
      quadroData.cargoVaga,
      quadroData.observacoes
    );

    // Validate model
    const errors = quadro.validate();
    if (errors.length > 0) {
      throw new Error(`Dados inválidos: ${errors.join(', ')}`);
    }

    // Execute with audit context
    return await this.auditService.withAuditContext(auditContext, async () => {
      // Save to database
      const createdQuadro = await this.quadroRepository.create(quadro, auditContext);
      
      // Log the creation
      await this.auditService.logCreate(
        createdQuadro.id,
        'QuadroLotacao',
        {
          ...auditContext,
          motivo: auditContext.motivo || AuditUtils.generateMotivo('Criação', 'Quadro de Lotação')
        },
        AuditUtils.sanitizeAuditData(createdQuadro.toJSON())
      );

      return createdQuadro;
    });
  }

  async updateVagasPrevistas(
    quadroId: string,
    novasVagas: number,
    auditContext: AuditContext
  ): Promise<QuadroLotacaoModel> {
    const quadro = await this.quadroRepository.findById(quadroId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    // Store original values for audit
    const valoresAntes = AuditUtils.sanitizeAuditData(quadro.toJSON());

    // Check if reduction would create deficit
    if (novasVagas < quadro.vagasEfetivas) {
      const deficit = quadro.vagasEfetivas - novasVagas;
      throw new Error(
        `Redução não permitida: resultaria em déficit de ${deficit} vagas. ` +
        `Vagas efetivas atuais: ${quadro.vagasEfetivas}, Vagas solicitadas: ${novasVagas}`
      );
    }

    const vagasAnteriores = quadro.vagasPrevistas;
    quadro.updateVagasPrevistas(novasVagas);

    // Execute with audit context
    return await this.auditService.withAuditContext(auditContext, async () => {
      const updatedQuadro = await this.quadroRepository.update(quadroId, quadro, auditContext);
      
      // Log the update
      const valoresDepois = AuditUtils.sanitizeAuditData(updatedQuadro.toJSON());
      await this.auditService.logUpdate(
        updatedQuadro.id,
        'QuadroLotacao',
        {
          ...auditContext,
          motivo: auditContext.motivo || `Atualização de vagas previstas: ${vagasAnteriores} → ${novasVagas}`
        },
        valoresAntes,
        valoresDepois
      );

      return updatedQuadro;
    });
  }

  async admitirColaborador(
    quadroId: string,
    colaboradorData: {
      id: string;
      nome: string;
      cpf: string;
      cargoId: string;
    },
    auditContext: AuditContext
  ): Promise<QuadroLotacaoModel> {
    const quadro = await this.quadroRepository.findById(quadroId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    if (!quadro.canAddColaborador()) {
      throw new Error(
        `Não há vagas disponíveis. ` +
        `Previstas: ${quadro.vagasPrevistas}, ` +
        `Efetivas: ${quadro.vagasEfetivas}, ` +
        `Reservadas: ${quadro.vagasReservadas}`
      );
    }

    const valoresAntes = AuditUtils.sanitizeAuditData(quadro.toJSON());
    quadro.addColaborador();

    // Execute with audit context
    return await this.auditService.withAuditContext(auditContext, async () => {
      const updatedQuadro = await this.quadroRepository.update(quadroId, quadro, auditContext);
      
      // Log the admission
      const valoresDepois = AuditUtils.sanitizeAuditData(updatedQuadro.toJSON());
      await this.auditService.logUpdate(
        updatedQuadro.id,
        'QuadroLotacao',
        {
          ...auditContext,
          motivo: auditContext.motivo || `Admissão de colaborador: ${colaboradorData.nome} (${colaboradorData.cpf})`
        },
        valoresAntes,
        valoresDepois
      );

      return updatedQuadro;
    });
  }

  async softDeleteQuadro(
    quadroId: string,
    auditContext: AuditContext
  ): Promise<QuadroLotacaoModel> {
    const quadro = await this.quadroRepository.findById(quadroId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    if (quadro.vagasEfetivas > 0) {
      throw new Error(
        `Não é possível excluir quadro com colaboradores ativos. ` +
        `Vagas efetivas: ${quadro.vagasEfetivas}`
      );
    }

    const valoresAntes = AuditUtils.sanitizeAuditData(quadro.toJSON());

    // Execute with audit context
    return await this.auditService.withAuditContext(auditContext, async () => {
      const deletedQuadro = await this.quadroRepository.softDelete(quadroId, auditContext);
      
      // Log the deletion
      await this.auditService.logDelete(
        deletedQuadro.id,
        'QuadroLotacao',
        {
          ...auditContext,
          motivo: auditContext.motivo || 'Exclusão de quadro de lotação'
        },
        valoresAntes
      );

      return deletedQuadro;
    });
  }

  /**
   * Get complete audit trail for a quadro de lotação
   */
  async getQuadroAuditTrail(quadroId: string) {
    return await this.auditService.getAuditTrail(quadroId, 'QuadroLotacao');
  }

  /**
   * Get audit summary for a quadro de lotação
   */
  async getQuadroAuditSummary(quadroId: string) {
    return await this.auditService.getEntityAuditSummary(quadroId, 'QuadroLotacao');
  }

  /**
   * Validate audit integrity for a quadro de lotação
   */
  async validateQuadroAuditIntegrity(quadroId: string) {
    return await this.auditService.validateAuditIntegrity(quadroId, 'QuadroLotacao');
  }
}