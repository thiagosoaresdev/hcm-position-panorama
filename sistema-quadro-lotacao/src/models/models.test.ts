import { describe, it, expect } from 'vitest';
import { 
  EmpresaModel, 
  PlanoVagasModel, 
  CentroCustoModel, 
  PostoTrabalhoModel, 
  CargoModel, 
  QuadroLotacaoModel, 
  ColaboradorModel, 
  PropostaModel, 
  AprovacaoModel, 
  AuditLogModel 
} from './index.js';

describe('Core Entity Models', () => {
  describe('EmpresaModel', () => {
    it('should create a valid empresa', () => {
      const empresa = new EmpresaModel(
        'emp_001',
        'Senior Sistemas S.A.',
        '12.345.678/0001-90',
        true
      );

      expect(empresa.id).toBe('emp_001');
      expect(empresa.nome).toBe('Senior Sistemas S.A.');
      expect(empresa.cnpj).toBe('12.345.678/0001-90');
      expect(empresa.ativo).toBe(true);
    });

    it('should validate required fields', () => {
      const empresa = new EmpresaModel('', '', '', true);
      const errors = empresa.validate();

      expect(errors).toContain('ID é obrigatório');
      expect(errors).toContain('Nome é obrigatório');
      expect(errors).toContain('CNPJ é obrigatório');
    });

    it('should validate CNPJ format', () => {
      const empresa = new EmpresaModel('emp_001', 'Test', 'invalid-cnpj', true);
      const errors = empresa.validate();

      expect(errors).toContain('CNPJ deve ter formato válido (XX.XXX.XXX/XXXX-XX)');
    });

    it('should convert to/from database format', () => {
      const empresa = new EmpresaModel(
        'emp_001',
        'Senior Sistemas S.A.',
        '12.345.678/0001-90',
        true
      );

      const dbData = empresa.toDatabase();
      expect(dbData.id).toBe('emp_001');
      expect(dbData.nome).toBe('Senior Sistemas S.A.');
      expect(dbData.cnpj).toBe('12.345.678/0001-90');
      expect(dbData.ativo).toBe(true);

      const fromDb = EmpresaModel.fromDatabase({
        id: 'emp_001',
        nome: 'Senior Sistemas S.A.',
        cnpj: '12.345.678/0001-90',
        ativo: true,
        configuracoes: null,
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(fromDb.id).toBe('emp_001');
      expect(fromDb.nome).toBe('Senior Sistemas S.A.');
    });
  });

  describe('PlanoVagasModel', () => {
    it('should create a valid plano de vagas', () => {
      const plano = new PlanoVagasModel(
        'plano_2025',
        'emp_001',
        'Plano 2025',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        'ativo'
      );

      expect(plano.id).toBe('plano_2025');
      expect(plano.empresaId).toBe('emp_001');
      expect(plano.nome).toBe('Plano 2025');
      expect(plano.status).toBe('ativo');
    });

    it('should validate date range', () => {
      const plano = new PlanoVagasModel(
        'plano_2025',
        'emp_001',
        'Plano 2025',
        new Date('2025-12-31'),
        new Date('2025-01-01'), // End before start
        'ativo'
      );

      const errors = plano.validate();
      expect(errors).toContain('Data de fim deve ser posterior à data de início');
    });

    it('should calculate duration in days', () => {
      const plano = new PlanoVagasModel(
        'plano_2025',
        'emp_001',
        'Plano 2025',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        'ativo'
      );

      expect(plano.getDurationInDays()).toBe(31);
    });
  });

  describe('QuadroLotacaoModel', () => {
    it('should create a valid quadro de lotação', () => {
      const quadro = new QuadroLotacaoModel(
        'ql_001',
        'plano_2025',
        'pt_dev_fs',
        'cargo_dev_pleno',
        10, // vagas previstas
        8,  // vagas efetivas
        1,  // vagas reservadas
        new Date('2025-01-01'),
        'diario'
      );

      expect(quadro.id).toBe('ql_001');
      expect(quadro.vagasPrevistas).toBe(10);
      expect(quadro.vagasEfetivas).toBe(8);
      expect(quadro.vagasReservadas).toBe(1);
    });

    it('should calculate available positions', () => {
      const quadro = new QuadroLotacaoModel(
        'ql_001',
        'plano_2025',
        'pt_dev_fs',
        'cargo_dev_pleno',
        10, // vagas previstas
        8,  // vagas efetivas
        1,  // vagas reservadas
        new Date('2025-01-01'),
        'diario'
      );

      expect(quadro.getVagasDisponiveis()).toBe(1); // 10 - 8 - 1 = 1
    });

    it('should calculate occupancy rate', () => {
      const quadro = new QuadroLotacaoModel(
        'ql_001',
        'plano_2025',
        'pt_dev_fs',
        'cargo_dev_pleno',
        10, // vagas previstas
        8,  // vagas efetivas
        1,  // vagas reservadas
        new Date('2025-01-01'),
        'diario'
      );

      expect(quadro.getTaxaOcupacao()).toBe(80); // 8/10 * 100 = 80%
    });

    it('should detect deficit', () => {
      const quadro = new QuadroLotacaoModel(
        'ql_001',
        'plano_2025',
        'pt_dev_fs',
        'cargo_dev_pleno',
        10, // vagas previstas
        12, // vagas efetivas (more than predicted)
        0,  // vagas reservadas
        new Date('2025-01-01'),
        'diario'
      );

      expect(quadro.hasDeficit()).toBe(true);
      expect(quadro.getDeficit()).toBe(2); // 12 - 10 = 2
    });

    it('should validate negative values', () => {
      const quadro = new QuadroLotacaoModel(
        'ql_001',
        'plano_2025',
        'pt_dev_fs',
        'cargo_dev_pleno',
        -1, // negative vagas previstas
        8,
        1,
        new Date('2025-01-01'),
        'diario'
      );

      const errors = quadro.validate();
      expect(errors).toContain('Vagas previstas não pode ser negativo');
    });
  });

  describe('ColaboradorModel', () => {
    it('should create a valid colaborador', () => {
      const colaborador = new ColaboradorModel(
        'col_001',
        'João Silva',
        '123.456.789-00',
        'cargo_dev_pleno',
        'cc_ti',
        'Integral',
        new Date('2024-01-15'),
        false,
        'ativo'
      );

      expect(colaborador.id).toBe('col_001');
      expect(colaborador.nome).toBe('João Silva');
      expect(colaborador.pcd).toBe(false);
      expect(colaborador.status).toBe('ativo');
    });

    it('should calculate time at company', () => {
      const admissionDate = new Date();
      admissionDate.setDate(admissionDate.getDate() - 365); // 1 year ago

      const colaborador = new ColaboradorModel(
        'col_001',
        'João Silva',
        '123.456.789-00',
        'cargo_dev_pleno',
        'cc_ti',
        'Integral',
        admissionDate,
        false,
        'ativo'
      );

      expect(colaborador.getTempoEmpresaAnos()).toBe(1);
    });

    it('should validate CPF format', () => {
      const colaborador = new ColaboradorModel(
        'col_001',
        'João Silva',
        'invalid-cpf',
        'cargo_dev_pleno',
        'cc_ti',
        'Integral',
        new Date(),
        false,
        'ativo'
      );

      const errors = colaborador.validate();
      expect(errors).toContain('CPF deve ter formato válido (XXX.XXX.XXX-XX)');
    });
  });

  describe('PropostaModel', () => {
    it('should create a valid proposta', () => {
      const proposta = new PropostaModel(
        'prop_001',
        'inclusao',
        'Inclusão de nova vaga',
        'Detalhamento da proposta',
        'user_001',
        'ql_001',
        'rascunho'
      );

      expect(proposta.id).toBe('prop_001');
      expect(proposta.tipo).toBe('inclusao');
      expect(proposta.status).toBe('rascunho');
    });

    it('should handle workflow transitions', () => {
      const proposta = new PropostaModel(
        'prop_001',
        'inclusao',
        'Inclusão de nova vaga',
        'Detalhamento da proposta',
        'user_001',
        'ql_001',
        'rascunho'
      );

      expect(proposta.canSubmit()).toBe(true);
      
      proposta.submit();
      expect(proposta.status).toBe('nivel_1');
      expect(proposta.getCurrentApprovalLevel()).toBe(1);

      proposta.approve('nivel_1');
      expect(proposta.status).toBe('nivel_2');
      expect(proposta.getCurrentApprovalLevel()).toBe(2);
    });

    it('should handle rejection', () => {
      const proposta = new PropostaModel(
        'prop_001',
        'inclusao',
        'Inclusão de nova vaga',
        'Detalhamento da proposta',
        'user_001',
        'ql_001',
        'nivel_1'
      );

      proposta.reject();
      expect(proposta.status).toBe('rascunho');
      expect(proposta.canEdit()).toBe(true);
    });

    it('should calculate variation in positions', () => {
      const proposta = new PropostaModel(
        'prop_001',
        'alteracao',
        'Alteração de vagas',
        'Detalhamento da proposta',
        'user_001',
        'ql_001',
        'rascunho'
      );

      proposta.vagasAtuais = 10;
      proposta.vagasSolicitadas = 15;

      expect(proposta.getVariacaoVagas()).toBe(5);
      expect(proposta.isIncreasing()).toBe(true);
      expect(proposta.isDecreasing()).toBe(false);
    });
  });

  describe('AuditLogModel', () => {
    it('should create a valid audit log', () => {
      const auditLog = new AuditLogModel(
        'audit_001',
        'ql_001',
        'quadro_lotacao',
        'update',
        'user_001',
        'João Silva',
        new Date(),
        'Atualização de vagas'
      );

      expect(auditLog.id).toBe('audit_001');
      expect(auditLog.entidadeId).toBe('ql_001');
      expect(auditLog.entidadeTipo).toBe('quadro_lotacao');
      expect(auditLog.acao).toBe('update');
    });

    it('should detect changed fields', () => {
      const auditLog = new AuditLogModel(
        'audit_001',
        'ql_001',
        'quadro_lotacao',
        'update',
        'user_001',
        'João Silva',
        new Date(),
        'Atualização de vagas',
        { vagas_previstas: 10, vagas_efetivas: 8 },
        { vagas_previstas: 12, vagas_efetivas: 8 }
      );

      const changedFields = auditLog.getChangedFields();
      expect(changedFields).toContain('vagas_previstas');
      expect(changedFields).not.toContain('vagas_efetivas');

      const change = auditLog.getFieldChange('vagas_previstas');
      expect(change?.before).toBe(10);
      expect(change?.after).toBe(12);
    });

    it('should generate action descriptions', () => {
      const auditLog = new AuditLogModel(
        'audit_001',
        'ql_001',
        'quadro_lotacao',
        'create',
        'user_001',
        'João Silva'
      );

      expect(auditLog.getActionDescription()).toBe('Criação');
      expect(auditLog.getSummary()).toContain('Criação de quadro_lotacao por João Silva');
    });
  });
});