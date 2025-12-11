import React, { useState } from 'react';
import './ErrorReporter.css';

interface ErrorReporterProps {
  errors: string[];
  onClear: () => void;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
}

export const ErrorReporter: React.FC<ErrorReporterProps> = ({
  errors,
  onClear,
  onRetry,
  title = 'Erros na Normalização',
  showRetry = true
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyError = async (error: string, index: number) => {
    try {
      await navigator.clipboard.writeText(error);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  const handleCopyAllErrors = async () => {
    try {
      const allErrors = errors.join('\n\n');
      await navigator.clipboard.writeText(allErrors);
      setCopiedIndex(-1); // Special index for "all errors"
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy all errors:', err);
    }
  };

  const getErrorType = (error: string): 'validation' | 'connection' | 'permission' | 'system' | 'unknown' => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('validação') || errorLower.includes('validation') || errorLower.includes('obrigatório')) {
      return 'validation';
    }
    if (errorLower.includes('conexão') || errorLower.includes('connection') || errorLower.includes('timeout')) {
      return 'connection';
    }
    if (errorLower.includes('permissão') || errorLower.includes('permission') || errorLower.includes('acesso')) {
      return 'permission';
    }
    if (errorLower.includes('sistema') || errorLower.includes('system') || errorLower.includes('internal')) {
      return 'system';
    }
    return 'unknown';
  };

  const getErrorIcon = (type: string): string => {
    switch (type) {
      case 'validation':
        return '⚠️';
      case 'connection':
        return '🔌';
      case 'permission':
        return '🔒';
      case 'system':
        return '⚙️';
      default:
        return '❌';
    }
  };

  const getErrorTypeLabel = (type: string): string => {
    switch (type) {
      case 'validation':
        return 'Erro de Validação';
      case 'connection':
        return 'Erro de Conexão';
      case 'permission':
        return 'Erro de Permissão';
      case 'system':
        return 'Erro do Sistema';
      default:
        return 'Erro Desconhecido';
    }
  };

  const getSuggestion = (type: string): string => {
    switch (type) {
      case 'validation':
        return 'Verifique os parâmetros informados e tente novamente.';
      case 'connection':
        return 'Verifique sua conexão com a internet e tente novamente.';
      case 'permission':
        return 'Entre em contato com o administrador para verificar suas permissões.';
      case 'system':
        return 'Erro interno do sistema. Entre em contato com o suporte técnico.';
      default:
        return 'Tente novamente ou entre em contato com o suporte técnico.';
    }
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="error-reporter">
      <div className="error-reporter__header">
        <div className="error-reporter__title-section">
          <div className="error-reporter__icon">🚨</div>
          <div className="error-reporter__title-text">
            <h3 className="error-reporter__title">{title}</h3>
            <p className="error-reporter__count">
              {errors.length} {errors.length === 1 ? 'erro encontrado' : 'erros encontrados'}
            </p>
          </div>
        </div>

        <div className="error-reporter__header-actions">
          <button
            className="error-reporter__toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher erros' : 'Expandir erros'}
          >
            <span className={`error-reporter__toggle-icon ${isExpanded ? 'error-reporter__toggle-icon--expanded' : ''}`}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="error-reporter__content">
          {/* Error Summary */}
          <div className="error-reporter__summary">
            <div className="error-reporter__summary-text">
              Ocorreram erros durante a execução da normalização. 
              Revise os detalhes abaixo e tome as ações necessárias.
            </div>
          </div>

          {/* Error List */}
          <div className="error-reporter__list">
            {errors.map((error, index) => {
              const errorType = getErrorType(error);
              const errorIcon = getErrorIcon(errorType);
              const errorTypeLabel = getErrorTypeLabel(errorType);
              const suggestion = getSuggestion(errorType);

              return (
                <div key={index} className={`error-reporter__item error-reporter__item--${errorType}`}>
                  <div className="error-reporter__item-header">
                    <div className="error-reporter__item-type">
                      <span className="error-reporter__item-icon">{errorIcon}</span>
                      <span className="error-reporter__item-type-label">{errorTypeLabel}</span>
                    </div>
                    <div className="error-reporter__item-actions">
                      <button
                        className="error-reporter__copy-btn"
                        onClick={() => handleCopyError(error, index)}
                        title="Copiar erro"
                      >
                        {copiedIndex === index ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  <div className="error-reporter__item-content">
                    <div className="error-reporter__error-message">
                      {error}
                    </div>
                    <div className="error-reporter__suggestion">
                      <strong>Sugestão:</strong> {suggestion}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="error-reporter__actions">
            <div className="error-reporter__action-group">
              <button
                className="error-reporter__action-btn error-reporter__action-btn--copy"
                onClick={handleCopyAllErrors}
                title="Copiar todos os erros"
              >
                <span className="error-reporter__action-icon">
                  {copiedIndex === -1 ? '✓' : '📋'}
                </span>
                {copiedIndex === -1 ? 'Copiado!' : 'Copiar Todos'}
              </button>

              {showRetry && onRetry && (
                <button
                  className="error-reporter__action-btn error-reporter__action-btn--retry"
                  onClick={onRetry}
                  title="Tentar novamente"
                >
                  <span className="error-reporter__action-icon">🔄</span>
                  Tentar Novamente
                </button>
              )}
            </div>

            <button
              className="error-reporter__action-btn error-reporter__action-btn--clear"
              onClick={onClear}
              title="Limpar erros"
            >
              <span className="error-reporter__action-icon">🗑️</span>
              Limpar Erros
            </button>
          </div>

          {/* Help Section */}
          <div className="error-reporter__help">
            <div className="error-reporter__help-icon">💡</div>
            <div className="error-reporter__help-content">
              <h4>Precisa de ajuda?</h4>
              <ul>
                <li>Verifique se todos os parâmetros estão corretos</li>
                <li>Confirme se você tem as permissões necessárias</li>
                <li>Tente executar a normalização novamente</li>
                <li>Se o problema persistir, entre em contato com o suporte técnico</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};