// Base repository
export { BaseRepository } from './BaseRepository.js';

// Entity repositories
export { EmpresaRepository } from './EmpresaRepository.js';
export { QuadroLotacaoRepository } from './QuadroLotacaoRepository.js';
export { AuditLogRepository } from './AuditLogRepository.js';
export { PropostaRepository } from './PropostaRepository.js';
export { AprovacaoRepository } from './AprovacaoRepository.js';

// Re-export models for convenience
export * from '../models/index.js';