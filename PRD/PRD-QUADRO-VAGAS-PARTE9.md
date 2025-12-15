# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 9: INVENTÁRIO COMPLETO DE TELAS E COMPORTAMENTOS

---

## 📋 INFORMAÇÕES DO DOCUMENTO
- **Data:** 15 de Dezembro de 2025
- **Versão:** 1.0
- **Status:** Inventário de Telas
- **Público:** Desenvolvedores Frontend, UX Designers, QA
- **Objetivo:** Listar todas as telas previstas antes de detalhar comportamentos

---

## 📊 VISÃO GERAL

Este documento apresenta o **inventário completo de todas as telas** do Sistema de Gestão de Quadro de Lotação, organizadas por módulo. Cada tela será posteriormente detalhada com comportamentos, validações, interações e regras de negócio específicas.

**Total Estimado:** ~35 telas principais + modais/slides

---

## 🎯 MÓDULOS E ESTRUTURA DE NAVEGAÇÃO

```
SISTEMA QUADRO DE LOTAÇÃO
│
├── 🏠 DASHBOARD (1 tela principal)
│
├── 📊 QUADRO DE LOTAÇÃO (2 sub-telas)
│   ├── Manutenção do Quadro
│   └── Reservas
│
├── 🔄 NORMALIZAÇÃO (3 sub-telas)
│   ├── Quadro Previsto
│   ├── Quadro Efetivo
│   └── Histórico de Normalização
│
├── 📋 PROPOSTAS (2 sub-telas)
│   ├── Gestão de Propostas
│   └── Efetivar/Aprovar (Workflow)
│
├── 📈 ANALYTICS (5 sub-telas)
│   ├── Dashboard Analytics
│   ├── Consulta Vagas Previstas
│   ├── Parâmetros de Comparação
│   ├── Ocupação de Vagas
│   └── PcD (Pessoas com Deficiência)
│
├── 🔐 LGPD (1 tela)
│   └── Portal do Titular
│
└── ⚙️ CONFIGURAÇÕES (4 sub-telas)
    ├── Workflow de Aprovação
    ├── Notificações
    ├── Integrações
    └── Auditoria
```

---

## 📑 INVENTÁRIO DETALHADO DE TELAS

### 🏠 MÓDULO 1: DASHBOARD

#### TELA 1.1: Dashboard Principal
**Rota:** `/dashboard` ou `/`  
**Tipo:** Tela principal  
**Acesso:** Todos os perfis autenticados  

**Componentes:**
- Header com filtros globais (Empresa, Período, Centro de Custo)
- Menu Usuário (Perfil, Configurações, Logout)
- 8 Cards de KPIs:
  - Taxa de Ocupação
  - Custo por Contratação
  - Qualidade de Contratação
  - Salário vs Mercado
  - Benefícios
  - Retenção
  - Vagas Abertas (tempo médio)
  - Trabalho Remoto vs Presencial
- Seção: Previsão de Demanda (IA) - cards horizontais com scroll
- Seção: Análise de Competitividade
- Seção: Cruzamentos Inteligentes (Insights IA)
- Seção: Atividades Recentes (Timeline últimos 7 dias)

**Modais/Dialogs:**
- Modal: Detalhes de Previsão de Demanda
- Modal: Análise de Competitividade Completa
- Modal: Detalhes de Insight (com recomendações)
- Slide-in: Histórico Completo de Atividades

---

## 🔍 DETALHAMENTO DE COMPORTAMENTOS

### 🏠 DASHBOARD PRINCIPAL - COMPORTAMENTOS DETALHADOS

#### 1. HEADER - FILTROS GLOBAIS

##### Filtro: Empresa
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Empresa do usuário logado vem pré-selecionada  
**Obrigatoriedade:** Obrigatório (mínimo 1 empresa selecionada)  
**Permissões:** Usuário vê apenas empresas que tem permissão de acesso  
**Atualização:** Automática - ao selecionar/desselecionar empresas, todos os dados do dashboard atualizam imediatamente sem necessidade de clicar em botão  
**Comportamento ao Trocar:** Mantém os outros filtros (Período, Posto de Trabalho)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

##### Filtro: Período
**Tipo:** Seletor híbrido (Date Picker OU Dropdown de Plano de Vagas)  
**Opções:**
- **Por Data:** Date picker com data início e data fim
- **Por Plano:** Dropdown com lista de planos de vagas disponíveis
**Comportamento Padrão:** Plano de vagas vigente na data atual vem pré-selecionado  
**Períodos Pré-definidos:** Não possui (apenas data customizada ou plano específico)  
**Validações:**
- Período máximo: 12 meses
- Data início deve ser menor ou igual a data fim
- Não permite período futuro além dos planos cadastrados
**Atualização:** Automática - ao trocar período (data ou plano), todos os dados do dashboard atualizam imediatamente  
**Comportamento ao Trocar:** Mantém os outros filtros (Empresa, Posto de Trabalho)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

##### Filtro: Posto de Trabalho
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Vazio (nenhum posto selecionado - mostra dados agregados de todos os postos)  
**Obrigatoriedade:** Opcional  
**Permissões:** Mostra apenas postos de trabalho que o usuário tem permissão de visualizar  
**Busca:** Lista todos os postos disponíveis (código + descrição)  
**Atualização:** Automática - ao selecionar/desselecionar postos, todos os dados do dashboard atualizam imediatamente  
**Comportamento ao Trocar:** Mantém os outros filtros (Empresa, Período)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

##### Botão "Filtrar"
**Status:** Removido  
**Motivo:** Todos os filtros atualizam automaticamente ao serem modificados  

---

#### 2. CARDS DE KPIs

##### Card: Taxa de Ocupação
**Fórmula de Cálculo:**
```
Taxa de Ocupação (%) = (Vagas Efetivas / Vagas Previstas) × 100
```

**Configurações:**
- **Meta:** Configurável por empresa/período no menu Configurações (ex: 95%)
- **Faixas de Status:** Configuráveis no menu Configurações
  - Exemplo padrão: >95% = ✅ Verde (Acima), 85-95% = ⚠️ Amarelo (Dentro), <85% = ❌ Vermelho (Abaixo)

**Apresentação:**
- Valor principal: Percentual com 1 casa decimal (ex: "96.5%")
- Linha secundária: "Meta: 95%" (valor configurado)
- Badge de status: Cor + texto (ex: "✅ Acima da Meta")

**Interação ao Clicar:**
- Navega para: `/quadro/manutencao` (Tela de Manutenção do Quadro)
- Mantém os filtros aplicados no dashboard

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados
- Real-time: Quando ocorre normalização ou admissão

---

##### Card: Custo por Contratação
**Fórmula de Cálculo:**
```
Custo por Contratação = Custo Total de Recrutamento / Número de Admissões
```

**Período de Cálculo:**
- Últimos 12 meses a partir da data atual (rolling 12 months)
- Considera apenas admissões efetivadas no período

**Configurações:**
- **Budget Planejado:** Configurável no menu Configurações (ex: R$ 4.5k)
- Valor atualizado por empresa/período

**Apresentação:**
- Valor principal: Custo médio formatado em moeda (ex: "R$ 3.2k")
- Linha secundária: "Budget: R$ 4.5k" (valor configurado)
- Indicador de variação: "29% ↓" (comparação com budget planejado)
  - Verde se abaixo do budget
  - Amarelo se próximo (±10%)
  - Vermelho se acima do budget

**Cálculo da Variação:**
```
Variação (%) = ((Custo Real - Budget) / Budget) × 100
```

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados

---

##### Card: Qualidade de Contratação
**Fórmula de Cálculo:**
```
Qualidade (Score 0-10) = Taxa de Aprovação em Período Probatório
Taxa de Aprovação (%) = (Colaboradores Aprovados / Total Admitidos) × 100
Score = (Taxa de Aprovação / 100) × 10
```

**Período de Cálculo:**
- Últimos 12 meses a partir da data atual (rolling 12 months)
- Considera apenas colaboradores que completaram o período probatório (geralmente 90 dias)
- Colaboradores aprovados = não desligados durante ou ao final do probatório

**Configurações:**
- **Meta:** Configurável no menu Configurações (ex: 8.0)
- **Faixas de Status:** Configuráveis no menu Configurações
  - Exemplo padrão: ≥8.0 = ✅ Verde (Em Alta), 6.0-7.9 = ⚠️ Amarelo (Atenção), <6.0 = ❌ Vermelho (Crítico)

**Apresentação:**
- Valor principal: Score formatado com 1 casa decimal (ex: "8.4/10")
- Linha secundária: "Meta: 8.0" (valor configurado)
- Badge de status: Cor + texto (ex: "✅ Em Alta")

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados
- Recalcula ao final de cada período probatório

---

##### Card: Salário vs Mercado
**Fórmula de Cálculo:**
```
Comparação = Média Salarial Interna vs Média Salarial do Mercado
Gap (%) = ((Média Interna - Média Mercado) / Média Mercado) × 100
```

**Período de Cálculo:**
- Últimos 12 meses a partir da data atual (rolling 12 months)
- Considera apenas colaboradores ativos no período

**Fonte de Dados:**
- **Dados Internos:** Salários dos colaboradores do sistema
- **Dados Externos:** Integração com fontes de market data (Glassdoor, LinkedIn, ou outro provider configurado)
- Fonte externa configurável em: `/configuracoes/integracoes` → Market Data

**Configurações:**
- **Fonte de Market Data:** Configurável (Glassdoor, LinkedIn, Custom API)
- **Frequência de Atualização:** Diária, Semanal, Mensal (configurável)
- **Faixas de Alerta:** Configuráveis no menu Configurações
  - Exemplo padrão: >+10% = ✅ Verde (Acima do Mercado), -5% a +10% = ⚠️ Amarelo (Competitivo), <-5% = ❌ Vermelho (Abaixo do Mercado)

**Apresentação:**
- Valor principal: Média salarial interna formatada em moeda (ex: "R$ 5.2k")
- Linha secundária: "Mercado: R$ 5.8k" (média externa)
- Indicador de gap: "10% ↓" (percentual de diferença)
  - Verde se acima do mercado (paga mais)
  - Amarelo se competitivo (±10%)
  - Vermelho se abaixo do mercado (paga menos)

**Cálculo do Gap:**
```
Gap (%) = ((Média Interna - Média Mercado) / Média Mercado) × 100
```

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: Conforme frequência configurada para market data (diária, semanal ou mensal)
- Manual: Quando filtros são alterados
- Background: Sincronização com fonte externa via integração configurada

---

##### Card: Retenção (Turnover)
**Fórmula de Cálculo:**
```
Turnover Mensal (%) = (Total de Desligamentos / Média de Funcionários) × 100
Média de Funcionários = (Funcionários Início do Mês + Funcionários Fim do Mês) / 2
```

**Período de Cálculo:**
- Mês atual (referência: mês vigente)
- Considera todos os desligamentos (voluntários e involuntários) do mês

**Tipos de Desligamento Considerados:**
- Desligamentos voluntários (pedidos de demissão)
- Desligamentos involuntários (demissões)
- Ambos contabilizados no cálculo do turnover

**Configurações:**
- **Meta:** Configurável no menu Configurações (ex: 2.5%)
- **Faixas de Alerta:** Configuráveis no menu Configurações
  - Exemplo padrão: <2% = ✅ Verde (Baixo), 2-5% = ⚠️ Amarelo (Aceitável), >5% = ❌ Vermelho (Alto)

**Apresentação:**
- Valor principal: Percentual com 1 casa decimal (ex: "3.2%")
- Linha secundária: "Meta: 2.5%" (valor configurado)
- Badge de status: Cor + texto (ex: "⚠️ Aceitável")
- Indicador de tendência: Comparação com mês anterior (ex: "+0.5% ↑" ou "-0.3% ↓")

**Objetivo:**
- Medir a capacidade da empresa de reter talentos
- Identificar problemas no clima organizacional e gestão de pessoas
- Sinalizar necessidade de ações de retenção

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados
- Real-time: Quando ocorre desligamento no sistema

---

##### Card: Vagas Abertas (Tempo Médio)
**Fórmula de Cálculo:**
```
Tempo Médio (dias) = Σ (Data Preenchimento - Data Abertura) / Número de Vagas Preenchidas
```

**Período de Cálculo:**
- Últimos 12 meses a partir da data atual (rolling 12 months)
- Considera apenas vagas que foram preenchidas no período (com data de admissão)

**Vagas Consideradas:**
- Vagas abertas e preenchidas no período
- Calcula o tempo desde a data de abertura até a data de efetivação da admissão
- Exclui vagas ainda em aberto (sem data de fechamento)

**Configurações:**
- **Meta/Benchmark:** Configurável no menu Configurações (ex: 30 dias)
- **Faixas de Alerta:** Configuráveis no menu Configurações
  - Exemplo padrão: <30 dias = ✅ Verde (Rápido), 30-60 dias = ⚠️ Amarelo (Aceitável), >60 dias = ❌ Vermelho (Lento)

**Apresentação:**
- Valor principal: Tempo médio em dias (ex: "45 dias")
- Linha secundária: "Meta: 30 dias" (valor configurado)
- Badge de status: Cor + texto (ex: "⚠️ Aceitável")
- Indicador de variação: Comparação com período anterior (ex: "+5 dias ↑" ou "-3 dias ↓")

**Objetivo:**
- Medir a eficiência do processo de recrutamento e seleção
- Identificar gargalos no time-to-hire
- Comparar performance com benchmark de mercado

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados
- Real-time: Quando uma vaga é preenchida (admissão efetivada)

---

##### Card: Trabalho Remoto vs Presencial
**O que Apresenta:**
- Distribuição percentual dos colaboradores por tipo de trabalho
- Baseado no campo "Tipo de Contrato" do colaborador

**Critérios de Classificação:**
- **Remoto:** Colaboradores com contrato 100% remoto (trabalho à distância)
- **Presencial:** Colaboradores com contrato 100% presencial (trabalho no local)
- **Híbrido:** Colaboradores com contrato híbrido (misto de remoto e presencial)

**Período de Referência:**
- Mês atual (colaboradores ativos no mês vigente)
- Snapshot do estado atual da força de trabalho

**Fórmula de Cálculo:**
```
% Remoto = (Total Colaboradores Remotos / Total Colaboradores Ativos) × 100
% Presencial = (Total Colaboradores Presenciais / Total Colaboradores Ativos) × 100
% Híbrido = (Total Colaboradores Híbridos / Total Colaboradores Ativos) × 100
```

**Apresentação:**
- Valor principal: Percentual da categoria predominante (ex: "65% Presencial")
- Linha secundária: Distribuição completa (ex: "Remoto: 15% | Híbrido: 20%")
- Gráfico visual: Mini gráfico de barras ou pizza mostrando proporção
- Cores:
  - Remoto: Azul
  - Presencial: Verde
  - Híbrido: Laranja

**Objetivo:**
- Monitorar a distribuição do modelo de trabalho
- Acompanhar tendências de trabalho remoto/flexível
- Apoiar decisões sobre política de trabalho remoto

**Interação ao Clicar:**
- Não faz nada (card apenas informativo)
- Cursor: Default (não mostra cursor pointer)

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Manual: Quando filtros são alterados
- Real-time: Quando ocorre admissão ou alteração de contrato

---

#### 3. SEÇÃO: ATIVIDADES RECENTES (TIMELINE)

**Título da Seção:** "Atividades Recentes"

**Tipos de Atividades Exibidas:**
1. **Admissões:** Quando um colaborador é admitido em um posto
2. **Desligamentos:** Quando um colaborador é desligado
3. **Propostas Aprovadas:** Quando uma proposta de alteração no quadro é aprovada
4. **Propostas Rejeitadas:** Quando uma proposta de alteração no quadro é rejeitada
5. **Normalizações:** Quando ocorre processo de normalização do quadro

**Quantidade Exibida:**
- Exibe as **últimas 7 atividades**
- Independente do período de tempo (não limitado a 7 dias)
- Ordenação: Da mais recente para a mais antiga

**Apresentação Visual de Cada Item:**
Cada item da timeline contém:
- **Data:** Formato dd/mm/yyyy (ex: "15/12/2025")
- **Hora:** Formato HH:mm (ex: "14:35")
- **Tipo de Atividade:** Ícone + texto identificador
  - 👤 Admissão
  - 👋 Desligamento
  - ✅ Proposta Aprovada
  - ❌ Proposta Rejeitada
  - 🔄 Normalização
- **Operação no Quadro:** Indica se houve aumento ou diminuição
  - 📈 Aumento (quando vagas aumentam ou são preenchidas)
  - 📉 Diminuição (quando vagas diminuem ou são esvaziadas)
- **Descrição:** Texto contextual da atividade
  - Para colaboradores: inclui nome do colaborador (ex: "Admissão de João Carlos")
  - Para propostas: inclui tipo e descrição (ex: "Proposta de inclusão aprovada - 5 vagas")
  - Para normalizações: inclui origem e quantidade (ex: "Normalização Efetivo→Previsto - 12 postos afetados")

**Formato de Exibição:**
```
[Ícone] Data | Hora | Descrição | [Indicador ↑↓]

Exemplo:
👤 15/12/2025 | 14:35 | Admissão de João Carlos - Analista de Sistemas | 📈
👋 15/12/2025 | 10:20 | Desligamento de Maria Silva - Assistente Administrativo | 📉
✅ 14/12/2025 | 16:45 | Proposta de Inclusão Aprovada - 5 vagas no RH | 📈
❌ 14/12/2025 | 09:15 | Proposta de Exclusão Rejeitada - TI | 
🔄 13/12/2025 | 22:00 | Normalização Efetivo→Previsto - 12 postos afetados | 
```

**Interação ao Clicar:**
- Não faz nada (timeline apenas informativa)
- Cursor: Default (não mostra cursor pointer)
- Itens não são clicáveis

**Link "Ver Histórico Completo":**
- Posicionamento: Ao final da lista das 7 atividades
- Comportamento ao clicar: Abre Slide-in "Histórico Completo de Atividades"
- Texto do link: "Ver todas as atividades →"

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Real-time: Quando ocorre nova atividade no sistema
- Mantém sempre as últimas 7 atividades

**Estado Vazio:**
- Quando não há atividades: Exibe mensagem "Nenhuma atividade recente registrada"
- Ícone: 📭

---

#### 4. SLIDE-IN: HISTÓRICO COMPLETO DE ATIVIDADES

**Abertura:**
- Disparado ao clicar em: "Ver todas as atividades →" (link ao final da Timeline)
- Tipo: Slide-in lateral direito
- Largura: 600px
- Overlay: Semi-transparente com fechamento ao clicar fora

**Título:** "Histórico de Atividades"

**Período de Dados:**
- Exibe todas as atividades dos **últimos 30 dias**
- Não mostra atividades anteriores a 30 dias da data atual

**Quantidade de Atividades:**
- Todas as atividades do período (últimos 30 dias)
- **Paginação:** 20 atividades por página
- Scroll interno no slide-in
- Paginação no rodapé: "« Anterior | 1 2 3 ... | Próxima »"

**Filtros Disponíveis:**

1. **Filtro por Tipo:**
   - Dropdown multi-select
   - Opções:
     - Todas (padrão)
     - Admissões
     - Desligamentos
     - Propostas Aprovadas
     - Propostas Rejeitadas
     - Normalizações
   - Comportamento: Atualiza a lista automaticamente ao selecionar/desselecionar

2. **Filtro por Período:**
   - Date picker com data início e data fim
   - Valor padrão: Últimos 30 dias (data atual - 30 dias até data atual)
   - Validação: Data fim não pode ser maior que data atual
   - Validação: Data início não pode ser menor que 30 dias atrás
   - Comportamento: Atualiza a lista automaticamente ao alterar período

3. **Filtro por Usuário:**
   - Dropdown simples com busca
   - Opções: Lista de todos os usuários que geraram atividades nos últimos 30 dias
   - Valor padrão: "Todos os usuários"
   - Comportamento: Atualiza a lista automaticamente ao selecionar usuário

**Posicionamento dos Filtros:**
- Localização: Abaixo do título, antes da lista de atividades
- Layout: 3 filtros lado a lado (Type | Período | Usuário)
- Botão: [🔄 Limpar Filtros] (reseta todos os filtros para valores padrão)

**Apresentação das Atividades:**
- Formato idêntico à Timeline da tela principal:
  - [Ícone] Data | Hora | Descrição | [Indicador ↑↓]
- Tipos de ícones mantidos:
  - 👤 Admissão
  - 👋 Desligamento
  - ✅ Proposta Aprovada
  - ❌ Proposta Rejeitada
  - 🔄 Normalização
- Indicadores de operação:
  - 📈 Aumento (vagas aumentam ou são preenchidas)
  - 📉 Diminuição (vagas diminuem ou são esvaziadas)
- Descrição completa incluindo nomes de colaboradores quando aplicável

**Interação ao Clicar nas Atividades:**
- Não faz nada (atividades não são clicáveis)
- Cursor: Default (não mostra cursor pointer)

**Exportação:**
- Não permite exportar
- Sem botão de exportação

**Atualização:**
- Automática: A cada 5 minutos (background refresh)
- Real-time: Quando ocorre nova atividade no sistema
- Mantém filtros aplicados após atualização

**Estado Vazio:**
- Quando não há atividades no período filtrado: Exibe mensagem "Nenhuma atividade encontrada para os filtros aplicados"
- Ícone: 📭
- Sugestão: "Tente ajustar os filtros ou período"

**Botão de Fechar:**
- Posicionamento: Canto superior direito do slide-in
- Ícone: ✕ (X)
- Comportamento: Fecha o slide-in e retorna para o Dashboard

**Responsividade:**
- Em telas menores (<768px): Slide-in ocupa 100% da largura
- Mantém scroll interno e paginação

---

### 📊 MÓDULO 2: QUADRO DE LOTAÇÃO - COMPORTAMENTOS DETALHADOS

---

#### TELA 2.1: MANUTENÇÃO DO QUADRO

##### INFORMAÇÕES GERAIS
**Rota:** `/quadro/manutencao`  
**Tipo:** Tabela com CRUD  
**Acesso:** RH Admin, RH Manager, Gerente de Área  
**Objetivo:** Gerenciar vagas previstas por posto de trabalho, visualizar ocupação e controlar reservas

---

##### 1. FILTROS

###### Filtro: Empresa
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Empresa do usuário logado vem pré-selecionada  
**Obrigatoriedade:** Obrigatório (mínimo 1 empresa selecionada)  
**Permissões:** Usuário vê apenas empresas que tem permissão de acesso  
**Atualização:** Automática - ao selecionar/desselecionar empresas, a tabela atualiza imediatamente sem necessidade de clicar em botão  
**Comportamento ao Trocar:** Mantém o filtro de Posto de Trabalho  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

###### Filtro: Posto de Trabalho
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Vazio (nenhum posto selecionado - mostra todos os postos)  
**Obrigatoriedade:** Opcional  
**Permissões:** Mostra apenas postos de trabalho que o usuário tem permissão de visualizar  
**Busca:** Lista todos os postos disponíveis (código + descrição)  
**Atualização:** Automática - ao selecionar/desselecionar postos, a tabela atualiza imediatamente  
**Comportamento ao Trocar:** Mantém o filtro de Empresa  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

**Observação:** Todos os filtros atualizam automaticamente a tabela - não há botão [Filtrar]

---

##### 2. BOTÃO [+ ADICIONAR POSTO AO QUADRO]

**Posicionamento:** Canto superior direito, acima da tabela  
**Comportamento ao Clicar:** Abre tela de cadastro de nova proposta  
**Tipo de Proposta:** Proposta de Inclusão de Posto  
**Permissões por Perfil:**
- **RH Admin:** ✅ Pode adicionar
- **RH Manager:** ✅ Pode adicionar (conforme permissões da área)
- **Gerente de Área:** ✅ Pode adicionar (apenas da sua área)
- **Demais perfis:** ❌ Não visualiza o botão

**Navegação:** Redireciona para `/propostas/gestao` com tipo "Inclusão" pré-selecionado

---

##### 3. TABELA - ESTRUTURA E COLUNAS

**Colunas:**

| Coluna | Tipo | Editável | Ordenável | Descrição |
|--------|------|----------|-----------|-----------|
| Código do Posto | Text | ❌ Não | ✅ Sim | Código único do posto |
| Posto de Trabalho | Text | ❌ Não | ✅ Sim | Descrição completa do posto |
| Vagas Previstas | Number | ✅ Sim (inline) | ✅ Sim | Quantidade de vagas planejadas |
| Vagas Efetivas | Number | ❌ Não (read-only) | ✅ Sim | Colaboradores atualmente alocados |
| Vagas Reservadas | Number | ❌ Não (read-only) | ✅ Sim | Vagas em processo seletivo |
| Ações | Buttons | - | ❌ Não | Botões de ação |

**Paginação:**
- 20 registros por página (padrão)
- Opções: 10, 20, 50, 100 registros por página
- Controles: « Anterior | 1 2 3 ... | Próxima »

**Ordenação:**
- Padrão inicial: Código do Posto (crescente)
- Clique no header da coluna: Alterna entre crescente/decrescente
- Indicador visual: ▲ (crescente) ▼ (decrescente)

**Estado Vazio:**
- Quando não há postos cadastrados: "Nenhum posto encontrado para os filtros selecionados"
- Ícone: 📭
- Botão: [+ Adicionar Primeiro Posto]

---

##### 4. COLUNA "VAGAS PREVISTAS" - EDIÇÃO INLINE

**Tipo de Edição:** Inline (clique direto na célula)

**Comportamento ao Clicar:**
- Célula se transforma em input numérico
- Foco automático no input
- Valor atual selecionado (facilita substituição)

**Validações:**
- ✅ Permite zero (0)
- ❌ Não permite valores negativos
- ❌ Não permite valores não numéricos
- ❌ Não permite valores decimais (apenas inteiros)
- Valor máximo: 9999

**Mensagens de Erro:**
- Valor negativo: "Vagas Previstas não pode ser negativo"
- Valor não numérico: "Digite apenas números inteiros"
- Valor decimal: "Vagas Previstas deve ser um número inteiro"
- Valor acima do máximo: "Valor máximo: 9999"

**Ações ao Editar:**
- **Enter:** Salva alteração
- **Esc:** Cancela edição e restaura valor original
- **Tab:** Salva e move para próxima célula editável
- **Clique fora:** Salva alteração

**Feedback Visual:**
- Durante edição: Borda azul
- Salvando: Spinner + borda amarela
- Sucesso: ✅ Verde (1 segundo) + valor atualizado
- Erro: ❌ Vermelho + mensagem de erro

**Regras de Negócio:**
- Alteração de Vagas Previstas é registrada no histórico de auditoria
- Se reduzir vagas abaixo das Vagas Efetivas: Exibe alerta "⚠️ Atenção: Vagas Previstas menor que Vagas Efetivas. Considere criar proposta de ajuste."
- Não bloqueia salvamento (permite inconsistência temporária para posterior ajuste)

**Permissões:**
- **RH Admin:** ✅ Pode editar qualquer posto
- **RH Manager:** ✅ Pode editar postos da sua área
- **Gerente de Área:** ⚠️ Pode editar apenas se tiver permissão "Alterar" configurada
- **Demais perfis:** ❌ Coluna não é clicável

---

##### 5. AÇÕES NA TABELA

**Coluna Ações - Botões Disponíveis:**

###### Botão [📋 Detalhes]
**Ícone:** 📋  
**Tooltip:** "Ver Detalhes"  
**Comportamento:** Abre modal "Detalhes do Posto"  
**Permissões:** Todos os perfis com acesso à tela  

**Modal "Detalhes do Posto":**
- **Seção 1: Informações do Posto**
  - Código do Posto
  - Descrição Completa
  - Centro de Custo
  - Cargo
  - Filial/Local
  - Turno
  - Escala
  - Tipo de Colaborador
  - Status (Ativo/Inativo)

- **Seção 2: Resumo de Vagas**
  - Vagas Previstas
  - Vagas Efetivas
  - Vagas Reservadas
  - Vagas Disponíveis (calculado: Previstas - Efetivas - Reservadas)
  - Taxa de Ocupação (%)

- **Seção 3: Colaboradores Alocados**
  - Tabela: Nome, Matrícula, Data Admissão, Status
  - Se vazio: "Nenhum colaborador alocado"

- **Seção 4: Propostas Ativas**
  - Tabela: ID, Tipo, Status, Solicitante, Data
  - Se vazio: "Nenhuma proposta ativa"

- **Seção 5: Histórico de Alterações**
  - Timeline: Data, Usuário, Ação, Antes→Depois
  - Últimas 20 alterações
  - Link: "Ver histórico completo" (redireciona para Auditoria filtrado por este posto)

**Botões do Modal:**
- [Fechar]

---

###### Botão [🗑️ Deletar]
**Ícone:** 🗑️  
**Tooltip:** "Deletar Posto"  
**Comportamento:** Abre dialog de confirmação de exclusão  

**Regras de Bloqueio:**
1. ❌ **Não pode deletar se tiver Vagas Efetivas > 0**
   - Mensagem: "Não é possível deletar este posto pois existem colaboradores alocados. Primeiro realize os desligamentos ou transferências necessários."
   - Botão deletar: Desabilitado (ícone opaco)
   - Tooltip: "Posto com colaboradores alocados não pode ser deletado"

2. ❌ **Não pode deletar se tiver Propostas Ativas**
   - Mensagem: "Não é possível deletar este posto pois existem propostas ativas (pendentes de aprovação). Primeiro conclua ou cancele as propostas."
   - Botão deletar: Desabilitado (ícone opaco)
   - Tooltip: "Posto com propostas ativas não pode ser deletado"

3. ✅ **Pode deletar se:**
   - Vagas Efetivas = 0
   - Vagas Reservadas = 0 ou > 0 (permite deletar mesmo com reservas)
   - Sem propostas ativas (status: Rascunho, Nível 1, Nível 2, Nível 3, RH)
   - Propostas concluídas (Aprovada/Rejeitada) não bloqueiam

**Dialog de Confirmação:**
```
Título: ⚠️ Confirmar Exclusão

Mensagem: 
"Tem certeza que deseja deletar o posto?"

[Nome do Posto - Código]

Aviso: Esta ação não pode ser desfeita.

Botões: [Cancelar] [Deletar Posto]
```

**Feedback:**
- Ao confirmar: Loading spinner
- Sucesso: ✅ Toast "Posto deletado com sucesso"
- Erro: ❌ Toast "Erro ao deletar posto: [mensagem]"
- Após sucesso: Remove linha da tabela com animação

**Permissões:**
- **RH Admin:** ✅ Pode deletar qualquer posto (respeitando regras de bloqueio)
- **RH Manager:** ✅ Pode deletar postos da sua área (respeitando regras de bloqueio)
- **Gerente de Área:** ⚠️ Pode deletar apenas se tiver permissão "Deletar" configurada
- **Demais perfis:** ❌ Botão não aparece

**Auditoria:**
- Exclusão registrada em log de auditoria
- Registro inclui: Usuário, Data/Hora, IP, Dados completos do posto deletado (snapshot JSON)

---

##### 6. ESTADOS E FEEDBACK

**Estado de Loading:**
- Ao carregar tabela: Skeleton com 5 linhas pulsando
- Ao aplicar filtros: Overlay semi-transparente + spinner

**Estado Vazio (Sem Resultados):**
- Mensagem: "Nenhum posto encontrado para os filtros selecionados"
- Ícone: 📭
- Sugestão: "Tente ajustar os filtros ou adicionar um novo posto"
- Botão: [+ Adicionar Posto]

**Estado de Erro:**
- Mensagem: "Erro ao carregar postos. Tente novamente."
- Ícone: ⚠️
- Botão: [🔄 Recarregar]

**Atualização Automática:**
- Background refresh a cada 5 minutos
- Não interfere com edições em andamento
- Exibe badge "🔄 Atualizando..." (discreto, canto superior direito)

---

##### 7. MODAIS E DIALOGS

**Modais Relacionados:**
1. ✅ **Modal: Detalhes do Posto** (documentado acima)
2. ✅ **Dialog: Confirmação de Exclusão** (documentado acima)
3. **Navegação para Proposta:** Redireciona para `/propostas/gestao` (nova proposta)

**Observação:** Modal de "Editar Vagas" foi REMOVIDO - edição agora é inline na coluna "Vagas Previstas"

---

#### TELA 2.2: RESERVAS (VAGAS EM SELETIVO)

##### INFORMAÇÕES GERAIS
**Rota:** `/quadro/reservas`  
**Tipo:** Tabela de visualização e gestão  
**Acesso:** RH Admin, RH Manager  
**Objetivo:** Monitorar e gerenciar processos seletivos em andamento e vagas reservadas para contratação

---

##### 1. FILTROS

###### Filtro: Status Seletivo
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Vazio (todos os status selecionados - mostra todos os seletivos)  
**Obrigatoriedade:** Opcional  
**Opções:**
- Aberto
- Em Triagem
- Entrevista
- Oferta
- Fechado

**Atualização:** Automática - ao selecionar/desselecionar status, a tabela atualiza imediatamente sem necessidade de clicar em botão  
**Comportamento ao Trocar:** Mantém os outros filtros (Posto de Trabalho, Cargo, Data Abertura)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

---

###### Filtro: Posto de Trabalho
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Vazio (nenhum posto selecionado - mostra todos os postos)  
**Obrigatoriedade:** Opcional  
**Permissões:** Mostra apenas postos de trabalho que o usuário tem permissão de visualizar  
**Busca:** Lista todos os postos disponíveis (código + descrição)  
**Atualização:** Automática - ao selecionar/desselecionar postos, a tabela atualiza imediatamente  
**Comportamento ao Trocar:** Mantém os outros filtros (Status Seletivo, Cargo, Data Abertura)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

---

###### Filtro: Cargo
**Tipo:** Dropdown simples com multi-select  
**Comportamento Padrão:** Vazio (nenhum cargo selecionado - mostra todos os cargos)  
**Obrigatoriedade:** Opcional  
**Busca:** Lista todos os cargos disponíveis  
**Atualização:** Automática - ao selecionar/desselecionar cargos, a tabela atualiza imediatamente  
**Comportamento ao Trocar:** Mantém os outros filtros (Status Seletivo, Posto de Trabalho, Data Abertura)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

---

###### Filtro: Data Abertura
**Tipo:** Date Range Picker (data início e data fim)  
**Comportamento Padrão:** Últimos 90 dias (data atual - 90 dias até data atual)  
**Obrigatoriedade:** Opcional  
**Validações:**
- Data início deve ser menor ou igual a data fim
- Não permite datas futuras
- Período máximo: 365 dias

**Atualização:** Automática - ao alterar as datas (início ou fim), a tabela atualiza imediatamente  
**Comportamento ao Trocar:** Mantém os outros filtros (Status Seletivo, Posto de Trabalho, Cargo)  
**Loading:** Mostra indicador de carregamento durante atualização dos dados  

**Observação:** Todos os filtros atualizam automaticamente a tabela - não há botão [Filtrar]

---

##### 2. CRIAÇÃO DE SELETIVOS

**Botão [+ Novo Seletivo]:** ❌ NÃO EXISTE

**Criação de Processos Seletivos:**
- Processos seletivos são criados **APENAS via integração externa**
- Sistema RH legado envia dados via webhook quando um novo seletivo é aberto
- Esta tela é **somente para visualização e gestão** de seletivos já criados
- Usuários não podem criar seletivos diretamente nesta interface

---

##### 3. TABELA - ESTRUTURA E COLUNAS

**Colunas:**

| Coluna | Tipo | Editável | Ordenável | Descrição |
|--------|------|----------|-----------|-----------|
| Posto de Trabalho | Text | ❌ Não | ✅ Sim | Descrição completa do posto |
| Status Seletivo | Badge | ❌ Não (editável via modal) | ✅ Sim | Status atual do processo |
| Data Abertura | Date | ❌ Não | ✅ Sim | Data de início do seletivo |
| Data Previsão | Date | ❌ Não | ✅ Sim | Previsão de fechamento |
| Candidatos | Number | ❌ Não (read-only) | ✅ Sim | Quantidade de candidatos |
| Ações | Buttons | - | ❌ Não | Botões de ação |

**Formato das Colunas:**
- **Posto de Trabalho:** Código + Descrição (ex: "001 - Analista de Sistemas")
- **Status Seletivo:** Badge colorido:
  - 🟢 Aberto (Verde)
  - 🟡 Em Triagem (Amarelo)
  - 🔵 Entrevista (Azul)
  - 🟠 Oferta (Laranja)
  - ⚫ Fechado (Cinza)
- **Data Abertura:** dd/mm/yyyy (ex: "15/12/2025")
- **Data Previsão:** dd/mm/yyyy (ex: "30/01/2026")
- **Candidatos:** Número inteiro (ex: "25")

**Paginação:**
- 10 registros por página (padrão)
- Opções: 10, 20, 50 registros por página
- Controles: « Anterior | 1 2 3 ... | Próxima »

**Ordenação:**
- Padrão inicial: Data Abertura (decrescente - mais recentes primeiro)
- Clique no header da coluna: Alterna entre crescente/decrescente
- Indicador visual: ▲ (crescente) ▼ (decrescente)

**Estado Vazio:**
- Quando não há seletivos: "Nenhum processo seletivo encontrado para os filtros selecionados"
- Ícone: 📭
- Sugestão: "Processos seletivos são criados automaticamente via integração com o sistema RH legado"

---

##### 4. AÇÕES NA TABELA

**Coluna Ações - Botões Disponíveis:**

###### Botão [✏️ Editar Status]
**Ícone:** ✏️  
**Tooltip:** "Editar Status do Seletivo"  
**Comportamento:** Abre modal "Editar Status do Seletivo"  

**Permissões:**
- **RH Admin:** ✅ Pode editar qualquer seletivo
- **RH Manager:** ✅ Pode editar seletivos da sua área/empresa
- **Demais perfis:** ❌ Botão não aparece

**Modal "Editar Status do Seletivo":**

**Título:** Editar Status - [Posto de Trabalho]

**Campos:**
- **Status Atual:** (read-only, badge colorido)
- **Novo Status:** Dropdown com opções
  - Aberto
  - Em Triagem
  - Entrevista
  - Oferta
  - Fechado
- **Comentário:** TextArea (opcional)
  - Placeholder: "Adicione observações sobre a mudança de status (opcional)"
  - Máximo: 500 caracteres

**Validações:**
- Novo Status deve ser diferente do Status Atual
- Se mudar para "Fechado": Exibe aviso "⚠️ Atenção: Mudar status para 'Fechado' não libera automaticamente a vaga reservada. A vaga só será liberada quando o colaborador for efetivamente admitido no sistema."

**Botões:**
- [Cancelar]
- [Salvar] (primário)

**Feedback:**
- Ao confirmar: Loading spinner
- Sucesso: ✅ Toast "Status atualizado com sucesso"
- Erro: ❌ Toast "Erro ao atualizar status: [mensagem]"
- Após sucesso: Atualiza o badge de status na tabela sem recarregar a página

**Auditoria:**
- Alteração registrada em log de auditoria
- Registro inclui: Usuário, Data/Hora, IP, Status Anterior→Novo Status, Comentário

---

###### Botão [📊 Ver Detalhes]
**Ícone:** 📊  
**Tooltip:** "Ver Detalhes do Seletivo"  
**Comportamento:** Abre modal "Detalhes do Seletivo"  
**Permissões:** Todos os perfis com acesso à tela  

**Modal "Detalhes do Seletivo":**

**Título:** Detalhes do Processo Seletivo

**Seção 1: Informações do Posto**
- Código do Posto
- Posto de Trabalho (descrição completa)
- Centro de Custo
- Cargo
- Filial/Local
- Status Atual (badge colorido)

**Seção 2: Dados do Processo**
- Data Abertura
- Data Previsão de Fechamento
- Data Real de Fechamento (se aplicável)
- Duração do Processo (dias)
- Total de Candidatos
- Vaga Reservada: Sim/Não (indicador)

**Seção 3: Timeline do Processo**
- Lista cronológica de eventos:
  - 📅 Abertura do Seletivo
  - 📝 Início da Triagem
  - 📞 Primeira Entrevista
  - 💼 Oferta Enviada
  - ✅ Fechamento do Seletivo
  - 👤 Admissão Efetivada (se aplicável)

Cada evento contém:
- Data/Hora
- Descrição
- Usuário responsável (se aplicável)

**Seção 4: Candidatos**
- Tabela: Nome, Etapa Atual, Data Última Atualização
- Se vazio: "Nenhum candidato registrado"
- Observação: "Dados detalhados dos candidatos são gerenciados no sistema RH legado"

**Seção 5: Liberação da Vaga Reservada**
- Status: "Vaga Reservada" ou "Vaga Liberada"
- Regra: "A vaga reservada será liberada automaticamente quando o colaborador for admitido no sistema"
- Se liberada: Mostra data e hora da liberação + nome do colaborador admitido

**Botões do Modal:**
- [Fechar]

---

##### 5. REGRAS DE NEGÓCIO - VAGAS RESERVADAS

**Criação de Reserva:**
- Quando um seletivo é criado (via webhook do sistema legado), uma vaga é automaticamente reservada no posto de trabalho correspondente
- A coluna "Vagas Reservadas" na Tela 2.1 (Manutenção do Quadro) é incrementada

**Liberação de Reserva:**
- Vaga reservada **NÃO** é liberada automaticamente quando o status muda para "Fechado"
- Vaga reservada é liberada **APENAS** quando ocorre admissão efetiva do colaborador no sistema
- Admissão pode ser via:
  - Integração automática (webhook do sistema RH legado)
  - Normalização Automática do Quadro Efetivo

**Comportamento no Status "Fechado":**
- Status "Fechado" indica apenas que o processo seletivo terminou
- A vaga permanece reservada até que:
  - O candidato seja efetivamente admitido (libera a vaga automaticamente), OU
  - RH Admin faça ajuste manual no quadro (se processo for cancelado/reprovado)

**Impacto nas Vagas Disponíveis:**
```
Vagas Disponíveis = Vagas Previstas - Vagas Efetivas - Vagas Reservadas
```

---

##### 6. ESTADOS E FEEDBACK

**Estado de Loading:**
- Ao carregar tabela: Skeleton com 5 linhas pulsando
- Ao aplicar filtros: Overlay semi-transparente + spinner

**Estado Vazio (Sem Resultados):**
- Mensagem: "Nenhum processo seletivo encontrado para os filtros selecionados"
- Ícone: 📭
- Sugestão: "Tente ajustar os filtros ou aguardar novos processos seletivos criados via integração"

**Estado de Erro:**
- Mensagem: "Erro ao carregar processos seletivos. Tente novamente."
- Ícone: ⚠️
- Botão: [🔄 Recarregar]

**Atualização Automática:**
- Background refresh a cada 5 minutos
- Real-time: Quando webhook recebe novos seletivos ou atualizações
- Exibe badge "🔄 Atualizando..." (discreto, canto superior direito)

---

##### 7. INTEGRAÇÃO E SINCRONIZAÇÃO

**Fonte de Dados:**
- Processos seletivos vêm **exclusivamente** do sistema RH legado via webhook
- Endpoint: Configurável em `/configuracoes/integracoes` → RH Legado

**Dados Recebidos via Webhook:**
- ID do Seletivo (sistema legado)
- Posto de Trabalho (código)
- Status
- Data Abertura
- Data Previsão
- Total de Candidatos
- Eventos da timeline

**Sincronização:**
- Tempo real: Webhook dispara atualizações instantâneas
- Fallback: Sincronização batch a cada 1 hora (caso webhook falhe)
- Log de integrações: Disponível em `/configuracoes/integracoes` → Ver Log

**Tratamento de Erros:**
- Se webhook falhar: Sistema mantém último estado conhecido
- Alerta visível: "⚠️ Sincronização atrasada - Última atualização: [data/hora]"
- Botão: [🔄 Forçar Sincronização] (apenas RH Admin)

---

##### 8. MODAIS E DIALOGS

**Modais Relacionados:**
1. ✅ **Modal: Editar Status do Seletivo** (documentado acima)
2. ✅ **Modal: Detalhes do Seletivo** (documentado acima)

**Navegação Relacionada:**
- Link para Tela 2.1 (Manutenção do Quadro): Visualizar vagas reservadas por posto
- Link para Configurações de Integrações: Gerenciar webhook do sistema RH legado

---

### � MÓDULO 3: NORMALIZAÇÃO - COMPORTAMENTOS DETALHADOS

---

#### TELA 3.1: QUADRO PREVISTO (NORMALIZAÇÃO)

##### INFORMAÇÕES GERAIS
**Rota:** `/normalizacao/quadro-previsto`  
**Tipo:** Wizard/Stepper de processo (4 passos)  
**Acesso:** RH Admin, RH Manager (com permissão)  
**Objetivo:** Normalizar manualmente o quadro previsto, detectando e aplicando divergências entre diferentes planos ou entre efetivo e previsto

---

##### PASSO 1: CONFIGURAÇÃO

**Objetivo do Passo:**
Configurar os parâmetros da normalização: empresas, plano de vagas, tipo de normalização e competências (quando aplicável).

---

###### Campo: Seletor Empresa

**Tipo:** Dropdown com multi-select  
**Label:** "Empresas"  
**Comportamento Padrão:** Vazio (nenhuma empresa pré-selecionada)  
**Obrigatoriedade:** Opcional  

**Regra de Preenchimento:**
- Se deixado **vazio** (nenhuma empresa selecionada): Sistema considera **todas as empresas** que o usuário tem permissão de acesso
- Se **uma ou mais empresas** selecionadas: Sistema aplica normalização apenas nas empresas selecionadas

**Permissões:**
- Lista exibe apenas empresas que o usuário tem permissão de visualizar/gerenciar
- RH Admin: Vê todas as empresas cadastradas
- RH Manager: Vê apenas empresas da sua área/responsabilidade

**Funcionalidades:**
- Busca por nome da empresa (filtro incremental)
- Seleção múltipla com checkboxes
- Badge contador: "X empresas selecionadas" (quando > 0)
- Botão: [Limpar Seleção]

**Placeholder:** "Selecione empresas (vazio = todas)"

**Tooltip:** ℹ️ "Se nenhuma empresa for selecionada, a normalização será aplicada a todas as empresas que você tem permissão de acesso"

---

###### Campo: Seletor Plano de Vagas

**Tipo:** Dropdown simples (single-select)  
**Label:** "Plano de Vagas"  
**Comportamento Padrão:** Vazio (nenhum plano selecionado)  
**Obrigatoriedade:** ✅ Obrigatório  

**Lista de Opções:**
- Exibe **todos os planos de vagas cadastrados** no sistema
- Formato: Código + Descrição (ex: "2025-01 - Plano Anual 2025")
- Ordenação: Decrescente por data (mais recentes primeiro)
- Inclui apenas planos ativos

**Busca:**
- Filtro incremental por código ou descrição
- Placeholder: "Buscar plano..."

**Validação:**
- Campo deve estar preenchido para habilitar botão [Próximo]
- Se vazio ao clicar [Próximo]: Exibe mensagem "Selecione um plano de vagas"

**Placeholder:** "Selecione o plano de vagas"

---

###### Campo: Tipo de Normalização

**Tipo:** Dropdown simples (single-select)  
**Label:** "Tipo de Normalização"  
**Comportamento Padrão:** "Efetivo→Previsto" (primeira opção pré-selecionada)  
**Obrigatoriedade:** ✅ Obrigatório  

**Opções Disponíveis:**

---

**Opção 1: Efetivo→Previsto (Equalização)**

**Label:** "Efetivo→Previsto (Equalização)"

**Descrição/Tooltip:** 
```
Atualiza o Quadro Previsto com base no Quadro Efetivo. 

Copia as quantidades de vagas realmente ocupadas (colaboradores 
alocados) para o planejamento de vagas, equalizando previsto 
com a realidade atual.

Use quando: Quiser ajustar o planejamento para refletir o 
quadro real de colaboradores.
```

**Comportamento ao Selecionar:**
- **NÃO exibe** campos de Competência (nem Origem, nem Destino)
- Sistema usará automaticamente os dados atuais do Quadro Efetivo (snapshot do momento)
- Comparação: Quadro Efetivo (atual) ↔ Quadro Previsto (plano selecionado)

---

**Opção 2: Previsto→Previsto (Cópia entre Períodos)**

**Label:** "Previsto→Previsto (Cópia entre Períodos)"

**Descrição/Tooltip:**
```
Copia o Quadro Previsto de um período para outro. 

Permite replicar o planejamento de vagas de uma competência/mês 
para outra competência/mês, facilitando o planejamento contínuo.

Use quando: Quiser copiar o planejamento de vagas de um mês 
para outro (ex: copiar planejamento de Janeiro para Fevereiro).
```

**Comportamento ao Selecionar:**
- **EXIBE** dois campos adicionais:
  - Campo: **Competência Origem**
  - Campo: **Competência Destino**
- Comparação: Quadro Previsto (competência origem) ↔ Quadro Previsto (competência destino)

---

###### Campos Condicionais: Competência Origem e Destino

**Visibilidade:** Exibidos **APENAS** quando "Previsto→Previsto (Cópia entre Períodos)" está selecionado

---

**Campo: Competência Origem**

**Tipo:** Dropdown simples (single-select)  
**Label:** "Competência Origem (Copiar de)"  
**Comportamento Padrão:** Vazio  
**Obrigatoriedade:** ✅ Obrigatório (quando visível)  

**Lista de Opções:**
- Exibe todas as competências/meses cadastrados no plano selecionado
- Formato: MM/YYYY (ex: "01/2025", "02/2025")
- Ordenação: Decrescente (mais recentes primeiro)

**Validação:**
- Deve ser diferente de Competência Destino
- Se igual: Exibe erro "Competência Origem deve ser diferente da Competência Destino"

**Placeholder:** "Selecione a competência origem"

---

**Campo: Competência Destino**

**Tipo:** Dropdown simples (single-select)  
**Label:** "Competência Destino (Copiar para)"  
**Comportamento Padrão:** Vazio  
**Obrigatoriedade:** ✅ Obrigatório (quando visível)  

**Lista de Opções:**
- Exibe todas as competências/meses cadastrados no plano selecionado
- Formato: MM/YYYY (ex: "01/2025", "02/2025")
- Ordenação: Decrescente (mais recentes primeiro)

**Validação:**
- Deve ser diferente de Competência Origem
- Se igual: Exibe erro "Competência Destino deve ser diferente da Competência Origem"

**Placeholder:** "Selecione a competência destino"

---

###### Botão: [Próximo]

**Posicionamento:** Canto inferior direito do formulário  
**Tipo:** Botão primário  
**Label:** "Próximo"  

---

**Estado: Desabilitado (padrão inicial)**

**Aparência:**
- Cor: Cinza opaco
- Cursor: not-allowed
- Tooltip: "Preencha todos os campos obrigatórios"

**Condições para Desabilitar:**
- Plano de Vagas está vazio, OU
- Tipo de Normalização = "Previsto→Previsto" E (Competência Origem vazia OU Competência Destino vazia OU Competência Origem = Competência Destino)

---

**Estado: Habilitado**

**Aparência:**
- Cor: Azul/Primária
- Cursor: pointer
- Sem tooltip

**Condições para Habilitar:**

**Para Tipo: Efetivo→Previsto:**
- ✅ Plano de Vagas está selecionado

**Para Tipo: Previsto→Previsto:**
- ✅ Plano de Vagas está selecionado
- ✅ Competência Origem está selecionada
- ✅ Competência Destino está selecionada
- ✅ Competência Origem ≠ Competência Destino

---

**Validações ao Clicar:**

**1. Validação Final de Campos:**
- Confirma que Plano de Vagas não está vazio
- Se Previsto→Previsto: Valida que Competência Origem ≠ Competência Destino
- Se falhar: Toast ❌ "Preencha todos os campos obrigatórios"

**2. Validação de Permissões:**
- Verifica se usuário tem permissão para normalizar as empresas selecionadas
- Se não tiver: Toast ❌ "Você não tem permissão para normalizar todas as empresas selecionadas"

**3. Validação de Dados:**
- Verifica se o Plano de Vagas selecionado está ativo
- Se inativo: Toast ❌ "O plano de vagas selecionado está inativo"

---

**Comportamento ao Clicar (Validações OK):**

**1. Feedback Imediato:**
- Botão muda para estado loading: **[⏳ Detectando divergências...]**
- Botão desabilitado (previne duplo clique)
- Overlay semi-transparente sobre o formulário (bloqueia edição)

**2. Requisição ao Backend:**

Envia parâmetros via POST:
```json
{
  "empresas": [1, 2, 3] ou [],  // vazio = todas
  "planoVagasId": 123,
  "tipoNormalizacao": "EFETIVO_PREVISTO" ou "PREVISTO_PREVISTO",
  "competenciaOrigem": "01/2025" ou null,
  "competenciaDestino": "02/2025" ou null
}
```

**3. Processamento Backend:**

Sistema analisa e detecta divergências:

**Para Efetivo→Previsto:**
- Compara: Quadro Efetivo (atual) ↔ Quadro Previsto (plano selecionado)
- Divergência: Postos onde Vagas Efetivas ≠ Vagas Previstas

**Para Previsto→Previsto:**
- Compara: Quadro Previsto (competência origem) ↔ Quadro Previsto (competência destino)
- Divergência: Postos onde Vagas Previstas (origem) ≠ Vagas Previstas (destino)

**4. Tempo de Processamento:**
- Loading mínimo: 500ms (feedback visual adequado)
- Tempo esperado: 2-5 segundos
- Timeout: 10 segundos
- Se ultrapassar timeout: Toast ❌ "Tempo esgotado ao detectar divergências. Tente novamente."

---

**Resultados Possíveis:**

**Caso 1: Sucesso - Postos Encontrados**
- ✅ Remove loading e overlay
- ✅ Sistema detecta quantos postos serão afetados pela normalização
- ✅ Navega para **Passo 2: Confirmação**
- ✅ Exibe quantidade de postos que serão processados

---

**Caso 2: Nenhum Posto a Normalizar (Informativo)**
- ℹ️ Remove loading e overlay
- ℹ️ Exibe modal informativo:

```
┌─────────────────────────────────────────────┐
│ ℹ️ Nenhum Posto para Normalizar             │
├─────────────────────────────────────────────┤
│                                             │
│ Não foram encontrados postos que precisam  │
│ de normalização com os parâmetros          │
│ selecionados.                              │
│                                             │
│ O quadro já está sincronizado.             │
│                                             │
│         [Voltar ao Início]                  │
└─────────────────────────────────────────────┘
```

**Botão [Voltar ao Início]:**
- Reseta o formulário para valores padrão
- Mantém usuário no Passo 1

---

**Caso 3: Erro no Processamento**
- ❌ Remove loading e overlay
- ❌ Toast: "Erro ao analisar postos: [mensagem do erro]"
- ❌ Botão volta ao estado normal (habilitado)
- ❌ Usuário permanece no Passo 1 para tentar novamente

---

##### PASSO 2: CONFIRMAÇÃO

**Objetivo do Passo:**
Confirmar a normalização antes de executá-la, informando ao usuário quantos postos serão afetados e alertando sobre a irreversibilidade da operação.

---

###### Conteúdo da Tela

**Título:** "Confirmar Normalização"

**Mensagem Principal:**
```
Tem certeza que quer normalizar X postos?
```

**Aviso de Irreversibilidade:**
```
⚠️ ATENÇÃO: Esta ação não pode ser desfeita.

Todos os postos selecionados terão suas vagas atualizadas 
de acordo com o tipo de normalização escolhido.
```

**Resumo dos Parâmetros:**
Exibe os parâmetros configurados no Passo 1:

```
Parâmetros da Normalização:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Plano de Vagas: [Nome do Plano]

🔄 Tipo: [Efetivo→Previsto] ou [Previsto→Previsto]

🏢 Empresas: [X empresas selecionadas] ou [Todas as empresas]

📅 Competências: [Origem → Destino] (apenas se Previsto→Previsto)

📦 Postos a processar: X postos
```

---

###### Botões

**Posicionamento:** Rodapé da tela, alinhados à direita

**Botão [Voltar]**
- Tipo: Secundário
- Comportamento: Volta para Passo 1
- Permite editar os parâmetros
- Mantém os valores já preenchidos

**Botão [Confirmar e Executar]**
- Tipo: Primário (vermelho ou laranja - ação crítica)
- Comportamento: Inicia o processamento irreversível
- Navega para Passo 3 (Processamento + Resultado)

---

##### PASSO 3: PROCESSAMENTO + RESULTADO

**Objetivo do Passo:**
Processar a normalização em tempo real com feedback visual do progresso e, ao concluir, apresentar o resultado detalhado com resumo e lista de postos atualizados.

---

###### FASE 1: PROCESSAMENTO (Durante Execução)

**Título:** "Normalizando Quadro de Vagas"

**Barra de Progresso:**
- Tipo: Barra horizontal
- Exibição: Percentual (0% a 100%)
- Atualização: Tempo real conforme postos são processados
- Cor: Azul (processando)

**Contador de Postos:**
```
Processando: 15/50 postos
```

**Posto Atual:**
```
Processando: [Código] - [Descrição do Posto]

Exemplo:
Processando: 001 - Analista de Sistemas
```

**Estado Visual:**
- Texto animado: "Normalizando..."
- Sem spinner (conforme solicitado)
- Barra preenchendo progressivamente

**Observação:** Usuário **não pode cancelar** durante o processamento (ação irreversível)

---

###### FASE 2: RESULTADO (Após Conclusão)

**Título:** "Resultado da Normalização"

---

**Badge de Status Geral:**

**✅ Sucesso Total:**
```
✅ Normalização Concluída com Sucesso

X postos normalizados
```

**⚠️ Sucesso Parcial:**
```
⚠️ Normalização Concluída com Ressalvas

X postos normalizados, Y com erro
```

**❌ Falha Total:**
```
❌ Normalização Falhou

Nenhum posto foi normalizado
```

---

**Seção: Resumo Executivo**

Exibe contadores agrupados:

```
📊 Resumo da Normalização
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Postos normalizados com sucesso: 45
❌ Postos com erro: 5
📦 Total processado: 50
```

---

**Seção: Detalhes por Posto**

**Título:** "Postos Processados"

**Tabela:**

| Posto de Trabalho | Antes | Depois | Status |
|-------------------|-------|--------|--------|
| 001 - Analista de Sistemas | 5 vagas | 7 vagas | ✅ Sucesso |
| 002 - Assistente Administrativo | 3 vagas | 3 vagas | ✅ Sucesso |
| 003 - Gerente de Projetos | 2 vagas | 1 vaga | ✅ Sucesso |
| 004 - Coordenador de TI | 4 vagas | 4 vagas | ❌ Erro: [mensagem] |

**Formato das Colunas:**

- **Posto de Trabalho:** Código + Descrição
- **Antes:** Quantidade de vagas antes da normalização
- **Depois:** Quantidade de vagas após a normalização
- **Status:** 
  - ✅ Sucesso (verde)
  - ❌ Erro: [mensagem do erro] (vermelho)

**Ordenação:**
- Padrão: Ordem alfabética por código do posto
- Clicável: Permite ordenar por qualquer coluna
- Indicador visual: ▲ (crescente) ▼ (decrescente)

**Paginação:**
- 20 registros por página (padrão)
- Opções: 10, 20, 50, 100 registros por página
- Controles: « Anterior | 1 2 3 ... | Próxima »

**Filtro Rápido:**
- Dropdown: [Todos] [✅ Apenas Sucessos] [❌ Apenas Erros]
- Atualiza a tabela automaticamente ao selecionar

**Exportação:** ❌ Não permite exportar

---

**Seção: Ações Disponíveis**

**Registro de Auditoria:**
```
📝 Esta normalização foi registrada no histórico de auditoria.

Responsável: [Nome do Usuário]
Data/Hora: 15/12/2025 14:35:22
ID da Operação: #NRM-2025-001234
```

---

###### Botões Finais

**Posicionamento:** Rodapé da tela

**Botão [Ver Histórico]**
- Tipo: Secundário
- Comportamento: Abre em nova aba (ou navega para) Tela 3.3: Histórico de Normalização
- Link: `/normalizacao/historico` (filtrado por esta operação)

**Botão [Concluir]**
- Tipo: Primário
- Comportamento: Fecha o wizard e volta para tela inicial do wizard (Passo 1 resetado)
- Reseta todos os campos para valores padrão
- Exibe toast: "✅ Normalização concluída com sucesso"

---

##### NAVEGAÇÃO ENTRE PASSOS

**Stepper Visual:**
```
[1 Configuração] → [2 Confirmação] → [3 Processamento/Resultado]
```

**Durante o Wizard:**

**Passo 1 (Ativo):**
```
[●1 Configuração] → [○2 Confirmação] → [○3 Resultado]
```

**Passo 2 (Ativo):**
```
[✓1 Configuração] → [●2 Confirmação] → [○3 Resultado]
```

**Passo 3 (Ativo):**
```
[✓1 Configuração] → [✓2 Confirmação] → [●3 Resultado]
```

**Legenda:**
- ● = Passo atual (círculo preenchido + texto em negrito)
- ○ = Próximo passo (círculo vazio + texto normal)
- ✓ = Passo concluído (check verde + texto normal)

**Comportamento:**
- Não permite pular passos
- Permite voltar apenas do Passo 2 para Passo 1
- Não permite voltar do Passo 3 (processamento irreversível)
- Após clicar [Concluir]: Reinicia wizard no Passo 1

---

### �📊 MÓDULO 2: QUADRO DE LOTAÇÃO - INVENTÁRIO

#### TELA 2.1: Manutenção do Quadro (Vagas por Posto)
**Rota:** `/quadro/manutencao`  
**Tipo:** Tabela com CRUD  
**Acesso:** RH Admin, RH Manager, Gerente de Área  

**Componentes:**
- Filtros: Empresa, Centro de Custo, Cargo, Tipo Controle, Buscar
- Botão: [+ Adicionar Posto ao Quadro]
- Tabela com colunas:
  - Código do Posto
  - Posto de Trabalho (descrição completa)
  - Vagas Previstas
  - Vagas Efetivas (read-only)
  - Vagas Reservadas (read-only)
  - Ações: [✏️ Editar] [📋 Detalhes] [🗑️ Deletar]
- Paginação

**Modais/Dialogs:**
- Modal: Adicionar Posto ao Quadro (formulário)
- Modal: Editar Vagas (formulário)
- Modal: Detalhes do Posto (informações + histórico + colaboradores + propostas)
- Dialog: Confirmação de Exclusão

#### TELA 2.2: Reservas (Vagas em Seletivo)
**Rota:** `/quadro/reservas`  
**Tipo:** Tabela com visualização  
**Acesso:** RH Admin, RH Manager  

**Componentes:**
- Filtros: Status Seletivo, Centro de Custo, Cargo, Data Abertura
- Tabela com colunas:
  - Posto de Trabalho
  - Status Seletivo (Aberto, Em Triagem, Entrevista, Oferta, Fechado)
  - Data Abertura
  - Data Previsão
  - Candidatos (quantidade)
  - Ações: [✏️ Editar Status] [📊 Ver Detalhes]
- Paginação

**Modais/Dialogs:**
- Modal: Editar Status do Seletivo (formulário)
- Modal: Detalhes do Seletivo (timeline do processo, candidatos, etapas)

---

### 🔄 MÓDULO 3: NORMALIZAÇÃO

#### TELA 3.1: Quadro Previsto (Normalização Previsto → Previsto)
**Rota:** `/normalizacao/quadro-previsto`  
**Tipo:** Wizard/Stepper de processo  
**Acesso:** RH Admin, RH Manager (com permissão)  

**Componentes:**
- **Passo 1: Configuração**
  - Seletor: Empresa, Plano de Vagas, Competência (se mensal)
  - Tipo de Normalização: Efetivo→Previsto ou Previsto→Previsto
  - Botão: [Próximo]
  
- **Passo 2: Divergências Detectadas**
  - Tabela com divergências:
    - Posto de Trabalho
    - Vagas Origem
    - Vagas Destino
    - Divergência
    - Ação Sugerida
    - Checkbox: Aplicar
  - Botões: [Voltar] [Aplicar Selecionados] [Aplicar Todos]
  
- **Passo 3: Confirmação**
  - Resumo das alterações
  - Total de postos afetados
  - Log de mudanças
  - Botões: [Voltar] [Confirmar e Executar]
  
- **Passo 4: Resultado**
  - Status: Sucesso/Falha
  - Alterações aplicadas (quantidade)
  - Erros (se houver)
  - Link: [Ver Histórico de Normalização]
  - Botão: [Concluir]

**Modais/Dialogs:**
- Dialog: Confirmação de Execução (irreversível)
- Modal: Detalhes de Divergência (por posto)

#### TELA 3.2: Quadro Efetivo (Normalização Automática)
**Rota:** `/normalizacao/quadro-efetivo`  
**Tipo:** Painel de monitoramento  
**Acesso:** RH Admin, RH Manager  

**Componentes:**
- Card: Status da Normalização Automática (Ativo/Inativo)
- Card: Última Sincronização (data/hora)
- Card: Próxima Sincronização (data/hora)
- Tabela: Últimas Alterações Automáticas (últimas 50)
  - Data/Hora
  - Posto de Trabalho
  - Tipo de Movimento (Admissão, Transferência, Desligamento)
  - Colaborador
  - Antes → Depois (vagas efetivas)
  - Status
- Botões:
  - [🔄 Sincronizar Agora]
  - [⚙️ Configurar Webhooks]
  - [📋 Ver Log Completo]

**Modais/Dialogs:**
- Modal: Configuração de Webhooks (URLs, autenticação, eventos)
- Modal: Log Completo de Sincronização (filtros, busca)

#### TELA 3.3: Histórico de Normalização
**Rota:** `/normalizacao/historico`  
**Tipo:** Tabela com filtros avançados  
**Acesso:** Todos os perfis (visualização)  

**Componentes:**
- Filtros:
  - Período (data início/fim)
  - Plano de Vagas
  - Tipo de Normalização
  - Posto de Trabalho
  - Usuário Responsável
  - Status (Sucesso, Falha)
- Tabela com colunas:
  - ID
  - Data/Hora
  - Tipo (Previsto→Previsto, Efetivo→Previsto, Automática)
  - Plano de Vagas
  - Responsável
  - Postos Afetados
  - Status
  - Ações: [📋 Ver Detalhes]
- Paginação
- Exportação: [📤 Exportar Excel]

**Modais/Dialogs:**
- Modal: Detalhes da Normalização (resumo completo + log de alterações + antes/depois)

---

### 📋 MÓDULO 4: PROPOSTAS

#### TELA 4.1: Gestão de Propostas
**Rota:** `/propostas/gestao`  
**Tipo:** Tabela com CRUD  
**Acesso:** Todos os perfis (com permissões diferenciadas)  

**Componentes:**
- Filtros: Status, Tipo, Posto, Solicitante, Período
- Botão: [+ Nova Proposta]
- Tabela com colunas:
  - ID
  - Tipo (Inclusão, Alteração, Exclusão, Transferência)
  - Descrição
  - Posto de Trabalho
  - Solicitante
  - Status (Rascunho, Nível 1, Nível 2, Nível 3, RH, Aprovada, Rejeitada)
  - Data Criação
  - Ações: [✏️ Editar] [📋 Visualizar] [🗑️ Deletar]
- Paginação

**Modais/Dialogs:**
- Modal/Slide-in: Nova Proposta (formulário completo)
- Modal/Slide-in: Editar Proposta (formulário - apenas rascunho)
- Modal/Slide-in: Visualizar Proposta (detalhes completos + workflow + comentários)
- Dialog: Confirmação de Exclusão (apenas rascunho)
- Dialog: Confirmação de Envio para Aprovação

**Campos do Formulário (Nova/Editar Proposta):**
- Tipo de Proposta (Select)
- Descrição (Text)
- Detalhamento/Justificativa (TextArea)
- Posto de Trabalho (Select/Autocomplete)
- Vagas Atuais (Number - read-only)
- Vagas Solicitadas (Number)
- Posto Destino (Select - apenas Transferência)
- Quantidade Transferência (Number - apenas Transferência)
- Impacto Orçamentário (Text)
- Análise de Impacto (TextArea)
- Anexos (File Upload)
- Botões: [Salvar Rascunho] [Enviar para Aprovação] [Cancelar]

#### TELA 4.2: Efetivar/Aprovar (Workflow)
**Rota:** `/propostas/workflow`  
**Tipo:** Painel de aprovação  
**Acesso:** Aprovadores de cada nível + RH  

**Componentes:**
- Filtros: 
  - Meus Pendentes (default)
  - Todas as Áreas
  - Tipo de Proposta
  - Solicitante
- Tabela com colunas:
  - Proposta ID
  - Tipo
  - Descrição
  - Posto de Trabalho
  - Solicitante
  - Data Requisição
  - Nível Atual (Coordenação, Gerente, Diretor, RH)
  - Ações: [👁️ Visualizar] [✅ Aprovar] [❌ Rejeitar] [⏸️ Solicitar Ajuste]
- Paginação

**Modais/Dialogs:**
- Modal: Visualizar Proposta (resumo + fluxo de aprovação + histórico de comentários)
- Modal: Aprovar Proposta (formulário com comentário opcional)
- Modal: Rejeitar Proposta (formulário obrigatório: motivo + sugestão)
- Modal: Solicitar Ajuste (formulário: comentários específicos)
- Dialog: Confirmação de Ação (Aprovar/Rejeitar/Ajustar)

**Modal de Aprovação - Estrutura:**
- Resumo da Proposta
- Fluxo Atual (visual com status de cada nível)
- Campo: Seu Comentário (opcional)
- Botões: [✅ Aprovar] [❌ Rejeitar] [⏸️ Solicitar Ajuste] [Cancelar]

---

### 📈 MÓDULO 5: ANALYTICS

#### TELA 5.1: Dashboard Analytics
**Rota:** `/analytics/dashboard`  
**Tipo:** Dashboard analítico  
**Acesso:** Todos os perfis (visualização)  

**Componentes:**
- Filtros globais: Empresa, Período, Centro de Custo, Cargo
- **Seção 1: Ocupação Geral**
  - Gráfico: Pizza (Ocupadas vs Disponíveis)
  - Gráfico: Linha (Evolução Mensal)
  - Card: Taxa de Ocupação (%)
  
- **Seção 2: Vagas por Centro de Custo**
  - Gráfico: Barras horizontais (Top 10 centros)
  - Tabela: Detalhamento por centro
  
- **Seção 3: Conformidade PcD**
  - Gráfico: Gauge (% conformidade)
  - Card: Vagas PcD (Previstas vs Ocupadas)
  - Alerta: Não conformidades
  
- **Seção 4: Movimentação**
  - Gráfico: Linha (Admissões vs Desligamentos)
  - Card: Turnover (%)
  
- Botões: [📤 Exportar Dashboard] [🔄 Atualizar]

**Modais/Dialogs:**
- Modal: Detalhes de Não Conformidade PcD

#### TELA 5.2: Consulta Vagas Previstas
**Rota:** `/analytics/vagas-previstas`  
**Tipo:** Consulta com filtros avançados  
**Acesso:** Todos os perfis  

**Componentes:**
- Filtros:
  - Plano de Vagas (dropdown)
  - Empresa, Filial, Centro de Custo, Cargo
  - Local, Turno, Escala, Tipo de Colaborador
  - Status (Ativo/Inativo)
- Tabela com colunas:
  - Posto de Trabalho
  - Centro de Custo
  - Cargo
  - Filial/Local
  - Turno
  - Vagas Previstas
  - Vagas Efetivas
  - Vagas Reservadas
  - Disponíveis
  - Taxa Ocupação (%)
  - Status
- Totalizadores:
  - Total Previstas
  - Total Efetivas
  - Total Disponíveis
  - Taxa Ocupação Geral
- Paginação
- Exportação: [📤 Excel] [📄 PDF] [📋 CSV]

**Modais/Dialogs:**
- Modal: Detalhes do Posto (completo com histórico)

#### TELA 5.3: Parâmetros de Comparação (Market Data)
**Rota:** `/analytics/parametros-comparacao`  
**Tipo:** Análise comparativa de mercado  
**Acesso:** RH Admin, RH Manager, Diretor  

**Componentes:**
- Filtros: Cargo, Região, Senioridade
- **Seção 1: Salário vs Mercado**
  - Gráfico: Barras comparativas (Interno vs Mercado)
  - Tabela: Cargos com maior divergência
  
- **Seção 2: Benefícios Competitividade**
  - Score: 0-10 (quanto % competitivo)
  - Lista: Benefícios oferecidos vs mercado
  
- **Seção 3: Retenção de Talentos**
  - Gráfico: Heatmap (Cargos × Risco de Rotatividade)
  - Alerta: Cargos críticos
  
- **Seção 4: Tempo de Preenchimento**
  - Gráfico: Linha (Interno vs Benchmark Mercado)
  - Card: Custo por Dia de Vaga Aberta
  
- Botões: [🔄 Atualizar Market Data] [📤 Exportar Análise]

**Modais/Dialogs:**
- Modal: Detalhes de Cargo Crítico (risco + recomendações)
- Modal: Configuração de Fontes de Market Data

#### TELA 5.4: Ocupação de Vagas
**Rota:** `/analytics/ocupacao`  
**Tipo:** Análise de ocupação  
**Acesso:** Todos os perfis  

**Componentes:**
- Filtros: Empresa, Centro de Custo, Cargo, Período
- **Seção 1: Visão Geral**
  - Card: Vagas Totais
  - Card: Vagas Ocupadas
  - Card: Vagas Disponíveis
  - Card: Taxa de Ocupação (%)
  
- **Seção 2: Ocupação por Dimensão**
  - Gráfico: Treemap (Centro de Custo × Ocupação)
  - Gráfico: Barras empilhadas (Cargo × Status)
  
- **Seção 3: Evolução Temporal**
  - Gráfico: Área (Previstas vs Efetivas ao longo do tempo)
  - Seletor: Mensal, Trimestral, Anual
  
- **Seção 4: Top/Bottom**
  - Tabela: Top 10 Centros com Maior Ocupação
  - Tabela: Top 10 Centros com Menor Ocupação
  - Alerta: Centros abaixo de 80% ocupação
  
- Exportação: [📤 Exportar]

**Modais/Dialogs:**
- Modal: Detalhes de Centro de Custo (drilldown completo)

#### TELA 5.5: PcD (Pessoas com Deficiência)
**Rota:** `/analytics/pcd`  
**Tipo:** Análise de conformidade PcD  
**Acesso:** RH Admin, RH Manager, Diretor  

**Componentes:**
- Filtros: Empresa, Filial, Competência
- **Seção 1: Conformidade Lei 8.213**
  - Card: Status Geral (✅ Conforme / ❌ Não Conforme)
  - Card: Quota Obrigatória (% e quantidade)
  - Card: Colaboradores PcD (quantidade)
  - Card: Gap (quantos faltam para conformidade)
  
- **Seção 2: Cálculo Detalhado**
  - Tabela: Por Filial
    - Filial
    - Total Colaboradores
    - Faixa (2%, 3%, 4%, 5%)
    - Quota Obrigatória
    - PcD Atual
    - Gap
    - Status Conformidade
  
- **Seção 3: Distribuição PcD**
  - Gráfico: Pizza (Por Centro de Custo)
  - Gráfico: Barras (Por Tipo de Deficiência)
  
- **Seção 4: Evolução Histórica**
  - Gráfico: Linha (Taxa de Conformidade ao longo do tempo)
  
- **Seção 5: Alertas & Recomendações**
  - Lista: Filiais não conformes
  - Sugestões: Postos para recrutar PcD
  
- Exportação: [📤 Relatório PcD Completo] (obrigatório para auditoria MTE)

**Modais/Dialogs:**
- Modal: Detalhes de Não Conformidade por Filial
- Modal: Explicação da Lei 8.213 (cálculo de faixas)

---

### 🔐 MÓDULO 6: LGPD

#### TELA 6.1: Portal do Titular
**Rota:** `/lgpd/portal-titular`  
**Tipo:** Portal self-service  
**Acesso:** Qualquer colaborador autenticado (acessa apenas seus próprios dados)  

**Componentes:**
- **Seção 1: Meus Dados**
  - Painel: "O sistema processa seus dados pessoais"
  - Lista: Categorias de dados coletados
  - Lista: Finalidades de cada categoria
  
- **Seção 2: Visualizar Dados**
  - Tabela: Todos os dados pessoais do titular
  - Inclui: Dados de RH, Logs de acesso (últimos 90 dias)
  - Botão: [📤 Exportar Dados] (JSON/CSV)
  
- **Seção 3: Solicitar Correção**
  - Botão: [✏️ Solicitar Correção]
  - Form: Campo incorreto + Valor correto
  - Workflow: Aprovação RH (SLA 15 dias)
  
- **Seção 4: Solicitar Exclusão**
  - Botão: [🗑️ Solicitar Exclusão]
  - Aviso: "Dados podem ser mantidos por obrigação legal"
  - Timeline: Dados retidos + Prazo de eliminação
  
- **Seção 5: Portabilidade**
  - Botão: [📦 Exportar para Outro Sistema]
  - Formato: JSON estruturado (padrão ANPD)
  
- **Seção 6: Compartilhamento**
  - Lista: Entidades com quem compartilhamos (MTE, etc.)
  - Lista: Operadores (cloud providers)
  - Finalidade: Para cada compartilhamento
  
- **Seção 7: Consentimentos**
  - Lista: Consentimentos ativos
  - Botão: [❌ Revogar] (por consentimento)
  
- **Seção 8: Contestar Tratamento**
  - Botão: [⚠️ Contestar Tratamento]
  - Form: Motivo da oposição
  - Análise: DPO (resposta em 15 dias)

**Modais/Dialogs:**
- Modal: Formulário de Solicitação de Correção
- Modal: Confirmação de Solicitação de Exclusão
- Modal: Exportação de Dados (escolher formato)
- Modal: Formulário de Contestação

---

### ⚙️ MÓDULO 7: CONFIGURAÇÕES

#### TELA 7.1: Workflow de Aprovação
**Rota:** `/configuracoes/workflow`  
**Tipo:** Configuração visual  
**Acesso:** RH Admin apenas  

**Componentes:**
- Filtros: Empresa, Área
- **Seção 1: Configuração de Níveis**
  - Dropdown: Número de Níveis (1, 2, 3 ou 4)
  - Para cada nível:
    - Nome do Nível (ex: Coordenação)
    - Aprovador(es) (Select/Autocomplete)
    - Ordem (sequência)
    - Ação em Rejeição (Retorna Rascunho / Termina Processo)
  - Checkbox: RH Efetivação (obrigatório)
  
- **Seção 2: Preview do Fluxo**
  - Visualização gráfica do workflow configurado
  - Simulação: "Proposta de teste"
  
- Botões: [Salvar Configuração] [Testar Workflow]

**Modais/Dialogs:**
- Modal: Adicionar Aprovador (busca de usuário)
- Modal: Teste de Workflow (simula proposta)

#### TELA 7.2: Notificações
**Rota:** `/configuracoes/notificacoes`  
**Tipo:** Configuração de preferências  
**Acesso:** Todos os usuários (preferências próprias) + RH Admin (templates globais)  

**Componentes:**
- **Aba 1: Minhas Preferências**
  - Checkbox por tipo de notificação:
    - Proposta Criada (Email, In-app, SMS)
    - Proposta Aprovada/Rejeitada
    - Normalização Executada
    - Admissão de Colaborador
    - Desligamento de Colaborador
    - Alerta PcD
    - Relatórios Agendados
  - Por canal: Email, In-app, SMS, Push
  
- **Aba 2: Templates (RH Admin)**
  - Lista de templates de notificação
  - Editor: Assunto, Corpo (com variáveis)
  - Preview
  
- Botões: [Salvar Preferências] [Testar Notificação]

**Modais/Dialogs:**
- Modal: Editar Template (editor rich text)
- Modal: Testar Envio (envia notificação de teste)

#### TELA 7.3: Integrações
**Rota:** `/configuracoes/integracoes`  
**Tipo:** Configuração de integrações externas  
**Acesso:** RH Admin, DevOps  

**Componentes:**
- **Seção 1: Integração RH Legado**
  - Status: Ativo/Inativo
  - URL API: (input)
  - Autenticação: (tipo + credenciais)
  - Webhook URL: (read-only, copiar)
  - Eventos: Admissão, Transferência, Desligamento
  - Última Sincronização: (data/hora)
  - Botão: [Testar Conexão] [Sincronizar Agora]
  
- **Seção 2: Market Data (Opcional)**
  - Status: Ativo/Inativo
  - Fonte: Glassdoor, LinkedIn, Outro
  - API Key: (input protegido)
  - Frequência Atualização: Diária, Semanal, Mensal
  - Última Atualização: (data/hora)
  - Botão: [Testar Conexão] [Atualizar Agora]
  
- **Seção 3: IA/ML (Opcional)**
  - Status: Ativo/Inativo
  - Plataforma: BigQuery, Azure ML, AWS SageMaker, Custom
  - Endpoint: (input)
  - Autenticação: (tipo + credenciais)
  - Botão: [Testar Conexão] [Retreinar Modelo]
  
- **Seção 4: Platform Notifications**
  - Status: Ativo (sempre)
  - Email Provider: (config)
  - SMS Provider: (config)
  - Push Provider: (config)
  
- Botões: [Salvar Configurações]

**Modais/Dialogs:**
- Modal: Configuração de Webhook (detalhes técnicos)
- Modal: Log de Integrações (últimas 100 chamadas)
- Dialog: Teste de Conexão (sucesso/falha + detalhes)

#### TELA 7.4: Auditoria
**Rota:** `/configuracoes/auditoria`  
**Tipo:** Consulta de logs  
**Acesso:** RH Admin, Auditor  

**Componentes:**
- Filtros:
  - Período (data/hora início/fim)
  - Usuário
  - Módulo (Dashboard, Quadro, Normalização, Propostas, Analytics)
  - Ação (Criar, Editar, Deletar, Aprovar, Rejeitar, Normalizar)
  - Entidade (Posto, Proposta, Normalização, etc.)
  - IP
  - Status (Sucesso, Falha)
- Tabela com colunas:
  - Data/Hora
  - Usuário
  - IP
  - Módulo
  - Ação
  - Entidade
  - ID Entidade
  - Antes (JSON)
  - Depois (JSON)
  - Status
  - Ações: [👁️ Ver Detalhes]
- Paginação (com paginação server-side - milhões de registros)
- Exportação: [📤 Exportar Log] (Excel/CSV)

**Modais/Dialogs:**
- Modal: Detalhes de Log (JSON formatado + contexto)

---

## 📊 RESUMO QUANTITATIVO

### Telas por Módulo

| Módulo | Telas Principais | Modais/Dialogs | Total Componentes |
|--------|------------------|----------------|-------------------|
| Dashboard | 1 | 4 | 5 |
| Quadro de Lotação | 4 | 12 | 16 |
| Normalização | 3 | 6 | 9 |
| Propostas | 2 | 8 | 10 |
| Analytics | 5 | 6 | 11 |
| LGPD | 1 | 4 | 5 |
| Configurações | 4 | 6 | 10 |
| **TOTAL** | **20** | **46** | **66** |

### Distribuição por Tipo

| Tipo de Tela | Quantidade |
|--------------|------------|
| Dashboard/Painel | 3 |
| Tabela CRUD | 9 |
| Wizard/Stepper | 1 |
| Consulta/Análise | 5 |
| Configuração | 4 |
| Portal Self-Service | 1 |
| **TOTAL Principal** | **23** |
| Modais/Slide-ins | 35 |
| Dialogs/Confirmações | 11 |
| **TOTAL Geral** | **69** |

---

## 🎯 PRÓXIMOS PASSOS

Após aprovação deste inventário, o próximo passo será detalhar **cada tela individualmente** com:

1. **Comportamentos de Interação**
   - Ações de botões
   - Eventos de clique
   - Navegação entre telas
   
2. **Validações de Formulário**
   - Campos obrigatórios
   - Regras de validação
   - Mensagens de erro
   
3. **Regras de Negócio Específicas**
   - Cálculos
   - Condições
   - Permissões por perfil
   
4. **Estados e Loading**
   - Estados vazios
   - Estados de loading
   - Estados de erro
   - Estados de sucesso
   
5. **Responsividade**
   - Breakpoints
   - Ajustes mobile
   - Comportamento em diferentes resoluções

6. **Acessibilidade**
   - ARIA labels
   - Navegação por teclado
   - Leitores de tela

---

## ✅ APROVAÇÃO

Este documento deve ser revisado e aprovado pelas partes interessadas antes de prosseguir com o detalhamento de comportamentos.

**Aprovadores:**
- [ ] Product Owner
- [ ] Tech Lead Frontend
- [ ] UX Designer
- [ ] QA Lead

---

## 📝 CONTROLE DE VERSÃO

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 15/12/2025 | Equipe PRD | Versão inicial - Inventário completo |

---

**Fim do PRD Parte 9 - Inventário de Telas**
