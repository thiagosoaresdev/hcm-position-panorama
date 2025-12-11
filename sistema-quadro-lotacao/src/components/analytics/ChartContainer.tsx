import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ChartContainer.css';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    type?: 'line' | 'bar' | 'pie' | 'doughnut';
    fill?: boolean;
    tension?: number;
  }[];
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
    tooltip?: {
      enabled?: boolean;
      callbacks?: {
        label?: (context: any) => string;
        title?: (context: any) => string;
      };
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
      grid?: {
        display?: boolean;
      };
    };
    y?: {
      display?: boolean;
      beginAtZero?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
      grid?: {
        display?: boolean;
      };
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
}

interface ChartContainerProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  options?: ChartOptions;
  height?: number;
  className?: string;
  title?: string;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (dataIndex: number, datasetIndex: number, value: number, label: string) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf') => void;
  showExportButton?: boolean;
  showFullscreenButton?: boolean;
  responsive?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  type,
  data,
  options = {},
  height = 300,
  className = '',
  title,
  loading = false,
  error,
  onDataPointClick,
  onExport,
  showExportButton = false,
  showFullscreenButton = false,
  responsive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  const renderChart = useCallback(() => {
    if (!canvasRef.current || loading || error) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size based on container
    const container = containerRef.current;
    if (container && responsive) {
      canvas.width = container.offsetWidth;
      canvas.height = isFullscreen ? window.innerHeight - 120 : height;
    } else {
      canvas.width = canvas.offsetWidth;
      canvas.height = height;
    }

    // Mock chart rendering based on type with enhanced visuals
    renderMockChart(ctx, type, data, canvas.width, canvas.height);
  }, [type, data, height, loading, error, responsive, isFullscreen]);

  useEffect(() => {
    renderChart();

    // Handle window resize for responsive charts
    const handleResize = () => {
      if (responsive) {
        renderChart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [renderChart, responsive]);

  const renderMockChart = (
    ctx: CanvasRenderingContext2D, 
    chartType: string, 
    chartData: ChartData, 
    width: number, 
    height: number
  ) => {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Set styles
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#1E90FF';
    ctx.lineWidth = 2;
    ctx.font = '12px Open Sans, sans-serif';

    if (chartType === 'bar') {
      renderBarChart(ctx, chartData, padding, chartWidth, chartHeight);
    } else if (chartType === 'line') {
      renderLineChart(ctx, chartData, padding, chartWidth, chartHeight);
    } else if (chartType === 'pie' || chartType === 'doughnut') {
      renderPieChart(ctx, chartData, width / 2, height / 2, Math.min(chartWidth, chartHeight) / 2 - 20, chartType === 'doughnut');
    }
  };

  const renderBarChart = (
    ctx: CanvasRenderingContext2D, 
    chartData: ChartData, 
    padding: number, 
    chartWidth: number, 
    chartHeight: number
  ) => {
    const barWidth = chartWidth / chartData.labels.length * 0.8;
    const barSpacing = chartWidth / chartData.labels.length * 0.2;
    
    // Find max value for scaling
    const maxValue = Math.max(...chartData.datasets[0].data);
    
    chartData.labels.forEach((label, index) => {
      const value = chartData.datasets[0].data[index];
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing);
      const y = padding + chartHeight - barHeight;
      
      // Draw bar
      ctx.fillStyle = chartData.datasets[0].backgroundColor as string || '#1E90FF';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, padding + chartHeight + 20);
      
      // Draw value
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });
  };

  const renderLineChart = (
    ctx: CanvasRenderingContext2D, 
    chartData: ChartData, 
    padding: number, 
    chartWidth: number, 
    chartHeight: number
  ) => {
    const pointSpacing = chartWidth / (chartData.labels.length - 1);
    const maxValue = Math.max(...chartData.datasets[0].data);
    
    ctx.beginPath();
    chartData.datasets[0].data.forEach((value, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = '#1E90FF';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
    });
    
    ctx.strokeStyle = '#1E90FF';
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    chartData.labels.forEach((label, index) => {
      const x = padding + index * pointSpacing;
      ctx.fillText(label, x, padding + chartHeight + 20);
    });
  };

  const renderPieChart = (
    ctx: CanvasRenderingContext2D, 
    chartData: ChartData, 
    centerX: number, 
    centerY: number, 
    radius: number,
    isDoughnut: boolean = false
  ) => {
    const total = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -Math.PI / 2; // Start at top
    
    const colors = ['#1E90FF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#FD7E14'];
    
    chartData.datasets[0].data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px Open Sans, sans-serif';
      ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
    
    // Draw doughnut hole if needed
    if (isDoughnut) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDataPointClick || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Enhanced click detection for different chart types
    const clickedPoint = detectClickedDataPoint(x, y, canvas.width, canvas.height);
    if (clickedPoint) {
      const { dataIndex, datasetIndex } = clickedPoint;
      const value = data.datasets[datasetIndex]?.data[dataIndex] || 0;
      const label = data.labels[dataIndex] || '';
      onDataPointClick(dataIndex, datasetIndex, value, label);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Show tooltip on hover
    const hoveredPoint = detectClickedDataPoint(x, y, canvas.width, canvas.height);
    if (hoveredPoint) {
      const { dataIndex, datasetIndex } = hoveredPoint;
      const value = data.datasets[datasetIndex]?.data[dataIndex] || 0;
      const label = data.labels[dataIndex] || '';
      const datasetLabel = data.datasets[datasetIndex]?.label || '';
      
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        content: `${datasetLabel}: ${value} (${label})`
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const detectClickedDataPoint = (x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    const padding = 40;
    const chartWidth = canvasWidth - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;

    if (type === 'bar') {
      const barWidth = chartWidth / data.labels.length * 0.8;
      const barSpacing = chartWidth / data.labels.length * 0.2;
      
      const clickedIndex = Math.floor((x - padding) / (barWidth + barSpacing));
      if (clickedIndex >= 0 && clickedIndex < data.labels.length) {
        return { dataIndex: clickedIndex, datasetIndex: 0 };
      }
    } else if (type === 'line') {
      const pointSpacing = chartWidth / (data.labels.length - 1);
      const maxValue = Math.max(...data.datasets[0].data);
      
      for (let i = 0; i < data.labels.length; i++) {
        const pointX = padding + i * pointSpacing;
        const value = data.datasets[0].data[i];
        const pointY = padding + chartHeight - (value / maxValue) * chartHeight;
        
        // Check if click is within 10px of the point
        if (Math.abs(x - pointX) < 10 && Math.abs(y - pointY) < 10) {
          return { dataIndex: i, datasetIndex: 0 };
        }
      }
    } else if (type === 'pie' || type === 'doughnut') {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
      
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
        let currentAngle = 0;
        
        for (let i = 0; i < data.datasets[0].data.length; i++) {
          const sliceAngle = (data.datasets[0].data[i] / total) * 2 * Math.PI;
          if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
            return { dataIndex: i, datasetIndex: 0 };
          }
          currentAngle += sliceAngle;
        }
      }
    }
    
    return null;
  };

  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else if (canvasRef.current && format === 'png') {
      // Default PNG export using canvas
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`chart-container loading ${className}`} ref={containerRef}>
        {title && <div className="chart-title">{title}</div>}
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`chart-container error ${className}`} ref={containerRef}>
        {title && <div className="chart-title">{title}</div>}
        <div className="chart-error">
          <div className="error-icon">📊</div>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`chart-container ${className} ${isFullscreen ? 'fullscreen' : ''}`} 
      ref={containerRef}
    >
      {/* Chart Header */}
      <div className="chart-header">
        {title && <div className="chart-title">{title}</div>}
        
        <div className="chart-actions">
          {showExportButton && (
            <div className="export-dropdown">
              <button className="chart-action-btn" title="Exportar gráfico">
                📊
              </button>
              <div className="export-menu">
                <button onClick={() => handleExport('png')}>PNG</button>
                <button onClick={() => handleExport('svg')}>SVG</button>
                <button onClick={() => handleExport('pdf')}>PDF</button>
              </div>
            </div>
          )}
          
          {showFullscreenButton && (
            <button 
              className="chart-action-btn" 
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          )}
          
          {isFullscreen && (
            <button 
              className="chart-fullscreen-close"
              onClick={toggleFullscreen}
              title="Fechar tela cheia"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="chart-content">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
          style={{ 
            width: '100%', 
            height: `${isFullscreen ? 'calc(100vh - 120px)' : `${height}px`}`,
            cursor: onDataPointClick ? 'pointer' : 'default'
          }}
        />
      </div>
      
      {/* Legend */}
      {data.datasets.length > 0 && (
        <div className="chart-legend">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: dataset.backgroundColor as string || '#1E90FF' }}
              ></div>
              <span className="legend-label">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="chart-tooltip visible"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;