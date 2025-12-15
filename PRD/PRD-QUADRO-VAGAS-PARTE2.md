# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 2: MÓDULOS PRINCIPAIS (Dashboard, Quadro de Lotação, Normalização)

---

## 1️⃣ MÓDULO: DASHBOARD

### 1.1 Visão Geral
Dashboard executivo que fornece visão holística do quadro de vagas, alertas críticos, previsões de IA e atividades recentes. Primeira página após login, personalizable por perfil de usuário.

### 1.2 Componentes Estruturais (SDS)

#### 1.2.1 Header Funcional
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard  [Breadcrumb: Dashboard]  [Filtros] [User]│
└─────────────────────────────────────────────────────────────┘
```
- **Logo:** Senior X
- **Título:** "Dashboard - Quadro de Lotação"
- **Filtros Globais:** Empresa, Período, Centro de Custo (dropdown)
- **Menu Usuário:** Perfil, Configurações, Logout

#### 1.2.2 Painéis de Indicadores (Cards SDS)
Organização em **Grid 4 Colunas** (1280px+), responsivo em tablets e mobile.

**Grupo 1: Ocupação & Meta**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Taxa Ocup.   │ │ Custo Contr.  │ │ Qualidade    │ │ Salário vs M.│
│ 96.5%        │ │ R$ 3.2k      │ │ 8.4/10       │ │ +12.5%       │
│ Meta: 95%    │ │ Budget: 4.5k │ │ Meta: 8.0    │ │ Acima Setor  │
│ ✅ Acima     │ │ ✅ 29% ↓     │ │ ✅ Em Alta   │ │ ✅ Positivo  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Benefícios   │ │ Retenção     │ │ Vagas Abertas│ │ Trabalho Rem.│
│ 8.2/10       │ │ ❌ Crítico   │ │ 12 dias      │ │ +340%        │
│ 82% Competit.│ │ 5 Cargos      │ │ R$ 450/dia   │ │ vs Presencial│
│ ✅ Bom       │ │ Risco Alto    │ │ ⚠️ Atenção  │ │ ✅ Tendência │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Características Card:**
- **Ícone** SDS color-coded (✅ verde, ⚠️ amarelo, ❌ vermelho)
- **Valor Principal** em fonte grande (H2)
- **Métrica Secundária** em tamanho menor
- **Status Badge** com cor de alerta
- **Clicável:** Navega para análise detalhada

#### 1.2.3 Seção: Previsão de Demanda (IA)

**Componente:** Cards em linha horizontal com scroll
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 PREVISÃO DE DEMANDA (IA) - Próximos 3 Meses             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ Dev Full Stack  │ │ Analista Dados  │ │ Gerente Proj.   ││
│ │ 📈 Alta         │ │ 📊 Crescente    │ │ ➡️ Estável      ││
│ │ +15 vagas       │ │ +8 vagas        │ │ +3 vagas        ││
│ │ Próx. 3 meses  │ │ Próx. 2 meses  │ │ Próx. 4 meses  ││
│ │ 87% confiança   │ │ 92% confiança   │ │ 78% confiança   ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

- **Icones Trend:** 📈 (alta), 📊 (crescente), ➡️ (estável), 📉 (queda)
- **Clicável:** Expande para análise detalhada
- **Cores SDS:** Verde (alta demanda), Azul (crescimento), Amarelo (estável)

#### 1.2.4 Seção: Análise de Competitividade

**Componente:** Painel com indicadores
```
┌──────────────────────────────────────────────────────────────┐
│ 🏆 ANÁLISE DE COMPETITIVIDADE - MERCADO                      │
├──────────────────────────────────────────────────────────────┤
│ • Salário Médio vs Mercado: +12.5%                           │
│ • Benefícios Oferecidos: 8.2/10 (82% competitivo)            │
│ • Retenção de Talentos: ⚠️ 5 cargos críticos com risco alto │
│                                                               │
│ [📊 Detalhes] [📤 Exportar] [🔄 Atualizar]                  │
└──────────────────────────────────────────────────────────────┘
```

- **Botão Detalhes:** Abre modal com análise completa
- **Atualizar:** Carrega dados do período selecionado (mensal)

#### 1.2.5 Seção: Cruzamentos Inteligentes (Insights IA)

**Componente:** Cards informativos com ícones
```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 INSIGHTS & RECOMENDAÇÕES                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐            │
│ │ 💰 Salário × Perm.   │ │ 📌 Contrat. × Perf.  │            │
│ │ +0.76 Correlação     │ │ 92% Padrão           │            │
│ │ Salário acima média  │ │ Q1 contratações têm │            │
│ │ = 76% mais tempo     │ │ 23% melhor performance
│ │ [Detalhes]           │ │ [Detalhes]           │            │
│ └──────────────────────┘ └──────────────────────┘            │
│                                                               │
│ ┌──────────────────────┐ ┌──────────────────────┐            │
│ │ ⏱️ Vaga × Custo      │ │ 🌐 Remoto × Candidatos
│ │ +R$ 450/dia          │ │ +340% Aplicações     │            │
│ │ Cada dia adicional   │ │ 3.4x mais candidatos │            │
│ │ com vaga aberta      │ │ em vagas remotas     │            │
│ │ [Detalhes]           │ │ [Detalhes]           │            │
│ └──────────────────────┘ └──────────────────────┘            │
│                                                               │
│ [📋 Ver Todas] [💾 Salvar como Favorito]                    │
└─────────────────────────────────────────────────────────────┘
```

- **Cards com Accordion:** Expand/collapse para detalhes
- **Botão Detalhes:** Modal com explicação e recomendações acionáveis
- **Salvar Favorito:** Mantém insights na próxima visita

#### 1.2.6 Seção: Atividades Recentes (Timeline)

**Componente:** Timeline com eventos
```
┌──────────────────────────────────────────────────────────────┐
│ 📅 ATIVIDADES RECENTES - ÚLTIMOS 7 DIAS                      │
├──────────────────────────────────────────────────────────────┤
│ • 08/12 - 14:30 | Maria Silva criou Proposta #145            │
│   Inclusão: +1 Dev Pleno em TI                               │
│                                                               │
│ • 07/12 - 09:15 | RH aprovou Normalização Quadro Previsto   │
│   Período: 01/12/2024 - 30/11/2025 | 45 alterações          │
│                                                               │
│ • 06/12 - 16:45 | João Santos desligou-se                    │
│   Impacto: -1 vaga em "Gerente de Projetos" (TI)            │
│                                                               │
│ • 05/12 - 11:20 | Admissão Agendada: Ana Beatriz             │
│   Previsão: 15/01/2026 | Posto: DEV001 (Dev Pleno)        │
│                                                               │
│ [📋 Ver Histórico Completo...]                               │
└──────────────────────────────────────────────────────────────┘
```

- **Timeline Interativa:** Click em evento mostra detalhes
- **Filtro por Tipo:** Admissão, Desligamento, Proposta, Normalização
- **Link "Ver Histórico":** Abre aba Rastreabilidade completa

### 1.3 Comportamento & Interações

#### Filtros Globais
- **Empresa:** Dropdown (obrigatório, padrão = empresa logada)
- **Período:** Seletor data início/fim ou Plano de Vagas (dropdown)
- **Centro de Custo:** Autocomplete com hierarquia (opcional)
- **Botão Filtrar:** Atualiza todos cards
- **Botão Limpar:** Reseta filtros

#### Responsividade

| Viewport | Layout | Comportamento |
|----------|--------|---------------|
| > 1280px | 4 cols | Cards lado a lado |
| 992-1280px | 3 cols | Cards em 3 colunas |
| 768-992px | 2 cols | Cards em 2 colunas, stacked |
| < 768px | 1 col | Cards empilhados verticalmente, scroll |

#### Atualização de Dados
- **Automática:** A cada 5 minutos (background refresh)
- **Manual:** Botão "🔄 Atualizar" no canto superior direito
- **Real-time:** Normalização e admissões atualizam imediatamente

---

## 2️⃣ MÓDULO: QUADRO DE LOTAÇÃO

### 2.1 Visão Geral
Gerenciamento estruturado do quadro autorizado de vagas por Posto de Trabalho. Permite gerenciar vagas, definir permissões, controlar reservas (vagas em seletivo) e configurar exceções de usuário.

### 2.2 Estrutura de Navegação

```
QUADRO DE LOTAÇÃO (Menu Principal)
├── 1. MANUTENÇÃO DO QUADRO (Vagas por Posto)
│   └── Tabela: Posto de Trabalho, Vagas Previstas, Efetivas, Reservadas
│       ├── [+] Adicionar Posto ao Quadro
│       ├── [✏️] Editar Vagas
│       ├── [🗑️] Remover do Quadro
│       └── [📋] Detalhes do Posto
│
├── 2. FUNÇÕES (Permissões)
│   └── Tabela: Função, Descrição, Permissões (Incluir, Alterar, Deletar)
│       ├── [+] Adicionar Função
│       ├── [✏️] Editar
│       └── [🗑️] Deletar
│
├── 3. RESERVAS (Vagas em Seletivo)
│   └── Tabela: Posto, Status Seletivo, Data Abertura, Candidatos
│       ├── [✏️] Editar Status
│       └── [📊] Ver Detalhes Seletivo
│
└── 4. DEFINIÇÕES POR USUÁRIO (Exceções)
    └── Tabela: Usuário, Permissão Transferência, Permissão Admissão
        ├── [+] Adicionar Usuário
        ├── [✏️] Editar
        └── [🗑️] Deletar
```

### 2.3 Sub-módulo 1: Manutenção do Quadro

#### Objetivo
Permitir criação, edição e visualização do quadro autorizado de vagas por posto de trabalho.

#### Estrutura de Dados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Posto de Trabalho** | Select | ✅ | Posto já cadastrado (ex: "DEV001 - Dev Backend Pleno TI Noturno"). As características do posto (Centro Custo, Cargo, Turno, etc.) são definidas no cadastro do posto |
| **Vagas Previstas** | Number | ✅ | Quantidade autorizada para este posto |
| **Vagas Efetivas** | Number (RO) | 🔒 | Read-only (colaboradores alocados no posto - atualiza automático) |
| **Vagas Reservadas** | Number (RO) | 🔒 | Read-only (vagas em processo seletivo - atualiza automático) |
| **Data Início Controle** | Date | ✅ | Quando começou o controle deste posto |
| **Tipo Controle** | Select | ✅ | Diário / Por Competência (mensal) |
| **Observações** | Text Area | ⭕ | Notas gerenciais sobre este posto |
| **Ativo** | Checkbox | ✅ | Se o posto está ativo no quadro |

**Nota Importante:** O Posto de Trabalho é selecionado de uma lista pré-cadastrada. Para criar um novo posto com suas características (Centro de Custo, Cargo, Turno, Filial, etc.), utilize o cadastro específico de Postos de Trabalho no módulo de Tabelas do sistema.

#### Interface - Tabela Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MANUTENÇÃO DO QUADRO                         [+ Adicionar Posto ao Quadro] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filtros: [Empresa ▼] [Centro Custo ▼] [Cargo ▼] [Tipo Controle ▼] [Buscar]│
├─────────────────────────────────────────────────────────────────────────────┤
│ Código │ Posto de Trabalho                    │ Prev │ Efet │ Res │ Ações │
│─────────────────────────────────────────────────────────────────────────────│
│ DEV001 │ Dev Backend Pleno - TI - Noturno     │ 8    │ 7    │ 2   │[✏️][📋]│
│ DEV002 │ Dev Frontend Senior - TI - Diurno    │ 5    │ 4    │ 1   │[✏️][📋]│
│ GER001 │ Gerente Projetos - TI - Diurno       │ 1    │ 1    │ 0   │[✏️][📋]│
│ RH001  │ Analista RH Pleno - RH - Diurno      │ 3    │ 3    │ 0   │[✏️][📋]│
│ ADM001 │ Assistente Admin - ADM - Diurno      │ 2    │ 2    │ 0   │[✏️][📋]│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Nota:** A descrição completa do posto (incluindo Centro de Custo, Cargo, Turno, Filial, Local) aparece na coluna "Posto de Trabalho". Ao clicar em [📋 Detalhes], todas as características do posto são exibidas.

#### Ações Disponíveis

**[+ Adicionar Posto ao Quadro]**
- Abre Modal/Slide-in com formulário
- Campo principal: **Dropdown de Postos de Trabalho** (lista todos os postos cadastrados no sistema)
- Campos adicionais: Vagas Previstas, Data Início Controle, Tipo Controle, Observações
- Botões: Salvar, Cancelar
- Validação: Verificar se o posto já está no quadro (não permite duplicata)
- **Nota:** Se o posto desejado não existe, orientar usuário a cadastrá-lo primeiro em Tabelas > Postos de Trabalho

**[✏️ Editar]**
- Abre formulário pre-preenchido
- Campos editáveis: Vagas Previstas, Observações, Ativo
- Campos read-only: Vagas Efetivas, Vagas Reservadas
- Gera evento de auditoria (QUEM, QUANDO, ANTES, DEPOIS, MOTIVO)

**[📋 Detalhes]**
- Modal mostrando:
  - Informações completas do Posto
  - Histórico de alterações (Timeline)
  - Colaboradores atuais (linked)
  - Propostas pendentes para este Posto

**[🗑️ Deletar]**
- Soft delete (marca como inativo)
- Confirmação: "Tem certeza? Isto afetará histórico de normalização"
- Mantém dados para auditoria

### 2.4 Sub-módulo 2: Funções (Permissões)

#### Objetivo
Definir permissões granulares para cada função ao gerenciar quadro de vagas.

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Função** | Text | Nome da função (RH Manager, Gerente, Coordenador) |
| **Descrição** | Text | Descrição do papel |
| **Perm. Incluir Cargo** | Checkbox | Permite criar novo cargo/vaga |
| **Perm. Alterar Cargo** | Checkbox | Permite editar cargo existente |
| **Perm. Deletar Cargo** | Checkbox | Permite deletar cargo |
| **Perm. Criticar Inclusão** | Checkbox | Pode questionar inclusão sem vaga |
| **Perm. Criticar Transf.** | Checkbox | Pode questionar transferência sem vaga |
| **Perm. Gerar Normalização** | Checkbox | Pode rodar processo de normalização |
| **Perm. Aprovar Propostas** | Checkbox | Nível de aprovação (todos, própria área, etc) |

#### Interface

```
┌──────────────────────────────────────────────────────────────┐
│ FUNÇÕES - PERMISSÕES                     [+ Adicionar Função]│
├──────────────────────────────────────────────────────────────┤
│ Função │ Descrição │ Incluir │ Alterar │ Deletar │ Ações    │
│─────────────────────────────────────────────────────────────│
│ Admin  │ RH Super  │ ✅ SIM  │ ✅ SIM  │ ✅ SIM  │ [✏️] [🗑️]│
│ Gerente│ Gestor    │ ✅ SIM  │ ✅ SIM  │ ❌ NÃO  │ [✏️] [🗑️]│
│ Coord  │ Coordenador│ ⚠️ NÃO │ ❌ NÃO  │ ❌ NÃO  │ [✏️] [🗑️]│
└──────────────────────────────────────────────────────────────┘
```

### 2.5 Sub-módulo 3: Reservas

#### Objetivo
Controlar vagas em processo de seletivo (reservadas para recrutamento).

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Posto de Trabalho** | Select | Referência ao Posto de Trabalho que está em processo seletivo |
| **Status** | Select | Aberto / Em Triagem / Entrevista / Oferta / Fechado |
| **Data Abertura** | Date | Quando o seletivo começou |
| **Data Previsão** | Date | Quando se espera preencher |
| **Candidatos** | Number (RO) | Quantidade total de candidatos |
| **Qualificados** | Number (RO) | Candidatos em triagem/entrevista |
| **Empresa Recrutadora** | Text | Se terceirizado |
| **Observações** | Text Area | Detalhes do processo |

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ RESERVAS - VAGAS EM SELETIVO                                     │
├──────────────────────────────────────────────────────────────────┤
│ Posto de Trabalho            │ Status │ Abert. │ Prev. │ Cand. │ Ações│
│──────────────────────────────────────────────────────────────────│
│ DEV001 - Dev Backend Pleno TI│ Entrevist│ 01/12 │ 20/12 │ 5/45  │[✏️][📊]│
│ GER001 - Gerente Proj. TI    │ Triagem  │ 03/12 │ 15/01 │ 12/87 │[✏️][📊]│
│ ADM001 - Assistente Admin    │ Aberto   │ 05/12 │ 22/12 │ 3/18  │[✏️][📊]│
└──────────────────────────────────────────────────────────────────┘
```

**Ações:**
- **[✏️ Editar]:** Atualizar status, datas, observações
- **[📊 Detalhes]:** Modal com histórico do seletivo

### 2.7 Sub-módulo 5: Definições por Usuário

#### Objetivo
Exceções de permissionamento: usuários específicos que ignoram configurações globais.

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Usuário** | Select Lookup | Colaborador que terá permissão excepcional |
| **Ver Quadro Admissão** | Select | Verificar vagas disponíveis e permitir/bloquear admissão, ou não verificar |
| **Ver Quadro Transferências** | Select | Verificar vagas disponíveis e permitir/bloquear transferência, ou não verificar |
| **Observação** | Text Area | Por que este usuário é exceção |

#### Opções por Campo

**Ver Quadro Admissão:**
- ✅ Verificar vagas disponíveis e permitir admissão
- ⚠️ Verificar vagas disponíveis e bloquear admissão
- ❌ Não verificar vagas (permitir admissão sem vaga)

**Ver Quadro Transferências:**
- ✅ Verificar vagas disponíveis e permitir transferência
- ⚠️ Verificar vagas disponíveis e bloquear transferência
- ❌ Não verificar vagas (permitir transferência sem vaga)

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ DEFINIÇÕES POR USUÁRIO                   [+ Adicionar Usuário]   │
├──────────────────────────────────────────────────────────────────┤
│ Usuário │ Admissão │ Transferência │ Obs │ Ações                 │
│──────────────────────────────────────────────────────────────────│
│ Maria Silva │ ✅ Permitir │ ⚠️ Bloquear │ Diretora │ [✏️] [🗑️]  │
│ João Santos │ ❌ Não verif.│ ✅ Permitir │ CFO │ [✏️] [🗑️]      │
└──────────────────────────────────────────────────────────────────┘
```

**Impacto:** Usuários listados aqui **ignoram** configurações na tela de Empresas/Empresas.

---

## 3️⃣ MÓDULO: NORMALIZAÇÃO

### 3.1 Visão Geral
Processo de sincronização do Quadro Efetivo (colaboradores reais) com o Quadro Previsto (vagas autorizadas). Oferece 3 operações principais: Normalizar Quadro Previsto, Efetivo para Previsto, Previsto para Previsto.

### 3.2 Estrutura de Navegação

```
NORMALIZAÇÃO (Menu Principal)
├── 1. QUADRO PREVISTO
│   ├── Tipo de Controle (Diário / Por Competência)
│   ├── [Efetivo para Previsto] - Converter reais em previstos
│   ├── [Previsto para Previsto] - Replicar quadro
│   └── [Processar Normalização] - Executar
│
├── 2. QUADRO EFETIVO
│   ├── Período de Normalização (Data Início, Data Fim Opcional)
│   ├── Atenção: Apagará registros efetivos do período antes de processar
│   └── [Processar Normalização] - Executar
│
└── 3. HISTÓRICO DE NORMALIZAÇÃO
    └── Tabela: Data, Tipo, Postos Processados, Status, Usuário
```

### 3.3 Sub-módulo 1: Normalização Quadro Previsto

#### Objetivo
Gerenciar o quadro de vagas previstas com suporte a múltiplos tipos de controle e replicação de períodos.

#### Campos - Tipo de Controle

**Seletor Único (Obrigatório):**
- ☑️ **Diário** - Normalização acontece diariamente
- ☑️ **Por Competência** - Normalização mensal (por período fiscal)

#### Interface - Opção 1: Efetivo para Previsto

```
┌──────────────────────────────────────────────────────────────────┐
│ NORMALIZAÇÃO - QUADRO PREVISTO                                   │
│                                                                   │
│ Tipo de Controle de Quadro                                       │
│ ☑️ Diário    ☐ Por Competência                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [1] EFETIVO PARA PREVISTO                                        │
│ Apurar a quantidade de colaboradores alocados em cada posto e    │
│ gravá-lo como quadro previsto                                     │
│                                                                   │
│ Data Históricos:        [__ / __ / ____]  (dd/mm/aaaa)          │
│ (Data para buscar os colaboradores alocados em cada posto)        │
│                                                                   │
│ Data Geração:           [__ / __ / ____]  (dd/mm/aaaa)          │
│ (Data que será gravada no quadro previsto)                       │
│                                                                   │
│ [📌 Processar Efetivo→Previsto]                                 │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [2] PREVISTO PARA PREVISTO                                       │
│ Replicar o quadro previsto de uma competência para um período de │
│ competências                                                     │
│                                                                   │
│ Data Quadro:            [__ / __ / ____]  (dd/mm/aaaa)          │
│ (Data de onde será captado o quadro previsto que será replicado)│
│                                                                   │
│ Período Inicial:        [--- de ----]  (competência)            │
│ (Competência inicial para geração)                              │
│                                                                   │
│ Período Final:          [--- de ----]  (competência)            │
│ (Competência final para geração)                                │
│                                                                   │
│ ☑️ Considerar Observação                                         │
│ (Quando habilitada, as observações da Data do Quadro serão      │
│  replicadas no período informado)                               │
│                                                                   │
│ [📌 Processar Previsto→Previsto]                                │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [Limpar] [Processar Normalização]                                │
└──────────────────────────────────────────────────────────────────┘
```

#### Comportamento

**Efetivo para Previsto:**
1. Busca todos os colaboradores ativos na "Data Históricos"
2. Identifica o Posto de Trabalho de cada colaborador
3. Conta quantos colaboradores estão alocados em cada posto
4. Grava essas quantidades como "Vagas Previstas" na "Data Geração"
5. Cria registro de auditoria (QUEM, QUANDO, AÇÃO, POSTOS AFETADOS)

**Exemplo:**
- Data Históricos: 15/12/2025
- Colaboradores encontrados:
  - 8 em DEV001 (Dev Backend Pleno TI)
  - 3 em RH001 (Analista RH Pleno)
  - 5 em ADM001 (Assistente Admin)
- Resultado: Quadro previsto em 01/01/2026 terá DEV001=8, RH001=3, ADM001=5

**Previsto para Previsto:**
1. Copia quadro da "Data Quadro"
2. Replica para todos os períodos (Período Inicial até Final)
3. Opcionalmente copia observações
4. Permite replicação em massa de planejamentos

#### Botão: Processar Normalização

- **Ação:** Executa operação selecionada (1 ou 2)
- **Validação:** Verifica datas obrigatórias
- **Feedback:** Toast success/error
- **Spinner:** Shows loading enquanto processa
- **Resultado:** "✅ 45 registros processados em 2.3s"

### 3.4 Sub-módulo 2: Normalização Quadro Efetivo

#### Objetivo
Sincronizar quadro efetivo com base em movimentações de pessoal (admissões, transferências, desligamentos) em um período.

#### **⚠️ IMPORTANTE - Melhoria Aplicada:**
A normalização **agora processa TODOS os postos de trabalho** dentro do período informado, **independente da data de início do controle do posto**. O sistema normaliza automaticamente todos os postos que estiverem dentro do mesmo **Plano de Vagas** e período especificado, eliminando a necessidade de normalização posto a posto.

#### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Período Inicial** | Date | ✅ | Data inicio (será criada entrada nova se não existir; deletará registros do período antes de processar) |
| **Período Final** | Date | ⭕ | Data fim (opcional; se vazio, processa até hoje) |
| **Plano de Vagas** | Select | ✅ | Qual plano será normalizado |

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ NORMALIZAR - QUADRO EFETIVO                                      │
│                                                                   │
│ Gerar quadro efetivo com base no período informado               │
│                                                                   │
│ Este processo irá contar quantos colaboradores estão alocados em │
│ cada Posto de Trabalho, considerando as movimentações de pessoal  │
│ (admissões, transferências, desligamentos) no período informado.  │
│ cada local/centro de custo, cargo e turno como sendo o Quadro    │
│ Efetivo. As alterações nos históricos de local/centro de custo,  │
│ cargo e turno dos colaboradores serão consideradas no período    │
│ informado.                                                        │
│                                                                   │
│ ⚠️ ATENÇÃO: Ao processar a normalização, o sistema irá           │
│ primeiramente EXCLUIR os registros do Efetivo do período e,      │
│ após, irá efetuar a Normalização em todo o período, com base     │
│ nas datas em que houveram movimentações de colaboradores.        │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ PERÍODO DE NORMALIZAÇÃO                                          │
│ Defina o período para geração do quadro efetivo                 │
│                                                                   │
│ Plano de Vagas:         [Plano 2025 ▼]                           │
│                                                                   │
│ Período Inicial:        [__ / __ / ____]  (dd/mm/aaaa)          │
│ Data inicial para verificar as movimentações de pessoal e gerar  │
│ o quadro efetivo.                                                │
│                                                                   │
│ Período Final (Opcional): [__ / __ / ____]  (dd/mm/aaaa)        │
│ Data final para verificar as movimentações de pessoal. Quando    │
│ não informado, o sistema verificará todas as movimentações após  │
│ o período inicial.                                               │
│                                                                   │
│ ⚠️ Melhoria: A normalização agora processa TODOS os postos de    │
│ trabalho dentro do período informado, independente da data de    │
│ início do controle do posto.                                     │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [Limpar] [Processar Normalização]                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Comportamento - Processamento Detalhado

1. **Verificação de Período:**
   - Se registros efetivos existem no período, deleta (soft delete ou hard delete conforme política)
   
2. **Iteração por Plano de Vagas:**
   - Pega todos os Postos de Trabalho do Plano informado
   - **NÃO filtra por "Data Início Controle"** (melhoria aplicada)

3. **Para cada Posto:**
   - Busca todas as movimentações (admissões, transferências, desligamentos) no período
   - Conta quantos colaboradores estão alocados no posto em cada data de movimentação
   - Identifica o Posto através das características do colaborador (Centro Custo, Cargo, Filial, Local, Turno, etc.)
   - Contabiliza estado final (quantidade de colaboradores alocados)
   
4. **Considerações Especiais:**
   - Sistema identifica o posto automaticamente pelas características do colaborador
   - Processo **não considera** indicação de módulos ao contar colaboradores
   - Movimentações posteriores ao "Período Final" **ficam de fora** da normalização

5. **Resultado:**
   - Atualiza "Vagas Efetivas" de cada Posto no quadro
   - Cria logs de auditoria para cada Posto atualizado
   - Exibe resumo: "✅ 87 postos normalizados, 3 erros" (com detalhes)
   
**Exemplo prático:**
- Posto DEV001: Dev Backend Pleno - TI - Noturno
- Sistema busca colaboradores com: Centro=TI, Cargo=Dev Backend (qualquer nível), Turno=Noturno
- Encontra: 7 Dev Pleno + 1 Dev Junior = 8 colaboradores
- Atualiza: DEV001.VagasEfetivas = 8

#### Botão: Processar Normalização

- **Validação:** Verifica Período Inicial (obrigatório)
- **Confirmação:** Modal "Tem certeza? Isto apagará dados do período XXX"
- **Execução:** Background job (pode ser assíncrono)
- **Feedback:** Toast com resultado ou modal com detalhes se erros

### 3.5 Sub-módulo 3: Histórico de Normalização

#### Objetivo
Auditoria completa de todas as normalizações executadas.

#### Tabela

| Campo | Descrição |
|-------|-----------|
| **Data Execução** | Quando foi processada |
| **Tipo** | "Previsto", "Efetivo", "Efetivo→Previsto" |
| **Período** | "01/12/2025 - 31/12/2025" |
| **Postos Processados** | Quantidade (ex: 45) |
| **Registros Alterados** | Quantidade de mudanças |
| **Status** | ✅ Sucesso / ⚠️ Parcial / ❌ Erro |
| **Usuário** | Quem executou |
| **Ações** | [📋 Detalhes] |

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ HISTÓRICO DE NORMALIZAÇÃO                                        │
├──────────────────────────────────────────────────────────────────┤
│ Data │ Tipo │ Período │ Postos │ Alterações │ Status │ Usuário  │
│─────────────────────────────────────────────────────────────────│
│ 08/12│ Efet │ 01-31/12│ 87 │ 145 │ ✅ Ok │ Maria │ [📋]      │
│ 01/12│ Prev │ 01-31/12│ 45 │ 67  │ ✅ Ok │ João  │ [📋]      │
│ 30/11│ Efet │ 01-30/11│ 87 │ 234 │ ✅ Ok │ Maria │ [📋]      │
│ 25/11│ Efet │ 01-25/11│ 45 │ 89  │ ⚠️ Parc│ João │ [📋]      │
└──────────────────────────────────────────────────────────────────┘
```

**Botão [📋 Detalhes]:**
- Modal mostrando:
  - Parâmetros executados
  - Postos processados com status individual
  - Erros ocorridos (se houver)
  - Log completo de alterações

---

## 📌 TRANSIÇÕES ENTRE MÓDULOS

- **Dashboard → Quadro Lotação:** Click em KPI ou card de alerta
- **Quadro Lotação → Normalização:** Button "Processar Normalização"
- **Normalização → Histórico:** Automático após execução
- **Quadro Lotação → Propostas:** Quando cria alteração que requer aprovação

---

**Próximo:** PARTE 3 - Módulos Complementares (Propostas, Analytics, Reservas)

