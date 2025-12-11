import React from 'react';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard.js';

/**
 * Example usage of the Analytics Dashboard component
 * 
 * This example demonstrates how to integrate the analytics system
 * into your application with proper filtering and export capabilities.
 */
export const AnalyticsExample: React.FC = () => {
  return (
    <div className="analytics-example">
      <h1>Analytics System Example</h1>
      
      <div className="example-section">
        <h2>Complete Analytics Dashboard</h2>
        <p>
          This dashboard provides comprehensive analytics for occupancy rates,
          comparative analysis between periods, filtering capabilities, and
          export functionality with visual charts and trend analysis.
        </p>
        
        <AnalyticsDashboard
          empresaId="emp_001"
          initialFilters={{
            planoVagasId: 'plano_2025',
            status: 'ativo'
          }}
        />
      </div>

      <div className="example-info">
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>📊 <strong>Occupancy Rate Analysis:</strong> View by cargo or centro de custo</li>
          <li>📈 <strong>Trend Analysis:</strong> Historical data with visual charts</li>
          <li>🔍 <strong>Advanced Filtering:</strong> Filter by multiple criteria</li>
          <li>📤 <strong>Export Functionality:</strong> Export to PDF, Excel, or CSV</li>
          <li>📱 <strong>Responsive Design:</strong> Works on desktop, tablet, and mobile</li>
          <li>⚡ <strong>Real-time Updates:</strong> Data refreshes automatically</li>
          <li>🎯 <strong>Status Classification:</strong> Critical, low, normal, and high occupancy</li>
          <li>📋 <strong>Detailed Tables:</strong> Comprehensive data views</li>
        </ul>

        <h3>Requirements Fulfilled:</h3>
        <ul>
          <li>✅ <strong>Requirement 5.3:</strong> Filtering by período, empresa, centro de custo e cargo</li>
          <li>✅ <strong>Requirement 5.4:</strong> Comparative analysis with variações percentuais e tendências</li>
          <li>✅ <strong>Requirement 5.5:</strong> Taxa de ocupação calculation and critical cargo identification</li>
        </ul>

        <h3>Technical Implementation:</h3>
        <ul>
          <li>🏗️ <strong>AnalyticsService:</strong> Core business logic for calculations</li>
          <li>🎨 <strong>ChartContainer:</strong> Responsive chart visualization</li>
          <li>🔧 <strong>FilterPanel:</strong> Advanced filtering interface</li>
          <li>📊 <strong>ExportButton:</strong> Multi-format export functionality</li>
          <li>🎯 <strong>AnalyticsDashboard:</strong> Main orchestrating component</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsExample;