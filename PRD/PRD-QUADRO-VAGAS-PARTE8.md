# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 8: ADEQUAÇÃO À LGPD (LEI GERAL DE PROTEÇÃO DE DADOS)

---

## 📋 INFORMAÇÕES DO DOCUMENTO
- **Data:** 15 de Dezembro de 2025
- **Versão:** 1.0
- **Status:** Especificação LGPD
- **Base Legal:** Lei nº 13.709/2018 (LGPD)
- **Normas Relacionadas:** ISO 27001, ISO 27701
- **Público:** DPO, Desenvolvedores, Segurança da Informação, Compliance

---

## 🎯 OBJETIVO

Garantir que o **Sistema de Gestão de Quadro de Lotação** esteja em total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018), assegurando a privacidade, segurança e direitos dos titulares de dados pessoais processados pelo sistema.

---

## 📊 DADOS PESSOAIS TRATADOS

### 1. Categorização dos Dados

#### Dados Pessoais (Art. 5º, I LGPD)
- **Colaboradores:**
  - Nome completo
  - CPF
  - Matrícula funcional
  - E-mail corporativo
  - Telefone corporativo
  - Cargo/função
  - Unidade/área de lotação
  - Data de admissão
  - Data de desligamento
  - Salário/faixa salarial
  
- **Usuários do Sistema:**
  - Nome completo
  - CPF
  - E-mail
  - Login/usuário
  - Perfil de acesso
  - Logs de atividade

#### Dados Pessoais Sensíveis (Art. 5º, II LGPD)
- **Informações PcD (Pessoa com Deficiência):**
  - Indicador de deficiência (sim/não)
  - Tipo de deficiência (física, auditiva, visual, intelectual, múltipla)
  - CID (Classificação Internacional de Doenças) - quando aplicável
  - Data de validade do laudo médico
  - Status de habilitação/reabilitação

⚠️ **ATENÇÃO ESPECIAL:** Dados de saúde são considerados sensíveis e requerem tratamento especial conforme Art. 11 da LGPD.

---

## ⚖️ BASE LEGAL PARA TRATAMENTO (Art. 7º e 11º LGPD)

### Dados Pessoais Comuns

| Dado | Base Legal | Artigo LGPD | Justificativa |
|------|------------|-------------|---------------|
| Colaboradores (nome, CPF, cargo) | Execução de Contrato | Art. 7º, V | Gestão de recursos humanos |
| Salário/faixa salarial | Cumprimento de obrigação legal | Art. 7º, II | CLT, tributação |
| Logs de acesso | Legítimo interesse | Art. 7º, IX | Segurança da informação, auditoria |
| E-mail corporativo | Execução de contrato | Art. 7º, V | Comunicação funcional |

### Dados Pessoais Sensíveis (PcD)

| Dado | Base Legal | Artigo LGPD | Justificativa |
|------|------------|-------------|---------------|
| Indicador PcD | Cumprimento de obrigação legal | Art. 11, II, a | Lei 8.213/91 (cota PcD) |
| Tipo de deficiência | Cumprimento de obrigação legal | Art. 11, II, a | Fiscalização MTE |
| CID/Laudo médico | Tutela da saúde (procedimento RH) | Art. 11, II, f | Verificação elegibilidade cota |

---

## 🔐 PRINCÍPIOS DA LGPD APLICADOS

### 1. Finalidade (Art. 6º, I)
**Implementação:**
- ✅ Dados coletados exclusivamente para gestão de quadro de lotação e conformidade legal
- ✅ Declaração de finalidade no termo de uso do sistema
- ✅ Proibição de uso para finalidades incompatíveis

**Exemplo Conceitual:**
```
// Metadata de finalidade (implementar conforme stack escolhido)
Estruturas de Dados:
  DataPurpose {
    category: 'gestao_rh' | 'conformidade_legal' | 'auditoria'
    description: String
    legalBasis: LGPDBasis
    retentionPeriod: Integer  // em dias
  }
```

### 2. Adequação (Art. 6º, II)
**Implementação:**
- ✅ Tratamento compatível com as finalidades informadas
- ✅ Revisão periódica de adequação pelo DPO

### 3. Necessidade (Art. 6º, III)
**Implementação:**
- ✅ Coleta limitada ao mínimo necessário
- ✅ Campo "CID" opcional (coletar apenas se exigido por auditor)
- ✅ Dados de localização geográfica NÃO coletados (não necessários)

### 4. Livre Acesso (Art. 6º, IV)
**Implementação:**
- ✅ Portal do Titular (self-service) para consulta de dados
- ✅ Exportação de dados em formato estruturado (JSON/CSV)
- ✅ Resposta em até 15 dias (Art. 18, §3º)

### 5. Qualidade dos Dados (Art. 6º, V)
**Implementação:**
- ✅ Validação de CPF em tempo real
- ✅ Atualização automática via integração com RH Legado
- ✅ Indicador de "última atualização" em todos os registros

### 6. Transparência (Art. 6º, VI)
**Implementação:**
- ✅ Avisos de privacidade claros em todas as telas
- ✅ Política de Privacidade acessível (link no rodapé)
- ✅ Relatório de Impacto à Proteção de Dados (RIPD) disponível

### 7. Segurança (Art. 6º, VII)
**Implementação:**
- ✅ Criptografia TLS 1.3 em trânsito
- ✅ Criptografia AES-256 em repouso (dados sensíveis)
- ✅ Pseudonimização de CPF em logs
- ✅ Controle de acesso baseado em função (RBAC)

### 8. Prevenção (Art. 6º, VIII)
**Implementação:**
- ✅ Privacy by Design em toda arquitetura
- ✅ Data Loss Prevention (DLP) ativo
- ✅ Monitoramento de acessos anômalos

### 9. Não Discriminação (Art. 6º, IX)
**Implementação:**
- ✅ Dados de PcD utilizados APENAS para cota legal
- ✅ Proibição de uso para discriminação em promoções/benefícios
- ✅ Auditoria de decisões automatizadas

### 10. Responsabilização e Prestação de Contas (Art. 6º, X)
**Implementação:**
- ✅ RIPD (Relatório de Impacto) documentado
- ✅ Registro de Operações de Tratamento (ROPA)
- ✅ Auditorias trimestrais de conformidade

---

## 👤 DIREITOS DOS TITULARES (Art. 18 LGPD)

### Portal do Titular - Funcionalidades

#### 1. Confirmação de Tratamento (Art. 18, I)
```
📌 Funcionalidade: "Meus Dados"
- Exibe: "Sim, o sistema processa seus dados pessoais"
- Lista: categorias de dados coletados
- Mostra: finalidades de cada categoria
```

#### 2. Acesso aos Dados (Art. 18, II)
```
📌 Funcionalidade: "Visualizar Dados"
- Tela com todos os dados pessoais do titular
- Inclui: dados de RH + logs de acesso (últimos 90 dias)
- Botão: "Exportar Dados" (JSON/CSV)
```

#### 3. Correção (Art. 18, III)
```
📌 Funcionalidade: "Solicitar Correção"
- Formulário: indica dado incorreto + valor correto
- Workflow: solicita aprovação do RH
- SLA: 15 dias para resposta
```

#### 4. Anonimização/Bloqueio/Eliminação (Art. 18, IV)
```
📌 Funcionalidade: "Solicitar Exclusão"
- Aviso: "Dados podem ser mantidos por obrigação legal (ex: 5 anos CLT)"
- Processos: anonimiza dados não obrigatórios
- Timeline: exibe dados ainda retidos + prazo de eliminação
```

#### 5. Portabilidade (Art. 18, V)
```
📌 Funcionalidade: "Exportar para Outro Sistema"
- Formato: JSON estruturado
- Padrão: conforme regulamentação ANPD
- Escopo: dados fornecidos pelo titular (não derivados)
```

#### 6. Informação sobre Compartilhamento (Art. 18, VII)
```
📌 Funcionalidade: "Com Quem Compartilhamos"
- Lista: entidades públicas (MTE - auditoria PcD)
- Lista: operadores (ex: cloud provider)
- Finalidade: para cada compartilhamento
```

#### 7. Revogação de Consentimento (Art. 18, IX)
```
📌 Funcionalidade: "Gerenciar Consentimentos"
- Lista: consentimentos ativos (se houver)
- Ação: revogar a qualquer momento
- Efeito: cessa processamento não obrigatório
```

#### 8. Oposição ao Tratamento (Art. 18, § 2º)
```
📌 Funcionalidade: "Contestar Tratamento"
- Formulário: motivo da oposição
- Análise: DPO avalia se base legal permite oposição
- Resposta: fundamentada em 15 dias
```

### Especificação de APIs REST

```yaml
# Endpoints para Direitos dos Titulares (Art. 18 LGPD)
# Implementar conforme stack/framework escolhido

API_BASE: /api/lgpd/titular
AUTH: Requerida (Platform Authentication)

Endpoints:

  # Art. 18, I - Confirmação de Tratamento
  GET /confirmation:
    auth: required
    response:
      hasData: boolean
      categories: array<string>  # ['identificacao', 'profissional', 'pcd']
      purposes: array<string>    # ['gestao_rh', 'conformidade_legal']

  # Art. 18, II - Acesso aos Dados
  GET /data:
    auth: required
    response: PersonalData
    actions:
      - Buscar dados do usuário autenticado
      - Registrar acesso em auditoria
      - Pseudonimizar campos sensíveis antes de retornar

  # Art. 18, III - Correção
  POST /correction-request:
    auth: required
    body:
      fieldName: string
      currentValue: string
      requestedValue: string
    response: Ticket
    actions:
      - Criar ticket de correção
      - Enviar para aprovação RH (Platform Notifications)
      - SLA: 15 dias

  # Art. 18, IV - Eliminação
  POST /deletion-request:
    auth: required
    response:
      status: 'PARTIAL_DELETION' | 'FULL_DELETION' | 'DENIED'
      deletedFields: array<string>
      retainedFields: array<{
        field: string
        reason: string
        deletionDate: date
      }>
    business_logic:
      - Verificar obrigações legais (CLT 5 anos, Fiscal 5 anos)
      - Anonimizar dados não obrigatórios
      - Manter dados obrigatórios com prazo de eliminação

  # Art. 18, V - Portabilidade
  GET /export:
    auth: required
    params:
      format: 'json' | 'csv'
    response: File
    actions:
      - Buscar dados portáveis (excluir derivados)
      - Gerar arquivo no formato solicitado
      - Registrar exportação em auditoria
      - Filename: dados-pessoais-{cpf}-{timestamp}.{format}
```

---

## 🔒 SEGURANÇA E PROTEÇÃO DE DADOS

### 1. Criptografia

#### Em Trânsito
```yaml
# Requisitos de Criptografia (implementar no servidor web escolhido)
protocol: TLS 1.3 (mínimo)
port: 443 (HTTPS)
http2: enabled

cipher_suites:
  - ECDHE-ECDSA-AES256-GCM-SHA384
  - ECDHE-RSA-AES256-GCM-SHA384

security_headers:
  HSTS:
    max-age: 31536000  # 1 ano
    includeSubDomains: true
    preload: optional
  
# Aplicar em: Nginx, Apache, IIS, Caddy, ou servidor escolhido
```

#### Em Repouso
```yaml
# Modelo de Dados com Criptografia (implementar no ORM/banco escolhido)

Tabela: colaboradores
Campos:
  nome:
    type: string
    encrypted: false
  
  cpf:
    type: string
    encrypted: true
    algorithm: AES-256-GCM
    key_rotation: true
    
  dadosPcd:
    type: json/object
    encrypted: true
    algorithm: AES-256-GCM
    nullable: true

# Implementar em: TypeORM, Prisma, Sequelize, Hibernate, Entity Framework, etc.
# Usar biblioteca de criptografia da linguagem escolhida
```

### 2. Pseudonimização de Logs

```
# Algoritmo de Pseudonimização (implementar na linguagem escolhida)

Função: LogarComPseudonimização(evento)
  evento_anonimizado = {
    ...evento,
    userId: Hash_SHA256(evento.userId),
    cpf: MascararCPF(evento.cpf),        # XXX.XXX.XXX-XX
    ip: AnonimizarIP(evento.ip)          # 192.168.1.0/24
  }
  
  SalvarNoArmazenamento(evento_anonimizado)

Função: MascararCPF(cpf)
  # Manter apenas últimos 2 dígitos visíveis
  # Exemplo: 123.456.789-01 → XXX.XXX.XXX-01
  Retornar formato_mascarado

Função: AnonimizarIP(ip)
  # Remover último octeto (IPv4) ou últimos 64 bits (IPv6)
  # Exemplo: 192.168.1.100 → 192.168.1.0/24
  Retornar ip_anonimizado
```

### 3. Controle de Acesso Granular

```yaml
# Permissões RBAC (implementar com Platform Authorization)

Permissions:
  employee:view:basic:
    description: "Visualizar dados básicos do colaborador"
    sensitivity: normal
    
  employee:view:salary:
    description: "Visualizar salário"
    sensitivity: confidential
    
  employee:view:pcd:
    description: "Visualizar dados PcD"
    sensitivity: sensitive  # ⚠️ Dados sensíveis LGPD
    restricted_to: ['RH_ADMIN', 'DPO']
    
  employee:manage:pcd:
    description: "Gerenciar dados PcD"
    sensitivity: sensitive  # ⚠️ Dados sensíveis LGPD
    restricted_to: ['RH_ADMIN', 'DPO']
    
  reports:export:
    description: "Exportar relatórios"
    sensitivity: normal
    requires_justification: true  # DLP

# Regras de Autorização
Rules:
  AccessPcdData:
    condition: |
      user.hasAnyRole(['RH_ADMIN', 'DPO']) AND
      user.hasPermission('employee:view:pcd')
    action: allow
    else: deny
    
# Integrar com Platform Authorization API
```

### 4. Data Loss Prevention (DLP)

```yaml
# Regras DLP (implementar no backend escolhido)

DLP_Rules:
  
  Rule_1_Volume_Limit:
    name: "Limite de Exportação em Massa"
    trigger: before_export
    condition: record_count > 1000
    action: block
    message: "Exportação em massa bloqueada. Máximo: 1000 registros"
    
  Rule_2_Sensitive_Justification:
    name: "Justificativa para Dados Sensíveis"
    trigger: before_export
    condition: |
      has_sensitive_data(data) AND
      NOT user.has_justification
    action: block
    message: "Justificativa obrigatória para exportar dados sensíveis"
    notification:
      - Enviar para DPO via Platform Notifications
      - Incluir: usuário, quantidade, justificativa
    
  Rule_3_Watermark:
    name: "Marca D'água em Relatórios"
    trigger: after_export
    action: add_watermark
    watermark_data:
      - Usuário exportador
      - Data/hora
      - "Confidencial - Uso Interno"

Sensitive_Data_Detection:
  fields:
    - dadosPcd (PcD information)
    - salario (salary)
    - cpf (full CPF without mask)
  
  function: hasSensitiveData(records)
    return records.any(r => 
      r.dadosPcd != null OR
      r.salario != null
    )
```

---

## 📝 REGISTRO DE OPERAÇÕES DE TRATAMENTO (ROPA)

### Template ROPA para o Sistema

| Item | Descrição |
|------|-----------|
| **Controlador** | [Nome da Empresa] - Departamento de RH |
| **DPO** | [Nome do DPO] - [email@empresa.com] |
| **Operadores** | AWS (hospedagem), SendGrid (e-mails), Datadog (logs) |
| **Categoria de Titulares** | Colaboradores ativos, ex-colaboradores (até 5 anos) |
| **Dados Tratados** | Nome, CPF, cargo, salário, e-mail, telefone, PcD (sensível) |
| **Finalidade** | Gestão de RH, conformidade Lei 8.213, auditoria MTE |
| **Base Legal** | Execução contrato (Art. 7º V), obrigação legal (Art. 7º II, Art. 11 II a) |
| **Compartilhamento** | MTE (fiscalização PcD), auditores externos (compliance) |
| **Transferência Internacional** | AWS us-east-1 (Cláusulas Contratuais Padrão - SCC) |
| **Período de Retenção** | 5 anos após desligamento (CLT + fiscal) |
| **Medidas de Segurança** | TLS 1.3, AES-256, RBAC, logs auditados, DLP ativo |
| **Incidentes Registrados** | 0 (desde Jan/2025) |
| **Última Revisão** | 15/12/2025 |

---

## 🚨 GESTÃO DE INCIDENTES DE SEGURANÇA

### Processo de Resposta a Incidentes

```yaml
# Workflow de Incidente LGPD (implementar no sistema escolhido)

Severity_Levels:
  LOW: 1        # Acesso não autorizado sem vazamento
  MEDIUM: 2     # Vazamento < 100 registros sem dados sensíveis
  HIGH: 3       # Vazamento > 100 registros OU qualquer dado sensível
  CRITICAL: 4   # Vazamento massivo OU dados sensíveis + publicação

Incident_Response_Workflow:
  
  Step_1_Detection:
    action: Detectar e classificar incidente
    output: IncidentReport com severidade calculada
    
  Step_2_Containment:
    action: Contenção imediata
    tasks:
      - Bloquear acesso comprometido
      - Isolar sistemas afetados
      - Preservar evidências
    
  Step_3_Internal_Notification:
    action: Notificar DPO e Segurança
    method: Platform Notifications (high priority)
    deadline: Imediato
    
  Step_4_Investigation:
    action: Investigar causa raiz
    output:
      - Escopo do vazamento
      - Dados afetados
      - Titulares impactados
      - Ações de mitigação
      
  Step_5_ANPD_Notification:
    condition: severity >= HIGH
    action: Notificar ANPD
    deadline: 2 dias úteis (prazo razoável)
    method: Portal ANPD
    content:
      - Descrição do incidente
      - Dados afetados
      - Titulares impactados
      - Medidas tomadas
      - Medidas preventivas futuras
      
  Step_6_Titular_Notification:
    condition: high_risk_to_rights == true
    action: Notificar titulares afetados
    method: E-mail + Portal do Titular
    template: |
      Prezado(a) colaborador(a),
      
      Informamos que, em {date}, identificamos um incidente de segurança
      que pode ter afetado seus dados pessoais.
      
      Dados afetados: {affected_fields}
      Natureza: {description}
      
      Medidas tomadas:
      {mitigation_actions}
      
      Seus direitos:
      - Solicitar informações: Portal do Titular
      - Reparação de danos: Art. 42 LGPD
      
      Contato DPO: dpo@empresa.com
      
  Step_7_Documentation:
    action: Documentar incidente completo
    store:
      - Relatório de investigação
      - Evidências
      - Comunicações
      - Lições aprendidas
    retention: Permanente (compliance)
```

### Canais de Comunicação

```yaml
# Contatos LGPD
dpo:
  email: dpo@empresa.com
  telefone: +55 11 XXXX-XXXX
  
anpd:
  portal: https://www.gov.br/anpd/pt-br
  email_incidentes: incidentes@anpd.gov.br
  
titular:
  portal_web: https://sistema.empresa.com/lgpd/titular
  email: privacidade@empresa.com
```

---

## 📊 RELATÓRIO DE IMPACTO (RIPD)

### Quando Elaborar o RIPD

✅ **Obrigatório neste sistema porque:**
- Trata dados sensíveis (PcD - saúde)
- Uso de tecnologias emergentes (IA para previsões)
- Decisões automatizadas (cálculo cota PcD)
- Grande volume de titulares (> 1000 colaboradores)

### Template Simplificado RIPD

```markdown
## 1. DESCRIÇÃO DO TRATAMENTO
- Sistema de gestão de quadro de lotação
- Processa dados de RH incluindo informações de PcD
- Utiliza IA para previsões de demanda

## 2. NECESSIDADE E PROPORCIONALIDADE
- ✅ Dados coletados são mínimos necessários
- ✅ Cota PcD é obrigação legal (Lei 8.213)
- ✅ IA melhora gestão mas não decide sozinha (humano valida)

## 3. RISCOS IDENTIFICADOS
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Vazamento dados PcD | Baixa | Alto | Criptografia + RBAC estrito |
| Discriminação por PcD | Média | Alto | Auditoria de uso + treinamento |
| Decisão 100% automatizada | Baixa | Médio | Aprovação humana obrigatória |

## 4. MEDIDAS DE SEGURANÇA
- Criptografia AES-256
- Acesso baseado em função (RBAC)
- Logs auditados
- DLP ativo
- Treinamento anual LGPD

## 5. CONFORMIDADE
- ✅ Bases legais mapeadas
- ✅ Direitos dos titulares implementados
- ✅ DPO designado
- ✅ Processo de incidentes definido

## 6. CONCLUSÃO
O tratamento é NECESSÁRIO, PROPORCIONAL e SEGURO.
Riscos são ACEITÁVEIS com as mitigações implementadas.
```

---

## 🎓 TREINAMENTO E CONSCIENTIZAÇÃO

### Programa de Capacitação LGPD

#### Públicos-Alvo

| Público | Carga Horária | Conteúdo |
|---------|---------------|----------|
| **Desenvolvedores** | 8h | Privacy by Design, criptografia, logs seguros |
| **RH/Usuários** | 4h | Direitos dos titulares, bases legais, uso correto |
| **Gestores** | 2h | Responsabilização, RIPD, gestão de riscos |
| **DPO/Segurança** | 16h | LGPD completa, ANPD, ISO 27701 |

#### Tópicos Obrigatórios

```yaml
modulo_1:
  titulo: "Fundamentos LGPD"
  conteudo:
    - O que são dados pessoais e sensíveis
    - Princípios da LGPD
    - Direitos dos titulares
    - Penalidades (até 2% faturamento ou R$ 50M)

modulo_2:
  titulo: "Uso Correto do Sistema"
  conteudo:
    - Como acessar apenas dados necessários
    - Quando solicitar acesso a dados PcD
    - Exportação responsável de relatórios
    - O que fazer em caso de incidente

modulo_3:
  titulo: "Prática"
  conteudo:
    - Simulação de solicitação de titular
    - Cenários de incidentes
    - Exercício de RIPD simplificado
```

### Certificação

```yaml
# Regra de Treinamento Obrigatório (implementar no sistema de autorização)

Training_Requirement:
  name: "LGPD Training Validation"
  applies_to: users_with_sensitive_data_access
  
  validation_rule:
    condition: |
      IF user.hasSensitiveDataAccess() THEN
        training = user.lgpdTraining
        
        IF training == null OR isExpired(training.completedAt) THEN
          BLOCK access
          SHOW message: "Treinamento LGPD obrigatório. Acesse: /training/lgpd"
        END IF
      END IF
  
  expiration_logic:
    validity_period: 365 days  # 1 ano
    calculation: |
      current_date - training.completedAt > 365 days
  
  enforcement_points:
    - Login com permissões sensíveis
    - Acesso a dados PcD
    - Exportação de relatórios sensíveis
  
  notifications:
    30_days_before_expiry:
      method: email + in-app
      message: "Seu treinamento LGPD expira em 30 dias"
    
    on_expiry:
      action: revoke_sensitive_permissions
      notification: "Treinamento expirado. Renovação obrigatória."

# Integrar com Platform Authorization
```

---

## 🔍 AUDITORIA E CONFORMIDADE

### Checklist de Conformidade LGPD

```yaml
# Checklist Trimestral
data_mapping:
  - [ ] Inventário de dados atualizado
  - [ ] ROPA revisado
  - [ ] Fluxos de dados mapeados

legal_basis:
  - [ ] Bases legais validadas para cada tratamento
  - [ ] Consentimentos (se houver) documentados
  - [ ] Contratos com operadores atualizados

security:
  - [ ] Testes de penetração realizados
  - [ ] Criptografia ativa e chaves rotacionadas
  - [ ] Logs de acesso revisados
  - [ ] DLP funcionando corretamente

titular_rights:
  - [ ] Solicitações respondidas no prazo (15 dias)
  - [ ] Portal do titular funcional
  - [ ] Exportação de dados testada

incidents:
  - [ ] Nenhum incidente não reportado
  - [ ] Procedimentos de resposta testados (drill)
  - [ ] Comunicação com ANPD atualizada

training:
  - [ ] 100% colaboradores com acesso sensível treinados
  - [ ] Certificados válidos (< 1 ano)
  - [ ] Material de treinamento atualizado

documentation:
  - [ ] RIPD atualizado
  - [ ] Política de Privacidade publicada
  - [ ] Termos de Uso revisados
```

### Logs de Auditoria

```yaml
# Estrutura de Log LGPD (implementar no sistema de logs escolhido)

AuditLog_Schema:
  timestamp: datetime         # ISO 8601
  userId: string             # Pseudonimizado (SHA-256)
  action: enum               # VIEW, CREATE, UPDATE, DELETE, EXPORT, SHARE
  resource: string           # ex: 'Colaborador:12345'
  dataCategory: enum         # SENSITIVE | REGULAR
  justification: string      # Obrigatório se dataCategory == SENSITIVE
  ipAddress: string          # Anonimizado (192.168.1.0/24)
  success: boolean
  metadata: object           # Informações adicionais

Action_Types:
  - VIEW: "Visualização de dados"
  - CREATE: "Criação de registro"
  - UPDATE: "Atualização de dados"
  - DELETE: "Exclusão/anonimização"
  - EXPORT: "Exportação de dados"
  - SHARE: "Compartilhamento"

Data_Categories:
  REGULAR: "Dados pessoais comuns"
  SENSITIVE: "Dados sensíveis (PcD, saúde)"

# Exemplo de Registro
Example_Log:
  timestamp: "2025-12-15T10:30:00Z"
  userId: "a3f5b9..."  # Hash SHA-256 do ID real
  action: "VIEW"
  resource: "Colaborador:PcD_Data"
  dataCategory: "SENSITIVE"
  justification: "Auditoria MTE - Processo 2025/001"
  ipAddress: "192.168.1.0/24"
  success: true
  metadata:
    fields: ["indicadorPcd", "tipoDeficiencia"]
    exportFormat: null
    sessionId: "xyz789"

# Armazenar em: ELK Stack, Splunk, CloudWatch Logs, etc.
# Retenção: 5 anos (compliance)
```

---

## 📜 POLÍTICAS E DOCUMENTOS OBRIGATÓRIOS

### 1. Política de Privacidade

```markdown
# POLÍTICA DE PRIVACIDADE - SISTEMA QUADRO DE LOTAÇÃO

## 1. INTRODUÇÃO
[Nome da Empresa] respeita sua privacidade e está comprometida com a LGPD.

## 2. DADOS COLETADOS
- Dados cadastrais: nome, CPF, e-mail, telefone
- Dados profissionais: cargo, unidade, salário
- Dados sensíveis: informações de PcD (apenas se aplicável)

## 3. FINALIDADES
- Gestão de recursos humanos
- Cumprimento de obrigações legais (Lei 8.213 - cota PcD)
- Segurança e auditoria

## 4. BASES LEGAIS
- Execução de contrato de trabalho (Art. 7º, V)
- Cumprimento de obrigação legal (Art. 7º, II e Art. 11, II, a)

## 5. COMPARTILHAMENTO
- Ministério do Trabalho (fiscalização PcD)
- Prestadores de serviço (cloud, e-mail) sob contrato

## 6. SEUS DIREITOS
Você pode:
- Acessar seus dados
- Corrigir dados incorretos
- Solicitar exclusão (quando permitido)
- Exportar dados (portabilidade)
- Revogar consentimento

Acesse: [sistema.empresa.com/lgpd/titular]
Contato DPO: dpo@empresa.com

## 7. RETENÇÃO
Dados mantidos por 5 anos após desligamento (obrigação CLT/fiscal).

## 8. SEGURANÇA
TLS 1.3, criptografia AES-256, controle de acesso rigoroso.

## 9. ATUALIZAÇÕES
Última atualização: 15/12/2025
Versão: 1.0
```

### 2. Termo de Uso do Sistema

```markdown
# TERMO DE USO - SISTEMA QUADRO DE LOTAÇÃO

Ao acessar o sistema, você concorda:

1. **Uso Profissional:** Acesso apenas para atividades de trabalho
2. **Confidencialidade:** Dados acessados são confidenciais
3. **Proibições:**
   - Compartilhar credenciais
   - Exportar dados sem justificativa
   - Acessar dados sem necessidade funcional
4. **Responsabilidade:** Você é responsável por ações em sua conta
5. **Auditoria:** Todos os acessos são registrados
6. **Violações:** Uso indevido pode resultar em sanções administrativas

Data: ___/___/_____
Aceito: [ ] Sim
```

### 3. Contrato com Operadores (DPA - Data Processing Agreement)

```markdown
# ACORDO DE PROCESSAMENTO DE DADOS

Entre: [EMPRESA - Controladora] e [OPERADOR - ex: AWS]

## CLÁUSULAS LGPD

1. **Objeto:** Processamento de dados em nome da Controladora
2. **Obrigações do Operador:**
   - Tratar dados apenas conforme instruções
   - Implementar segurança adequada
   - Notificar incidentes em 24h
   - Auxiliar em solicitações de titulares
3. **Suboperadores:** Requer aprovação prévia
4. **Transferência Internacional:** Apenas com SCC (Standard Contractual Clauses)
5. **Auditoria:** Controladora pode auditar anualmente
6. **Término:** Devolução ou eliminação de dados

Conformidade: LGPD Art. 16 e Art. 41
```

---

## 🌍 TRANSFERÊNCIA INTERNACIONAL DE DADOS

### Cenário: Hospedagem AWS (EUA)

#### Base Legal (Art. 33 LGPD)

```yaml
transfer:
  destination: "AWS us-east-1 (EUA)"
  mechanism: "Standard Contractual Clauses (SCC)"
  adequacy_decision: false  # EUA não tem decisão de adequação ANPD
  
safeguards:
  - SCC homologadas pela ANPD (quando disponíveis) ou da UE
  - Criptografia em trânsito e repouso
  - Data residency: cópia em AWS sa-east-1 (São Paulo)
  - Direito de auditoria mantido
  
transparency:
  - Informado na Política de Privacidade
  - Consta no ROPA
  - Titulares podem questionar
```

#### Configuração Técnica

```yaml
# Configuração de Residência de Dados (aplicar no cloud provider escolhido)

Database_Configuration:
  
  primary:
    region: sa-east-1  # São Paulo, Brasil (preferencial)
    country: BR
    encryption: AES-256
    compliance: LGPD
    
  backup:
    region: us-east-1  # EUA (fallback/DR apenas)
    country: US
    encryption: AES-256
    contractual_safeguards: SCC_APPLIED  # Standard Contractual Clauses
    data_residency_note: "Transferência internacional protegida por SCC"

# Aplicável em:
# - AWS: RDS, S3, DynamoDB
# - Azure: SQL Database, Cosmos DB, Storage
# - GCP: Cloud SQL, Firestore, Cloud Storage
# - On-premise: Configurar datacenter brasileiro
```

---

## ⚖️ RESPONSABILIDADES E SANÇÕES

### Matriz de Responsabilidades

| Papel | Responsabilidades LGPD | Sanções em Caso de Violação |
|-------|------------------------|------------------------------|
| **Controlador** (Empresa) | Decisões sobre tratamento, RIPD, notificação ANPD | Até 2% faturamento (máx R$ 50M) + danos morais |
| **DPO** | Orientação, interface ANPD, monitoramento | Responsabilidade administrativa |
| **Desenvolvedores** | Privacy by Design, segurança | Trabalhista + criminal (se dolo) |
| **Usuários RH** | Uso adequado, confidencialidade | Trabalhista (demissão por justa causa) |
| **Operadores** (AWS, etc) | Seguir instruções, segurança | Contratual + solidária (Art. 42 §1º) |

### Penalidades ANPD (Art. 52 LGPD)

```yaml
sancoes_administrativas:
  1_advertencia:
    quando: "Primeira infração leve"
    prazo_regularizacao: "Conforme ANPD"
  
  2_multa_simples:
    valor: "Até 2% faturamento (limite R$ 50.000.000,00)"
    base_calculo: "Faturamento pessoa jurídica (grupo econômico)"
    
  3_multa_diaria:
    quando: "Descumprimento após advertência"
    limite: "R$ 50.000.000,00 total"
    
  4_publicizacao:
    tipo: "Publicação da infração"
    onde: "Site ANPD + mídia"
    
  5_bloqueio:
    objeto: "Dados pessoais relacionados à infração"
    prazo: "Até regularização"
    
  6_eliminacao:
    objeto: "Dados pessoais relacionados à infração"
    irreversivel: true
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Sprint LGPD - 2 Semanas

#### Semana 1: Fundação
- [ ] Designar DPO (interno ou terceirizado)
- [ ] Mapear dados pessoais (inventário)
- [ ] Elaborar ROPA
- [ ] Definir bases legais
- [ ] Criar Política de Privacidade
- [ ] Criar Termo de Uso
- [ ] Implementar criptografia (TLS 1.3 + AES-256)
- [ ] Configurar pseudonimização de logs

#### Semana 2: Direitos dos Titulares
- [ ] Desenvolver Portal do Titular
  - [ ] Confirmação de tratamento
  - [ ] Acesso aos dados
  - [ ] Exportação (JSON/CSV)
  - [ ] Solicitação de correção
  - [ ] Solicitação de exclusão
- [ ] Implementar DLP básico
- [ ] Criar processo de incidentes
- [ ] Treinamento equipe (4h)
- [ ] Elaborar RIPD
- [ ] Testes de conformidade

---

## 📞 CONTATOS E RECURSOS

### Internos
```yaml
dpo:
  nome: "[Nome do DPO]"
  email: "dpo@empresa.com"
  telefone: "+55 11 XXXX-XXXX"
  
compliance:
  email: "compliance@empresa.com"
  
seguranca:
  email: "security@empresa.com"
  incidentes: "incidents@empresa.com" (24/7)
```

### Externos
```yaml
anpd:
  site: "https://www.gov.br/anpd"
  ouvidoria: "https://www.gov.br/anpd/pt-br/canais_atendimento"
  telefone: "0800-041-7008"
  
mte:
  fiscalizacao_pcd: "https://www.gov.br/trabalho-e-previdencia"
  
consultorias:
  juridica_lgpd: "[Escritório parceiro]"
  auditoria_ti: "[Empresa auditoria]"
```

---

## 📚 REFERÊNCIAS NORMATIVAS

### Legislação
- **LGPD:** Lei nº 13.709/2018
- **Lei 8.213/91:** Cotas PcD
- **CLT:** Retenção de dados trabalhistas

### Normas Técnicas
- **ISO/IEC 27001:** Gestão de Segurança da Informação
- **ISO/IEC 27701:** Gestão de Privacidade
- **ISO/IEC 29100:** Privacy Framework

### Guias ANPD
- Guia Orientativo para Definições dos Agentes de Tratamento
- Guia Orientativo de Segurança da Informação
- Guia de Boas Práticas para Relatório de Impacto (RIPD)

---

## 🎯 CONCLUSÃO

Este documento especifica todos os requisitos de conformidade com a LGPD para o **Sistema de Gestão de Quadro de Lotação**. A implementação das medidas técnicas e organizacionais descritas garantirá:

✅ **Conformidade Legal** - Atendimento integral aos artigos da LGPD
✅ **Proteção de Dados** - Segurança de dados pessoais e sensíveis
✅ **Direitos dos Titulares** - Ferramentas para exercício de direitos
✅ **Responsabilização** - Documentação e processos auditáveis
✅ **Prevenção de Riscos** - Medidas proativas de segurança

### Próximos Passos

1. **Aprovação** desta especificação pelo DPO e jurídico
2. **Inclusão** das histórias LGPD no backlog de desenvolvimento
3. **Priorização** das funcionalidades críticas (Portal do Titular, criptografia)
4. **Treinamento** da equipe técnica em Privacy by Design
5. **Auditoria** pré-lançamento de conformidade LGPD

---

**Documento elaborado em conformidade com a Lei nº 13.709/2018 (LGPD)**
**Versão: 1.0 | Data: 15/12/2025**
