import { QuadroLotacao } from '../types/index.js';

export class QuadroLotacaoModel {
  constructor(
    public id: string,
    public planoVagasId: string,
    public postoTrabalhoId: string,
    public cargoId: string,
    public vagasPrevistas: number,
    public vagasEfetivas: number = 0,
    public vagasReservadas: number = 0,
    public dataInicioControle: Date,
    public tipoControle: 'diario' | 'competencia' = 'diario',
    public ativo: boolean = true,
    public cargoVaga?: string,
    public observacoes?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): QuadroLotacaoModel {
    return new QuadroLotacaoModel(
      row.id,
      row.plano_vagas_id,
      row.posto_trabalho_id,
      row.cargo_id,
      parseInt(row.vagas_previstas),
      parseInt(row.vagas_efetivas),
      parseInt(row.vagas_reservadas),
      new Date(row.data_inicio_controle),
      row.tipo_controle,
      row.ativo,
      row.cargo_vaga,
      row.observacoes,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      plano_vagas_id: this.planoVagasId,
      posto_trabalho_id: this.postoTrabalhoId,
      cargo_id: this.cargoId,
      cargo_vaga: this.cargoVaga,
      vagas_previstas: this.vagasPrevistas,
      vagas_efetivas: this.vagasEfetivas,
      vagas_reservadas: this.vagasReservadas,
      data_inicio_controle: this.dataInicioControle,
      tipo_controle: this.tipoControle,
      observacoes: this.observacoes,
      ativo: this.ativo,
      updated_at: new Date()
    };
  }

  toJSON(): QuadroLotacao {
    return {
      id: this.id,
      planoVagasId: this.planoVagasId,
      postoTrabalhoId: this.postoTrabalhoId,
      cargoId: this.cargoId,
      cargoVaga: this.cargoVaga,
      vagasPrevistas: this.vagasPrevistas,
      vagasEfetivas: this.vagasEfetivas,
      vagasReservadas: this.vagasReservadas,
      dataInicioControle: this.dataInicioControle,
      tipoControle: this.tipoControle,
      observacoes: this.observacoes,
      ativo: this.ativo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!this.planoVagasId || this.planoVagasId.trim().length === 0) {
      errors.push('ID do plano de vagas é obrigatório');
    }

    if (!this.postoTrabalhoId || this.postoTrabalhoId.trim().length === 0) {
      errors.push('ID do posto de trabalho é obrigatório');
    }

    if (!this.cargoId || this.cargoId.trim().length === 0) {
      errors.push('ID do cargo é obrigatório');
    }

    if (this.vagasPrevistas < 0) {
      errors.push('Vagas previstas não pode ser negativo');
    }

    if (this.vagasEfetivas < 0) {
      errors.push('Vagas efetivas não pode ser negativo');
    }

    if (this.vagasReservadas < 0) {
      errors.push('Vagas reservadas não pode ser negativo');
    }

    if (!this.dataInicioControle) {
      errors.push('Data de início do controle é obrigatória');
    }

    if (!['diario', 'competencia'].includes(this.tipoControle)) {
      errors.push('Tipo de controle deve ser: diario ou competencia');
    }

    return errors;
  }

  getVagasDisponiveis(): number {
    return Math.max(0, this.vagasPrevistas - this.vagasEfetivas - this.vagasReservadas);
  }

  getTaxaOcupacao(): number {
    if (this.vagasPrevistas === 0) return 0;
    return (this.vagasEfetivas / this.vagasPrevistas) * 100;
  }

  hasDeficit(): boolean {
    return this.vagasEfetivas > this.vagasPrevistas;
  }

  getDeficit(): number {
    return Math.max(0, this.vagasEfetivas - this.vagasPrevistas);
  }

  isFull(): boolean {
    return this.vagasEfetivas >= this.vagasPrevistas;
  }

  canAddColaborador(): boolean {
    return this.getVagasDisponiveis() > 0;
  }

  addColaborador(): void {
    if (!this.canAddColaborador()) {
      throw new Error('Não há vagas disponíveis');
    }
    this.vagasEfetivas++;
    this.updatedAt = new Date();
  }

  removeColaborador(): void {
    if (this.vagasEfetivas <= 0) {
      throw new Error('Não há colaboradores para remover');
    }
    this.vagasEfetivas--;
    this.updatedAt = new Date();
  }

  addReserva(): void {
    if (this.getVagasDisponiveis() <= 0) {
      throw new Error('Não há vagas disponíveis para reserva');
    }
    this.vagasReservadas++;
    this.updatedAt = new Date();
  }

  removeReserva(): void {
    if (this.vagasReservadas <= 0) {
      throw new Error('Não há reservas para remover');
    }
    this.vagasReservadas--;
    this.updatedAt = new Date();
  }

  updateVagasPrevistas(novasVagas: number): void {
    if (novasVagas < 0) {
      throw new Error('Vagas previstas não pode ser negativo');
    }
    this.vagasPrevistas = novasVagas;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.ativo = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.ativo = false;
    this.updatedAt = new Date();
  }

  updateObservacoes(observacoes: string): void {
    this.observacoes = observacoes;
    this.updatedAt = new Date();
  }

  isControlActive(date: Date = new Date()): boolean {
    return date >= this.dataInicioControle && this.ativo;
  }
}