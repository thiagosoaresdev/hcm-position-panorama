import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { QuadroLotacao } from '../../types/index.js';
import './VagaForm.css';

interface VagaFormData {
  id: string;
  planoVagasId: string;
  postoTrabalhoId: string;
  cargoId: string;
  cargoVaga?: string;
  vagasPrevistas: number;
  dataInicioControle: string;
  tipoControle: 'diario' | 'competencia';
  observacoes?: string;
  motivo: string;
}

interface VagaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VagaFormData) => Promise<void>;
  initialData?: QuadroLotacao | null;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export const VagaForm: React.FC<VagaFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeficitWarning, setShowDeficitWarning] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<VagaFormData>({
    mode: 'onChange',
    defaultValues: {
      id: '',
      planoVagasId: '',
      postoTrabalhoId: '',
      cargoId: '',
      cargoVaga: '',
      vagasPrevistas: 1,
      dataInicioControle: new Date().toISOString().split('T')[0],
      tipoControle: 'diario',
      observacoes: '',
      motivo: ''
    }
  });

  const watchedVagasPrevistas = watch('vagasPrevistas');

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        reset({
          id: initialData.id,
          planoVagasId: initialData.planoVagasId,
          postoTrabalhoId: initialData.postoTrabalhoId,
          cargoId: initialData.cargoId,
          cargoVaga: initialData.cargoVaga || '',
          vagasPrevistas: initialData.vagasPrevistas,
          dataInicioControle: new Date(initialData.dataInicioControle).toISOString().split('T')[0],
          tipoControle: initialData.tipoControle,
          observacoes: initialData.observacoes || '',
          motivo: mode === 'edit' ? 'Edição de vaga' : 'Criação de nova vaga'
        });
      } else {
        reset({
          id: `vaga_${Date.now()}`,
          planoVagasId: '',
          postoTrabalhoId: '',
          cargoId: '',
          cargoVaga: '',
          vagasPrevistas: 1,
          dataInicioControle: new Date().toISOString().split('T')[0],
          tipoControle: 'diario',
          observacoes: '',
          motivo: 'Criação de nova vaga'
        });
      }
    }
  }, [isOpen, initialData, mode, reset]);

  // Check for deficit warning when editing
  useEffect(() => {
    if (mode === 'edit' && initialData && watchedVagasPrevistas < initialData.vagasEfetivas) {
      setShowDeficitWarning(true);
    } else {
      setShowDeficitWarning(false);
    }
  }, [mode, initialData, watchedVagasPrevistas]);

  const handleFormSubmit = async (data: VagaFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
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

  if (!isOpen) return null;

  return (
    <div className="vaga-form__backdrop" onClick={handleBackdropClick}>
      <div className="vaga-form__modal">
        <div className="vaga-form__header">
          <h2 className="vaga-form__title">
            {mode === 'create' ? 'Nova Vaga' : 'Editar Vaga'}
          </h2>
          <button
            className="vaga-form__close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="vaga-form__form">
          <div className="vaga-form__content">
            {/* ID Field (readonly for edit mode) */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="id">
                ID da Vaga *
              </label>
              <input
                {...register('id', { 
                  required: 'ID é obrigatório',
                  minLength: { value: 3, message: 'ID deve ter pelo menos 3 caracteres' }
                })}
                id="id"
                className={`vaga-form__input ${errors.id ? 'vaga-form__input--error' : ''}`}
                placeholder="Ex: vaga_001"
                readOnly={mode === 'edit'}
              />
              {errors.id && (
                <span className="vaga-form__error">{errors.id.message}</span>
              )}
            </div>

            {/* Plano de Vagas */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="planoVagasId">
                Plano de Vagas *
              </label>
              <select
                {...register('planoVagasId', { required: 'Plano de vagas é obrigatório' })}
                id="planoVagasId"
                className={`vaga-form__select ${errors.planoVagasId ? 'vaga-form__select--error' : ''}`}
              >
                <option value="">Selecione um plano</option>
                <option value="plano_2025">Plano 2025</option>
                <option value="plano_2024">Plano 2024</option>
              </select>
              {errors.planoVagasId && (
                <span className="vaga-form__error">{errors.planoVagasId.message}</span>
              )}
            </div>

            {/* Posto de Trabalho */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="postoTrabalhoId">
                Posto de Trabalho *
              </label>
              <select
                {...register('postoTrabalhoId', { required: 'Posto de trabalho é obrigatório' })}
                id="postoTrabalhoId"
                className={`vaga-form__select ${errors.postoTrabalhoId ? 'vaga-form__select--error' : ''}`}
              >
                <option value="">Selecione um posto</option>
                <option value="pt_dev_fs">Desenvolvedor Full Stack</option>
                <option value="pt_service_desk">Service Desk</option>
                <option value="pt_analista_rh">Analista RH</option>
              </select>
              {errors.postoTrabalhoId && (
                <span className="vaga-form__error">{errors.postoTrabalhoId.message}</span>
              )}
            </div>

            {/* Cargo */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="cargoId">
                Cargo *
              </label>
              <select
                {...register('cargoId', { required: 'Cargo é obrigatório' })}
                id="cargoId"
                className={`vaga-form__select ${errors.cargoId ? 'vaga-form__select--error' : ''}`}
              >
                <option value="">Selecione um cargo</option>
                <option value="cargo_dev_pleno">Desenvolvedor Pleno</option>
                <option value="cargo_dev_junior">Desenvolvedor Junior</option>
                <option value="cargo_gerente">Gerente</option>
              </select>
              {errors.cargoId && (
                <span className="vaga-form__error">{errors.cargoId.message}</span>
              )}
            </div>

            {/* Cargo da Vaga (opcional) */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="cargoVaga">
                Cargo da Vaga (opcional)
              </label>
              <input
                {...register('cargoVaga')}
                id="cargoVaga"
                className="vaga-form__input"
                placeholder="Ex: Desenvolvedor Full Stack Pleno"
              />
              <span className="vaga-form__help">
                Descrição específica do cargo para esta vaga (se diferente do cargo padrão)
              </span>
            </div>

            {/* Vagas Previstas */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="vagasPrevistas">
                Vagas Previstas *
              </label>
              <input
                {...register('vagasPrevistas', { 
                  required: 'Número de vagas é obrigatório',
                  min: { value: 1, message: 'Deve ter pelo menos 1 vaga' },
                  max: { value: 100, message: 'Máximo de 100 vagas' }
                })}
                id="vagasPrevistas"
                type="number"
                min="1"
                max="100"
                className={`vaga-form__input ${errors.vagasPrevistas ? 'vaga-form__input--error' : ''}`}
              />
              {errors.vagasPrevistas && (
                <span className="vaga-form__error">{errors.vagasPrevistas.message}</span>
              )}
              {showDeficitWarning && (
                <div className="vaga-form__warning">
                  ⚠️ Atenção: Reduzir vagas para {watchedVagasPrevistas} criará déficit. 
                  Atualmente há {initialData?.vagasEfetivas} colaboradores efetivos.
                </div>
              )}
            </div>

            {/* Data Início Controle */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="dataInicioControle">
                Data Início Controle *
              </label>
              <input
                {...register('dataInicioControle', { required: 'Data de início é obrigatória' })}
                id="dataInicioControle"
                type="date"
                className={`vaga-form__input ${errors.dataInicioControle ? 'vaga-form__input--error' : ''}`}
              />
              {errors.dataInicioControle && (
                <span className="vaga-form__error">{errors.dataInicioControle.message}</span>
              )}
            </div>

            {/* Tipo de Controle */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="tipoControle">
                Tipo de Controle *
              </label>
              <select
                {...register('tipoControle', { required: 'Tipo de controle é obrigatório' })}
                id="tipoControle"
                className={`vaga-form__select ${errors.tipoControle ? 'vaga-form__select--error' : ''}`}
              >
                <option value="diario">Diário</option>
                <option value="competencia">Competência</option>
              </select>
              {errors.tipoControle && (
                <span className="vaga-form__error">{errors.tipoControle.message}</span>
              )}
            </div>

            {/* Observações */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="observacoes">
                Observações
              </label>
              <textarea
                {...register('observacoes')}
                id="observacoes"
                rows={3}
                className="vaga-form__textarea"
                placeholder="Observações adicionais sobre a vaga..."
              />
            </div>

            {/* Motivo */}
            <div className="vaga-form__field">
              <label className="vaga-form__label" htmlFor="motivo">
                Motivo da {mode === 'create' ? 'Criação' : 'Alteração'} *
              </label>
              <textarea
                {...register('motivo', { 
                  required: 'Motivo é obrigatório para auditoria',
                  minLength: { value: 10, message: 'Motivo deve ter pelo menos 10 caracteres' }
                })}
                id="motivo"
                rows={2}
                className={`vaga-form__textarea ${errors.motivo ? 'vaga-form__textarea--error' : ''}`}
                placeholder={`Descreva o motivo da ${mode === 'create' ? 'criação' : 'alteração'} desta vaga...`}
              />
              {errors.motivo && (
                <span className="vaga-form__error">{errors.motivo.message}</span>
              )}
            </div>
          </div>

          <div className="vaga-form__footer">
            <button
              type="button"
              className="vaga-form__btn vaga-form__btn--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="vaga-form__btn vaga-form__btn--primary"
              disabled={!isValid || isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <span className="vaga-form__spinner"></span>
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                mode === 'create' ? 'Criar Vaga' : 'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};