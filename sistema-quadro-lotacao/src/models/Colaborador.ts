import { Colaborador } from '../types/index.js';

export class ColaboradorModel {
  constructor(
    public id: string,
    public nome: string,
    public cpf: string,
    public cargoId: string,
    public centroCustoId: string,
    public turno: string,
    public dataAdmissao: Date,
    public pcd: boolean = false,
    public status: 'ativo' | 'inativo' = 'ativo',
    public dataDesligamento?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): ColaboradorModel {
    return new ColaboradorModel(
      row.id,
      row.nome,
      row.cpf,
      row.cargo_id,
      row.centro_custo_id,
      row.turno,
      new Date(row.data_admissao),
      row.pcd,
      row.status,
      row.data_desligamento ? new Date(row.data_desligamento) : undefined,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      nome: this.nome,
      cpf: this.cpf,
      cargo_id: this.cargoId,
      centro_custo_id: this.centroCustoId,
      turno: this.turno,
      pcd: this.pcd,
      data_admissao: this.dataAdmissao,
      data_desligamento: this.dataDesligamento,
      status: this.status,
      updated_at: new Date()
    };
  }

  toJSON(): Colaborador {
    return {
      id: this.id,
      nome: this.nome,
      cpf: this.cpf,
      cargoId: this.cargoId,
      centroCustoId: this.centroCustoId,
      turno: this.turno,
      pcd: this.pcd,
      dataAdmissao: this.dataAdmissao,
      dataDesligamento: this.dataDesligamento,
      status: this.status,
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

    if (!this.cpf || this.cpf.trim().length === 0) {
      errors.push('CPF é obrigatório');
    }

    if (this.cpf && !this.isValidCPF(this.cpf)) {
      errors.push('CPF deve ter formato válido (XXX.XXX.XXX-XX)');
    }

    if (!this.cargoId || this.cargoId.trim().length === 0) {
      errors.push('ID do cargo é obrigatório');
    }

    if (!this.centroCustoId || this.centroCustoId.trim().length === 0) {
      errors.push('ID do centro de custo é obrigatório');
    }

    if (!this.turno || this.turno.trim().length === 0) {
      errors.push('Turno é obrigatório');
    }

    if (!this.dataAdmissao) {
      errors.push('Data de admissão é obrigatória');
    }

    if (this.dataAdmissao && this.dataAdmissao > new Date()) {
      errors.push('Data de admissão não pode ser futura');
    }

    if (this.dataDesligamento && this.dataDesligamento < this.dataAdmissao) {
      errors.push('Data de desligamento deve ser posterior à data de admissão');
    }

    if (!['ativo', 'inativo'].includes(this.status)) {
      errors.push('Status deve ser: ativo ou inativo');
    }

    if (this.status === 'inativo' && !this.dataDesligamento) {
      errors.push('Colaborador inativo deve ter data de desligamento');
    }

    return errors;
  }

  private isValidCPF(cpf: string): boolean {
    // Basic CPF format validation
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return cpfRegex.test(cpf);
  }

  isActive(): boolean {
    return this.status === 'ativo';
  }

  isPcD(): boolean {
    return this.pcd;
  }

  getTempoEmpresa(): number {
    const endDate = this.dataDesligamento || new Date();
    const diffTime = Math.abs(endDate.getTime() - this.dataAdmissao.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTempoEmpresaAnos(): number {
    return Math.floor(this.getTempoEmpresa() / 365);
  }

  desligar(dataDesligamento: Date = new Date()): void {
    if (dataDesligamento < this.dataAdmissao) {
      throw new Error('Data de desligamento deve ser posterior à data de admissão');
    }
    this.dataDesligamento = dataDesligamento;
    this.status = 'inativo';
    this.updatedAt = new Date();
  }

  reativar(): void {
    this.dataDesligamento = undefined;
    this.status = 'ativo';
    this.updatedAt = new Date();
  }

  transferir(novoCentroCustoId: string, novoCargoId?: string): void {
    this.centroCustoId = novoCentroCustoId;
    if (novoCargoId) {
      this.cargoId = novoCargoId;
    }
    this.updatedAt = new Date();
  }

  promover(novoCargoId: string): void {
    this.cargoId = novoCargoId;
    this.updatedAt = new Date();
  }

  updateTurno(novoTurno: string): void {
    this.turno = novoTurno;
    this.updatedAt = new Date();
  }

  markAsPcD(): void {
    this.pcd = true;
    this.updatedAt = new Date();
  }

  unmarkAsPcD(): void {
    this.pcd = false;
    this.updatedAt = new Date();
  }

  belongsTo(centroCustoId: string): boolean {
    return this.centroCustoId === centroCustoId;
  }

  hasCargo(cargoId: string): boolean {
    return this.cargoId === cargoId;
  }
}