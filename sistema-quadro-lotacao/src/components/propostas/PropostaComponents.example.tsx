import React, { useState } from 'react';
import { PropostaForm, WorkflowViewer, AprovacaoModal, StatusBadge } from './index';
import type { Proposta, Aprovacao, QuadroLotacao } from '../../types/index';

/**
 * Example usage of Proposta UI Components
 * This file demonstrates how to use all the proposal-related components
 */

// Mock data for examples
const mockQuadrosLotacao: QuadroLotacao[] = [
  {
    id: 'quadro-1',
    planoVagasId: 'plano-2025',
    postoTrabalhoId: 'pt-dev-fs',
    cargoId: 'cargo-dev-pleno',
    cargoVaga: 'Desenvolvedor Full Stack Pleno',
    vagasPrevistas: 8,
    vagasEfetivas: 7,
    vagasReservadas: 1,
    dataInicioControle: new Date('2024-01-01'),
    tipoControle: 'diario',
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'quadro-2',
    planoVagasId: 'plano-2025',
    postoTrabalhoId: 'pt-service-desk',
    cargoId: 'cargo-dev-junior',
    cargoVaga: 'Analista Service Desk',
    vagasPrevistas: 5,
    vagasEfetivas: 4,
    vagasReservadas: 0,
    dataInicioControle: new Date('2024-01-01'),
    tipoControle: 'diario',
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const mockProposta: Proposta = {
  id: 'prop-001',
  tipo: 'inclusao',
  descricao: 'Inclusão de 2 vagas para Desenvolvedor Pleno',
  detalhamento: 'Necessidade de ampliar a equipe de desenvolvimento devido ao aumento de demanda de projetos para o próximo trimestre.',
  solicitanteId: 'user-123',
  quadroLotacaoId: 'quadro-1',
  vagasSolicitadas: 2,
  impactoOrcamentario: 'Impacto estimado de R$ 24.000/mês considerando salário base + benefícios',
  analiseImpacto: 'Impacto positivo na produtividade da equipe e capacidade de entrega de projetos',
  status: 'nivel_2',
  anexos: ['documento-justificativa.pdf', 'planilha-orcamento.xlsx'],
  createdAt: new Date('2024-01-15T10:30:00'),
  updatedAt: new Date('2024-01-16T14:20:00')
};

const mockAprovacoes: Aprovacao[] = [
  {
    id: 'apr-001',
    propostaId: 'prop-001',
    nivel: 1,
    aprovadorId: 'coord-001',
    acao: 'aprovado',
    comentario: 'Aprovado. Justificativa bem fundamentada.',
    dataAcao: new Date('2024-01-16T09:15:00'),
    createdAt: new Date('2024-01-15T10:35:00')
  },
  {
    id: 'apr-002',
    propostaId: 'prop-001',
    nivel: 2,
    aprovadorId: 'gerente-001',
    acao: 'aguardando',
    createdAt: new Date('2024-01-16T09:20:00')
  },
  {
    id: 'apr-003',
    propostaId: 'prop-001',
    nivel: 3,
    aprovadorId: 'diretor-001',
    acao: 'aguardando',
    createdAt: new Date('2024-01-16T09:20:00')
  },
  {
    id: 'apr-004',
    propostaId: 'prop-001',
    nivel: 4,
    aprovadorId: 'rh-001',
    acao: 'aguardando',
    createdAt: new Date('2024-01-16T09:20:00')
  }
];

export const PropostaComponentsExample: React.FC = () => {
  const [showPropostaForm, setShowPropostaForm] = useState(false);
  const [showAprovacaoModal, setShowAprovacaoModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreateProposta = async (data: any) => {
    console.log('Creating proposta:', data);
    // Here you would call your API to create the proposta
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Proposta criada com sucesso!');
  };

  const handleUpdateProposta = async (data: any) => {
    console.log('Updating proposta:', data);
    // Here you would call your API to update the proposta
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Proposta atualizada com sucesso!');
  };

  const handleApproveProposta = async (comentario?: string) => {
    console.log('Approving proposta with comment:', comentario);
    // Here you would call your API to approve the proposta
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Proposta aprovada com sucesso!');
  };

  const handleRejectProposta = async (comentario: string, motivo: string) => {
    console.log('Rejecting proposta:', { comentario, motivo });
    // Here you would call your API to reject the proposta
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Proposta rejeitada!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Proposta Components Example</h1>
      
      {/* Status Badge Examples */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Status Badge Examples</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <StatusBadge status="rascunho" />
          <StatusBadge status="nivel_1" />
          <StatusBadge status="nivel_2" />
          <StatusBadge status="nivel_3" />
          <StatusBadge status="rh" />
          <StatusBadge status="aprovada" />
          <StatusBadge status="rejeitada" />
        </div>
        
        <h3>Different Sizes</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
          <StatusBadge status="aprovada" size="sm" />
          <StatusBadge status="aprovada" size="md" />
          <StatusBadge status="aprovada" size="lg" />
        </div>
        
        <h3>Without Icons</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <StatusBadge status="aprovada" showIcon={false} />
          <StatusBadge status="rejeitada" showIcon={false} />
          <StatusBadge status="nivel_1" showIcon={false} />
        </div>
      </section>

      {/* Action Buttons */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Component Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setFormMode('create');
              setShowPropostaForm(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1E90FF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Nova Proposta
          </button>
          
          <button
            onClick={() => {
              setFormMode('edit');
              setShowPropostaForm(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28A745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Editar Proposta
          </button>
          
          <button
            onClick={() => setShowAprovacaoModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FFC107',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Aprovar/Rejeitar
          </button>
        </div>
      </section>

      {/* Workflow Viewer */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Workflow Viewer</h2>
        <WorkflowViewer 
          proposta={mockProposta} 
          aprovacoes={mockAprovacoes}
        />
      </section>

      {/* Modals */}
      <PropostaForm
        isOpen={showPropostaForm}
        onClose={() => setShowPropostaForm(false)}
        onSubmit={formMode === 'create' ? handleCreateProposta : handleUpdateProposta}
        initialData={formMode === 'edit' ? mockProposta : null}
        mode={formMode}
        quadrosLotacao={mockQuadrosLotacao}
      />

      <AprovacaoModal
        isOpen={showAprovacaoModal}
        onClose={() => setShowAprovacaoModal(false)}
        onApprove={handleApproveProposta}
        onReject={handleRejectProposta}
        proposta={showAprovacaoModal ? mockProposta : null}
        currentUserLevel="Gerência"
      />

      {/* Usage Instructions */}
      <section style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Usage Instructions</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <h3>PropostaForm</h3>
          <p>A wizard-style form for creating and editing proposals with 3 steps:</p>
          <ul>
            <li><strong>Step 1:</strong> Basic information (type, description, quadro)</li>
            <li><strong>Step 2:</strong> Details (specific fields based on proposal type)</li>
            <li><strong>Step 3:</strong> Impact analysis and attachments</li>
          </ul>

          <h3>WorkflowViewer</h3>
          <p>Displays the approval workflow with:</p>
          <ul>
            <li>Current status and progress</li>
            <li>Approval steps with status indicators</li>
            <li>Timeline of actions taken</li>
            <li>Comments from approvers</li>
          </ul>

          <h3>AprovacaoModal</h3>
          <p>Modal for approving or rejecting proposals with:</p>
          <ul>
            <li>Proposal summary</li>
            <li>Approval/rejection options</li>
            <li>Comment field (required for rejection)</li>
            <li>Rejection reason selection</li>
          </ul>

          <h3>StatusBadge</h3>
          <p>Visual indicator for proposal status with:</p>
          <ul>
            <li>Color-coded status variants</li>
            <li>Progress bar for pending statuses</li>
            <li>Multiple size options</li>
            <li>Optional icons</li>
          </ul>
        </div>
      </section>
    </div>
  );
};