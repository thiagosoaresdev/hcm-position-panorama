import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditContext } from './AuditService.js';
import { Pool } from 'pg';

/**
 * Audit Middleware for automatic audit context management
 * Extracts user information from request and sets up audit context
 */
export class AuditMiddleware {
  private auditService: AuditService;

  constructor(pool: Pool) {
    this.auditService = new AuditService(pool);
  }

  /**
   * Express middleware to set audit context from request
   */
  setAuditContext() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract user info from request (assuming it's set by auth middleware)
        const user = (req as any).user;
        if (!user) {
          return next();
        }

        const context: AuditContext = {
          userId: user.id,
          userName: user.nome || user.name,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: (req as any).sessionId,
          requestId: req.headers['x-request-id'] as string
        };

        // Set audit context for this request
        await this.auditService.setAuditContext(context);
        
        // Store context in request for later use
        (req as any).auditContext = context;
        
        // Clear context after response
        res.on('finish', async () => {
          await this.auditService.clearAuditContext();
        });

        next();
      } catch (error) {
        console.error('Error setting audit context:', error);
        next();
      }
    };
  }

  /**
   * Get audit service instance
   */
  getAuditService(): AuditService {
    return this.auditService;
  }
}