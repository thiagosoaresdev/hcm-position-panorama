import React, { useEffect, useState } from 'react';
import type { NormalizacaoParams } from '../../services/NormalizacaoService.js';
import './ProgressTracker.css';

interface ProgressJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  params: NormalizacaoParams;
  startedAt?: Date;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

interface ProgressTrackerProps {
  job: ProgressJob;
  onCancel: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  job,
  onCancel
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Update elapsed time every second
  useEffect(() => {
    if (job.status !== 'running' || !job.startedAt) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - job.startedAt!.getTime();
      setElapsedTime(elapsed);

      // Calculate estimated time remaining based on progress
      if (job.progress && job.progress.current > 0) {
        const progressRatio = job.progress.current / job.progress.total;
        const totalEstimated = elapsed / progressRatio;
        const remaining = totalEstimated - elapsed;
        setEstimatedTimeRemaining(Math.max(0, remaining));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [job.status, job.startedAt, job.progress]);

  const formatTime = (ms: number): string => {
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

  const getProgressPercentage = (): number => {
    if (!job.progress) return 0;
    return Math.round((job.progress.current / job.progress.total) * 100);
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '⚡';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return 'Aguardando execução...';
      case 'running':
        return 'Executando normalização...';
      case 'completed':
        return 'Normalização concluída!';
      case 'failed':
        return 'Falha na execução';
      case 'cancelled':
        return 'Execução cancelada';
      default:
        return 'Status desconhecido';
    }
  };

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar a normalização em execução?')) {
      onCancel();
    }
  };

  const isRunning = job.status === 'running' || job.status === 'pending';
  const progressPercentage = getProgressPercentage();

  return (
    <div className="progress-tracker">
      <div className="progress-tracker__header">
        <div className="progress-tracker__status">
          <span className="progress-tracker__status-icon">
            {getStatusIcon()}
          </span>
          <div className="progress-tracker__status-text">
            <h3 className="progress-tracker__title">{getStatusText()}</h3>
            <p className="progress-tracker__job-id">Job: {job.id}</p>
          </div>
        </div>
        
        {isRunning && (
          <button
            className="progress-tracker__cancel-btn"
            onClick={handleCancel}
            title="Cancelar execução"
          >
            <span className="progress-tracker__cancel-icon">⏹️</span>
            Cancelar
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {job.progress && (
        <div className="progress-tracker__progress-section">
          <div className="progress-tracker__progress-info">
            <span className="progress-tracker__progress-text">
              {job.progress.message}
            </span>
            <span className="progress-tracker__progress-percentage">
              {progressPercentage}%
            </span>
          </div>
          
          <div className="progress-tracker__progress-bar">
            <div 
              className="progress-tracker__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="progress-tracker__progress-shine"></div>
            </div>
          </div>

          <div className="progress-tracker__progress-details">
            <span className="progress-tracker__progress-fraction">
              {job.progress.current} / {job.progress.total}
            </span>
          </div>
        </div>
      )}

      {/* Timing Information */}
      {isRunning && job.startedAt && (
        <div className="progress-tracker__timing">
          <div className="progress-tracker__timing-item">
            <span className="progress-tracker__timing-label">Tempo decorrido:</span>
            <span className="progress-tracker__timing-value">{formatTime(elapsedTime)}</span>
          </div>
          
          {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
            <div className="progress-tracker__timing-item">
              <span className="progress-tracker__timing-label">Tempo estimado restante:</span>
              <span className="progress-tracker__timing-value">{formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>
      )}

      {/* Job Parameters Summary */}
      <div className="progress-tracker__params">
        <h4 className="progress-tracker__params-title">Parâmetros da Execução</h4>
        <div className="progress-tracker__params-list">
          <div className="progress-tracker__param">
            <span className="progress-tracker__param-label">Plano de Vagas:</span>
            <span className="progress-tracker__param-value">{job.params.planoVagasId}</span>
          </div>
          
          <div className="progress-tracker__param">
            <span className="progress-tracker__param-label">Forçar Recálculo:</span>
            <span className="progress-tracker__param-value">
              {job.params.forceRecalculate ? 'Sim' : 'Não'}
            </span>
          </div>

          {job.params.dataInicio && (
            <div className="progress-tracker__param">
              <span className="progress-tracker__param-label">Data Início:</span>
              <span className="progress-tracker__param-value">
                {job.params.dataInicio.toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {job.params.dataFim && (
            <div className="progress-tracker__param">
              <span className="progress-tracker__param-label">Data Fim:</span>
              <span className="progress-tracker__param-value">
                {job.params.dataFim.toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {job.params.centroCustoIds && job.params.centroCustoIds.length > 0 && (
            <div className="progress-tracker__param">
              <span className="progress-tracker__param-label">Centros de Custo:</span>
              <span className="progress-tracker__param-value">
                {job.params.centroCustoIds.length} selecionados
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Requirements Notice */}
      {isRunning && (
        <div className="progress-tracker__requirements">
          <div className="progress-tracker__requirements-icon">ℹ️</div>
          <div className="progress-tracker__requirements-text">
            <strong>Processamento em Tempo Real:</strong> Esta normalização está sendo executada 
            conforme os requisitos 3.1 e 3.2, processando todos os postos de trabalho 
            independente da data de início do controle, com limite de 2 segundos por evento.
          </div>
        </div>
      )}

      {/* Completion Status */}
      {!isRunning && (
        <div className={`progress-tracker__completion ${
          job.status === 'completed' ? 'progress-tracker__completion--success' :
          job.status === 'failed' ? 'progress-tracker__completion--error' :
          'progress-tracker__completion--cancelled'
        }`}>
          <div className="progress-tracker__completion-icon">
            {getStatusIcon()}
          </div>
          <div className="progress-tracker__completion-text">
            {job.status === 'completed' && (
              <>
                <strong>Normalização concluída com sucesso!</strong>
                <p>Todos os dados foram processados e o quadro efetivo foi atualizado.</p>
              </>
            )}
            {job.status === 'failed' && (
              <>
                <strong>Falha na execução da normalização</strong>
                <p>Verifique os logs de erro para mais detalhes.</p>
              </>
            )}
            {job.status === 'cancelled' && (
              <>
                <strong>Execução cancelada pelo usuário</strong>
                <p>A normalização foi interrompida antes da conclusão.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};