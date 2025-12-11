/**
 * Webhook Integration Example
 * 
 * This example demonstrates how to integrate with the RH Legado system
 * using webhooks for real-time colaborador event processing.
 * 
 * Requirements: 10.1, 10.2, 10.5 - Webhook processing with cargo discrepancy handling
 */

import { Pool } from 'pg';
import { WebhookController, WebhookPayload, WebhookConfig } from '../controllers/WebhookController.js';
import { createWebhookRoutes } from '../routes/webhooks.js';
import express from 'express';
import crypto from 'crypto';

// Example webhook configuration
const webhookConfig: WebhookConfig = {
  secretKey: process.env.WEBHOOK_SECRET_KEY || 'your-secret-key-here',
  retryAttempts: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 10000
};

// Example: Setting up webhook routes in Express app
export function setupWebhookIntegration(app: express.Application, pool: Pool) {
  // Add webhook routes
  app.use('/api/webhooks', createWebhookRoutes(pool));
  
  // Add middleware for webhook signature validation
  app.use('/api/webhooks', express.json({ limit: '10mb' }));
  
  console.log('Webhook endpoints configured:');
  console.log('  POST /api/webhooks/colaborador/admitido');
  console.log('  POST /api/webhooks/colaborador/transferido');
  console.log('  POST /api/webhooks/colaborador/desligado');
  console.log('  GET  /api/webhooks/health');
}

// Example: Simulating webhook payloads from RH Legado system
export class WebhookSimulator {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Generate webhook signature for payload
   */
  private generateSignature(payload: any): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Simulate colaborador admission webhook
   */
  createAdmissionWebhook(colaboradorData: {
    colaborador_id: string;
    nome: string;
    cpf: string;
    cargo_id: string;
    centro_custo_id: string;
    turno: string;
    data_admissao: string;
    pcd: boolean;
  }): { payload: WebhookPayload; signature: string } {
    const payload: WebhookPayload = {
      event_type: 'colaborador.admitido',
      timestamp: new Date().toISOString(),
      data: {
        ...colaboradorData,
        status: 'ativo'
      }
    };

    const signature = this.generateSignature(payload);

    return { payload, signature };
  }

  /**
   * Simulate colaborador transfer webhook
   */
  createTransferWebhook(colaboradorData: {
    colaborador_id: string;
    nome: string;
    cpf: string;
    cargo_id: string;
    centro_custo_id: string;
    turno: string;
    data_admissao: string;
    pcd: boolean;
    centro_custo_anterior: string;
    cargo_anterior?: string;
    data_evento?: string;
  }): { payload: WebhookPayload; signature: string } {
    const payload: WebhookPayload = {
      event_type: 'colaborador.transferido',
      timestamp: new Date().toISOString(),
      data: {
        ...colaboradorData,
        status: 'ativo'
      }
    };

    const signature = this.generateSignature(payload);

    return { payload, signature };
  }

  /**
   * Simulate colaborador termination webhook
   */
  createTerminationWebhook(colaboradorData: {
    colaborador_id: string;
    nome: string;
    cpf: string;
    cargo_id: string;
    centro_custo_id: string;
    turno: string;
    data_admissao: string;
    data_desligamento: string;
    pcd: boolean;
  }): { payload: WebhookPayload; signature: string } {
    const payload: WebhookPayload = {
      event_type: 'colaborador.desligado',
      timestamp: new Date().toISOString(),
      data: {
        ...colaboradorData,
        status: 'inativo'
      }
    };

    const signature = this.generateSignature(payload);

    return { payload, signature };
  }
}

// Example: Testing webhook processing
export async function testWebhookProcessing() {
  const simulator = new WebhookSimulator(webhookConfig.secretKey);

  // Test 1: Normal admission (no cargo discrepancy)
  console.log('\n=== Test 1: Normal Admission ===');
  const normalAdmission = simulator.createAdmissionWebhook({
    colaborador_id: 'col_001',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    cargo_id: 'cargo_dev_junior',
    centro_custo_id: 'cc_ti',
    turno: 'integral',
    data_admissao: '2025-01-15',
    pcd: false
  });

  console.log('Payload:', JSON.stringify(normalAdmission.payload, null, 2));
  console.log('Signature:', normalAdmission.signature);

  // Test 2: Admission with cargo discrepancy
  console.log('\n=== Test 2: Admission with Cargo Discrepancy ===');
  const discrepancyAdmission = simulator.createAdmissionWebhook({
    colaborador_id: 'col_002',
    nome: 'Maria Santos',
    cpf: '987.654.321-00',
    cargo_id: 'cargo_dev_junior', // Real cargo
    centro_custo_id: 'cc_ti',
    turno: 'integral',
    data_admissao: '2025-01-16',
    pcd: true
  });

  console.log('Payload:', JSON.stringify(discrepancyAdmission.payload, null, 2));
  console.log('Expected cargo: cargo_dev_pleno (from quadro)');
  console.log('Actual cargo: cargo_dev_junior (from admission)');
  console.log('This should trigger cargo discrepancy handling');

  // Test 3: Transfer between centers
  console.log('\n=== Test 3: Transfer Between Centers ===');
  const transfer = simulator.createTransferWebhook({
    colaborador_id: 'col_001',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    cargo_id: 'cargo_dev_junior',
    centro_custo_id: 'cc_rh', // New center
    turno: 'integral',
    data_admissao: '2025-01-15',
    pcd: false,
    centro_custo_anterior: 'cc_ti', // Previous center
    cargo_anterior: 'cargo_dev_junior',
    data_evento: '2025-01-20'
  });

  console.log('Payload:', JSON.stringify(transfer.payload, null, 2));

  // Test 4: Termination
  console.log('\n=== Test 4: Termination ===');
  const termination = simulator.createTerminationWebhook({
    colaborador_id: 'col_003',
    nome: 'Pedro Oliveira',
    cpf: '456.789.123-00',
    cargo_id: 'cargo_dev_senior',
    centro_custo_id: 'cc_ti',
    turno: 'integral',
    data_admissao: '2024-06-01',
    data_desligamento: '2025-01-31',
    pcd: false
  });

  console.log('Payload:', JSON.stringify(termination.payload, null, 2));
}

// Example: Cargo discrepancy configuration scenarios
export const cargoDiscrepancyScenarios = {
  // Scenario 1: ALERTAR - Log discrepancy but allow admission
  alertar: {
    empresaConfig: {
      acaoCargoDiscrepante: 'alertar' as const
    },
    expectedBehavior: 'Admission allowed, alert sent to RH team',
    httpResponse: 200
  },

  // Scenario 2: PERMITIR - No restrictions
  permitir: {
    empresaConfig: {
      acaoCargoDiscrepante: 'permitir' as const
    },
    expectedBehavior: 'Admission allowed without restrictions',
    httpResponse: 200
  },

  // Scenario 3: BLOQUEAR - Block admission
  bloquear: {
    empresaConfig: {
      acaoCargoDiscrepante: 'bloquear' as const
    },
    expectedBehavior: 'Admission blocked, manual intervention required',
    httpResponse: 409
  },

  // Scenario 4: EXIGIR_APROVACAO - Create proposal for approval
  exigir_aprovacao: {
    empresaConfig: {
      acaoCargoDiscrepante: 'exigir_aprovacao' as const
    },
    expectedBehavior: 'Admission blocked, proposal created for approval workflow',
    httpResponse: 409
  }
};

// Example: Webhook error handling scenarios
export const errorScenarios = {
  invalidSignature: {
    description: 'Webhook with invalid signature',
    expectedResponse: 401,
    payload: 'valid payload but wrong signature'
  },

  missingFields: {
    description: 'Webhook with missing required fields',
    expectedResponse: 400,
    missingFields: ['nome', 'cpf', 'cargo_id']
  },

  databaseError: {
    description: 'Database connection failure during processing',
    expectedResponse: 500,
    retryBehavior: 'Exponential backoff with 3 attempts'
  },

  normalizationTimeout: {
    description: 'Normalization processing exceeds 2 second requirement',
    expectedResponse: 200,
    warning: 'Performance warning logged'
  }
};

// Example: Monitoring and observability
export class WebhookMonitor {
  private metrics = {
    totalWebhooks: 0,
    successfulWebhooks: 0,
    failedWebhooks: 0,
    cargoDiscrepancies: 0,
    averageProcessingTime: 0,
    retryAttempts: 0
  };

  recordWebhookProcessed(success: boolean, processingTime: number, hasDiscrepancy: boolean, retries: number) {
    this.metrics.totalWebhooks++;
    
    if (success) {
      this.metrics.successfulWebhooks++;
    } else {
      this.metrics.failedWebhooks++;
    }

    if (hasDiscrepancy) {
      this.metrics.cargoDiscrepancies++;
    }

    this.metrics.retryAttempts += retries;
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalWebhooks - 1) + processingTime) / 
      this.metrics.totalWebhooks;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulWebhooks / this.metrics.totalWebhooks) * 100,
      discrepancyRate: (this.metrics.cargoDiscrepancies / this.metrics.totalWebhooks) * 100,
      averageRetries: this.metrics.retryAttempts / this.metrics.totalWebhooks
    };
  }

  generateReport() {
    const metrics = this.getMetrics();
    
    return `
Webhook Processing Report
========================
Total Webhooks: ${metrics.totalWebhooks}
Success Rate: ${metrics.successRate.toFixed(2)}%
Average Processing Time: ${metrics.averageProcessingTime.toFixed(2)}ms
Cargo Discrepancy Rate: ${metrics.discrepancyRate.toFixed(2)}%
Average Retries per Webhook: ${metrics.averageRetries.toFixed(2)}

Performance Status: ${metrics.averageProcessingTime < 2000 ? '✅ GOOD' : '⚠️ SLOW'}
Reliability Status: ${metrics.successRate > 95 ? '✅ GOOD' : '❌ POOR'}
    `.trim();
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Webhook Integration Example');
  console.log('============================');
  
  testWebhookProcessing().catch(console.error);
  
  console.log('\nCargo Discrepancy Scenarios:');
  Object.entries(cargoDiscrepancyScenarios).forEach(([scenario, config]) => {
    console.log(`${scenario.toUpperCase()}: ${config.expectedBehavior} (HTTP ${config.httpResponse})`);
  });
}