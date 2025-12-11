import { Router } from 'express';
import { Pool } from 'pg';
import { WebhookController, WebhookConfig } from '../controllers/WebhookController.js';

export function createWebhookRoutes(pool: Pool): Router {
  const router = Router();
  
  // Webhook configuration - should be loaded from environment
  const webhookConfig: WebhookConfig = {
    secretKey: process.env.WEBHOOK_SECRET_KEY || 'default-secret-key',
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '1000'),
    maxRetryDelayMs: parseInt(process.env.WEBHOOK_MAX_RETRY_DELAY_MS || '10000')
  };

  const webhookController = new WebhookController(pool, webhookConfig);

  /**
   * Webhook endpoint for colaborador admission
   * POST /api/webhooks/colaborador/admitido
   * Requirements: 10.1 - Webhook processing with validation and retry logic
   */
  router.post('/colaborador/admitido', async (req, res) => {
    await webhookController.handleColaboradorAdmitido(req, res);
  });

  /**
   * Webhook endpoint for colaborador transfer
   * POST /api/webhooks/colaborador/transferido
   */
  router.post('/colaborador/transferido', async (req, res) => {
    await webhookController.handleColaboradorTransferido(req, res);
  });

  /**
   * Webhook endpoint for colaborador termination
   * POST /api/webhooks/colaborador/desligado
   */
  router.post('/colaborador/desligado', async (req, res) => {
    await webhookController.handleColaboradorDesligado(req, res);
  });

  /**
   * Webhook endpoint for colaborador promotion
   * POST /api/webhooks/colaborador/promovido
   */
  router.post('/colaborador/promovido', async (req, res) => {
    await webhookController.handleColaboradorPromovido(req, res);
  });

  /**
   * Health check endpoint for webhook service
   * GET /api/webhooks/health
   */
  router.get('/health', async (req, res) => {
    await webhookController.healthCheck(req, res);
  });

  return router;
}