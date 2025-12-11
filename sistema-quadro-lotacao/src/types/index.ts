// Core entity types based on design document

export interface Empresa {
  id: string
  nome: string
  cnpj: string
  ativo: boolean
  configuracoes?: EmpresaConfiguracoes
  createdAt: Date
  updatedAt: Date
}

export interface EmpresaConfiguracoes {
  workflowAprovacao: WorkflowConfig
  acaoCargoDiscrepante: 'alertar' | 'permitir' | 'bloquear' | 'exigir_aprovacao'
  notificacoes: NotificationPreferences
}

export interface WorkflowConfig {
  niveis: WorkflowLevel[]
  incluirRH: boolean
}

export interface WorkflowLevel {
  ordem: number
  nome: string
  aprovadores: string[]
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  inApp: boolean
}

export interface PlanoVagas {
  id: string
  empresaId: string
  nome: string
  dataInicio: Date
  dataFim: Date
  status: 'ativo' | 'inativo' | 'planejado'
  descricao?: string
  createdAt: Date
  updatedAt: Date
}

export interface CentroCusto {
  id: string
  empresaId: string
  codigo: string
  nome: string
  hierarquia: string
  ativo: boolean
  responsavel?: string
  createdAt: Date
  updatedAt: Date
}

export interface PostoTrabalho {
  id: string
  centroCustoId: string
  codigo: string
  nome: string
  descricao?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Cargo {
  id: string
  nome: string
  estrutura: string
  classe: string
  nivel: string
  percentual?: number
  descricao?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QuadroLotacao {
  id: string
  planoVagasId: string
  postoTrabalhoId: string
  cargoId: string
  cargoVaga?: string
  vagasPrevistas: number
  vagasEfetivas: number
  vagasReservadas: number
  dataInicioControle: Date
  tipoControle: 'diario' | 'competencia'
  observacoes?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Colaborador {
  id: string
  nome: string
  cpf: string
  cargoId: string
  centroCustoId: string
  turno: string
  pcd: boolean
  dataAdmissao: Date
  dataDesligamento?: Date
  status: 'ativo' | 'inativo'
  createdAt: Date
  updatedAt: Date
}

export type PropostaStatus = 
  | 'rascunho' 
  | 'nivel_1' 
  | 'nivel_2' 
  | 'nivel_3' 
  | 'rh' 
  | 'aprovada' 
  | 'rejeitada'

export interface Proposta {
  id: string
  tipo: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia'
  descricao: string
  detalhamento: string
  solicitanteId: string
  quadroLotacaoId: string
  cargoAtual?: string
  cargoNovo?: string
  vagasAtuais?: number
  vagasSolicitadas?: number
  centroCustoDestino?: string
  impactoOrcamentario?: string
  analiseImpacto?: string
  status: PropostaStatus
  anexos?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Aprovacao {
  id: string
  propostaId: string
  nivel: number
  aprovadorId: string
  acao: 'aprovado' | 'rejeitado' | 'aguardando'
  comentario?: string
  dataAcao?: Date
  createdAt: Date
}

export interface AuditLog {
  id: string
  entidadeId: string
  entidadeTipo: string
  acao: string
  usuarioId: string
  usuarioNome: string
  motivo?: string
  valoresAntes?: Record<string, any>
  valoresDepois?: Record<string, any>
  aprovadorId?: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Authentication types
export interface User {
  id: string
  nome: string
  email: string
  roles: string[]
  permissions: string[]
  empresaId?: string
  centroCustoId?: string
  twoFactorEnabled: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface LoginRequest {
  email: string
  password: string
  twoFactorCode?: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  requiresTwoFactor: boolean
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface PermissionContext {
  empresaId?: string
  centroCustoId?: string
  userId?: string
  resource?: string
  action?: string
}

export interface TwoFactorSetupResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface TwoFactorVerifyRequest {
  code: string
  secret?: string
}

// Dashboard types
export interface KPIData {
  taxaOcupacao: number
  custoContratacao: number
  conformidadePcD: number
  retencaoTalentos: number
}