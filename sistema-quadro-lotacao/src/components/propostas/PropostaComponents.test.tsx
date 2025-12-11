import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropostaForm } from './PropostaForm';
import { WorkflowViewer } from './WorkflowViewer';
import { AprovacaoModal } from './AprovacaoModal';
import { StatusBadge } from './StatusBadge';
import type { Proposta, Aprovacao, QuadroLotacao } from '../../types/index';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn((fn) => fn),
    reset: vi.fn(),
    watch: vi.fn(() => 'inclusao'),
    setValue: vi.fn(),
    trigger: vi.fn(() => Promise.resolve(true)),
    formState: { errors: {}, isValid: true }
  })
}));

describe('Proposta Components', () => {
  describe('StatusBadge', () => {
    it('should render draft status correctly', () => {
      render(<StatusBadge status="rascunho" />);
      expect(screen.getByText('Rascunho')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should render approved status correctly', () => {
      render(<StatusBadge status="aprovada" />);
      expect(screen.getByText('Aprovada')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should render rejected status correctly', () => {
      render(<StatusBadge status="rejeitada" />);
      expect(screen.getByText('Rejeitada')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should render pending status with progress bar', () => {
      render(<StatusBadge status="nivel_1" />);
      expect(screen.getByText('Nível 1')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(document.querySelector('.status-badge__progress')).toBeInTheDocument();
    });

    it('should render without icon when showIcon is false', () => {
      render(<StatusBadge status="aprovada" showIcon={false} />);
      expect(screen.getByText('Aprovada')).toBeInTheDocument();
      expect(screen.queryByText('✅')).not.toBeInTheDocument();
    });

    it('should apply size classes correctly', () => {
      const { container } = render(<StatusBadge status="aprovada" size="lg" />);
      expect(container.firstChild).toHaveClass('status-badge--lg');
    });
  });

  describe('PropostaForm', () => {
    const mockProps = {
      isOpen: true,
      onClose: vi.fn(),
      onSubmit: vi.fn(),
      mode: 'create' as const,
      quadrosLotacao: [] as QuadroLotacao[]
    };

    it('should render form when open', () => {
      render(<PropostaForm {...mockProps} />);
      expect(screen.getByText('Nova Proposta')).toBeInTheDocument();
      expect(screen.getByText('Informações Básicas')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<PropostaForm {...mockProps} isOpen={false} />);
      expect(screen.queryByText('Nova Proposta')).not.toBeInTheDocument();
    });

    it('should show edit title in edit mode', () => {
      render(<PropostaForm {...mockProps} mode="edit" />);
      expect(screen.getByText('Editar Proposta')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PropostaForm {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /✕/ });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should show progress steps', () => {
      render(<PropostaForm {...mockProps} />);
      expect(screen.getByText('Básico')).toBeInTheDocument();
      expect(screen.getByText('Detalhes')).toBeInTheDocument();
      expect(screen.getByText('Finalizar')).toBeInTheDocument();
    });

    it('should show step 1 content initially', () => {
      render(<PropostaForm {...mockProps} />);
      expect(screen.getByLabelText(/Tipo de Proposta/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descrição da Proposta/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quadro de Lotação/)).toBeInTheDocument();
    });
  });

  describe('WorkflowViewer', () => {
    const mockProposta: Proposta = {
      id: 'prop-1',
      tipo: 'inclusao',
      descricao: 'Test proposta',
      detalhamento: 'Test details',
      solicitanteId: 'user-1',
      quadroLotacaoId: 'quadro-1',
      status: 'nivel_1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    const mockAprovacoes: Aprovacao[] = [
      {
        id: 'apr-1',
        propostaId: 'prop-1',
        nivel: 1,
        aprovadorId: 'coord-1',
        acao: 'aguardando',
        createdAt: new Date('2024-01-01')
      }
    ];

    it('should render workflow viewer', () => {
      render(<WorkflowViewer proposta={mockProposta} aprovacoes={mockAprovacoes} />);
      expect(screen.getByText('Fluxo de Aprovação')).toBeInTheDocument();
    });

    it('should show proposta information', () => {
      render(<WorkflowViewer proposta={mockProposta} aprovacoes={mockAprovacoes} />);
      expect(screen.getByText('Inclusao')).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    });

    it('should show workflow steps', () => {
      render(<WorkflowViewer proposta={mockProposta} aprovacoes={mockAprovacoes} />);
      expect(screen.getByText('Coordenação')).toBeInTheDocument();
      expect(screen.getByText('Gerência')).toBeInTheDocument();
      expect(screen.getByText('Diretoria')).toBeInTheDocument();
      expect(screen.getByText('RH')).toBeInTheDocument();
    });

    it('should show current status', () => {
      render(<WorkflowViewer proposta={mockProposta} aprovacoes={mockAprovacoes} />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('should show timeline', () => {
      render(<WorkflowViewer proposta={mockProposta} aprovacoes={mockAprovacoes} />);
      expect(screen.getByText('Histórico')).toBeInTheDocument();
      expect(screen.getByText('Proposta criada')).toBeInTheDocument();
    });
  });

  describe('AprovacaoModal', () => {
    const mockProposta: Proposta = {
      id: 'prop-1',
      tipo: 'inclusao',
      descricao: 'Test proposta',
      detalhamento: 'Test details',
      solicitanteId: 'user-1',
      quadroLotacaoId: 'quadro-1',
      status: 'nivel_1',
      vagasSolicitadas: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    const mockProps = {
      isOpen: true,
      onClose: vi.fn(),
      onApprove: vi.fn(),
      onReject: vi.fn(),
      proposta: mockProposta
    };

    it('should render modal when open', () => {
      render(<AprovacaoModal {...mockProps} />);
      expect(screen.getByText('Aprovação de Proposta')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AprovacaoModal {...mockProps} isOpen={false} />);
      expect(screen.queryByText('Aprovação de Proposta')).not.toBeInTheDocument();
    });

    it('should show proposta summary', () => {
      render(<AprovacaoModal {...mockProps} />);
      expect(screen.getByText('Resumo da Proposta')).toBeInTheDocument();
      expect(screen.getByText('Test proposta')).toBeInTheDocument();
      expect(screen.getByText('Test details')).toBeInTheDocument();
    });

    it('should show approval options', () => {
      render(<AprovacaoModal {...mockProps} />);
      expect(screen.getByText('✓ Aprovar Proposta')).toBeInTheDocument();
      expect(screen.getByText('✕ Rejeitar Proposta')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AprovacaoModal {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /✕/ });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should show variation text for proposals with vagas', () => {
      render(<AprovacaoModal {...mockProps} />);
      expect(screen.getByText('5 vagas')).toBeInTheDocument();
    });
  });
});