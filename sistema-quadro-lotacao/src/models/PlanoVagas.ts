import { PlanoVagas } from '../types/index.js';

export class PlanoVagasModel {
  constructor(
    public id: string,
    public empresaId: string,
    public nome: string,
    public dataInicio: Date,
    public dataFim: Date,
    public status: 'ativo' | 'inativo' | 'planejado' = 'planejado',
    public descricao?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): PlanoVagasModel {
    return new PlanoVagasModel(
      row.id,
      row.empresa_id,
      row.nome,
      new Date(row.data_inicio),
      new Date(row.data_fim),
      row.status,
      row.descricao,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      empresa_id: this.empresaId,
      nome: this.nome,
      data_inicio: this.dataInicio,
      data_fim: this.dataFim,
      status: this.status,
      descricao: this.descricao,
      updated_at: new Date()
    };
  }

  toJSON(): PlanoVagas {
    return {
      id: this.id,
      empresaId: this.empresaId,
      nome: this.nome,
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
      status: this.status,
      descricao: this.descricao,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!this.empresaId || this.empresaId.trim().length === 0) {
      errors.push('ID da empresa é obrigatório');
    }

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome && this.nome.length > 200) {
      errors.push('Nome deve ter no máximo 200 caracteres');
    }

    if (!this.dataInicio) {
      errors.push('Data de início é obrigatória');
    }

    if (!this.dataFim) {
      errors.push('Data de fim é obrigatória');
    }

    if (this.dataInicio && this.dataFim && this.dataInicio >= this.dataFim) {
      errors.push('Data de fim deve ser posterior à data de início');
    }

    if (!['ativo', 'inativo', 'planejado'].includes(this.status)) {
      errors.push('Status deve ser: ativo, inativo ou planejado');
    }

    return errors;
  }

  isActive(): boolean {
    return this.status === 'ativo';
  }

  isInPeriod(date: Date): boolean {
    return date >= this.dataInicio && date <= this.dataFim;
  }

  activate(): void {
    this.status = 'ativo';
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = 'inativo';
    this.updatedAt = new Date();
  }

  getDurationInDays(): number {
    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canOverlapWith(other: PlanoVagasModel): boolean {
    // Two plans can't be active at the same time for the same company
    if (this.empresaId === other.empresaId && 
        this.status === 'ativo' && 
        other.status === 'ativo') {
      return false;
    }

    // Check date overlap
    return !(this.dataFim < other.dataInicio || this.dataInicio > other.dataFim);
  }
}