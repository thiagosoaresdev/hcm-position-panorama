import React, { useState } from 'react';
import { ExportOptions } from '../../services/AnalyticsService.js';
import './ExportButton.css';

interface ExportButtonProps {
  onExport: (options: ExportOptions) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  filters: ExportOptions['filtros'];
  showDetailedAnalysis?: boolean; // For requirement 1.5
  onNavigateToDetails?: (analysisType: 'occupancy' | 'trends' | 'comparison' | 'pcd') => void;
  customFormats?: Array<{
    key: string;
    label: string;
    description: string;
    icon: string;
  }>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  loading = false,
  filters,
  showDetailedAnalysis = false,
  onNavigateToDetails,
  customFormats = []
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      setExportLoading(formato);
      setIsMenuOpen(false);
      
      const options: ExportOptions = {
        formato,
        incluirGraficos: formato === 'pdf',
        incluirDetalhes: true,
        filtros: filters
      };
      
      await onExport(options);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      // In a real app, show toast notification
    } finally {
      setExportLoading(null);
    }
  };

  const getFormatIcon = (formato: string) => {
    switch (formato) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'csv':
        return '📋';
      default:
        return '📁';
    }
  };

  const getFormatDescription = (formato: string) => {
    switch (formato) {
      case 'pdf':
        return 'Relatório completo com gráficos';
      case 'excel':
        return 'Planilha com dados detalhados';
      case 'csv':
        return 'Dados em formato texto';
      default:
        return '';
    }
  };

  const handleNavigateToDetails = (analysisType: 'occupancy' | 'trends' | 'comparison' | 'pcd') => {
    if (onNavigateToDetails) {
      onNavigateToDetails(analysisType);
    }
    setIsMenuOpen(false);
  };

  const allFormats = [
    { key: 'pdf', label: 'PDF', description: getFormatDescription('pdf'), icon: getFormatIcon('pdf') },
    { key: 'excel', label: 'EXCEL', description: getFormatDescription('excel'), icon: getFormatIcon('excel') },
    { key: 'csv', label: 'CSV', description: getFormatDescription('csv'), icon: getFormatIcon('csv') },
    ...customFormats
  ];

  return (
    <div className="export-button-container">
      <button
        className={`export-button ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={disabled || loading || exportLoading !== null}
        title="Exportar dados"
      >
        {exportLoading ? (
          <>
            <span className="loading-spinner"></span>
            Exportando...
          </>
        ) : (
          <>
            📊 Exportar
            <span className="dropdown-arrow">{isMenuOpen ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {isMenuOpen && (
        <div className="export-menu">
          <div className="export-menu-header">
            <h4>Escolha o formato</h4>
            <button 
              className="close-menu"
              onClick={() => setIsMenuOpen(false)}
              title="Fechar menu"
            >
              ✕
            </button>
          </div>
          
          <div className="export-options">
            {/* Export Formats */}
            <div className="option-section">
              <div className="section-title">Exportar Dados</div>
              {allFormats.map(format => (
                <button
                  key={format.key}
                  className="export-option"
                  onClick={() => handleExport(format.key as 'pdf' | 'excel' | 'csv')}
                  disabled={exportLoading !== null}
                >
                  <div className="option-icon">
                    {format.icon}
                  </div>
                  <div className="option-content">
                    <div className="option-title">
                      {format.label}
                    </div>
                    <div className="option-description">
                      {format.description}
                    </div>
                  </div>
                  <div className="option-arrow">→</div>
                </button>
              ))}
            </div>

            {/* Detailed Analysis Navigation (Requirement 1.5) */}
            {showDetailedAnalysis && onNavigateToDetails && (
              <div className="option-section">
                <div className="section-title">Análise Detalhada</div>
                <button
                  className="export-option analysis-option"
                  onClick={() => handleNavigateToDetails('occupancy')}
                  disabled={exportLoading !== null}
                >
                  <div className="option-icon">📊</div>
                  <div className="option-content">
                    <div className="option-title">Taxa de Ocupação</div>
                    <div className="option-description">Análise detalhada por cargo e centro</div>
                  </div>
                  <div className="option-arrow">→</div>
                </button>
                
                <button
                  className="export-option analysis-option"
                  onClick={() => handleNavigateToDetails('trends')}
                  disabled={exportLoading !== null}
                >
                  <div className="option-icon">📈</div>
                  <div className="option-content">
                    <div className="option-title">Tendências</div>
                    <div className="option-description">Evolução temporal dos indicadores</div>
                  </div>
                  <div className="option-arrow">→</div>
                </button>
                
                <button
                  className="export-option analysis-option"
                  onClick={() => handleNavigateToDetails('comparison')}
                  disabled={exportLoading !== null}
                >
                  <div className="option-icon">⚖️</div>
                  <div className="option-content">
                    <div className="option-title">Comparação</div>
                    <div className="option-description">Comparar períodos e cenários</div>
                  </div>
                  <div className="option-arrow">→</div>
                </button>
                
                <button
                  className="export-option analysis-option"
                  onClick={() => handleNavigateToDetails('pcd')}
                  disabled={exportLoading !== null}
                >
                  <div className="option-icon">♿</div>
                  <div className="option-content">
                    <div className="option-title">Conformidade PcD</div>
                    <div className="option-description">Análise Lei 8.213 detalhada</div>
                  </div>
                  <div className="option-arrow">→</div>
                </button>
              </div>
            )}
          </div>
          
          <div className="export-menu-footer">
            <p className="export-note">
              Os dados serão exportados com base nos filtros aplicados
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div 
          className="export-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;