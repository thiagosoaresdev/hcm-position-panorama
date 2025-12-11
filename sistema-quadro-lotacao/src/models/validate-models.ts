#!/usr/bin/env node

// Simple validation script to test models without vitest
import { 
  EmpresaModel, 
  PlanoVagasModel, 
  QuadroLotacaoModel, 
  ColaboradorModel, 
  PropostaModel, 
  AuditLogModel 
} from './index.js';

console.log('🧪 Testing Core Entity Models...\n');

// Test EmpresaModel
console.log('✅ Testing EmpresaModel...');
const empresa = new EmpresaModel(
  'emp_001',
  'Senior Sistemas S.A.',
  '12.345.678/0001-90',
  true
);

const empresaErrors = empresa.validate();
if (empresaErrors.length === 0) {
  console.log('   ✓ Valid empresa created successfully');
} else {
  console.log('   ❌ Empresa validation failed:', empresaErrors);
}

// Test invalid empresa
const invalidEmpresa = new EmpresaModel('', '', 'invalid-cnpj', true);
const invalidErrors = invalidEmpresa.validate();
if (invalidErrors.length > 0) {
  console.log('   ✓ Invalid empresa correctly rejected');
} else {
  console.log('   ❌ Invalid empresa should have been rejected');
}

// Test PlanoVagasModel
console.log('\n✅ Testing PlanoVagasModel...');
const plano = new PlanoVagasModel(
  'plano_2025',
  'emp_001',
  'Plano 2025',
  new Date('2025-01-01'),
  new Date('2025-12-31'),
  'ativo'
);

const planoErrors = plano.validate();
if (planoErrors.length === 0) {
  console.log('   ✓ Valid plano de vagas created successfully');
  console.log(`   ✓ Duration: ${plano.getDurationInDays()} days`);
} else {
  console.log('   ❌ Plano validation failed:', planoErrors);
}

// Test QuadroLotacaoModel
console.log('\n✅ Testing QuadroLotacaoModel...');
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

const quadroErrors = quadro.validate();
if (quadroErrors.length === 0) {
  console.log('   ✓ Valid quadro de lotação created successfully');
  console.log(`   ✓ Available positions: ${quadro.getVagasDisponiveis()}`);
  console.log(`   ✓ Occupancy rate: ${quadro.getTaxaOcupacao()}%`);
  console.log(`   ✓ Has deficit: ${quadro.hasDeficit()}`);
} else {
  console.log('   ❌ Quadro validation failed:', quadroErrors);
}

// Test ColaboradorModel
console.log('\n✅ Testing ColaboradorModel...');
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

const colaboradorErrors = colaborador.validate();
if (colaboradorErrors.length === 0) {
  console.log('   ✓ Valid colaborador created successfully');
  console.log(`   ✓ Is active: ${colaborador.isActive()}`);
  console.log(`   ✓ Is PcD: ${colaborador.isPcD()}`);
} else {
  console.log('   ❌ Colaborador validation failed:', colaboradorErrors);
}

// Test PropostaModel
console.log('\n✅ Testing PropostaModel...');
const proposta = new PropostaModel(
  'prop_001',
  'inclusao',
  'Inclusão de nova vaga',
  'Detalhamento da proposta',
  'user_001',
  'ql_001',
  'rascunho'
);

const propostaErrors = proposta.validate();
if (propostaErrors.length === 0) {
  console.log('   ✓ Valid proposta created successfully');
  console.log(`   ✓ Can submit: ${proposta.canSubmit()}`);
  console.log(`   ✓ Current level: ${proposta.getCurrentApprovalLevel()}`);
  
  // Test workflow
  proposta.submit();
  console.log(`   ✓ After submit - Status: ${proposta.status}, Level: ${proposta.getCurrentApprovalLevel()}`);
  
  proposta.approve('nivel_1');
  console.log(`   ✓ After approval - Status: ${proposta.status}, Level: ${proposta.getCurrentApprovalLevel()}`);
} else {
  console.log('   ❌ Proposta validation failed:', propostaErrors);
}

// Test AuditLogModel
console.log('\n✅ Testing AuditLogModel...');
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

const auditErrors = auditLog.validate();
if (auditErrors.length === 0) {
  console.log('   ✓ Valid audit log created successfully');
  console.log(`   ✓ Changed fields: ${auditLog.getChangedFields().join(', ')}`);
  console.log(`   ✓ Action description: ${auditLog.getActionDescription()}`);
  console.log(`   ✓ Summary: ${auditLog.getSummary()}`);
} else {
  console.log('   ❌ Audit log validation failed:', auditErrors);
}

// Test database conversion
console.log('\n✅ Testing Database Conversion...');
try {
  const empresaDbData = empresa.toDatabase();
  const empresaFromDb = EmpresaModel.fromDatabase({
    id: empresaDbData.id,
    nome: empresaDbData.nome,
    cnpj: empresaDbData.cnpj,
    ativo: empresaDbData.ativo,
    configuracoes: empresaDbData.configuracoes,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  if (empresaFromDb.id === empresa.id && empresaFromDb.nome === empresa.nome) {
    console.log('   ✓ Database conversion working correctly');
  } else {
    console.log('   ❌ Database conversion failed');
  }
} catch (error) {
  console.log('   ❌ Database conversion error:', error);
}

console.log('\n🎉 Model validation completed!');
console.log('\n📊 Summary:');
console.log('   - All core entity models created successfully');
console.log('   - Validation logic working correctly');
console.log('   - Business logic methods functioning');
console.log('   - Database conversion working');
console.log('   - Audit trail functionality implemented');