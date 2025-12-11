import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NormalizacaoExecutor } from './NormalizacaoExecutor.js';
import { NormalizacaoHistory } from './NormalizacaoHistory.js';
import { ProgressTracker } from './ProgressTracker.js';
import { ErrorReporter } from './ErrorReporter.js';

// Mock the usePermissions hook
vi.mock('../../core/auth/usePermissions.js', () => ({
  usePermissions: () => ({
    checkPermission: () => true
  })
}));

describe('Normalization Components', () => {
  describe('NormalizacaoExecutor', () => {
    it('should render the executor form', () => {
      const mockOnExecute = vi.fn();
      
      render(
        <NormalizacaoExecutor
          onExecute={mockOnExecute}
          loading={false}
          disabled={false}
        />
      );

      expect(screen.getByText('Executar Normalização')).toBeInTheDocument();
      expect(screen.getByLabelText(/Plano de Vagas/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Executar Normalização/ })).toBeInTheDocument();
    });

    it('should disable form when loading', () => {
      const mockOnExecute = vi.fn();
      
      render(
        <NormalizacaoExecutor
          onExecute={mockOnExecute}
          loading={true}
          disabled={false}
        />
      );

      expect(screen.getByRole('button', { name: /Executando.../ })).toBeDisabled();
    });
  });

  describe('NormalizacaoHistory', () => {
    it('should render empty state when no jobs', () => {
      const mockOnRetry = vi.fn();
      
      render(
        <NormalizacaoHistory
          jobs={[]}
          onRetry={mockOnRetry}
          canRetry={true}
          loading={false}
        />
      );

      expect(screen.getByText('Nenhuma execução encontrada')).toBeInTheDocument();
    });

    it('should render job list when jobs exist', () => {
      const mockJobs = [
        {
          id: 'job_001',
          status: 'completed' as const,
          params: {
            planoVagasId: 'plano_2025',
            forceRecalculate: true
          },
          result: {
            processedPostos: 25,
            updatedQuadros: 18,
            errors: [],
            startTime: new Date(),
            endTime: new Date(),
            duration: 45000
          },
          startedAt: new Date(),
          completedAt: new Date()
        }
      ];

      const mockOnRetry = vi.fn();
      
      render(
        <NormalizacaoHistory
          jobs={mockJobs}
          onRetry={mockOnRetry}
          canRetry={true}
          loading={false}
        />
      );

      expect(screen.getByText('Job: job_001')).toBeInTheDocument();
      expect(screen.getByText('Plano: plano_2025')).toBeInTheDocument();
    });
  });

  describe('ProgressTracker', () => {
    it('should render progress information', () => {
      const mockJob = {
        id: 'job_001',
        status: 'running' as const,
        params: {
          planoVagasId: 'plano_2025',
          forceRecalculate: true
        },
        startedAt: new Date(),
        progress: {
          current: 50,
          total: 100,
          message: 'Processando dados...'
        }
      };

      const mockOnCancel = vi.fn();
      
      render(
        <ProgressTracker
          job={mockJob}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Executando normalização...')).toBeInTheDocument();
      expect(screen.getByText('Processando dados...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show cancel button for running jobs', () => {
      const mockJob = {
        id: 'job_001',
        status: 'running' as const,
        params: {
          planoVagasId: 'plano_2025',
          forceRecalculate: true
        },
        startedAt: new Date()
      };

      const mockOnCancel = vi.fn();
      
      render(
        <ProgressTracker
          job={mockJob}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
    });
  });

  describe('ErrorReporter', () => {
    it('should render error list', () => {
      const mockErrors = [
        'Erro de conexão com o banco de dados',
        'Validação falhou para o campo obrigatório'
      ];

      const mockOnClear = vi.fn();
      
      render(
        <ErrorReporter
          errors={mockErrors}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Erros na Normalização')).toBeInTheDocument();
      expect(screen.getByText('2 erros encontrados')).toBeInTheDocument();
      expect(screen.getByText('Erro de conexão com o banco de dados')).toBeInTheDocument();
      expect(screen.getByText('Validação falhou para o campo obrigatório')).toBeInTheDocument();
    });

    it('should not render when no errors', () => {
      const mockOnClear = vi.fn();
      
      const { container } = render(
        <ErrorReporter
          errors={[]}
          onClear={mockOnClear}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show retry button when onRetry is provided', () => {
      const mockErrors = ['Test error'];
      const mockOnClear = vi.fn();
      const mockOnRetry = vi.fn();
      
      render(
        <ErrorReporter
          errors={mockErrors}
          onClear={mockOnClear}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByRole('button', { name: /Tentar Novamente/ })).toBeInTheDocument();
    });
  });
});