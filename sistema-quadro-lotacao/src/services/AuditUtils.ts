import { AuditService, AuditContext } from './AuditService.js';

/**
 * Audit utilities for common audit operations
 */
export class AuditUtils {
  /**
   * Compare two objects and return only the changed fields
   */
  static getChangedFields(
    before: Record<string, any>,
    after: Record<string, any>
  ): Record<string, { before: any; after: any }> {
    const changes: Record<string, { before: any; after: any }> = {};
    
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      const beforeValue = before[key];
      const afterValue = after[key];
      
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes[key] = { before: beforeValue, after: afterValue };
      }
    }
    
    return changes;
  }

  /**
   * Sanitize sensitive data from audit logs
   */
  static sanitizeAuditData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'cnpj'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Generate audit motivo for common operations
   */
  static generateMotivo(operation: string, entityType: string, details?: string): string {
    const baseMotivo = `${operation} de ${entityType}`;
    return details ? `${baseMotivo}: ${details}` : baseMotivo;
  }

  /**
   * Create audit context from user session
   */
  static createAuditContext(
    user: { id: string; nome: string },
    motivo?: string,
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): AuditContext {
    return {
      userId: user.id,
      userName: user.nome,
      motivo,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      sessionId: request?.sessionId
    };
  }

  /**
   * Validate audit context completeness
   */
  static validateAuditContext(context: AuditContext): string[] {
    const errors: string[] = [];
    
    if (!context.userId) {
      errors.push('User ID é obrigatório no contexto de auditoria');
    }
    
    if (!context.userName) {
      errors.push('Nome do usuário é obrigatório no contexto de auditoria');
    }
    
    return errors;
  }
}

/**
 * Decorator for automatic audit logging of service methods
 */
export function Auditable(
  entityType: string,
  action: string,
  getEntityId?: (args: any[]) => string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const auditService: AuditService = (this as any).auditService;
      
      if (!auditService) {
        console.warn(`AuditService not found in ${target.constructor.name}. Skipping audit.`);
        return method.apply(this, args);
      }
      
      try {
        // Execute the original method
        const result = await method.apply(this, args);
        
        // Log the audit entry
        const entityId = getEntityId ? getEntityId(args) : args[0];
        const context = (this as any).currentAuditContext || {
          userId: 'unknown',
          userName: 'Unknown User',
          motivo: `${action} via ${propertyName}`
        };
        
        await auditService.logAction(
          entityId,
          entityType,
          action,
          context
        );
        
        return result;
      } catch (error) {
        // Log error in audit
        const entityId = getEntityId ? getEntityId(args) : args[0];
        const context = (this as any).currentAuditContext || {
          userId: 'unknown',
          userName: 'Unknown User',
          motivo: `Failed ${action} via ${propertyName}: ${error.message}`
        };
        
        await auditService.logAction(
          entityId,
          entityType,
          `${action}_failed`,
          context
        );
        
        throw error;
      }
    };
    
    return descriptor;
  };
}