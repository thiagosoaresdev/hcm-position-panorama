import { AuditLog } from '../types/index.js';

export class AuditLogModel {
  constructor(
    public id: string,
    public entidadeId: string,
    public entidadeTipo: string,
    public acao: string,
    public usuarioId: string,
    public usuarioNome: string,
    public timestamp: Date = new Date(),
    public motivo?: string,
    public valoresAntes?: Record<string, any>,
    public valoresDepois?: Record<string, any>,
    public aprovadorId?: string,
    public ipAddress?: string,
    public userAgent?: string,
    public sessionId?: string,
    public requestId?: string
  ) {}

  static fromDatabase(row: any): AuditLogModel {
    return new AuditLogModel(
      row.id,
      row.entidade_id,
      row.entidade_tipo,
      row.acao,
      row.usuario_id,
      row.usuario_nome,
      new Date(row.timestamp),
      row.motivo,
      row.valores_antes,
      row.valores_depois,
      row.aprovador_id,
      row.ip_address,
      row.user_agent,
      row.session_id,
      row.request_id
    );
  }

  toDatabase(): Record<string, any> {
    return {
      id: this.id,
      entidade_id: this.entidadeId,
      entidade_tipo: this.entidadeTipo,
      acao: this.acao,
      usuario_id: this.usuarioId,
      usuario_nome: this.usuarioNome,
      motivo: this.motivo,
      valores_antes: this.valoresAntes ? JSON.stringify(this.valoresAntes) : null,
      valores_depois: this.valoresDepois ? JSON.stringify(this.valoresDepois) : null,
      aprovador_id: this.aprovadorId,
      timestamp: this.timestamp,
      ip_address: this.ipAddress,
      user_agent: this.userAgent,
      session_id: this.sessionId,
      request_id: this.requestId
    };
  }

  toJSON(): AuditLog {
    return {
      id: this.id,
      entidadeId: this.entidadeId,
      entidadeTipo: this.entidadeTipo,
      acao: this.acao,
      usuarioId: this.usuarioId,
      usuarioNome: this.usuarioNome,
      motivo: this.motivo,
      valoresAntes: this.valoresAntes,
      valoresDepois: this.valoresDepois,
      aprovadorId: this.aprovadorId,
      timestamp: this.timestamp,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.id || this.id.trim().length === 0) {
      errors.push('ID é obrigatório');
    }

    if (!this.entidadeId || this.entidadeId.trim().length === 0) {
      errors.push('ID da entidade é obrigatório');
    }

    if (!this.entidadeTipo || this.entidadeTipo.trim().length === 0) {
      errors.push('Tipo da entidade é obrigatório');
    }

    if (!this.acao || this.acao.trim().length === 0) {
      errors.push('Ação é obrigatória');
    }

    if (!this.usuarioId || this.usuarioId.trim().length === 0) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!this.usuarioNome || this.usuarioNome.trim().length === 0) {
      errors.push('Nome do usuário é obrigatório');
    }

    if (!this.timestamp) {
      errors.push('Timestamp é obrigatório');
    }

    if (this.timestamp && this.timestamp > new Date()) {
      errors.push('Timestamp não pode ser futuro');
    }

    return errors;
  }

  isCreate(): boolean {
    return this.acao === 'create' || this.acao === 'insert';
  }

  isUpdate(): boolean {
    return this.acao === 'update' || this.acao === 'modify';
  }

  isDelete(): boolean {
    return this.acao === 'delete' || this.acao === 'remove';
  }

  hasChanges(): boolean {
    return this.valoresAntes !== undefined || this.valoresDepois !== undefined;
  }

  getChangedFields(): string[] {
    if (!this.valoresAntes || !this.valoresDepois) {
      return [];
    }

    const changedFields: string[] = [];
    const beforeKeys = Object.keys(this.valoresAntes);
    const afterKeys = Object.keys(this.valoresDepois);
    const allKeys = new Set([...beforeKeys, ...afterKeys]);

    for (const key of allKeys) {
      const beforeValue = this.valoresAntes[key];
      const afterValue = this.valoresDepois[key];
      
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  getFieldChange(field: string): { before: any; after: any } | null {
    if (!this.valoresAntes || !this.valoresDepois) {
      return null;
    }

    const before = this.valoresAntes[field];
    const after = this.valoresDepois[field];

    if (JSON.stringify(before) === JSON.stringify(after)) {
      return null;
    }

    return { before, after };
  }

  belongsToEntity(entidadeId: string, entidadeTipo?: string): boolean {
    if (entidadeTipo) {
      return this.entidadeId === entidadeId && this.entidadeTipo === entidadeTipo;
    }
    return this.entidadeId === entidadeId;
  }

  belongsToUser(usuarioId: string): boolean {
    return this.usuarioId === usuarioId;
  }

  wasApprovedBy(aprovadorId: string): boolean {
    return this.aprovadorId === aprovadorId;
  }

  isFromSession(sessionId: string): boolean {
    return this.sessionId === sessionId;
  }

  isFromRequest(requestId: string): boolean {
    return this.requestId === requestId;
  }

  getAge(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.timestamp.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // dias
  }

  isRecent(days: number = 7): boolean {
    return this.getAge() <= days;
  }

  getActionDescription(): string {
    const descriptions: Record<string, string> = {
      'create': 'Criação',
      'insert': 'Inserção',
      'update': 'Atualização',
      'modify': 'Modificação',
      'delete': 'Exclusão',
      'remove': 'Remoção',
      'approve': 'Aprovação',
      'reject': 'Rejeição',
      'activate': 'Ativação',
      'deactivate': 'Desativação'
    };
    return descriptions[this.acao] || this.acao;
  }

  getSummary(): string {
    const action = this.getActionDescription();
    const entity = this.entidadeTipo;
    const user = this.usuarioNome;
    const date = this.timestamp.toLocaleDateString('pt-BR');
    
    return `${action} de ${entity} por ${user} em ${date}`;
  }
}