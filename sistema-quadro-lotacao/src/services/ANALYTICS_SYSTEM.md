# Analytics and Reporting System

## Overview

The Analytics and Reporting System provides comprehensive analysis of occupancy rates, comparative analysis between periods, advanced filtering capabilities, and export functionality with visual charts and trend analysis. This system fulfills requirements 5.3, 5.4, and 5.5 from the specification.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                      │
│  AnalyticsDashboard • ChartContainer • FilterPanel         │
│  ExportButton • PcDCompliance                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS SERVICE                        │
│  • Occupancy Calculations • Trend Analysis                 │
│  • Period Comparisons • Export Generation                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  QuadroLotacao • Colaborador • Cargo • CentroCusto         │
│  PlanoVagas • AuditLog                                      │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Occupancy Rate Analysis
- **By Cargo**: Calculate occupancy rates for each position type
- **By Centro de Custo**: Aggregate occupancy by cost center
- **Status Classification**: Critical (<50%), Low (50-75%), Normal (75-100%), High (>100%)
- **Real-time Calculations**: Dynamic updates based on current data

### 2. Trend Analysis
- **Temporal Data**: Monthly or quarterly trend analysis
- **Historical Comparison**: Compare current vs previous periods
- **Visual Charts**: Line charts showing occupancy trends over time
- **Predictive Insights**: Identify patterns and trends

### 3. Advanced Filtering
- **Multi-dimensional Filters**: Company, plan, cost center, position, dates
- **Dynamic Updates**: Real-time filtering without page refresh
- **Saved Filters**: Remember user preferences
- **Bulk Selection**: Multi-select for cost centers and positions

### 4. Export Functionality
- **Multiple Formats**: PDF (with charts), Excel (detailed data), CSV (raw data)
- **Customizable Content**: Include/exclude charts and detailed data
- **Filtered Exports**: Export only filtered data
- **Audit Trail**: Track all export activities

### 5. Visual Analytics
- **Interactive Charts**: Bar charts, line charts, pie charts, doughnut charts
- **Responsive Design**: Charts adapt to screen size
- **Click Interactions**: Drill-down capabilities
- **Real-time Updates**: Charts update with data changes

## API Endpoints

### Analytics Controller

```typescript
// Get occupancy rates by cargo
GET /api/analytics/occupancy/cargo
Query Parameters:
- empresaId: string (optional)
- planoVagasId: string (optional)
- centroCustoIds: string[] (optional)
- cargoIds: string[] (optional)
- dataInicio: Date (optional)
- dataFim: Date (optional)
- tipoControle: 'diario' | 'competencia' (optional)
- status: 'ativo' | 'inativo' (optional)

// Get occupancy rates by centro de custo
GET /api/analytics/occupancy/centro
Query Parameters: Same as above

// Get trend data
GET /api/analytics/trends
Query Parameters: Same as above + granularidade: 'mensal' | 'trimestral'

// Compare periods
POST /api/analytics/compare-periods
Body: {
  periodo1Id: string,
  periodo2Id: string,
  filters: AnalyticsFilters
}

// Generate complete report
GET /api/analytics/report
Query Parameters: Same as occupancy endpoints

// Export data
POST /api/analytics/export
Body: {
  formato: 'pdf' | 'excel' | 'csv',
  incluirGraficos: boolean,
  incluirDetalhes: boolean,
  filtros: AnalyticsFilters
}
```

## Service Layer

### AnalyticsService

The core service that handles all analytics calculations and data processing.

```typescript
class AnalyticsService {
  // Calculate occupancy rates by cargo
  async getOccupancyRatesByCargo(filters: AnalyticsFilters): Promise<OccupancyRate[]>
  
  // Calculate occupancy rates by centro de custo
  async getOccupancyRatesByCentro(filters: AnalyticsFilters): Promise<OccupancyRate[]>
  
  // Compare data between two periods
  async comparePeriods(periodo1Id: string, periodo2Id: string, filters: AnalyticsFilters): Promise<PeriodComparison>
  
  // Generate trend data
  async getTrendData(filters: AnalyticsFilters, granularidade: 'mensal' | 'trimestral'): Promise<TrendData[]>
  
  // Generate complete analytics report
  async generateAnalyticsReport(filters: AnalyticsFilters): Promise<AnalyticsReport>
  
  // Export data in various formats
  async exportData(options: ExportOptions): Promise<Buffer | string>
}
```

### Key Data Types

```typescript
interface OccupancyRate {
  cargoId: string;
  cargoNome: string;
  centroCustoId: string;
  centroCustoNome: string;
  vagasPrevistas: number;
  vagasEfetivas: number;
  vagasReservadas: number;
  taxaOcupacao: number;
  status: 'critico' | 'baixo' | 'normal' | 'alto';
}

interface AnalyticsReport {
  resumo: {
    totalVagasPrevistas: number;
    totalVagasEfetivas: number;
    totalVagasReservadas: number;
    taxaOcupacaoGeral: number;
    cargosCriticos: number;
  };
  ocupacaoPorCargo: OccupancyRate[];
  ocupacaoPorCentro: OccupancyRate[];
  tendencias: TrendData[];
  comparacaoPeriodos?: PeriodComparison;
}

interface TrendData {
  periodo: string;
  data: Date;
  vagasPrevistas: number;
  vagasEfetivas: number;
  taxaOcupacao: number;
}
```

## Frontend Components

### 1. AnalyticsDashboard

Main orchestrating component that brings together all analytics functionality.

**Features:**
- Summary cards with key metrics
- Interactive charts with view toggles
- Detailed data tables
- Export functionality
- Real-time updates

**Usage:**
```tsx
<AnalyticsDashboard
  empresaId="emp_001"
  initialFilters={{
    planoVagasId: 'plano_2025',
    status: 'ativo'
  }}
/>
```

### 2. ChartContainer

Responsive chart component that supports multiple chart types.

**Features:**
- Bar charts, line charts, pie charts, doughnut charts
- Interactive click events
- Responsive design
- Loading and error states
- Export capabilities

**Usage:**
```tsx
<ChartContainer
  type="bar"
  data={chartData}
  height={400}
  onDataPointClick={(dataIndex, datasetIndex) => {
    // Handle click event
  }}
/>
```

### 3. FilterPanel

Advanced filtering interface with multiple filter types.

**Features:**
- Collapsible/expandable interface
- Multi-select filters
- Date range selection
- Real-time filter application
- Active filter indicators

**Usage:**
```tsx
<FilterPanel
  filters={filters}
  onFiltersChange={setFilters}
  onApplyFilters={handleApplyFilters}
  onClearFilters={handleClearFilters}
  empresaOptions={empresaOptions}
  planoVagasOptions={planoVagasOptions}
  centroCustoOptions={centroCustoOptions}
  cargoOptions={cargoOptions}
/>
```

### 4. ExportButton

Multi-format export functionality with user-friendly interface.

**Features:**
- PDF, Excel, CSV export options
- Customizable export content
- Progress indicators
- Error handling
- Audit trail integration

**Usage:**
```tsx
<ExportButton
  onExport={handleExport}
  filters={currentFilters}
  loading={isLoading}
/>
```

## Business Logic

### Occupancy Rate Calculation

```typescript
// Calculate occupancy rate
const taxaOcupacao = vagasPrevistas > 0 
  ? (vagasEfetivas / vagasPrevistas) * 100 
  : 0;

// Classify status
let status: 'critico' | 'baixo' | 'normal' | 'alto';
if (taxaOcupacao < 50) {
  status = 'critico';
} else if (taxaOcupacao < 75) {
  status = 'baixo';
} else if (taxaOcupacao <= 100) {
  status = 'normal';
} else {
  status = 'alto';
}
```

### Trend Analysis

The system generates trend data by:
1. Dividing the time period into intervals (monthly/quarterly)
2. Calculating occupancy rates for each interval
3. Identifying patterns and variations
4. Providing visual representation of trends

### Period Comparison

Compares two different time periods by:
1. Calculating totals for each period
2. Computing deltas (differences)
3. Determining variation direction (increase/decrease/stable)
4. Providing percentage changes

## Performance Considerations

### Database Optimization
- Indexed queries on frequently filtered fields
- Efficient joins between related tables
- Pagination for large result sets
- Caching of frequently accessed data

### Frontend Optimization
- Lazy loading of chart components
- Debounced filter updates
- Memoized calculations
- Virtual scrolling for large tables

### Export Optimization
- Streaming for large exports
- Background processing for complex reports
- Compression for large files
- Progress tracking for user feedback

## Security

### Access Control
- Role-based access to analytics features
- Permission checks before data access
- Audit logging of all analytics operations
- Data filtering based on user permissions

### Data Protection
- Sensitive data masking in exports
- Secure file handling for exports
- Temporary file cleanup
- Encrypted data transmission

## Testing

### Unit Tests
- Service layer business logic
- Component rendering and interactions
- Data transformation functions
- Export functionality

### Integration Tests
- API endpoint testing
- Database query validation
- Chart rendering with real data
- Export file generation

### Property-Based Tests
- Occupancy rate calculations
- Status classification logic
- Trend analysis accuracy
- Filter application correctness

## Usage Examples

### Basic Analytics Dashboard
```tsx
import { AnalyticsDashboard } from '@/components/analytics';

function AnalyticsPage() {
  return (
    <div className="analytics-page">
      <AnalyticsDashboard empresaId="emp_001" />
    </div>
  );
}
```

### Custom Chart Implementation
```tsx
import { ChartContainer } from '@/components/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

function CustomChart() {
  const { occupancyData, loading } = useAnalytics();
  
  const chartData = {
    labels: occupancyData.map(item => item.cargoNome),
    datasets: [{
      label: 'Taxa de Ocupação (%)',
      data: occupancyData.map(item => item.taxaOcupacao),
      backgroundColor: '#1E90FF'
    }]
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ChartContainer
      type="bar"
      data={chartData}
      height={300}
    />
  );
}
```

### Export Integration
```tsx
import { ExportButton } from '@/components/analytics';
import { analyticsService } from '@/services';

function ReportsPage() {
  const handleExport = async (options) => {
    try {
      const data = await analyticsService.exportData(options);
      // Handle successful export
    } catch (error) {
      // Handle export error
    }
  };
  
  return (
    <div className="reports-page">
      <ExportButton
        onExport={handleExport}
        filters={currentFilters}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Charts not rendering**
   - Check data format matches ChartData interface
   - Verify chart type is supported
   - Ensure container has proper dimensions

2. **Export failures**
   - Check file permissions
   - Verify export format is supported
   - Ensure data size is within limits

3. **Performance issues**
   - Review filter complexity
   - Check database query performance
   - Consider data pagination

4. **Filter not working**
   - Verify filter format matches AnalyticsFilters interface
   - Check API endpoint parameters
   - Ensure proper data types

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG_ANALYTICS=true
```

This will provide detailed logging of:
- Query execution times
- Data transformation steps
- Export generation progress
- Error stack traces

## Future Enhancements

### Planned Features
- AI-powered insights and recommendations
- Advanced statistical analysis
- Custom dashboard creation
- Scheduled report generation
- Mobile app integration
- Real-time collaboration features

### Performance Improvements
- Advanced caching strategies
- Database query optimization
- Parallel processing for exports
- Progressive data loading

### User Experience
- Drag-and-drop dashboard customization
- Advanced visualization options
- Interactive data exploration
- Collaborative filtering and sharing