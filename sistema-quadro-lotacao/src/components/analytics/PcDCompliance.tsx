import React, { useState, useEffect } from 'react';
import { PcDComplianceData, PcDAlert, PcDReport } from '../../services/PcDComplianceService.js';
import './PcDCompliance.css';

interface PcDComplianceProps {
  empresaId: string;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onRefresh?: () => void;
  onNavigateToDetails?: (section: 'history' | 'projections' | 'recommendations') => void;
  showDetailedActions?: boolean;
  globalFilters?: any; // Applied global filters
  onGlobalFilterChange?: (filters: any) => void;
}

export const PcDCompliance: React.FC<PcDComplianceProps> = ({
  empresaId,
  onExport,
  onRefresh,
  onNavigateToDetails,
  showDetailedActions = false,
  globalFilters,
  onGlobalFilterChange
}) => {
  const [complianceData, setComplianceData] = useState<PcDComplianceData | null>(null);
  const [alerts, setAlerts] = useState<PcDAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'mes' | 'trimestre' | 'ano'>('mes');

  useEffect(() => {
    loadComplianceData();
  }, [empresaId, selectedPeriod]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Em produção, fazer chamada para API
      const response = await fetch(`/api/pcd/compliance/${empresaId}?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de conformidade PcD');
      }

      const data = await response.json();
      setComplianceData(data.compliance);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (compliance: PcDComplianceData) => {
    if (compliance.conforme) {
      return {
        status: 'conforme',
        label: 'Conforme',
        className: 'status-conforme',
        icon: '✅'
      };
    } else {
      const percentualDeficit = (compliance.deficit / compliance.quantidadeObrigatoria) * 100;
      if (percentualDeficit >= 50) {
        return {
          status: 'critico',
          label: 'Crítico',
          className: 'status-critico',
          icon: '🚨'
        };
      } else if (percentualDeficit >= 25) {
        return {
          status: 'alto',
          label: 'Alto Risco',
          className: 'status-alto',
          icon: '⚠️'
        };
      } else {
        return {
          status: 'medio',
          label: 'Não Conforme',
          className: 'status-medio',
          icon: '⚡'
        };
      }
    }
  };

  const getAlertIcon = (tipo: string, prioridade: string) => {
    if (tipo === 'conformidade') return '✅';
    if (prioridade === 'critica') return '🚨';
    if (prioridade === 'alta') return '⚠️';
    if (prioridade === 'media') return '⚡';
    return 'ℹ️';
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (onExport) {
      onExport(format);
    }
  };

  const handleNavigateToDetails = (section: 'history' | 'projections' | 'recommendations') => {
    if (onNavigateToDetails) {
      onNavigateToDetails(section);
    }
  };

  const getComplianceRecommendations = (compliance: PcDComplianceData) => {
    const recommendations = [];
    
    if (!compliance.conforme) {
      recommendations.push({
        priority: 'alta',
        action: 'Contratar colaboradores PcD',
        description: `É necessário contratar ${compliance.deficit} colaboradores PcD para atingir conformidade`,
        timeline: 'Imediato'
      });
      
      if (compliance.deficit > 5) {
        recommendations.push({
          priority: 'media',
          action: 'Revisar processo seletivo',
          description: 'Implementar práticas inclusivas no recrutamento',
          timeline: '30 dias'
        });
      }
    }
    
    return recommendations;
  };

  if (loading) {
    return (
      <div className="pcd-compliance loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de conformidade PcD...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pcd-compliance error">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button onClick={loadComplianceData} className="btn-retry">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!complianceData) {
    return (
      <div className="pcd-compliance no-data">
        <p>Nenhum dado de conformidade disponível</p>
      </div>
    );
  }

  const statusInfo = getComplianceStatus(complianceData);

  return (
    <div className="pcd-compliance">
      <div className="pcd-header">
        <div className="header-title">
          <h2>Conformidade PcD - Lei 8.213</h2>
          <p className="subtitle">Monitoramento de conformidade com a legislação brasileira</p>
        </div>
        
        <div className="header-actions">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as 'mes' | 'trimestre' | 'ano')}
            className="period-selector"
          >
            <option value="mes">Último Mês</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="ano">Último Ano</option>
          </select>
          
          <button onClick={onRefresh} className="btn-refresh" title="Atualizar dados">
            🔄
          </button>
          
          <div className="export-dropdown">
            <button className="btn-export">📊 Exportar</button>
            <div className="export-menu">
              <button onClick={() => handleExport('pdf')}>PDF</button>
              <button onClick={() => handleExport('excel')}>Excel</button>
              <button onClick={() => handleExport('csv')}>CSV</button>
            </div>
          </div>
        </div>
      </div>

      <div className="compliance-overview">
        <div className={`status-card ${statusInfo.className}`}>
          <div className="status-icon">{statusInfo.icon}</div>
          <div className="status-content">
            <h3>{statusInfo.label}</h3>
            <p className="status-description">
              {complianceData.conforme 
                ? `${complianceData.totalPcD} PcD de ${complianceData.quantidadeObrigatoria} obrigatórios`
                : `Déficit de ${complianceData.deficit} colaboradores PcD`
              }
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{complianceData.totalColaboradores}</div>
            <div className="metric-label">Total Colaboradores</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{complianceData.totalPcD}</div>
            <div className="metric-label">Colaboradores PcD</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{complianceData.percentualAtual.toFixed(1)}%</div>
            <div className="metric-label">Percentual Atual</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{complianceData.percentualObrigatorio}%</div>
            <div className="metric-label">Percentual Obrigatório</div>
          </div>
        </div>
      </div>

      <div className="compliance-details">
        <div className="detail-section">
          <h3>Detalhes da Conformidade</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Faixa da Lei 8.213:</label>
              <span>{complianceData.faixaLei}</span>
            </div>
            <div className="detail-item">
              <label>Quantidade Obrigatória:</label>
              <span>{complianceData.quantidadeObrigatoria} colaboradores</span>
            </div>
            <div className="detail-item">
              <label>Déficit:</label>
              <span className={complianceData.deficit > 0 ? 'deficit' : 'surplus'}>
                {complianceData.deficit > 0 ? `-${complianceData.deficit}` : '0'} colaboradores
              </span>
            </div>
          </div>
        </div>

        <div className="progress-section">
          <h3>Progresso da Meta</h3>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${statusInfo.className}`}
              style={{ 
                width: `${Math.min(100, (complianceData.totalPcD / complianceData.quantidadeObrigatoria) * 100)}%` 
              }}
            ></div>
          </div>
          <div className="progress-labels">
            <span>0</span>
            <span className="progress-current">{complianceData.totalPcD}</span>
            <span className="progress-target">{complianceData.quantidadeObrigatoria}</span>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Alertas e Recomendações</h3>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.prioridade}`}>
                <div className="alert-header">
                  <span className="alert-icon">{getAlertIcon(alert.tipo, alert.prioridade)}</span>
                  <div className="alert-title">
                    <h4>{alert.tipo.charAt(0).toUpperCase() + alert.tipo.slice(1)}</h4>
                    <span className="alert-priority">{alert.prioridade.toUpperCase()}</span>
                  </div>
                  <span className="alert-date">
                    {new Date(alert.dataDeteccao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <p className="alert-message">{alert.mensagem}</p>
                
                {alert.acoesSugeridas.length > 0 && (
                  <div className="alert-actions">
                    <h5>Ações Sugeridas:</h5>
                    <ul>
                      {alert.acoesSugeridas.map((acao, actionIndex) => (
                        <li key={actionIndex}>{acao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {complianceData && !complianceData.conforme && (
        <div className="recommendations-section">
          <h3>Recomendações</h3>
          <div className="recommendations-list">
            {getComplianceRecommendations(complianceData).map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                <div className="recommendation-header">
                  <span className="priority-badge">{rec.priority.toUpperCase()}</span>
                  <span className="timeline">{rec.timeline}</span>
                </div>
                <h4>{rec.action}</h4>
                <p>{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Actions (Requirement 1.5) */}
      {showDetailedActions && (
        <div className="detailed-actions">
          <h3>Análises Detalhadas</h3>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => handleNavigateToDetails('history')}
            >
              📊 Histórico Detalhado
            </button>
            <button 
              className="action-btn"
              onClick={() => handleNavigateToDetails('projections')}
            >
              📈 Projeções Futuras
            </button>
            <button 
              className="action-btn"
              onClick={() => handleNavigateToDetails('recommendations')}
            >
              💡 Plano de Ação
            </button>
          </div>
        </div>
      )}

      <div className="compliance-footer">
        <div className="legal-info">
          <p>
            <strong>Lei 8.213/91:</strong> Empresas com 50 ou mais colaboradores devem manter 
            de 2% a 5% de seus cargos preenchidos por pessoas com deficiência.
          </p>
        </div>
        
        <div className="last-update">
          <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default PcDCompliance;