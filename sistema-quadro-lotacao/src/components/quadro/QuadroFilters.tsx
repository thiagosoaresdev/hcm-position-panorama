import React, { useState, useEffect } from 'react';
import './QuadroFilters.css';

export interface FilterValues {
  search: string;
  planoVagasId: string;
  postoTrabalhoId: string;
  cargoId: string;
  status: 'all' | 'disponivel' | 'completo' | 'deficit';
  tipoControle: 'all' | 'diario' | 'competencia';
  dataInicio: string;
  dataFim: string;
}

interface QuadroFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const QuadroFilters: React.FC<QuadroFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Check if any filters are active (excluding search)
  useEffect(() => {
    const activeFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return false;
      if (key === 'status' || key === 'tipoControle') return value !== 'all';
      return value !== '';
    });
    setHasActiveFilters(activeFilters);
  }, [filters]);

  const handleInputChange = (key: keyof FilterValues, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearAll = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <div className="quadro-filters">
      <div className="quadro-filters__main">
        {/* Search Bar */}
        <div className="quadro-filters__search">
          <div className="quadro-filters__search-input">
            <span className="quadro-filters__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por posto, cargo ou observações..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="quadro-filters__input"
              disabled={loading}
            />
            {filters.search && (
              <button
                className="quadro-filters__clear-search"
                onClick={() => handleInputChange('search', '')}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="quadro-filters__actions">
          <button
            className={`quadro-filters__toggle ${isExpanded ? 'quadro-filters__toggle--active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={loading}
          >
            <span className="quadro-filters__toggle-icon">🔧</span>
            Filtros
            {hasActiveFilters && (
              <span className="quadro-filters__active-indicator"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              className="quadro-filters__clear-all"
              onClick={handleClearAll}
              disabled={loading}
              title="Limpar todos os filtros"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="quadro-filters__expanded">
          <div className="quadro-filters__grid">
            {/* Plano de Vagas */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="planoVagasId">
                Plano de Vagas
              </label>
              <select
                id="planoVagasId"
                value={filters.planoVagasId}
                onChange={(e) => handleInputChange('planoVagasId', e.target.value)}
                className="quadro-filters__select"
                disabled={loading}
              >
                <option value="">Todos os planos</option>
                <option value="plano_2025">Plano 2025</option>
                <option value="plano_2024">Plano 2024</option>
                <option value="plano_2023">Plano 2023</option>
              </select>
            </div>

            {/* Posto de Trabalho */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="postoTrabalhoId">
                Posto de Trabalho
              </label>
              <select
                id="postoTrabalhoId"
                value={filters.postoTrabalhoId}
                onChange={(e) => handleInputChange('postoTrabalhoId', e.target.value)}
                className="quadro-filters__select"
                disabled={loading}
              >
                <option value="">Todos os postos</option>
                <option value="pt_dev_fs">Desenvolvedor Full Stack</option>
                <option value="pt_service_desk">Service Desk</option>
                <option value="pt_analista_rh">Analista RH</option>
                <option value="pt_gerente_proj">Gerente de Projetos</option>
              </select>
            </div>

            {/* Cargo */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="cargoId">
                Cargo
              </label>
              <select
                id="cargoId"
                value={filters.cargoId}
                onChange={(e) => handleInputChange('cargoId', e.target.value)}
                className="quadro-filters__select"
                disabled={loading}
              >
                <option value="">Todos os cargos</option>
                <option value="cargo_dev_pleno">Desenvolvedor Pleno</option>
                <option value="cargo_dev_junior">Desenvolvedor Junior</option>
                <option value="cargo_dev_senior">Desenvolvedor Senior</option>
                <option value="cargo_gerente">Gerente</option>
                <option value="cargo_coordenador">Coordenador</option>
              </select>
            </div>

            {/* Status */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleInputChange('status', e.target.value as FilterValues['status'])}
                className="quadro-filters__select"
                disabled={loading}
              >
                <option value="all">Todos os status</option>
                <option value="disponivel">Disponível</option>
                <option value="completo">Completo</option>
                <option value="deficit">Com Déficit</option>
              </select>
            </div>

            {/* Tipo de Controle */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="tipoControle">
                Tipo de Controle
              </label>
              <select
                id="tipoControle"
                value={filters.tipoControle}
                onChange={(e) => handleInputChange('tipoControle', e.target.value as FilterValues['tipoControle'])}
                className="quadro-filters__select"
                disabled={loading}
              >
                <option value="all">Todos os tipos</option>
                <option value="diario">Diário</option>
                <option value="competencia">Competência</option>
              </select>
            </div>

            {/* Data Início */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="dataInicio">
                Data Início (a partir de)
              </label>
              <input
                type="date"
                id="dataInicio"
                value={filters.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                className="quadro-filters__input"
                disabled={loading}
              />
            </div>

            {/* Data Fim */}
            <div className="quadro-filters__field">
              <label className="quadro-filters__label" htmlFor="dataFim">
                Data Fim (até)
              </label>
              <input
                type="date"
                id="dataFim"
                value={filters.dataFim}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                className="quadro-filters__input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="quadro-filters__summary">
              <span className="quadro-filters__summary-label">Filtros ativos:</span>
              <div className="quadro-filters__summary-tags">
                {filters.planoVagasId && (
                  <span className="quadro-filters__tag">
                    Plano: {filters.planoVagasId}
                    <button onClick={() => handleInputChange('planoVagasId', '')}>✕</button>
                  </span>
                )}
                {filters.postoTrabalhoId && (
                  <span className="quadro-filters__tag">
                    Posto: {filters.postoTrabalhoId}
                    <button onClick={() => handleInputChange('postoTrabalhoId', '')}>✕</button>
                  </span>
                )}
                {filters.cargoId && (
                  <span className="quadro-filters__tag">
                    Cargo: {filters.cargoId}
                    <button onClick={() => handleInputChange('cargoId', '')}>✕</button>
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="quadro-filters__tag">
                    Status: {filters.status}
                    <button onClick={() => handleInputChange('status', 'all')}>✕</button>
                  </span>
                )}
                {filters.tipoControle !== 'all' && (
                  <span className="quadro-filters__tag">
                    Tipo: {filters.tipoControle}
                    <button onClick={() => handleInputChange('tipoControle', 'all')}>✕</button>
                  </span>
                )}
                {filters.dataInicio && (
                  <span className="quadro-filters__tag">
                    Início: {new Date(filters.dataInicio).toLocaleDateString('pt-BR')}
                    <button onClick={() => handleInputChange('dataInicio', '')}>✕</button>
                  </span>
                )}
                {filters.dataFim && (
                  <span className="quadro-filters__tag">
                    Fim: {new Date(filters.dataFim).toLocaleDateString('pt-BR')}
                    <button onClick={() => handleInputChange('dataFim', '')}>✕</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};