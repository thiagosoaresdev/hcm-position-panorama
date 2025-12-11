import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../../services/AnalyticsService.js';
import type { 
  AnalyticsFilters, 
  AnalyticsReport, 
  OccupancyRate,
  TrendData,
  ExportOptions
} from '../../services/AnalyticsService.js';
import ChartContainer from './ChartContainer.js';
import type { ChartData } from './ChartContainer.js';
import FilterPanel from './FilterPanel.js';
import ExportButton from './ExportButton.js';
import PcDCompliance from './PcDCompliance.js';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  empresaId?: string;
  initialFilters?: AnalyticsFilters;
  globalFilters?: AnalyticsFilters; // For requirement 1.3
  onGlobalFilterChange?: (filters: AnalyticsFilters) => void;
  onNavigateToDetails?: (module: string, context?: any) => void; // For requirement 1.5
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  empresaId,
  initialFilters = {},
  globalFilters,
  onGlobalFilterChange,
  onNavigateToDetails
}) => {
  const [analyticsService] = useState(() => new AnalyticsService());
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...initialFilters,
    ...(empresaId && { empresaId }),
    ...(globalFilters && globalFilters) // Apply global filters (requirement 1.3)
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'cargo' | 'centro'>('cargo');

  // Mock options - in real app, these would come from API
  const [filterOptions] = useState({
    empresaOptions: [
      { value: 'emp_001', label: 'Senior Sistemas S.A.' }
    ],
    planoVagasOptions: [
      { value: 'plano_2025', label: 'Plano 2025' },
      { value: 'plano_2024', label: 'Plano 2024' }
    ],
    centroCustoOptions: [
      { value: 'cc_ti', label: 'Tecnologia da Informação' },
      { value: 'cc_rh', label: 'Recursos Humanos' },
      { value: 'cc_adm', label: 'Administrativo' }
    ],
    cargoOptions: [
      { value: 'cargo_dev_pleno', label: 'Desenvolvedor Pleno' },
      { value: 'cargo_dev_junior', label: 'Desenvolvedor Junior' },
      { value: 'cargo_gerente', label: 'Gerente' }
    ]
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Update filters when global filters change (requirement 1.3)
  useEffect(() => {
    if (globalFilters) {
      const updatedFilters = {
        ...filters,
        ...globalFilters
      };
      setFilters(updatedFilters);
      loadAnalyticsData();
    }
  }, [globalFilters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsReport = await analyticsService.generateAnalyticsReport(filters);
      setReport(analyticsReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadAnalyticsData();
  };

  const handleClearFilters = () => {
    setFilters(empresaId ? { empresaId } : {});
    loadAnalyticsData();
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      const data = await analyticsService.exportData(options);
      
      // Create download link
      const blob = new Blob([data as BlobPart], { 
        type: options.formato === 'csv' ? 'text/csv' : 'application/octet-stream' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report.${options.formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      throw error;
    }
  };

  // Handle navigation to detailed analysis (requirement 1.5)
  const handleNavigateToDetails = useCallback((analysisType: string, context?: any) => {
    if (onNavigateToDetails) {
      onNavigateToDetails(analysisType, { filters, report, context });
    }
  }, [onNavigateToDetails, filters, report]);

  // Handle chart data point clicks (requirement 1.5)
  const handleChartClick = useCallback((dataIndex: number, datasetIndex: number, value: number, label: string) => {
    const context = {
      dataIndex,
      datasetIndex,
      value,
      label,
      chartType: selectedView
    };
    handleNavigateToDetails('chart-detail', context);
  }, [handleNavigateToDetails, selectedView]);

  const getOccupancyChartData = (occupancyData: OccupancyRate[]): ChartData => {
    const sortedData = [...occupancyData].sort((a, b) => b.taxaOcupacao - a.taxaOcupacao);
    const topItems = sortedData.slice(0, 10); // Show top 10

    return {
      labels: topItems.map(item => 
        selectedView === 'cargo' ? item.cargoNome : item.centroCustoNome
      ),
      datasets: [{
        label: 'Taxa de Ocupação (%)',
        data: topItems.map(item => item.taxaOcupacao),
        backgroundColor: topItems.map(item => {
          switch (item.status) {
            case 'critico': return '#DC3545';
            case 'baixo': return '#FFC107';
            case 'normal': return '#28A745';
            case 'alto': return '#1E90FF';
            default: return '#6c757d';
          }
        }),
        borderWidth: 1
      }]
    };
  };

  const getTrendChartData = (trendData: TrendData[]): ChartData => {
    return {
      labels: trendData.map(item => item.periodo),
      datasets: [
        {
          label: 'Vagas Previstas',
          data: trendData.map(item => item.vagasPrevistas),
          borderColor: '#1E90FF',
          backgroundColor: 'rgba(30, 144, 255, 0.1)',
          type: 'line'
        },
        {
          label: 'Vagas Efetivas',
          data: trendData.map(item => item.vagasEfetivas),
          borderColor: '#28A745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          type: 'line'
        }
      ]
    };
  };

  const getStatusDistributionData = (occupancyData: OccupancyRate[]): ChartData => {
    const statusCounts = occupancyData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: ['Crítico', 'Baixo', 'Normal', 'Alto'],
      datasets: [{
        label: 'Distribuição por Status',
        data: [
          statusCounts.critico || 0,
          statusCounts.baixo || 0,
          statusCounts.normal || 0,
          statusCounts.alto || 0
        ],
        backgroundColor: ['#DC3545', '#FFC107', '#28A745', '#1E90FF']
      }]
    };
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button onClick={loadAnalyticsData} className="btn-retry">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="analytics-dashboard no-data">
        <p>Nenhum dado de analytics disponível</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Analytics e Relatórios</h1>
          <p className="subtitle">Análise de ocupação e tendências do quadro de lotação</p>
        </div>
        
        <div className="header-actions">
          <ExportButton
            onExport={handleExport}
            filters={filters}
            loading={loading}
            showDetailedAnalysis={true}
            onNavigateToDetails={handleNavigateToDetails}
          />
        </div>
      </div>

      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        loading={loading}
        globalFilters={!!globalFilters}
        onGlobalFilterChange={onGlobalFilterChange}
        autoApply={!!globalFilters}
        showPresets={true}
        {...filterOptions}
      />

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{report.resumo.totalVagasPrevistas}</div>
            <div className="card-label">Vagas Previstas</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-value">{report.resumo.totalVagasEfetivas}</div>
            <div className="card-label">Vagas Efetivas</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <div className="card-value">{report.resumo.totalVagasReservadas}</div>
            <div className="card-label">Vagas Reservadas</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{report.resumo.taxaOcupacaoGeral.toFixed(1)}%</div>
            <div className="card-label">Taxa Ocupação Geral</div>
          </div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <div className="card-value">{report.resumo.cargosCriticos}</div>
            <div className="card-label">Cargos Críticos</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Taxa de Ocupação</h3>
              <div className="view-toggle">
                <button 
                  className={selectedView === 'cargo' ? 'active' : ''}
                  onClick={() => setSelectedView('cargo')}
                >
                  Por Cargo
                </button>
                <button 
                  className={selectedView === 'centro' ? 'active' : ''}
                  onClick={() => setSelectedView('centro')}
                >
                  Por Centro
                </button>
              </div>
            </div>
            <ChartContainer
              type="bar"
              data={getOccupancyChartData(
                selectedView === 'cargo' ? report.ocupacaoPorCargo : report.ocupacaoPorCentro
              )}
              height={400}
              title={`Taxa de Ocupação por ${selectedView === 'cargo' ? 'Cargo' : 'Centro de Custo'}`}
              onDataPointClick={handleChartClick}
              showExportButton={true}
              showFullscreenButton={true}
              responsive={true}
            />
          </div>
          
          <div className="chart-card">
            <div className="chart-header">
              <h3>Distribuição por Status</h3>
            </div>
            <ChartContainer
              type="doughnut"
              data={getStatusDistributionData(
                selectedView === 'cargo' ? report.ocupacaoPorCargo : report.ocupacaoPorCentro
              )}
              height={400}
              title="Distribuição por Status"
              onDataPointClick={handleChartClick}
              showExportButton={true}
              showFullscreenButton={true}
              responsive={true}
            />
          </div>
        </div>

        {report.tendencias.length > 0 && (
          <div className="chart-row">
            <div className="chart-card full-width">
              <div className="chart-header">
                <h3>Tendência Temporal</h3>
              </div>
              <ChartContainer
                type="line"
                data={getTrendChartData(report.tendencias)}
                height={300}
                title="Tendência Temporal"
                onDataPointClick={handleChartClick}
                showExportButton={true}
                showFullscreenButton={true}
                responsive={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Tables */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <h3>Detalhes por {selectedView === 'cargo' ? 'Cargo' : 'Centro de Custo'}</h3>
          </div>
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  {selectedView === 'cargo' ? (
                    <>
                      <th>Cargo</th>
                      <th>Centro de Custo</th>
                    </>
                  ) : (
                    <th>Centro de Custo</th>
                  )}
                  <th>Previstas</th>
                  <th>Efetivas</th>
                  <th>Reservadas</th>
                  <th>Taxa Ocupação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(selectedView === 'cargo' ? report.ocupacaoPorCargo : report.ocupacaoPorCentro)
                  .slice(0, 20) // Show first 20 rows
                  .map((item, index) => (
                  <tr key={index}>
                    {selectedView === 'cargo' ? (
                      <>
                        <td>{item.cargoNome}</td>
                        <td>{item.centroCustoNome}</td>
                      </>
                    ) : (
                      <td>{item.centroCustoNome}</td>
                    )}
                    <td>{item.vagasPrevistas}</td>
                    <td>{item.vagasEfetivas}</td>
                    <td>{item.vagasReservadas}</td>
                    <td>{item.taxaOcupacao.toFixed(1)}%</td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PcD Compliance Section */}
      {empresaId && (
        <div className="pcd-section">
          <PcDCompliance
            empresaId={empresaId}
            onExport={(format) => handleExport({
              formato: format,
              incluirGraficos: format === 'pdf',
              incluirDetalhes: true,
              filtros: filters
            })}
            onRefresh={loadAnalyticsData}
            onNavigateToDetails={(section) => handleNavigateToDetails('pcd-detail', { section })}
            showDetailedActions={true}
            globalFilters={globalFilters}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;