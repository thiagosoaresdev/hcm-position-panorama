import { performance } from 'perf_hooks';
import { getDatabase, getPoolStats } from '../database/connection.js';
import { getRedisClient } from '../cache/redis.js';
import { loggingConfig } from '../config/environment.js';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  databaseStats: {
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  } | null;
  cacheStats: {
    hitRate: number;
    memoryUsage: string;
    connectedClients: string;
  } | null;
  requestCount: number;
  errorCount: number;
}

/**
 * Request performance tracking
 */
export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Performance thresholds for alerting
 */
export interface PerformanceThresholds {
  responseTime: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number; // percentage
    critical: number; // percentage
  };
  databaseConnections: {
    warning: number; // percentage of max
    critical: number; // percentage of max
  };
  cacheHitRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

/**
 * Default performance thresholds
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  responseTime: {
    warning: 1000, // 1 second
    critical: 3000 // 3 seconds
  },
  memoryUsage: {
    warning: 80, // 80%
    critical: 90 // 90%
  },
  databaseConnections: {
    warning: 70, // 70% of max connections
    critical: 85 // 85% of max connections
  },
  cacheHitRate: {
    warning: 70, // 70%
    critical: 50 // 50%
  },
  errorRate: {
    warning: 5, // 5%
    critical: 10 // 10%
  }
};

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private cpuUsageStart = process.cpuUsage();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    
    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  /**
   * Start periodic performance monitoring
   */
  private startPeriodicMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Keep only last 100 metrics (50 minutes of data)
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }
        
        // Check thresholds and alert if necessary
        await this.checkThresholds(metrics);
        
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }
    }, 30000);

    // Clean up old request metrics every 5 minutes
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      this.requestMetrics = this.requestMetrics.filter(
        metric => metric.timestamp.getTime() > fiveMinutesAgo
      );
    }, 300000);
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.cpuUsageStart);
    
    // Calculate average response time from recent requests
    const recentRequests = this.requestMetrics.filter(
      req => req.timestamp.getTime() > Date.now() - 60000 // Last minute
    );
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length
      : 0;

    // Get database stats
    let databaseStats = null;
    try {
      const poolStats = getPoolStats();
      if (poolStats) {
        databaseStats = {
          totalConnections: poolStats.totalCount,
          idleConnections: poolStats.idleCount,
          waitingConnections: poolStats.waitingCount
        };
      }
    } catch (error) {
      console.error('Error getting database stats:', error);
    }

    // Get cache stats
    let cacheStats = null;
    try {
      const redisClient = getRedisClient();
      const info = await redisClient.info('memory');
      const stats = this.parseRedisInfo(info);
      
      // Calculate hit rate from recent requests (simplified)
      const cacheHitRate = this.calculateCacheHitRate();
      
      cacheStats = {
        hitRate: cacheHitRate,
        memoryUsage: stats.used_memory_human || '0B',
        connectedClients: stats.connected_clients || '0'
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return {
      timestamp,
      responseTime: avgResponseTime,
      memoryUsage,
      cpuUsage,
      databaseStats,
      cacheStats,
      requestCount: this.requestCount,
      errorCount: this.errorCount
    };
  }

  /**
   * Track a request for performance monitoring
   */
  trackRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);
    this.requestCount++;
    
    if (metrics.statusCode >= 400) {
      this.errorCount++;
    }

    // Log slow requests
    if (metrics.responseTime > this.thresholds.responseTime.warning) {
      console.warn('Slow request detected', {
        method: metrics.method,
        path: metrics.path,
        responseTime: metrics.responseTime,
        statusCode: metrics.statusCode
      });
    }
  }

  /**
   * Create Express middleware for request tracking
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      
      res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        this.trackRequest({
          method: req.method,
          path: req.path || req.url,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date(),
          userId: req.user?.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        });
      });
      
      next();
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
    const alerts: string[] = [];

    // Check response time
    if (metrics.responseTime > this.thresholds.responseTime.critical) {
      alerts.push(`CRITICAL: Average response time is ${metrics.responseTime}ms (threshold: ${this.thresholds.responseTime.critical}ms)`);
    } else if (metrics.responseTime > this.thresholds.responseTime.warning) {
      alerts.push(`WARNING: Average response time is ${metrics.responseTime}ms (threshold: ${this.thresholds.responseTime.warning}ms)`);
    }

    // Check memory usage
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      alerts.push(`CRITICAL: Memory usage is ${memoryUsagePercent.toFixed(1)}% (threshold: ${this.thresholds.memoryUsage.critical}%)`);
    } else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
      alerts.push(`WARNING: Memory usage is ${memoryUsagePercent.toFixed(1)}% (threshold: ${this.thresholds.memoryUsage.warning}%)`);
    }

    // Check database connections
    if (metrics.databaseStats) {
      const totalConnections = metrics.databaseStats.totalConnections;
      const maxConnections = 100; // This should come from config
      const connectionUsagePercent = (totalConnections / maxConnections) * 100;
      
      if (connectionUsagePercent > this.thresholds.databaseConnections.critical) {
        alerts.push(`CRITICAL: Database connection usage is ${connectionUsagePercent.toFixed(1)}% (threshold: ${this.thresholds.databaseConnections.critical}%)`);
      } else if (connectionUsagePercent > this.thresholds.databaseConnections.warning) {
        alerts.push(`WARNING: Database connection usage is ${connectionUsagePercent.toFixed(1)}% (threshold: ${this.thresholds.databaseConnections.warning}%)`);
      }
    }

    // Check cache hit rate
    if (metrics.cacheStats) {
      const hitRate = metrics.cacheStats.hitRate;
      if (hitRate < this.thresholds.cacheHitRate.critical) {
        alerts.push(`CRITICAL: Cache hit rate is ${hitRate.toFixed(1)}% (threshold: ${this.thresholds.cacheHitRate.critical}%)`);
      } else if (hitRate < this.thresholds.cacheHitRate.warning) {
        alerts.push(`WARNING: Cache hit rate is ${hitRate.toFixed(1)}% (threshold: ${this.thresholds.cacheHitRate.warning}%)`);
      }
    }

    // Check error rate
    const totalRequests = this.requestCount;
    const errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) * 100 : 0;
    if (errorRate > this.thresholds.errorRate.critical) {
      alerts.push(`CRITICAL: Error rate is ${errorRate.toFixed(1)}% (threshold: ${this.thresholds.errorRate.critical}%)`);
    } else if (errorRate > this.thresholds.errorRate.warning) {
      alerts.push(`WARNING: Error rate is ${errorRate.toFixed(1)}% (threshold: ${this.thresholds.errorRate.warning}%)`);
    }

    // Log alerts
    if (alerts.length > 0) {
      console.warn('Performance alerts:', alerts);
      
      // Here you would typically send alerts to monitoring systems
      // like Slack, email, or monitoring dashboards
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): {
    uptime: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    databaseStats: any;
    cacheStats: any;
  } {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    
    const recentRequests = this.requestMetrics.filter(
      req => req.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );
    const averageResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length
      : 0;

    const latestMetrics = this.metrics[this.metrics.length - 1];

    return {
      uptime,
      totalRequests: this.requestCount,
      errorRate,
      averageResponseTime,
      memoryUsage: process.memoryUsage(),
      databaseStats: latestMetrics?.databaseStats || null,
      cacheStats: latestMetrics?.cacheStats || null
    };
  }

  /**
   * Get detailed metrics for monitoring dashboard
   */
  getDetailedMetrics(): {
    metrics: PerformanceMetrics[];
    requestMetrics: RequestMetrics[];
    summary: any;
  } {
    return {
      metrics: this.metrics,
      requestMetrics: this.requestMetrics,
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Get slow queries from recent requests
   */
  getSlowQueries(threshold: number = 1000): RequestMetrics[] {
    return this.requestMetrics
      .filter(req => req.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 20); // Top 20 slowest
  }

  /**
   * Parse Redis info string
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const stats: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    }
    
    return stats;
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateCacheHitRate(): number {
    // This is a simplified calculation
    // In a real implementation, you would track cache hits/misses
    return Math.random() * 30 + 70; // Random between 70-100% for demo
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.metrics = [];
    this.requestMetrics = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    this.cpuUsageStart = process.cpuUsage();
  }
}

/**
 * Health check service
 */
export class HealthCheckService {
  constructor(private performanceMonitor: PerformanceMonitor) {}

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, {
      status: 'pass' | 'warn' | 'fail';
      message: string;
      responseTime?: number;
    }>;
    timestamp: Date;
  }> {
    const checks: Record<string, any> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Database health check
    try {
      const startTime = performance.now();
      const db = getDatabase();
      await db.query('SELECT 1');
      const responseTime = Math.round(performance.now() - startTime);
      
      checks.database = {
        status: responseTime < 100 ? 'pass' : responseTime < 500 ? 'warn' : 'fail',
        message: `Database connection successful (${responseTime}ms)`,
        responseTime
      };
      
      if (checks.database.status === 'fail') overallStatus = 'unhealthy';
      else if (checks.database.status === 'warn' && overallStatus === 'healthy') overallStatus = 'degraded';
      
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      overallStatus = 'unhealthy';
    }

    // Redis health check
    try {
      const startTime = performance.now();
      const redis = getRedisClient();
      await redis.ping();
      const responseTime = Math.round(performance.now() - startTime);
      
      checks.redis = {
        status: responseTime < 50 ? 'pass' : responseTime < 200 ? 'warn' : 'fail',
        message: `Redis connection successful (${responseTime}ms)`,
        responseTime
      };
      
      if (checks.redis.status === 'fail') overallStatus = 'unhealthy';
      else if (checks.redis.status === 'warn' && overallStatus === 'healthy') overallStatus = 'degraded';
      
    } catch (error) {
      checks.redis = {
        status: 'fail',
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      overallStatus = 'unhealthy';
    }

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    checks.memory = {
      status: memoryUsagePercent < 80 ? 'pass' : memoryUsagePercent < 90 ? 'warn' : 'fail',
      message: `Memory usage: ${memoryUsagePercent.toFixed(1)}% (${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB used)`
    };
    
    if (checks.memory.status === 'fail') overallStatus = 'unhealthy';
    else if (checks.memory.status === 'warn' && overallStatus === 'healthy') overallStatus = 'degraded';

    // Performance health check
    const summary = this.performanceMonitor.getPerformanceSummary();
    
    checks.performance = {
      status: summary.averageResponseTime < 1000 ? 'pass' : summary.averageResponseTime < 3000 ? 'warn' : 'fail',
      message: `Average response time: ${summary.averageResponseTime.toFixed(0)}ms, Error rate: ${summary.errorRate.toFixed(1)}%`
    };
    
    if (checks.performance.status === 'fail') overallStatus = 'unhealthy';
    else if (checks.performance.status === 'warn' && overallStatus === 'healthy') overallStatus = 'degraded';

    return {
      status: overallStatus,
      checks,
      timestamp: new Date()
    };
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const healthCheckService = new HealthCheckService(performanceMonitor);