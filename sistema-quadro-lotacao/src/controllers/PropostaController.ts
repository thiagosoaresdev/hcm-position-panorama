import type { Pool } from 'pg';
import { PropostaService } from '../services/PropostaService.js';
import type { CreatePropostaRequest, ApprovalRequest, RejectionRequest } from '../services/PropostaService.js';
import type { ApiResponse, Proposta, PropostaStatus, WorkflowConfig } from '../types/index.js';

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
 * Proposta Controller - API endpoints for proposal management
 * Provides REST endpoints for CRUD operations and workflow management
 */
export class PropostaController {
  private propostaService: PropostaService;

  constructor(pool: Pool) {
    this.propostaService = new PropostaService(pool);
  }

  /**
   * POST /api/propostas
   * Create a new proposta
   */
  async createProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const request: CreatePropostaRequest = {
        tipo: req.body.tipo,
        descricao: req.body.descricao,
        detalhamento: req.body.detalhamento,
        solicitanteId: req.body.solicitanteId || req.user?.id,
        quadroLotacaoId: req.body.quadroLotacaoId,
        cargoAtual: req.body.cargoAtual,
        cargoNovo: req.body.cargoNovo,
        vagasAtuais: req.body.vagasAtuais ? parseInt(req.body.vagasAtuais) : undefined,
        vagasSolicitadas: req.body.vagasSolicitadas ? parseInt(req.body.vagasSolicitadas) : undefined,
        centroCustoDestino: req.body.centroCustoDestino,
        impactoOrcamentario: req.body.impactoOrcamentario,
        analiseImpacto: req.body.analiseImpacto,
        anexos: req.body.anexos
      };

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Criação de nova proposta'
      };

      const proposta = await this.propostaService.createProposta(request, auditContext);

      const response: ApiResponse<Proposta> = {
        success: true,
        data: proposta.toJSON(),
        message: 'Proposta criada com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Dados inválidos')) {
        res.status(400).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

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
        message: `Erro ao criar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas/:id
   * Get proposta by ID
   */
  async getPropostaById(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const includeHistory = req.query.includeHistory === 'true';

      let result;
      if (includeHistory) {
        result = await this.propostaService.getPropostaWithHistory(id);
        if (!result) {
          res.status(404).json({
            success: false,
            data: null,
            message: 'Proposta não encontrada'
          });
          return;
        }
      } else {
        const proposta = await this.propostaService.getPropostaById(id);
        if (!proposta) {
          res.status(404).json({
            success: false,
            data: null,
            message: 'Proposta não encontrada'
          });
          return;
        }
        result = proposta.toJSON();
      }

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Proposta encontrada'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * PUT /api/propostas/:id
   * Update proposta (only if in draft)
   */
  async updateProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const updates: Partial<CreatePropostaRequest> = {
        descricao: req.body.descricao,
        detalhamento: req.body.detalhamento,
        cargoAtual: req.body.cargoAtual,
        cargoNovo: req.body.cargoNovo,
        vagasAtuais: req.body.vagasAtuais ? parseInt(req.body.vagasAtuais) : undefined,
        vagasSolicitadas: req.body.vagasSolicitadas ? parseInt(req.body.vagasSolicitadas) : undefined,
        centroCustoDestino: req.body.centroCustoDestino,
        impactoOrcamentario: req.body.impactoOrcamentario,
        analiseImpacto: req.body.analiseImpacto,
        anexos: req.body.anexos
      };

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Atualização de proposta'
      };

      const proposta = await this.propostaService.updateProposta(id, updates, auditContext);

      const response: ApiResponse<Proposta> = {
        success: true,
        data: proposta.toJSON(),
        message: 'Proposta atualizada com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrada')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('não pode ser editada') || errorMessage.includes('Dados inválidos')) {
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
        message: `Erro ao atualizar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * POST /api/propostas/:id/submit
   * Submit proposta for approval
   */
  async submitProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const workflowConfig: WorkflowConfig = req.body.workflowConfig || {
        niveis: [
          { ordem: 1, nome: 'Coordenação', aprovadores: ['coord-1'] },
          { ordem: 2, nome: 'Gerência', aprovadores: ['gerente-1'] },
          { ordem: 3, nome: 'Diretoria', aprovadores: ['diretor-1'] }
        ],
        incluirRH: true
      };

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Envio de proposta para aprovação'
      };

      const proposta = await this.propostaService.submitProposta(id, workflowConfig, auditContext);

      const response: ApiResponse<Proposta> = {
        success: true,
        data: proposta.toJSON(),
        message: 'Proposta enviada para aprovação com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrada')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('não pode ser enviada')) {
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
        message: `Erro ao enviar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * POST /api/propostas/:id/approve
   * Approve proposta at current level
   */
  async approveProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const request: ApprovalRequest = {
        aprovadorId: req.body.aprovadorId || req.user?.id,
        comentario: req.body.comentario
      };

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Aprovação de proposta'
      };

      const proposta = await this.propostaService.approveProposta(id, request, auditContext);

      const response: ApiResponse<Proposta> = {
        success: true,
        data: proposta.toJSON(),
        message: 'Proposta aprovada com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrada')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('não pode ser aprovada') || errorMessage.includes('não autorizado')) {
        res.status(403).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao aprovar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * POST /api/propostas/:id/reject
   * Reject proposta (returns to draft)
   */
  async rejectProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;
      const request: RejectionRequest = {
        aprovadorId: req.body.aprovadorId || req.user?.id,
        comentario: req.body.comentario,
        motivo: req.body.motivo || 'Rejeição de proposta'
      };

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: request.motivo
      };

      const proposta = await this.propostaService.rejectProposta(id, request, auditContext);

      const response: ApiResponse<Proposta> = {
        success: true,
        data: proposta.toJSON(),
        message: 'Proposta rejeitada com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrada')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('não pode ser rejeitada') || errorMessage.includes('não autorizado')) {
        res.status(403).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao rejeitar proposta: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas
   * List propostas with filters
   */
  async listPropostas(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const filters = {
        solicitanteId: req.query.solicitanteId as string,
        status: req.query.status as PropostaStatus,
        tipo: req.query.tipo as 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia',
        quadroLotacaoId: req.query.quadroLotacaoId as string,
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const propostas = await this.propostaService.listPropostas(filters);

      const response: ApiResponse<Proposta[]> = {
        success: true,
        data: propostas.map(p => p.toJSON()),
        message: `${propostas.length} propostas encontradas`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao listar propostas: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas/my
   * Get propostas for current user (as solicitante)
   */
  async getMyPropostas(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const solicitanteId = req.user?.id;
      if (!solicitanteId) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const propostas = await this.propostaService.getPropostasBySolicitante(solicitanteId);

      const response: ApiResponse<Proposta[]> = {
        success: true,
        data: propostas.map(p => p.toJSON()),
        message: `${propostas.length} propostas encontradas`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar propostas: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas/pending
   * Get pending propostas for approval by current user
   */
  async getPendingPropostas(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const aprovadorId = req.user?.id;
      if (!aprovadorId) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const propostas = await this.propostaService.getPendingPropostasForApprover(aprovadorId);

      const response: ApiResponse<Proposta[]> = {
        success: true,
        data: propostas.map(p => p.toJSON()),
        message: `${propostas.length} propostas pendentes encontradas`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar propostas pendentes: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas/statistics
   * Get propostas statistics
   */
  async getStatistics(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const statistics = await this.propostaService.getPropostasStatistics();

      const response: ApiResponse<Record<PropostaStatus, number>> = {
        success: true,
        data: statistics,
        message: 'Estatísticas obtidas com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao obter estatísticas: ${errorMessage}`
      });
    }
  }

  /**
   * GET /api/propostas/overdue
   * Get overdue propostas
   */
  async getOverduePropostas(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const maxDays = req.query.maxDays ? parseInt(req.query.maxDays as string) : 3;
      const propostas = await this.propostaService.getOverduePropostas(maxDays);

      const response: ApiResponse<Proposta[]> = {
        success: true,
        data: propostas.map(p => p.toJSON()),
        message: `${propostas.length} propostas em atraso encontradas`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao buscar propostas em atraso: ${errorMessage}`
      });
    }
  }

  /**
   * DELETE /api/propostas/:id
   * Delete proposta (only if in draft)
   */
  async deleteProposta(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const { id } = req.params;

      const auditContext = {
        userId: req.user?.id || 'system',
        userName: req.user?.nome || 'Sistema',
        motivo: req.body.motivo || 'Exclusão de proposta'
      };

      await this.propostaService.deleteProposta(id, auditContext);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Proposta excluída com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('não encontrada')) {
        res.status(404).json({
          success: false,
          data: null,
          message: errorMessage
        });
        return;
      }

      if (errorMessage.includes('rascunho')) {
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
        message: `Erro ao excluir proposta: ${errorMessage}`
      });
    }
  }
}