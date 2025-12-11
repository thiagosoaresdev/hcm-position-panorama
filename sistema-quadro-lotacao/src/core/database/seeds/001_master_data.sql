-- Seed Data: Master Data - Sistema de Gestão de Quadro de Lotação
-- Description: Insert initial master data for development and testing

-- Insert sample empresa
INSERT INTO empresas (id, nome, cnpj, ativo, configuracoes) VALUES
('emp_001', 'Senior Sistemas S.A.', '12.345.678/0001-90', true, '{
  "workflow_aprovacao": {
    "niveis": 3,
    "configuracao": {
      "nivel_1": "coordenacao",
      "nivel_2": "gerencia", 
      "nivel_3": "diretoria",
      "rh": "recursos_humanos"
    }
  },
  "pcd_compliance": {
    "enabled": true,
    "alertas": true
  },
  "normalizacao": {
    "automatica": true,
    "tempo_real": true
  }
}')
ON CONFLICT (id) DO NOTHING;

-- Insert plano de vagas 2025
INSERT INTO planos_vagas (id, empresa_id, nome, data_inicio, data_fim, status, descricao) VALUES
('plano_2025', 'emp_001', 'Plano de Vagas 2025', '2025-01-01', '2025-12-31', 'ativo', 'Plano de vagas para o exercício de 2025')
ON CONFLICT (id) DO NOTHING;

-- Insert centros de custo
INSERT INTO centros_custo (id, empresa_id, codigo, nome, hierarquia, ativo, responsavel) VALUES
('cc_ti', 'emp_001', 'TI', 'Tecnologia da Informação', 'TI', true, 'João Silva'),
('cc_rh', 'emp_001', 'RH', 'Recursos Humanos', 'RH', true, 'Maria Santos'),
('cc_adm', 'emp_001', 'ADM', 'Administrativo', 'ADM', true, 'Pedro Costa'),
('cc_vendas', 'emp_001', 'VENDAS', 'Vendas e Marketing', 'VENDAS', true, 'Ana Oliveira'),
('cc_financeiro', 'emp_001', 'FIN', 'Financeiro', 'FIN', true, 'Carlos Pereira')
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- Insert postos de trabalho
INSERT INTO postos_trabalho (id, centro_custo_id, codigo, nome, descricao, ativo) VALUES
('pt_dev_fs', 'cc_ti', 'DEV-FS', 'Desenvolvedor Full Stack', 'Desenvolvimento de aplicações web completas', true),
('pt_dev_mobile', 'cc_ti', 'DEV-MOB', 'Desenvolvedor Mobile', 'Desenvolvimento de aplicações móveis', true),
('pt_service_desk', 'cc_ti', 'SD', 'Service Desk', 'Suporte técnico aos usuários', true),
('pt_dba', 'cc_ti', 'DBA', 'Administrador de Banco de Dados', 'Administração e manutenção de bancos de dados', true),
('pt_analista_rh', 'cc_rh', 'ANA-RH', 'Analista de RH', 'Análise e gestão de recursos humanos', true),
('pt_recrutador', 'cc_rh', 'REC', 'Recrutador', 'Recrutamento e seleção de candidatos', true),
('pt_assistente_adm', 'cc_adm', 'ASS-ADM', 'Assistente Administrativo', 'Suporte administrativo geral', true),
('pt_vendedor', 'cc_vendas', 'VEND', 'Vendedor', 'Vendas de produtos e serviços', true),
('pt_analista_fin', 'cc_financeiro', 'ANA-FIN', 'Analista Financeiro', 'Análise financeira e contábil', true)
ON CONFLICT (centro_custo_id, codigo) DO NOTHING;

-- Insert cargos
INSERT INTO cargos (id, nome, estrutura, classe, nivel, percentual, descricao, ativo) VALUES
('cargo_dev_junior', 'Desenvolvedor Junior', 'TI', 'Classe D', 'Junior', 2.5, 'Desenvolvedor com até 2 anos de experiência', true),
('cargo_dev_pleno', 'Desenvolvedor Pleno', 'TI', 'Classe C', 'Pleno', 5.0, 'Desenvolvedor com 2-5 anos de experiência', true),
('cargo_dev_senior', 'Desenvolvedor Senior', 'TI', 'Classe B', 'Senior', 8.0, 'Desenvolvedor com mais de 5 anos de experiência', true),
('cargo_analista_junior', 'Analista Junior', 'Análise', 'Classe D', 'Junior', 3.0, 'Analista com até 2 anos de experiência', true),
('cargo_analista_pleno', 'Analista Pleno', 'Análise', 'Classe C', 'Pleno', 5.5, 'Analista com 2-5 anos de experiência', true),
('cargo_analista_senior', 'Analista Senior', 'Análise', 'Classe B', 'Senior', 8.5, 'Analista com mais de 5 anos de experiência', true),
('cargo_assistente', 'Assistente', 'Operacional', 'Classe E', 'Assistente', 2.0, 'Cargo de nível assistente', true),
('cargo_coordenador', 'Coordenador', 'Gestão', 'Classe B', 'Coordenador', 10.0, 'Cargo de coordenação de equipe', true),
('cargo_gerente', 'Gerente', 'Gestão', 'Classe A', 'Gerente', 15.0, 'Cargo de gerência', true),
('cargo_diretor', 'Diretor', 'Gestão', 'Classe A', 'Diretor', 25.0, 'Cargo de diretoria', true)
ON CONFLICT (id) DO NOTHING;

-- Insert quadro de lotação
INSERT INTO quadro_lotacao (id, plano_vagas_id, posto_trabalho_id, cargo_id, cargo_vaga, vagas_previstas, vagas_efetivas, vagas_reservadas, data_inicio_controle, tipo_controle, ativo) VALUES
('ql_001', 'plano_2025', 'pt_dev_fs', 'cargo_dev_pleno', 'Desenvolvedor Full Stack Pleno', 8, 7, 1, '2025-01-01', 'diario', true),
('ql_002', 'plano_2025', 'pt_dev_fs', 'cargo_dev_junior', 'Desenvolvedor Full Stack Junior', 5, 4, 0, '2025-01-01', 'diario', true),
('ql_003', 'plano_2025', 'pt_dev_mobile', 'cargo_dev_pleno', 'Desenvolvedor Mobile Pleno', 4, 3, 1, '2025-01-01', 'diario', true),
('ql_004', 'plano_2025', 'pt_service_desk', 'cargo_analista_junior', 'Analista Service Desk Junior', 6, 5, 0, '2025-01-01', 'diario', true),
('ql_005', 'plano_2025', 'pt_dba', 'cargo_dev_senior', 'DBA Senior', 2, 2, 0, '2025-01-01', 'diario', true),
('ql_006', 'plano_2025', 'pt_analista_rh', 'cargo_analista_pleno', 'Analista RH Pleno', 3, 2, 1, '2025-01-01', 'diario', true),
('ql_007', 'plano_2025', 'pt_recrutador', 'cargo_analista_junior', 'Recrutador Junior', 2, 1, 1, '2025-01-01', 'diario', true),
('ql_008', 'plano_2025', 'pt_assistente_adm', 'cargo_assistente', 'Assistente Administrativo', 4, 4, 0, '2025-01-01', 'diario', true),
('ql_009', 'plano_2025', 'pt_vendedor', 'cargo_analista_pleno', 'Vendedor Pleno', 10, 8, 2, '2025-01-01', 'diario', true),
('ql_010', 'plano_2025', 'pt_analista_fin', 'cargo_analista_senior', 'Analista Financeiro Senior', 3, 3, 0, '2025-01-01', 'diario', true)
ON CONFLICT (plano_vagas_id, posto_trabalho_id, cargo_id) DO NOTHING;

-- Insert sample colaboradores
INSERT INTO colaboradores (id, nome, cpf, cargo_id, centro_custo_id, turno, pcd, data_admissao, status) VALUES
('col_001', 'João Silva Santos', '123.456.789-01', 'cargo_dev_pleno', 'cc_ti', 'Integral', false, '2024-03-15', 'ativo'),
('col_002', 'Maria Oliveira Costa', '234.567.890-12', 'cargo_dev_pleno', 'cc_ti', 'Integral', true, '2024-05-20', 'ativo'),
('col_003', 'Pedro Almeida Lima', '345.678.901-23', 'cargo_dev_junior', 'cc_ti', 'Integral', false, '2024-08-10', 'ativo'),
('col_004', 'Ana Paula Ferreira', '456.789.012-34', 'cargo_analista_junior', 'cc_ti', 'Integral', false, '2024-06-01', 'ativo'),
('col_005', 'Carlos Eduardo Souza', '567.890.123-45', 'cargo_dev_senior', 'cc_ti', 'Integral', false, '2023-01-15', 'ativo'),
('col_006', 'Fernanda Silva Rocha', '678.901.234-56', 'cargo_analista_pleno', 'cc_rh', 'Integral', false, '2024-02-10', 'ativo'),
('col_007', 'Ricardo Pereira Dias', '789.012.345-67', 'cargo_analista_junior', 'cc_rh', 'Integral', true, '2024-09-05', 'ativo'),
('col_008', 'Juliana Santos Melo', '890.123.456-78', 'cargo_assistente', 'cc_adm', 'Integral', false, '2024-04-12', 'ativo'),
('col_009', 'Roberto Carlos Silva', '901.234.567-89', 'cargo_analista_pleno', 'cc_vendas', 'Integral', false, '2024-01-08', 'ativo'),
('col_010', 'Patrícia Lima Santos', '012.345.678-90', 'cargo_analista_senior', 'cc_financeiro', 'Integral', false, '2023-11-20', 'ativo')
ON CONFLICT (cpf) DO NOTHING;

-- Insert sample propostas
INSERT INTO propostas (id, tipo, descricao, detalhamento, solicitante_id, quadro_lotacao_id, cargo_atual, cargo_novo, vagas_atuais, vagas_solicitadas, impacto_orcamentario, status) VALUES
(uuid_generate_v4(), 'inclusao', 'Inclusão de 2 vagas para Desenvolvedor Senior', 'Necessidade de ampliar a equipe de desenvolvimento devido ao aumento de demanda de projetos', 'user_001', 'ql_001', null, 'Desenvolvedor Senior', 8, 10, 'Impacto de R$ 24.000/mês', 'nivel_1'),
(uuid_generate_v4(), 'alteracao', 'Alteração de cargo de Junior para Pleno', 'Promoção de desenvolvedor junior que demonstrou competências de nível pleno', 'user_002', 'ql_002', 'Desenvolvedor Junior', 'Desenvolvedor Pleno', 5, 5, 'Impacto de R$ 3.000/mês', 'rascunho'),
(uuid_generate_v4(), 'transferencia', 'Transferência de vaga entre centros de custo', 'Realocação de vaga do TI para RH devido a reorganização', 'user_003', 'ql_006', 'Analista RH', 'Analista TI', 3, 3, 'Sem impacto orçamentário', 'aprovada')
ON CONFLICT DO NOTHING;