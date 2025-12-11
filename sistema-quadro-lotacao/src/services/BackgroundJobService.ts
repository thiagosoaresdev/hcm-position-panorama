import { Pool } from 'pg';
import { NormalizacaoService, type NormalizacaoParams } from './NormalizacaoService.js';
import { AuditService } from './AuditService.js';

export interface JobConfig {
  maxConcurrentJobs: number;
  jobTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface Job {
  id: string;
  type: 'normalizacao' | 'webhook_retry';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  payload: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export class BackgroundJobService {
  private pool: Pool;
  private normalizacaoService: NormalizacaoService;
  private auditService: AuditService;
  private config: JobConfig;
  private jobs: Map<string, Job> = new Map();
  private runningJobs: Set<string> = new Set();
  private isProcessing = false;

  constructor(pool: Pool, config: JobConfig) {
    this.pool = pool;
    this.normalizacaoService = new NormalizacaoService(pool);
    this.auditService = new AuditService(pool);
    this.config = config;
  }

  /**
   * Start the background job processor
   */
  start(): void {
    if (this.isProcessing) {
      console.warn('Background job service is already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting background job service...');
    
    // Start the main processing loop
    this.processJobs();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60000); // Cleanup every minute
  }

  /**
   * Stop the background job processor
   */
  stop(): void {
    this.isProcessing = false;
    console.log('Stopping background job service...');
  }

  /**
   * Schedule a normalization job
   */
  async scheduleNormalizacao(
    params: NormalizacaoParams,
    priority: number = 5,
    userId: string = 'sistema'
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: Job = {
      id: jobId,
      type: 'normalizacao',
      status: 'pending',
      priority,
      payload: params,
      attempts: 0,
      maxAttempts: this.config.retryAttempts,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Log job creation
    await this.auditService.logAction(
      jobId,
      'background_job',
      'job_agendado',
      {
        userId: userId,
        userName: 'Sistema de Jobs',
        motivo: 'Job de normalização agendado'
      },
      undefined,
      { job }
    );

    console.log(`Normalization job scheduled: ${jobId}`);
    return jobId;
  }

  /**
   * Schedule a webhook retry job
   */
  async scheduleWebhookRetry(
    webhookPayload: any,
    priority: number = 8,
    userId: string = 'sistema',
    delayMs: number = 0
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: Job = {
      id: jobId,
      type: 'webhook_retry',
      status: 'pending',
      priority,
      payload: {
        ...webhookPayload,
        originalFailureTime: new Date(),
        retryDelay: delayMs
      },
      attempts: 0,
      maxAttempts: this.config.retryAttempts,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    await this.auditService.logAction(
      jobId,
      'background_job',
      'webhook_retry_agendado',
      {
        userId: userId,
        userName: 'Sistema de Jobs',
        motivo: `Job de retry de webhook agendado com delay de ${delayMs}ms`
      },
      undefined,
      { job }
    );

    console.log(`Webhook retry job scheduled: ${jobId} with ${delayMs}ms delay`);
    
    // If there's a delay, schedule the job to run later
    if (delayMs > 0) {
      setTimeout(() => {
        const delayedJob = this.jobs.get(jobId);
        if (delayedJob && delayedJob.status === 'pending') {
          console.log(`Webhook retry job ${jobId} is now ready for processing after ${delayMs}ms delay`);
        }
      }, delayMs);
    }
    
    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string, userId: string = 'sistema'): Promise<boolean> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return false;
    }

    if (job.status === 'running') {
      console.warn(`Cannot cancel running job: ${jobId}`);
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      console.warn(`Job ${jobId} is already in final state: ${job.status}`);
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();

    await this.auditService.logAction(
      jobId,
      'background_job',
      'job_cancelado',
      {
        userId: userId,
        userName: 'Sistema de Jobs',
        motivo: 'Job cancelado pelo usuário'
      },
      undefined,
      { job }
    );

    console.log(`Job cancelled: ${jobId}`);
    return true;
  }

  /**
   * Get all jobs with optional filtering
   */
  getJobs(filter?: {
    status?: Job['status'];
    type?: Job['type'];
    limit?: number;
  }): Job[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }

    if (filter?.type) {
      jobs = jobs.filter(job => job.type === filter.type);
    }

    // Sort by priority (higher first) then by creation date
    jobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    if (filter?.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs;
  }

  /**
   * Main job processing loop
   */
  private async processJobs(): Promise<void> {
    while (this.isProcessing) {
      try {
        // Check if we can process more jobs
        if (this.runningJobs.size >= this.config.maxConcurrentJobs) {
          await this.sleep(1000); // Wait 1 second before checking again
          continue;
        }

        // Get next pending job with highest priority
        const pendingJobs = this.getJobs({ status: 'pending', limit: 1 });
        
        if (pendingJobs.length === 0) {
          await this.sleep(2000); // Wait 2 seconds before checking again
          continue;
        }

        const job = pendingJobs[0];
        
        // Start processing the job
        this.processJob(job);

      } catch (error) {
        console.error('Error in job processing loop:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    try {
      // Mark job as running
      job.status = 'running';
      job.startedAt = new Date();
      job.attempts++;
      this.runningJobs.add(job.id);

      console.log(`Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

      // Set timeout for job execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.config.jobTimeoutMs);
      });

      // Execute job based on type
      let result: any;
      const jobPromise = this.executeJob(job);

      result = await Promise.race([jobPromise, timeoutPromise]);

      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      await this.auditService.logAction(
        job.id,
        'background_job',
        'job_concluido',
        {
          userId: 'sistema',
          userName: 'Sistema de Jobs',
          motivo: `Job ${job.type} concluído com sucesso`
        },
        undefined,
        { job, result }
      );

      console.log(`Job ${job.id} completed successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job.id} failed (attempt ${job.attempts}):`, errorMessage);

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        // Schedule retry
        job.status = 'pending';
        job.error = errorMessage;
        
        // Add exponential backoff delay
        const delay = this.config.retryDelayMs * Math.pow(2, job.attempts - 1);
        setTimeout(() => {
          console.log(`Retrying job ${job.id} after ${delay}ms delay`);
        }, delay);

        await this.auditService.logAction(
          job.id,
          'background_job',
          'job_retry',
          {
            userId: 'sistema',
            userName: 'Sistema de Jobs',
            motivo: `Job falhou, reagendando tentativa ${job.attempts + 1}`
          },
          { error: errorMessage },
          { job, delay }
        );

      } else {
        // Max attempts reached, mark as failed
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = errorMessage;

        await this.auditService.logAction(
          job.id,
          'background_job',
          'job_falhado',
          {
            userId: 'sistema',
            userName: 'Sistema de Jobs',
            motivo: `Job falhou após ${job.attempts} tentativas`
          },
          { error: errorMessage },
          { job }
        );

        console.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
      }

    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  /**
   * Execute job based on its type
   */
  private async executeJob(job: Job): Promise<any> {
    switch (job.type) {
      case 'normalizacao':
        return await this.normalizacaoService.executeNormalizacao(job.payload as NormalizacaoParams);
      
      case 'webhook_retry':
        return await this.processWebhookRetry(job);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Clean up completed jobs older than 24 hours
   */
  private cleanupCompletedJobs(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old jobs`);
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process webhook retry job
   */
  private async processWebhookRetry(job: Job): Promise<any> {
    const payload = job.payload;
    
    try {
      // Convert webhook payload back to colaborador event
      const event = this.convertWebhookToEvent(payload);
      
      // Process the event through normalization service
      await this.normalizacaoService.processColaboradorEvent(event);
      
      // Log successful retry
      await this.auditService.logAction(
        job.id,
        'background_job',
        'webhook_retry_success',
        {
          userId: 'sistema',
          userName: 'Sistema de Jobs',
          motivo: `Webhook retry processado com sucesso após ${job.attempts} tentativas`
        },
        undefined,
        { 
          jobId: job.id,
          originalFailureTime: payload.originalFailureTime,
          retryDelay: payload.retryDelay,
          event
        }
      );

      return { 
        retryProcessed: true, 
        payload: job.payload,
        event,
        attempts: job.attempts
      };

    } catch (error) {
      // Log retry failure
      await this.auditService.logAction(
        job.id,
        'background_job',
        'webhook_retry_failed',
        {
          userId: 'sistema',
          userName: 'Sistema de Jobs',
          motivo: `Webhook retry falhou na tentativa ${job.attempts}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        },
        { 
          jobId: job.id,
          originalFailureTime: payload.originalFailureTime,
          retryDelay: payload.retryDelay
        },
        { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      );

      throw error;
    }
  }

  /**
   * Convert webhook payload back to colaborador event
   */
  private convertWebhookToEvent(payload: any): any {
    const data = payload.data || payload;
    
    const event: any = {
      colaboradorId: data.colaborador_id,
      nome: data.nome,
      cpf: data.cpf,
      cargoId: data.cargo_id,
      centroCustoId: data.centro_custo_id,
      turno: data.turno,
      dataAdmissao: new Date(data.data_admissao),
      pcd: data.pcd,
      status: data.status,
      eventType: this.extractEventTypeFromPayload(payload)
    };

    // Add event-specific data
    if (event.eventType === 'transferencia') {
      event.eventData = {
        centroCustoAnterior: data.centro_custo_anterior,
        cargoAnterior: data.cargo_anterior,
        dataEvento: new Date(data.data_evento || payload.timestamp)
      };
    } else if (event.eventType === 'promocao') {
      event.eventData = {
        cargoAnterior: data.cargo_anterior,
        dataEvento: new Date(data.data_evento || payload.timestamp)
      };
    } else if (event.eventType === 'desligamento') {
      event.dataDesligamento = data.data_desligamento ? new Date(data.data_desligamento) : new Date();
    }

    return event;
  }

  /**
   * Extract event type from webhook payload
   */
  private extractEventTypeFromPayload(payload: any): string {
    const eventType = payload.event_type || payload.eventType;
    
    if (eventType) {
      if (eventType.includes('admitido')) return 'admissao';
      if (eventType.includes('transferido')) return 'transferencia';
      if (eventType.includes('desligado')) return 'desligamento';
      if (eventType.includes('promovido')) return 'promocao';
    }

    // Fallback to admissao if can't determine
    return 'admissao';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalJobs: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    cancelledJobs: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      runningJobs: jobs.filter(j => j.status === 'running').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      cancelledJobs: jobs.filter(j => j.status === 'cancelled').length
    };
  }
}