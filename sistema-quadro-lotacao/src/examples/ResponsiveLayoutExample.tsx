import React from 'react'
import { ResponsiveGrid, GridItem, ResponsiveCard } from '../components/layout'

/**
 * Example demonstrating the responsive layout system
 * 
 * This example shows how to use the ResponsiveGrid, GridItem, and ResponsiveCard
 * components to create layouts that adapt to different screen sizes:
 * 
 * - Mobile (< 768px): 1 column
 * - Tablet (768px - 1279px): 2 columns  
 * - Desktop (≥ 1280px): 4 columns
 */
export const ResponsiveLayoutExample: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1>Responsive Layout System Example</h1>
      
      {/* KPI Cards Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <section style={{ marginBottom: '48px' }}>
        <h2>KPI Cards (4 columns)</h2>
        <ResponsiveGrid columns={4} gap="md">
          <GridItem>
            <ResponsiveCard>
              <h3>Taxa de Ocupação</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1E90FF' }}>
                87.5%
              </div>
              <p>↑ 2.3% vs mês anterior</p>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem>
            <ResponsiveCard>
              <h3>Conformidade PcD</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28A745' }}>
                98.2%
              </div>
              <p>✓ Dentro da meta legal</p>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem>
            <ResponsiveCard>
              <h3>Custo por Contratação</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFC107' }}>
                R$ 3.2k
              </div>
              <p>↓ 5.1% vs mês anterior</p>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem>
            <ResponsiveCard>
              <h3>Retenção de Talentos</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17A2B8' }}>
                94.7%
              </div>
              <p>↑ 1.2% vs mês anterior</p>
            </ResponsiveCard>
          </GridItem>
        </ResponsiveGrid>
      </section>

      {/* Two Column Layout */}
      <section style={{ marginBottom: '48px' }}>
        <h2>Two Column Layout</h2>
        <ResponsiveGrid columns={2} gap="lg">
          <GridItem>
            <ResponsiveCard>
              <h3>Alertas Críticos</h3>
              <div style={{ padding: '16px 0' }}>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#FFF3CD', 
                  borderLeft: '4px solid #FFC107',
                  marginBottom: '12px'
                }}>
                  <strong>Quota PcD abaixo da meta</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                    Centro de Custo TI: 3.8% (meta: 5%)
                  </p>
                </div>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F8D7DA', 
                  borderLeft: '4px solid #DC3545'
                }}>
                  <strong>Vaga crítica em aberto</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                    Gerente de Projetos - 45 dias em aberto
                  </p>
                </div>
              </div>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem>
            <ResponsiveCard>
              <h3>Atividades Recentes</h3>
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9ECEF' }}>
                  <strong>Nova proposta criada</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6C757D' }}>
                    João Silva - Inclusão de 2 vagas Analista
                  </p>
                  <small style={{ color: '#ADB5BD' }}>há 2 horas</small>
                </div>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E9ECEF' }}>
                  <strong>Normalização executada</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6C757D' }}>
                    Quadro efetivo atualizado - 15 postos processados
                  </p>
                  <small style={{ color: '#ADB5BD' }}>há 4 horas</small>
                </div>
                <div>
                  <strong>Proposta aprovada</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6C757D' }}>
                    Maria Santos - Transferência aprovada pelo RH
                  </p>
                  <small style={{ color: '#ADB5BD' }}>há 6 horas</small>
                </div>
              </div>
            </ResponsiveCard>
          </GridItem>
        </ResponsiveGrid>
      </section>

      {/* Full Width Card with Spanning */}
      <section style={{ marginBottom: '48px' }}>
        <h2>Grid with Spanning Items</h2>
        <ResponsiveGrid columns={3} gap="md">
          <GridItem span="full">
            <ResponsiveCard>
              <h3>Full Width Header</h3>
              <p>This card spans the full width of the grid on all screen sizes.</p>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem span={2}>
            <ResponsiveCard>
              <h3>Spans 2 Columns</h3>
              <p>This card spans 2 columns on desktop, but will adapt to smaller screens.</p>
            </ResponsiveCard>
          </GridItem>
          
          <GridItem>
            <ResponsiveCard>
              <h3>Single Column</h3>
              <p>Regular single column card.</p>
            </ResponsiveCard>
          </GridItem>
        </ResponsiveGrid>
      </section>

      {/* Auto-fit Grid */}
      <section>
        <h2>Auto-fit Grid</h2>
        <ResponsiveGrid columns="auto" gap="sm">
          {Array.from({ length: 8 }, (_, i) => (
            <GridItem key={i}>
              <ResponsiveCard hover={false}>
                <h4>Card {i + 1}</h4>
                <p>Auto-sized card that fits available space.</p>
              </ResponsiveCard>
            </GridItem>
          ))}
        </ResponsiveGrid>
      </section>

      {/* Responsive Behavior Info */}
      <section style={{ marginTop: '48px', padding: '24px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
        <h2>Responsive Behavior</h2>
        <ul>
          <li><strong>Mobile (&lt; 768px):</strong> All grids collapse to 1 column</li>
          <li><strong>Tablet (768px - 1279px):</strong> Maximum 2 columns</li>
          <li><strong>Desktop (≥ 1280px):</strong> Full column support (up to 4 columns)</li>
          <li><strong>Touch-friendly:</strong> Minimum 44px touch targets on mobile</li>
          <li><strong>Accessibility:</strong> Proper focus management and ARIA labels</li>
        </ul>
      </section>
    </div>
  )
}

export default ResponsiveLayoutExample