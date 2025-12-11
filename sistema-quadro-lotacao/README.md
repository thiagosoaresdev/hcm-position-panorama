# Sistema de Gestão de Quadro de Lotação

Sistema corporativo para gestão de vagas, automatização de fluxos de aprovação e conformidade com a legislação brasileira (Lei 8.213 - PcD).

## 🚀 Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Senior Design System (SDS) + CSS Custom Properties
- **Routing**: React Router DOM
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Testing**: Vitest + Testing Library + fast-check (Property-Based Testing)
- **Build Tool**: Vite

## 📁 Estrutura do Projeto

```
src/
├── core/           # Guards, interceptors, services principais
├── shared/         # Componentes, utilitários compartilhados
├── modules/        # Módulos de funcionalidade (dashboard, quadro, etc)
├── components/     # Componentes UI reutilizáveis
├── services/       # Serviços de API e lógica de negócio
├── types/          # Definições TypeScript
├── utils/          # Funções utilitárias
├── test/           # Setup e utilitários de teste
└── assets/         # Recursos estáticos
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local
```

### Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Executar testes
npm run test

# Testes em modo watch
npm run test:watch

# Testes com UI
npm run test:ui

# Linting
npm run lint
```

### Configuração de Ambiente

Copie `.env.example` para `.env.local` e configure as variáveis:

```env
# Senior Platform APIs
VITE_PLATFORM_AUTH_URL=https://api.senior.com.br/auth
VITE_PLATFORM_AUTHZ_URL=https://api.senior.com.br/authorization
VITE_PLATFORM_NOTIFICATIONS_URL=https://api.senior.com.br/notifications

# OAuth
VITE_OAUTH_CLIENT_ID=QUADRO_VAGAS_APP
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/callback

# API
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🎨 Design System

O projeto utiliza o Senior Design System (SDS) com:

- **Tipografia**: Open Sans
- **Cores**: Palette SDS (Primary #1E90FF, Success #28A745, etc)
- **Responsividade**: Mobile-first, breakpoints definidos
- **Componentes**: Seguindo padrões SDS

### Breakpoints Responsivos

- **Mobile**: < 768px (1 coluna)
- **Tablet**: 768px - 1279px (2 colunas, sidebar colapsável)
- **Desktop**: ≥ 1280px (4 colunas, sidebar sempre visível)

## 🧪 Testes

### Estratégia de Testes

- **Unit Tests**: Testes específicos de componentes e funções
- **Property-Based Tests**: Testes com dados gerados automaticamente
- **Integration Tests**: Testes de fluxos completos

### Executando Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm run test -- Dashboard

# Testes com coverage
npm run test -- --coverage
```

## 📋 Módulos Implementados

### ✅ Concluído

1. **Estrutura Base**
   - Configuração Vite + TypeScript
   - Senior Design System integrado
   - Estrutura de pastas seguindo steering rules
   - Layout responsivo (AppShell, Header, Sidebar)
   - Dashboard básico com KPIs mockados

### 🚧 Em Desenvolvimento

Os próximos módulos serão implementados conforme o plano de tarefas:

2. **Database e Infraestrutura**
3. **Autenticação e Autorização**
4. **Modelos de Dados e Serviços**
5. **Gestão de Quadro de Lotação**
6. **Sistema de Normalização**
7. **Workflow de Propostas**
8. **Notificações**
9. **Conformidade PcD e Analytics**
10. **Integração RH Legado**

## 🔗 Integrações Obrigatórias

- **Platform Authentication**: OAuth 2.0 + SSO + 2FA
- **Platform Authorization**: RBAC/ACL
- **Platform Notifications**: Email/SMS/In-app
- **RH Legado API**: Webhooks para sincronização

## 📖 Documentação

- [Requirements](.kiro/specs/sistema-quadro-lotacao/requirements.md)
- [Design Document](.kiro/specs/sistema-quadro-lotacao/design.md)
- [Task List](.kiro/specs/sistema-quadro-lotacao/tasks.md)
- [Steering Rules](.kiro/steering/quadro-vagas-core-rules.md)

## 🤝 Contribuição

1. Siga as steering rules definidas
2. Mantenha conformidade com SDS
3. Escreva testes para novas funcionalidades
4. Use TypeScript rigorosamente
5. Documente mudanças significativas

## 📄 Licença

Propriedade da Senior Sistemas S.A.