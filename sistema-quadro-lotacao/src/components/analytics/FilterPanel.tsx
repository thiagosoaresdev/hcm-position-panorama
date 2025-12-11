import React, { useState, useEffect } from 'react';
import { AnalyticsFilters } from '../../services/AnalyticsService.js';
import './FilterPanel.css';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  loading?: boolean;
  empresaOptions?: FilterOption[];
  planoVagasOptions?: FilterOption[];
  centroCustoOptions?: FilterOption[];
  cargoOptions?: FilterOption[];
  globalFilters?: boolean; // Indicates if this is a global filter panel
  onGlobalFilterChange?: (filters: AnalyticsFilters) => void; // For requirement 1.3
  autoApply?: boolean; // Auto-apply filters on change
  showPresets?: boolean; // Show filter presets
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  loading = false,
  empresaOptions = [],
  planoVagasOptions = [],
  centroCustoOptions = [],
  cargoOptions = [],
  globalFilters = false,
  onGlobalFilterChange,
  autoApply = false,
  showPresets = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    
    // For global filters (requirement 1.3), apply changes immediately
    if (globalFilters && onGlobalFilterChange) {
      onGlobalFilterChange(updatedFilters);
    }
    
    // Auto-apply if enabled
    if (autoApply) {
      onFiltersChange(updatedFilters);
      onApplyFilters();
    }
  };

  const handleMultiSelectChange = (key: keyof AnalyticsFilters, value: string, checked: boolean) => {
    const currentValues = (localFilters[key] as string[]) || [];
    let updatedValues: string[];
    
    if (checked) {
      updatedValues = [...currentValues, value];
    } else {
      updatedValues = currentValues.filter(v => v !== value);
    }
    
    handleFilterChange(key, updatedValues.length > 0 ? updatedValues : undefined);
  };

  const handleDateChange = (key: 'dataInicio' | 'dataFim', value: string) => {
    const date = value ? new Date(value) : undefined;
    handleFilterChange(key, date);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
  };

  const clearFilters = () => {
    const clearedFilters: AnalyticsFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = () => {
    return Object.keys(localFilters).some(key => {
      const value = localFilters[key as keyof AnalyticsFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Filter presets for quick selection
  const filterPresets = [
    {
      name: 'Último Mês',
      filters: {
        dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dataFim: new Date()
      }
    },
    {
      name: 'Último Trimestre',
      filters: {
        dataInicio: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        dataFim: new Date()
      }
    },
    {
      name: 'Último Ano',
      filters: {
        dataInicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        dataFim: new Date()
      }
    },
    {
      name: 'Apenas Ativos',
      filters: {
        status: 'ativo' as const
      }
    }
  ];

  const applyPreset = (preset: typeof filterPresets[0]) => {
    const updatedFilters = { ...localFilters, ...preset.filters };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
    if (autoApply || globalFilters) {
      onApplyFilters();
    }
  };

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : 'collapsed'} ${globalFilters ? 'global-filters' : ''}`}>
      <div className="filter-header">
        <div className="filter-title">
          <h3>{globalFilters ? 'Filtros Globais' : 'Filtros Avançados'}</h3>
          {hasActiveFilters() && (
            <span className="active-filters-badge">
              {Object.keys(localFilters).filter(key => {
                const value = localFilters[key as keyof AnalyticsFilters];
                return value !== undefined && value !== null && 
                       (Array.isArray(value) ? value.length > 0 : true);
              }).length}
            </span>
          )}
          {globalFilters && (
            <span className="global-indicator" title="Estes filtros afetam todos os indicadores">
              🌐
            </span>
          )}
        </div>
        
        <div className="filter-actions">
          {showPresets && (
            <div className="presets-dropdown">
              <button className="btn-presets" title="Filtros predefinidos">
                ⚡
              </button>
              <div className="presets-menu">
                {filterPresets.map((preset, index) => (
                  <button 
                    key={index}
                    onClick={() => applyPreset(preset)}
                    disabled={loading}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            className="btn-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher filtros' : 'Expandir filtros'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          <div className="filter-grid">
            {/* Empresa Filter */}
            {empresaOptions.length > 0 && (
              <div className="filter-group">
                <label htmlFor="empresa-filter">Empresa</label>
                <select
                  id="empresa-filter"
                  value={localFilters.empresaId || ''}
                  onChange={(e) => handleFilterChange('empresaId', e.target.value || undefined)}
                  disabled={loading}
                >
                  <option value="">Todas as empresas</option>
                  {empresaOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Plano de Vagas Filter */}
            {planoVagasOptions.length > 0 && (
              <div className="filter-group">
                <label htmlFor="plano-filter">Plano de Vagas</label>
                <select
                  id="plano-filter"
                  value={localFilters.planoVagasId || ''}
                  onChange={(e) => handleFilterChange('planoVagasId', e.target.value || undefined)}
                  disabled={loading}
                >
                  <option value="">Todos os planos</option>
                  {planoVagasOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filters */}
            <div className="filter-group">
              <label htmlFor="data-inicio-filter">Data Início</label>
              <input
                id="data-inicio-filter"
                type="date"
                value={formatDateForInput(localFilters.dataInicio)}
                onChange={(e) => handleDateChange('dataInicio', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="data-fim-filter">Data Fim</label>
              <input
                id="data-fim-filter"
                type="date"
                value={formatDateForInput(localFilters.dataFim)}
                onChange={(e) => handleDateChange('dataFim', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Tipo Controle Filter */}
            <div className="filter-group">
              <label htmlFor="tipo-controle-filter">Tipo de Controle</label>
              <select
                id="tipo-controle-filter"
                value={localFilters.tipoControle || ''}
                onChange={(e) => handleFilterChange('tipoControle', e.target.value || undefined)}
                disabled={loading}
              >
                <option value="">Todos os tipos</option>
                <option value="diario">Diário</option>
                <option value="competencia">Competência</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                disabled={loading}
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Multi-select filters */}
          {centroCustoOptions.length > 0 && (
            <div className="filter-group multi-select">
              <label>Centros de Custo</label>
              <div className="multi-select-container">
                <div className="multi-select-options">
                  {centroCustoOptions.map(option => (
                    <label key={option.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(localFilters.centroCustoIds || []).includes(option.value)}
                        onChange={(e) => handleMultiSelectChange('centroCustoIds', option.value, e.target.checked)}
                        disabled={loading}
                      />
                      <span className="checkbox-text">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cargoOptions.length > 0 && (
            <div className="filter-group multi-select">
              <label>Cargos</label>
              <div className="multi-select-container">
                <div className="multi-select-options">
                  {cargoOptions.map(option => (
                    <label key={option.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(localFilters.cargoIds || []).includes(option.value)}
                        onChange={(e) => handleMultiSelectChange('cargoIds', option.value, e.target.checked)}
                        disabled={loading}
                      />
                      <span className="checkbox-text">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filter Actions */}
          {!autoApply && !globalFilters && (
            <div className="filter-buttons">
              <button 
                className="btn-apply"
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? 'Aplicando...' : 'Aplicar Filtros'}
              </button>
              
              <button 
                className="btn-clear"
                onClick={clearFilters}
                disabled={loading || !hasActiveFilters()}
              >
                Limpar Filtros
              </button>
            </div>
          )}
          
          {(autoApply || globalFilters) && (
            <div className="filter-info">
              <div className="auto-apply-indicator">
                <span className="indicator-icon">⚡</span>
                <span className="indicator-text">
                  {globalFilters ? 'Filtros aplicados globalmente' : 'Filtros aplicados automaticamente'}
                </span>
                <button 
                  className="btn-clear-inline"
                  onClick={clearFilters}
                  disabled={loading || !hasActiveFilters()}
                  title="Limpar filtros"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;