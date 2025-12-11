import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />)
    expect(screen.getByText('Sistema Quadro de Lotação')).toBeInTheDocument()
  })

  it('should display dashboard content', () => {
    render(<App />)
    expect(screen.getByText('Dashboard Executivo')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Ocupação')).toBeInTheDocument()
    expect(screen.getByText('Conformidade PcD')).toBeInTheDocument()
  })
})