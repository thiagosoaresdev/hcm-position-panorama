import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Proposta, QuadroLotacao } from '../../types/index.js';
import './PropostaForm.css';

interface PropostaFormData {
  tipo: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia';
  descricao: string;
  detalhamento: string;
  quadroLotacaoId: string;
  cargoAtual?: string;
  cargoNovo?: string;
  vagasAtuais?: number;
  vagasSolicitadas?: number;
  centroCustoDestino?: string;
  impactoOrcamentario?: string;
  analiseImpacto?: string;
  anexos?: string[];
}

interface PropostaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PropostaFormData) => Promise<void>;
  initialData?: Proposta | null;
  mode: 'create' | 'edit';
  loading?: boolean;
  quadrosLotacao?: QuadroLotacao[];
}

export const PropostaForm: React.FC<PropostaFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
  quadrosLotacao = []
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<PropostaFormData>({
    mode: 'onChange',
    defaultValues: {
      tipo: 'inclusao',
      descricao: '',
      detalhamento: '',
      quadroLotacaoId: '',
      cargoAtual: '',
      cargoNovo: '',
      vagasAtuais: undefined,
      vagasSolicitadas: undefined,
      centroCustoDestino: '',
      impactoOrcamentario: '',
      analiseImpacto: '',
      anexos: []
    }
  });

  const watchedTipo = watch('tipo');
  const watchedQuadroLotacaoId = watch('quadroLotacaoId');

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        reset({
          tipo: initialData.tipo,
          descricao: initialData.descricao,
          detalhamento: initialData.detalhamento,
          quadroLotacaoId: initialData.quadroLotacaoId,
          cargoAtual: initialData.cargoAtual || '',
          cargoNovo: initialData.cargoNovo || '',
          vagasAtuais: initialData.vagasAtuais,
          vagasSolicitadas: initialData.vagasSolicitadas,
          centroCustoDestino: initialData.centroCustoDestino || '',
          impactoOrcamentario: initialData.impactoOrcamentario || '',
          analiseImpacto: initialData.analiseImpacto || '',
          anexos: initialData.anexos || []
        });
      } else {
        reset({
          tipo: 'inclusao',
          descricao: '',
          detalhamento: '',
          quadroLotacaoId: '',
          cargoAtual: '',
          cargoNovo: '',
          vagasAtuais: undefined,
          vagasSolicitadas: undefined,
          centroCustoDestino: '',
          impactoOrcamentario: '',
          analiseImpacto: '',
          anexos: []
        });
      }
      setCurrentStep(1);
      setAnexoFiles([]);
    }
  }, [isOpen, initialData, mode, reset]);

  // Auto-fill cargo atual when quadro is selected
  useEffect(() => {
    if (watchedQuadroLotacaoId) {
      const selectedQuadro = quadrosLotacao.find(q => q.id === watchedQuadroLotacaoId);
      if (selectedQuadro) {
        setValue('cargoAtual', selectedQuadro.cargoVaga || '');
        setValue('vagasAtuais', selectedQuadro.vagasPrevistas);
      }
    }
  }, [watchedQuadroLotacaoId, quadrosLotacao, setValue]);

  const handleFormSubmit = async (data: PropostaFormData) => {
    setIsSubmitting(true);
    try {
      // Add anexos from uploaded files
      const anexosUrls = anexoFiles.map(file => URL.createObjectURL(file));
      const finalData = {
        ...data,
        anexos: [...(data.anexos || []), ...anexosUrls]
      };
      
      await onSubmit(finalData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
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

  const handleNextStep = async () => {
    const isStepValid = await trigger();
    if (isStepValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAnexoFiles(prev => [...prev, ...files]);
  };

  const removeAnexo = (index: number) => {
    setAnexoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Informações Básicas';
      case 2: return 'Detalhes da Proposta';
      case 3: return 'Impacto e Anexos';
      default: return 'Proposta';
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !errors.tipo && !errors.descricao && !errors.quadroLotacaoId;
      case 2:
        return !errors.detalhamento && 
               (watchedTipo !== 'transferencia' || !errors.centroCustoDestino) &&
               (watchedTipo === 'inclusao' ? !errors.vagasSolicitadas : true) &&
               (watchedTipo === 'alteracao' ? (!errors.vagasAtuais && !errors.vagasSolicitadas) : true);
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="proposta-form__backdrop" onClick={handleBackdropClick}>
      <div className="proposta-form__modal">
        <div className="proposta-form__header">
          <div className="proposta-form__title-section">
            <h2 className="proposta-form__title">
              {mode === 'create' ? 'Nova Proposta' : 'Editar Proposta'}
            </h2>
            <p className="proposta-form__subtitle">{getStepTitle()}</p>
          </div>
          <button
            className="proposta-form__close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="proposta-form__progress">
          {[1, 2, 3].map(step => (
            <div
              key={step}
              className={`proposta-form__step ${
                step === currentStep ? 'proposta-form__step--active' : ''
              } ${
                step < currentStep ? 'proposta-form__step--completed' : ''
              }`}
            >
              <div className="proposta-form__step-number">
                {step < currentStep ? '✓' : step}
              </div>
              <div className="proposta-form__step-label">
                {step === 1 && 'Básico'}
                {step === 2 && 'Detalhes'}
                {step === 3 && 'Finalizar'}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="proposta-form__form">
          <div className="proposta-form__content">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="proposta-form__step-content">
                {/* Tipo */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="tipo">
                    Tipo de Proposta *
                  </label>
                  <select
                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                    id="tipo"
                    className={`proposta-form__select ${errors.tipo ? 'proposta-form__select--error' : ''}`}
                  >
                    <option value="inclusao">Inclusão de Vagas</option>
                    <option value="alteracao">Alteração de Vagas</option>
                    <option value="exclusao">Exclusão de Vagas</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                  {errors.tipo && (
                    <span className="proposta-form__error">{errors.tipo.message}</span>
                  )}
                </div>

                {/* Descrição */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="descricao">
                    Descrição da Proposta *
                  </label>
                  <input
                    {...register('descricao', { 
                      required: 'Descrição é obrigatória',
                      maxLength: { value: 500, message: 'Máximo 500 caracteres' }
                    })}
                    id="descricao"
                    className={`proposta-form__input ${errors.descricao ? 'proposta-form__input--error' : ''}`}
                    placeholder="Ex: Inclusão de 2 vagas para Desenvolvedor Pleno"
                  />
                  {errors.descricao && (
                    <span className="proposta-form__error">{errors.descricao.message}</span>
                  )}
                </div>

                {/* Quadro de Lotação */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="quadroLotacaoId">
                    Quadro de Lotação *
                  </label>
                  <select
                    {...register('quadroLotacaoId', { required: 'Quadro de lotação é obrigatório' })}
                    id="quadroLotacaoId"
                    className={`proposta-form__select ${errors.quadroLotacaoId ? 'proposta-form__select--error' : ''}`}
                  >
                    <option value="">Selecione um quadro</option>
                    {quadrosLotacao.map(quadro => (
                      <option key={quadro.id} value={quadro.id}>
                        {quadro.cargoVaga || 'Quadro'} - {quadro.vagasPrevistas} vagas
                      </option>
                    ))}
                  </select>
                  {errors.quadroLotacaoId && (
                    <span className="proposta-form__error">{errors.quadroLotacaoId.message}</span>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="proposta-form__step-content">
                {/* Detalhamento */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="detalhamento">
                    Detalhamento da Proposta *
                  </label>
                  <textarea
                    {...register('detalhamento', { 
                      required: 'Detalhamento é obrigatório',
                      minLength: { value: 20, message: 'Mínimo 20 caracteres' }
                    })}
                    id="detalhamento"
                    rows={4}
                    className={`proposta-form__textarea ${errors.detalhamento ? 'proposta-form__textarea--error' : ''}`}
                    placeholder="Descreva detalhadamente a proposta, justificativas e necessidades..."
                  />
                  {errors.detalhamento && (
                    <span className="proposta-form__error">{errors.detalhamento.message}</span>
                  )}
                </div>

                {/* Campos específicos por tipo */}
                {watchedTipo === 'inclusao' && (
                  <div className="proposta-form__field">
                    <label className="proposta-form__label" htmlFor="vagasSolicitadas">
                      Vagas Solicitadas *
                    </label>
                    <input
                      {...register('vagasSolicitadas', { 
                        required: 'Número de vagas é obrigatório',
                        min: { value: 1, message: 'Mínimo 1 vaga' },
                        max: { value: 50, message: 'Máximo 50 vagas' }
                      })}
                      id="vagasSolicitadas"
                      type="number"
                      min="1"
                      max="50"
                      className={`proposta-form__input ${errors.vagasSolicitadas ? 'proposta-form__input--error' : ''}`}
                    />
                    {errors.vagasSolicitadas && (
                      <span className="proposta-form__error">{errors.vagasSolicitadas.message}</span>
                    )}
                  </div>
                )}

                {watchedTipo === 'alteracao' && (
                  <>
                    <div className="proposta-form__field-group">
                      <div className="proposta-form__field">
                        <label className="proposta-form__label" htmlFor="vagasAtuais">
                          Vagas Atuais *
                        </label>
                        <input
                          {...register('vagasAtuais', { 
                            required: 'Vagas atuais é obrigatório',
                            min: { value: 0, message: 'Não pode ser negativo' }
                          })}
                          id="vagasAtuais"
                          type="number"
                          min="0"
                          className={`proposta-form__input ${errors.vagasAtuais ? 'proposta-form__input--error' : ''}`}
                          readOnly
                        />
                        {errors.vagasAtuais && (
                          <span className="proposta-form__error">{errors.vagasAtuais.message}</span>
                        )}
                      </div>

                      <div className="proposta-form__field">
                        <label className="proposta-form__label" htmlFor="vagasSolicitadas">
                          Vagas Solicitadas *
                        </label>
                        <input
                          {...register('vagasSolicitadas', { 
                            required: 'Vagas solicitadas é obrigatório',
                            min: { value: 0, message: 'Não pode ser negativo' }
                          })}
                          id="vagasSolicitadas"
                          type="number"
                          min="0"
                          className={`proposta-form__input ${errors.vagasSolicitadas ? 'proposta-form__input--error' : ''}`}
                        />
                        {errors.vagasSolicitadas && (
                          <span className="proposta-form__error">{errors.vagasSolicitadas.message}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {watchedTipo === 'transferencia' && (
                  <>
                    <div className="proposta-form__field">
                      <label className="proposta-form__label" htmlFor="centroCustoDestino">
                        Centro de Custo Destino *
                      </label>
                      <select
                        {...register('centroCustoDestino', { required: 'Centro de custo destino é obrigatório' })}
                        id="centroCustoDestino"
                        className={`proposta-form__select ${errors.centroCustoDestino ? 'proposta-form__select--error' : ''}`}
                      >
                        <option value="">Selecione o destino</option>
                        <option value="cc_ti">Tecnologia da Informação</option>
                        <option value="cc_rh">Recursos Humanos</option>
                        <option value="cc_adm">Administrativo</option>
                      </select>
                      {errors.centroCustoDestino && (
                        <span className="proposta-form__error">{errors.centroCustoDestino.message}</span>
                      )}
                    </div>

                    <div className="proposta-form__field-group">
                      <div className="proposta-form__field">
                        <label className="proposta-form__label" htmlFor="cargoAtual">
                          Cargo Atual
                        </label>
                        <input
                          {...register('cargoAtual')}
                          id="cargoAtual"
                          className="proposta-form__input"
                          readOnly
                        />
                      </div>

                      <div className="proposta-form__field">
                        <label className="proposta-form__label" htmlFor="cargoNovo">
                          Cargo Novo
                        </label>
                        <input
                          {...register('cargoNovo')}
                          id="cargoNovo"
                          className="proposta-form__input"
                          placeholder="Novo cargo (se aplicável)"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Impact and Attachments */}
            {currentStep === 3 && (
              <div className="proposta-form__step-content">
                {/* Impacto Orçamentário */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="impactoOrcamentario">
                    Impacto Orçamentário
                  </label>
                  <textarea
                    {...register('impactoOrcamentario')}
                    id="impactoOrcamentario"
                    rows={3}
                    className="proposta-form__textarea"
                    placeholder="Descreva o impacto financeiro da proposta..."
                  />
                </div>

                {/* Análise de Impacto */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="analiseImpacto">
                    Análise de Impacto
                  </label>
                  <textarea
                    {...register('analiseImpacto')}
                    id="analiseImpacto"
                    rows={3}
                    className="proposta-form__textarea"
                    placeholder="Análise dos impactos organizacionais, operacionais, etc..."
                  />
                </div>

                {/* Anexos */}
                <div className="proposta-form__field">
                  <label className="proposta-form__label" htmlFor="anexos">
                    Anexos
                  </label>
                  <div className="proposta-form__file-upload">
                    <input
                      type="file"
                      id="anexos"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                      onChange={handleFileUpload}
                      className="proposta-form__file-input"
                    />
                    <label htmlFor="anexos" className="proposta-form__file-label">
                      📎 Adicionar Arquivos
                    </label>
                  </div>
                  
                  {anexoFiles.length > 0 && (
                    <div className="proposta-form__file-list">
                      {anexoFiles.map((file, index) => (
                        <div key={index} className="proposta-form__file-item">
                          <span className="proposta-form__file-name">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAnexo(index)}
                            className="proposta-form__file-remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="proposta-form__footer">
            <div className="proposta-form__nav-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="proposta-form__btn proposta-form__btn--secondary"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  ← Anterior
                </button>
              )}
              
              <button
                type="button"
                className="proposta-form__btn proposta-form__btn--secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>

            <div className="proposta-form__action-buttons">
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="proposta-form__btn proposta-form__btn--primary"
                  onClick={handleNextStep}
                  disabled={!isStepValid(currentStep) || isSubmitting}
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="submit"
                  className="proposta-form__btn proposta-form__btn--primary"
                  disabled={!isValid || isSubmitting || loading}
                >
                  {isSubmitting ? (
                    <>
                      <span className="proposta-form__spinner"></span>
                      {mode === 'create' ? 'Criando...' : 'Salvando...'}
                    </>
                  ) : (
                    mode === 'create' ? 'Criar Proposta' : 'Salvar Alterações'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};