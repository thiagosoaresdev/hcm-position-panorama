import { Cargo } from '../types/index.js';

export class CargoModel {
  constructor(
    public id: string,
    public nome: string,
    public estrutura: string,
    public classe: string,
    public nivel: string,
    public ativo: boolean = true,
    public percentual?: number,
    public descricao?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): CargoModel {
    return new CargoModel(
      row.id,
      row.nome,
      row.estrutura,
      row.classe,
      row.nivel,
      row.ativo,
      row.percentual ? parseFloat(row.percentual) : undefined,
      row.descricao,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      nome: this.nome,
      estrutura: this.estrutura,
      classe: this.classe,
      nivel: this.nivel,
      ativo: this.ativo,
      percentual: this.percentual,
      descricao: this.descricao,
      updated_at: new Date()
    };
  }

  toJSON(): Cargo {
    return {
      id: this.id,
      nome: this.nome,
      estrutura: this.estrutura,
      classe: this.classe,
      nivel: this.nivel,
      percentual: this.percentual,
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

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome && this.nome.length > 200) {
      errors.push('Nome deve ter no máximo 200 caracteres');
    }

    if (!this.estrutura || this.estrutura.trim().length === 0) {
      errors.push('Estrutura é obrigatória');
    }

    if (this.estrutura && this.estrutura.length > 100) {
      errors.push('Estrutura deve ter no máximo 100 caracteres');
    }

    if (!this.classe || this.classe.trim().length === 0) {
      errors.push('Classe é obrigatória');
    }

    if (this.classe && this.classe.length > 50) {
      errors.push('Classe deve ter no máximo 50 caracteres');
    }

    if (!this.nivel || this.nivel.trim().length === 0) {
      errors.push('Nível é obrigatório');
    }

    if (this.nivel && this.nivel.length > 50) {
      errors.push('Nível deve ter no máximo 50 caracteres');
    }

    if (this.percentual !== undefined && (this.percentual < 0 || this.percentual > 100)) {
      errors.push('Percentual deve estar entre 0 e 100');
    }

    return errors;
  }

  getFullDescription(): string {
    return `${this.nome} - ${this.estrutura} - ${this.classe} - ${this.nivel}`;
  }

  activate(): void {
    this.ativo = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.ativo = false;
    this.updatedAt = new Date();
  }

  updatePercentual(percentual: number): void {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }
    this.percentual = percentual;
    this.updatedAt = new Date();
  }

  isManagement(): boolean {
    return this.nivel.toLowerCase().includes('gerente') || 
           this.nivel.toLowerCase().includes('diretor') ||
           this.nivel.toLowerCase().includes('coordenador');
  }

  isSeniorLevel(): boolean {
    return this.nivel.toLowerCase().includes('senior') ||
           this.nivel.toLowerCase().includes('sênior') ||
           this.nivel.toLowerCase().includes('especialista');
  }

  isJuniorLevel(): boolean {
    return this.nivel.toLowerCase().includes('junior') ||
           this.nivel.toLowerCase().includes('júnior') ||
           this.nivel.toLowerCase().includes('trainee') ||
           this.nivel.toLowerCase().includes('estagiário');
  }
}