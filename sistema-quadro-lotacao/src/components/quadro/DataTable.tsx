import React, { useState, useMemo } from 'react';
import type { QuadroLotacao } from '../../types/index.js';
import { usePermissions } from '../../core/auth/usePermissions.js';
import './DataTable.css';

interface DataTableProps {
  data: QuadroLotacao[];
  loading?: boolean;
  onEdit?: (quadro: QuadroLotacao) => void;
  onDelete?: (quadro: QuadroLotacao) => void;
  onView?: (quadro: QuadroLotacao) => void;
  onViewHistory?: (quadro: QuadroLotacao) => void;
}

interface SortConfig {
  key: keyof QuadroLotacao | null;
  direction: 'asc' | 'desc';
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onViewHistory
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const { checkPermission } = usePermissions();

  // Check permissions for different actions
  const canEdit = checkPermission('quadro_vagas:quadro:update');
  const canDelete = checkPermission('quadro_vagas:quadro:delete');
  const canView = checkPermission('quadro_vagas:quadro:read');
  const canViewHistory = checkPermission('quadro_vagas:audit:read');

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof QuadroLotacao) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof QuadroLotacao) => {
    if (sortConfig.key !== key) {
      return <span className="datatable__sort-icon">↕️</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="datatable__sort-icon datatable__sort-icon--active">↑</span>
      : <span className="datatable__sort-icon datatable__sort-icon--active">↓</span>;
  };

  const getStatusBadge = (quadro: QuadroLotacao) => {
    const taxaOcupacao = quadro.vagasPrevistas > 0 
      ? (quadro.vagasEfetivas / quadro.vagasPrevistas) * 100 
      : 0;
    
    const hasDeficit = quadro.vagasEfetivas > quadro.vagasPrevistas;
    const isFull = quadro.vagasEfetivas >= quadro.vagasPrevistas;
    
    if (hasDeficit) {
      return <span className="datatable__badge datatable__badge--danger">Déficit</span>;
    }
    if (isFull) {
      return <span className="datatable__badge datatable__badge--success">Completo</span>;
    }
    if (taxaOcupacao >= 80) {
      return <span className="datatable__badge datatable__badge--warning">Quase Completo</span>;
    }
    return <span className="datatable__badge datatable__badge--info">Disponível</span>;
  };

  const getVagasDisponiveis = (quadro: QuadroLotacao) => {
    return Math.max(0, quadro.vagasPrevistas - quadro.vagasEfetivas - quadro.vagasReservadas);
  };

  const getTaxaOcupacao = (quadro: QuadroLotacao) => {
    if (quadro.vagasPrevistas === 0) return 0;
    return Math.round((quadro.vagasEfetivas / quadro.vagasPrevistas) * 100);
  };

  if (loading) {
    return (
      <div className="datatable__loading">
        <div className="datatable__loading-spinner"></div>
        <p>Carregando dados do quadro...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="datatable__empty">
        <div className="datatable__empty-icon">📋</div>
        <h3>Nenhum registro encontrado</h3>
        <p>Não há vagas cadastradas para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="datatable">
      <div className="datatable__container">
        <table className="datatable__table">
          <thead className="datatable__header">
            <tr>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('postoTrabalhoId')}
              >
                Posto de Trabalho {getSortIcon('postoTrabalhoId')}
              </th>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('cargoId')}
              >
                Cargo {getSortIcon('cargoId')}
              </th>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('vagasPrevistas')}
              >
                Previstas {getSortIcon('vagasPrevistas')}
              </th>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('vagasEfetivas')}
              >
                Efetivas {getSortIcon('vagasEfetivas')}
              </th>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('vagasReservadas')}
              >
                Reservadas {getSortIcon('vagasReservadas')}
              </th>
              <th className="datatable__header-cell">
                Disponíveis
              </th>
              <th className="datatable__header-cell">
                Taxa Ocupação
              </th>
              <th className="datatable__header-cell">
                Status
              </th>
              <th 
                className="datatable__header-cell datatable__header-cell--sortable"
                onClick={() => handleSort('dataInicioControle')}
              >
                Início Controle {getSortIcon('dataInicioControle')}
              </th>
              <th className="datatable__header-cell datatable__header-cell--actions">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="datatable__body">
            {sortedData.map((quadro) => (
              <tr key={quadro.id} className="datatable__row">
                <td className="datatable__cell">
                  <div className="datatable__cell-content">
                    <span className="datatable__cell-primary">
                      {quadro.postoTrabalhoId}
                    </span>
                  </div>
                </td>
                <td className="datatable__cell">
                  <div className="datatable__cell-content">
                    <span className="datatable__cell-primary">
                      {quadro.cargoVaga || quadro.cargoId}
                    </span>
                    {quadro.cargoVaga && quadro.cargoVaga !== quadro.cargoId && (
                      <span className="datatable__cell-secondary">
                        (Cargo: {quadro.cargoId})
                      </span>
                    )}
                  </div>
                </td>
                <td className="datatable__cell datatable__cell--number">
                  {quadro.vagasPrevistas}
                </td>
                <td className="datatable__cell datatable__cell--number">
                  {quadro.vagasEfetivas}
                </td>
                <td className="datatable__cell datatable__cell--number">
                  {quadro.vagasReservadas}
                </td>
                <td className="datatable__cell datatable__cell--number">
                  <span className={`datatable__available ${getVagasDisponiveis(quadro) === 0 ? 'datatable__available--zero' : ''}`}>
                    {getVagasDisponiveis(quadro)}
                  </span>
                </td>
                <td className="datatable__cell datatable__cell--number">
                  <div className="datatable__progress">
                    <div className="datatable__progress-bar">
                      <div 
                        className="datatable__progress-fill"
                        style={{ width: `${Math.min(getTaxaOcupacao(quadro), 100)}%` }}
                      ></div>
                    </div>
                    <span className="datatable__progress-text">
                      {getTaxaOcupacao(quadro)}%
                    </span>
                  </div>
                </td>
                <td className="datatable__cell">
                  {getStatusBadge(quadro)}
                </td>
                <td className="datatable__cell">
                  <span className="datatable__date">
                    {new Date(quadro.dataInicioControle).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="datatable__control-type">
                    {quadro.tipoControle === 'diario' ? 'Diário' : 'Competência'}
                  </span>
                </td>
                <td className="datatable__cell datatable__cell--actions">
                  <div className="datatable__actions">
                    {canView && onView && (
                      <button
                        className="datatable__action-btn datatable__action-btn--view"
                        onClick={() => onView(quadro)}
                        title="Visualizar detalhes"
                      >
                        👁️
                      </button>
                    )}
                    {canEdit && onEdit && (
                      <button
                        className="datatable__action-btn datatable__action-btn--edit"
                        onClick={() => onEdit(quadro)}
                        title="Editar vaga"
                      >
                        ✏️
                      </button>
                    )}
                    {canViewHistory && onViewHistory && (
                      <button
                        className="datatable__action-btn datatable__action-btn--history"
                        onClick={() => onViewHistory(quadro)}
                        title="Ver histórico"
                      >
                        📋
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        className="datatable__action-btn datatable__action-btn--delete"
                        onClick={() => onDelete(quadro)}
                        title="Excluir vaga"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};