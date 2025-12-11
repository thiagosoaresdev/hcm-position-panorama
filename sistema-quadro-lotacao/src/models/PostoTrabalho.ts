import { PostoTrabalho } from '../types/index.js';

export class PostoTrabalhoModel {
  constructor(
    public id: string,
    public centroCustoId: string,
    public codigo: string,
    public nome: string,
    public ativo: boolean = true,
    public descricao?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): PostoTrabalhoModel {
    return new PostoTrabalhoModel(
      row.id,
      row.centro_custo_id,
      row.codigo,
      row.nome,
      row.ativo,
      row.descricao,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      centro_custo_id: this.centroCustoId,
      codigo: this.codigo,
      nome: this.nome,
      ativo: this.ativo,
      descricao: this.descricao,
      updated_at: new Date()
    };
  }

  toJSON(): PostoTrabalho {
    return {
      id: this.id,
      centroCustoId: this.centroCustoId,
      codigo: this.codigo,
      nome: this.nome,
      descricao: this.descricao,
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

    if (!this.centroCustoId || this.centroCustoId.trim().length === 0) {
      errors.push('ID do centro de custo é obrigatório');
    }

    if (!this.codigo || this.codigo.trim().length === 0) {
      errors.push('Código é obrigatório');
    }

    if (this.codigo && this.codigo.length > 50) {
      errors.push('Código deve ter no máximo 50 caracteres');
    }

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome && this.nome.length > 200) {
      errors.push('Nome deve ter no máximo 200 caracteres');
    }

    return errors;
  }

  getFullName(): string {
    return `${this.codigo} - ${this.nome}`;
  }

  activate(): void {
    this.ativo = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.ativo = false;
    this.updatedAt = new Date();
  }

  updateDescription(descricao: string): void {
    this.descricao = descricao;
    this.updatedAt = new Date();
  }

  belongsTo(centroCustoId: string): boolean {
    return this.centroCustoId === centroCustoId;
  }
}