import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';
import type { QuadroLotacao } from '../../types/index.js';

// Mock the usePermissions hook
jest.mock('../../core/auth/usePermissions', () => ({
  usePermissions: () => ({
    checkPermission: jest.fn(() => true)
  })
}));

const mockData: QuadroLotacao[] = [
  {
    id: 'ql_001',
    planoVagasId: 'plano_2025',
    postoTrabalhoId: 'pt_dev_fs',
    cargoId: 'cargo_dev_pleno',
    cargoVaga: 'Desenvolvedor Full Stack Pleno',
    vagasPrevistas: 8,
    vagasEfetivas: 7,
    vagasReservadas: 1,
    dataInicioControle: new Date('2025-01-01'),
    tipoControle: 'diario',
    observacoes: 'Vaga para projeto de modernização',
    ativo: true,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-10')
  }
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} />);
    
    // Check if table headers are present
    expect(screen.getByText('Posto de Trabalho')).toBeInTheDocument();
    expect(screen.getByText('Cargo')).toBeInTheDocument();
    expect(screen.getByText('Previstas')).toBeInTheDocument();
    expect(screen.getByText('Efetivas')).toBeInTheDocument();
    
    // Check if data is displayed
    expect(screen.getByText('pt_dev_fs')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvedor Full Stack Pleno')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={[]} loading={true} />);
    
    expect(screen.getByText('Carregando dados do quadro...')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} />);
    
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
    expect(screen.getByText('Não há vagas cadastradas para os filtros selecionados.')).toBeInTheDocument();
  });

  it('calculates status badges correctly', () => {
    const deficitData: QuadroLotacao[] = [{
      ...mockData[0],
      vagasPrevistas: 5,
      vagasEfetivas: 7, // More effective than planned = deficit
    }];

    render(<DataTable data={deficitData} />);
    expect(screen.getByText('Déficit')).toBeInTheDocument();
  });
});