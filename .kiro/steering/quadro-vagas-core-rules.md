# STEERING RULES - SISTEMA QUADRO DE LOTAÇÃO
## Regras Fundamentais de Desenvolvimento

---

## 🎯 VISÃO E OBJETIVOS

### Objetivo Principal
Desenvolver um sistema corporativo de gestão de quadro de vagas que:
- Centraliza dados de vagas (previsto vs efetivo)
- Automatiza fluxos de aprovação configuráveis
- Garante conformidade legal (Lei 8.213 - PcD)
- Fornece rastreabilidade completa (auditoria)
- Oferece analytics inteligentes com IA

### Valor Entregue
- **Conformidade Legal:** Cálculo automático quotas PcD (2-5%)
- **Rastreabilidade:** Histórico completo (QUEM, QUANDO, MOTIVO, APROVADOR)
- **Automação:** Normalização em tempo real
- **Inteligência:** Previsões IA + análise competitiva

---

## 🔒 RESTRIÇÕES OBRIGATÓRIAS

### APIs Senior X Platform (NÃO NEGOCIÁVEIS)
1. **Platform Authentication** - OAuth 2.0 + SSO + 2FA
2. **Platform Authorization** - RBAC/ACL para controle acesso
3. **Platform Notifications** - Email/SMS/In-app multicanal
4. **Senior Design System (SDS)** - Componentes, cores, tipografia

### Tecnologia Base
- **Tipografia:** Open Sans (obrigatório)
- **Cores:** Palette SDS (Primary #1E90FF, Success #28A745, etc)
- **Responsividade:** Mobile-first, breakpoints definidos
- **Autenticação:** JWT tokens com refresh automático

---

## 📊 ESTRUTURA DE DADOS CORE

### Entidades Principais
```
EMPRESA
├── PLANO_VAGAS (período específico, não simultâneos)
│   ├── QUADRO_PREVISTO (vagas autorizadas)
│   ├── QUADRO_EFETIVO (colaboradores reais)
│   └── QUADRO_RESERVAS (vagas em seletivo)
├── CENTRO_CUSTO (hierárquico)
├── POSTO_TRABALHO (ex: "Service Desk - Analyst")
├── CARGO (ex: "Analista Pleno")
└── COLABORADOR (com flag PcD)
```

### Campos Obrigatórios
- **Auditoria:** QUEM, QUANDO, MOTIVO, APROVADOR, ANTES/DEPOIS
- **Rastreabilidade:** Timestamp ISO 8601, usuário login
- **PcD:** Flag boolean + cálculo automático percentual
- **Status:** Enum (Ativo, Inativo, Rascunho, Aprovado, etc)

---

## 🔄 REGRAS DE NEGÓCIO CRÍTICAS

### RN-001: Normalização Automática
- **Gatilho:** Admissão/Transferência/Desligamento
- **Processamento:** Tempo real (< 2 segundos)
- **Atualização:** Quadro Efetivo sincronizado automaticamente
- **Auditoria:** Registra QUEM, QUANDO, ANTES, DEPOIS

### RN-002: Cargo vs Cargo da Vaga
- **Detecção:** Validação na admissão (Cargo Previsto ≠ Cargo Real)
- **Ações Configuráveis:**
  - ALERTAR: Log discrepância, permite
  - PERMITIR: Sem restrição
  - BLOQUEAR: Impede admissão, exige aprovação
  - EXIGIR APROVAÇÃO: Workflow adicional

### RN-003: Controle PcD (Lei 8.213)
- **Cálculo Automático:**
  - 50-200 colaboradores: 2%
  - 201-500: 3%
  - 501-1000: 4%
  - >1000: 5%
- **Arredondamento:** Sempre para cima (7.5 → 8)
- **Alertas:** Dashboard exibe status conformidade

### RN-004: Workflow Configurável
- **Estrutura:** 3 níveis (Coordenação→Gerente→Diretor) + RH
- **Flexível:** Configurável por Empresa/Área
- **Rejeição:** Retorna "Rascunho" (solicitante edita)
- **Notificações:** Automática em cada transição

### RN-005: Múltiplos Planos
- **Vigência:** Apenas 1 plano ATIVO por período
- **Histórico:** Planos anteriores mantidos para auditoria
- **Normalização:** Vinculada a 1 plano específico

---

## 🏗️ ARQUITETURA DE MÓDULOS

### Módulo 1: Dashboard
- **KPIs:** Taxa Ocupação, Custo Contratação, Qualidade, Retenção
- **IA:** Previsão demanda (próximos 3-4 meses)
- **Insights:** Correlações automáticas (salário×permanência)
- **Timeline:** Atividades recentes (últimos 7 dias)

### Módulo 2: Quadro de Lotação
- **Manutenção:** CRUD vagas por posto trabalho
- **Funções:** Permissões granulares por role
- **Cargos Previstos:** Estrutura organizacional
- **Reservas:** Vagas em processo seletivo
- **Definições Usuário:** Exceções permissionamento

### Módulo 3: Normalização
- **Quadro Previsto:** Efetivo→Previsto, Previsto→Previsto
- **Quadro Efetivo:** Sincronização automática tempo real
- **Histórico:** Auditoria completa normalizações

### Módulo 4: Propostas
- **Gestão:** CRUD propostas alteração
- **Workflow:** 3 níveis + RH com notificações
- **Efetivação:** Aplica mudanças no quadro

### Módulo 5: Analytics
- **Consultas:** Vagas previstas com filtros
- **Comparativos:** Períodos, áreas, cargos
- **Ocupação:** Taxa por cargo/centro
- **PcD:** Conformidade Lei 8.213

---

## 🎨 PADRÕES UI/UX

### Layout Base
```
Header: Logo + Filtros Globais + Menu Usuário (56px)
Sidebar: Menu navegação 250px (desktop) / drawer (mobile)
Main: Conteúdo principal com padding 16-24px
```

### Componentes SDS
- **Cards KPI:** Border-left color-coded, hover effects
- **Tabelas:** Header #F8F9FA, rows alternadas, hover #F0F0F0
- **Modais:** Border-radius 8px, shadow alta, fade-in 200ms
- **Botões:** Primary #1E90FF, Success #28A745, Danger #DC3545
- **Badges Status:** Color-coded (✅ Aprovado, ⏳ Pendente, ❌ Rejeitado)

### Responsividade
- **Desktop (≥1280px):** 4 colunas
- **Tablet (768-991px):** 2 colunas, sidebar colapsável
- **Mobile (<768px):** 1 coluna, drawer menu

---

## 🔗 INTEGRAÇÕES OBRIGATÓRIAS

### Platform Authentication
```typescript
// OAuth 2.0 Flow obrigatório
const authConfig = {
  client_id: 'QUADRO_VAGAS_APP',
  redirect_uri: 'https://app.com/callback',
  scope: 'profile email',
  response_type: 'code'
};
```

### Platform Authorization
```typescript
// Verificação permissão antes de ação
const hasPermission = await authService.checkPermission(
  'quadro_vagas:quadro:update',
  { company_id, center_id, user_id }
);
```

### Platform Notifications
```typescript
// Notificação multi-canal
await notificationService.send({
  type: 'email',
  recipient: 'user@company.com',
  template: 'proposta_pendente',
  vars: { proposta_id, solicitante }
});
```

### RH Legado API
```typescript
// Webhook admissão automática
app.post('/webhooks/colaborador/admitido', (req, res) => {
  const { colaborador_id, cargo, centro } = req.body.data;
  await quadroService.atualizarEfetivo(colaborador_id);
  await auditService.registrar('admissao', colaborador_id);
});
```

---

## 📋 VALIDAÇÕES OBRIGATÓRIAS

### Validação de Dados
- **Duplicação:** Não permitir 2 cargos iguais no mesmo posto
- **Quadro Negativo:** Aviso se vagas < colaboradores atuais
- **Cargo Inexistente:** Bloquear se cargo não cadastrado
- **Centro Inativo:** Aviso se centro de custo inativo
- **Período Inválido:** Data fim deve ser > data início

### Segurança
- **HTTPS/TLS 1.3:** Toda comunicação encriptada
- **JWT Validation:** Tokens com expiração (1h), refresh (7 dias)
- **Input Sanitization:** Prevenir SQL injection, XSS
- **Rate Limiting:** Máximo requests por usuário/minuto
- **CORS:** Configurado apenas para domínios autorizados

---

## 🚀 FLUXOS CRÍTICOS

### Fluxo 1: Criação de Vaga
```
1. Gerente acessa Quadro Lotação → Novo Cargo
2. Preenche dados → Sistema valida duplicação
3. Clica "Enviar Aprovação" → Cria Proposta
4. Workflow 3 níveis: N1→N2→N3→RH
5. Cada aprovação → Notificação próximo nível
6. RH efetiva → Atualiza Quadro + Timeline
7. Notifica todos envolvidos
```

### Fluxo 2: Normalização Automática
```
1. RH Legado: Colaborador admitido
2. Webhook recebido → Valida dados
3. Atualiza Quadro Efetivo (tempo real)
4. Registra auditoria (QUEM, QUANDO, ANTES/DEPOIS)
5. Recalcula métricas (Taxa Ocupação, PcD)
6. Atualiza Dashboard → Notifica usuários
```

### Fluxo 3: Verificação PcD
```
1. Sistema calcula automático: Total × % obrigatório
2. Compara com PcD atuais
3. Se abaixo meta → Alerta Dashboard
4. Analytics mostra status conformidade
5. Recomendações: "Priorizar PcD próximas contratações"
```

---

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs Técnicos
- **Performance:** < 3s carregamento páginas
- **Uptime:** 99.5% disponibilidade
- **Error Rate:** < 0.1% requisições
- **Test Coverage:** > 90% código

### KPIs Negócio
- **Taxa Ocupação:** Meta 95%
- **Conformidade PcD:** 100%
- **Tempo Aprovação:** < 2 dias
- **User Adoption:** > 80%

---

## 🔧 DESENVOLVIMENTO

### Stack Agnóstico (Escolha Livre)
Equipe pode escolher melhor tecnologia baseado em expertise:
- **React.js** (agilidade)
- **Vue 3** (produtividade)
- **Angular 14+** (enterprise)
- **Next.js/Nuxt** (full-stack)
- **Flutter Web** (cross-platform)

### Estrutura Padrão
```
src/
├── core/ (guards, interceptors, services)
├── shared/ (components, directives, pipes)
├── modules/ (dashboard, quadro, propostas, etc)
├── assets/ (styles, images, icons)
└── environments/ (config por ambiente)
```

### Testes Obrigatórios
- **Unit Tests:** 90%+ coverage
- **Integration Tests:** APIs e workflows
- **E2E Tests:** Fluxos críticos
- **Security Tests:** OWASP Top 10

---

## 📝 DOCUMENTAÇÃO REQUERIDA

### Técnica
- API Documentation (Swagger/OpenAPI)
- Component Library (Storybook)
- Deployment Guide
- Troubleshooting Guide

### Usuário
- Manual do Usuário
- Vídeos tutoriais
- FAQ
- Guia de Treinamento

---

## ⚠️ ALERTAS E CUIDADOS

### Não Fazer
❌ Ignorar APIs Senior X Platform
❌ Criar autenticação própria
❌ Usar cores fora da palette SDS
❌ Permitir múltiplos planos simultâneos
❌ Normalização manual (deve ser automática)

### Sempre Fazer
✅ Validar permissões antes de ações
✅ Registrar auditoria em alterações
✅ Notificar usuários em mudanças
✅ Calcular PcD automaticamente
✅ Manter rastreabilidade completa

---

## 🎯 CRITÉRIOS DE ACEITE

### Funcional
- [ ] Todos os módulos implementados
- [ ] Workflows funcionando
- [ ] Integrações ativas
- [ ] Notificações enviando
- [ ] Analytics calculando

### Não-Funcional
- [ ] Performance < 3s
- [ ] Responsivo em 3+ devices
- [ ] Acessibilidade WCAG 2.1
- [ ] Segurança validada
- [ ] Conformidade SDS 100%

---

**Estas steering rules devem ser seguidas rigorosamente durante todo o desenvolvimento para garantir conformidade com o PRD e qualidade do produto final.**