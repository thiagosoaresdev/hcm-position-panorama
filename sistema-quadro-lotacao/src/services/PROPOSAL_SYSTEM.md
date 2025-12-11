# Sistema de Gestão de Propostas

## Visão Geral

O Sistema de Gestão de Propostas é um módulo completo para gerenciar solicitações de alteração no quadro de lotação, incluindo criação, aprovação e efetivação de propostas através de um workflow configurável.

## Funcionalidades Principais

### 1. Gestão de Propostas (CRUD)
- **Criação**: Criação de propostas com validação completa
- **Leitura**: Consulta de propostas com filtros avançados
- **Atualização**: Edição de propostas em rascunho
- **Exclusão**: Remoção de propostas em rascunho

### 2. Workflow de Aprovação
- **Configurável**: Workflow de 3 níveis + RH configurável por empresa
- **Estados**: rascunho → nivel_1 → nivel_2 → nivel_3 → rh → aprovada/rejeitada
- **Transições**: Validação de transições de estado
- **Rejeição**: Retorno automático para rascunho

### 3. Tipos de Proposta
- **Inclusão**: Criação de novas vagas
- **Alteração**: Modificação de vagas existentes
- **Exclusão**: Remoção de vagas
- **Transferência**: Movimentação entre centros de custo

### 4. Auditoria Completa
- **Rastreabilidade**: QUEM, QUANDO, MOTIVO, APROVADOR
- **Histórico**: Timeline completa de alterações
- **Imutabilidade**: Dados de auditoria permanentes

## Arquitetura

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│           Controller Layer          │
│        PropostaController           │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│           Service Layer             │
│         PropostaService             │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│         Repository Layer            │
│  PropostaRepository + AprovacaoRepo │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│           Database Layer            │
│    PostgreSQL + Audit Tables       │
└─────────────────────────────────────┘
```

### Componentes Principais

#### 1. PropostaController
- **Responsabilidade**: Endpoints REST para gestão de propostas
- **Funcionalidades**:
  - CRUD operations
  - Workflow management (submit, approve, reject)
  - Filtering and search
  - Statistics and reporting

#### 2. PropostaService
- **Responsabilidade**: Lógica de negócio e orquestração
- **Funcionalidades**:
  - Validação de regras de negócio
  - Gerenciamento de workflow
  - Aplicação de mudanças no quadro
  - Integração com auditoria

#### 3. PropostaRepository
- **Responsabilidade**: Acesso a dados de propostas
- **Funcionalidades**:
  - CRUD operations
  - Queries complexas com joins
  - Filtros avançados
  - Estatísticas

#### 4. AprovacaoRepository
- **Responsabilidade**: Gestão do workflow de aprovação
- **Funcionalidades**:
  - Criação de workflow
  - Atualização de aprovações
  - Consultas por aprovador
  - Reset de aprovações

## Modelos de Dados

### Proposta
```typescript
interface Proposta {
  id: string
  tipo: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia'
  descricao: string
  detalhamento: string
  solicitanteId: string
  quadroLotacaoId: string
  status: PropostaStatus
  cargoAtual?: string
  cargoNovo?: string
  vagasAtuais?: number
  vagasSolicitadas?: number
  centroCustoDestino?: string
  impactoOrcamentario?: string
  analiseImpacto?: string
  anexos?: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Aprovacao
```typescript
interface Aprovacao {
  id: string
  propostaId: string
  nivel: number
  aprovadorId: string
  acao: 'aprovado' | 'rejeitado' | 'aguardando'
  comentario?: string
  dataAcao?: Date
  createdAt: Date
}
```

### Estados do Workflow
```typescript
type PropostaStatus = 
  | 'rascunho'     // Editável pelo solicitante
  | 'nivel_1'      // Aguardando aprovação nível 1
  | 'nivel_2'      // Aguardando aprovação nível 2
  | 'nivel_3'      // Aguardando aprovação nível 3
  | 'rh'           // Aguardando aprovação RH
  | 'aprovada'     // Aprovada e aplicada
  | 'rejeitada'    // Rejeitada (volta para rascunho)
```

## API Endpoints

### Propostas CRUD

#### POST /api/propostas
Criar nova proposta
```json
{
  "tipo": "inclusao",
  "descricao": "Nova vaga para Desenvolvedor Senior",
  "detalhamento": "Necessidade de reforçar equipe...",
  "quadroLotacaoId": "quadro-123",
  "cargoNovo": "Desenvolvedor Senior",
  "vagasSolicitadas": 2,
  "impactoOrcamentario": "R$ 24.000,00 mensais",
  "analiseImpacto": "Impacto positivo na produtividade"
}
```

#### GET /api/propostas/:id
Buscar proposta por ID
- Query param: `includeHistory=true` para incluir histórico de aprovações

#### PUT /api/propostas/:id
Atualizar proposta (apenas em rascunho)

#### DELETE /api/propostas/:id
Excluir proposta (apenas em rascunho)

### Workflow Management

#### POST /api/propostas/:id/submit
Enviar proposta para aprovação
```json
{
  "workflowConfig": {
    "niveis": [
      { "ordem": 1, "nome": "Coordenação", "aprovadores": ["coord-1"] },
      { "ordem": 2, "nome": "Gerência", "aprovadores": ["gerente-1"] },
      { "ordem": 3, "nome": "Diretoria", "aprovadores": ["diretor-1"] }
    ],
    "incluirRH": true
  }
}
```

#### POST /api/propostas/:id/approve
Aprovar proposta no nível atual
```json
{
  "aprovadorId": "coord-1",
  "comentario": "Proposta aprovada. Justificativa adequada."
}
```

#### POST /api/propostas/:id/reject
Rejeitar proposta (retorna para rascunho)
```json
{
  "aprovadorId": "coord-1",
  "comentario": "Necessário revisar impacto orçamentário",
  "motivo": "Informações insuficientes"
}
```

### Consultas e Relatórios

#### GET /api/propostas
Listar propostas com filtros
- Query params: `status`, `tipo`, `solicitanteId`, `createdAfter`, `createdBefore`

#### GET /api/propostas/my
Propostas do usuário atual (como solicitante)

#### GET /api/propostas/pending
Propostas pendentes para aprovação do usuário atual

#### GET /api/propostas/statistics
Estatísticas de propostas por status

#### GET /api/propostas/overdue
Propostas em atraso (pendentes há mais de X dias)

## Regras de Negócio

### 1. Validação de Propostas
- **Campos obrigatórios**: tipo, descrição, detalhamento, quadroLotacaoId
- **Validação por tipo**:
  - Inclusão: vagasSolicitadas obrigatório
  - Alteração: vagasAtuais e vagasSolicitadas obrigatórios
  - Transferência: centroCustoDestino obrigatório
- **Limites**: descrição máximo 500 caracteres

### 2. Estados e Transições
- **Rascunho**: Editável, pode ser enviada para aprovação
- **Em aprovação**: Não editável, pode ser aprovada/rejeitada
- **Aprovada**: Imutável, mudanças aplicadas no quadro
- **Rejeitada**: Retorna para rascunho automaticamente

### 3. Workflow de Aprovação
- **Sequencial**: Aprovação deve seguir ordem dos níveis
- **Configurável**: Níveis e aprovadores por empresa
- **Rejeição**: Qualquer nível pode rejeitar, retorna para rascunho
- **Reset**: Rejeição reseta todas as aprovações

### 4. Aplicação de Mudanças
- **Automática**: Mudanças aplicadas quando totalmente aprovada
- **Tipos de mudança**:
  - Inclusão: Incrementa vagas previstas
  - Alteração: Ajusta vagas previstas pela diferença
  - Exclusão: Decrementa vagas previstas
  - Transferência: Atualiza múltiplos quadros

## Auditoria e Rastreabilidade

### Eventos Auditados
- **Criação**: Nova proposta criada
- **Atualização**: Proposta editada
- **Envio**: Proposta enviada para aprovação
- **Aprovação**: Proposta aprovada em um nível
- **Rejeição**: Proposta rejeitada
- **Exclusão**: Proposta excluída
- **Aplicação**: Mudanças aplicadas no quadro

### Dados de Auditoria
- **QUEM**: usuarioId e usuarioNome
- **QUANDO**: timestamp ISO 8601
- **MOTIVO**: motivo da ação
- **APROVADOR**: aprovadorId (quando aplicável)
- **ANTES/DEPOIS**: valores antes e depois da mudança

## Configuração e Deployment

### Variáveis de Ambiente
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quadro_db

# Workflow
DEFAULT_APPROVAL_TIMEOUT_DAYS=3
MAX_APPROVAL_LEVELS=4

# Notifications
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
```

### Dependências
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e sessões (opcional)
- **Node.js**: Runtime
- **TypeScript**: Linguagem

### Tabelas do Banco
- `propostas`: Dados principais das propostas
- `aprovacoes`: Workflow de aprovação
- `audit_logs`: Trilha de auditoria
- `quadro_lotacao`: Quadro de vagas (atualizado pelas propostas)

## Testes

### Testes Unitários
- **PropostaService**: Lógica de negócio
- **PropostaRepository**: Acesso a dados
- **AprovacaoRepository**: Workflow
- **PropostaModel**: Validações e métodos

### Testes de Integração
- **PropostaController**: Endpoints REST
- **Workflow completo**: Criação → Aprovação → Aplicação
- **Cenários de erro**: Validação, autorização, não encontrado

### Testes de Propriedade (PBT)
- **Workflow State Transitions**: Validação de transições de estado
- **Proposal Rejection Reset**: Reset correto após rejeição
- **Data Integrity**: Integridade dos dados após operações

## Monitoramento e Métricas

### KPIs de Negócio
- **Taxa de aprovação**: % de propostas aprovadas vs rejeitadas
- **Tempo médio de aprovação**: Tempo entre envio e aprovação final
- **Propostas em atraso**: Pendentes há mais de X dias
- **Volume por tipo**: Distribuição por tipo de proposta

### Métricas Técnicas
- **Response time**: Tempo de resposta dos endpoints
- **Error rate**: Taxa de erro por endpoint
- **Database performance**: Tempo de queries
- **Audit volume**: Volume de logs de auditoria

## Troubleshooting

### Problemas Comuns

#### 1. Proposta não pode ser editada
- **Causa**: Status não é 'rascunho'
- **Solução**: Verificar status atual, rejeitar se necessário

#### 2. Aprovação não autorizada
- **Causa**: Usuário não é aprovador do nível atual
- **Solução**: Verificar configuração de workflow e permissões

#### 3. Workflow não avança
- **Causa**: Aprovação não encontrada ou já processada
- **Solução**: Verificar tabela aprovacoes e status

#### 4. Mudanças não aplicadas
- **Causa**: Erro na aplicação das mudanças no quadro
- **Solução**: Verificar logs de auditoria e integridade dos dados

### Logs Importantes
```
[INFO] Proposta criada: {propostaId} por {userId}
[INFO] Proposta enviada para aprovação: {propostaId}
[INFO] Aprovação nível {nivel}: {propostaId} por {aprovadorId}
[WARN] Proposta rejeitada: {propostaId} - {motivo}
[ERROR] Erro ao aplicar mudanças: {propostaId} - {erro}
```

## Roadmap

### Próximas Funcionalidades
- [ ] Notificações automáticas por email/SMS
- [ ] Dashboard de propostas
- [ ] Relatórios avançados
- [ ] API de integração externa
- [ ] Workflow paralelo (múltiplos aprovadores por nível)
- [ ] Aprovação por delegação
- [ ] Templates de proposta
- [ ] Anexos de arquivos

### Melhorias Técnicas
- [ ] Cache de consultas frequentes
- [ ] Otimização de queries
- [ ] Testes de carga
- [ ] Documentação OpenAPI
- [ ] Containerização
- [ ] CI/CD pipeline

## Conclusão

O Sistema de Gestão de Propostas fornece uma solução completa e robusta para gerenciar alterações no quadro de lotação, com workflow configurável, auditoria completa e integração transparente com o sistema principal. A arquitetura modular permite fácil manutenção e extensão das funcionalidades.