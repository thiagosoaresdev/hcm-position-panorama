# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 1: RESUMO EXECUTIVO E VISÃO DO PRODUTO

---

## 📋 INFORMAÇÕES DO DOCUMENTO
- **Data:** 10 de Dezembro de 2025
- **Versão:** 1.0 - Estrutura Base
- **Status:** Em Desenvolvimento
- **Plataforma:** Lovable.dev (Framework agnóstico + Senior Design System)
- **Público:** Desenvolvedores Frontend/Backend, Product Managers, UX Designers
- **Restrições Obrigatórias:** ✅ Senior Design System | ✅ Platform Authentication | ✅ Platform Authorization | ✅ Platform Notifications

---

## 🎯 EXECUTIVE SUMMARY

O **Sistema de Gestão de Quadro de Lotação** é uma solução corporativa que centraliza o gerenciamento de vagas, colaboradores e recursos humanos em conformidade com legislação (Lei 8.213 - PcD). O sistema oferece visibilidade completa do quadro de pessoal (previsto vs efetivo), automatiza fluxos de aprovação de vagas, rastreia alterações históricas e fornece analytics inteligentes com previsões baseadas em IA.

### Valor Principal
- **Conformidade Legal:** Cálculo automático de quotas PcD (2-5% conforme Lei 8.213)
- **Rastreabilidade:** Histórico completo de alterações com auditoria (QUEM, QUANDO, MOTIVO, APROVADOR)
- **Automação:** Normalização automática do quadro efetivo em tempo real
- **Inteligência:** Previsão de demanda e análise competitiva de mercado

---

## 🌟 VISÃO DO PRODUTO

### Declaração de Visão
*"Transformar a gestão de recursos humanos em ferramentas ágeis, transparentes e data-driven, permitindo que gestores e RH tomem decisões fundamentadas em tempo real com conformidade legal garantida, usando a melhor tecnologia disponível mantendo conformidade com SDS, autenticação/autorização centralizada e notificações multicanal."*

### Objetivos Principais

| # | Objetivo | Descrição | Métricas |
|---|----------|-----------|----------|
| **O1** | Centralizar Dados | Consolidar quadro previsto, efetivo, reservas e propostas em única fonte verdade | 1 fonte de dados, 0 inconsistências |
| **O2** | Automatizar Workflows | Fluxo de aprovação configurável (3 níveis + RH) com notificações automáticas | 80% redução tempo aprovação |
| **O3** | Garantir Conformidade | Cálculo automático PcD + rastreabilidade completa para auditoria | 100% conformidade Lei 8.213 |
| **O4** | Análises Inteligentes | IA que prevê demanda de vagas e compara competitividade de mercado | Acurácia > 85% em previsões |
| **O5** | Gestão Histórica | Timeline completa de alterações no quadro com possibilidade de filtros | 100% rastreabilidade |

---

## 👥 PERSONAS

### Persona 1: Gerente de RH
- **Responsabilidades:** Aprovação de vagas, normalização, análise de mercado
- **Necessidades:** Dashboard executivo, relatórios, previsões, controle de workflow
- **Permissões:** Criar planos, gerar normalização, aprovar em primeiro nível

### Persona 2: Coordenador de Área
- **Responsabilidades:** Solicitação de vagas, propostas de alteração
- **Necessidades:** Visualizar quadro atual, simular mudanças, acompanhar propostas
- **Permissões:** Visualizar quadro, criar propostas (requer aprovação)

### Persona 3: Diretor/Gerente
- **Responsabilidades:** Aprovação final de propostas estratégicas
- **Necessidades:** Visão de alto nível, análise de impacto, tendências
- **Permissões:** Aprovar em segundo/terceiro nível, receber notificações críticas

### Persona 4: Analista de RH
- **Responsabilidades:** Manutenção do cadastro, processamento normalização
- **Necessidades:** Interfaces detalhadas, controle fino, exportação de dados
- **Permissões:** Manutenção completa, geração de relatórios

---

## 🏗️ ARQUITETURA FUNCIONAL - VISÃO GERAL

```
┌─────────────────────────────────────────────────────────────┐
│                   DASHBOARD EXECUTIVO                        │
│  (KPIs, Previsões IA, Alerts, Atividades Recentes)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  QUADRO LOTAÇÃO  │  NORMALIZAÇÃO    │    PROPOSTAS     │
│  ├─Manutenção    │  ├─Quadro Previsto
│  ├─Funções       │  ├─Quadro Efetivo│  ├─Gestão       │
│  ├─Cargos        │  └─Histórico    │  └─Efetivar     │
│  ├─Reservas      │                 │   (Workflow)     │
│  └─Definições    │                 │                  │
└──────────────────┴──────────────────┴──────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      ANALYTICS/INSIGHTS                      │
│  ├─Consulta Vagas  ├─Comparativo ├─PcD ├─Competitividade  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 MÓDULOS FUNCIONAIS

### Módulo 1: Dashboard
- **Escopo:** Visão executiva com KPIs, alertas e atividades
- **Componentes:** Cards com indicadores, gráficos, timeline, ações rápidas
- **Usuários:** Todos os perfis

### Módulo 2: Quadro de Lotação
- **Escopo:** Gerenciamento estruturado do quadro de vagas
- **Sub-módulos:**
  - Manutenção do Quadro (Vagas por Posto)
  - Funções (Permissões de alteração)
  - Reservas (Vagas em processo seletivo)
  - Definições por Usuário (Exceções de permissão)

### Módulo 3: Normalização
- **Escopo:** Sincronização de quadro previsto ↔ efetivo
- **Tipos:** Diária ou por Competência (mensal)
- **Conversões:** Efetivo→Previsto, Previsto→Previsto

### Módulo 4: Propostas
- **Escopo:** Fluxo de aprovação de alterações (3 níveis + RH)
- **Sub-módulos:**
  - Gestão (criar/editar propostas)
  - Efetivar (workflow com notificações)

### Módulo 5: Analytics
- **Escopo:** Insights e análises de dados
- **Sub-módulos:**
  - Consulta Vagas Previstas
  - Parâmetros de Comparação
  - Ocupação de Vagas
  - Pessoas com Deficiência (PcD)
  - Dashboard Analytics

---

## 🏢 ESTRUTURA ORGANIZACIONAL

```
EMPRESA
├── FILIAL (matriz/múltiplas filiais suportadas)
│   └── POSTO DE TRABALHO (entidade principal do quadro)
│       │
│       ├── Características Obrigatórias:
│       │   ├── Centro de Custo (Departamento/Área)
│       │   ├── Cargo
│       │   ├── Filial
│       │   ├── Local
│       │   └── Tipo de Colaborador
│       │
│       ├── Características Opcionais:
│       │   ├── Turno
│       │   ├── Escala
│       │   ├── Sindicato
│       │   ├── PcD (Pessoa com Deficiência)
│       │   └── Projeto/Fase
│       │
│       └── Controle de Vagas:
│           ├── Vagas Previstas (quantidade autorizada)
│           ├── Vagas Efetivas (colaboradores alocados)
│           └── Vagas Reservadas (em processo seletivo)
```

**Conceito de Posto de Trabalho:**
> O posto de trabalho representa um **agrupamento de características pré-determinadas** para ocupação de uma posição por um colaborador na empresa. A combinação única dessas características define um posto específico.

**Exemplos:**
- "Dev Backend Pleno - TI - Noturno - Matriz SP" = UM posto
- "Dev Backend Pleno - TI - Diurno - Matriz SP" = OUTRO posto (turno diferente)
- "Dev Backend Pleno - RH - Noturno - Matriz SP" = OUTRO posto (centro de custo diferente)

**Características:**
- Suporte a múltiplas filiais com quadros independentes
- Posto de Trabalho é a unidade atômica de gestão do quadro
- Cada Posto tem histórico completo de alterações
- Controles de acesso por Empresa/Filial/Centro de Custo
- Gestão de vagas previstas e efetivas por posto

---

## 📅 PLANO DE VAGAS

### Definição
Conjunto de vagas autorizadas para um período específico, com:
- **Data de Início** e **Data de Fim**
- **Duração:** Configurável (12 meses, 2 anos, período customizado)
- **Exemplo:** Plano 2025 (01/01/2025 - 31/12/2025), Plano Expansão (01/03/2025 - 31/12/2026)

### Características
- Múltiplos planos podem existir, mas **NÃO simultâneos**
- Cada plano vinculado a um período fiscal/orçamentário
- Normalizações são vinculadas a um plano específico
- Histórico mantido por plano (rastreabilidade temporal)

---

## 🔄 CICLO DE VIDA DA VAGA

```
[PLANO CRIADO]
      ↓
[VAGA PLANEJADA] → Definida no Quadro Previsto
      ↓
[PROPOSTA DE ALTERAÇÃO] → Fluxo de Aprovação (3 níveis + RH)
      ↓
[VAGA APROVADA] → Atualiza Quadro Previsto
      ↓
[RECRUTAMENTO] → Armazenada em RESERVAS
      ↓
[COLABORADOR ADMITIDO] → Atualiza Quadro Efetivo (automático)
      ↓
[VAGA OCUPADA] → Finaliza ciclo
      ↓
[TRANSFERÊNCIA/DESLIGAMENTO] → Retorna ao Quadro Efetivo (automático)
```

---

## ⚠️ REGRAS DE NEGÓCIO - PRIMÁRIAS

### RN-001: Normalização Automática
- Quando um colaborador é **admitido/transferido/desligado**, o Quadro Efetivo atualiza automaticamente
- Processamento em **tempo real** (não requer ação manual)
- Registra timestamp e usuário da ação

### RN-003: Controle de Vagas PcD
- Integrado ao quadro geral com **flag de prioridade PcD**
- Cálculo automático de % legal:
  - 2% para empresas 50-200 colaboradores
  - 3% para empresas 201-500 colaboradores
  - 4% para empresas 501-1000 colaboradores
  - 5% para empresas > 1000 colaboradores
- Alertas quando meta não atingida

### RN-004: Rastreabilidade de Alterações
- Toda alteração registra:
  - **QUEM:** Usuário que fez (login)
  - **QUANDO:** Data/Hora da alteração
  - **MOTIVO:** Campo texto (obrigatório em certos contextos)
  - **APROVADOR:** Usuário que aprovou (se aplicável)
  - **ANTES/DEPOIS:** Valores anteriores e novos
- Visível em timeline com filtros

### RN-005: Workflow de Aprovação Configurável
- Estrutura: **Coordenação → Gerente → Diretor → RH**
- Configurável por **Empresa/Área** (ex: pequena área pode ter Gerente → RH)
- Notificações automáticas em cada etapa
- Possibilidade de rejeição com feedback

### RN-006: Múltiplos Planos (Não Simultâneos)
- Apenas 1 plano ATIVO por vez
- Planos anteriores mantêm histórico
- Normalização é vinculada a 1 plano específico

---

## 🔐 PERMISSÕES - ESTRUTURA RESUMIDA

| Perfil | Dashboard | Quadro | Normalização | Propostas | Analytics |
|--------|-----------|--------|--------------|-----------|-----------|
| **RH (Admin)** | ✅ Completo | ✅ Total | ✅ Total | ✅ Aprovar Final | ✅ Completo |
| **Gerente** | ✅ Leitura | ✅ Leitura/Criar | ✅ Visualizar | ✅ Criar/Aprovar N1 | ✅ Leitura |
| **Coordenador** | ✅ Resumo | ✅ Leitura | ❌ Não | ✅ Criar | ✅ Leitura Limitada |
| **Analista RH** | ✅ Completo | ✅ Total | ✅ Total | ✅ Consultar | ✅ Completo |

---

## 📊 INDICADORES PRINCIPAIS (KPIs)

### Dashboard - Indicadores Inteligentes
1. **Taxa de Ocupação:** % de vagas ocupadas vs previstas (Meta: 95%)
2. **Custo por Contratação:** Evolução de custos de recrutamento
3. **Qualidade de Contratação:** Score de desempenho (Meta: 8.0+)
4. **Salário vs Mercado:** Posicionamento da empresa (+/- %)
5. **Retenção de Talentos:** Cargos com risco de turnover elevado
6. **Vagas em Aberto:** Dias médios de abertura (Impacto: R$ 450/dia)
7. **Previsão de Demanda:** Próximos 3-4 meses por cargo (IA)

### Cruzamentos Inteligentes (IA)
- **Salário × Permanência:** Correlação +0.76 (salário acima da média = 76% mais permanência)
- **Contratação × Performance:** Padrão 92% (Q1 contratações = 23% melhor performance)
- **Tempo Vaga × Custo:** +R$ 450/dia por vaga aberta
- **Trabalho Remoto × Aplicações:** +340% (3.4x mais candidatos qualificados)

---

## 🤖 INTELIGÊNCIA ARTIFICIAL - MÓDULOS

### IA-001: Previsão de Demanda
- **Entrada:** Histórico contratações, sazonalidade, crescimento, turnover
- **Saída:** Vagas previstas por cargo (próx. 3-4 meses) com % de confiança
- **Exemplo:** "+15 vagas Desenvolvedor Full Stack • Próx. 3 meses • 87%"
- **Atualização:** Periódica (semanal/quinzenal)

### IA-002: Análise de Competitividade
- **Dados Externos:** Glassdoor, LinkedIn, Surveys de Mercado
- **Indicadores:** Salário médio, benefícios, retenção
- **Saída:** Dashboard com posicionamento vs mercado
- **Frequência:** Mensal (importação manual)

### IA-003: Insights & Recomendações
- **Análise:** Correlações entre dados internos + mercado
- **Saída:** Cards com recomendações acionáveis
- **Exemplo:** "5 cargos críticos com risco de turnover elevado"

---

## 🔗 DEPENDÊNCIAS EXTERNAS

### APIs Senior X Platform
1. **Platform Authentication** → Login, SSO, 2FA
2. **Platform Authorization** → Controle de acesso baseado em roles
3. **Platform Notifications** → Alertas por email/SMS/in-app

### Integrações de Dados
1. **Glassdoor API** (se contratado) → Dados de mercado
2. **LinkedIn API** (se contratado) → Trends de contratação
3. **Sistema RH Legado** → Sincronização de colaboradores

### Design System
- **Senior Design System** (SDS) → Componentes, cores, tipografia, guidelines

---

## 📱 RESPONSIVIDADE

- **Desktop (>1280px):** Todas as funcionalidades
- **Tablet (768-1024px):** Funcionalidades principais
- **Mobile (<767px):** Consultas e leitura (edição limitada)
- **Breakpoints:** Seguir PrimeNG FlexGrid obrigatoriamente

---

## 🎨 TECNOLOGIA & DESIGN

- **Frontend Stack:** Agnóstico (React, Vue, Angular, Flutter, Next.js, etc) - escolher baseado em equipe
- **Design System:** Senior Design System (SDS) - OBRIGATÓRIO
- **Tipografia:** Open Sans (HTTPS: https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600,600i,700,700i)
- **Componentes Base:** Implementar conforme SDS guidelines (agnóstico a framework)
- **Autenticação:** Senior X Platform Authentication API - OBRIGATÓRIO
- **Autorização:** Senior X Platform Authorization API - OBRIGATÓRIO
- **Notificações:** Senior X Platform Notifications API - OBRIGATÓRIO

---

## ✅ CRITÉRIOS DE SUCESSO

| Critério | Métrica | Target |
|----------|---------|--------|
| Conformidade PcD | % Cálculos corretos | 100% |
| Rastreabilidade | Alterações registradas | 100% |
| Automação Normalização | Sincronização em tempo real | < 2 segundos |
| Previsão IA | Acurácia de demanda | > 85% |
| Aprovação Workflow | Tempo médio | < 2 dias |
| UX/UI SDS | Conformidade Design System | 100% |
| Performance | Carregamento Tabelas | < 3 segundos |
| Disponibilidade | Uptime | 99.5% |

---

## 📚 PRÓXIMOS PASSOS

1. **PARTE 2:** Módulos Principais (Dashboard, Quadro Lotação, Normalização)
2. **PARTE 3:** Módulos Complementares (Propostas, Analytics, Reservas)
3. **PARTE 4:** Fluxos Detalhados e Regras de Negócio Granulares
4. **PARTE 5:** Especificação de APIs e Integrações
5. **PARTE 6:** Componentes UI/UX com SDS
6. **PARTE 7:** Consolidação Final para Lovable.dev

---

**Documento Gerado:** 10/12/2025 | **Status:** Pronto para PARTE 2
