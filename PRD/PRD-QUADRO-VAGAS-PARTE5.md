# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 5: INTEGRAÇÕES TÉCNICAS E ESPECIFICAÇÕES DE APIS

---

## 🔗 ARQUITETURA DE INTEGRAÇÕES

```
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA QUADRO DE LOTAÇÃO (Frontend)            │
│  (Angular 9+ com PrimeNG, Senior Design System)             │
└─────────────────────────────────────────────────────────────┘
              ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND API (Nodejs/Python/Java)          │
│  - CRUD de Quadro de Vagas                                  │
│  - Normalização (regras de negócio)                         │
│  - Workflow de Aprovação                                    │
│  - Auditoria e Timeline                                     │
└──────────────────────────────────────────────────────────────┘
    ↓               ↓               ↓               ↓
┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────┐
│Platform │  │Platform     │  │Platform  │  │Senior RH   │
│Authen   │  │Authorizatio │  │Notif.    │  │Legado API  │
│---------│  │-----------  │  │------    │  │--------    │
│ OAuth 2 │  │ RBAC (Role) │  │Email/SMS │  │Colaborador │
│ SSO     │  │ Permissões  │  │In-app    │  │Movimentos  │
│ 2FA     │  │ ACL         │  │Webhooks  │  │Dados RH    │
└─────────┘  └─────────────┘  └──────────┘  └────────────┘
    ↓               ↓               ↓               ↓
┌─────────────────────────────────────────────────────────────┐
│               DATABASES E DATASTORES                         │
│  • PostgreSQL (dados principais)                            │
│  • Redis (cache, sessions)                                  │
│  • Elasticsearch (logs, auditoria, full-text search)        │
│  • S3/Blob Storage (anexos, relatórios)                     │
└─────────────────────────────────────────────────────────────┘
    ↓               ↓               ↓
┌──────────────┐  ┌─────────┐  ┌──────────────┐
│ Glassdoor    │  │LinkedIn │  │Google Cloud  │
│ Market Data  │  │Trends   │  │BigQuery (IA) │
│ (Manual)     │  │(Manual) │  │(ML Models)   │
└──────────────┘  └─────────┘  └──────────────┘
```

---

## 🔐 INTEGRAÇÃO 1: PLATFORM AUTHENTICATION

### 1.1 Objetivo
Autenticação centralizada usando Senior X Platform, suportando OAuth 2.0, SSO e 2FA.

### 1.2 Endpoint
```
Base URL: https://dev.senior.com.br/api_publica/platform_authentication/
Documentação: https://dev.senior.com.br/api_publica/platform_authentication/
```

### 1.3 Fluxos de Autenticação

#### Fluxo A: OAuth 2.0 + SSO

```
1. USER ACESSA APLICAÇÃO
   ↓
2. FRONTEND REDIRECIONA PARA LOGIN SENIOR X
   GET /oauth/authorize?
     client_id=QUADRO_VAGAS_APP
     redirect_uri=https://quadro-vagas.senior.com/callback
     scope=profile email
     response_type=code
   ↓
3. USUARIO EFETUA LOGIN (com 2FA se configurado)
   ↓
4. SENIOR RETORNA AUTHORIZATION CODE
   ↓
5. FRONTEND REDIRECIONA PARA CALLBACK
   GET https://quadro-vagas.senior.com/callback?code=XXX
   ↓
6. BACKEND TROCA CODE POR TOKEN
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded
   
   client_id=QUADRO_VAGAS_APP
   client_secret=SECRET_KEY
   grant_type=authorization_code
   code=XXX
   redirect_uri=https://quadro-vagas.senior/callback
   ↓
7. RESPOSTA COM ACCESS TOKEN + REFRESH TOKEN
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "REFRESH_TOKEN_XXX",
     "scope": "profile email"
   }
   ↓
8. FRONTEND ARMAZENA TOKENS (localStorage/sessionStorage)
   ↓
9. USUARIO REDIRECIONADO PARA DASHBOARD
   ✅ AUTENTICADO
```

#### Fluxo B: Refresh Token

```
QUANDO TOKEN EXPIRAR:

1. FRONTEND DETECTA TOKEN EXPIRADO
   (status 401 em requisição)

2. FRONTEND USA REFRESH TOKEN
   POST /oauth/token
   {
     "grant_type": "refresh_token",
     "refresh_token": "REFRESH_TOKEN_XXX",
     "client_id": "QUADRO_VAGAS_APP",
     "client_secret": "SECRET_KEY"
   }

3. BACKEND VALIDA E RETORNA NOVO ACCESS TOKEN
   {
     "access_token": "NEW_TOKEN_...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }

4. FRONTEND ARMAZENA NOVO TOKEN
   E RETENTA REQUISIÇÃO ORIGINAL

✅ SESSION MANTIDA SEM LOGOUT
```

### 1.4 Integração no Frontend

**Angular Interceptor (HttpInterceptor):**

```typescript
// Adiciona token a todas requisições
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req).pipe(
      catchError(error => {
        if (error.status === 401) {
          // Token expirado, tentar refresh
          return this.refreshToken().pipe(
            switchMap(newToken => {
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next.handle(newReq);
            })
          );
        }
        return throwError(error);
      })
    );
  }
}
```

### 1.5 Logout

```
1. USER CLICA [LOGOUT]

2. FRONTEND REMOVE TOKENS
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');

3. FRONTEND REDIRECIONA PARA LOGIN
   GET /oauth/logout

4. SENIOR X INVALIDA SESSÃO

5. ✅ USUARIO DESLOGADO
```

### 1.6 2FA (Two-Factor Authentication)

**Se configurado na empresa:**

```
POST /oauth/token
{
  "client_id": "QUADRO_VAGAS_APP",
  "username": "user@company.com",
  "password": "password",
  "grant_type": "password"
}

RESPOSTA (Quando 2FA ativado):
{
  "requires_2fa": true,
  "session_token": "SESSION_TOKEN_XXX"
}

↓ USUARIO RECEBE SMS/EMAIL COM CÓDIGO

POST /oauth/token
{
  "session_token": "SESSION_TOKEN_XXX",
  "2fa_code": "123456",
  "grant_type": "urn:ietf:params:oauth:grant-type:2fa"
}

RESPOSTA:
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

---

## 👤 INTEGRAÇÃO 2: PLATFORM AUTHORIZATION

### 2.1 Objetivo
Controle de acesso baseado em Roles (RBAC) e ACL (Access Control List).

### 2.2 Endpoint
```
Base URL: https://dev.senior.com.br/api_publica/platform_authorization/
Documentação: https://dev.senior.com.br/api_publica/platform_authorization/
```

### 2.3 Modelo de Roles e Permissões

#### Roles do Sistema

| Role ID | Nome | Descrição | Permissões |
|---------|------|-----------|------------|
| ROLE_RH_ADMIN | RH Administrator | Acesso total | Todas |
| ROLE_RH_MANAGER | RH Manager | Gestão de vagas | CRUD Quadro, Propostas, Normalização |
| ROLE_GERENTE_AREA | Gerente de Área | Gerenciamento de vagas da área | Visualizar, Propor, Aprovar N1 |
| ROLE_COORDENADOR | Coordenador | Coordenação operacional | Visualizar, Propor, Aprovar N1 |
| ROLE_DIRETOR | Diretor/VP | Aprovação estratégica | Visualizar, Aprovar N3 |
| ROLE_USUARIO_FINAL | Usuário Final | Acesso consulta | Visualizar Dashboard, Consultas |

#### Permissões Granulares

```
quadro_vagas:dashboard:read          // Visualizar Dashboard
quadro_vagas:quadro:read             // Visualizar Quadro
quadro_vagas:quadro:create           // Criar Cargo/Vaga
quadro_vagas:quadro:update           // Editar Cargo/Vaga
quadro_vagas:quadro:delete           // Deletar Cargo/Vaga
quadro_vagas:propostas:create        // Criar Proposta
quadro_vagas:propostas:approve_n1    // Aprovar Nível 1
quadro_vagas:propostas:approve_n2    // Aprovar Nível 2
quadro_vagas:propostas:approve_n3    // Aprovar Nível 3
quadro_vagas:propostas:approve_rh    // Efetivação RH
quadro_vagas:normalizacao:read       // Visualizar Normalização
quadro_vagas:normalizacao:execute    // Executar Normalização
quadro_vagas:analytics:read          // Visualizar Analytics
quadro_vagas:analytics:export        // Exportar Dados
quadro_vagas:historico:read          // Visualizar Histórico
quadro_vagas:configuracoes:manage    // Gerenciar Configurações
```

### 2.4 Verificação de Permissões no Backend

**API para Verificar Permissão:**

```
POST /api/authorization/check-permission

Headers:
Authorization: Bearer {ACCESS_TOKEN}

Body:
{
  "resource": "quadro_vagas:quadro:update",
  "context": {
    "company_id": "12345",
    "center_id": "67890",
    "user_id": "user@company.com"
  }
}

Response (200 OK):
{
  "allowed": true,
  "reason": "User has role ROLE_RH_MANAGER"
}

Response (403 Forbidden):
{
  "allowed": false,
  "reason": "User lacks permission quadro_vagas:propostas:approve_n2"
}
```

### 2.5 Integração no Frontend (Guard)

**Angular Route Guard:**

```typescript
export class AuthorizationGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermission = route.data.permission;
    
    return this.authService.checkPermission(requiredPermission).pipe(
      map(allowed => {
        if (!allowed) {
          this.router.navigate(['/acesso-negado']);
        }
        return allowed;
      })
    );
  }
}

// Uso em rota:
{
  path: 'propostas/efetivar',
  component: EfetivarPropostasComponent,
  canActivate: [AuthorizationGuard],
  data: { permission: 'quadro_vagas:propostas:approve_rh' }
}
```

### 2.6 Integração em Componentes

**Hide/Show baseado em Permissão:**

```html
<!-- Botão visível apenas para RH -->
<button *ngIf="hasPermission('quadro_vagas:quadro:delete')"
        (click)="deletarCargo()"
        class="btn-danger">
  [🗑️] Deletar
</button>

<!-- Menu com permissões -->
<nav-menu>
  <menu-item *ngIf="hasPermission('quadro_vagas:quadro:create')"
             label="Novo Cargo"
             icon="plus" />
  <menu-item *ngIf="hasPermission('quadro_vagas:propostas:approve_rh')"
             label="Efetivar Propostas"
             icon="check" />
</nav-menu>
```

---

## 📬 INTEGRAÇÃO 3: PLATFORM NOTIFICATIONS

### 3.1 Objetivo
Notificações em tempo real por múltiplos canais (Email, SMS, In-app).

### 3.2 Endpoint
```
Base URL: https://dev.senior.com.br/api_publica/platform_notifications/
Documentação: https://dev.senior.com.br/api_publica/platform_notifications/
```

### 3.3 Arquitetura de Notificações

```
┌─────────────────────────────────────┐
│ EVENTO NO SISTEMA                   │
│ (Proposta criada, aprovada, etc)   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ BACKEND DISPARA NOTIFICAÇÃO          │
│ POST /notifications/send             │
└─────────────────────────────────────┘
              ↓
        ┌─────┴─────┐
        ↓           ↓
    ┌────────┐  ┌──────────┐
    │ Email  │  │ SMS/Push │
    │Service │  │ Service  │
    └────────┘  └──────────┘
        ↓           ↓
    ┌────────┐  ┌──────────────┐
    │ Inbox  │  │ In-app       │
    │Email   │  │ Notification │
    └────────┘  └──────────────┘
```

### 3.4 Tipos de Notificação

#### Tipo 1: Email

```json
{
  "notification_type": "email",
  "recipient": "usuario@company.com",
  "subject": "Nova proposta aguardando sua aprovação",
  "template": "proposta_pendente_aprovacao",
  "template_vars": {
    "proposta_id": "#145",
    "tipo": "Inclusão",
    "descricao": "+1 Dev Pleno em TI",
    "solicitante": "Maria Silva",
    "link_acao": "https://quadro-vagas.senior.com/propostas/145"
  },
  "priority": "high",
  "send_at": "2025-12-08T14:30:00Z"
}
```

**Response:**
```json
{
  "notification_id": "notif_12345",
  "status": "queued",
  "message": "Email queued for sending"
}
```

#### Tipo 2: SMS

```json
{
  "notification_type": "sms",
  "recipient": "+5511987654321",
  "message": "Proposta #145 criada. Verificar: link",
  "priority": "high"
}
```

#### Tipo 3: In-app

```json
{
  "notification_type": "inapp",
  "user_id": "user@company.com",
  "title": "Proposta #145 aguardando aprovação",
  "body": "Nova proposta: +1 Dev Pleno (TI) - Solicitante: Maria",
  "icon": "info",
  "action_url": "/propostas/145",
  "expires_at": "2025-12-15T14:30:00Z"
}
```

### 3.5 Webhook para In-app Real-time

**Backend publica evento:**

```typescript
// Backend envia evento via WebSocket/SSE
const notificationEvent = {
  event_type: 'proposta.created',
  timestamp: new Date().toISOString(),
  data: {
    proposta_id: '145',
    tipo: 'Inclusão',
    solicitante: 'Maria Silva',
    approve_urls: {
      nivel_1: '/api/propostas/145/approve'
    }
  }
};

// Via WebSocket
socket.emit('notification', notificationEvent);

// Via Server-Sent Events (SSE)
res.write(`data: ${JSON.stringify(notificationEvent)}\n\n`);
```

**Frontend recebe e exibe:**

```typescript
// Component Angular
export class NotificacaoComponent implements OnInit {
  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Conectar ao WebSocket
    this.notificationService.subscribe('proposta.created').subscribe(event => {
      this.showNotificationCard(event);
      this.playSound(); // som de alerta
    });
  }

  showNotificationCard(event) {
    // Exibe card flutuante com ação
    const notification = {
      title: `Proposta #${event.data.proposta_id}`,
      body: `${event.data.solicitante} enviou para aprovação`,
      action: () => this.router.navigate([`/propostas/${event.data.proposta_id}`])
    };
    
    this.toastr.info(notification.body, notification.title);
  }
}
```

### 3.6 Preferências de Notificação

**API para Gerenciar Preferências:**

```
PUT /api/user/notification-preferences

Headers:
Authorization: Bearer {TOKEN}

Body:
{
  "channels": {
    "email": {
      "enabled": true,
      "frequency": "immediate" // immediate, daily, weekly
    },
    "sms": {
      "enabled": false,
      "frequency": "immediate"
    },
    "inapp": {
      "enabled": true,
      "frequency": "immediate"
    }
  },
  "notification_types": {
    "proposta.created": true,
    "proposta.approved": true,
    "proposta.rejected": true,
    "normalizacao.completed": false,
    "alert.pcd": true
  }
}
```

---

## 🔄 INTEGRAÇÃO 4: SENIOR RH LEGADO API

### 4.1 Objetivo
Sincronização de dados de colaboradores, movimentações (admissões, transferências, desligamentos) e histórico.

### 4.2 Endpoints

```
Base URL: https://rh-legado.senior.com/api/
Autenticação: API Key ou OAuth 2.0
```

### 4.3 Fluxo de Sincronização

```
QUADRO DE VAGAS ←→ RH LEGADO

EVENTOS MONITORES (Webhooks/Polling):
├─ Colaborador Admitido
├─ Colaborador Transferido
├─ Colaborador Desligado
├─ Mudança de Cargo
└─ Mudança de Turno

CADA EVENTO:
1. RH Legado publica webhook
2. Backend Quadro de Vagas recebe
3. Valida evento
4. Atualiza Quadro Efetivo (automático)
5. Registra auditoria
6. Envia notificações
```

### 4.4 Endpoints Principais

#### 4.4.1 Webhook de Admissão

**RH Legado → Quadro de Vagas**

```
POST /api/webhooks/colaborador/admitido

Headers:
X-Webhook-Signature: sha256=...
Content-Type: application/json

Body:
{
  "event_id": "evt_12345",
  "event_type": "colaborador.admitido",
  "timestamp": "2025-12-15T10:30:00Z",
  "data": {
    "colaborador_id": "col_98765",
    "nome": "Ana Beatriz Silva",
    "cpf": "123.456.789-00",
    "cargo_id": "cargo_dev_junior",
    "cargo_nome": "Dev Junior",
    "centro_custo_id": "cc_ti",
    "centro_custo_nome": "TI",
    "turno": "1º",
    "data_admissao": "2025-12-15",
    "data_efetiva": "2025-12-15",
    "empresa_id": "emp_001",
    "pcd": false
  }
}

Response (200 OK):
{
  "acknowledged": true,
  "message": "Webhook processed successfully",
  "actions": [
    "quadro_efetivo_updated",
    "audit_created",
    "notification_sent"
  ]
}
```

#### 4.4.2 Webhook de Transferência

```
POST /api/webhooks/colaborador/transferido

Body:
{
  "event_id": "evt_12346",
  "event_type": "colaborador.transferido",
  "timestamp": "2025-12-20T14:15:00Z",
  "data": {
    "colaborador_id": "col_98765",
    "nome": "Ana Beatriz Silva",
    "cargo_anterior_id": "cargo_dev_junior",
    "cargo_novo_id": "cargo_dev_pleno",
    "cargo_novo_nome": "Dev Pleno",
    "centro_anterior_id": "cc_ti",
    "centro_novo_id": "cc_ops",
    "centro_novo_nome": "Operações",
    "data_transferencia": "2025-12-20"
  }
}
```

#### 4.4.3 Webhook de Desligamento

```
POST /api/webhooks/colaborador/desligado

Body:
{
  "event_id": "evt_12347",
  "event_type": "colaborador.desligado",
  "timestamp": "2025-12-25T17:00:00Z",
  "data": {
    "colaborador_id": "col_98765",
    "nome": "Ana Beatriz Silva",
    "cargo_id": "cargo_dev_pleno",
    "cargo_nome": "Dev Pleno",
    "centro_custo_id": "cc_ops",
    "centro_custo_nome": "Operações",
    "motivo": "Demissão",
    "data_desligamento": "2025-12-25"
  }
}
```

#### 4.4.4 GET: Buscar Colaboradores por Centro

**Query Histórico de Colaboradores em Período:**

```
GET /api/colaboradores/centro/{centro_id}?
  data_inicio=2025-12-01&
  data_fim=2025-12-31

Headers:
Authorization: Bearer {TOKEN}

Response:
{
  "total": 87,
  "colaboradores": [
    {
      "colaborador_id": "col_001",
      "nome": "João Silva",
      "cargo": "Dev Pleno",
      "centro": "TI",
      "turno": "1º",
      "data_inicio": "2025-12-01",
      "data_fim": null,
      "status": "ativo"
    },
    ...
  ],
  "movimentacoes": [
    {
      "tipo": "admissao",
      "data": "2025-12-01",
      "colaborador_id": "col_002"
    },
    {
      "tipo": "desligamento",
      "data": "2025-12-07",
      "colaborador_id": "col_098"
    }
  ]
}
```

### 4.5 Tratamento de Erros

```json
{
  "status": 400,
  "error": "bad_request",
  "message": "Cargo não encontrado",
  "details": {
    "cargo_id": "cargo_inexistente",
    "suggestion": "Verificar ID do cargo no sistema"
  },
  "timestamp": "2025-12-15T10:30:00Z"
}
```

---

## 📊 INTEGRAÇÃO 5: MARKET DATA ANALYTICS (Glassdoor, LinkedIn)

### 5.1 Objetivo
Importar dados de mercado mensalmente para análise competitiva.

### 5.2 Fontes Externas

#### Glassdoor API (Se contratado)
```
Base URL: https://api.glassdoor.com/api/v2/
Autenticação: API Key + Partner ID
Dados: Salários, benefícios, ratings
```

#### LinkedIn Data (Se contratado)
```
Base URL: https://api.linkedin.com/rest/
Autenticação: OAuth 2.0
Dados: Trends de contratação, skills demand
```

### 5.3 Fluxo de Importação

```
[AGENDAMENTO MENSAL]
    ↓
[BUSCAR DADOS GLASSDOOR/LINKEDIN]
    ↓
[PROCESSAR E MAPEAR]
    ↓
[ARMAZENAR EM DATABASE]
    ↓
[ATUALIZAR ANALYTICS]
    ↓
[NOTIFICAR RH]
    ↓
✅ DADOS DISPONÍVEIS EM ANALYTICS
```

### 5.4 Modelo de Dados - Market Data

```
market_data_salario
├── id
├── cargo_nome: "Dev Pleno"
├── cidade: "São Paulo"
├── fonte: "glassdoor"
├── salario_min: 8000
├── salario_medio: 11500
├── salario_max: 15000
├── data_coleta: "2025-12-01"
└── timestamp_criacao: "2025-12-01T00:00:00Z"

market_data_beneficios
├── id
├── cargo_nome: "Dev Pleno"
├── fonte: "glassdoor"
├── beneficios: ["Vale Refeição", "Vale Transporte", ...]
├── rating_beneficios: 8.2
└── timestamp_criacao: "2025-12-01T00:00:00Z"

market_data_trends
├── id
├── habilidade: "Python"
├── tendencia: "crescimento"
├── demanda_percentual: 340
├── fonte: "linkedin"
├── periodo: "3 meses"
└── timestamp_criacao: "2025-12-01T00:00:00Z"
```

### 5.5 Job Scheduled (Cron)

```typescript
// Backend - Cron Job
@Cron('0 0 1 * *') // 1º dia de cada mês à 00:00
async importarMarketData() {
  try {
    // 1. Buscar dados Glassdoor
    const salarioGD = await glassdoorService.buscarSalarios();
    const beneficiosGD = await glassdoorService.buscarBeneficios();
    
    // 2. Buscar dados LinkedIn
    const trendsLI = await linkedinService.buscarTrends();
    
    // 3. Mapear e validar
    const marketData = this.mapearDados({
      glassdoor: { salario: salarioGD, beneficios: beneficiosGD },
      linkedin: { trends: trendsLI }
    });
    
    // 4. Armazenar
    await marketDataRepository.save(marketData);
    
    // 5. Notificar
    await notificationService.enviar({
      tipo: 'market_data_imported',
      destinatario: 'rh@company.com',
      mensagem: 'Dados de mercado atualizados'
    });
    
    logger.info('Market data imported successfully');
  } catch (error) {
    logger.error('Error importing market data', error);
    await alertService.enviarAlerta('Market data import failed');
  }
}
```

---

## 🤖 INTEGRAÇÃO 6: IA / BIGQUERY (Previsão de Demanda)

### 6.1 Objetivo
Usar ML models para prever demanda de vagas baseado em histórico + sazonalidade.

### 6.2 Arquitetura

```
DADOS HISTÓRICOS
├─ Admissões por mês/cargo
├─ Desligamentos por mês/cargo
├─ Sazonalidade (Q1, Q2, etc)
├─ Crescimento histórico
└─ Turnover por cargo
      ↓
BIGQUERY ML
├─ Linear Regression / Time Series
├─ Séries Temporal (ARIMA)
└─ XGBoost
      ↓
MODELO TREINADO
├─ Input: Cargo, Período
├─ Output: Vagas previstas, Confiança %
└─ Features: Histórico, Sazonalidade, Tendência
      ↓
BACKEND QUADRO VAGAS
├─ Query modelo via BigQuery API
├─ Cache resultados
├─ Exibir no Dashboard
└─ Atualizar mensalmente
```

### 6.3 Exemplo de Previsão

```
INPUT:
- Cargo: "Dev Full Stack"
- Período: "Jan-Mar 2026"
- Histórico: 12 meses de contratações

MODEL PREDICTION (BigQuery ML):
{
  "mes": "janeiro_2026",
  "cargo": "Dev Full Stack",
  "vagas_previstas": 15,
  "intervalo_confianca": [12, 18],
  "confianca_percentual": 87,
  "sazonalidade": "alta",
  "tendencia": "crescente"
}

EXIBIÇÃO NO DASHBOARD:
┌─────────────────────┐
│ Dev Full Stack      │
│ 📈 Alta Demanda    │
│ +15 vagas           │
│ Próx. 3 meses       │
│ 87% confiança       │
└─────────────────────┘
```

### 6.4 Query BigQuery

```sql
-- Modelo de Previsão de Demanda
CREATE OR REPLACE MODEL `projeto.dataset.predicao_vagas`
OPTIONS(
  model_type='LINEAR_REG',
  input_label_cols=['vagas_necessarias']
) AS
SELECT
  EXTRACT(MONTH FROM data_evento) as mes,
  EXTRACT(QUARTER FROM data_evento) as trimestre,
  EXTRACT(YEAR FROM data_evento) as ano,
  cargo_id,
  COUNT(*) as admissoes,
  (SELECT COUNT(*) FROM desligamentos d 
   WHERE d.cargo_id = a.cargo_id 
   AND DATE_DIFF(d.data, a.data, DAY) < 30) as turnover_30d,
  vagas_necessarias
FROM admissoes a
GROUP BY mes, trimestre, ano, cargo_id;

-- Predict para próximo trimestre
SELECT
  *,
  ML.PREDICT(MODEL `projeto.dataset.predicao_vagas`,
    (SELECT 1 as mes, 1 as trimestre, 2026 as ano, cargo_id, ...))
FROM predictions
ORDER BY confianca DESC;
```

---

## 🔄 FLUXO COMPLETO: DO WEBHOOK À VISUALIZAÇÃO

```
[1] RH LEGADO: COLABORADOR ADMITIDO
    ↓
[2] WEBHOOK RECEBIDO
    POST /api/webhooks/colaborador/admitido
    {data: Ana, cargo: Dev Junior, centro: TI}
    ↓
[3] BACKEND VALIDA
    - Colaborador existe?
    - Cargo compatível com Vaga?
    - Centro ativo?
    ↓
[4] ATUALIZA QUADRO EFETIVO
    UPDATE quadro_efetivo
    SET vagas_efetivas = vagas_efetivas + 1
    WHERE cargo_id = 'dev_junior' AND centro_id = 'ti'
    ↓
[5] CRIA AUDITORIA
    INSERT audit_log
    (QUEM: Sistema, QUANDO: now(), ACAO: 'admissao',
     ANTES: 7, DEPOIS: 8, COLABORADOR: 'Ana')
    ↓
[6] ATUALIZA TIMELINE
    INSERT historico_alteracoes
    (timestamp, acao, usuario, motivo, antes, depois)
    ↓
[7] RECALCULA MÉTRICAS
    - Taxa Ocupação: 93.2% → 93.5%
    - Vagas Abertas: 13 → 12
    - PcD Status: (se PcD=true)
    ↓
[8] PUBLICA EVENTO (Webhook/SSE)
    socket.emit('quadro_atualizado', {
      evento: 'admissao',
      taxa_ocupacao: 93.5,
      vagas_abertas: 12
    })
    ↓
[9] FRONTEND RECEBE (WebSocket/SSE)
    - Atualiza Dashboard em tempo real
    - Exibe notificação "Ana admitida"
    - Refresh de tabelas afetadas
    ↓
[10] USUÁRIO VÊ
    Dashboard: Taxa 93.5%, Vagas 12
    Timeline: "Ana Beatriz admitida - TI - Dev Junior"
    ✅ SINCRONIZADO
```

---

## 🔒 SEGURANÇA E CONFORMIDADE

### Camadas de Segurança

1. **Autenticação:** OAuth 2.0 + 2FA (Platform Authentication)
2. **Autorização:** RBAC + ACL (Platform Authorization)
3. **Criptografia:** HTTPS/TLS 1.3 para todas as requisições
4. **Tokens:** JWT com expiração (1 hora), Refresh Token (7 dias)
5. **Auditoria:** Todos os eventos registrados com timestamp e usuário
6. **Validação:** Input sanitization, rate limiting
7. **Conformidade:** Lei 8.213 (PcD), LGPD (proteção dados)

### Exemplo: HTTPS + JWT

```typescript
// Interceptor com verificação
const options = {
  headers: new HttpHeaders({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }),
  // Force HTTPS
  withCredentials: true
};

// Request sempre com HTTPS
http.post('https://api.senior.com/quadro/vagas', data, options);
```

---

**Próximo:** PARTE 6 - Componentes UI/UX com Senior Design System

