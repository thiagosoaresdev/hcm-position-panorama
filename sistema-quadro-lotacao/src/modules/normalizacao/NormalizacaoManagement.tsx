import React, { useState, useEffect } from 'react';
import { NormalizacaoExecutor } from '../../components/normalizacao/NormalizacaoExecutor.js';
import { NormalizacaoHistory } from '../../components/normalizacao/NormalizacaoHistory.js';
import { ProgressTracker } from '../../components/normalizacao/ProgressTracker.js';
import { ErrorReporter } from '../../components/normalizacao/ErrorReporter.js';
import { usePermissions } from '../../core/auth/usePermissions.js';
import type { NormalizacaoParams, NormalizacaoResult } from '../../services/NormalizacaoService.js';
import './NormalizacaoManagement.css';

interface NormalizacaoJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  params: NormalizacaoParams;
  result?: NormalizacaoResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

interface NormalizacaoStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  lastExecution?: Date;
  averageExecutionTime?: number;
}

export const NormalizacaoManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'executor' | 'history' | 'monitoring'>('executor');
  const [currentJob, setCurrentJob] = useState<NormalizacaoJob | null>(null);
  const [jobHistory, setJobHistory] = useState<NormalizacaoJob[]>([]);
  const [stats, setStats] = useState<NormalizacaoStats>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { checkPermission } = usePermissions();

  // Check permissions
  const canExecute = checkPermission('quadro_vagas:normalizacao:execute');
  const canViewHistory = checkPermission('quadro_vagas:normalizacao:read');
  const canRetry = checkPermission('quadro_vagas:normalizacao:retry');

  // Load initial data
  useEffect(() => {
    loadStats();
    loadJobHistory();
  }, []);

  const loadStats = async () => {
    try {
      // In real app, this would call the API
      const mockStats: NormalizacaoStats = {
        totalJobs: 45,
        runningJobs: 1,
        completedJobs: 42,
        failedJobs: 2,
        lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        averageExecutionTime: 45000 // 45 seconds
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadJobHistory = async () => {
    try {
      // In real app, this would call the API
      const mockHistory: NormalizacaoJob[] = [
        {
          id: 'job_001',
          status: 'completed',
          params: {
            planoVagasId: 'plano_2025',
            forceRecalculate: true
          },
          result: {
            processedPostos: 25,
            updatedQuadros: 18,
            errors: [],
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
            duration: 45000
          },
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000)
        },
        {
          id: 'job_002',
          status: 'failed',
          params: {
            planoVagasId: 'plano_2024',
            centroCustoIds: ['cc_ti', 'cc_rh']
          },
          error: 'Erro de conexão com o banco de dados',
          startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 5000)
        }
      ];
      setJobHistory(mockHistory);
    } catch (error) {
      console.error('Error loading job history:', error);
    }
  };

  const handleExecuteNormalizacao = async (params: NormalizacaoParams) => {
    if (!canExecute) {
      setErrors(['Você não tem permissão para executar normalização']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Create new job
      const newJob: NormalizacaoJob = {
        id: `job_${Date.now()}`,
        status: 'running',
        params,
        startedAt: new Date(),
        progress: {
          current: 0,
          total: 100,
          message: 'Iniciando normalização...'
        }
      };

      setCurrentJob(newJob);

      // Simulate job execution with progress updates
      await simulateJobExecution(newJob);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrors([errorMessage]);
      
      if (currentJob) {
        const failedJob = {
          ...currentJob,
          status: 'failed' as const,
          error: errorMessage,
          completedAt: new Date()
        };
        setCurrentJob(failedJob);
        setJobHistory(prev => [failedJob, ...prev]);
      }
    } finally {
      setLoading(false);
    }
  };

  const simulateJobExecution = async (job: NormalizacaoJob): Promise<void> => {
    const steps = [
      { progress: 10, message: 'Validando parâmetros...' },
      { progress: 20, message: 'Conectando ao banco de dados...' },
      { progress: 30, message: 'Limpando dados efetivos anteriores...' },
      { progress: 50, message: 'Processando postos de trabalho...' },
      { progress: 70, message: 'Atualizando quadros de lotação...' },
      { progress: 90, message: 'Gerando relatório...' },
      { progress: 100, message: 'Normalização concluída!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedJob = {
        ...job,
        progress: {
          current: step.progress,
          total: 100,
          message: step.message
        }
      };
      setCurrentJob(updatedJob);
    }

    // Complete the job
    const completedJob: NormalizacaoJob = {
      ...job,
      status: 'completed',
      result: {
        processedPostos: 25,
        updatedQuadros: 18,
        errors: [],
        startTime: job.startedAt!,
        endTime: new Date(),
        duration: Date.now() - job.startedAt!.getTime()
      },
      completedAt: new Date()
    };

    setCurrentJob(completedJob);
    setJobHistory(prev => [completedJob, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalJobs: prev.totalJobs + 1,
      completedJobs: prev.completedJobs + 1,
      runningJobs: Math.max(0, prev.runningJobs - 1),
      lastExecution: new Date()
    }));
  };

  const handleRetryJob = async (jobId: string) => {
    if (!canRetry) {
      setErrors(['Você não tem permissão para reprocessar jobs']);
      return;
    }

    const jobToRetry = jobHistory.find(job => job.id === jobId);
    if (!jobToRetry) {
      setErrors(['Job não encontrado']);
      return;
    }

    await handleExecuteNormalizacao(jobToRetry.params);
  };

  const handleCancelJob = () => {
    if (currentJob && currentJob.status === 'running') {
      const cancelledJob = {
        ...currentJob,
        status: 'cancelled' as const,
        completedAt: new Date()
      };
      setCurrentJob(cancelledJob);
      setJobHistory(prev => [cancelledJob, ...prev]);
      setLoading(false);
    }
  };

  const handleClearErrors = () => {
    setErrors([]);
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="normalizacao-management">
      <div className="normalizacao-management__header">
        <div className="normalizacao-management__title-section">
          <h1 className="normalizacao-management__title">Normalização do Quadro</h1>
          <p className="normalizacao-management__subtitle">
            Execute e monitore a sincronização entre quadro previsto e efetivo
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="normalizacao-management__stats">
        <div className="normalizacao-management__stat-card">
          <div className="normalizacao-management__stat-value">{stats.totalJobs}</div>
          <div className="normalizacao-management__stat-label">Total de Execuções</div>
        </div>
        <div className="normalizacao-management__stat-card">
          <div className="normalizacao-management__stat-value">{stats.runningJobs}</div>
          <div className="normalizacao-management__stat-label">Em Execução</div>
        </div>
        <div className="normalizacao-management__stat-card">
          <div className="normalizacao-management__stat-value">{stats.completedJobs}</div>
          <div className="normalizacao-management__stat-label">Concluídas</div>
        </div>
        <div className="normalizacao-management__stat-card">
          <div className="normalizacao-management__stat-value">{stats.failedJobs}</div>
          <div className="normalizacao-management__stat-label">Com Erro</div>
        </div>
        {stats.lastExecution && (
          <div className="normalizacao-management__stat-card">
            <div className="normalizacao-management__stat-value">
              {stats.lastExecution.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="normalizacao-management__stat-label">Última Execução</div>
          </div>
        )}
        {stats.averageExecutionTime && (
          <div className="normalizacao-management__stat-card">
            <div className="normalizacao-management__stat-value">
              {formatDuration(stats.averageExecutionTime)}
            </div>
            <div className="normalizacao-management__stat-label">Tempo Médio</div>
          </div>
        )}
      </div>

      {/* Error Reporter */}
      {errors.length > 0 && (
        <ErrorReporter
          errors={errors}
          onClear={handleClearErrors}
          onRetry={() => {
            // Retry last failed operation
            if (currentJob && currentJob.status === 'failed') {
              handleExecuteNormalizacao(currentJob.params);
            }
          }}
        />
      )}

      {/* Progress Tracker */}
      {currentJob && (currentJob.status === 'running' || currentJob.status === 'pending') && (
        <ProgressTracker
          job={currentJob}
          onCancel={handleCancelJob}
        />
      )}

      {/* Tab Navigation */}
      <div className="normalizacao-management__tabs">
        <button
          className={`normalizacao-management__tab ${activeTab === 'executor' ? 'normalizacao-management__tab--active' : ''}`}
          onClick={() => setActiveTab('executor')}
          disabled={loading}
        >
          <span className="normalizacao-management__tab-icon">⚡</span>
          Executar Normalização
        </button>
        <button
          className={`normalizacao-management__tab ${activeTab === 'history' ? 'normalizacao-management__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
          disabled={loading}
        >
          <span className="normalizacao-management__tab-icon">📋</span>
          Histórico
        </button>
        <button
          className={`normalizacao-management__tab ${activeTab === 'monitoring' ? 'normalizacao-management__tab--active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
          disabled={loading}
        >
          <span className="normalizacao-management__tab-icon">📊</span>
          Monitoramento
        </button>
      </div>

      {/* Tab Content */}
      <div className="normalizacao-management__content">
        {activeTab === 'executor' && (
          <NormalizacaoExecutor
            onExecute={handleExecuteNormalizacao}
            loading={loading}
            disabled={!canExecute}
            currentJob={currentJob}
          />
        )}

        {activeTab === 'history' && (
          <NormalizacaoHistory
            jobs={jobHistory}
            onRetry={handleRetryJob}
            canRetry={canRetry}
            loading={loading}
          />
        )}

        {activeTab === 'monitoring' && (
          <div className="normalizacao-management__monitoring">
            <div className="normalizacao-management__monitoring-placeholder">
              <div className="normalizacao-management__monitoring-icon">📈</div>
              <h3>Monitoramento em Tempo Real</h3>
              <p>
                Esta seção mostrará métricas detalhadas de performance, 
                gráficos de execução e alertas do sistema de normalização.
              </p>
              <p className="normalizacao-management__monitoring-note">
                Funcionalidade será implementada na próxima versão.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};