import React, { useState, useMemo } from 'react';
import { DataTable } from '../../components/quadro/DataTable.js';
import { VagaForm } from '../../components/quadro/VagaForm.js';
import { QuadroFilters, type FilterValues } from '../../components/quadro/QuadroFilters.js';
import { usePermissions } from '../../core/auth/usePermissions.js';
import type { QuadroLotacao } from '../../types/index.js';
import './QuadroManagement.css';

// Mock data for demonstration - in real app this would come from API
const mockQuadroData: QuadroLotacao[] = [
  {
    id: 'ql_001',
    planoVagasId: 'plano_2025',
    postoTrabalhoId: 'pt_dev_fs',
    cargoId: 'cargo_dev_pleno',
    cargoVaga: 'Desenvolvedor Full Stack Pleno',
    vagasPrevistas: 8,
    vagasEfetivas: 7,
    vagasReservadas: 1,
    dataInicioControle: new Date('2025-01-01'),
    tipoControle: 'diario',
    observacoes: 'Vaga para projeto de modernização',
    ativo: true,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-10')
  },
  {
    id: 'ql_002',
    planoVagasId: 'plano_2025',
    postoTrabalhoId: 'pt_service_desk',
    cargoId: 'cargo_dev_junior',
    vagasPrevistas: 5,
    vagasEfetivas: 4,
    vagasReservadas: 0,
    dataInicioControle: new Date('2025-01-01'),
    tipoControle: 'diario',
    ativo: true,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-05')
  },
  {
    id: 'ql_003',
    planoVagasId: 'plano_2025',
    postoTrabalhoId: 'pt_analista_rh',
    cargoId: 'cargo_gerente',
    vagasPrevistas: 2,
    vagasEfetivas: 3,
    vagasReservadas: 0,
    dataInicioControle: new Date('2025-01-01'),
    tipoControle: 'competencia',
    observacoes: 'Déficit temporário devido a reorganização',
    ativo: true,
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-08')
  }
];

export const QuadroManagement: React.FC = () => {
  const [quadroData, setQuadroData] = useState<QuadroLotacao[]>(mockQuadroData);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedQuadro, setSelectedQuadro] = useState<QuadroLotacao | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    planoVagasId: '',
    postoTrabalhoId: '',
    cargoId: '',
    status: 'all',
    tipoControle: 'all',
    dataInicio: '',
    dataFim: ''
  });

  const { checkPermission } = usePermissions();

  // Check permissions
  const canCreate = checkPermission('quadro_vagas:quadro:create');
  const canEdit = checkPermission('quadro_vagas:quadro:update');
  const canDelete = checkPermission('quadro_vagas:quadro:delete');
  const canView = checkPermission('quadro_vagas:quadro:read');

  // Filter and search logic
  const filteredData = useMemo(() => {
    return quadroData.filter(quadro => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          quadro.postoTrabalhoId,
          quadro.cargoId,
          quadro.cargoVaga,
          quadro.observacoes
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Plano de Vagas filter
      if (filters.planoVagasId && quadro.planoVagasId !== filters.planoVagasId) {
        return false;
      }

      // Posto de Trabalho filter
      if (filters.postoTrabalhoId && quadro.postoTrabalhoId !== filters.postoTrabalhoId) {
        return false;
      }

      // Cargo filter
      if (filters.cargoId && quadro.cargoId !== filters.cargoId) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const hasDeficit = quadro.vagasEfetivas > quadro.vagasPrevistas;
        const isFull = quadro.vagasEfetivas >= quadro.vagasPrevistas;
        const hasAvailable = quadro.vagasPrevistas > quadro.vagasEfetivas + quadro.vagasReservadas;

        switch (filters.status) {
          case 'deficit':
            if (!hasDeficit) return false;
            break;
          case 'completo':
            if (!isFull || hasDeficit) return false;
            break;
          case 'disponivel':
            if (!hasAvailable) return false;
            break;
        }
      }

      // Tipo de Controle filter
      if (filters.tipoControle !== 'all' && quadro.tipoControle !== filters.tipoControle) {
        return false;
      }

      // Date filters
      if (filters.dataInicio) {
        const dataInicio = new Date(filters.dataInicio);
        if (quadro.dataInicioControle < dataInicio) {
          return false;
        }
      }

      if (filters.dataFim) {
        const dataFim = new Date(filters.dataFim);
        if (quadro.dataInicioControle > dataFim) {
          return false;
        }
      }

      return true;
    });
  }, [quadroData, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const totalVagasPrevistas = filteredData.reduce((sum, q) => sum + q.vagasPrevistas, 0);
    const totalVagasEfetivas = filteredData.reduce((sum, q) => sum + q.vagasEfetivas, 0);
    const totalVagasReservadas = filteredData.reduce((sum, q) => sum + q.vagasReservadas, 0);
    const totalVagasDisponiveis = filteredData.reduce((sum, q) => 
      sum + Math.max(0, q.vagasPrevistas - q.vagasEfetivas - q.vagasReservadas), 0
    );
    const quadrosComDeficit = filteredData.filter(q => q.vagasEfetivas > q.vagasPrevistas).length;
    const taxaOcupacao = totalVagasPrevistas > 0 ? (totalVagasEfetivas / totalVagasPrevistas) * 100 : 0;

    return {
      total,
      totalVagasPrevistas,
      totalVagasEfetivas,
      totalVagasReservadas,
      totalVagasDisponiveis,
      quadrosComDeficit,
      taxaOcupacao: Math.round(taxaOcupacao * 100) / 100
    };
  }, [filteredData]);

  const handleCreateVaga = () => {
    setFormMode('create');
    setSelectedQuadro(null);
    setIsFormOpen(true);
  };

  const handleEditVaga = (quadro: QuadroLotacao) => {
    setFormMode('edit');
    setSelectedQuadro(quadro);
    setIsFormOpen(true);
  };

  const handleDeleteVaga = async (quadro: QuadroLotacao) => {
    if (window.confirm(`Tem certeza que deseja excluir a vaga ${quadro.id}?`)) {
      setLoading(true);
      try {
        // In real app, this would call the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQuadroData(prev => prev.filter(q => q.id !== quadro.id));
        console.log('Vaga excluída:', quadro.id);
      } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        alert('Erro ao excluir vaga. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewVaga = (quadro: QuadroLotacao) => {
    alert(`Visualizando detalhes da vaga: ${quadro.id}\n\nEsta funcionalidade será implementada em uma próxima versão.`);
  };

  const handleViewHistory = (quadro: QuadroLotacao) => {
    alert(`Histórico da vaga: ${quadro.id}\n\nEsta funcionalidade será implementada em uma próxima versão.`);
  };

  const handleFormSubmit = async (formData: any) => {
    setLoading(true);
    try {
      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (formMode === 'create') {
        const newQuadro: QuadroLotacao = {
          ...formData,
          id: formData.id,
          vagasEfetivas: 0,
          vagasReservadas: 0,
          dataInicioControle: new Date(formData.dataInicioControle),
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setQuadroData(prev => [...prev, newQuadro]);
        console.log('Nova vaga criada:', newQuadro);
      } else {
        setQuadroData(prev => prev.map(q => 
          q.id === formData.id 
            ? { ...q, ...formData, dataInicioControle: new Date(formData.dataInicioControle), updatedAt: new Date() }
            : q
        ));
        console.log('Vaga atualizada:', formData.id);
      }
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      planoVagasId: '',
      postoTrabalhoId: '',
      cargoId: '',
      status: 'all',
      tipoControle: 'all',
      dataInicio: '',
      dataFim: ''
    });
  };

  return (
    <div className="quadro-management">
      <div className="quadro-management__header">
        <div className="quadro-management__title-section">
          <h1 className="quadro-management__title">Gestão de Quadro de Lotação</h1>
          <p className="quadro-management__subtitle">
            Gerencie vagas previstas, efetivas e reservadas com controle completo de auditoria
          </p>
        </div>
        
        {canCreate && (
          <div className="quadro-management__actions">
            <button
              className="quadro-management__create-btn"
              onClick={handleCreateVaga}
              disabled={loading}
            >
              <span className="quadro-management__create-icon">➕</span>
              Nova Vaga
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="quadro-management__stats">
        <div className="quadro-management__stat-card">
          <div className="quadro-management__stat-value">{stats.total}</div>
          <div className="quadro-management__stat-label">Total de Quadros</div>
        </div>
        <div className="quadro-management__stat-card">
          <div className="quadro-management__stat-value">{stats.totalVagasPrevistas}</div>
          <div className="quadro-management__stat-label">Vagas Previstas</div>
        </div>
        <div className="quadro-management__stat-card">
          <div className="quadro-management__stat-value">{stats.totalVagasEfetivas}</div>
          <div className="quadro-management__stat-label">Vagas Efetivas</div>
        </div>
        <div className="quadro-management__stat-card">
          <div className="quadro-management__stat-value">{stats.totalVagasDisponiveis}</div>
          <div className="quadro-management__stat-label">Vagas Disponíveis</div>
        </div>
        <div className="quadro-management__stat-card">
          <div className="quadro-management__stat-value">{stats.taxaOcupacao}%</div>
          <div className="quadro-management__stat-label">Taxa de Ocupação</div>
        </div>
        {stats.quadrosComDeficit > 0 && (
          <div className="quadro-management__stat-card quadro-management__stat-card--warning">
            <div className="quadro-management__stat-value">{stats.quadrosComDeficit}</div>
            <div className="quadro-management__stat-label">Com Déficit</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <QuadroFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Results Summary */}
      <div className="quadro-management__results">
        <span className="quadro-management__results-text">
          Exibindo {filteredData.length} de {quadroData.length} quadros
        </span>
        {filteredData.length !== quadroData.length && (
          <button
            className="quadro-management__clear-filters"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredData}
        loading={loading}
        onEdit={canEdit ? handleEditVaga : undefined}
        onDelete={canDelete ? handleDeleteVaga : undefined}
        onView={canView ? handleViewVaga : undefined}
        onViewHistory={handleViewHistory}
      />

      {/* Form Modal */}
      <VagaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedQuadro}
        mode={formMode}
        loading={loading}
      />
    </div>
  );
};