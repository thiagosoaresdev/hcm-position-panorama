import { Pool } from 'pg';
import { QuadroLotacaoRepository, EmpresaRepository } from '../repositories/index.js';
import { QuadroLotacaoModel, EmpresaModel } from '../models/index.js';

export class QuadroLotacaoService {
  private quadroRepository: QuadroLotacaoRepository;
  private empresaRepository: EmpresaRepository;

  constructor(pool: Pool) {
    this.quadroRepository = new QuadroLotacaoRepository(pool);
    this.empresaRepository = new EmpresaRepository(pool);
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
    auditContext: { userId: string; userName: string; motivo?: string }
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

    // Save to database
    return await this.quadroRepository.create(quadro, auditContext);
  }

  async updateVagasPrevistas(
    quadroId: string,
    novasVagas: number,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<QuadroLotacaoModel> {
    const quadro = await this.quadroRepository.findById(quadroId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    // Check if reduction would create deficit
    if (novasVagas < quadro.vagasEfetivas) {
      const deficit = quadro.vagasEfetivas - novasVagas;
      throw new Error(
        `Redução não permitida: resultaria em déficit de ${deficit} vagas. ` +
        `Vagas efetivas atuais: ${quadro.vagasEfetivas}, Vagas solicitadas: ${novasVagas}`
      );
    }

    quadro.updateVagasPrevistas(novasVagas);
    return await this.quadroRepository.update(quadroId, quadro, auditContext);
  }

  async admitirColaborador(
    quadroId: string,
    auditContext: { userId: string; userName: string; motivo?: string }
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

    quadro.addColaborador();
    return await this.quadroRepository.update(quadroId, quadro, auditContext);
  }

  async desligarColaborador(
    quadroId: string,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<QuadroLotacaoModel> {
    const quadro = await this.quadroRepository.findById(quadroId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    quadro.removeColaborador();
    return await this.quadroRepository.update(quadroId, quadro, auditContext);
  }

  async getOccupancyStats(planoVagasId: string): Promise<{
    totalVagasPrevistas: number;
    totalVagasEfetivas: number;
    totalVagasReservadas: number;
    taxaOcupacao: number;
    vagasDisponiveis: number;
  }> {
    const stats = await this.quadroRepository.getOccupancyStats(planoVagasId);
    
    return {
      ...stats,
      vagasDisponiveis: Math.max(0, stats.totalVagasPrevistas - stats.totalVagasEfetivas - stats.totalVagasReservadas)
    };
  }

  async getQuadrosWithDeficit(planoVagasId: string): Promise<QuadroLotacaoModel[]> {
    return await this.quadroRepository.findWithDeficit(planoVagasId);
  }

  async getQuadrosAvailable(planoVagasId: string): Promise<QuadroLotacaoModel[]> {
    return await this.quadroRepository.findAvailable(planoVagasId);
  }

  async calculatePcDCompliance(empresaId: string): Promise<{
    totalColaboradores: number;
    totalPcD: number;
    percentualAtual: number;
    percentualObrigatorio: number;
    conformidade: boolean;
    vagasPcDNecessarias: number;
  }> {
    // This would typically query colaboradores table
    // For now, returning a mock calculation structure
    const totalColaboradores = 150; // This would come from database
    const totalPcD = 4; // This would come from database
    
    let percentualObrigatorio: number;
    if (totalColaboradores >= 50 && totalColaboradores <= 200) {
      percentualObrigatorio = 2;
    } else if (totalColaboradores >= 201 && totalColaboradores <= 500) {
      percentualObrigatorio = 3;
    } else if (totalColaboradores >= 501 && totalColaboradores <= 1000) {
      percentualObrigatorio = 4;
    } else if (totalColaboradores > 1000) {
      percentualObrigatorio = 5;
    } else {
      percentualObrigatorio = 0; // Less than 50 employees
    }

    const vagasPcDObrigatorias = Math.ceil((totalColaboradores * percentualObrigatorio) / 100);
    const percentualAtual = totalColaboradores > 0 ? (totalPcD / totalColaboradores) * 100 : 0;
    const conformidade = totalPcD >= vagasPcDObrigatorias;
    const vagasPcDNecessarias = Math.max(0, vagasPcDObrigatorias - totalPcD);

    return {
      totalColaboradores,
      totalPcD,
      percentualAtual,
      percentualObrigatorio,
      conformidade,
      vagasPcDNecessarias
    };
  }

  async softDeleteQuadro(
    quadroId: string,
    auditContext: { userId: string; userName: string; motivo?: string }
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

    return await this.quadroRepository.softDelete(quadroId, auditContext);
  }
}