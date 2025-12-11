import React, { useState, useEffect } from 'react';
import type { NormalizacaoParams } from '../../services/NormalizacaoService.js';
import './NormalizacaoExecutor.css';

interface NormalizacaoExecutorProps {
  onExecute: (params: NormalizacaoParams) => Promise<void>;
  loading: boolean;
  disabled: boolean;
  currentJob?: {
    id: string;
    status: string;
    params: NormalizacaoParams;
  } | null;
}

interface FormData {
  planoVagasId: string;
  dataInicio: string;
  dataFim: string;
  centroCustoIds: string[];
  forceRecalculate: boolean;
  executionMode: 'full' | 'incremental' | 'selective';
}

// Mock data for dropdowns - in real app this would come from API
const mockPlanoVagas = [
  { id: 'plano_2025', nome: 'Plano de Vagas 2025' },
  { id: 'plano_2024', nome: 'Plano de Vagas 2024' },
  { id: 'plano_2023', nome: 'Plano de Vagas 2023' }
];

const mockCentrosCusto = [
  { id: 'cc_ti', nome: 'Tecnologia da Informação' },
  { id: 'cc_rh', nome: 'Recursos Humanos' },
  { id: 'cc_adm', nome: 'Administrativo' },
  { id: 'cc_vendas', nome: 'Vendas' },
  { id: 'cc_marketing', nome: 'Marketing' }
];

export const NormalizacaoExecutor: React.FC<NormalizacaoExecutorProps> = ({
  onExecute,
  loading,
  disabled,
  currentJob
}) => {
  const [formData, setFormData] = useState<FormData>({
    planoVagasId: 'plano_2025',
    dataInicio: '',
    dataFim: '',
    centroCustoIds: [],
    forceRecalculate: true,
    executionMode: 'full'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFormData(prev => ({
      ...prev,
      dataInicio: firstDayOfMonth.toISOString().split('T')[0],
      dataFim: lastDayOfMonth.toISOString().split('T')[0]
    }));
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.planoVagasId) {
      errors.planoVagasId = 'Plano de vagas é obrigatório';
    }

    if (formData.executionMode === 'selective' && formData.centroCustoIds.length === 0) {
      errors.centroCustoIds = 'Selecione pelo menos um centro de custo para execução seletiva';
    }

    if (formData.dataInicio && formData.dataFim) {
      const dataInicio = new Date(formData.dataInicio);
      const dataFim = new Date(formData.dataFim);
      
      if (dataInicio > dataFim) {
        errors.dataFim = 'Data fim deve ser posterior à data início';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const params: NormalizacaoParams = {
      planoVagasId: formData.planoVagasId,
      forceRecalculate: formData.forceRecalculate
    };

    // Add optional parameters based on execution mode
    if (formData.executionMode === 'incremental' || formData.executionMode === 'selective') {
      if (formData.dataInicio) {
        params.dataInicio = new Date(formData.dataInicio);
      }
      if (formData.dataFim) {
        params.dataFim = new Date(formData.dataFim);
      }
    }

    if (formData.executionMode === 'selective' && formData.centroCustoIds.length > 0) {
      params.centroCustoIds = formData.centroCustoIds;
    }

    await onExecute(params);
  };

  const handleCentroCustoChange = (centroCustoId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      centroCustoIds: checked
        ? [...prev.centroCustoIds, centroCustoId]
        : prev.centroCustoIds.filter(id => id !== centroCustoId)
    }));
  };

  const handleSelectAllCentrosCusto = () => {
    setFormData(prev => ({
      ...prev,
      centroCustoIds: mockCentrosCusto.map(cc => cc.id)
    }));
  };

  const handleDeselectAllCentrosCusto = () => {
    setFormData(prev => ({
      ...prev,
      centroCustoIds: []
    }));
  };

  const getExecutionModeDescription = () => {
    switch (formData.executionMode) {
      case 'full':
        return 'Processa todos os postos de trabalho do plano selecionado, independente da data de início do controle.';
      case 'incremental':
        return 'Processa apenas os postos de trabalho dentro do período especificado.';
      case 'selective':
        return 'Processa apenas os centros de custo selecionados dentro do período especificado.';
      default:
        return '';
    }
  };

  const isExecutionDisabled = () => {
    return disabled || loading || (currentJob && currentJob.status === 'running');
  };

  return (
    <div className="normalizacao-executor">
      <div className="normalizacao-executor__header">
        <h2 className="normalizacao-executor__title">Executar Normalização</h2>
        <p className="normalizacao-executor__description">
          Configure os parâmetros e execute a sincronização entre quadro previsto e efetivo.
          O processo atualizará automaticamente as vagas efetivas com base nos dados do RH.
        </p>
      </div>

      <form className="normalizacao-executor__form" onSubmit={handleSubmit}>
        {/* Basic Configuration */}
        <div className="normalizacao-executor__section">
          <h3 className="normalizacao-executor__section-title">Configuração Básica</h3>
          
          <div className="normalizacao-executor__field-group">
            <div className="normalizacao-executor__field">
              <label className="normalizacao-executor__label" htmlFor="planoVagasId">
                Plano de Vagas *
              </label>
              <select
                id="planoVagasId"
                className={`normalizacao-executor__select ${validationErrors.planoVagasId ? 'normalizacao-executor__select--error' : ''}`}
                value={formData.planoVagasId}
                onChange={(e) => setFormData(prev => ({ ...prev, planoVagasId: e.target.value }))}
                disabled={loading}
              >
                <option value="">Selecione um plano</option>
                {mockPlanoVagas.map(plano => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome}
                  </option>
                ))}
              </select>
              {validationErrors.planoVagasId && (
                <span className="normalizacao-executor__error">{validationErrors.planoVagasId}</span>
              )}
            </div>

            <div className="normalizacao-executor__field">
              <label className="normalizacao-executor__label" htmlFor="executionMode">
                Modo de Execução
              </label>
              <select
                id="executionMode"
                className="normalizacao-executor__select"
                value={formData.executionMode}
                onChange={(e) => setFormData(prev => ({ ...prev, executionMode: e.target.value as FormData['executionMode'] }))}
                disabled={loading}
              >
                <option value="full">Completa</option>
                <option value="incremental">Incremental</option>
                <option value="selective">Seletiva</option>
              </select>
              <div className="normalizacao-executor__field-description">
                {getExecutionModeDescription()}
              </div>
            </div>
          </div>

          <div className="normalizacao-executor__checkbox-group">
            <label className="normalizacao-executor__checkbox-label">
              <input
                type="checkbox"
                className="normalizacao-executor__checkbox"
                checked={formData.forceRecalculate}
                onChange={(e) => setFormData(prev => ({ ...prev, forceRecalculate: e.target.checked }))}
                disabled={loading}
              />
              <span className="normalizacao-executor__checkbox-text">
                Forçar recálculo (limpa dados efetivos antes de processar)
              </span>
            </label>
          </div>
        </div>

        {/* Date Range - shown for incremental and selective modes */}
        {(formData.executionMode === 'incremental' || formData.executionMode === 'selective') && (
          <div className="normalizacao-executor__section">
            <h3 className="normalizacao-executor__section-title">Período de Processamento</h3>
            
            <div className="normalizacao-executor__field-group">
              <div className="normalizacao-executor__field">
                <label className="normalizacao-executor__label" htmlFor="dataInicio">
                  Data Início
                </label>
                <input
                  type="date"
                  id="dataInicio"
                  className="normalizacao-executor__input"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                  disabled={loading}
                />
              </div>

              <div className="normalizacao-executor__field">
                <label className="normalizacao-executor__label" htmlFor="dataFim">
                  Data Fim
                </label>
                <input
                  type="date"
                  id="dataFim"
                  className={`normalizacao-executor__input ${validationErrors.dataFim ? 'normalizacao-executor__input--error' : ''}`}
                  value={formData.dataFim}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                  disabled={loading}
                />
                {validationErrors.dataFim && (
                  <span className="normalizacao-executor__error">{validationErrors.dataFim}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Centro de Custo Selection - shown for selective mode */}
        {formData.executionMode === 'selective' && (
          <div className="normalizacao-executor__section">
            <h3 className="normalizacao-executor__section-title">Centros de Custo</h3>
            
            <div className="normalizacao-executor__centro-custo-controls">
              <button
                type="button"
                className="normalizacao-executor__control-btn"
                onClick={handleSelectAllCentrosCusto}
                disabled={loading}
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                className="normalizacao-executor__control-btn"
                onClick={handleDeselectAllCentrosCusto}
                disabled={loading}
              >
                Desmarcar Todos
              </button>
            </div>

            <div className="normalizacao-executor__centro-custo-list">
              {mockCentrosCusto.map(centroCusto => (
                <label key={centroCusto.id} className="normalizacao-executor__checkbox-label">
                  <input
                    type="checkbox"
                    className="normalizacao-executor__checkbox"
                    checked={formData.centroCustoIds.includes(centroCusto.id)}
                    onChange={(e) => handleCentroCustoChange(centroCusto.id, e.target.checked)}
                    disabled={loading}
                  />
                  <span className="normalizacao-executor__checkbox-text">
                    {centroCusto.nome}
                  </span>
                </label>
              ))}
            </div>

            {validationErrors.centroCustoIds && (
              <span className="normalizacao-executor__error">{validationErrors.centroCustoIds}</span>
            )}
          </div>
        )}

        {/* Advanced Options */}
        <div className="normalizacao-executor__section">
          <button
            type="button"
            className="normalizacao-executor__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={loading}
          >
            <span className={`normalizacao-executor__advanced-icon ${showAdvanced ? 'normalizacao-executor__advanced-icon--expanded' : ''}`}>
              ▶
            </span>
            Opções Avançadas
          </button>

          {showAdvanced && (
            <div className="normalizacao-executor__advanced-content">
              <div className="normalizacao-executor__info-box">
                <div className="normalizacao-executor__info-icon">ℹ️</div>
                <div className="normalizacao-executor__info-content">
                  <h4>Informações Importantes</h4>
                  <ul>
                    <li>A normalização processa todos os postos de trabalho independente da data de início do controle (Requisito 3.2)</li>
                    <li>O processamento é executado em tempo real com limite de 2 segundos por evento (Requisito 3.1)</li>
                    <li>Dados efetivos anteriores serão limpos se "Forçar recálculo" estiver marcado (Requisito 3.3)</li>
                    <li>Um relatório detalhado será gerado ao final do processamento (Requisito 3.4)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="normalizacao-executor__actions">
          <button
            type="submit"
            className="normalizacao-executor__submit-btn"
            disabled={isExecutionDisabled()}
          >
            {loading ? (
              <>
                <span className="normalizacao-executor__loading-spinner"></span>
                Executando...
              </>
            ) : (
              <>
                <span className="normalizacao-executor__submit-icon">⚡</span>
                Executar Normalização
              </>
            )}
          </button>

          {currentJob && currentJob.status === 'running' && (
            <div className="normalizacao-executor__current-job">
              <span className="normalizacao-executor__current-job-text">
                Job em execução: {currentJob.id}
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};