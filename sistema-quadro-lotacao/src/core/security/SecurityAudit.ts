import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, ValidationChain } from 'express-validator';
import { appConfig, loggingConfig } from '../config/environment.js';

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  INVALID_INPUT = 'invalid_input',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  ip: string;
  userAgent?: string;
  userId?: string;
  endpoint: string;
  method: string;
  details: Record<string, any>;
  blocked: boolean;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  bruteForce: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  inputValidation: {
    maxLength: number;
    allowedCharacters: RegExp;
  };
  monitoring: {
    alertThreshold: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    windowMs: appConfig.rateLimit.windowMs,
    maxRequests: appConfig.rateLimit.maxRequests,
    skipSuccessfulRequests: true
  },
  bruteForce: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  inputValidation: {
    maxLength: 1000,
    allowedCharacters: /^[a-zA-Z0-9\s\-_@.áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]*$/
  },
  monitoring: {
    alertThreshold: 10, // Alert after 10 security events in window
    logLevel: loggingConfig.level as any
  }
};

/**
 * Security audit service
 */
export class SecurityAuditService {
  private events: SecurityEvent[] = [];
  private blockedIPs: Map<string, { until: Date; attempts: number }> = new Map();
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    
    // Clean up old events and blocked IPs periodically
    setInterval(() => {
      this.cleanupOldData();
    }, 60000); // Every minute
  }

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.events.push(securityEvent);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log based on severity
    const logMessage = `Security Event [${event.type}]: ${event.endpoint} from ${event.ip}`;
    
    switch (event.severity) {
      case 'critical':
        console.error(logMessage, event.details);
        break;
      case 'high':
        console.warn(logMessage, event.details);
        break;
      case 'medium':
        console.info(logMessage, event.details);
        break;
      case 'low':
        if (this.config.monitoring.logLevel === 'debug') {
          console.debug(logMessage, event.details);
        }
        break;
    }

    // Check if we need to block the IP
    if (event.severity === 'high' || event.severity === 'critical') {
      this.checkBruteForceAttempt(event.ip, event.type);
    }

    // Check alert threshold
    this.checkAlertThreshold();
  }

  /**
   * Check if an IP should be blocked for brute force attempts
   */
  private checkBruteForceAttempt(ip: string, eventType: SecurityEventType): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.bruteForce.windowMs);
    
    // Count recent events from this IP
    const recentEvents = this.events.filter(event => 
      event.ip === ip && 
      event.timestamp >= windowStart &&
      (event.severity === 'high' || event.severity === 'critical')
    );

    if (recentEvents.length >= this.config.bruteForce.maxAttempts) {
      const blockUntil = new Date(now.getTime() + this.config.bruteForce.blockDurationMs);
      this.blockedIPs.set(ip, { until: blockUntil, attempts: recentEvents.length });
      
      console.warn(`IP ${ip} blocked until ${blockUntil.toISOString()} due to ${recentEvents.length} security events`);
      
      // Log brute force event
      this.logSecurityEvent({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: 'critical',
        ip,
        endpoint: 'system',
        method: 'BLOCK',
        details: {
          attempts: recentEvents.length,
          blockUntil: blockUntil.toISOString(),
          eventTypes: recentEvents.map(e => e.type)
        },
        blocked: true
      });
    }
  }

  /**
   * Check if alert threshold is exceeded
   */
  private checkAlertThreshold(): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.rateLimit.windowMs);
    
    const recentEvents = this.events.filter(event => 
      event.timestamp >= windowStart &&
      (event.severity === 'high' || event.severity === 'critical')
    );

    if (recentEvents.length >= this.config.monitoring.alertThreshold) {
      console.error(`SECURITY ALERT: ${recentEvents.length} high/critical security events in the last ${this.config.rateLimit.windowMs / 1000 / 60} minutes`);
      
      // Here you would typically send alerts to monitoring systems
      // like Slack, email, or SIEM systems
    }
  }

  /**
   * Check if an IP is currently blocked
   */
  isIPBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    if (!blocked) return false;
    
    if (new Date() > blocked.until) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Create IP blocking middleware
   */
  createIPBlockingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (this.isIPBlocked(ip)) {
        const blocked = this.blockedIPs.get(ip);
        
        this.logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          severity: 'medium',
          ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method,
          details: {
            reason: 'IP blocked due to previous security violations',
            blockUntil: blocked?.until.toISOString(),
            attempts: blocked?.attempts
          },
          blocked: true
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Your IP has been temporarily blocked due to suspicious activity',
          retryAfter: blocked?.until.toISOString()
        });
      }
      
      next();
    };
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimitMiddleware() {
    return rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.maxRequests,
      skipSuccessfulRequests: this.config.rateLimit.skipSuccessfulRequests,
      handler: (req: Request, res: Response) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        
        this.logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: 'medium',
          ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method,
          details: {
            limit: this.config.rateLimit.maxRequests,
            windowMs: this.config.rateLimit.windowMs
          },
          blocked: true
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
        });
      }
    });
  }

  /**
   * Create security headers middleware
   */
  createSecurityHeadersMiddleware() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.senior.com.br"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });
  }

  /**
   * Create input validation middleware
   */
  createInputValidationMiddleware(validations: ValidationChain[]) {
    return [
      ...validations,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
          const ip = req.ip || req.connection.remoteAddress || 'unknown';
          
          this.logSecurityEvent({
            type: SecurityEventType.INVALID_INPUT,
            severity: 'low',
            ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            endpoint: req.path,
            method: req.method,
            details: {
              errors: errors.array(),
              body: this.sanitizeForLogging(req.body)
            },
            blocked: false
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: errors.array()
          });
        }
        
        next();
      }
    ];
  }

  /**
   * Create SQL injection detection middleware
   */
  createSQLInjectionDetectionMiddleware() {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i,
      /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i
    ];

    return (req: Request, res: Response, next: NextFunction) => {
      const checkForSQLInjection = (obj: any, path: string = ''): boolean => {
        if (typeof obj === 'string') {
          return sqlInjectionPatterns.some(pattern => pattern.test(obj));
        }
        
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (checkForSQLInjection(value, `${path}.${key}`)) {
              return true;
            }
          }
        }
        
        return false;
      };

      const hasSQLInjection = 
        checkForSQLInjection(req.query, 'query') ||
        checkForSQLInjection(req.body, 'body') ||
        checkForSQLInjection(req.params, 'params');

      if (hasSQLInjection) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        
        this.logSecurityEvent({
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          severity: 'critical',
          ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          endpoint: req.path,
          method: req.method,
          details: {
            query: this.sanitizeForLogging(req.query),
            body: this.sanitizeForLogging(req.body),
            params: req.params
          },
          blocked: true
        });

        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid request parameters'
        });
      }
      
      next();
    };
  }

  /**
   * Create XSS detection middleware
   */
  createXSSDetectionMiddleware() {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi
    ];

    return (req: Request, res: Response, next: NextFunction) => {
      const checkForXSS = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return xssPatterns.some(pattern => pattern.test(obj));
        }
        
        if (typeof obj === 'object' && obj !== null) {
          for (const value of Object.values(obj)) {
            if (checkForXSS(value)) {
              return true;
            }
          }
        }
        
        return false;
      };

      const hasXSS = 
        checkForXSS(req.query) ||
        checkForXSS(req.body);

      if (hasXSS) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        
        this.logSecurityEvent({
          type: SecurityEventType.XSS_ATTEMPT,
          severity: 'high',
          ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          endpoint: req.path,
          method: req.method,
          details: {
            query: this.sanitizeForLogging(req.query),
            body: this.sanitizeForLogging(req.body)
          },
          blocked: true
        });

        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid request content'
        });
      }
      
      next();
    };
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    recentEvents: SecurityEvent[];
  } {
    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity]++;
    }

    const recentEvents = this.events
      .filter(event => event.timestamp.getTime() > Date.now() - 3600000) // Last hour
      .slice(-20); // Last 20 events

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.blockedIPs.size,
      recentEvents
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeForLogging(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...obj };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Clean up old events and blocked IPs
   */
  private cleanupOldData(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Remove events older than 24 hours
    this.events = this.events.filter(event => event.timestamp > oneDayAgo);

    // Remove expired IP blocks
    for (const [ip, block] of this.blockedIPs.entries()) {
      if (now > block.until) {
        this.blockedIPs.delete(ip);
      }
    }
  }
}

/**
 * Common validation chains
 */
export const commonValidations = {
  id: body('id').isUUID().withMessage('ID must be a valid UUID'),
  email: body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  name: body('name').isLength({ min: 2, max: 100 }).matches(/^[a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s]+$/).withMessage('Name must contain only letters and spaces'),
  text: body('text').isLength({ max: 1000 }).withMessage('Text must not exceed 1000 characters'),
  number: body('number').isNumeric().withMessage('Must be a valid number'),
  date: body('date').isISO8601().withMessage('Must be a valid ISO 8601 date')
};

// Export singleton instance
export const securityAuditService = new SecurityAuditService();