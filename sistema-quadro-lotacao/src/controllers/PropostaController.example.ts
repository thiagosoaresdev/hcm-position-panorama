/**
 * PropostaController Usage Examples
 * 
 * This file demonstrates how to use the PropostaController endpoints
 * for managing proposals in the Sistema de Gestão de Quadro de Lotação
 */

import { PropostaController } from './PropostaController.js';
import type { Pool } from 'pg';

// Example usage scenarios for the PropostaController

/**
 * Example 1: Creating a new proposta
 */
export async function exampleCreateProposta(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: {},
    query: {},
    body: {
      tipo: 'inclusao',
      descricao: 'Criação de nova vaga para Desenvolvedor Senior',
      detalhamento: 'Necessidade de reforçar a equipe de desenvolvimento com profissional experiente em React e Node.js',
      solicitanteId: 'user-123',
      quadroLotacaoId: 'quadro-456',
      cargoNovo: 'Desenvolvedor Senior',
      vagasSolicitadas: 2,
      impactoOrcamentario: 'R$ 24.000,00 mensais (2 vagas x R$ 12.000)',
      analiseImpacto: 'Impacto positivo na produtividade da equipe e entrega de projetos',
      motivo: 'Expansão da equipe de desenvolvimento'
    },
    user: {
      id: 'user-123',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:create']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.createProposta(mockRequest as any, mockResponse as any);
}

/**
 * Example 2: Submitting proposta for approval
 */
export async function exampleSubmitProposta(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: { id: 'proposta-789' },
    query: {},
    body: {
      workflowConfig: {
        niveis: [
          { ordem: 1, nome: 'Coordenação', aprovadores: ['coord-001'] },
          { ordem: 2, nome: 'Gerência', aprovadores: ['gerente-001'] },
          { ordem: 3, nome: 'Diretoria', aprovadores: ['diretor-001'] }
        ],
        incluirRH: true
      },
      motivo: 'Envio para aprovação após revisão dos dados'
    },
    user: {
      id: 'user-123',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:submit']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Submit Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.submitProposta(mockRequest as any, mockResponse as any);
}

/**
 * Example 3: Approving a proposta
 */
export async function exampleApproveProposta(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: { id: 'proposta-789' },
    query: {},
    body: {
      aprovadorId: 'coord-001',
      comentario: 'Proposta aprovada. Justificativa bem fundamentada e impacto orçamentário adequado.',
      motivo: 'Aprovação no nível de coordenação'
    },
    user: {
      id: 'coord-001',
      nome: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:approve']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Approval Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.approveProposta(mockRequest as any, mockResponse as any);
}

/**
 * Example 4: Rejecting a proposta
 */
export async function exampleRejectProposta(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: { id: 'proposta-789' },
    query: {},
    body: {
      aprovadorId: 'gerente-001',
      comentario: 'Proposta rejeitada. Necessário revisar o impacto orçamentário e incluir mais detalhes sobre a necessidade.',
      motivo: 'Informações insuficientes sobre justificativa orçamentária'
    },
    user: {
      id: 'gerente-001',
      nome: 'Carlos Oliveira',
      email: 'carlos.oliveira@empresa.com',
      roles: ['gerente'],
      permissions: ['proposta:approve']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Rejection Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.rejectProposta(mockRequest as any, mockResponse as any);
}

/**
 * Example 5: Listing propostas with filters
 */
export async function exampleListPropostas(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: {},
    query: {
      status: 'nivel_1',
      tipo: 'inclusao',
      createdAfter: '2024-01-01',
      createdBefore: '2024-12-31'
    },
    body: {},
    user: {
      id: 'user-123',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:read']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`List Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.listPropostas(mockRequest as any, mockResponse as any);
}

/**
 * Example 6: Getting pending propostas for approval
 */
export async function exampleGetPendingPropostas(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: {},
    query: {},
    body: {},
    user: {
      id: 'coord-001',
      nome: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:approve']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Pending Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.getPendingPropostas(mockRequest as any, mockResponse as any);
}

/**
 * Example 7: Getting proposta with approval history
 */
export async function exampleGetPropostaWithHistory(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: { id: 'proposta-789' },
    query: { includeHistory: 'true' },
    body: {},
    user: {
      id: 'user-123',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      roles: ['coordenador'],
      permissions: ['proposta:read']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`History Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.getPropostaById(mockRequest as any, mockResponse as any);
}

/**
 * Example 8: Getting propostas statistics
 */
export async function exampleGetStatistics(pool: Pool) {
  const controller = new PropostaController(pool);

  const mockRequest = {
    params: {},
    query: {},
    body: {},
    user: {
      id: 'admin-001',
      nome: 'Admin User',
      email: 'admin@empresa.com',
      roles: ['admin'],
      permissions: ['proposta:stats']
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Statistics Response ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.getStatistics(mockRequest as any, mockResponse as any);
}

/**
 * Example workflow: Complete proposal lifecycle
 */
export async function exampleCompleteWorkflow(pool: Pool) {
  console.log('=== Complete Proposal Workflow Example ===\n');

  console.log('1. Creating new proposta...');
  await exampleCreateProposta(pool);

  console.log('\n2. Submitting proposta for approval...');
  await exampleSubmitProposta(pool);

  console.log('\n3. First level approval (Coordenação)...');
  await exampleApproveProposta(pool);

  console.log('\n4. Getting pending propostas for next approver...');
  await exampleGetPendingPropostas(pool);

  console.log('\n5. Checking proposta history...');
  await exampleGetPropostaWithHistory(pool);

  console.log('\n6. Getting system statistics...');
  await exampleGetStatistics(pool);

  console.log('\n=== Workflow Complete ===');
}

/**
 * Example error scenarios
 */
export async function exampleErrorScenarios(pool: Pool) {
  const controller = new PropostaController(pool);

  console.log('=== Error Scenarios Examples ===\n');

  // 1. Invalid data
  console.log('1. Testing validation error...');
  const invalidRequest = {
    params: {},
    query: {},
    body: {
      tipo: 'inclusao',
      descricao: '', // Empty description - should fail validation
      detalhamento: 'Test',
      quadroLotacaoId: 'quadro-456'
    },
    user: { id: 'user-123', nome: 'Test User' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Validation Error ${code}:`, JSON.stringify(data, null, 2));
        return mockResponse;
      }
    })
  };

  await controller.createProposta(invalidRequest as any, mockResponse as any);

  // 2. Unauthorized approval
  console.log('\n2. Testing unauthorized approval...');
  const unauthorizedRequest = {
    params: { id: 'proposta-789' },
    query: {},
    body: {
      aprovadorId: 'wrong-user',
      comentario: 'Trying to approve'
    },
    user: { id: 'wrong-user', nome: 'Wrong User' }
  };

  await controller.approveProposta(unauthorizedRequest as any, mockResponse as any);

  console.log('\n=== Error Scenarios Complete ===');
}

// Export all examples for easy testing
export const examples = {
  createProposta: exampleCreateProposta,
  submitProposta: exampleSubmitProposta,
  approveProposta: exampleApproveProposta,
  rejectProposta: exampleRejectProposta,
  listPropostas: exampleListPropostas,
  getPendingPropostas: exampleGetPendingPropostas,
  getPropostaWithHistory: exampleGetPropostaWithHistory,
  getStatistics: exampleGetStatistics,
  completeWorkflow: exampleCompleteWorkflow,
  errorScenarios: exampleErrorScenarios
};