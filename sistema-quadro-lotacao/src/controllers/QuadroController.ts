import type { Pool } from 'pg';
import { QuadroLotacaoService } from '../services/QuadroLotacaoService.js';
import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';
import type { ApiResponse, PaginatedResponse, QuadroLotacao } from '../types/index.js';

// Generic HTTP interfaces to avoid Express dependency
interface HttpRequest {
  params: Record<string, string>;
  body: any;
  query: Record<string, string | string[]>;
  user?: {
    id: string;
    nome: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  app?: {
    locals: {
      pool: Pool;
    };
  };
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: any): HttpResponse;
}

/**
 * Quadro Controller - API endpoints for quadro de lotação management
 * Provides REST endpoints for CRUD operations on vagas with audit trail
 */
export class QuadroController {
  private quadroService: QuadroLotacaoService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.quadroService = new QuadroLotacaoService(pool);
  }

  /**
   * POST /api/quadro
   * Create a new vaga with uniqueness validation
   */
  async createVaga(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const {
        id,
        planoVagasId,
        postoTrabalhoId,
        cargoId,
        vagasPrevistas,
        dataInicioControle,
        tipoControle,
        cargoVaga,
        observacoes
      } = req.body;

      // Extract audit context from request (would come from auth middleware)
      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Criação de nova vaga'
      };

      const quadro = await this.quadroService.createQuadroLotacao(
        {
          id,
          planoVagasId,
          postoTrabalhoId,
          cargoId,
          vagasPrevistas: parseInt(vagasPrevistas),
          dataInicioControle: new Date(dataInicioControle),
          tipoControle,
          cargoVaga,
          observacoes
        },
        auditContext
      );

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: quadro.toJSON(),
        message: 'Vaga criada com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Handle uniqueness validation error
      if (errorMessage.includes('Já existe uma vaga')) {
        res.status(409).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      // Handle validation errors
      if (errorMessage.includes('Dados inválidos')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao criar vaga: ${errorMessage}`
      });
    }
  }

  /**
   * PUT /api/quadro/:id
   * Update vaga with audit trail
   */
  async updateVaga(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const { vagasPrevistas, observacoes, motivo } = req.body;

      // Extract audit context from request
      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: motivo || 'Atualização de vaga'
      };

      let updatedQuadro: QuadroLotacaoModel;

      // Handle different update operations
      if (vagasPrevistas !== undefined) {
        updatedQuadro = await this.quadroService.updateVagasPrevistas(
          id,
          parseInt(vagasPrevistas),
          auditContext
        );
      } else {
        // For other updates, we need to get the current quadro and update it
        // This is a simplified version - in a real implementation, you'd handle
        // all possible field updates
        throw new Error('Tipo de atualização não suportado');
      }

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: updatedQuadro.toJSON(),
        message: 'Vaga atualizada com sucesso'
      };

      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Handle deficit warning
      if (errorMessage.includes('déficit')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      // Handle not found
      if (errorMessage.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao atualizar vaga: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/quadro/:id
   * Get vaga by ID with details
   */
  async getVagaById(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      
      // This would use the repository directly since service doesn't have getById
      // In a real implementation, you might add this method to the service
      const quadroRepository = new (await import('../repositories/QuadroLotacaoRepository.js')).QuadroLotacaoRepository(
        req.app?.locals.pool || this.pool
      );
      
      const quadro = await quadroRepository.findById(id);
      
      if (!quadro) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Vaga não encontrada'
        });
        return;
      }

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: quadro.toJSON(),
        message: 'Vaga encontrada'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar vaga: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/quadro
   * List vagas with filtering and pagination
   */
  async listVagas(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const {
        planoVagasId,
        postoTrabalhoId,
        cargoId,
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const quadroRepository = new (await import('../repositories/QuadroLotacaoRepository.js')).QuadroLotacaoRepository(
        req.app?.locals.pool || this.pool
      );

      let quadros: QuadroLotacaoModel[] = [];

      // Apply filters
      if (planoVagasId) {
        quadros = await quadroRepository.findByPlanoVagas(planoVagasId as string);
      } else if (postoTrabalhoId) {
        quadros = await quadroRepository.findByPostoTrabalho(postoTrabalhoId as string);
      } else if (cargoId) {
        quadros = await quadroRepository.findByCargo(cargoId as string);
      } else {
        // Get all active quadros - this would need to be implemented in repository
        quadros = await quadroRepository.findAll({ ativo: true });
      }

      // Simple pagination (in production, this should be done at database level)
      const total = quadros.length;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedQuadros = quadros.slice(startIndex, endIndex);

      const response: PaginatedResponse<QuadroLotacao> = {
        data: paginatedQuadros.map(q => q.toJSON()),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao listar vagas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * DELETE /api/quadro/:id
   * Soft delete vaga (maintains data for audit)
   */
  async deleteVaga(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      // Extract audit context from request
      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: motivo || 'Exclusão de vaga'
      };

      const deletedQuadro = await this.quadroService.softDeleteQuadro(id, auditContext);

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: deletedQuadro.toJSON(),
        message: 'Vaga excluída com sucesso'
      };

      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Handle not found
      if (errorMessage.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      // Handle business rule violation (can't delete with active employees)
      if (errorMessage.includes('colaboradores ativos')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao excluir vaga: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/quadro/:id/historico
   * Get complete change history for a vaga
   */
  async getVagaHistorico(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;

      // This would use the audit service to get the history
      const auditService = new (await import('../services/AuditService.js')).AuditService(
        req.app?.locals.pool || this.pool
      );

      const auditTrail = await auditService.getAuditTrail(id, 'QuadroLotacao');

      const response: ApiResponse<typeof auditTrail> = {
        success: true,
        data: auditTrail,
        message: `Histórico de alterações da vaga ${id}`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/quadro/stats/:planoVagasId
   * Get occupancy statistics for a plano de vagas
   */
  async getOccupancyStats(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { planoVagasId } = req.params;

      const stats = await this.quadroService.getOccupancyStats(planoVagasId);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Estatísticas de ocupação recuperadas'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/quadro/deficit/:planoVagasId
   * Get quadros with deficit (more employees than planned positions)
   */
  async getQuadrosWithDeficit(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { planoVagasId } = req.params;

      const quadrosWithDeficit = await this.quadroService.getQuadrosWithDeficit(planoVagasId);

      const response: ApiResponse<QuadroLotacao[]> = {
        success: true,
        data: quadrosWithDeficit.map(q => q.toJSON()),
        message: `Encontrados ${quadrosWithDeficit.length} quadros com déficit`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar quadros com déficit: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/quadro/available/:planoVagasId
   * Get quadros with available positions
   */
  async getQuadrosAvailable(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { planoVagasId } = req.params;

      const quadrosAvailable = await this.quadroService.getQuadrosAvailable(planoVagasId);

      const response: ApiResponse<QuadroLotacao[]> = {
        success: true,
        data: quadrosAvailable.map(q => q.toJSON()),
        message: `Encontrados ${quadrosAvailable.length} quadros com vagas disponíveis`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar quadros disponíveis: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * POST /api/quadro/:id/colaborador/admitir
   * Admit a colaborador to a vaga
   */
  async admitirColaborador(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: motivo || 'Admissão de colaborador'
      };

      const updatedQuadro = await this.quadroService.admitirColaborador(id, auditContext);

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: updatedQuadro.toJSON(),
        message: 'Colaborador admitido com sucesso'
      };

      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('Não há vagas disponíveis')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao admitir colaborador: ${errorMessage}`
      });
    }
  }

  /**
   * POST /api/quadro/:id/colaborador/desligar
   * Remove a colaborador from a vaga
   */
  async desligarColaborador(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: motivo || 'Desligamento de colaborador'
      };

      const updatedQuadro = await this.quadroService.desligarColaborador(id, auditContext);

      const response: ApiResponse<QuadroLotacao> = {
        success: true,
        data: updatedQuadro.toJSON(),
        message: 'Colaborador desligado com sucesso'
      };

      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrado')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('Não há colaboradores para remover')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao desligar colaborador: ${errorMessage}`
      });
    }
  }
}

// Export interfaces for use in other modules
export type { HttpRequest, HttpResponse };