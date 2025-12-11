import { CentroCusto } from '../types/index.js';

export class CentroCustoModel {
  constructor(
    public id: string,
    public empresaId: string,
    public codigo: string,
    public nome: string,
    public hierarquia: string,
    public ativo: boolean = true,
    public responsavel?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): CentroCustoModel {
    return new CentroCustoModel(
      row.id,
      row.empresa_id,
      row.codigo,
      row.nome,
      row.hierarquia,
      row.ativo,
      row.responsavel,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      empresa_id: this.empresaId,
      codigo: this.codigo,
      nome: this.nome,
      hierarquia: this.hierarquia,
      ativo: this.ativo,
      responsavel: this.responsavel,
      updated_at: new Date()
    };
  }

  toJSON(): CentroCusto {
    return {
      id: this.id,
      empresaId: this.empresaId,
      codigo: this.codigo,
      nome: this.nome,
      hierarquia: this.hierarquia,
      ativo: this.ativo,
      responsavel: this.responsavel,
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

    if (!this.hierarquia || this.hierarquia.trim().length === 0) {
      errors.push('Hierarquia é obrigatória');
    }

    if (this.hierarquia && this.hierarquia.length > 500) {
      errors.push('Hierarquia deve ter no máximo 500 caracteres');
    }

    if (this.responsavel && this.responsavel.length > 200) {
      errors.push('Responsável deve ter no máximo 200 caracteres');
    }

    return errors;
  }

  getHierarchyLevel(): number {
    return this.hierarquia.split('/').length;
  }

  getParentHierarchy(): string | null {
    const parts = this.hierarquia.split('/');
    if (parts.length <= 1) {
      return null;
    }
    return parts.slice(0, -1).join('/');
  }

  isChildOf(parent: CentroCustoModel): boolean {
    return this.hierarquia.startsWith(parent.hierarquia + '/');
  }

  isParentOf(child: CentroCustoModel): boolean {
    return child.hierarquia.startsWith(this.hierarquia + '/');
  }

  activate(): void {
    this.ativo = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.ativo = false;
    this.updatedAt = new Date();
  }

  updateResponsavel(responsavel: string): void {
    this.responsavel = responsavel;
    this.updatedAt = new Date();
  }

  updateHierarchy(newHierarchy: string): void {
    this.hierarquia = newHierarchy;
    this.updatedAt = new Date();
  }
}