/**
 * Demonstration of the Audit System
 * This file shows how to use the audit service in practice
 */

import { AuditService, type AuditContext } from './AuditService.js';
import { AuditUtils } from './AuditUtils.js';

// Mock pool for demonstration
const mockPool = {} as any;

/**
 * Example: Complete audit workflow for a quadro de lotação
 */
export async function demonstrateAuditWorkflow() {
  const auditService = new AuditService(mockPool);
  
  // 1. Create audit context
  const context: AuditContext = {
    userId: 'user123',
    userName: 'João Silva',
    motivo: 'Criação de nova vaga conforme aprovação #789',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'session_abc123'
  };

  // 2. Log entity creation
  const quadroData = {
    id: 'quadro_001',
    planoVagasId: 'plano_2025',
    postoTrabalhoId: 'posto_dev',
    cargoId: 'cargo_pleno',
    vagasPrevistas: 5,
    vagasEfetivas: 0,
    vagasReservadas: 0
  };

  await auditService.logCreate(
    'quadro_001',
    'QuadroLotacao',
    context,
    quadroData
  );

  // 3. Log entity update
  const valoresAntes = { ...quadroData };
  const valoresDepois = { ...quadroData, vagasPrevistas: 8 };

  await auditService.logUpdate(
    'quadro_001',
    'QuadroLotacao',
    {
      ...context,
      motivo: 'Aumento de vagas: 5 → 8 conforme demanda'
    },
    valoresAntes,
    valoresDepois
  );

  // 4. Log approval
  await auditService.logApproval(
    'proposta_456',
    'Proposta',
    context,
    'aprovador_789',
    'Aprovado após análise orçamentária'
  );

  // 5. Log system action (automated)
  await auditService.logSystemAction(
    'quadro_001',
    'QuadroLotacao',
    'normalizacao',
    'Normalização automática - Admissão de Maria Santos via webhook RH Legado'
  );

  // 6. Query audit trail
  const auditTrail = await auditService.getAuditTrail('quadro_001', 'QuadroLotacao');
  console.log('Audit Trail:', auditTrail);

  // 7. Search audit logs
  const searchResults = await auditService.searchAuditLogs({
    entidadeTipo: 'QuadroLotacao',
    acao: 'update',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    limit: 10
  });
  console.log('Search Results:', searchResults);

  // 8. Get audit statistics
  const stats = await auditService.getAuditStats();
  console.log('Audit Statistics:', stats);

  return {
    message: 'Audit workflow demonstration completed',
    auditTrail,
    searchResults,
    stats
  };
}

/**
 * Example: Using audit utilities
 */
export function demonstrateAuditUtils() {
  // Compare objects and find changes
  const before = {
    vagasPrevistas: 5,
    vagasEfetivas: 3,
    observacoes: 'Vaga inicial'
  };

  const after = {
    vagasPrevistas: 8,
    vagasEfetivas: 3,
    observacoes: 'Vaga expandida'
  };

  const changes = AuditUtils.getChangedFields(before, after);
  console.log('Changed fields:', changes);
  // Output: { vagasPrevistas: { before: 5, after: 8 }, observacoes: { before: 'Vaga inicial', after: 'Vaga expandida' } }

  // Sanitize sensitive data
  const sensitiveData = {
    nome: 'João Silva',
    cpf: '123.456.789-00',
    password: 'secret123',
    cargo: 'Desenvolvedor'
  };

  const sanitized = AuditUtils.sanitizeAuditData(sensitiveData);
  console.log('Sanitized data:', sanitized);
  // Output: { nome: 'João Silva', cpf: '[REDACTED]', password: '[REDACTED]', cargo: 'Desenvolvedor' }

  // Generate standard motivo
  const motivo = AuditUtils.generateMotivo('Atualização', 'Quadro de Lotação', 'Aumento de vagas');
  console.log('Generated motivo:', motivo);
  // Output: "Atualização de Quadro de Lotação: Aumento de vagas"

  // Create audit context from user session
  const user = { id: 'user123', nome: 'João Silva' };
  const request = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0', sessionId: 'session123' };
  
  const context = AuditUtils.createAuditContext(user, 'Teste de auditoria', request);
  console.log('Audit context:', context);

  return {
    changes,
    sanitized,
    motivo,
    context
  };
}

/**
 * Example: Audit context validation
 */
export function demonstrateAuditValidation() {
  // Valid context
  const validContext: AuditContext = {
    userId: 'user123',
    userName: 'João Silva',
    motivo: 'Teste de validação'
  };

  const validErrors = AuditUtils.validateAuditContext(validContext);
  console.log('Valid context errors:', validErrors); // []

  // Invalid context
  const invalidContext: AuditContext = {
    userId: '',
    userName: '',
    motivo: 'Teste de validação'
  };

  const invalidErrors = AuditUtils.validateAuditContext(invalidContext);
  console.log('Invalid context errors:', invalidErrors);
  // ['User ID é obrigatório no contexto de auditoria', 'Nome do usuário é obrigatório no contexto de auditoria']

  return {
    validErrors,
    invalidErrors
  };
}

/**
 * Example: Complete business operation with audit
 */
export async function demonstrateBusinessOperationWithAudit() {
  const auditService = new AuditService(mockPool);
  
  const context: AuditContext = {
    userId: 'manager123',
    userName: 'Ana Gerente',
    motivo: 'Aprovação de expansão do quadro TI'
  };

  // Simulate a complex business operation with multiple audit points
  return await auditService.withAuditContext(context, async () => {
    // Step 1: Create proposal
    await auditService.logCreate(
      'proposta_789',
      'Proposta',
      context,
      {
        tipo: 'inclusao',
        descricao: 'Inclusão de 3 vagas de desenvolvedor',
        solicitante: 'manager123'
      }
    );

    // Step 2: Approval workflow
    await auditService.logApproval(
      'proposta_789',
      'Proposta',
      context,
      'diretor456',
      'Aprovado - demanda justificada'
    );

    // Step 3: Apply changes to quadro
    await auditService.logUpdate(
      'quadro_001',
      'QuadroLotacao',
      context,
      { vagasPrevistas: 5 },
      { vagasPrevistas: 8 }
    );

    // Step 4: System notification
    await auditService.logSystemAction(
      'notification_001',
      'Notification',
      'notificacao_enviada',
      'Notificação enviada para RH sobre aprovação da proposta #789'
    );

    return {
      message: 'Business operation completed with full audit trail',
      proposalId: 'proposta_789',
      quadroId: 'quadro_001'
    };
  });
}

// Export all demonstration functions
export const AuditDemo = {
  demonstrateAuditWorkflow,
  demonstrateAuditUtils,
  demonstrateAuditValidation,
  demonstrateBusinessOperationWithAudit
};