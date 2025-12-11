# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 3: MÓDULOS COMPLEMENTARES (Propostas, Analytics, Reservas)

---

## 4️⃣ MÓDULO: PROPOSTAS

### 4.1 Visão Geral
Fluxo estruturado de aprovação para alterações no quadro de vagas. Suporta 3 níveis de aprovação (Coordenação/Gerente/Diretor) + RH para efetivação final. Notificações automáticas em cada etapa.

### 4.2 Estrutura de Navegação

```
PROPOSTAS (Menu Principal)
├── 1. GESTÃO DE PROPOSTAS
│   └── Tabela: ID, Tipo, Descção, Solicitante, Status, Ações
│       ├── [+ Nova Proposta]
│       ├── [✏️] Editar (rascunho)
│       ├── [📋] Visualizar Detalhes
│       └── [🗑️] Deletar (rascunho)
│
└── 2. EFETIVAR / APROVAR
    └── Fluxo Workflow com 3 Níveis + RH
        ├── Nível 1: Coordenação
        ├── Nível 2: Gerente
        ├── Nível 3: Diretor
        └── RH: Efetivação Final
```

### 4.3 Sub-módulo 1: Gestão de Propostas

#### Objetivo
Criar, editar, visualizar e deletar propostas de alteração no quadro.

#### Tipos de Propostas

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Inclusão de Vaga** | Criar nova vaga | +1 Dev Senior em TI |
| **Alteração de Vaga** | Modificar cargo/quantidade | De 1 Pleno para 2 Junior |
| **Exclusão de Vaga** | Remover vaga | -1 Gerente em RH |
| **Transferência** | Mover vaga entre centros | De TI para Operações |

#### Campos - Formulário

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Tipo Proposta** | Select | ✅ | Inclusão / Alteração / Exclusão / Transferência |
| **Descrição** | Text | ✅ | Título resumido |
| **Detalhamento** | Text Area | ✅ | Justificativa da alteração |
| **Centro de Custo Origem** | Select | ✅ | Onde está a vaga atual (ou será) |
| **Posto de Trabalho** | Select | ✅ | Qual posto afetado |
| **Cargo Atual** | Select (RO) | 🔒 | Auto-preenchido (read-only) |
| **Cargo Novo** | Select | ⭕ | Se diferente do atual |
| **Vagas Atuais** | Number (RO) | 🔒 | Auto-preenchido |
| **Vagas Solicitadas** | Number | ✅ | Nova quantidade |
| **Centro Destino** | Select | ⭕ | Para tipo "Transferência" |
| **Impacto Orçamentário** | Text | ⭕ | Estimativa de custo (livre) |
| **Análise de Impacto** | Text Area | ⭕ | Como afeta outras áreas |
| **Anexos** | File Upload | ⭕ | Documentos suportivos |

#### Interface - Tabela Gestão

```
┌──────────────────────────────────────────────────────────────────┐
│ GESTÃO DE PROPOSTAS                      [+ Nova Proposta]       │
├──────────────────────────────────────────────────────────────────┤
│ Filtros: [Status ▼] [Tipo ▼] [Centro ▼] [Buscar...]             │
├──────────────────────────────────────────────────────────────────┤
│ ID │ Tipo │ Descrição │ Solicitante │ Status │ Criação │ Ações │
│──────────────────────────────────────────────────────────────────│
│#145│ Incl │ +Dev Pleno TI │ Maria │ ✏️ Rascunho│ 08/12 │[✏️][📋]
│#144│ Alt  │ 1→2 Junior │ João │ ⏳ Nível 1│ 07/12 │[📋][🔁] │
│#143│ Excl │ -Gerente RH │ Ana │ ✅ Aprovada│ 06/12 │[📋]  │
│#142│ Trans│ Dev→Ops │ Carlos │ ❌ Rejeitada│ 05/12 │[📋]  │
└──────────────────────────────────────────────────────────────────┘
```

#### Ações

**[+ Nova Proposta]**
- Abre formulário vazio em Modal/Slide-in
- Campos obrigatórios validados antes de salvar
- Estados possíveis: "Rascunho" → "Enviada"
- Botões: Salvar, Enviar para Aprovação, Cancelar

**[✏️ Editar]**
- Disponível apenas se Status = "Rascunho"
- Abre formulário pre-preenchido
- Permite editar todos os campos
- Botão: Enviar para Aprovação (muda status para "Nível 1")

**[📋 Visualizar]**
- Modal/Slide-in com:
  - Todos os dados da proposta
  - Histórico de aprovações (quem aprovou, quando, comentário)
  - Status atual no workflow
  - Se rejeitada: motivo e sugestão
  
**[🗑️ Deletar]**
- Apenas rascunho
- Confirmação: "Tem certeza? Esta ação é irreversível"

### 4.4 Sub-módulo 2: Efetivar / Aprovar (Workflow)

#### Objetivo
Fluxo de aprovação configurável com 3 níveis + RH, com notificações automáticas.

#### Estrutura de Workflow

```
[PROPOSTA CRIADA]
      ↓
[NÍVEL 1: COORDENAÇÃO]
├─ ✅ Aprova → Próximo Nível
├─ ⏸️ Aguardando → Volta para solicitante
└─ ❌ Rejeita → Retorna RASCUNHO (solicitante pode editar)
      ↓
[NÍVEL 2: GERENTE]
├─ ✅ Aprova → Próximo Nível
├─ ⏸️ Aguardando → Volta para solicitante
└─ ❌ Rejeita → Retorna RASCUNHO
      ↓
[NÍVEL 3: DIRETOR]
├─ ✅ Aprova → RH
├─ ⏸️ Aguardando → Volta para solicitante
└─ ❌ Rejeita → Retorna RASCUNHO
      ↓
[RH: EFETIVAÇÃO]
├─ ✅ Efetiva → [PROPOSTA APROVADA] (aplica mudanças no Quadro)
├─ ⚠️ Solicita Ajuste → Volta RASCUNHO
└─ ❌ Rejeita → [PROPOSTA REJEITADA]
      ↓
[APLICAR MUDANÇAS NO QUADRO]
└─ Atualiza Quadro de Lotação com dados da proposta
```

#### Configurabilidade de Níveis

Por **Empresa/Área**, é possível configurar:
- Número de níveis (1, 2, 3 ou 4)
- Quem aprova em cada nível
- Se rejeição retorna ao rascunho ou termina processo

**Exemplo 1: Empresa Grande**
- Nível 1: Coordenador
- Nível 2: Gerente de Área
- Nível 3: Diretor
- RH: Efetivação
→ 4 aprovações

**Exemplo 2: Pequena Filial**
- Nível 1: Gerente (único)
- RH: Efetivação
→ 2 aprovações

#### Interface - Painel de Aprovação

**Visualização para Aprovador:**

```
┌──────────────────────────────────────────────────────────────────┐
│ PROPOSTAS PENDENTES DE APROVAÇÃO - NÍVEL 1 (COORDENAÇÃO)        │
├──────────────────────────────────────────────────────────────────┤
│ Filtros: [Meus Pendentes] [Todas Áreas] [Tipo ▼] [Buscar...]    │
├──────────────────────────────────────────────────────────────────┤
│ Proposta │ Tipo │ Descrição │ Solicitante │ Data Req │ Ações    │
│──────────────────────────────────────────────────────────────────│
│ #145 │ Incl │ +Dev Pleno TI │ Maria (TI) │ 08/12 14:30 │[👁️][✅]
│ #144 │ Alt │ 1→2 Junior │ João (OPS) │ 07/12 09:15 │[👁️][✅][❌]
└──────────────────────────────────────────────────────────────────┘
```

**Modal de Aprovação (Botão [✅]):**

```
┌──────────────────────────────────────────────────────────────────┐
│ APROVAR PROPOSTA #145                                     [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ RESUMO DA PROPOSTA                                               │
│ • Tipo: Inclusão de Vaga                                         │
│ • Descrição: +Dev Pleno em TI                                    │
│ • Justificativa: Aumento de demanda em projeto X                │
│ • Impacto: +R$ 15k/mês em folha                                  │
│                                                                   │
│ FLUXO ATUAL                                                      │
│ ✅ Solicitante (Maria) - 08/12 14:30                            │
│ ⏳ Nível 1 (Coordenação) - Aguardando sua aprovação             │
│ ⭕ Nível 2 (Gerente) - Pendente                                 │
│ ⭕ Nível 3 (Diretor) - Pendente                                 │
│ ⭕ RH (Efetivação) - Pendente                                   │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ Seu Comentário (Opcional):                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Escreva seu parecer aqui]                                  │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [❌ Rejeitar] [⏸️ Aguardar] [✅ Aprovar]                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Ações do Aprovador:**

| Ação | Efeito | Status Final |
|------|--------|--------------|
| **✅ Aprovar** | Move para próximo nível | "Nível 2" / "RH" |
| **❌ Rejeitar** | Retorna rascunho + notifica | "Rascunho" (solicitante edita) |
| **⏸️ Aguardar** | Deixa em análise (revisão depois) | "Nível X (Aguardando)" |

#### Notificações Automáticas

**Para cada transição de status:**

1. **Quando enviada para Aprovação (N1):**
   - Email: Coordenador → "Nova proposta aguardando aprovação"
   - In-app notification: Coordenador

2. **Quando aprovada (N1 → N2):**
   - Email: Gerente → "Proposta aprovada no Nível 1, aguardando sua aprovação"
   - In-app notification: Gerente

3. **Quando rejeitada:**
   - Email: Solicitante → "Sua proposta foi rejeitada. Motivo: [comentário]"
   - In-app notification: Solicitante
   - Status volta "Rascunho"

4. **Quando aprovada (N3 → RH):**
   - Email: RH → "Proposta pronta para efetivação"
   - In-app notification: RH

5. **Quando efetivada:**
   - Email: Todos envolvidos → "Proposta efetivada. Quadro atualizado."
   - In-app notification: Solicitante + Aprovadores

#### Integração com Quadro de Vagas

**Ao clicar [✅ EFETIVADA] no RH:**

1. Proposta muda para status "Aprovada"
2. Sistema aplica as mudanças:
   - **Inclusão:** Cria novo registro em "Quadro de Lotação"
   - **Alteração:** Atualiza quantidade/cargo
   - **Exclusão:** Marca como inativo
   - **Transferência:** Move vaga para novo centro + atualiza histórico
3. Cria entrada em "Histórico de Alterações" com rastreabilidade completa
4. Atualiza "Vagas Previstas" do Posto
5. Gera evento de auditoria

---

## 5️⃣ MÓDULO: ANALYTICS

### 5.1 Visão Geral
Análises profundas e consultas de dados com ênfase em KPIs, competitividade de mercado e índices de ocupação. Suporta exportação e geração de comparativos.

### 5.2 Estrutura de Navegação

```
ANALYTICS (Menu Principal)
├── 1. DASHBOARD ANALYTICS
│   └── KPIs, Gráficos, Tendências (análogo ao Dashboard mas mais detalhado)
│
├── 2. CONSULTA VAGAS PREVISTAS
│   └── Tabela com filtros e exportação
│
├── 3. PARÂMETROS DE COMPARAÇÃO
│   └── Comparativo de períodos + Gráficos
│
├── 4. OCUPAÇÃO DE VAGAS
│   └── Taxa ocupação por cargo/centro + Gráficos
│
└── 5. PESSOAS COM DEFICIÊNCIA (PcD)
    └── Análise de conformidade Lei 8.213 + Gráficos
```

### 5.3 Sub-módulo 1: Dashboard Analytics

#### Objetivo
Visão analítica aprofundada com KPIs, tendências e insights.

#### Componentes

**Card 1: Taxa de Ocupação (Gráfico Pizza)**
```
Taxa de Ocupação: 93.2%
┌─────────────────┐
│  Ocupadas       │
│  93.2% (165)    │ ✅ Acima da Meta (95%)
│  ┌───────────┐  │
│  │███████░░  │  │
│  └───────────┘  │
│  Meta: 95%      │
│  Setor: 88%     │
└─────────────────┘
```

**Card 2: Custo por Contratação (Evolução)**
```
Custo Médio Contratação
R$ 3.2k (Atual)
┌─────────────────────┐
│  Mês  │ Custo       │
│  Nov  │ R$ 3.5k ─── │ Tendência ↓
│  Oct  │ R$ 3.8k     │ (Melhorando)
│  Sep  │ R$ 4.1k     │
│  Budget: R$ 4.5k    │
│  Economia: 29%      │
└─────────────────────┘
```

**Card 3: Qualidade de Contratação (Score)**
```
Qualidade de Contratação
8.4 / 10.0
┌──────────────────┐
│ ████████░░       │ ✅ Acima da Meta (8.0)
│ Meta: 8.0        │ Tendência: ↑ (melhorando)
│ Q3 2025: 8.2     │
│ Q2 2025: 8.1     │
└──────────────────┘
```

**Card 4: Benefícios Competitividade**
```
Pacote Competitivo
8.2 / 10.0
┌─────────────────┐
│ ████████░░      │ 82% (Bom)
│ • Vale Refeição │
│ • Vale Transporte
│ • Home Office   │
│ • PLR           │
└─────────────────┘
```

**Gráfico: Evolução Mensal**
```
Ocupação por Mês (Últimos 12 meses)
Ocupação %
100% ┤
 95% ┤    ✅ Meta
 90% ┤  ╱──╲  ╱──╲
 85% ┤ ╱    ╲╱    ╲
 80% ┼─────────────────
     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
```

**Seção: Alertas Críticos**
```
⚠️ ALERTAS CRÍTICOS
• Retenção de Talentos: 5 cargos com risco de turnover elevado
• Vagas abertas há mais de 30 dias: 3 posições
• Desbalanceamento PcD: 1.8% (Meta: 2%)
```

### 5.4 Sub-módulo 2: Consulta Vagas Previstas

#### Objetivo
Consultar e exportar dados detalhados de vagas previstas com filtros avançados.

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ CONSULTA VAGAS PREVISTAS                                         │
├──────────────────────────────────────────────────────────────────┤
│ FILTROS                                                          │
│ Período:        [__ / __ / ____] até [__ / __ / ____]           │
│ Empresa:        [╭─ ────────────╮] (dropdown)                    │
│ Centro de Custo: [╭─ ────────────╮] (autocomplete)              │
│ Cargo:          [╭─ ────────────╮] (autocomplete)                │
│ Tipo Controle:  [Diário ☑️] [Competência ☐]                     │
│                                                                   │
│ [🔍 Consultar] [🗑️ Limpar Filtros] [📤 Exportar]               │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ RESULTADOS (Tabela dinâmica)                                     │
│                                                                   │
│ Centro │ Posto │ Cargo │ Previstas │ Efetivas │ Reservadas │ %  │
│──────────────────────────────────────────────────────────────────│
│ TI     │ Service Desk │ Analista Pl. │ 5 │ 4 │ 1 │ 80% │
│ TI     │ Dev FullStack │ Dev Pleno │ 8 │ 7 │ 2 │ 88% │
│ RH     │ Gerente │ Gerente RH │ 1 │ 1 │ 0 │ 100%│
└──────────────────────────────────────────────────────────────────┘
```

**Botão [📤 Exportar]:**
- Abre menu com opções:
  - 📊 Excel (XLSX)
  - 📄 PDF
  - 📋 CSV

### 5.5 Sub-módulo 3: Parâmetros de Comparação

#### Objetivo
Comparar ocupação/vagas entre dois períodos ou áreas.

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ PARÂMETROS DE COMPARAÇÃO                                         │
├──────────────────────────────────────────────────────────────────┤
│ PERÍODO 1                      │ PERÍODO 2                        │
│ Data Início: [__ / __ / ____] │ Data Início: [__ / __ / ____]   │
│ Data Fim:    [__ / __ / ____] │ Data Fim:    [__ / __ / ____]   │
│ Centro: [▼ Todos]              │ Centro: [▼ Todos]               │
│                                │                                  │
│ [🔄 Gerar Comparativo]                                           │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ RESULTADO DO COMPARATIVO                                         │
│                                                                   │
│ Métrica         │ Período 1 │ Período 2 │ Variação │ Tendência │
│─────────────────────────────────────────────────────────────────│
│ Vagas Previstas │ 178       │ 189       │ +11 (6%) │ ↑ Crescim.│
│ Vagas Efetivas  │ 165       │ 174       │ +9 (5%)  │ ↑ Crescim.│
│ Taxa Ocupação   │ 93%       │ 92%       │ -1%      │ ↓ Queda   │
│ Vagas Abertas   │ 13        │ 15        │ +2       │ ↑ Aumento │
│                                                                   │
│ [Gráfico: Comparativo Visual]                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Período 1  │  Período 2                                    │ │
│ │ ████████░░░│ █████████░  (Vagas Previstas)                 │ │
│ │ ███████░░░░│ ████████░░░ (Vagas Efetivas)                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [📤 Exportar Comparativo]                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Botão [🔄 Gerar Comparativo]:**
- Validação: Verifica períodos preenchidos
- Execução: Busca dados dos períodos
- Atualiza gráficos e tabela em tempo real
- Permite salvar como favorito

### 5.6 Sub-módulo 4: Ocupação de Vagas

#### Objetivo
Análise detalhada de ocupação por cargo, centro, turno, etc.

#### Interface

```
┌──────────────────────────────────────────────────────────────────┐
│ OCUPAÇÃO DE VAGAS                                                │
├──────────────────────────────────────────────────────────────────┤
│ FILTROS                                                          │
│ Período:       [__ / __ / ____] até [__ / __ / ____]            │
│ Agrupar por:   [Por Cargo ▼] (ou Centro, Turno, etc)            │
│ Centro Custo:  [╭─ ────────╮] (opcional)                        │
│                                                                   │
│ [🔄 Gerar Análise] [🗑️ Limpar]                                 │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ ANÁLISE DE OCUPAÇÃO                                              │
│                                                                   │
│ Cargo │ Previstas │ Ocupadas │ Vagas │ Taxa │ Tendência        │
│──────────────────────────────────────────────────────────────────│
│ Dev Full Stack │ 8 │ 7 │ 1 │ 88% │ ↑ Melhorando                │
│ Gerente Projetos│ 3 │ 3 │ 0 │ 100%│ → Estável                  │
│ Analista Dados │ 4 │ 2 │ 2 │ 50% │ ↓ Crítico (⚠️)             │
│ Admin │ 3 │ 3 │ 0 │ 100%│ → Estável                            │
│                                                                   │
│ [Gráfico: Taxa Ocupação por Cargo]                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Dev Full Stack     ████████░░░░░ 88%                        │ │
│ │ Gerente Projetos   ██████████░░░ 100% ✅                    │ │
│ │ Analista Dados     █████░░░░░░░░ 50% ⚠️                     │ │
│ │ Admin              ██████████░░░ 100% ✅                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [📤 Exportar Análise]                                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Botão [🔄 Gerar Análise]:**
- Recalcula percentuais e gráficos baseado nos filtros
- Atualiza tendências (↑ ↓ →)
- Destaca anomalias em vermelho

### 5.7 Sub-módulo 5: Pessoas com Deficiência (PcD)

#### Objetivo
Monitorar conformidade com Lei 8.213 e análise de vagas PcD.

#### Interface - Reformulada

```
┌──────────────────────────────────────────────────────────────────┐
│ PESSOAS COM DEFICIÊNCIA (PcD) - CONFORMIDADE LEI 8.213          │
├──────────────────────────────────────────────────────────────────┤
│ SELETOR DE PERÍODO (data início e fim)                           │
│ Período Inicial:  [__ / __ / ____] (dd/mm/aaaa)                 │
│ Período Final:    [__ / __ / ____] (dd/mm/aaaa)                 │
│ Centro de Custo:  [╭─ ────────────╮] (opcional)                 │
│                                                                   │
│ ℹ️ Conforme Lei 8.213/91:                                        │
│ • 50-200 colaboradores: 2% de PcD obrigatório                   │
│ • 201-500 colaboradores: 3% de PcD obrigatório                  │
│ • 501-1000 colaboradores: 4% de PcD obrigatório                 │
│ • > 1000 colaboradores: 5% de PcD obrigatório                   │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ INDICADORES (Atualiza ao alterar período/centro)                │
│                                                                   │
│ Total de Colaboradores: 250                                      │
│ % Obrigatório PcD: 3% (7-8 colaboradores)                        │
│ PcD Atuais: 6 colaboradores                                      │
│ Cumprimento: 75% ⚠️ (Abaixo da meta)                            │
│                                                                   │
│ [Gráfico: Conformidade]                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 75% PcD Atuais         ████████░░░░░                        │ │
│ │ 100% Meta (3%)         ████████████░                        │ │
│ │ Status: ⚠️ ABAIXO DA META (faltam 1-2 PcD)                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [Tabela: Distribuição por Centro]                               │
│ Centro │ Total │ % Meta │ PcD │ % Atual │ Status │ Ações        │
│────────────────────────────────────────────────────────────────│
│ TI     │ 100  │ 3% (3) │ 2   │ 2% ⚠️   │ Abaixo│ [+] [Planejar]│
│ RH     │ 50   │ 2% (1) │ 1   │ 2% ✅   │ Ok   │           │
│ Admin  │ 100  │ 3% (3) │ 3   │ 3% ✅   │ Ok   │           │
│                                                                   │
│ [Recomendações]                                                  │
│ • Priorizar PcD nas próximas contratações em TI                 │
│ • Considerar vagas adaptadas para mobilidade reduzida            │
│ • Revisar acessibilidade dos postos de trabalho                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Ao alterar **Período Inicial/Final ou Centro**, dados atualizam automaticamente
- ❌ Removido botão "Gerar Relatório" (dados dinâmicos)
- ✅ Percentuais e gráficos atualizam em tempo real
- ✅ Recomendações baseadas em análise de dados

---

## 6️⃣ COMPONENTE: RASTREABILIDADE (Transversal)

### 6.1 Timeline de Alterações

Acessível de qualquer módulo via botão [📋 Histórico] ou [⏱️ Timeline]

```
┌──────────────────────────────────────────────────────────────────┐
│ HISTÓRICO DE ALTERAÇÕES - POSTO DE TRABALHO: Service Desk       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 08/12/2025 - 14:30 - Maria Silva (RH Manager) - ALTERAÇÃO      │
│ ├─ Ação: Alterou Vagas Previstas (5 → 4)                        │
│ ├─ Motivo: Desligamento de Analista Pleno - Substituição        │
│ ├─ Antes: 5 vagas, Efetivas: 4, Reservas: 1                     │
│ ├─ Depois: 4 vagas, Efetivas: 4, Reservas: 0                    │
│ ├─ Aprovador: João Santos (Gerente)                             │
│ └─ [Desfazer] [Mais Detalhes]                                    │
│                                                                   │
│ 03/12/2025 - 09:15 - RH (Sistema) - NORMALIZAÇÃO               │
│ ├─ Ação: Normalização Quadro Efetivo                            │
│ ├─ Período: 01/12/2025 - 31/11/2025                             │
│ ├─ Efetivas Antes: 5, Efetivas Depois: 4                        │
│ ├─ Motivo: Desligamento de Carlos Mendes (07/12)                │
│ └─ [Detalhes da Normalização]                                    │
│                                                                   │
│ 01/12/2025 - 11:00 - João Santos (Gerente) - ADMISSÃO           │
│ ├─ Ação: Colaborador admitido                                   │
│ ├─ Colaborador: Ana Beatriz (Dev Junior)                        │
│ ├─ Cargo Previsto: Dev Full Stack (DISCREPÂNCIA ⚠️)            │
│ ├─ Cargo Real: Dev Junior                                       │
│ ├─ Motivo: Contratação com cargo reduzido                       │
│ └─ [Detalhes do Colaborador]                                     │
│                                                                   │
│ 25/11/2025 - 16:45 - Sistema - PROPOSTA EFETIVADA              │
│ ├─ Ação: Proposta #123 aplicada ao Quadro                      │
│ ├─ Proposta: +1 Dev Pleno (Inclusão)                            │
│ ├─ Vagas Antes: 7 → Depois: 8                                   │
│ ├─ Aprovada por: Diretor, Gerente, RH                           │
│ └─ [Ver Proposta #123]                                           │
│                                                                   │
│ [🔍 Filtros] [📤 Exportar Timeline] [🔄 Atualizar]             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Rastreabilidade Detalhada

Cada entrada na timeline contém:
- **QUEM:** Nome, Role, Email
- **QUANDO:** Data, Hora (formato ISO 8601)
- **MOTIVO:** Texto livre (obrigatório em edições)
- **AÇÃO:** Tipo (Criação, Edição, Normalização, Admissão, etc)
- **ANTES/DEPOIS:** Valores comparativos
- **APROVADOR:** Se houver
- **LINKS:** Para colaborador, proposta, normalização associada

---

## 📌 NAVEGAÇÃO ENTRE MÓDULOS

```
Dashboard
├─→ Click em Card → Detalhe Analítico (Analytics)
├─→ Click em "Alertas Críticos" → Quadro de Lotação
├─→ Click em "Previsão IA" → Analytics Previsão
└─→ Click em "Atividade Recente" → Histórico/Rastreabilidade

Quadro de Lotação
├─→ [Novo Cargo] → Modal Criação
├─→ [Detalhes] → Modal com Histórico (Timeline)
├─→ Edição → Gera Proposta (se requer aprovação)
└─→ [Histórico] → Timeline Completa

Propostas
├─→ [Novo Proposta] → Gestão
├─→ [Efetivar] → Workflow de Aprovação
└─→ Efetivação → Atualiza Quadro de Lotação + Timeline

Analytics
├─→ [Consultar] → Exibe Tabela de Resultados
├─→ [Exportar] → Menu de Formato
└─→ [Gráficos] → Drill-down para Detalhes
```

---

**Próximo:** PARTE 4 - Fluxos Detalhados e Regras de Negócio Específicas

