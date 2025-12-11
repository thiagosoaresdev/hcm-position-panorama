# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 4: FLUXOS DETALHADOS E REGRAS DE NEGÓCIO

---

## 📊 FLUXO 1: CICLO DE VIDA COMPLETO DE UMA VAGA

```
┌─────────────────────────────────────────────────────────────┐
│ [START] CRIAÇÃO DE VAGA                                     │
│ Cenário: Empresa precisa de mais 1 Dev Pleno em TI         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 1: PLANEJAMENTO                                       │
│                                                              │
│ • Gerente acessa "Quadro de Lotação" → "Manutenção"        │
│ • Clica [+ Novo Cargo]                                      │
│ • Preenche:                                                 │
│   - Centro: TI                                              │
│   - Posto: Dev Full Stack                                   │
│   - Cargo: Dev Pleno                                        │
│   - Vagas Previstas: 8 → 9 (aumento de 1)                  │
│   - Motivo: "Crescimento projeto X"                        │
│                                                              │
│ ✅ RESULTADO: Vaga criada em STATUS "RASCUNHO"            │
│ 📝 AUDITORIA: "Maria Silva criou vaga" (08/12 14:30)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 2: FLUXO DE APROVAÇÃO (Proposta)                     │
│                                                              │
│ • Maria clica [Enviar para Aprovação]                       │
│ • Sistema cria PROPOSTA associada                           │
│ • Proposta entra em workflow:                               │
│                                                              │
│   ┌─→ Nível 1: Coordenador TI (Carlos)                     │
│   │   ├─ Recebe notificação email/in-app                    │
│   │   ├─ Analisa e aprova (comentário: "Ok, orçamento ok") │
│   │   ↓                                                      │
│   └─→ Nível 2: Gerente TI (João)                           │
│       ├─ Recebe notificação                                 │
│       ├─ Aprova (comentário: "Dentro do planejamento")     │
│       ↓                                                      │
│   ┌─→ Nível 3: Diretor (Silva)                             │
│   │   ├─ Recebe notificação                                 │
│   │   ├─ Aprova (comentário: "Estratégico para 2025")     │
│   │   ↓                                                      │
│   └─→ RH (Efetivação)                                       │
│       ├─ Recebe notificação                                 │
│       ├─ Valida orçamento                                   │
│       ├─ Clica [✅ EFETIVADA]                              │
│       ↓                                                      │
│ ✅ PROPOSTA APROVADA                                        │
│ 📝 AUDITORIA: Registra cada aprovação com data/hora/pessoa │
│                                                              │
│ 📧 NOTIFICAÇÕES:                                            │
│ • N1 Aprovado → Notifica Nível 2                            │
│ • N2 Aprovado → Notifica Nível 3                            │
│ • N3 Aprovado → Notifica RH                                 │
│ • RH Efetivou → Notifica todos (Maria, Carlos, João, Silva)│
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 3: APLICAÇÃO NO QUADRO                               │
│                                                              │
│ • Sistema atualiza "Quadro de Lotação":                     │
│   - Vagas Previstas: 8 → 9                                  │
│   - Status: "Ativo"                                         │
│                                                              │
│ • Cria registro em "Histórico de Alterações":              │
│   - Ação: "Proposta #XXX Efetivada"                         │
│   - QUEM: RH                                                │
│   - QUANDO: 08/12/2025 15:45                                │
│   - ANTES: 8 vagas                                          │
│   - DEPOIS: 9 vagas                                         │
│   - MOTIVO: "Crescimento projeto X"                        │
│   - APROVADORES: Carlos, João, Silva, RH                   │
│                                                              │
│ ✅ QUADRO ATUALIZADO                                        │
│ 📝 RASTREABILIDADE COMPLETA                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 4: RECRUTAMENTO (Reserva)                            │
│                                                              │
│ • RH registra vaga em "Reservas"                            │
│   - Status: "Aberto"                                        │
│   - Data Abertura: 08/12/2025                               │
│   - Data Previsão: 20/01/2026                               │
│                                                              │
│ • Processo seletivo em andamento:                           │
│   - 45 candidatos recebem convite                           │
│   - 12 avançam para triagem                                 │
│   - 3 entram em entrevista final                            │
│                                                              │
│ • Status atualiza conforme progresso:                       │
│   - "Aberto" → "Em Triagem" → "Entrevista" → "Oferta"      │
│                                                              │
│ ✅ VAGA EM RESERVA                                          │
│ 📊 IMPACTO: Aumenta "Vagas Reservadas" no Quadro           │
│    (Quadro fica: 9 previstas, X efetivas, 1 reservada)     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 5: ADMISSÃO (Normalização Automática)                │
│                                                              │
│ • Candidato vencedor aceita oferta                          │
│ • RH processa admissão do colaborador:                      │
│   - Nome: Ana Beatriz                                       │
│   - Cargo Real: Dev Junior (DIFERENTE! Dev Pleno previsto)│
│   - Centro: TI                                              │
│   - Data Admissão: 15/01/2026                               │
│                                                              │
│ • Sistema detecta DISCREPÂNCIA:                             │
│   - Cargo Previsto: Dev Pleno                               │
│   - Cargo Real: Dev Junior                                  │
│   - Ação Configurada: "ALERTAR" (conforme RN-002)          │
│   - Log: "⚠️ Discrepância detectada. Permitido."           │
│                                                              │
│ • ⚡ NORMALIZAÇÃO AUTOMÁTICA (RN-001):                     │
│   - Quadro Efetivo atualiza em TEMPO REAL                   │
│   - Antes: 7 efetivas em Dev Pleno                          │
│   - Depois: 8 efetivas em Dev Junior (+ novo cargo)        │
│   - Vagas Reservadas: 1 → 0 (seletivo fechado)             │
│                                                              │
│ ✅ COLABORADOR ADMITIDO                                     │
│ 📝 AUDITORIA: "Ana Beatriz admitida - 15/01/2026"          │
│ 📊 IMPACTO QUADRO:                                          │
│    - Vagas Previstas: 9 (inalterado)                        │
│    - Vagas Efetivas: 8 (+1)                                 │
│    - Vagas Reservadas: 0 (-1)                               │
│    - Taxa Ocupação: 88%                                     │
│                                                              │
│ 📋 HISTÓRICO:                                               │
│    Ação: "Admissão"                                         │
│    QUEM: RH                                                 │
│    QUANDO: 15/01/2026 10:30                                 │
│    MOTIVO: "Seletivo finalizado"                            │
│    ANTES: 7 dev, 0 admin, 1 reserva                         │
│    DEPOIS: 7 dev pleno + 1 dev junior, 0 reserva           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 6: NORMALIZAÇÃO PERIÓDICA                            │
│                                                              │
│ • Fim de mês (31/01/2026): RH executa normalização         │
│ • Vai para "Normalização" → "Quadro Efetivo"               │
│ • Configura período: 01/01/2026 - 31/01/2026               │
│ • Clica [Processar Normalização]                            │
│                                                              │
│ • Sistema processa:                                         │
│   - Busca todos os postos no Plano 2025                     │
│   - Para cada posto, busca movimentações do período         │
│   - Agrega colaboradores por (Centro, Cargo, Turno)        │
│   - Atualiza tabela "Quadro Efetivo"                        │
│                                                              │
│ • Resultado:                                                │
│   ✅ 87 postos processados                                  │
│   📊 234 alterações registradas                             │
│   📝 Logs de auditoria gerados                              │
│                                                              │
│ • Sistema criou entrada no "Histórico de Normalização":    │
│   - Data: 31/01/2026 23:55                                  │
│   - Tipo: "Efetivo"                                         │
│   - Período: 01-31/01/2026                                  │
│   - Postos: 87                                              │
│   - Status: ✅ Sucesso                                      │
│                                                              │
│ ✅ QUADRO SINCRONIZADO                                     │
│ 📊 Dashboard atualizado em tempo real                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ [END] VAGA OCUPADA E REGISTRADA                            │
│                                                              │
│ ESTADO FINAL DO QUADRO - SERIA DESK - DEV PLENO:          │
│ • Vagas Previstas: 9                                        │
│ • Vagas Efetivas: 8 (7 Dev Pleno + 1 Dev Junior)           │
│ • Vagas Reservadas: 0                                       │
│ • Taxa Ocupação: 88%                                        │
│ • Últimas Alterações: 08/12/2025 (Criação) → 15/01/2026... │
│                                                              │
│ 📋 RASTREABILIDADE COMPLETA:                               │
│ ✅ Criação (Proposta)                                      │
│ ✅ Aprovações em 3 níveis + RH                             │
│ ✅ Efetivação no Quadro                                    │
│ ✅ Alocação em Reserva                                     │
│ ✅ Admissão com Discrepância registrada                    │
│ ✅ Normalização periódica                                  │
│ ✅ Todos os movimentos auditados                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 FLUXO 2: NORMALIZAÇÃO AUTOMÁTICA EM TEMPO REAL

### Cenário: Colaborador Desligado

```
[COLABORADOR DESLIGADO]
Data: 07/12/2025 17:00
Colaborador: Carlos Mendes
Cargo: Dev Pleno (Dev Full Stack)
Centro: TI
└──────────────────────────────────────┐
                                       ↓
            ⚡ SISTEMA DETECTA EVENTO
            (via integração RH Legado)
                     ↓
    ┌─────────────────────────────────┐
    │ BUSCA REGISTROS AFETADOS        │
    │ • Qual Centro? TI               │
    │ • Qual Cargo? Dev Pleno         │
    │ • Qual Turno? 1º turno          │
    │ • Qual Posto? Dev Full Stack    │
    └─────────────────────────────────┘
                     ↓
    ┌─────────────────────────────────┐
    │ ATUALIZA QUADRO EFETIVO         │
    │ ANTES: 7 Dev Pleno              │
    │ DEPOIS: 6 Dev Pleno             │
    │ VAGAS ABERTAS: +1               │
    └─────────────────────────────────┘
                     ↓
    ┌─────────────────────────────────┐
    │ CRIA ENTRADA AUDITORIA          │
    │ • QUEM: Sistema RH (integração) │
    │ • QUANDO: 07/12 17:00           │
    │ • AÇÃO: Desligamento            │
    │ • MOTIVO: Integração automática │
    │ • ANTES/DEPOIS: 7 → 6           │
    │ • COLABORADOR: Carlos Mendes    │
    └─────────────────────────────────┘
                     ↓
    ┌─────────────────────────────────┐
    │ ATUALIZA DASHBOARD              │
    │ • Taxa Ocupação: 92% (↓ 1%)     │
    │ • Vagas Abertas: 13 (↑ 1)       │
    │ • Alert: "Vaga aberta em DEV"   │
    └─────────────────────────────────┘
                     ↓
    ┌─────────────────────────────────┐
    │ NOTIFICAÇÕES                    │
    │ 📧 RH: "Dev desligado"          │
    │ 📧 Gerente TI: "1 vaga aberta"  │
    │ 🔴 Alert: Ocupação caiu 1%      │
    └─────────────────────────────────┘
                     ↓
         ✅ QUADRO EFETIVO SINCRONIZADO
         (Tempo real, sem intervenção manual)
```

---

## 🔄 FLUXO 3: ALTERAÇÃO COM DISCREPÂNCIA DE CARGO

### Cenário: Cargo Previsto ≠ Cargo Real

```
CONFIGURAÇÃO DO SISTEMA (RN-002):
Modo: BLOQUEAR (Impede admissão se cargo diferente)

┌─────────────────────────────────────────────────────────────┐
│ [START] ADMISSÃO COM DISCREPÂNCIA                           │
│                                                              │
│ Vaga Prevista: "Dev Full Stack" (Cargo Pleno)              │
│ Candidato Selecionado: Ana Beatriz                          │
│ Cargo Real da Contratação: Dev Junior (DIFERENTE!)         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SISTEMA VALIDA NA ADMISSÃO                                 │
│                                                              │
│ • RH tenta processar admissão                               │
│ • Sistema compara: Cargo Previsto vs Cargo Real             │
│ • RESULTADO: ❌ BLOQUEADO                                  │
│   Mensagem: "Cargo real (Dev Junior) ≠ Vaga prevista      │
│    (Dev Pleno). Modo: BLOQUEAR. Solicite aprovação."       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ RH CRIA PROPOSTA DE ALTERAÇÃO                              │
│                                                              │
│ • Clica [Criar Exceção] ou [Nova Proposta]                 │
│ • Tipo: "Alteração de Cargo"                                │
│ • Descrição: "Dev Junior em lugar de Dev Pleno"             │
│ • Justificativa: "Mercado competitivo, aceitar Junior"      │
│ • Cargo Novo: Dev Junior                                    │
│ • Vagas: 1 (manter)                                         │
│                                                              │
│ • Envia para aprovação (3 níveis + RH)                     │
│ • Aprovadores recebem notificação com contexto              │
│   "⚠️ Alteração: Dev Pleno → Dev Junior"                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW DE APROVAÇÃO (Similar ao Fluxo 1)                │
│                                                              │
│ N1 → N2 → N3 → RH                                           │
│ Cada um aprova/rejeita com comentário                       │
│                                                              │
│ RESULTADO: ✅ APROVADA                                      │
│ "Permitido contratar como Dev Junior neste ciclo"          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ QUADRO ATUALIZADO + ADMISSÃO PROSSEGUE                     │
│                                                              │
│ • Proposta efetivada                                        │
│ • Quadro de Lotação atualizado:                             │
│   - Dev Pleno: 8 → 7                                        │
│   - Dev Junior: 0 → 1 (novo cargo)                          │
│                                                              │
│ • RH retorna e processa admissão de Ana:                   │
│   - ✅ Sistema valida novamente                             │
│   - "Dev Junior agora está previsto, OK!"                   │
│   - Ana é admitida em "Dev Junior"                          │
│                                                              │
│ • Quadro Efetivo atualiza:                                  │
│   - Dev Junior Efetivas: +1 Ana                             │
│   - Taxa Ocupação recalculada                               │
│                                                              │
│ ✅ ADMISSÃO CONCLUÍDA COM RASTREABILIDADE                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 FLUXO 4: CÁLCULO AUTOMÁTICO PcD (Lei 8.213)

### Cenário: Empresa com 250 colaboradores

```
CONFIGURAÇÃO LEI 8.213:
Empresa: Senior Systems LTDA
Total Colaboradores: 250
Faixa: 201-500 → Obrigatório 3% PcD

CÁLCULO:
250 × 3% = 7.5 → Arredondar para 8 colaboradores PcD

MONITORAMENTO CONTÍNUO:

┌────────────────────────────────────┐
│ PcD ATUAIS: 6                       │
│ PcD OBRIGATÓRIO: 8                 │
│ STATUS: ❌ ABAIXO DA META (Faltam 2)
│                                    │
│ Taxa de Conformidade: 75%          │
│ Regulação: ⚠️ Crítica              │
│                                    │
│ [Planejar Contratação PcD]         │
│ [Gerar Relatório Conformidade]     │
└────────────────────────────────────┘

AÇÃO DO SISTEMA:

1. Dashboard exibe Alert em PcD
   "⚠️ 2 vagas PcD faltando para conformidade"

2. Analytics → PcD mostra:
   • Gráfico de Conformidade (75% vs 100%)
   • Centro com déficit
   • Recomendações de ação

3. Ao criar Nova Proposta:
   • Sistema sugere "Priorize PcD nesta contratação"
   • Flag: Marcar se vaga é PcD

4. Ao admitir Colaborador com Deficiência:
   • Sistema marca checkbox "PcD"
   • Atualiza contadores automaticamente
   • Recalcula % de conformidade

5. Normalização Periódica:
   • Recalcula PcD por centro/empresa
   • Atualiza meta conforme crescimento

EXEMPLO - APÓS CONTRATAR 2 PcD:

┌────────────────────────────────────┐
│ PcD ATUAIS: 8                       │
│ PcD OBRIGATÓRIO: 8                 │
│ STATUS: ✅ EM CONFORMIDADE         │
│                                    │
│ Taxa de Conformidade: 100%         │
│ Regulação: ✅ OK                   │
│                                    │
│ [Documento Conformidade Gerado]    │
└────────────────────────────────────┘
```

---

## 📋 REGRAS DE NEGÓCIO - DETALHADAS

### RN-001: Normalização Automática ✅
- **Gatilho:** Evento de admissão/transferência/desligamento
- **Processamento:** Tempo real (< 2 segundos)
- **Atualização:** Quadro Efetivo sincronizado
- **Auditoria:** QUEM, QUANDO, ANTES, DEPOIS registrados
- **Exceções:** Nenhuma (automático sempre)

### RN-002: Cargo vs Cargo da Vaga ✅
- **Definição:** Cargo Previsto pode ser diferente do Cargo Real
- **Detecção:** Validação na admissão
- **Ações Configuráveis:**
  - **ALERTAR:** Log de discrepância, mas permite
  - **PERMITIR:** Sem restrição
  - **BLOQUEAR:** Impede admissão, exige aprovação
  - **EXIGIR APROVAÇÃO:** Workflow adicional de 3 níveis
- **Rastreabilidade:** Todos os casos registrados na timeline

### RN-003: Controle PcD ✅
- **Integração:** Flag no quadro, contadores globais
- **Cálculo Automático:** Baseado em Lei 8.213
- **Ranges:**
  - 50-200: 2%
  - 201-500: 3%
  - 501-1000: 4%
  - > 1000: 5%
- **Arredondamento:** Sempre para cima (ex: 7.5 → 8)
- **Alertas:** Dashboard exibe status de conformidade
- **Atualização:** Periódica (normalização) + real-time (admissão)

### RN-004: Rastreabilidade Completa ✅
- **Registra:**
  - **QUEM:** Usuário (login), Sistema (integração), ou Automático
  - **QUANDO:** Data ISO 8601 + Hora (HH:MM:SS)
  - **MOTIVO:** Campo texto (obrigatório em alterações)
  - **APROVADOR:** Se houver workflow
  - **ANTES/DEPOIS:** Valores comparativos
  - **LINKS:** Proposta, Normalização, Colaborador associado
- **Permanência:** Histórico nunca apagado (apenas soft delete)
- **Filtros:** Por Tipo, Período, Usuário, Ação

### RN-005: Workflow Configurável ✅
- **Estrutura:** 3 níveis padrão (Coordenação, Gerente, Diretor) + RH
- **Flexibilidade:** Configurável por Empresa/Área
- **Exemplo 1 - Grande Empresa:**
  - Nível 1: Coordenador
  - Nível 2: Gerente
  - Nível 3: Diretor
  - RH: Efetivação
- **Exemplo 2 - Pequena Filial:**
  - Nível 1: Gerente (direto)
  - RH: Efetivação
- **Rejeição:** Retorna a "Rascunho" (solicitante edita)
- **Notificação:** Automática em cada transição

### RN-006: Múltiplos Planos (Não Simultâneos) ✅
- **Vigência:** Apenas 1 plano ATIVO por período
- **Exemplo:** 
  - Plano 2025: 01/01/2025 - 31/12/2025 (ATIVO)
  - Plano 2026: 01/01/2026 - 31/12/2026 (Planejado)
- **Histórico:** Planos anteriores mantidos para auditoria
- **Normalização:** Vinculada a 1 plano específico
- **Quadro:** Cada plano tem seu quadro previsto independente

### RN-007: Normalização Quadro Previsto ✅
- **Tipos:**
  1. **Efetivo para Previsto:** Converte estado real em planejado
  2. **Previsto para Previsto:** Replica quadro entre períodos
- **Processamento:** Pode ser assíncrono (background job)
- **Resultados:** Logs de sucesso/erro, resumo de alterações
- **Replicação:** Opção de copiar observações

### RN-008: Normalização Quadro Efetivo ✅
- **Melhoria Aplicada:** Processa TODOS os postos dentro do período
- **Independência:** NÃO filtra por "Data Início Controle Posto"
- **Exclusão:** Apaga registros efetivos do período ANTES de processar
- **Processamento:** Considera todas as movimentações do período
- **Cálculo:** Agrega por (Centro, Cargo, Turno)
- **Movimentações Posteriores:** Excluídas do cálculo se "Data Fim" informada

### RN-009: Definições por Usuário ✅
- **Escopo:** Exceções de permissionamento
- **Ignoram:** Configurações globais de Empresas/Empresas
- **Campos:**
  - Ver Quadro Admissão: [Verificar+Permitir / Verificar+Bloquear / Não Verificar]
  - Ver Quadro Transferências: [Idem]
- **Uso:** Executivos, CFOs que precisam exceção

### RN-010: Controle de Vagas ✅
- **Tipos de Controle:**
  - **Diário:** Cada dia recalcula
  - **Por Competência:** Mensal (período fiscal)
- **Aplicação:** Por Posto de Trabalho
- **Sincronização:** Normalização respeita este tipo

---

## 🔐 VALIDAÇÕES DE NEGÓCIO

### Validação V1: Duplicação de Cargo por Posto
```
Cenário: Tenta criar 2 Dev Pleno no mesmo Posto de Trabalho
Validação: ❌ BLOQUEADA
Mensagem: "Já existe Dev Pleno cadastrado em Dev Full Stack.
           Edite o existente para aumentar vagas ou remova."
```

### Validação V2: Quadro Negativo
```
Cenário: Tenta reduzir vagas para número < colaboradores atuais
Exemplo: 5 vagas, 4 colaboradores, tenta reduzir para 3
Validação: ⚠️ AVISO + CONFIRMAÇÃO
Mensagem: "Isto criaria um déficit de 1 vaga.
           Tem certeza? Procedera?"
```

### Validação V3: Cargo não Cadastrado
```
Cenário: Tenta criar cargo que não existe no banco
Validação: ❌ BLOQUEADA (em modo restritivo)
           ⚠️ AVISO (em modo permissivo)
Mensagem: "Cargo 'Dev Ninja' não encontrado no cadastro.
           Crie o cargo antes ou selecione existente."
```

### Validação V4: Centro de Custo Inativo
```
Cenário: Tenta atribuir vaga a centro de custo inativo
Validação: ⚠️ AVISO
Mensagem: "Centro 'TI-Legacy' está inativo desde 30/11/2025.
           Ativar antes de prosseguir?"
```

### Validação V5: Período de Normalização Inválido
```
Cenário: Data Fim < Data Início
Validação: ❌ BLOQUEADA
Mensagem: "Data Fim deve ser posterior a Data Início.
           Verifique as datas informadas."
```

---

## 🔔 EVENTOS E NOTIFICAÇÕES

### Evento E1: Proposta Criada
```
Destinatário: Aprovador Nível 1
Canal: Email + In-app
Conteúdo: "Nova proposta #XXX aguardando sua aprovação.
          Tipo: Inclusão | Vaga: Dev Pleno
          Solicitante: Maria Silva | Centro: TI
          [Revisar Proposta]"
Ação no Sistema: Notificação marcada como "Pendente"
```

### Evento E2: Proposta Aprovada
```
Destinatário: Próximo Aprovador (ou RH se último nível)
Canal: Email + In-app
Conteúdo: "Proposta #XXX aprovada no Nível N.
          Próximo: Nível N+1 ou Efetivação RH
          Aprovador: João Santos
          [Revisar]"
Ação no Sistema: Status muda para "Nível X"
```

### Evento E3: Proposta Rejeitada
```
Destinatário: Solicitante Original
Canal: Email + In-app (🔴 Alerta)
Conteúdo: "Sua proposta #XXX foi rejeitada no Nível N.
          Motivo: 'Orçamento insuficiente'
          Rejeitador: Carlos Silva | Data: 08/12 14:30
          [Editar Proposta] [Ver Detalhes]"
Ação no Sistema: Status retorna "Rascunho"
```

### Evento E4: Proposta Efetivada
```
Destinatário: Todos (Solicitante, Aprovadores, RH)
Canal: Email + In-app (✅ Sucesso)
Conteúdo: "Proposta #XXX efetivada com sucesso!
          Quadro de Lotação atualizado.
          Alteração: +1 Dev Pleno em TI
          Data: 08/12 16:00 | Responsável: RH
          [Ver Quadro Atualizado]"
Ação no Sistema: Quadro sincronizado, timeline atualizada
```

### Evento E5: Normalização Completada
```
Destinatário: RH, Supervisores
Canal: Email + In-app
Conteúdo: "Normalização de Quadro Efetivo concluída.
          Período: 01/12 - 31/12/2025
          Postos Processados: 87
          Alterações: 145
          Status: ✅ Sucesso
          [Visualizar Relatório]"
Ação no Sistema: Entrada no Histórico, Dashboard atualizado
```

### Evento E6: Alert PcD
```
Destinatário: RH, Diretor
Canal: In-app + Email Diária
Conteúdo: "⚠️ Alerta de Conformidade PcD
          Empresa: Senior Systems
          Status: ABAIXO DA META
          Atual: 6/8 (75%)
          Faltam: 2 vagas PcD
          Lei 8.213/91: 3% para 250 colaboradores
          [Planejar Contratação]"
Ação no Sistema: Badge no Dashboard, filtro em Propostas
```

---

## 📊 CASOS DE USO (USE CASES)

### UC1: RH Cria Nova Vaga com Aprovação
**Ator:** RH Manager
**Precondição:** RH logado, permissão para criar vagas
**Passos:**
1. Acessa "Quadro de Lotação" → "Manutenção"
2. Clica [+ Novo Cargo]
3. Preenche: Centro, Posto, Cargo, Vagas (+1)
4. Clica [Salvar]
5. Sistema valida e cria rascunho
6. RH clica [Enviar para Aprovação]
7. Entra em workflow 3 níveis + RH
8. Cada nível aprova (ou rejeita)
9. RH final clica [✅ Efetivada]
10. Quadro atualiza, timeline registra, notificações enviadas
**Resultado:** ✅ Vaga criada e rastreada

### UC2: Admissão com Cargo Diferente
**Ator:** RH Operacional
**Precondição:** Vaga existe em quadro, candidato selecionado
**Passos:**
1. Tenta processar admissão no RH Legado
2. Sistema recebe evento (integração)
3. Valida: Cargo Real ≠ Cargo Previsto
4. Ação configurada: BLOQUEAR
5. Sistema retorna erro "Cargo diferente"
6. RH cria Proposta de Alteração
7. Workflow aprova cargo novo
8. RH retoma admissão
9. Sistema agora permite, quadro atualiza
**Resultado:** ✅ Admissão autorizada com rastreabilidade

### UC3: Verificar Conformidade PcD
**Ator:** Gerente RH
**Precondição:** Sistema com dados de PcD alimentados
**Passos:**
1. Acessa "Analytics" → "PcD"
2. Seleciona Período: 01/12 - 31/12/2025
3. Seleciona Centro: Todos
4. Sistema calcula automático:
   - Total: 250 colaboradores
   - Meta 3%: 8 PcD obrigatórios
   - Atuais: 6
   - Status: 75% ⚠️
5. Gerente visualiza gráfico de conformidade
6. Clica [Recomendações]
7. Sistema sugere: "Priorizar PcD nas próximas contratações"
8. Gerente exporta relatório para diretoria
**Resultado:** ✅ Conformidade identificada e documentada

### UC4: Normalização Quadro Efetivo
**Ator:** Analista RH
**Precondição:** Fim de mês, período definido
**Passos:**
1. Acessa "Normalização" → "Quadro Efetivo"
2. Seleciona Período Inicial: 01/01/2026
3. Seleciona Período Final: 31/01/2026
4. Seleciona Plano: "Plano 2025"
5. Clica [Processar Normalização]
6. Sistema exibe confirmação com aviso:
   "Apagará registros do período. Prosseguir?"
7. Analista confirma [SIM]
8. Sistema processa (background):
   - Busca todos os 87 postos do plano
   - Para cada um, busca movimentações do período
   - Agrega por (Centro, Cargo, Turno)
   - Atualiza quadro efetivo
9. Resultado exibido: "87 postos normalizados, 234 alterações"
10. Entra no histórico e notificações enviadas
**Resultado:** ✅ Quadro sincronizado e auditado

---

**Próximo:** PARTE 5 - Integração com APIs e Especificações Técnicas

