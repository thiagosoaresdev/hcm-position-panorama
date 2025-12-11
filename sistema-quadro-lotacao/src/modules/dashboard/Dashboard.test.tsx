import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import * as DashboardService from '../../services/DashboardService.js'

// Mock the dashboard service
const mockDashboardService = {
  getDashboardData: vi.fn(),
  getDashboardConfig: vi.fn()
}

vi.mock('../../services/DashboardService.js', () => ({
  getDashboardService: () => mockDashboardService
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockDashboardService.getDashboardData.mockResolvedValue({
      kpis: [
        {
          id: 'taxa_ocupacao',
          title: 'Taxa de Ocupação',
          value: '87.5%',
          label: 'Ocupação Atual',
          status: 'success'
        }
      ],
      alerts: [],
      recentActivities: [],
      lastUpdated: new Date()
    })
    
    mockDashboardService.getDashboardConfig.mockResolvedValue({
      refreshInterval: 30000,
      alertsEnabled: true,
      kpiThresholds: {}
    })
  })

  it('should render dashboard title and subtitle', async () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard Executivo')).toBeInTheDocument()
    expect(screen.getByText('Visão geral do quadro de vagas e indicadores de RH')).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    render(<Dashboard />)
    
    // Should show loading skeletons
    expect(document.querySelector('.dashboard--loading')).toBeInTheDocument()
  })

  it('should display KPI cards after loading', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Taxa de Ocupação')).toBeInTheDocument()
      expect(screen.getByText('87.5%')).toBeInTheDocument()
    })
  })

  it('should display error state when service fails', async () => {
    mockDashboardService.getDashboardData.mockRejectedValue(new Error('Service error'))
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Erro no Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
    })
  })

  it('should display welcome message when no data', async () => {
    mockDashboardService.getDashboardData.mockResolvedValue(null)
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Bem-vindo ao Sistema de Gestão de Quadro de Lotação')).toBeInTheDocument()
    })
  })
})