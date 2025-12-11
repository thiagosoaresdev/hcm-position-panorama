/**
 * Exemplo de uso do sistema de conformidade PcD
 * Demonstra como calcular conformidade, gerar alertas e relatórios
 */

import { PcDComplianceService } from '../services/PcDComplianceService.js';
import { ColaboradorModel } from '../models/Colaborador.js';
import { AuditService } from '../services/AuditService.js';
import { NotificationService } from '../services/NotificationService.js';

// Mock services para o exemplo
const mockAuditService = {
  logAction: async (action: any) => {
    console.log('📋 Auditoria registrada:', action.acao, 'para', action.entidadeId);
  }
} as AuditService;

const mockNotificationService = {
  sendEmail: async (notification: any) => {
    console.log('📧 Email enviado para:', notification.recipient);
    console.log('   Assunto:', notification.subject);
  },
  sendInApp: async (notification: any) => {
    console.log('🔔 Notificação in-app para:', notification.userId);
    console.log('   Título:', notification.title);
  }
} as NotificationService;

export async function demonstratePcDCompliance() {
  console.log('🏢 === DEMONSTRAÇÃO DO SISTEMA DE CONFORMIDADE PcD ===\n');

  const pcdService = new PcDComplianceService(mockAuditService, mockNotificationService);

  // Cenário 1: Empresa com 100 colaboradores (2% obrigatório)
  console.log('📊 Cenário 1: Empresa com 100 colaboradores');
  const colaboradores100 = Array.from({ length: 100 }, (_, i) => 
    new ColaboradorModel(
      `emp_${i}`,
      `Colaborador ${i}`,
      `123.456.789-${i.toString().padStart(2, '0')}`,
      'cargo1',
      'cc1',
      'manhã',
      new Date('2020-01-01'),
      i < 1 // Apenas 1 PcD (déficit de 1)
    )
  );

  const compliance100 = await pcdService.calculateCompliance('empresa1', colaboradores100);
  console.log(`   Total colaboradores: ${compliance100.totalColaboradores}`);
  console.log(`   Total PcD: ${compliance100.totalPcD}`);
  console.log(`   Percentual obrigatório: ${compliance100.percentualObrigatorio}%`);
  console.log(`   Quantidade obrigatória: ${compliance100.quantidadeObrigatoria}`);
  console.log(`   Déficit: ${compliance100.deficit}`);
  console.log(`   Conforme: ${compliance100.conforme ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Faixa Lei: ${compliance100.faixaLei}\n`);

  // Monitorar conformidade e gerar alertas
  console.log('🚨 Monitoramento de alertas:');
  const alerts100 = await pcdService.monitorCompliance('empresa1', colaboradores100);
  alerts100.forEach(alert => {
    const icon = alert.prioridade === 'critica' ? '🚨' : alert.prioridade === 'alta' ? '⚠️' : 'ℹ️';
    console.log(`   ${icon} ${alert.tipo.toUpperCase()} (${alert.prioridade}): ${alert.mensagem}`);
    if (alert.acoesSugeridas.length > 0) {
      console.log('      Ações sugeridas:');
      alert.acoesSugeridas.forEach(acao => console.log(`      - ${acao}`));
    }
  });
  console.log();

  // Cenário 2: Empresa com 300 colaboradores (3% obrigatório)
  console.log('📊 Cenário 2: Empresa com 300 colaboradores');
  const colaboradores300 = Array.from({ length: 300 }, (_, i) => 
    new ColaboradorModel(
      `emp_${i}`,
      `Colaborador ${i}`,
      `123.456.789-${i.toString().padStart(2, '0')}`,
      'cargo1',
      'cc1',
      'manhã',
      new Date('2020-01-01'),
      i < 9 // 9 PcD (exatamente o obrigatório)
    )
  );

  const compliance300 = await pcdService.calculateCompliance('empresa2', colaboradores300);
  console.log(`   Total colaboradores: ${compliance300.totalColaboradores}`);
  console.log(`   Total PcD: ${compliance300.totalPcD}`);
  console.log(`   Percentual obrigatório: ${compliance300.percentualObrigatorio}%`);
  console.log(`   Quantidade obrigatória: ${compliance300.quantidadeObrigatoria}`);
  console.log(`   Déficit: ${compliance300.deficit}`);
  console.log(`   Conforme: ${compliance300.conforme ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Faixa Lei: ${compliance300.faixaLei}\n`);

  // Cenário 3: Projeção de conformidade
  console.log('🔮 Cenário 3: Projeção de conformidade');
  const cenarios = {
    novasContratacoes: 50,
    novasContratacoesPcD: 3,
    desligamentos: 10,
    desligamentosPcD: 1
  };

  const projection = await pcdService.projectCompliance('empresa2', colaboradores300, cenarios);
  console.log('   Cenário projetado:');
  console.log(`   - Novas contratações: ${cenarios.novasContratacoes} (${cenarios.novasContratacoesPcD} PcD)`);
  console.log(`   - Desligamentos: ${cenarios.desligamentos} (${cenarios.desligamentosPcD} PcD)`);
  console.log('   Resultado projetado:');
  console.log(`   - Total colaboradores: ${projection.totalColaboradores}`);
  console.log(`   - Total PcD: ${projection.totalPcD}`);
  console.log(`   - Percentual obrigatório: ${projection.percentualObrigatorio}%`);
  console.log(`   - Quantidade obrigatória: ${projection.quantidadeObrigatoria}`);
  console.log(`   - Conforme: ${projection.conforme ? '✅ SIM' : '❌ NÃO'}\n`);

  // Cenário 4: Atualização de status PcD
  console.log('👤 Cenário 4: Atualização de status PcD');
  const colaborador = colaboradores100[0];
  console.log(`   Colaborador: ${colaborador.nome}`);
  console.log(`   Status PcD atual: ${colaborador.pcd ? 'SIM' : 'NÃO'}`);
  
  try {
    await pcdService.updatePcDStatus(
      colaborador, 
      true, 
      'user123', 
      'Apresentação de laudo médico',
      ['laudo_medico.pdf', 'documento_identidade.pdf']
    );
    console.log(`   Status PcD atualizado: ${colaborador.pcd ? '✅ SIM' : '❌ NÃO'}`);
  } catch (error) {
    console.log(`   ❌ Erro ao atualizar: ${error.message}`);
  }
  console.log();

  // Cenário 5: Relatório completo
  console.log('📄 Cenário 5: Geração de relatório');
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  const report = await pcdService.generateComplianceReport('empresa1', colaboradores100, startDate, endDate);
  console.log(`   Empresa: ${report.empresaId}`);
  console.log(`   Período: ${report.periodo.inicio.toLocaleDateString()} a ${report.periodo.fim.toLocaleDateString()}`);
  console.log(`   Conformidade: ${report.compliance.conforme ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Alertas: ${report.alertas.length}`);
  console.log(`   Recomendações: ${report.recomendacoes.length}`);
  console.log('   Principais recomendações:');
  report.recomendacoes.slice(0, 3).forEach(rec => console.log(`   - ${rec}`));
  console.log(`   Gerado em: ${report.geradoEm.toLocaleString()}\n`);

  console.log('✅ Demonstração concluída com sucesso!');
}

// Executar demonstração se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstratePcDCompliance().catch(console.error);
}