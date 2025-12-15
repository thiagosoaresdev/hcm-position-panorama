# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 5: INTEGRAÇÕES TÉCNICAS E ESPECIFICAÇÕES DE APIS

---

## 🔗 ARQUITETURA DE INTEGRAÇÕES

```
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA QUADRO DE LOTAÇÃO (Frontend)            │
│  (Framework escolhido pela equipe + Senior Design System)   │
└─────────────────────────────────────────────────────────────┘
              ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND API (Stack escolhido)             │
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
│          DATABASES E DATASTORES (Sugestões)                  │
│  • Banco Relacional (ex: PostgreSQL, MySQL, SQL Server)     │
│  • Cache (ex: Redis, Memcached)                             │
│  • Search/Logs (ex: Elasticsearch, Solr, Splunk)            │
│  • Blob Storage (ex: S3, Azure Blob, MinIO)                 │
└─────────────────────────────────────────────────────────────┘
    ↓               ↓               ↓
┌──────────────┐  ┌─────────┐  ┌──────────────┐
│ Market Data  │  │Skills   │  │IA/ML (Opcion)│
│ (Opcional)   │  │Trends   │  │(Qualquer)    │
│ Glassdoor,etc│  │(Opciona)│  │BigQuery,etc  │
└──────────────┘  └─────────┘  └──────────────┘
```

---

## 🔐 INTEGRAÇÃO 1: PLATFORM AUTHENTICATION (SeniorX)

### 1.1 Objetivo
A **SeniorX Platform gerencia toda a autenticação** de forma centralizada e transparente. O sistema Quadro de Vagas apenas consome os tokens já validados pela plataforma, sem necessidade de implementar fluxos OAuth ou SSO.

### 1.2 Como Funciona

**A SeniorX Platform já fornece:**
- ✅ OAuth 2.0 configurado
- ✅ Single Sign-On (SSO)
- ✅ Autenticação de dois fatores (2FA)
- ✅ Gestão de sessões e tokens
- ✅ Renovação automática de tokens

**O que o sistema precisa fazer:**
- Apenas consumir o token JWT fornecido pela plataforma
- Incluir o token nas requisições à API
- Tratar expiração (401) redirecionando para login da plataforma

### 1.3 Fluxo Simplificado

```
1. USUÁRIO ACESSA APLICAÇÃO
   ↓
2. SENIORX PLATFORM VALIDA SESSÃO
   - Se não autenticado: Redireciona para login SeniorX
   - Se autenticado: Injeta token JWT no contexto
   ↓
3. APLICAÇÃO RECEBE TOKEN JWT
   const token = SeniorXPlatform.getAccessToken();
   ↓
4. APLICAÇÃO USA TOKEN EM REQUISIÇÕES
   Authorization: Bearer {token}
   ↓
5. ✅ USUÁRIO AUTENTICADO

EM CASO DE EXPIRAÇÃO:
- SeniorX Platform renova automaticamente
- Ou redireciona para re-autenticação
- Aplicação não gerencia refresh tokens
```

### 1.4 Integração no Frontend

**A SeniorX Platform já fornece o SDK/Biblioteca que gerencia automaticamente:**
- Injeção de tokens
- Renovação de sessão
- Redirecionamento para login

**Interceptor HTTP Genérico (implementar conforme framework escolhido):**

```yaml
# Lógica de Interceptor HTTP (adaptar para framework escolhido)

HTTP_Interceptor:
  name: "AuthInterceptor"
  
  dependencies:
    - SeniorXAuthService (SDK da plataforma)
  
  on_request:
    # Obter token da SeniorX Platform
    token = SeniorXAuth.getAccessToken()
    
    if token exists:
      # Adicionar header Authorization
      request.headers['Authorization'] = 'Bearer ' + token
    
    return request
  
  on_response_error:
    if status_code == 401:  # Unauthorized
      # Redirecionar para login da plataforma
      SeniorXAuth.redirectToLogin()
    
    return error

# Aplicar em:
# - Angular: HttpInterceptor
# - React: Axios interceptor / Fetch wrapper
# - Vue: Axios interceptor
# - Vanilla JS: Fetch API wrapper
```

### 1.5 Logout

**Gerenciado pela SeniorX Platform:**

```yaml
# Fluxo de Logout (implementar no framework escolhido)

Logout_Function:
  trigger: User clicks logout button
  
  implementation:
    # Chamar método do SDK SeniorX
    SeniorXAuth.logout()
    
    # A plataforma automaticamente:
    # - Invalida tokens (access + refresh)
    # - Limpa sessão local/cookies
    # - Redireciona para página de login
  
  example_usage:
    # HTML/Template:
    <button onclick="handleLogout()">Sair</button>
    
    # JavaScript/Handler:
    function handleLogout() {
      SeniorXAuth.logout();
    }
```

### 1.6 Informações do Usuário Autenticado

**Obter dados do usuário logado:**

```yaml
# SDK Method: getUserInfo()

SeniorXAuth.getUserInfo():
  description: "Retorna informações do usuário autenticado"
  
  returns:
    type: UserInfo object
    structure:
      id: string           # "user@company.com"
      name: string         # "João Silva"
      email: string        # "user@company.com"
      roles: array<string> # ["ROLE_RH_MANAGER"]
      empresa_id: string   # "emp_001"
      permissions: array<string>
  
  example_implementation:
    # Pseudocódigo
    userInfo = SeniorXAuth.getUserInfo()
    
    display("Bem-vindo, " + userInfo.name)
    
    if userInfo.roles.includes("ROLE_RH_ADMIN"):
      showAdminPanel()
```

### 1.7 Configuração Inicial

**Inicialização do SDK SeniorX Platform:**

```yaml
# Configuração de Inicialização (adaptar para framework escolhido)

SeniorXPlatform_Config:
  appId: "quadro-vagas"
  apiUrl: "https://api.senior.com.br"
  authRequired: true
  autoRefreshToken: true
  
  # Opções adicionais
  options:
    sessionTimeout: 3600      # segundos
    enableSSO: true
    enable2FA: true           # gerenciado pela plataforma
    logLevel: "info"          # debug, info, warn, error

# Inicialização na aplicação:
initialize_app:
  # Ao carregar aplicação
  SeniorXPlatform.initialize(config)
  
  # Aguardar inicialização
  await SeniorXPlatform.ready()
  
  # App pronto para uso
  startApplication()
```

**Notas Importantes:**
- ✅ 2FA é gerenciado pela SeniorX Platform (transparente para a aplicação)
- ✅ SSO funciona automaticamente se o usuário já estiver autenticado em outro sistema Senior
- ✅ Não é necessário armazenar tokens manualmente (gerenciado pela plataforma)
- ✅ Renovação de tokens é automática

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

### 2.5 Integração no Frontend (Proteção de Rotas)

**Especificação de Route Guard (implementar conforme framework):**

```yaml
# Lógica de Proteção de Rotas

Route_Protection:
  name: "AuthorizationGuard"
  
  logic:
    before_route_access:
      # Obter permissão requerida da rota
      required_permission = route.metadata.permission
      
      # Verificar com Platform Authorization
      has_permission = PlatformAuth.checkPermission(required_permission)
      
      if has_permission:
        allow_access()
      else:
        redirect_to('/acesso-negado')
  
  route_configuration:
    path: "/propostas/efetivar"
    component: EfetivarPropostasComponent
    guards: [AuthorizationGuard]
    metadata:
      permission: "quadro_vagas:propostas:approve_rh"

# Implementar em:
# - Angular: CanActivate
# - React: ProtectedRoute component
# - Vue: Navigation Guards (beforeEnter)
# - Next.js: Middleware
```

### 2.6 Integração em Componentes

**Hide/Show baseado em Permissão (especificação genérica):**

```yaml
# Lógica de Renderização Condicional

UI_Permission_Logic:
  
  # Exemplo 1: Botão Delete
  delete_button:
    visible_if: hasPermission('quadro_vagas:quadro:delete')
    on_click: deletarCargo()
    style: danger
    label: "🗑️ Deletar"
  
  # Exemplo 2: Menu Items
  menu_items:
    - label: "Novo Cargo"
      icon: "plus"
      visible_if: hasPermission('quadro_vagas:quadro:create')
      
    - label: "Efetivar Propostas"
      icon: "check"
      visible_if: hasPermission('quadro_vagas:propostas:approve_rh')

# Pseudocódigo de implementação:
function renderButton():
  if hasPermission('quadro_vagas:quadro:delete'):
    return <Button onClick={deletarCargo}>🗑️ Deletar</Button>
  else:
    return null

# Implementar em:
# - React: {hasPermission() && <Button/>}
# - Vue: v-if="hasPermission()"
# - Angular: *ngIf="hasPermission()"
# - Vanilla: CSS display: none
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

**Backend publica evento (especificação genérica):**

```yaml
# Estrutura de Evento Real-time

Notification_Event:
  event_type: "proposta.created"
  timestamp: "2025-12-15T10:30:00Z"  # ISO 8601
  data:
    proposta_id: "145"
    tipo: "Inclusão"
    solicitante: "Maria Silva"
    approve_urls:
      nivel_1: "/api/propostas/145/approve"

# Publicação (Backend)
Publish_Methods:
  
  WebSocket:
    channel: "notifications"
    event: "notification"
    payload: NotificationEvent
    # Implementar com: Socket.IO, WS, SignalR, etc.
  
  Server_Sent_Events:
    endpoint: "/api/notifications/stream"
    format: "data: {json}\n\n"
    content_type: "text/event-stream"
```

**Frontend recebe e exibe (especificação genérica):**

```yaml
# Lógica de Recepção de Notificações

Notification_Handler:
  
  on_component_init:
    # Conectar ao canal de notificações
    subscribe_to_channel('proposta.created')
  
  on_event_received:
    event = received_event
    
    # Exibir notificação visual
    show_toast(
      title: "Proposta #" + event.data.proposta_id
      body: event.data.solicitante + " enviou para aprovação"
      icon: "info"
      duration: 5000  # ms
    )
    
    # Tocar som (opcional)
    play_notification_sound()
    
    # Ação ao clicar
    on_click: navigate("/propostas/" + event.data.proposta_id)
  
  on_component_destroy:
    # Desconectar
    unsubscribe_from_channel()

# Implementar com:
# - WebSocket: socket.io-client, ws, native WebSocket
# - SSE: EventSource API, fetch with stream
# - Toast: biblioteca de notificação do framework escolhido
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

## 📊 INTEGRAÇÃO 5: MARKET DATA ANALYTICS - OPCIONAL

### 5.1 Objetivo
Importar dados de mercado mensalmente para análise competitiva.

**Nota:** Esta integração é **OPCIONAL**. Pode usar Glassdoor, LinkedIn ou qualquer outra fonte de dados de mercado.

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

```yaml
# Especificação de Job Agendado

Scheduled_Job:
  name: "Import Market Data"
  schedule: "0 0 1 * *"  # Cron: 1º dia de cada mês às 00:00
  timezone: "America/Sao_Paulo"
  
  execution_flow:
    
    step_1_fetch_glassdoor:
      action: API call to Glassdoor
      endpoints:
        - GET /salaries
        - GET /benefits
      store_in: glassdoor_data
    
    step_2_fetch_linkedin:
      action: API call to LinkedIn
      endpoints:
        - GET /trends
      store_in: linkedin_data
    
    step_3_map_and_validate:
      action: Transform data
      input:
        - glassdoor_data
        - linkedin_data
      output: market_data (normalized)
      validations:
        - Check required fields
        - Validate date ranges
        - Remove duplicates
    
    step_4_persist:
      action: Save to database
      table: market_data_salario, market_data_beneficios, market_data_trends
      data: market_data
    
    step_5_notify:
      action: Send notification via Platform Notifications
      recipients: ["rh@company.com"]
      template: "market_data_imported"
      message: "Dados de mercado atualizados com sucesso"
  
  error_handling:
    on_error:
      - Log error details
      - Send alert to admins
      - Retry: 3 attempts with 5min interval
      - If all fail: escalate to support
  
  logging:
    success: "Market data imported successfully"
    error: "Error importing market data: {error_message}"

# Implementar com:
# - Node.js: node-cron, agenda, bull
# - Python: APScheduler, Celery
# - Java: Quartz, Spring @Scheduled
# - Serverless: AWS Lambda + EventBridge, Azure Functions + Timer
```

---

## 🤖 INTEGRAÇÃO 6: IA/ML (Previsão de Demanda) - OPCIONAL

### 6.1 Objetivo
Usar ML models para prever demanda de vagas baseado em histórico + sazonalidade.

**Nota:** Esta integração é **OPCIONAL**. Pode ser implementada com qualquer plataforma de ML (BigQuery ML, Azure ML, AWS SageMaker, TensorFlow, scikit-learn, etc.)

### 6.2 Arquitetura

```
DADOS HISTÓRICOS
├─ Admissões por mês/cargo
├─ Desligamentos por mês/cargo
├─ Sazonalidade (Q1, Q2, etc)
├─ Crescimento histórico
└─ Turnover por cargo
      ↓
PLATAFORMA ML (Escolher uma):
├─ BigQuery ML (Google Cloud)
├─ Azure Machine Learning
├─ AWS SageMaker
├─ Python (scikit-learn, TensorFlow, PyTorch)
└─ R, Julia, ou outra plataforma
      ↓
MODELO TREINADO
├─ Input: Cargo, Período
├─ Output: Vagas previstas, Confiança %
└─ Features: Histórico, Sazonalidade, Tendência
      ↓
BACKEND QUADRO VAGAS
├─ Query modelo via API da plataforma escolhida
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

MODEL PREDICTION (Exemplo com qualquer plataforma ML):
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

### 6.4 Exemplo de Implementação (BigQuery ML)

**Nota:** Este é apenas UM exemplo. Pode ser implementado com qualquer plataforma ML.

```sql
-- EXEMPLO usando BigQuery ML (Google Cloud)
-- Pode ser adaptado para Azure ML, AWS SageMaker, Python, etc.

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

```yaml
# Configuração de Requisições HTTP Seguras

HTTP_Request_Config:
  
  protocol: HTTPS  # Obrigatório (TLS 1.3)
  base_url: "https://api.senior.com"
  
  headers:
    Authorization: "Bearer {access_token}"
    Content-Type: "application/json"
    X-Requested-With: "XMLHttpRequest"
  
  options:
    with_credentials: true  # Incluir cookies se necessário
    timeout: 30000          # 30 segundos
    retry: 3                # Tentar 3 vezes em caso de erro de rede
  
  validation:
    # Sempre verificar se URL usa HTTPS
    enforce_https: true
    # Rejeitar certificados inválidos
    verify_ssl: true

# Exemplo de uso (pseudocódigo):
request = HTTP.post(
  url: "https://api.senior.com/quadro/vagas",
  data: payload,
  headers: request_headers,
  config: http_config
)

# Implementar com:
# - Fetch API, Axios, HttpClient, Request library do framework escolhido
```

---

**Próximo:** PARTE 6 - Componentes UI/UX com Senior Design System

