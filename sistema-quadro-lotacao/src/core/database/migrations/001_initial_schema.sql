-- V001: Initial Schema - Sistema de Gestão de Quadro de Lotação
-- Created: 2025-01-01
-- Description: Create core tables for the sistema quadro lotacao

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create empresas table
CREATE TABLE empresas (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create planos_vagas table
CREATE TABLE planos_vagas (
  id VARCHAR(50) PRIMARY KEY,
  empresa_id VARCHAR(50) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'planejado')),
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_plano_ativo_empresa UNIQUE (empresa_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create centros_custo table
CREATE TABLE centros_custo (
  id VARCHAR(50) PRIMARY KEY,
  empresa_id VARCHAR(50) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  hierarquia VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  responsavel VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_centro_custo_empresa UNIQUE (empresa_id, codigo)
);

-- Create postos_trabalho table
CREATE TABLE postos_trabalho (
  id VARCHAR(50) PRIMARY KEY,
  centro_custo_id VARCHAR(50) NOT NULL REFERENCES centros_custo(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_posto_centro UNIQUE (centro_custo_id, codigo)
);

-- Create cargos table
CREATE TABLE cargos (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  estrutura VARCHAR(100),
  classe VARCHAR(50),
  nivel VARCHAR(50),
  percentual DECIMAL(5,2),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quadro_lotacao table
CREATE TABLE quadro_lotacao (
  id VARCHAR(50) PRIMARY KEY,
  plano_vagas_id VARCHAR(50) NOT NULL REFERENCES planos_vagas(id) ON DELETE CASCADE,
  posto_trabalho_id VARCHAR(50) NOT NULL REFERENCES postos_trabalho(id) ON DELETE CASCADE,
  cargo_id VARCHAR(50) NOT NULL REFERENCES cargos(id) ON DELETE RESTRICT,
  cargo_vaga VARCHAR(200),
  vagas_previstas INTEGER NOT NULL DEFAULT 0 CHECK (vagas_previstas >= 0),
  vagas_efetivas INTEGER NOT NULL DEFAULT 0 CHECK (vagas_efetivas >= 0),
  vagas_reservadas INTEGER NOT NULL DEFAULT 0 CHECK (vagas_reservadas >= 0),
  data_inicio_controle DATE NOT NULL,
  tipo_controle VARCHAR(20) DEFAULT 'diario' CHECK (tipo_controle IN ('diario', 'competencia')),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_quadro_posto_cargo UNIQUE (plano_vagas_id, posto_trabalho_id, cargo_id)
);

-- Create colaboradores table
CREATE TABLE colaboradores (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cargo_id VARCHAR(50) NOT NULL REFERENCES cargos(id) ON DELETE RESTRICT,
  centro_custo_id VARCHAR(50) NOT NULL REFERENCES centros_custo(id) ON DELETE RESTRICT,
  turno VARCHAR(50),
  pcd BOOLEAN DEFAULT false,
  data_admissao DATE NOT NULL,
  data_desligamento DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create propostas table
CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('inclusao', 'alteracao', 'exclusao', 'transferencia')),
  descricao VARCHAR(500) NOT NULL,
  detalhamento TEXT,
  solicitante_id VARCHAR(50) NOT NULL,
  quadro_lotacao_id VARCHAR(50) NOT NULL REFERENCES quadro_lotacao(id) ON DELETE CASCADE,
  cargo_atual VARCHAR(200),
  cargo_novo VARCHAR(200),
  vagas_atuais INTEGER,
  vagas_solicitadas INTEGER,
  centro_custo_destino VARCHAR(50),
  impacto_orcamentario TEXT,
  analise_impacto TEXT,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'nivel_1', 'nivel_2', 'nivel_3', 'rh', 'aprovada', 'rejeitada')),
  anexos JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create aprovacoes table
CREATE TABLE aprovacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  aprovador_id VARCHAR(50) NOT NULL,
  acao VARCHAR(20) DEFAULT 'aguardando' CHECK (acao IN ('aprovado', 'rejeitado', 'aguardando')),
  comentario TEXT,
  data_acao TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_aprovacao_proposta_nivel UNIQUE (proposta_id, nivel)
);

-- Create indexes for better performance
CREATE INDEX idx_empresas_ativo ON empresas(ativo);
CREATE INDEX idx_planos_vagas_empresa_status ON planos_vagas(empresa_id, status);
CREATE INDEX idx_centros_custo_empresa_ativo ON centros_custo(empresa_id, ativo);
CREATE INDEX idx_postos_trabalho_centro_ativo ON postos_trabalho(centro_custo_id, ativo);
CREATE INDEX idx_cargos_ativo ON cargos(ativo);
CREATE INDEX idx_quadro_lotacao_plano ON quadro_lotacao(plano_vagas_id);
CREATE INDEX idx_quadro_lotacao_posto ON quadro_lotacao(posto_trabalho_id);
CREATE INDEX idx_quadro_lotacao_cargo ON quadro_lotacao(cargo_id);
CREATE INDEX idx_colaboradores_cargo ON colaboradores(cargo_id);
CREATE INDEX idx_colaboradores_centro ON colaboradores(centro_custo_id);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);
CREATE INDEX idx_colaboradores_pcd ON colaboradores(pcd);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_propostas_solicitante ON propostas(solicitante_id);
CREATE INDEX idx_aprovacoes_proposta ON aprovacoes(proposta_id);
CREATE INDEX idx_aprovacoes_aprovador ON aprovacoes(aprovador_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planos_vagas_updated_at BEFORE UPDATE ON planos_vagas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centros_custo_updated_at BEFORE UPDATE ON centros_custo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_postos_trabalho_updated_at BEFORE UPDATE ON postos_trabalho FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON cargos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quadro_lotacao_updated_at BEFORE UPDATE ON quadro_lotacao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON colaboradores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();