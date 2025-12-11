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
│ 93.2%        │ │ R$ 3.2k      │ │ 8.4/10       │ │ +12.5%       │
│ Meta: 95%    │ │ Budget: 4.5k │ │ Meta: 8.0    │ │ Acima Setor  │
│ ✅ Acima     │ │ ✅ 29% ↓     │ │ ✅ Em Alta   │ │ ✅ Positivo  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Benefícios   │ │ Retenção     │ │ Vagas Abertas│ │ Trabalho Rem.│
│ 8.2/10       │ │ ⚠️ Crítico   │ │ 12 dias      │ │ +340%        │
│ 82% Competit.│ │ 5 Cargos      │ │ R$ 450/dia   │ │ vs Presencial│
│ ✅ Bom       │ │ ❌ Risco Alto │ │ ⚠️ Atenção  │ │ ✅ Tendência │
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
│   Transferência: Analista Junior → Senior (TI)               │
│                                                               │
│ • 07/12 - 09:15 | RH aprovou Normalização Quadro Previsto   │
│   Período: 01/12/2025 - 30/11/2025 | 45 alterações          │
│                                                               │
│ • 06/12 - 16:45 | João Santos desligou-se                    │
│   Impacto: -1 vaga em "Gerente de Projetos" (TI)            │
│                                                               │
│ • 05/12 - 11:20 | Admissão: Carlos Mendes                    │
│   Cargo: Dev Full Stack (Confirmado: Dev Junior)             │
│   ⚠️ Discrepância: Cargo ≠ Vaga (Permitido)                  │
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
Gerenciamento estruturado do quadro autorizado de funções e vagas. Permite CRUD de vagas, definição de permissões, visualização de cargos previstos, reservas e exceções de usuário.

### 2.2 Estrutura de Navegação

```
QUADRO DE LOTAÇÃO (Menu Principal)
├── 1. MANUTENÇÃO DO QUADRO
│   └── Tabela: Empresa, Centro Custo, Posto Trabalho, Cargo, Vagas Previstas
│       ├── [+] Novo Cargo
│       ├── [✏️] Editar
│       ├── [🗑️] Deletar
│       └── [📋] Detalhes
│
├── 2. FUNÇÕES (Permissões)
│   └── Tabela: Função, Descrição, Permissões (Incluir, Alterar, Deletar)
│       ├── [+] Adicionar Função
│       ├── [✏️] Editar
│       └── [🗑️] Deletar
│
├── 3. CARGOS PREVISTOS
│   └── Tabela: Cargo, Estrutura, Classe, Nível, Percentual
│       ├── [+] Novo Cargo
│       ├── [✏️] Editar
│       └── [🗑️] Deletar
│
├── 4. RESERVAS
│   └── Tabela: Vaga, Status Seletivo, Data Abertura, Candidatos
│       ├── [✏️] Editar Status
│       └── [📊] Ver Detalhes Seletivo
│
└── 5. DEFINIÇÕES POR USUÁRIO
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
| **Empresa** | Select | ✅ | Filial selecionada |
| **Centro de Custo** | Select Hier. | ✅ | Departamento/Área |
| **Posto de Trabalho** | Select | ✅ | Ex: "Service Desk - Analyst" |
| **Cargo** | Select | ✅ | Cargo associado |
| **Cargo da Vaga** | Text | ⭕ | Campo customizado (diferente do cargo real) |
| **Vagas Previstas** | Number | ✅ | Quantidade autorizada |
| **Vagas Efetivas** | Number (RO) | 🔒 | Read-only (atualiza automático) |
| **Vagas Reservadas** | Number (RO) | 🔒 | Read-only (atualiza automático) |
| **Data Início Controle** | Date | ✅ | Quando começou o controle |
| **Tipo Controle** | Select | ✅ | Diário / Por Competência (mensal) |
| **Observações** | Text Area | ⭕ | Notas gerenciais |
| **Ativo** | Checkbox | ✅ | Flag de ativação |

#### Interface - Tabela Principal

```
┌────────────────────────────────────────────────────────────────────────┐
│ MANUTENÇÃO DO QUADRO                      [+ Novo Cargo]              │
├────────────────────────────────────────────────────────────────────────┤
│ Filtros: [Empresa ▼] [Centro Custo ▼] [Tipo Controle ▼] [Buscar...]   │
├────────────────────────────────────────────────────────────────────────┤
│ Centro │ Posto de Trabalho │ Cargo │ Prev │ Efet │ Reserv │ Ações    │
│─────────────────────────────────────────────────────────────────────────│
│ TI     │ Service Desk      │ Analista Pl. │ 5 │ 4 │ 1 │ [✏️] [📋] │
│ TI     │ Service Desk      │ Assistente Jr.│ 0 │ 0 │ 0 │ [✏️] [📋] │
│ TI     │ Dev Full Stack    │ Dev Pleno    │ 8 │ 7 │ 2 │ [✏️] [📋] │
│ RH     │ Gerente RH        │ Gerente      │ 1 │ 1 │ 0 │ [✏️] [📋] │
│ ADM    │ Administrativo    │ Admin        │ 3 │ 3 │ 0 │ [✏️] [📋] │
└────────────────────────────────────────────────────────────────────────┘
```

#### Ações Disponíveis

**[+ Novo Cargo]**
- Abre Modal/Slide-in com formulário
- Campos: Centro Custo, Posto, Cargo, Vagas, Tipo Controle, etc.
- Botões: Salvar, Cancelar
- Validação: Verificar duplicata (Centro + Posto + Cargo)

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

### 2.5 Sub-módulo 3: Cargos Previstos

#### Objetivo
Cadastro de cargos com estrutura organizacional, classe e nível para suporte à normalização.

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Cargo** | Text | Nome (ex: "Analista de Sistemas Pleno") |
| **Estrutura** | Select | Classificação organizacional |
| **Classe** | Select | Faixa salarial / Categoria |
| **Nível** | Select | Hierarquia (Pleno, Junior, Senior, etc) |
| **Percentual** | Number | % de comissão/benefício (se aplicável) |
| **Descrição** | Text Area | Detalhes do cargo |
| **Ativo** | Checkbox | Flag de ativação |

#### Interface

```
┌────────────────────────────────────────────────────────────────────┐
│ CARGOS PREVISTOS                         [+ Novo Cargo]            │
├────────────────────────────────────────────────────────────────────┤
│ Cargo │ Estrutura │ Classe │ Nível │ % │ Ações                    │
│───────────────────────────────────────────────────────────────────│
│ Dev Full Stack │ TI │ Classe C │ Pleno │ 10 │ [✏️] [📋]           │
│ Gerente Projeto│ TI │ Classe B │ Senior│ 15 │ [✏️] [📋]           │
│ Assistente Jr. │ TI │ Classe D │ Junior│ 0  │ [✏️] [📋]           │
│ Analista RH    │ RH │ Classe C │ Pleno │ 8  │ [✏️] [📋]           │
└────────────────────────────────────────────────────────────────────┘
```

### 2.6 Sub-módulo 4: Reservas

#### Objetivo
Controlar vagas em processo de seletivo (reservadas para recrutamento).

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Vaga** | Link | Referência ao Posto de Trabalho |
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
│ Vaga │ Status │ Abertura │ Previsão │ Candidatos │ Ações         │
│──────────────────────────────────────────────────────────────────│
│ Dev FS │ Entrevista │ 01/12 │ 20/12 │ 5/45 │ [✏️] [📊]           │
│ Gerente│ Em Triagem │ 03/12 │ 15/01 │ 12/87 │ [✏️] [📊]          │
│ Admin  │ Aberto │ 05/12 │ 22/12 │ 3/18 │ [✏️] [📊]              │
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
| **Ver Quadro Admissão** | Select | Verificar Vagas + Permitir / Verificar + Bloquear / Não Verificar |
| **Ver Quadro Transferências** | Select | Verificar Vagas + Permitir / Verificar + Bloquear / Não Verificar |
| **Observação** | Text Area | Por que este usuário é exceção |

#### Opções por Campo

**Ver Quadro Admissão:**
- ✅ Verificar vagas existentes e permitir incluir
- ⚠️ Verificar vagas existentes e não permitir incluir
- ❌ Não verificar a existência de vagas

**Ver Quadro Transferências:**
- ✅ Verificar vagas existentes e permitir incluir
- ⚠️ Verificar vagas existentes e não permitir incluir
- ❌ Não verificar a existência de vagas

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
│ Apurar a quantidade de colaboradores efetivos em uma data e      │
│ gravá-lo como previsto                                           │
│                                                                   │
│ Data Históricos:        [__ / __ / ____]  (dd/mm/aaaa)          │
│ (Data considerada na busca dos históricos de local/centro custo, │
│  cargo e turno)                                                  │
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
1. Busca colaboradores ativos na "Data Históricos"
2. Agrega por (Centro Custo, Cargo, Turno)
3. Grava quantidades como "Previsto" na "Data Geração"
4. Cria registro de auditoria (QUEM, QUANDO, AÇÃO)

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
│ Este processo irá assumir o atual quadro de colaboradores de     │
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
   - Agrupa colaboradores por (Centro Custo, Cargo, Turno)
   - Contabiliza estado final (ocupado/desocupado)
   
4. **Considerações Especiais:**
   - Se utilizar "Cargo da Vaga", normalização considera este campo
   - Processo **não considera** indicação de módulos ao contar colaboradores
   - Movimentações posteriores ao "Período Final" **ficam de fora** da normalização

5. **Resultado:**
   - Atualiza tabela "Quadro Efetivo" com valores consolidados
   - Cria logs de auditoria para cada Posto atualizado
   - Exibe resumo: "✅ 87 postos normalizados, 3 erros" (com detalhes)

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

