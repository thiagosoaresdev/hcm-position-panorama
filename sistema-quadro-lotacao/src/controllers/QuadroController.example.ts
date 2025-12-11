/**
 * Example usage of QuadroController
 * This file demonstrates how to use the QuadroController in a real application
 */

import { QuadroController, type HttpRequest, type HttpResponse } from './QuadroController.js';
import type { Pool } from 'pg';

// Example: Setting up the controller with a database pool
export function setupQuadroController(pool: Pool): QuadroController {
  return new QuadroController(pool);
}

// Example: Creating a mock request for testing
export function createMockRequest(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    params: {},
    body: {},
    query: {},
    user: {
      id: 'user123',
      nome: 'Test User',
      email: 'test@example.com',
      roles: ['admin'],
      permissions: ['quadro:create', 'quadro:update', 'quadro:delete']
    },
    ...overrides
  };
}

// Example: Creating a mock response for testing
export function createMockResponse(): HttpResponse {
  const response = {
    statusCode: 200,
    data: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.data = data;
      return this;
    }
  };
  
  return response;
}

// Example: Usage in an Express-like application
export async function exampleUsage() {
  // This would typically be done in your application setup
  const pool = {} as Pool; // Your actual database pool
  const controller = setupQuadroController(pool);

  // Example 1: Creating a new vaga
  const createRequest = createMockRequest({
    body: {
      id: 'vaga-001',
      planoVagasId: 'plano-2025',
      postoTrabalhoId: 'posto-dev',
      cargoId: 'cargo-dev-pleno',
      vagasPrevistas: 5,
      dataInicioControle: '2025-01-01',
      tipoControle: 'diario',
      motivo: 'Expansão da equipe de desenvolvimento'
    }
  });

  const createResponse = createMockResponse();
  
  try {
    await controller.createVaga(createRequest, createResponse);
    console.log('Create Response:', createResponse.data);
  } catch (error) {
    console.error('Error creating vaga:', error);
  }

  // Example 2: Updating vagas previstas
  const updateRequest = createMockRequest({
    params: { id: 'vaga-001' },
    body: {
      vagasPrevistas: 8,
      motivo: 'Aumento da demanda'
    }
  });

  const updateResponse = createMockResponse();
  
  try {
    await controller.updateVaga(updateRequest, updateResponse);
    console.log('Update Response:', updateResponse.data);
  } catch (error) {
    console.error('Error updating vaga:', error);
  }

  // Example 3: Getting occupancy statistics
  const statsRequest = createMockRequest({
    params: { planoVagasId: 'plano-2025' }
  });

  const statsResponse = createMockResponse();
  
  try {
    await controller.getOccupancyStats(statsRequest, statsResponse);
    console.log('Stats Response:', statsResponse.data);
  } catch (error) {
    console.error('Error getting stats:', error);
  }

  // Example 4: Admitting a colaborador
  const admitRequest = createMockRequest({
    params: { id: 'vaga-001' },
    body: {
      motivo: 'Nova contratação aprovada'
    }
  });

  const admitResponse = createMockResponse();
  
  try {
    await controller.admitirColaborador(admitRequest, admitResponse);
    console.log('Admit Response:', admitResponse.data);
  } catch (error) {
    console.error('Error admitting colaborador:', error);
  }

  // Example 5: Soft deleting a vaga
  const deleteRequest = createMockRequest({
    params: { id: 'vaga-001' },
    body: {
      motivo: 'Reestruturação organizacional'
    }
  });

  const deleteResponse = createMockResponse();
  
  try {
    await controller.deleteVaga(deleteRequest, deleteResponse);
    console.log('Delete Response:', deleteResponse.data);
  } catch (error) {
    console.error('Error deleting vaga:', error);
  }
}

// Example: Error handling patterns
export function handleControllerError(error: Error, operation: string): void {
  console.error(`Error in ${operation}:`, error.message);
  
  // Common error patterns to handle:
  if (error.message.includes('Já existe uma vaga')) {
    // Handle uniqueness constraint violation
    console.log('Uniqueness constraint violated - vaga already exists');
  } else if (error.message.includes('não encontrado')) {
    // Handle not found errors
    console.log('Resource not found');
  } else if (error.message.includes('déficit')) {
    // Handle business rule violations
    console.log('Business rule violation - would create deficit');
  } else if (error.message.includes('colaboradores ativos')) {
    // Handle deletion constraints
    console.log('Cannot delete - has active employees');
  } else {
    // Handle unexpected errors
    console.log('Unexpected error occurred');
  }
}

// Example: Validation helpers
export function validateCreateVagaRequest(body: any): string[] {
  const errors: string[] = [];
  
  if (!body.id) errors.push('ID é obrigatório');
  if (!body.planoVagasId) errors.push('Plano de vagas é obrigatório');
  if (!body.postoTrabalhoId) errors.push('Posto de trabalho é obrigatório');
  if (!body.cargoId) errors.push('Cargo é obrigatório');
  if (!body.vagasPrevistas || body.vagasPrevistas < 1) {
    errors.push('Vagas previstas deve ser maior que zero');
  }
  if (!body.dataInicioControle) errors.push('Data de início do controle é obrigatória');
  
  return errors;
}

// Example: Response formatting helpers
export function formatSuccessResponse<T>(data: T, message: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function formatErrorResponse(message: string, details?: any) {
  return {
    success: false,
    data: null,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}