import { Aprovacao } from '../types/index.js';

export class AprovacaoModel {
  constructor(
    public id: string,
    public propostaId: string,
    public nivel: number,
    public aprovadorId: string,
    public acao: 'aprovado' | 'rejeitado' | 'aguardando' = 'aguardando',
    public comentario?: string,
    public dataAcao?: Date,
    public createdAt: Date = new Date()
  ) {}

  static fromDatabase(row: any): AprovacaoModel {
    return new AprovacaoModel(
      row.id,
      row.proposta_id,
      parseInt(row.nivel),
      row.aprovador_id,
      row.acao,
      row.comentario,
      row.data_acao ? new Date(row.data_acao) : undefined,
      new Date(row.created_at)
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      proposta_id: this.propostaId,
      nivel: this.nivel,
      aprovador_id: this.aprovadorId,
      acao: this.acao,
      comentario: this.comentario,
      data_acao: this.dataAcao
    };
  }

  toJSON(): Aprovacao {
    return {
      id: this.id,
      propostaId: this.propostaId,
      nivel: this.nivel,
      aprovadorId: this.aprovadorId,
      acao: this.acao,
      comentario: this.comentario,
      dataAcao: this.dataAcao,
      createdAt: this.createdAt
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!this.propostaId || this.propostaId.trim().length === 0) {
      errors.push('ID da proposta é obrigatório');
    }

    if (!this.aprovadorId || this.aprovadorId.trim().length === 0) {
      errors.push('ID do aprovador é obrigatório');
    }

    if (this.nivel < 1 || this.nivel > 4) {
      errors.push('Nível deve estar entre 1 e 4');
    }

    if (!['aprovado', 'rejeitado', 'aguardando'].includes(this.acao)) {
      errors.push('Ação deve ser: aprovado, rejeitado ou aguardando');
    }

    if (this.acao !== 'aguardando' && !this.dataAcao) {
      errors.push('Data da ação é obrigatória quando ação não é aguardando');
    }

    if (this.dataAcao && this.dataAcao > new Date()) {
      errors.push('Data da ação não pode ser futura');
    }

    return errors;
  }

  isPending(): boolean {
    return this.acao === 'aguardando';
  }

  isApproved(): boolean {
    return this.acao === 'aprovado';
  }

  isRejected(): boolean {
    return this.acao === 'rejeitado';
  }

  isCompleted(): boolean {
    return this.acao !== 'aguardando';
  }

  canApprove(): boolean {
    return this.acao === 'aguardando';
  }

  canReject(): boolean {
    return this.acao === 'aguardando';
  }

  approve(comentario?: string): void {
    if (!this.canApprove()) {
      throw new Error('Aprovação não pode ser realizada no status atual');
    }
    this.acao = 'aprovado';
    this.dataAcao = new Date();
    if (comentario) {
      this.comentario = comentario;
    }
  }

  reject(comentario?: string): void {
    if (!this.canReject()) {
      throw new Error('Rejeição não pode ser realizada no status atual');
    }
    this.acao = 'rejeitado';
    this.dataAcao = new Date();
    if (comentario) {
      this.comentario = comentario;
    }
  }

  getNivelDescription(): string {
    const descriptions: Record<number, string> = {
      1: 'Coordenação',
      2: 'Gerência',
      3: 'Diretoria',
      4: 'RH'
    };
    return descriptions[this.nivel] || `Nível ${this.nivel}`;
  }

  getTempoResposta(): number | null {
    if (!this.dataAcao) {
      return null;
    }
    const diffTime = Math.abs(this.dataAcao.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // dias
  }

  isOverdue(maxDays: number = 3): boolean {
    if (this.isCompleted()) {
      return false;
    }
    const daysSinceCreated = Math.ceil((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated > maxDays;
  }

  belongsToApprover(aprovadorId: string): boolean {
    return this.aprovadorId === aprovadorId;
  }

  belongsToProposta(propostaId: string): boolean {
    return this.propostaId === propostaId;
  }

  isLevel(nivel: number): boolean {
    return this.nivel === nivel;
  }

  updateComentario(comentario: string): void {
    this.comentario = comentario;
  }
}