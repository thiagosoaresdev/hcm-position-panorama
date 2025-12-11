import { Proposta, PropostaStatus } from '../types/index.js';

export class PropostaModel {
  constructor(
    public id: string,
    public tipo: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia',
    public descricao: string,
    public detalhamento: string,
    public solicitanteId: string,
    public quadroLotacaoId: string,
    public status: PropostaStatus = 'rascunho',
    public cargoAtual?: string,
    public cargoNovo?: string,
    public vagasAtuais?: number,
    public vagasSolicitadas?: number,
    public centroCustoDestino?: string,
    public impactoOrcamentario?: string,
    public analiseImpacto?: string,
    public anexos?: string[],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): PropostaModel {
    return new PropostaModel(
      row.id,
      row.tipo,
      row.descricao,
      row.detalhamento,
      row.solicitante_id,
      row.quadro_lotacao_id,
      row.status,
      row.cargo_atual,
      row.cargo_novo,
      row.vagas_atuais ? parseInt(row.vagas_atuais) : undefined,
      row.vagas_solicitadas ? parseInt(row.vagas_solicitadas) : undefined,
      row.centro_custo_destino,
      row.impacto_orcamentario,
      row.analise_impacto,
      row.anexos ? JSON.parse(row.anexos) : undefined,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      tipo: this.tipo,
      descricao: this.descricao,
      detalhamento: this.detalhamento,
      solicitante_id: this.solicitanteId,
      quadro_lotacao_id: this.quadroLotacaoId,
      cargo_atual: this.cargoAtual,
      cargo_novo: this.cargoNovo,
      vagas_atuais: this.vagasAtuais,
      vagas_solicitadas: this.vagasSolicitadas,
      centro_custo_destino: this.centroCustoDestino,
      impacto_orcamentario: this.impactoOrcamentario,
      analise_impacto: this.analiseImpacto,
      status: this.status,
      anexos: this.anexos ? JSON.stringify(this.anexos) : null,
      updated_at: new Date()
    };
  }

  toJSON(): Proposta {
    return {
      id: this.id,
      tipo: this.tipo,
      descricao: this.descricao,
      detalhamento: this.detalhamento,
      solicitanteId: this.solicitanteId,
      quadroLotacaoId: this.quadroLotacaoId,
      cargoAtual: this.cargoAtual,
      cargoNovo: this.cargoNovo,
      vagasAtuais: this.vagasAtuais,
      vagasSolicitadas: this.vagasSolicitadas,
      centroCustoDestino: this.centroCustoDestino,
      impactoOrcamentario: this.impactoOrcamentario,
      analiseImpacto: this.analiseImpacto,
      status: this.status,
      anexos: this.anexos,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!['inclusao', 'alteracao', 'exclusao', 'transferencia'].includes(this.tipo)) {
      errors.push('Tipo deve ser: inclusao, alteracao, exclusao ou transferencia');
    }

    if (!this.descricao || this.descricao.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }

    if (this.descricao && this.descricao.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    if (!this.detalhamento || this.detalhamento.trim().length === 0) {
      errors.push('Detalhamento é obrigatório');
    }

    if (!this.solicitanteId || this.solicitanteId.trim().length === 0) {
      errors.push('ID do solicitante é obrigatório');
    }

    if (!this.quadroLotacaoId || this.quadroLotacaoId.trim().length === 0) {
      errors.push('ID do quadro de lotação é obrigatório');
    }

    if (!['rascunho', 'nivel_1', 'nivel_2', 'nivel_3', 'rh', 'aprovada', 'rejeitada'].includes(this.status)) {
      errors.push('Status inválido');
    }

    // Validações específicas por tipo
    if (this.tipo === 'inclusao' && this.vagasSolicitadas === undefined) {
      errors.push('Vagas solicitadas é obrigatório para inclusão');
    }

    if (this.tipo === 'alteracao' && (this.vagasAtuais === undefined || this.vagasSolicitadas === undefined)) {
      errors.push('Vagas atuais e solicitadas são obrigatórias para alteração');
    }

    if (this.tipo === 'transferencia' && !this.centroCustoDestino) {
      errors.push('Centro de custo destino é obrigatório para transferência');
    }

    if (this.vagasAtuais !== undefined && this.vagasAtuais < 0) {
      errors.push('Vagas atuais não pode ser negativo');
    }

    if (this.vagasSolicitadas !== undefined && this.vagasSolicitadas < 0) {
      errors.push('Vagas solicitadas não pode ser negativo');
    }

    return errors;
  }

  isDraft(): boolean {
    return this.status === 'rascunho';
  }

  isApproved(): boolean {
    return this.status === 'aprovada';
  }

  isRejected(): boolean {
    return this.status === 'rejeitada';
  }

  isPending(): boolean {
    return ['nivel_1', 'nivel_2', 'nivel_3', 'rh'].includes(this.status);
  }

  canEdit(): boolean {
    return this.status === 'rascunho';
  }

  canSubmit(): boolean {
    return this.status === 'rascunho' && this.validate().length === 0;
  }

  canApprove(): boolean {
    return this.isPending();
  }

  canReject(): boolean {
    return this.isPending();
  }

  submit(): void {
    if (!this.canSubmit()) {
      throw new Error('Proposta não pode ser enviada para aprovação');
    }
    this.status = 'nivel_1';
    this.updatedAt = new Date();
  }

  approve(currentLevel: PropostaStatus): void {
    if (!this.canApprove()) {
      throw new Error('Proposta não pode ser aprovada no status atual');
    }

    const nextStatus: Record<PropostaStatus, PropostaStatus> = {
      'nivel_1': 'nivel_2',
      'nivel_2': 'nivel_3',
      'nivel_3': 'rh',
      'rh': 'aprovada',
      'rascunho': 'nivel_1',
      'aprovada': 'aprovada',
      'rejeitada': 'rejeitada'
    };

    if (this.status !== currentLevel) {
      throw new Error('Status atual não corresponde ao nível de aprovação');
    }

    this.status = nextStatus[currentLevel];
    this.updatedAt = new Date();
  }

  reject(): void {
    if (!this.canReject()) {
      throw new Error('Proposta não pode ser rejeitada no status atual');
    }
    this.status = 'rascunho';
    this.updatedAt = new Date();
  }

  getCurrentApprovalLevel(): number {
    const levelMap: Record<PropostaStatus, number> = {
      'rascunho': 0,
      'nivel_1': 1,
      'nivel_2': 2,
      'nivel_3': 3,
      'rh': 4,
      'aprovada': 5,
      'rejeitada': 0
    };
    return levelMap[this.status];
  }

  getNextApprovalLevel(): number | null {
    const currentLevel = this.getCurrentApprovalLevel();
    if (currentLevel >= 5 || currentLevel === 0) {
      return null;
    }
    return currentLevel + 1;
  }

  addAnexo(anexo: string): void {
    if (!this.anexos) {
      this.anexos = [];
    }
    this.anexos.push(anexo);
    this.updatedAt = new Date();
  }

  removeAnexo(anexo: string): void {
    if (this.anexos) {
      this.anexos = this.anexos.filter(a => a !== anexo);
      this.updatedAt = new Date();
    }
  }

  updateImpactoOrcamentario(impacto: string): void {
    this.impactoOrcamentario = impacto;
    this.updatedAt = new Date();
  }

  updateAnaliseImpacto(analise: string): void {
    this.analiseImpacto = analise;
    this.updatedAt = new Date();
  }

  getVariacaoVagas(): number {
    if (this.vagasAtuais === undefined || this.vagasSolicitadas === undefined) {
      return 0;
    }
    return this.vagasSolicitadas - this.vagasAtuais;
  }

  isIncreasing(): boolean {
    return this.getVariacaoVagas() > 0;
  }

  isDecreasing(): boolean {
    return this.getVariacaoVagas() < 0;
  }
}