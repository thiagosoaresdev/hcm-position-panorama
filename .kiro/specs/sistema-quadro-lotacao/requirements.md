# Requirements Document - Sistema de Gestão de Quadro de Lotação

## Introduction

O Sistema de Gestão de Quadro de Lotação é uma solução corporativa que centraliza o gerenciamento de vagas, colaboradores e recursos humanos em conformidade com a legislação brasileira (Lei 8.213 - PcD). O sistema oferece visibilidade completa do quadro de pessoal (previsto vs efetivo), automatiza fluxos de aprovação de vagas, rastreia alterações históricas e fornece analytics inteligentes com previsões baseadas em IA.

## Glossary

- **Sistema_Quadro_Lotacao**: Sistema principal de gestão de quadro de vagas
- **Quadro_Previsto**: Conjunto de vagas autorizadas para um período específico
- **Quadro_Efetivo**: Colaboradores reais ocupando as vagas
- **Quadro_Reservas**: Vagas em processo de seletivo/recrutamento
- **Normalizacao**: Processo de sincronização entre quadro previsto e efetivo
- **Proposta**: Solicitação de alteração no quadro que requer aprovação
- **PcD**: Pessoa com Deficiência (conforme Lei 8.213/91)
- **Plano_Vagas**: Período específico com vagas autorizadas (ex: Plano 2025)
- **Centro_Custo**: Departamento ou área organizacional
- **Posto_Trabalho**: Posição específica (ex: "Service Desk - Analyst")
- **Workflow_Aprovacao**: Fluxo de 3 níveis + RH para aprovação de propostas
- **Platform_Authentication**: API Senior X para autenticação OAuth 2.0
- **Platform_Authorization**: API Senior X para controle de acesso RBAC/ACL
- **Platform_Notifications**: API Senior X para notificações multicanal

## Requirements

### Requirement 1

**User Story:** Como um Gerente de RH, eu quero visualizar um dashboard executivo com KPIs em tempo real, para que eu possa monitorar a situação do quadro de vagas e tomar decisões informadas.

#### Acceptance Criteria

1. WHEN o usuário acessa o dashboard, THE Sistema_Quadro_Lotacao SHALL exibir cards com indicadores de taxa de ocupação, custo por contratação, qualidade de contratação e retenção de talentos
2. WHEN dados são atualizados no sistema, THE Sistema_Quadro_Lotacao SHALL atualizar o dashboard em tempo real sem necessidade de refresh manual
3. WHEN o usuário aplica filtros globais, THE Sistema_Quadro_Lotacao SHALL atualizar todos os indicadores conforme os filtros selecionados
4. WHEN o sistema detecta alertas críticos, THE Sistema_Quadro_Lotacao SHALL exibir notificações visuais no dashboard
5. WHEN o usuário clica em um indicador, THE Sistema_Quadro_Lotacao SHALL navegar para análise detalhada do respectivo módulo

### Requirement 2

**User Story:** Como um Analista de RH, eu quero gerenciar o quadro de lotação com operações CRUD, para que eu possa manter as vagas previstas atualizadas conforme necessidades organizacionais.

#### Acceptance Criteria

1. WHEN o usuário cria uma nova vaga, THE Sistema_Quadro_Lotacao SHALL validar se não existe duplicação de cargo no mesmo posto de trabalho
2. WHEN o usuário edita uma vaga existente, THE Sistema_Quadro_Lotacao SHALL registrar auditoria completa com QUEM, QUANDO, ANTES, DEPOIS e MOTIVO
3. WHEN o usuário tenta reduzir vagas para número menor que colaboradores atuais, THE Sistema_Quadro_Lotacao SHALL exibir aviso de confirmação sobre déficit
4. WHEN o usuário deleta uma vaga, THE Sistema_Quadro_Lotacao SHALL realizar soft delete mantendo dados para auditoria
5. WHEN o usuário visualiza detalhes de uma vaga, THE Sistema_Quadro_Lotacao SHALL exibir histórico completo de alterações e colaboradores atuais

### Requirement 3

**User Story:** Como um Analista de RH, eu quero executar normalização automática do quadro efetivo, para que o sistema mantenha sincronização em tempo real com movimentações de pessoal.

#### Acceptance Criteria

1. WHEN um colaborador é admitido, transferido ou desligado, THE Sistema_Quadro_Lotacao SHALL atualizar o quadro efetivo automaticamente em menos de 2 segundos
2. WHEN a normalização é executada, THE Sistema_Quadro_Lotacao SHALL processar todos os postos de trabalho do período informado independente da data de início do controle
3. WHEN a normalização é iniciada, THE Sistema_Quadro_Lotacao SHALL excluir registros efetivos do período antes de processar as movimentações
4. WHEN a normalização é concluída, THE Sistema_Quadro_Lotacao SHALL gerar relatório com quantidade de postos processados e alterações realizadas
5. WHEN ocorre erro na normalização, THE Sistema_Quadro_Lotacao SHALL registrar logs detalhados e notificar responsáveis

### Requirement 4

**User Story:** Como um Coordenador, eu quero criar propostas de alteração no quadro, para que mudanças sejam aprovadas através de workflow estruturado antes da efetivação.

#### Acceptance Criteria

1. WHEN o usuário cria uma proposta, THE Sistema_Quadro_Lotacao SHALL permitir especificar tipo (inclusão, alteração, exclusão, transferência), justificativa e impacto orçamentário
2. WHEN uma proposta é enviada para aprovação, THE Sistema_Quadro_Lotacao SHALL iniciar workflow configurável de 3 níveis mais RH
3. WHEN um aprovador rejeita uma proposta, THE Sistema_Quadro_Lotacao SHALL retornar status para rascunho permitindo edição pelo solicitante
4. WHEN uma proposta é aprovada em todos os níveis, THE Sistema_Quadro_Lotacao SHALL aplicar automaticamente as mudanças no quadro de lotação
5. WHEN há transição de status na proposta, THE Sistema_Quadro_Lotacao SHALL enviar notificações automáticas por email e in-app para próximo aprovador

### Requirement 5

**User Story:** Como um Gerente de RH, eu quero analisar dados de ocupação e conformidade PcD, para que eu possa garantir cumprimento da Lei 8.213 e otimizar alocação de recursos.

#### Acceptance Criteria

1. WHEN o sistema calcula conformidade PcD, THE Sistema_Quadro_Lotacao SHALL aplicar percentuais corretos conforme Lei 8.213 (2% para 50-200, 3% para 201-500, 4% para 501-1000, 5% para >1000 colaboradores)
2. WHEN o percentual PcD está abaixo da meta legal, THE Sistema_Quadro_Lotacao SHALL exibir alertas no dashboard e sugerir ações corretivas
3. WHEN o usuário consulta vagas previstas, THE Sistema_Quadro_Lotacao SHALL permitir filtros por período, empresa, centro de custo e cargo com exportação em múltiplos formatos
4. WHEN o usuário compara períodos, THE Sistema_Quadro_Lotacao SHALL exibir variações percentuais e tendências com gráficos visuais
5. WHEN o usuário analisa ocupação por cargo, THE Sistema_Quadro_Lotacao SHALL calcular taxa de ocupação e identificar cargos críticos com baixa ocupação

### Requirement 6

**User Story:** Como um Administrador do Sistema, eu quero controlar acesso baseado em roles e permissões, para que usuários tenham acesso apenas às funcionalidades apropriadas ao seu perfil.

#### Acceptance Criteria

1. WHEN um usuário tenta acessar funcionalidade, THE Sistema_Quadro_Lotacao SHALL verificar permissões através da Platform_Authorization API antes de permitir acesso
2. WHEN um usuário faz login, THE Sistema_Quadro_Lotacao SHALL autenticar através da Platform_Authentication API com suporte a OAuth 2.0 e 2FA
3. WHEN um usuário sem permissão tenta executar ação, THE Sistema_Quadro_Lotacao SHALL bloquear acesso e registrar tentativa em log de auditoria
4. WHEN permissões são alteradas, THE Sistema_Quadro_Lotacao SHALL atualizar interface do usuário ocultando/exibindo elementos conforme novas permissões
5. WHEN usuário está em "Definições por Usuário", THE Sistema_Quadro_Lotacao SHALL ignorar configurações globais e aplicar exceções específicas

### Requirement 7

**User Story:** Como um Usuário do Sistema, eu quero receber notificações relevantes por múltiplos canais, para que eu seja informado sobre eventos importantes que requerem minha atenção.

#### Acceptance Criteria

1. WHEN evento relevante ocorre no sistema, THE Sistema_Quadro_Lotacao SHALL enviar notificações através da Platform_Notifications API por email, SMS e in-app conforme preferências do usuário
2. WHEN proposta é criada, THE Sistema_Quadro_Lotacao SHALL notificar aprovador do primeiro nível com detalhes da solicitação e link para ação
3. WHEN normalização é concluída, THE Sistema_Quadro_Lotacao SHALL notificar RH e supervisores com resumo de alterações processadas
4. WHEN alerta PcD é detectado, THE Sistema_Quadro_Lotacao SHALL notificar RH e Diretor sobre não conformidade com sugestões de ação
5. WHEN usuário recebe notificação in-app, THE Sistema_Quadro_Lotacao SHALL exibir card flutuante com opções de ação direta

### Requirement 8

**User Story:** Como um Auditor, eu quero rastrear todas as alterações no sistema, para que haja transparência completa e conformidade com requisitos de auditoria.

#### Acceptance Criteria

1. WHEN qualquer alteração é feita no sistema, THE Sistema_Quadro_Lotacao SHALL registrar QUEM (usuário), QUANDO (timestamp ISO 8601), MOTIVO (texto), APROVADOR (se aplicável) e valores ANTES/DEPOIS
2. WHEN usuário consulta histórico, THE Sistema_Quadro_Lotacao SHALL exibir timeline cronológica com filtros por tipo de ação, período, usuário e entidade
3. WHEN alteração é feita via integração automática, THE Sistema_Quadro_Lotacao SHALL identificar origem como "Sistema" e registrar detalhes da integração
4. WHEN dados de auditoria são consultados, THE Sistema_Quadro_Lotacao SHALL manter histórico permanente sem possibilidade de exclusão física
5. WHEN relatório de auditoria é solicitado, THE Sistema_Quadro_Lotacao SHALL permitir exportação completa com todos os campos de rastreabilidade

### Requirement 9

**User Story:** Como um Usuário do Sistema, eu quero interface responsiva seguindo Senior Design System, para que eu tenha experiência consistente em diferentes dispositivos e tamanhos de tela.

#### Acceptance Criteria

1. WHEN sistema é acessado em desktop, THE Sistema_Quadro_Lotacao SHALL exibir layout com 4 colunas para cards e sidebar sempre visível
2. WHEN sistema é acessado em tablet, THE Sistema_Quadro_Lotacao SHALL adaptar para 2 colunas e sidebar colapsável com menu hamburger
3. WHEN sistema é acessado em mobile, THE Sistema_Quadro_Lotacao SHALL exibir 1 coluna e drawer menu com navegação touch-friendly
4. WHEN elementos são renderizados, THE Sistema_Quadro_Lotacao SHALL aplicar cores, tipografia e espaçamentos conforme Senior Design System
5. WHEN usuário interage com componentes, THE Sistema_Quadro_Lotacao SHALL fornecer feedback visual com hover states, transições suaves e loading states

### Requirement 10

**User Story:** Como um Integrador de Sistemas, eu quero sincronização automática com RH Legado, para que movimentações de pessoal sejam refletidas em tempo real no quadro efetivo.

#### Acceptance Criteria

1. WHEN webhook de admissão é recebido do RH Legado, THE Sistema_Quadro_Lotacao SHALL validar dados e atualizar quadro efetivo automaticamente
2. WHEN cargo real difere do cargo previsto na admissão, THE Sistema_Quadro_Lotacao SHALL aplicar ação configurada (alertar, permitir, bloquear ou exigir aprovação)
3. WHEN colaborador é transferido entre centros, THE Sistema_Quadro_Lotacao SHALL atualizar quadros de origem e destino mantendo rastreabilidade
4. WHEN colaborador é desligado, THE Sistema_Quadro_Lotacao SHALL decrementar quadro efetivo e registrar vaga disponível
5. WHEN integração falha, THE Sistema_Quadro_Lotacao SHALL registrar erro detalhado e tentar reprocessamento automático com backoff exponencial