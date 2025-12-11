import React, { useState, useEffect } from 'react';
import { DashboardFilters } from '../../services/DashboardService.js';
import './GlobalFilters.css';

interface GlobalFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading = false
}) => {
  const [empresaOptions, setEmpresaOptions] = useState<FilterOption[]>([]);
  const [planoOptions, setPlanoOptions] = useState<FilterOption[]>([]);
  const [centroCustoOptions, setCentroCustoOptions] = useState<FilterOption[]>([]);

  // Mock data - in production, fetch from API
  useEffect(() => {
    setEmpresaOptions([
      { value: 'emp_001', label: 'Senior Sistemas S.A.' },
      { value: 'emp_002', label: 'Senior Solutions Ltd.' }
    ]);

    setPlanoOptions([
      { value: 'plano_2025', label: 'Plano 2025' },
      { value: 'plano_2024', label: 'Plano 2024' }
    ]);

    setCentroCustoOptions([
      { value: 'cc_ti', label: 'Tecnologia da Informação' },
      { value: 'cc_rh', label: 'Recursos Humanos' },
      { value: 'cc_adm', label: 'Administrativo' },
      { value: 'cc_vendas', label: 'Vendas' },
      { value: 'cc_marketing', label: 'Marketing' }
    ]);
  }, []);

  const handleEmpresaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      empresaId: value || undefined
    });
  };

  const handlePlanoChange = (value: string) => {
    onFiltersChange({
      ...filters,
      planoVagasId: value || undefined
    });
  };

  const handleCentroCustoChange = (selectedValues: string[]) => {
    onFiltersChange({
      ...filters,
      centroCustoIds: selectedValues.length > 0 ? selectedValues : undefined
    });
  };

  const handleDateRangeChange = (field: 'dataInicio' | 'dataFim', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = () => {
    return !!(
      filters.empresaId ||
      filters.planoVagasId ||
      filters.centroCustoIds?.length ||
      filters.dataInicio ||
      filters.dataFim
    );
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="global-filters">
      <div className="global-filters__header">
        <h3 className="global-filters__title">Filtros Globais</h3>
        <div className="global-filters__actions">
          {hasActiveFilters() && (
            <button
              className="global-filters__clear"
              onClick={clearFilters}
              disabled={isLoading}
            >
              Limpar Filtros
            </button>
          )}
          {onRefresh && (
            <button
              className={`global-filters__refresh ${isLoading ? 'global-filters__refresh--loading' : ''}`}
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Atualizar dados"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      <div className="global-filters__content">
        <div className="global-filters__row">
          <div className="global-filters__field">
            <label className="global-filters__label" htmlFor="empresa-select">
              Empresa
            </label>
            <select
              id="empresa-select"
              className="global-filters__select"
              value={filters.empresaId || ''}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Todas as empresas</option>
              {empresaOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="global-filters__field">
            <label className="global-filters__label" htmlFor="plano-select">
              Plano de Vagas
            </label>
            <select
              id="plano-select"
              className="global-filters__select"
              value={filters.planoVagasId || ''}
              onChange={(e) => handlePlanoChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Todos os planos</option>
              {planoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="global-filters__row">
          <div className="global-filters__field">
            <label className="global-filters__label" htmlFor="data-inicio">
              Data Início
            </label>
            <input
              id="data-inicio"
              type="date"
              className="global-filters__input"
              value={formatDateForInput(filters.dataInicio)}
              onChange={(e) => handleDateRangeChange('dataInicio', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="global-filters__field">
            <label className="global-filters__label" htmlFor="data-fim">
              Data Fim
            </label>
            <input
              id="data-fim"
              type="date"
              className="global-filters__input"
              value={formatDateForInput(filters.dataFim)}
              onChange={(e) => handleDateRangeChange('dataFim', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="global-filters__row">
          <div className="global-filters__field global-filters__field--full">
            <label className="global-filters__label">
              Centros de Custo
            </label>
            <div className="global-filters__checkbox-group">
              {centroCustoOptions.map(option => (
                <label key={option.value} className="global-filters__checkbox-label">
                  <input
                    type="checkbox"
                    className="global-filters__checkbox"
                    checked={filters.centroCustoIds?.includes(option.value) || false}
                    onChange={(e) => {
                      const currentValues = filters.centroCustoIds || [];
                      if (e.target.checked) {
                        handleCentroCustoChange([...currentValues, option.value]);
                      } else {
                        handleCentroCustoChange(currentValues.filter(v => v !== option.value));
                      }
                    }}
                    disabled={isLoading}
                  />
                  <span className="global-filters__checkbox-text">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters() && (
        <div className="global-filters__active">
          <span className="global-filters__active-label">Filtros ativos:</span>
          <div className="global-filters__active-tags">
            {filters.empresaId && (
              <span className="global-filters__tag">
                Empresa: {empresaOptions.find(o => o.value === filters.empresaId)?.label}
                <button
                  className="global-filters__tag-remove"
                  onClick={() => handleEmpresaChange('')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.planoVagasId && (
              <span className="global-filters__tag">
                Plano: {planoOptions.find(o => o.value === filters.planoVagasId)?.label}
                <button
                  className="global-filters__tag-remove"
                  onClick={() => handlePlanoChange('')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.centroCustoIds?.map(id => (
              <span key={id} className="global-filters__tag">
                {centroCustoOptions.find(o => o.value === id)?.label}
                <button
                  className="global-filters__tag-remove"
                  onClick={() => {
                    const newValues = filters.centroCustoIds!.filter(v => v !== id);
                    handleCentroCustoChange(newValues);
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
            {filters.dataInicio && (
              <span className="global-filters__tag">
                Início: {filters.dataInicio.toLocaleDateString('pt-BR')}
                <button
                  className="global-filters__tag-remove"
                  onClick={() => handleDateRangeChange('dataInicio', '')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.dataFim && (
              <span className="global-filters__tag">
                Fim: {filters.dataFim.toLocaleDateString('pt-BR')}
                <button
                  className="global-filters__tag-remove"
                  onClick={() => handleDateRangeChange('dataFim', '')}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};