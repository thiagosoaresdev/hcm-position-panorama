import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardService, DashboardData, DashboardFilters } from '../../services/DashboardService.js';
import { KPICard } from '../../components/dashboard/KPICard.js';
import { AlertCard } from '../../components/dashboard/AlertCard.js';
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline.js';
import { GlobalFilters } from '../../components/dashboard/GlobalFilters.js';
import { ResponsiveGrid, GridItem, ResponsiveCard } from '../../components/layout';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      const dashboardService = getDashboardService();
      const data = await dashboardService.getDashboardData(filters);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Set up auto-refresh
  useEffect(() => {
    const setupAutoRefresh = async () => {
      try {
        const dashboardService = getDashboardService();
        const config = await dashboardService.getDashboardConfig();
        
        if (config.refreshInterval > 0) {
          const interval = setInterval(() => {
            loadDashboardData(false); // Don't show loading for auto-refresh
          }, config.refreshInterval);
          
          setRefreshInterval(interval);
          
          return () => clearInterval(interval);
        }
      } catch (err) {
        console.error('Error setting up auto-refresh:', err);
      }
    };

    setupAutoRefresh();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [loadDashboardData, refreshInterval]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    loadDashboardData();
  };

  // Handle KPI card click
  const handleKPIClick = (kpiId: string) => {
    // Navigate to detailed view based on KPI
    switch (kpiId) {
      case 'taxa_ocupacao':
        window.location.href = '/analytics';
        break;
      case 'conformidade_pcd':
        window.location.href = '/analytics/pcd';
        break;
      case 'custo_contratacao':
      case 'retencao_talentos':
      case 'qualidade_contratacao':
        window.location.href = '/analytics';
        break;
      default:
        break;
    }
  };

  // Handle alert actions
  const handleAlertAction = (action: string, url?: string) => {
    if (url) {
      window.location.href = url;
    } else {
      console.log('Alert action:', action);
    }
  };

  // Handle alert dismiss
  const handleAlertDismiss = (alertId: string) => {
    if (dashboardData) {
      const updatedAlerts = dashboardData.alerts.filter(alert => alert.id !== alertId);
      setDashboardData({
        ...dashboardData,
        alerts: updatedAlerts
      });
    }
  };

  // Handle view all activities
  const handleViewAllActivities = () => {
    window.location.href = '/auditoria';
  };

  if (error) {
    return (
      <div className="dashboard dashboard--error">
        <div className="dashboard__error">
          <div className="dashboard__error-icon">⚠️</div>
          <h2 className="dashboard__error-title">Erro no Dashboard</h2>
          <p className="dashboard__error-message">{error}</p>
          <button 
            className="dashboard__error-retry"
            onClick={() => loadDashboardData()}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isLoading ? 'dashboard--loading' : ''}`}>
      <div className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__title">Dashboard Executivo</h1>
          <p className="dashboard__subtitle">
            Visão geral do quadro de vagas e indicadores de RH
          </p>
        </div>
        {dashboardData && (
          <div className="dashboard__last-updated">
            <span className="dashboard__last-updated-label">Última atualização:</span>
            <span className="dashboard__last-updated-time">
              {dashboardData.lastUpdated.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      <GlobalFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      <div className="dashboard__content">
        {/* KPI Cards Grid */}
        <div className="dashboard__section">
          <h2 className="dashboard__section-title">Indicadores Principais</h2>
          <ResponsiveGrid columns={4} gap="md">
            {dashboardData?.kpis.map(kpi => (
              <GridItem key={kpi.id}>
                <KPICard
                  kpi={kpi}
                  onClick={() => handleKPIClick(kpi.id)}
                />
              </GridItem>
            )) || (
              // Loading skeleton
              Array.from({ length: 5 }, (_, i) => (
                <GridItem key={i}>
                  <ResponsiveCard>
                    <div className="dashboard__kpi-skeleton">
                      <div className="dashboard__skeleton-header" />
                      <div className="dashboard__skeleton-value" />
                      <div className="dashboard__skeleton-label" />
                    </div>
                  </ResponsiveCard>
                </GridItem>
              ))
            )}
          </ResponsiveGrid>
        </div>

        {/* Alerts and Activities */}
        <ResponsiveGrid columns={2} gap="lg" className="dashboard__secondary-grid">
          {/* Critical Alerts */}
          <GridItem>
            <div className="dashboard__section">
              <h2 className="dashboard__section-title">
                Alertas Críticos
                {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
                  <span className="dashboard__section-count">
                    ({dashboardData.alerts.length})
                  </span>
                )}
              </h2>
              <div className="dashboard__alerts">
                {dashboardData?.alerts.length ? (
                  dashboardData.alerts.slice(0, 3).map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onActionClick={handleAlertAction}
                      onDismiss={handleAlertDismiss}
                    />
                  ))
                ) : (
                  <ResponsiveCard>
                    <div className="dashboard__no-alerts">
                      <div className="dashboard__no-alerts-icon">✅</div>
                      <p className="dashboard__no-alerts-text">
                        Nenhum alerta crítico no momento
                      </p>
                    </div>
                  </ResponsiveCard>
                )}
              </div>
            </div>
          </GridItem>

          {/* Recent Activities */}
          <GridItem>
            <div className="dashboard__section">
              <ActivityTimeline
                activities={dashboardData?.recentActivities || []}
                maxItems={7}
                onViewAll={handleViewAllActivities}
              />
            </div>
          </GridItem>
        </ResponsiveGrid>

        {/* Welcome Section (only show when no data or first time) */}
        {!dashboardData && !isLoading && (
          <div className="dashboard__welcome">
            <h2>Bem-vindo ao Sistema de Gestão de Quadro de Lotação</h2>
            <p>
              Este sistema centraliza o gerenciamento de vagas, automatiza fluxos de aprovação 
              e garante conformidade com a legislação brasileira (Lei 8.213 - PcD).
            </p>
            <p>
              <strong>Recursos principais:</strong>
            </p>
            <ul>
              <li>Dashboard executivo com KPIs em tempo real</li>
              <li>Gestão completa do quadro de lotação</li>
              <li>Normalização automática com RH Legado</li>
              <li>Workflow de aprovação de propostas</li>
              <li>Conformidade PcD automática</li>
              <li>Analytics e relatórios avançados</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};