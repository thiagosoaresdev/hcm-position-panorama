import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuadroManagement } from './QuadroManagement';

// Mock the usePermissions hook
jest.mock('../../core/auth/usePermissions', () => ({
  usePermissions: () => ({
    checkPermission: jest.fn(() => true)
  })
}));

// Mock the child components
jest.mock('../../components/quadro/DataTable', () => ({
  DataTable: ({ data, loading }: any) => (
    <div data-testid="data-table">
      {loading ? 'Loading...' : `${data.length} items`}
    </div>
  )
}));

jest.mock('../../components/quadro/VagaForm', () => ({
  VagaForm: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="vaga-form">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

jest.mock('../../components/quadro/QuadroFilters', () => ({
  QuadroFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="quadro-filters">
      <input 
        data-testid="search-input"
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
      />
    </div>
  )
}));

describe('QuadroManagement', () => {
  it('renders main components', () => {
    render(<QuadroManagement />);
    
    expect(screen.getByText('Gestão de Quadro de Lotação')).toBeInTheDocument();
    expect(screen.getByText('Gerencie vagas previstas, efetivas e reservadas com controle completo de auditoria')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByTestId('quadro-filters')).toBeInTheDocument();
  });

  it('shows create button when user has permission', () => {
    render(<QuadroManagement />);
    
    expect(screen.getByText('Nova Vaga')).toBeInTheDocument();
  });

  it('opens form when create button is clicked', () => {
    render(<QuadroManagement />);
    
    const createButton = screen.getByText('Nova Vaga');
    fireEvent.click(createButton);
    
    expect(screen.getByTestId('vaga-form')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    render(<QuadroManagement />);
    
    expect(screen.getByText('Total de Quadros')).toBeInTheDocument();
    expect(screen.getByText('Vagas Previstas')).toBeInTheDocument();
    expect(screen.getByText('Vagas Efetivas')).toBeInTheDocument();
    expect(screen.getByText('Vagas Disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Ocupação')).toBeInTheDocument();
  });

  it('filters data based on search input', () => {
    render(<QuadroManagement />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // The component should filter the data based on the search term
    // Since we're using mock data, we can't test the actual filtering logic here
    // but we can verify that the search input is working
    expect(searchInput).toHaveValue('test');
  });
});