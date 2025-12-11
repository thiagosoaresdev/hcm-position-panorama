import React from 'react';
import type { Proposta, Aprovacao, PropostaStatus } from '../../types/index.js';
import { StatusBadge } from './StatusBadge';
import './WorkflowViewer.css';

interface WorkflowStep {
  nivel: number;
  nome: string;
  aprovador?: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  dataAcao?: Date;
  comentario?: string;
}

interface WorkflowViewerProps {
  proposta: Proposta;
  aprovacoes?: Aprovacao[];
  className?: string;
}

export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({
  proposta,
  aprovacoes = [],
  className = ''
}) => {
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      { nivel: 1, nome: 'Coordenação', status: 'waiting' },
      { nivel: 2, nome: 'Gerência', status: 'waiting' },
      { nivel: 3, nome: 'Diretoria', status: 'waiting' },
      { nivel: 4, nome: 'RH', status: 'waiting' }
    ];

    // Map aprovacoes to steps
    aprovacoes.forEach(aprovacao => {
      const step = steps.find(s => s.nivel === aprovacao.nivel);
      if (step) {
        step.aprovador = aprovacao.aprovadorId;
        step.dataAcao = aprovacao.dataAcao;
        step.comentario = aprovacao.comentario;
        
        if (aprovacao.acao === 'aprovado') {
          step.status = 'approved';
        } else if (aprovacao.acao === 'rejeitado') {
          step.status = 'rejected';
        } else {
          step.status = 'pending';
        }
      }
    });

    // Update status based on proposta status
    const currentLevel = getCurrentLevel(proposta.status);
    
    steps.forEach((step, index) => {
      if (index < currentLevel - 1) {
        if (step.status === 'waiting') {
          step.status = 'approved';
        }
      } else if (index === currentLevel - 1) {
        if (step.status === 'waiting') {
          step.status = 'pending';
        }
      }
    });

    return steps;
  };

  const getCurrentLevel = (status: PropostaStatus): number => {
    const levelMap: Record<PropostaStatus, number> = {
      'rascunho': 0,
      'nivel_1': 1,
      'nivel_2': 2,
      'nivel_3': 3,
      'rh': 4,
      'aprovada': 5,
      'rejeitada': 0
    };
    return levelMap[status];
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✕';
      case 'pending':
        return '⏳';
      case 'waiting':
        return '○';
      default:
        return '○';
    }
  };

  const getStepStatusClass = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'approved':
        return 'workflow-viewer__step--approved';
      case 'rejected':
        return 'workflow-viewer__step--rejected';
      case 'pending':
        return 'workflow-viewer__step--pending';
      case 'waiting':
        return 'workflow-viewer__step--waiting';
      default:
        return 'workflow-viewer__step--waiting';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const steps = getWorkflowSteps();
  const isCompleted = proposta.status === 'aprovada';
  const isRejected = proposta.status === 'rejeitada';

  return (
    <div className={`workflow-viewer ${className}`}>
      <div className="workflow-viewer__header">
        <h3 className="workflow-viewer__title">Fluxo de Aprovação</h3>
        <StatusBadge status={proposta.status} />
      </div>

      <div className="workflow-viewer__content">
        {/* Proposta Info */}
        <div className="workflow-viewer__proposta-info">
          <div className="workflow-viewer__info-item">
            <span className="workflow-viewer__info-label">Tipo:</span>
            <span className="workflow-viewer__info-value">
              {proposta.tipo.charAt(0).toUpperCase() + proposta.tipo.slice(1)}
            </span>
          </div>
          <div className="workflow-viewer__info-item">
            <span className="workflow-viewer__info-label">Criada em:</span>
            <span className="workflow-viewer__info-value">
              {formatDate(proposta.createdAt)}
            </span>
          </div>
          <div className="workflow-viewer__info-item">
            <span className="workflow-viewer__info-label">Última atualização:</span>
            <span className="workflow-viewer__info-value">
              {formatDate(proposta.updatedAt)}
            </span>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="workflow-viewer__steps">
          {steps.map((step, index) => (
            <div
              key={step.nivel}
              className={`workflow-viewer__step ${getStepStatusClass(step.status)}`}
            >
              {/* Connection Line */}
              {index > 0 && (
                <div className="workflow-viewer__connection">
                  <div 
                    className={`workflow-viewer__line ${
                      steps[index - 1].status === 'approved' ? 'workflow-viewer__line--active' : ''
                    }`}
                  />
                </div>
              )}

              {/* Step Content */}
              <div className="workflow-viewer__step-content">
                <div className="workflow-viewer__step-header">
                  <div className="workflow-viewer__step-icon">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="workflow-viewer__step-info">
                    <h4 className="workflow-viewer__step-title">
                      {step.nome}
                    </h4>
                    {step.aprovador && (
                      <p className="workflow-viewer__step-approver">
                        {step.aprovador}
                      </p>
                    )}
                  </div>
                  <div className="workflow-viewer__step-status">
                    {step.status === 'approved' && (
                      <span className="workflow-viewer__status-text workflow-viewer__status-text--approved">
                        Aprovado
                      </span>
                    )}
                    {step.status === 'rejected' && (
                      <span className="workflow-viewer__status-text workflow-viewer__status-text--rejected">
                        Rejeitado
                      </span>
                    )}
                    {step.status === 'pending' && (
                      <span className="workflow-viewer__status-text workflow-viewer__status-text--pending">
                        Pendente
                      </span>
                    )}
                    {step.status === 'waiting' && (
                      <span className="workflow-viewer__status-text workflow-viewer__status-text--waiting">
                        Aguardando
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Details */}
                {(step.dataAcao || step.comentario) && (
                  <div className="workflow-viewer__step-details">
                    {step.dataAcao && (
                      <div className="workflow-viewer__step-date">
                        <span className="workflow-viewer__detail-label">Data:</span>
                        <span className="workflow-viewer__detail-value">
                          {formatDate(step.dataAcao)}
                        </span>
                      </div>
                    )}
                    {step.comentario && (
                      <div className="workflow-viewer__step-comment">
                        <span className="workflow-viewer__detail-label">Comentário:</span>
                        <p className="workflow-viewer__detail-value">
                          {step.comentario}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Final Status */}
        <div className="workflow-viewer__final-status">
          {isCompleted && (
            <div className="workflow-viewer__completion">
              <div className="workflow-viewer__completion-icon">🎉</div>
              <div className="workflow-viewer__completion-text">
                <h4>Proposta Aprovada</h4>
                <p>Todas as aprovações foram concluídas com sucesso.</p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="workflow-viewer__rejection">
              <div className="workflow-viewer__rejection-icon">❌</div>
              <div className="workflow-viewer__rejection-text">
                <h4>Proposta Rejeitada</h4>
                <p>A proposta foi rejeitada e retornou para rascunho.</p>
              </div>
            </div>
          )}

          {!isCompleted && !isRejected && proposta.status !== 'rascunho' && (
            <div className="workflow-viewer__progress">
              <div className="workflow-viewer__progress-icon">⏳</div>
              <div className="workflow-viewer__progress-text">
                <h4>Em Andamento</h4>
                <p>Aguardando aprovação do próximo nível.</p>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Summary */}
        <div className="workflow-viewer__timeline">
          <h4 className="workflow-viewer__timeline-title">Histórico</h4>
          <div className="workflow-viewer__timeline-items">
            <div className="workflow-viewer__timeline-item">
              <div className="workflow-viewer__timeline-dot"></div>
              <div className="workflow-viewer__timeline-content">
                <span className="workflow-viewer__timeline-action">Proposta criada</span>
                <span className="workflow-viewer__timeline-date">
                  {formatDate(proposta.createdAt)}
                </span>
              </div>
            </div>

            {aprovacoes
              .filter(a => a.acao !== 'aguardando')
              .sort((a, b) => (a.dataAcao?.getTime() || 0) - (b.dataAcao?.getTime() || 0))
              .map(aprovacao => (
                <div key={aprovacao.id} className="workflow-viewer__timeline-item">
                  <div className={`workflow-viewer__timeline-dot ${
                    aprovacao.acao === 'aprovado' 
                      ? 'workflow-viewer__timeline-dot--approved' 
                      : 'workflow-viewer__timeline-dot--rejected'
                  }`}></div>
                  <div className="workflow-viewer__timeline-content">
                    <span className="workflow-viewer__timeline-action">
                      {aprovacao.acao === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por {aprovacao.aprovadorId}
                    </span>
                    <span className="workflow-viewer__timeline-date">
                      {aprovacao.dataAcao && formatDate(aprovacao.dataAcao)}
                    </span>
                    {aprovacao.comentario && (
                      <p className="workflow-viewer__timeline-comment">
                        "{aprovacao.comentario}"
                      </p>
                    )}
                  </div>
                </div>
              ))}

            {isCompleted && (
              <div className="workflow-viewer__timeline-item">
                <div className="workflow-viewer__timeline-dot workflow-viewer__timeline-dot--completed"></div>
                <div className="workflow-viewer__timeline-content">
                  <span className="workflow-viewer__timeline-action">Proposta finalizada</span>
                  <span className="workflow-viewer__timeline-date">
                    {formatDate(proposta.updatedAt)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};