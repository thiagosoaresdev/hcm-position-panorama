import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Proposta } from '../../types/index.js';
import { StatusBadge } from './StatusBadge';
import './AprovacaoModal.css';

interface AprovacaoFormData {
  acao: 'aprovar' | 'rejeitar';
  comentario: string;
  motivo?: string;
}

interface AprovacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comentario?: string) => Promise<void>;
  onReject: (comentario: string, motivo: string) => Promise<void>;
  proposta: Proposta | null;
  loading?: boolean;
  currentUserLevel?: string;
}

export const AprovacaoModal: React.FC<AprovacaoModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  proposta,
  loading = false,
  currentUserLevel = 'Aprovador'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<AprovacaoFormData>({
    mode: 'onChange',
    defaultValues: {
      acao: 'aprovar',
      comentario: '',
      motivo: ''
    }
  });

  const watchedAcao = watch('acao');

  React.useEffect(() => {
    if (isOpen) {
      reset({
        acao: 'aprovar',
        comentario: '',
        motivo: ''
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: AprovacaoFormData) => {
    if (!proposta) return;

    setIsSubmitting(true);
    try {
      if (data.acao === 'aprovar') {
        await onApprove(data.comentario || undefined);
      } else {
        await onReject(data.comentario, data.motivo || 'Rejeição de proposta');
      }
      onClose();
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
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

  const getVariacaoText = () => {
    if (!proposta) return '';
    
    if (proposta.vagasAtuais !== undefined && proposta.vagasSolicitadas !== undefined) {
      const variacao = proposta.vagasSolicitadas - proposta.vagasAtuais;
      if (variacao > 0) {
        return `+${variacao} vagas`;
      } else if (variacao < 0) {
        return `${variacao} vagas`;
      } else {
        return 'Sem alteração';
      }
    }
    
    if (proposta.vagasSolicitadas !== undefined) {
      return `${proposta.vagasSolicitadas} vagas`;
    }
    
    return '';
  };

  if (!isOpen || !proposta) return null;

  return (
    <div className="aprovacao-modal__backdrop" onClick={handleBackdropClick}>
      <div className="aprovacao-modal__modal">
        <div className="aprovacao-modal__header">
          <div className="aprovacao-modal__title-section">
            <h2 className="aprovacao-modal__title">
              Aprovação de Proposta
            </h2>
            <p className="aprovacao-modal__subtitle">
              {currentUserLevel} - {proposta.tipo.charAt(0).toUpperCase() + proposta.tipo.slice(1)}
            </p>
          </div>
          <button
            className="aprovacao-modal__close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="aprovacao-modal__content">
          {/* Proposta Summary */}
          <div className="aprovacao-modal__proposta-summary">
            <div className="aprovacao-modal__summary-header">
              <h3 className="aprovacao-modal__summary-title">Resumo da Proposta</h3>
              <StatusBadge status={proposta.status} />
            </div>

            <div className="aprovacao-modal__summary-content">
              <div className="aprovacao-modal__summary-item">
                <span className="aprovacao-modal__summary-label">Descrição:</span>
                <p className="aprovacao-modal__summary-value">{proposta.descricao}</p>
              </div>

              <div className="aprovacao-modal__summary-item">
                <span className="aprovacao-modal__summary-label">Detalhamento:</span>
                <p className="aprovacao-modal__summary-value">{proposta.detalhamento}</p>
              </div>

              <div className="aprovacao-modal__summary-grid">
                <div className="aprovacao-modal__summary-item">
                  <span className="aprovacao-modal__summary-label">Tipo:</span>
                  <span className="aprovacao-modal__summary-value">
                    {proposta.tipo.charAt(0).toUpperCase() + proposta.tipo.slice(1)}
                  </span>
                </div>

                <div className="aprovacao-modal__summary-item">
                  <span className="aprovacao-modal__summary-label">Criada em:</span>
                  <span className="aprovacao-modal__summary-value">
                    {formatDate(proposta.createdAt)}
                  </span>
                </div>

                {getVariacaoText() && (
                  <div className="aprovacao-modal__summary-item">
                    <span className="aprovacao-modal__summary-label">Variação:</span>
                    <span className={`aprovacao-modal__summary-value ${
                      proposta.vagasSolicitadas && proposta.vagasAtuais && 
                      proposta.vagasSolicitadas > proposta.vagasAtuais 
                        ? 'aprovacao-modal__summary-value--positive'
                        : proposta.vagasSolicitadas && proposta.vagasAtuais && 
                          proposta.vagasSolicitadas < proposta.vagasAtuais
                        ? 'aprovacao-modal__summary-value--negative'
                        : ''
                    }`}>
                      {getVariacaoText()}
                    </span>
                  </div>
                )}

                {proposta.centroCustoDestino && (
                  <div className="aprovacao-modal__summary-item">
                    <span className="aprovacao-modal__summary-label">Destino:</span>
                    <span className="aprovacao-modal__summary-value">
                      {proposta.centroCustoDestino}
                    </span>
                  </div>
                )}
              </div>

              {proposta.impactoOrcamentario && (
                <div className="aprovacao-modal__summary-item">
                  <span className="aprovacao-modal__summary-label">Impacto Orçamentário:</span>
                  <p className="aprovacao-modal__summary-value">{proposta.impactoOrcamentario}</p>
                </div>
              )}

              {proposta.analiseImpacto && (
                <div className="aprovacao-modal__summary-item">
                  <span className="aprovacao-modal__summary-label">Análise de Impacto:</span>
                  <p className="aprovacao-modal__summary-value">{proposta.analiseImpacto}</p>
                </div>
              )}

              {proposta.anexos && proposta.anexos.length > 0 && (
                <div className="aprovacao-modal__summary-item">
                  <span className="aprovacao-modal__summary-label">Anexos:</span>
                  <div className="aprovacao-modal__anexos">
                    {proposta.anexos.map((anexo, index) => (
                      <a
                        key={index}
                        href={anexo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aprovacao-modal__anexo-link"
                      >
                        📎 Anexo {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Approval Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="aprovacao-modal__form">
            <div className="aprovacao-modal__form-content">
              {/* Ação */}
              <div className="aprovacao-modal__field">
                <label className="aprovacao-modal__label">
                  Decisão *
                </label>
                <div className="aprovacao-modal__radio-group">
                  <label className="aprovacao-modal__radio-option">
                    <input
                      {...register('acao', { required: 'Decisão é obrigatória' })}
                      type="radio"
                      value="aprovar"
                      className="aprovacao-modal__radio"
                    />
                    <span className="aprovacao-modal__radio-label aprovacao-modal__radio-label--approve">
                      ✓ Aprovar Proposta
                    </span>
                  </label>
                  <label className="aprovacao-modal__radio-option">
                    <input
                      {...register('acao', { required: 'Decisão é obrigatória' })}
                      type="radio"
                      value="rejeitar"
                      className="aprovacao-modal__radio"
                    />
                    <span className="aprovacao-modal__radio-label aprovacao-modal__radio-label--reject">
                      ✕ Rejeitar Proposta
                    </span>
                  </label>
                </div>
                {errors.acao && (
                  <span className="aprovacao-modal__error">{errors.acao.message}</span>
                )}
              </div>

              {/* Comentário */}
              <div className="aprovacao-modal__field">
                <label className="aprovacao-modal__label" htmlFor="comentario">
                  Comentário {watchedAcao === 'rejeitar' ? '*' : '(opcional)'}
                </label>
                <textarea
                  {...register('comentario', { 
                    required: watchedAcao === 'rejeitar' ? 'Comentário é obrigatório para rejeição' : false,
                    minLength: watchedAcao === 'rejeitar' ? { 
                      value: 10, 
                      message: 'Comentário deve ter pelo menos 10 caracteres' 
                    } : undefined
                  })}
                  id="comentario"
                  rows={4}
                  className={`aprovacao-modal__textarea ${errors.comentario ? 'aprovacao-modal__textarea--error' : ''}`}
                  placeholder={
                    watchedAcao === 'aprovar' 
                      ? 'Comentário opcional sobre a aprovação...'
                      : 'Explique os motivos da rejeição...'
                  }
                />
                {errors.comentario && (
                  <span className="aprovacao-modal__error">{errors.comentario.message}</span>
                )}
              </div>

              {/* Motivo (apenas para rejeição) */}
              {watchedAcao === 'rejeitar' && (
                <div className="aprovacao-modal__field">
                  <label className="aprovacao-modal__label" htmlFor="motivo">
                    Motivo da Rejeição
                  </label>
                  <select
                    {...register('motivo')}
                    id="motivo"
                    className="aprovacao-modal__select"
                  >
                    <option value="">Selecione um motivo</option>
                    <option value="documentacao_insuficiente">Documentação Insuficiente</option>
                    <option value="impacto_orcamentario">Impacto Orçamentário Elevado</option>
                    <option value="nao_alinhado_estrategia">Não Alinhado à Estratégia</option>
                    <option value="informacoes_incompletas">Informações Incompletas</option>
                    <option value="timing_inadequado">Timing Inadequado</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              )}
            </div>

            <div className="aprovacao-modal__footer">
              <button
                type="button"
                className="aprovacao-modal__btn aprovacao-modal__btn--secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`aprovacao-modal__btn ${
                  watchedAcao === 'aprovar' 
                    ? 'aprovacao-modal__btn--success' 
                    : 'aprovacao-modal__btn--danger'
                }`}
                disabled={!isValid || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <span className="aprovacao-modal__spinner"></span>
                    Processando...
                  </>
                ) : (
                  watchedAcao === 'aprovar' ? 'Aprovar Proposta' : 'Rejeitar Proposta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};