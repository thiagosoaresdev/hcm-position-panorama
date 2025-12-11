# Sistema de Auditoria - Quadro de Lotação

## Visão Geral

O sistema de auditoria implementa rastreabilidade completa de todas as alterações no sistema, seguindo os requisitos 8.1, 8.2 e 8.4 do documento de requisitos:

- **QUEM**: Identificação completa do usuário (ID + Nome)
- **QUANDO**: Timestamp ISO 8601 preciso
- **MOTIVO**: Razão da alteração
- **APROVADOR**: Se aplicável, quem aprovou a mudança
- **ANTES/DEPOIS**: Valores completos antes e depois da alteração
- **Retenção Permanente**: Dados nunca são fisicamente deletados

## Componentes Principais

### 1. AuditService
Serviço principal que gerencia todas as operações de auditoria.

```typescript
const auditService = new AuditService(pool);

// Log de criação
await auditService.logCreate(
  'entity123',
  'QuadroLotacao',
  auditContext,
  valoresDepois
);

// Log de atualização
await auditService.logUpdate(
  'entity123',
  'QuadroLotacao',
  auditContext,
  valoresAntes,
  valoresDepois
);

// Log de exclusão
await auditService.logDelete(
  'entity123',
  'QuadroLotacao',
  auditContext,
  valoresAntes
);
```

### 2. AuditContext
Interface que define o contexto de auditoria para cada operação.

```typescript
interface AuditContext {
  userId: string;        // ID do usuário
  userName: string;      // Nome do usuário
  motivo?: string;       // Razão da alteração
  aprovadorId?: string;  // ID do aprovador (se aplicável)
  ipAddress?: string;    // Endereço IP
  userAgent?: string;    // User Agent do navegador
  sessionId?: string;    // ID da sessão
  requestId?: string;    // ID da requisição
}
```

### 3. AuditMiddleware
Middleware Express que automaticamente configura o contexto de auditoria.

```typescript
const auditMiddleware = new AuditMiddleware(pool);
app.use(auditMiddleware.setAuditContext());
```

### 4. AuditUtils
Utilitários para operações comuns de auditoria.

```typescript
// Comparar objetos e identificar mudanças
const changes = AuditUtils.getChangedFields(before, after);

// Sanitizar dados sensíveis
const sanitized = AuditUtils.sanitizeAuditData(data);

// Gerar motivo padrão
const motivo = AuditUtils.generateMotivo('Criação', 'Quadro de Lotação');
```

## Funcionalidades Implementadas

### Rastreamento Automático
- Triggers PostgreSQL para captura automática de mudanças
- Contexto de auditoria via variáveis de sessão
- Integração transparente com repositories

### Consultas e Relatórios
- Histórico completo por entidade
- Busca avançada com múltiplos critérios
- Estatísticas de atividade
- Exportação em JSON/CSV

### Validação de Integridade
- Verificação de ordem cronológica
- Detecção de logs órfãos
- Validação de consistência

### API REST Completa
- Endpoints para consulta de histórico
- Busca avançada de logs
- Estatísticas e relatórios
- Exportação para compliance

## Uso Prático

### 1. Configuração Básica

```typescript
// Inicializar serviço
const auditService = new AuditService(pool);

// Configurar middleware
const auditMiddleware = new AuditMiddleware(pool);
app.use(auditMiddleware.setAuditContext());
```

### 2. Logging Manual

```typescript
// Contexto de auditoria
const context: AuditContext = {
  userId: 'user123',
  userName: 'João Silva',
  motivo: 'Atualização de vagas conforme solicitação #456'
};

// Log de alteração
await auditService.logUpdate(
  quadroId,
  'QuadroLotacao',
  context,
  valoresAntes,
  valoresDepois
);
```

### 3. Integração com Services

```typescript
// Usar withAuditContext para operações complexas
return await auditService.withAuditContext(context, async () => {
  const result = await repository.update(id, data);
  await auditService.logUpdate(id, 'Entity', context, before, after);
  return result;
});
```

### 4. Consultas de Auditoria

```typescript
// Histórico de uma entidade
const trail = await auditService.getAuditTrail('quadro123', 'QuadroLotacao');

// Busca avançada
const { logs, total } = await auditService.searchAuditLogs({
  entidadeTipo: 'QuadroLotacao',
  acao: 'update',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  limit: 50
});

// Estatísticas
const stats = await auditService.getAuditStats();
```

## Endpoints da API

### GET /api/audit/entity/:entityId
Recupera histórico completo de uma entidade.

### POST /api/audit/search
Busca avançada de logs com critérios múltiplos.

### GET /api/audit/recent
Atividade recente do sistema.

### GET /api/audit/stats
Estatísticas de auditoria para dashboard.

### GET /api/audit/export
Exportação de logs para compliance.

## Segurança e Compliance

### Dados Sensíveis
- CPF, CNPJ, senhas são automaticamente sanitizados
- Logs de auditoria não podem ser modificados ou deletados
- Retenção permanente conforme requisitos legais

### Integridade
- Validação de ordem cronológica
- Detecção de inconsistências
- Verificação de completude

### Performance
- Índices otimizados para consultas frequentes
- Paginação em todas as consultas
- Cache de estatísticas

## Monitoramento

### Métricas Importantes
- Volume de logs por dia
- Tipos de ação mais frequentes
- Usuários mais ativos
- Entidades mais modificadas

### Alertas
- Falhas na gravação de logs
- Inconsistências detectadas
- Volume anormal de alterações

## Manutenção

### Limpeza de Dados
- Logs nunca são fisicamente deletados
- Arquivamento de logs antigos (opcional)
- Compressão de dados históricos

### Backup
- Backup diário da tabela audit_logs
- Replicação para ambiente de DR
- Testes regulares de restore

## Exemplos de Uso

### Cenário 1: Criação de Vaga
```typescript
const context = {
  userId: 'user123',
  userName: 'Ana Silva',
  motivo: 'Criação de vaga conforme aprovação #789'
};

const quadro = await service.createQuadroLotacao(data, context);
// Log automático: CREATE QuadroLotacao por Ana Silva
```

### Cenário 2: Aprovação de Proposta
```typescript
await auditService.logApproval(
  'proposta456',
  'Proposta',
  context,
  'aprovador789',
  'Aprovado após análise orçamentária'
);
```

### Cenário 3: Normalização Automática
```typescript
await auditService.logSystemAction(
  'quadro123',
  'QuadroLotacao',
  'normalizacao',
  'Normalização automática via webhook RH Legado - Admissão João Santos'
);
```

### Cenário 4: Consulta de Histórico
```typescript
// Para dashboard de auditoria
const trail = await auditService.getAuditTrail('quadro123');
const summary = await auditService.getEntityAuditSummary('quadro123', 'QuadroLotacao');

// Exibir timeline de mudanças
trail.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.summary}`);
  console.log(`Campos alterados: ${entry.changedFields.join(', ')}`);
});
```

## Considerações de Performance

### Otimizações Implementadas
- Índices compostos para consultas frequentes
- Paginação obrigatória em listagens
- Cache de estatísticas agregadas
- Compressão JSON para campos grandes

### Monitoramento de Performance
- Tempo de resposta das consultas
- Uso de índices
- Crescimento da tabela de logs
- Impacto nas operações principais

## Conformidade Legal

### LGPD
- Dados pessoais são sanitizados
- Logs de acesso a dados sensíveis
- Direito ao esquecimento (anonimização)

### Lei 8.213 (PcD)
- Rastreamento de alterações em dados PcD
- Histórico de cálculos de conformidade
- Auditoria de ações corretivas

### Auditoria Corporativa
- Trilha completa de aprovações
- Rastreabilidade de decisões
- Relatórios para auditores externos