import React, { useState, useMemo } from 'react';
import type { NormalizacaoParams, NormalizacaoResult } from '../../services/NormalizacaoService.js';
import './NormalizacaoHistory.css';

interface NormalizacaoJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  params: NormalizacaoParams;
  result?: NormalizacaoResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface NormalizacaoHistoryProps {
  jobs: NormalizacaoJob[];
  onRetry: (jobId: string) => Promise<void>;
  canRetry: boolean;
  loading: boolean;
}

interface FilterOptions {
  status: 'all' | 'completed' | 'failed' | 'cancelled';
  dateRange: 'all' | 'today' | 'week' | 'month';
  planoVagasId: string;
}

export const NormalizacaoHistory: React.FC<NormalizacaoHistoryProps> = ({
  jobs,
  onRetry,
  canRetry,
  loading
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: 'all',
    planoVagasId: ''
  });
  const [selectedJob, setSelectedJob] = useState<NormalizacaoJob | null>(null);
  const [sortBy, setSortBy] = useState<'startedAt' | 'completedAt' | 'duration'>('startedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique plano vagas for filter
  const planoVagasOptions = useMemo(() => {
    const uniquePlanos = Array.from(new Set(jobs.map(job => job.params.planoVagasId)));
    return uniquePlanos.map(id => ({ id, nome: `Plano ${id}` }));
  }, [jobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      // Status filter
      if (filters.status !== 'all' && job.status !== filters.status) {
        return false;
      }

      // Plano vagas filter
      if (filters.planoVagasId && job.params.planoVagasId !== filters.planoVagasId) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all' && job.startedAt) {
        const now = new Date();
        const jobDate = job.startedAt;
        
        switch (filters.dateRange) {
          case 'today':
            if (jobDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (jobDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (jobDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'startedAt':
          aValue = a.startedAt?.getTime() || 0;
          bValue = b.startedAt?.getTime() || 0;
          break;
        case 'completedAt':
          aValue = a.completedAt?.getTime() || 0;
          bValue = b.completedAt?.getTime() || 0;
          break;
        case 'duration':
          aValue = a.result?.duration || 0;
          bValue = b.result?.duration || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [jobs, filters, sortBy, sortOrder]);

  const getStatusBadge = (status: NormalizacaoJob['status']) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'normalizacao-history__badge--pending' },
      running: { label: 'Executando', className: 'normalizacao-history__badge--running' },
      completed: { label: 'Concluída', className: 'normalizacao-history__badge--success' },
      failed: { label: 'Falhou', className: 'normalizacao-history__badge--danger' },
      cancelled: { label: 'Cancelada', className: 'normalizacao-history__badge--warning' }
    };

    const config = statusConfig[status];
    return (
      <span className={`normalizacao-history__badge ${config.className}`}>
        {config.label}
      </span>
    );
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

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRetry = async (jobId: string) => {
    if (window.confirm('Tem certeza que deseja reprocessar esta normalização?')) {
      await onRetry(jobId);
    }
  };

  const handleViewDetails = (job: NormalizacaoJob) => {
    setSelectedJob(job);
  };

  const handleCloseDetails = () => {
    setSelectedJob(null);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      planoVagasId: ''
    });
  };

  return (
    <div className="normalizacao-history">
      <div className="normalizacao-history__header">
        <h2 className="normalizacao-history__title">Histórico de Normalizações</h2>
        <p className="normalizacao-history__description">
          Visualize o histórico completo de execuções de normalização com detalhes de performance e resultados.
        </p>
      </div>

      {/* Filters */}
      <div className="normalizacao-history__filters">
        <div className="normalizacao-history__filter-group">
          <label className="normalizacao-history__filter-label">Status:</label>
          <select
            className="normalizacao-history__filter-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
            disabled={loading}
          >
            <option value="all">Todos</option>
            <option value="completed">Concluídas</option>
            <option value="failed">Com Erro</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div className="normalizacao-history__filter-group">
          <label className="normalizacao-history__filter-label">Período:</label>
          <select
            className="normalizacao-history__filter-select"
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterOptions['dateRange'] }))}
            disabled={loading}
          >
            <option value="all">Todos</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>

        <div className="normalizacao-history__filter-group">
          <label className="normalizacao-history__filter-label">Plano:</label>
          <select
            className="normalizacao-history__filter-select"
            value={filters.planoVagasId}
            onChange={(e) => setFilters(prev => ({ ...prev, planoVagasId: e.target.value }))}
            disabled={loading}
          >
            <option value="">Todos</option>
            {planoVagasOptions.map(plano => (
              <option key={plano.id} value={plano.id}>
                {plano.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="normalizacao-history__filter-group">
          <label className="normalizacao-history__filter-label">Ordenar por:</label>
          <select
            className="normalizacao-history__filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            disabled={loading}
          >
            <option value="startedAt">Data Início</option>
            <option value="completedAt">Data Conclusão</option>
            <option value="duration">Duração</option>
          </select>
          <button
            className="normalizacao-history__sort-order"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            disabled={loading}
            title={`Ordenação ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {(filters.status !== 'all' || filters.dateRange !== 'all' || filters.planoVagasId) && (
          <button
            className="normalizacao-history__clear-filters"
            onClick={clearFilters}
            disabled={loading}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="normalizacao-history__summary">
        <span className="normalizacao-history__summary-text">
          Exibindo {filteredJobs.length} de {jobs.length} execuções
        </span>
      </div>

      {/* Jobs List */}
      <div className="normalizacao-history__list">
        {filteredJobs.length === 0 ? (
          <div className="normalizacao-history__empty">
            <div className="normalizacao-history__empty-icon">📋</div>
            <h3>Nenhuma execução encontrada</h3>
            <p>Não há execuções de normalização para os filtros selecionados.</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="normalizacao-history__item">
              <div className="normalizacao-history__item-header">
                <div className="normalizacao-history__item-info">
                  <div className="normalizacao-history__item-id">
                    Job: {job.id}
                  </div>
                  <div className="normalizacao-history__item-plano">
                    Plano: {job.params.planoVagasId}
                  </div>
                </div>
                <div className="normalizacao-history__item-status">
                  {getStatusBadge(job.status)}
                </div>
              </div>

              <div className="normalizacao-history__item-details">
                <div className="normalizacao-history__item-dates">
                  {job.startedAt && (
                    <div className="normalizacao-history__item-date">
                      <strong>Iniciado:</strong> {formatDateTime(job.startedAt)}
                    </div>
                  )}
                  {job.completedAt && (
                    <div className="normalizacao-history__item-date">
                      <strong>Concluído:</strong> {formatDateTime(job.completedAt)}
                    </div>
                  )}
                  {job.result?.duration && (
                    <div className="normalizacao-history__item-date">
                      <strong>Duração:</strong> {formatDuration(job.result.duration)}
                    </div>
                  )}
                </div>

                {job.result && (
                  <div className="normalizacao-history__item-results">
                    <div className="normalizacao-history__result-metric">
                      <span className="normalizacao-history__result-label">Postos Processados:</span>
                      <span className="normalizacao-history__result-value">{job.result.processedPostos}</span>
                    </div>
                    <div className="normalizacao-history__result-metric">
                      <span className="normalizacao-history__result-label">Quadros Atualizados:</span>
                      <span className="normalizacao-history__result-value">{job.result.updatedQuadros}</span>
                    </div>
                    {job.result.errors.length > 0 && (
                      <div className="normalizacao-history__result-metric">
                        <span className="normalizacao-history__result-label">Erros:</span>
                        <span className="normalizacao-history__result-value normalizacao-history__result-value--error">
                          {job.result.errors.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {job.error && (
                  <div className="normalizacao-history__item-error">
                    <strong>Erro:</strong> {job.error}
                  </div>
                )}
              </div>

              <div className="normalizacao-history__item-actions">
                <button
                  className="normalizacao-history__action-btn normalizacao-history__action-btn--view"
                  onClick={() => handleViewDetails(job)}
                  disabled={loading}
                >
                  Ver Detalhes
                </button>
                {canRetry && job.status === 'failed' && (
                  <button
                    className="normalizacao-history__action-btn normalizacao-history__action-btn--retry"
                    onClick={() => handleRetry(job.id)}
                    disabled={loading}
                  >
                    Reprocessar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="normalizacao-history__modal-overlay" onClick={handleCloseDetails}>
          <div className="normalizacao-history__modal" onClick={(e) => e.stopPropagation()}>
            <div className="normalizacao-history__modal-header">
              <h3>Detalhes da Execução</h3>
              <button
                className="normalizacao-history__modal-close"
                onClick={handleCloseDetails}
              >
                ✕
              </button>
            </div>

            <div className="normalizacao-history__modal-content">
              <div className="normalizacao-history__modal-section">
                <h4>Informações Gerais</h4>
                <div className="normalizacao-history__modal-info">
                  <div><strong>Job ID:</strong> {selectedJob.id}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedJob.status)}</div>
                  <div><strong>Plano de Vagas:</strong> {selectedJob.params.planoVagasId}</div>
                  {selectedJob.startedAt && (
                    <div><strong>Iniciado em:</strong> {formatDateTime(selectedJob.startedAt)}</div>
                  )}
                  {selectedJob.completedAt && (
                    <div><strong>Concluído em:</strong> {formatDateTime(selectedJob.completedAt)}</div>
                  )}
                </div>
              </div>

              <div className="normalizacao-history__modal-section">
                <h4>Parâmetros</h4>
                <div className="normalizacao-history__modal-params">
                  <div><strong>Forçar Recálculo:</strong> {selectedJob.params.forceRecalculate ? 'Sim' : 'Não'}</div>
                  {selectedJob.params.dataInicio && (
                    <div><strong>Data Início:</strong> {selectedJob.params.dataInicio.toLocaleDateString('pt-BR')}</div>
                  )}
                  {selectedJob.params.dataFim && (
                    <div><strong>Data Fim:</strong> {selectedJob.params.dataFim.toLocaleDateString('pt-BR')}</div>
                  )}
                  {selectedJob.params.centroCustoIds && selectedJob.params.centroCustoIds.length > 0 && (
                    <div><strong>Centros de Custo:</strong> {selectedJob.params.centroCustoIds.join(', ')}</div>
                  )}
                </div>
              </div>

              {selectedJob.result && (
                <div className="normalizacao-history__modal-section">
                  <h4>Resultados</h4>
                  <div className="normalizacao-history__modal-results">
                    <div><strong>Postos Processados:</strong> {selectedJob.result.processedPostos}</div>
                    <div><strong>Quadros Atualizados:</strong> {selectedJob.result.updatedQuadros}</div>
                    <div><strong>Duração:</strong> {formatDuration(selectedJob.result.duration)}</div>
                    {selectedJob.result.errors.length > 0 && (
                      <div className="normalizacao-history__modal-errors">
                        <strong>Erros ({selectedJob.result.errors.length}):</strong>
                        <ul>
                          {selectedJob.result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedJob.error && (
                <div className="normalizacao-history__modal-section">
                  <h4>Erro</h4>
                  <div className="normalizacao-history__modal-error">
                    {selectedJob.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};