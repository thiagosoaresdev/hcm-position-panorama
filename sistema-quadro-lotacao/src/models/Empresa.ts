import { Empresa, EmpresaConfiguracoes } from '../types/index.js';

export class EmpresaModel {
  constructor(
    public id: string,
    public nome: string,
    public cnpj: string,
    public ativo: boolean = true,
    public configuracoes?: EmpresaConfiguracoes,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): EmpresaModel {
    return new EmpresaModel(
      row.id,
      row.nome,
      row.cnpj,
      row.ativo,
      row.configuracoes,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      nome: this.nome,
      cnpj: this.cnpj,
      ativo: this.ativo,
      configuracoes: this.configuracoes ? JSON.stringify(this.configuracoes) : null,
      updated_at: new Date()
    };
  }

  toJSON(): Empresa {
    return {
      id: this.id,
      nome: this.nome,
      cnpj: this.cnpj,
      ativo: this.ativo,
      configuracoes: this.configuracoes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome && this.nome.length > 200) {
      errors.push('Nome deve ter no máximo 200 caracteres');
    }

    if (!this.cnpj || this.cnpj.trim().length === 0) {
      errors.push('CNPJ é obrigatório');
    }

    if (this.cnpj && !this.isValidCNPJ(this.cnpj)) {
      errors.push('CNPJ deve ter formato válido (XX.XXX.XXX/XXXX-XX)');
    }

    return errors;
  }

  private isValidCNPJ(cnpj: string): boolean {
    // Basic CNPJ format validation
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    return cnpjRegex.test(cnpj);
  }

  updateConfiguracoes(configuracoes: EmpresaConfiguracoes): void {
    this.configuracoes = configuracoes;
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
}