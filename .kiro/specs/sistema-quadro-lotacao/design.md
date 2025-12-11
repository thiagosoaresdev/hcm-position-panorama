# Design Document - Sistema de Gestão de Quadro de Lotação

## Overview

O Sistema de Gestão de Quadro de Lotação é uma aplicação web corporativa desenvolvida com arquitetura moderna e responsiva, seguindo os padrões do Senior Design System. O sistema centraliza o gerenciamento de vagas, automatiza workflows de aprovação, garante conformidade legal (Lei 8.213 - PcD) e fornece analytics inteligentes com previsões baseadas em IA.

A solução é construída com stack agnóstico (React, Vue, Angular ou similar), integra-se obrigatoriamente com as APIs Senior X Platform (Authentication, Authorization, Notifications) e mantém sincronização em tempo real com sistemas RH legados através de webhooks.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                           │
│  React/Vue/Angular + Senior Design System                   │
│  • Dashboard • Quadro • Normalização • Propostas • Analytics│
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/TLS 1.3
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│  Node.js/Python/Java + PostgreSQL + Redis                  │
│  • Business Logic • Workflows • Integrations • Audit       │
└─────────────────────────────────────────────────────────────┘
    ↓               ↓               ↓               ↓
┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────┐
│Platform │  │Platform     │  │Platform  │  │RH Legado   │
│Auth     │  │Authz        │  │Notif     │  │API         │
│OAuth2.0 │  │RBAC/ACL     │  │Email/SMS │  │Webhooks    │
└─────────┘  └─────────────┘  └──────────┘  └────────────┘
```

### Technology Stack Options

**Frontend (Escolha Livre):**
- React 18+ + TypeScript + Vite
- Vue 3 + TypeScript + Vite  
- Angular 14+ + TypeScript
- Next.js 13+ (Full-stack)

**Backend (Escolha Livre):**
- Node.js + Express/Fastify
- Python + FastAPI/Django
- Java + Spring Boot
- Golang + Gin/Echo

**Database:**
- PostgreSQL 12+ (Primary)
- Redis 6+ (Cache/Sessions)
- Elasticsearch 7+ (Audit Logs)

**Deployment:**
- Docker + Kubernetes
- Cloud PaaS (AWS/GCP/Azure)
- Vercel/Railway (Next.js)

## Components and Interfaces

### Frontend Components

#### 1. Layout Components
- **AppShell**: Header + Sidebar + Main Content
- **Header**: Logo + Filtros Globais + Menu Usuário
- **Sidebar**: Menu navegação responsivo
- **Breadcrumb**: Navegação hierárquica

#### 2. Dashboard Components
- **KPICard**: Cards indicadores com color-coding
- **PrevisaoIA**: Carousel com previsões ML
- **InsightsPanel**: Accordion com correlações
- **TimelineAtividades**: Lista cronológica eventos

#### 3. Quadro Lotação Components
- **DataTable**: Tabela responsiva com ações
- **VagaForm**: Modal CRUD vagas
- **PermissoesGrid**: Matriz permissões por role
- **ReservasPanel**: Gestão vagas em seletivo

#### 4. Propostas Components
- **PropostaForm**: Wizard criação proposta
- **WorkflowViewer**: Visualização fluxo aprovação
- **AprovacaoModal**: Interface aprovação/rejeição
- **StatusBadge**: Indicador visual status

#### 5. Analytics Components
- **ChartContainer**: Wrapper gráficos responsivos
- **FilterPanel**: Filtros avançados
- **ExportButton**: Menu exportação múltiplos formatos
- **PcDCompliance**: Dashboard conformidade Lei 8.213

#### 6. Shared Components
- **Button**: Botões SDS (Primary, Secondary, Danger)
- **Modal**: Container modal responsivo
- **Form**: Componentes formulário validados
- **Toast**: Notificações temporárias
- **Loading**: Estados carregamento
- **ErrorBoundary**: Tratamento erros React

### Backend Interfaces

#### 1. API Controllers
```typescript
// Quadro Controller
interface QuadroController {
  getQuadro(filters: QuadroFilters): Promise<QuadroResponse>
  createVaga(vaga: CreateVagaRequest): Promise<VagaResponse>
  updateVaga(id: string, vaga: UpdateVagaRequest): Promise<VagaResponse>
  deleteVaga(id: string): Promise<void>
  getHistorico(vagaId: string): Promise<HistoricoResponse>
}

// Propostas Controller
interface PropostasController {
  createProposta(proposta: CreatePropostaRequest): Promise<PropostaResponse>
  approveProposta(id: string, approval: ApprovalRequest): Promise<void>
  rejectProposta(id: string, rejection: RejectionRequest): Promise<void>
  getPropostasUsuario(userId: string): Promise<PropostaResponse[]>
}

// Normalização Controller
interface NormalizacaoController {
  executeNormalizacao(params: NormalizacaoParams): Promise<NormalizacaoResult>
  getNormalizacaoHistory(): Promise<NormalizacaoHistoryResponse>
  getQuadroEfetivo(filters: QuadroFilters): Promise<QuadroEfetivoResponse>
}
```

#### 2. Service Layer
```typescript
// Auth Service
interface AuthService {
  authenticate(credentials: LoginRequest): Promise<AuthResponse>
  refreshToken(refreshToken: string): Promise<TokenResponse>
  checkPermission(resource: string, context: PermissionContext): Promise<boolean>
}

// Notification Service
interface NotificationService {
  sendEmail(notification: EmailNotification): Promise<void>
  sendSMS(notification: SMSNotification): Promise<void>
  sendInApp(notification: InAppNotification): Promise<void>
  getUserPreferences(userId: string): Promise<NotificationPreferences>
}

// Audit Service
interface AuditService {
  logAction(action: AuditAction): Promise<void>
  getAuditTrail(entityId: string): Promise<AuditEntry[]>
  searchAuditLogs(criteria: AuditSearchCriteria): Promise<AuditEntry[]>
}
```

## Data Models

### Core Entities

```typescript
// Empresa
interface Empresa {
  id: string
  nome: string
  cnpj: string
  ativo: boolean
  configuracoes: EmpresaConfiguracoes
  createdAt: Date
  updatedAt: Date
}

// Plano de Vagas
interface PlanoVagas {
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

// Centro de Custo
interface CentroCusto {
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

// Posto de Trabalho
interface PostoTrabalho {
  id: string
  centroCustoId: string
  codigo: string
  nome: string
  descricao?: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

// Cargo
interface Cargo {
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

// Quadro de Lotação
interface QuadroLotacao {
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

// Colaborador
interface Colaborador {
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

// Proposta
interface Proposta {
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

type PropostaStatus = 
  | 'rascunho' 
  | 'nivel_1' 
  | 'nivel_2' 
  | 'nivel_3' 
  | 'rh' 
  | 'aprovada' 
  | 'rejeitada'

// Aprovação
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

// Auditoria
interface AuditLog {
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
```

### Relationships

```
Empresa (1) ──── (N) PlanoVagas
Empresa (1) ──── (N) CentroCusto
CentroCusto (1) ──── (N) PostoTrabalho
PlanoVagas (1) ──── (N) QuadroLotacao
PostoTrabalho (1) ──── (N) QuadroLotacao
Cargo (1) ──── (N) QuadroLotacao
QuadroLotacao (1) ──── (N) Proposta
Proposta (1) ──── (N) Aprovacao
Colaborador (N) ──── (1) Cargo
Colaborador (N) ──── (1) CentroCusto
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Baseado na análise dos acceptance criteria, as seguintes propriedades de correção devem ser implementadas e testadas:

### Property 1: Dashboard Real-time Updates
*For any* data change in the system, when the change is committed, then the dashboard should reflect the updated values within 2 seconds without manual refresh
**Validates: Requirements 1.2**

### Property 2: Vaga Creation Uniqueness
*For any* centro de custo and posto de trabalho combination, when creating a new vaga with the same cargo, then the system should reject the creation and maintain the existing vaga unchanged
**Validates: Requirements 2.1**

### Property 3: Audit Trail Completeness
*For any* modification operation in the system, when the operation is executed, then an audit record should be created containing QUEM, QUANDO, ANTES, DEPOIS, and MOTIVO fields
**Validates: Requirements 2.2**

### Property 4: Normalization Real-time Processing
*For any* colaborador admission, transfer, or termination event, when the event is received via webhook, then the quadro efetivo should be updated within 2 seconds
**Validates: Requirements 3.1**

### Property 5: Normalization Completeness
*For any* normalization execution with a specified period, when the process runs, then all postos de trabalho within that period should be processed regardless of their individual control start dates
**Validates: Requirements 3.2**

### Property 6: Proposal Workflow State Transitions
*For any* proposta in the system, when a status transition occurs, then the new status should be valid according to the workflow rules (rascunho → nivel_1 → nivel_2 → nivel_3 → rh → aprovada/rejeitada)
**Validates: Requirements 4.2**

### Property 7: Proposal Rejection Reset
*For any* proposta that is rejected at any approval level, when the rejection is processed, then the proposta status should return to "rascunho" and the original requester should be notified
**Validates: Requirements 4.3**

### Property 8: PcD Compliance Calculation
*For any* company with a given number of employees, when calculating PcD compliance, then the system should apply the correct percentage according to Lei 8.213 (2% for 50-200, 3% for 201-500, 4% for 501-1000, 5% for >1000)
**Validates: Requirements 5.1**

### Property 9: Authorization Check Consistency
*For any* user attempting to access a system function, when the access is requested, then the system should verify permissions through Platform_Authorization API and block access if permissions are insufficient
**Validates: Requirements 6.1**

### Property 10: Notification Multi-channel Delivery
*For any* system event that triggers notifications, when the event occurs, then notifications should be sent through all configured channels (email, SMS, in-app) according to user preferences
**Validates: Requirements 7.1**

### Property 11: Audit Data Immutability
*For any* audit record created in the system, when the record is stored, then it should remain permanently accessible without possibility of physical deletion
**Validates: Requirements 8.4**

### Property 12: Responsive Layout Adaptation
*For any* screen size change, when the viewport dimensions change, then the interface should adapt according to breakpoints (mobile: 1 column, tablet: 2 columns, desktop: 4 columns)
**Validates: Requirements 9.2**

### Property 13: Webhook Integration Reliability
*For any* webhook received from RH Legado system, when the webhook is processed, then the system should validate the data, update the quadro efetivo, and implement retry logic with exponential backoff for failures
**Validates: Requirements 10.1**

### Property 14: Cargo Discrepancy Handling
*For any* admission where the real cargo differs from the predicted cargo, when the discrepancy is detected, then the system should apply the configured action (alert, allow, block, or require approval) consistently
**Validates: Requirements 10.2**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Invalid input data
   - Business rule violations
   - Required field missing

2. **Authentication Errors (401)**
   - Invalid credentials
   - Expired tokens
   - Missing authentication

3. **Authorization Errors (403)**
   - Insufficient permissions
   - Resource access denied
   - Role restrictions

4. **Not Found Errors (404)**
   - Resource not found
   - Invalid endpoints
   - Deleted entities

5. **Conflict Errors (409)**
   - Duplicate records
   - Concurrent modifications
   - State conflicts

6. **Integration Errors (502/503)**
   - Platform API failures
   - RH Legado unavailable
   - External service timeouts

7. **Internal Errors (500)**
   - Database failures
   - Unexpected exceptions
   - System errors

### Error Response Format

```typescript
interface ErrorResponse {
  status: number
  error: string
  message: string
  details?: Record<string, any>
  timestamp: string
  path: string
  requestId: string
}
```

### Error Handling Strategies

1. **Frontend Error Boundary**
   - Catch React/Vue/Angular errors
   - Display user-friendly messages
   - Log errors for debugging

2. **API Error Interceptor**
   - Standardize error responses
   - Handle token refresh
   - Retry failed requests

3. **Validation Layer**
   - Client-side validation
   - Server-side validation
   - Real-time feedback

4. **Graceful Degradation**
   - Offline capabilities
   - Cached data fallback
   - Progressive enhancement

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing approaches for comprehensive coverage:

**Unit Tests:**
- Verify specific examples, edge cases, and error conditions
- Test integration points between components
- Cover concrete scenarios and business logic paths
- Target: 90%+ code coverage

**Property-Based Tests:**
- Verify universal properties that should hold across all inputs
- Test system behavior with generated data sets
- Validate correctness properties defined in design
- Configuration: Minimum 100 iterations per property test

### Property-Based Testing Implementation

**Framework Selection:**
- **JavaScript/TypeScript**: fast-check
- **Python**: Hypothesis
- **Java**: jqwik
- **Golang**: gopter

**Property Test Requirements:**
- Each correctness property must be implemented by a SINGLE property-based test
- Each test must run minimum 100 iterations
- Tests must be tagged with format: **Feature: sistema-quadro-lotacao, Property {number}: {property_text}**
- Property tests must reference the design document property they implement

**Example Property Test Structure:**
```typescript
// Property 1: Dashboard Real-time Updates
// **Feature: sistema-quadro-lotacao, Property 1: Dashboard Real-time Updates**
test('dashboard updates reflect data changes within 2 seconds', async () => {
  await fc.assert(fc.asyncProperty(
    fc.record({
      vagasPrevistas: fc.integer(1, 100),
      vagasEfetivas: fc.integer(0, 100),
      centroCusto: fc.string(),
    }),
    async (data) => {
      // Generate random quadro change
      const startTime = Date.now();
      await updateQuadroLotacao(data);
      
      // Verify dashboard reflects change within 2 seconds
      const dashboardData = await getDashboardData();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(2000);
      expect(dashboardData).toContainEqual(
        expect.objectContaining(data)
      );
    }
  ), { numRuns: 100 });
});
```

### Unit Testing Strategy

**Component Testing:**
- Test individual React/Vue/Angular components
- Mock external dependencies
- Verify props, events, and rendering

**Service Testing:**
- Test business logic services
- Mock API calls and external integrations
- Verify error handling and edge cases

**Integration Testing:**
- Test API endpoints with real database
- Verify webhook processing
- Test authentication/authorization flows

**E2E Testing:**
- Test complete user workflows
- Verify cross-browser compatibility
- Test responsive design breakpoints

### Testing Tools

**Frontend:**
- Jest + React Testing Library (React)
- Vitest + Vue Test Utils (Vue)
- Jasmine + Karma (Angular)
- Playwright (E2E)

**Backend:**
- Jest (Node.js)
- Pytest (Python)
- JUnit 5 (Java)
- Go testing package (Golang)

**Property-Based:**
- fast-check (JavaScript/TypeScript)
- Hypothesis (Python)
- jqwik (Java)
- gopter (Golang)

### Test Data Management

**Test Database:**
- Separate test database instance
- Database seeding for consistent tests
- Transaction rollback after each test

**Mock Data:**
- Factory pattern for test data generation
- Realistic data that matches production patterns
- Property-based test generators for edge cases

**External Service Mocking:**
- Mock Platform APIs during testing
- Webhook simulation for integration tests
- Configurable mock responses

## Security and Performance

### Security Requirements

**Authentication & Authorization:**
- OAuth 2.0 + 2FA through Platform Authentication API
- RBAC/ACL through Platform Authorization API
- JWT tokens with 1-hour expiration, 7-day refresh tokens
- Session management with Redis

**Data Protection:**
- HTTPS/TLS 1.3 for all communications
- Input sanitization and validation
- SQL injection prevention
- XSS protection with Content Security Policy
- CSRF protection with tokens

**Audit & Compliance:**
- Complete audit trail for all operations
- LGPD compliance for personal data
- Lei 8.213 compliance for PcD calculations
- Data retention policies
- Secure data deletion procedures

### Performance Requirements

**Response Times:**
- Dashboard load: < 3 seconds
- API responses: < 1 second (95th percentile)
- Real-time updates: < 2 seconds
- Normalization processing: Background jobs

**Scalability:**
- Support 1000+ concurrent users
- Handle 10,000+ vagas per company
- Process 1000+ webhook events per minute
- Database optimization with indexes

**Availability:**
- 99.5% uptime SLA
- Graceful degradation during outages
- Circuit breaker pattern for external APIs
- Health checks and monitoring

## Deployment and Infrastructure

### Containerization

**Docker Configuration:**
```dockerfile
# Frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

### Environment Configuration

**Development:**
- Local Docker Compose
- PostgreSQL + Redis containers
- Mock external APIs
- Hot reload enabled

**Staging:**
- Kubernetes cluster
- Managed PostgreSQL
- Redis cluster
- Integration with Platform APIs

**Production:**
- Kubernetes with auto-scaling
- High-availability PostgreSQL
- Redis cluster with persistence
- CDN for static assets
- Load balancer with SSL termination

### Monitoring and Observability

**Application Monitoring:**
- APM with New Relic/DataDog
- Error tracking with Sentry
- Performance metrics
- Business metrics dashboard

**Infrastructure Monitoring:**
- Kubernetes metrics
- Database performance
- Redis metrics
- Network monitoring

**Logging:**
- Structured logging with JSON
- Centralized log aggregation
- Log retention policies
- Security event logging

## Integration Specifications

### Platform APIs Integration

**Authentication Flow:**
```typescript
// OAuth 2.0 Authorization Code Flow
const authConfig = {
  clientId: 'QUADRO_VAGAS_APP',
  redirectUri: 'https://app.com/callback',
  scope: 'profile email',
  responseType: 'code'
};

// Token refresh implementation
async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: authConfig.clientId,
      client_secret: process.env.CLIENT_SECRET
    })
  });
  return response.json();
}
```

**Authorization Checks:**
```typescript
// Permission verification before actions
async function checkPermission(resource: string, context: any): Promise<boolean> {
  const response = await fetch('/api/authorization/check-permission', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resource, context })
  });
  const result = await response.json();
  return result.allowed;
}
```

**Notification Delivery:**
```typescript
// Multi-channel notification
async function sendNotification(notification: NotificationRequest): Promise<void> {
  await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      notification_type: notification.type, // email, sms, inapp
      recipient: notification.recipient,
      template: notification.template,
      template_vars: notification.variables,
      priority: notification.priority
    })
  });
}
```

### RH Legado Integration

**Webhook Endpoints:**
```typescript
// Admission webhook handler
app.post('/api/webhooks/colaborador/admitido', async (req, res) => {
  try {
    const { colaborador_id, nome, cargo_id, centro_custo_id, data_admissao, pcd } = req.body.data;
    
    // Validate webhook signature
    const isValid = validateWebhookSignature(req.headers, req.body);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process admission
    await processAdmission({
      colaboradorId: colaborador_id,
      nome,
      cargoId: cargo_id,
      centroCustoId: centro_custo_id,
      dataAdmissao: data_admissao,
      pcd
    });
    
    // Update quadro efetivo
    await updateQuadroEfetivo(centro_custo_id, cargo_id, 1);
    
    // Create audit log
    await createAuditLog({
      acao: 'admissao',
      usuarioId: 'sistema',
      entidadeId: colaborador_id,
      detalhes: { nome, cargo_id, centro_custo_id }
    });
    
    res.json({ acknowledged: true, message: 'Admission processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Data Migration and Seeding

### Initial Data Setup

**Master Data:**
```sql
-- Empresas
INSERT INTO empresas (id, nome, cnpj, ativo) VALUES
('emp_001', 'Senior Sistemas S.A.', '12.345.678/0001-90', true);

-- Centros de Custo
INSERT INTO centros_custo (id, empresa_id, codigo, nome, hierarquia, ativo) VALUES
('cc_ti', 'emp_001', 'TI', 'Tecnologia da Informação', 'TI', true),
('cc_rh', 'emp_001', 'RH', 'Recursos Humanos', 'RH', true),
('cc_adm', 'emp_001', 'ADM', 'Administrativo', 'ADM', true);

-- Cargos
INSERT INTO cargos (id, nome, estrutura, classe, nivel, ativo) VALUES
('cargo_dev_pleno', 'Desenvolvedor Pleno', 'TI', 'Classe C', 'Pleno', true),
('cargo_dev_junior', 'Desenvolvedor Junior', 'TI', 'Classe D', 'Junior', true),
('cargo_gerente', 'Gerente', 'Gestão', 'Classe B', 'Senior', true);
```

**Sample Quadro Data:**
```sql
-- Plano de Vagas 2025
INSERT INTO planos_vagas (id, empresa_id, nome, data_inicio, data_fim, status) VALUES
('plano_2025', 'emp_001', 'Plano 2025', '2025-01-01', '2025-12-31', 'ativo');

-- Postos de Trabalho
INSERT INTO postos_trabalho (id, centro_custo_id, codigo, nome, ativo) VALUES
('pt_dev_fs', 'cc_ti', 'DEV-FS', 'Desenvolvedor Full Stack', true),
('pt_service_desk', 'cc_ti', 'SD', 'Service Desk', true);

-- Quadro de Lotação
INSERT INTO quadro_lotacao (id, plano_vagas_id, posto_trabalho_id, cargo_id, vagas_previstas, vagas_efetivas, vagas_reservadas, tipo_controle, ativo) VALUES
('ql_001', 'plano_2025', 'pt_dev_fs', 'cargo_dev_pleno', 8, 7, 1, 'diario', true),
('ql_002', 'plano_2025', 'pt_service_desk', 'cargo_dev_junior', 5, 4, 0, 'diario', true);
```

### Migration Scripts

**Database Schema Versioning:**
```sql
-- V001__initial_schema.sql
CREATE TABLE empresas (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V002__add_audit_tables.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id VARCHAR(50) NOT NULL,
  entidade_tipo VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  usuario_id VARCHAR(50) NOT NULL,
  usuario_nome VARCHAR(200),
  motivo TEXT,
  valores_antes JSONB,
  valores_depois JSONB,
  aprovador_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_entidade ON audit_logs(entidade_id, entidade_tipo);
CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

## Maintenance and Support

### Operational Procedures

**Daily Operations:**
- Monitor system health and performance
- Review error logs and alerts
- Check integration status with Platform APIs
- Verify webhook processing queues

**Weekly Operations:**
- Database maintenance and optimization
- Security patch reviews
- Performance trend analysis
- Backup verification

**Monthly Operations:**
- Capacity planning review
- Security audit
- Dependency updates
- Documentation updates

### Troubleshooting Guide

**Common Issues:**

1. **Authentication Failures**
   - Check Platform Authentication API status
   - Verify client credentials
   - Review token expiration settings
   - Check network connectivity

2. **Authorization Errors**
   - Verify user roles and permissions
   - Check Platform Authorization API responses
   - Review permission configuration
   - Validate resource access patterns

3. **Webhook Processing Issues**
   - Check webhook signature validation
   - Review RH Legado API connectivity
   - Verify webhook payload format
   - Check processing queue status

4. **Performance Issues**
   - Review database query performance
   - Check Redis cache hit rates
   - Monitor API response times
   - Analyze frontend bundle sizes

### Support Contacts

**Internal Support:**
- Tech Lead: [email]
- DevOps Engineer: [email]
- Product Owner: [email]

**External Support:**
- Platform APIs: api-support@senior.com.br
- Infrastructure: infra-support@company.com
- Security: security@company.com