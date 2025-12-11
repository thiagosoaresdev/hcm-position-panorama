import { testConnection, getPoolStats } from '../database/connection.js';
import { testRedisConnection, getRedisClient } from '../cache/redis.js';
import { env } from '../config/environment.js';

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SystemHealth {
  overall: HealthStatus;
  components: {
    database: HealthStatus;
    redis: HealthStatus;
    environment: HealthStatus;
    memory: HealthStatus;
  };
}

/**
 * Health check service
 */
export class HealthCheckService {
  /**
   * Check database health
   */
  async checkDatabase(): Promise<HealthStatus> {
    try {
      const isConnected = await testConnection();
      if (!isConnected) {
        return {
          status: 'error',
          message: 'Database connection failed',
          timestamp: new Date(),
        };
      }

      const poolStats = getPoolStats();
      const details = poolStats ? {
        totalConnections: poolStats.totalCount,
        idleConnections: poolStats.idleCount,
        waitingConnections: poolStats.waitingCount,
      } : {};

      // Check if pool is getting full
      const warningThreshold = 0.8;
      if (poolStats && poolStats.totalCount > 0) {
        const usageRatio = (poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount;
        if (usageRatio > warningThreshold) {
          return {
            status: 'warning',
            message: 'Database connection pool usage is high',
            details,
            timestamp: new Date(),
          };
        }
      }

      return {
        status: 'healthy',
        message: 'Database is healthy',
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database health check failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check Redis health
   */
  async checkRedis(): Promise<HealthStatus> {
    try {
      const isConnected = await testRedisConnection();
      if (!isConnected) {
        return {
          status: 'error',
          message: 'Redis connection failed',
          timestamp: new Date(),
        };
      }

      // Get Redis info
      const client = getRedisClient();
      const info = await client.info('memory');
      const memoryInfo = this.parseRedisInfo(info);

      const details = {
        usedMemory: memoryInfo.used_memory_human || 'unknown',
        maxMemory: memoryInfo.maxmemory_human || 'unlimited',
        connectedClients: memoryInfo.connected_clients || 'unknown',
      };

      return {
        status: 'healthy',
        message: 'Redis is healthy',
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Redis health check failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment(): Promise<HealthStatus> {
    try {
      const issues: string[] = [];

      // Check critical environment variables
      if (!env.PLATFORM_CLIENT_SECRET || env.PLATFORM_CLIENT_SECRET.length < 10) {
        issues.push('PLATFORM_CLIENT_SECRET is missing or too short');
      }

      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
        issues.push('JWT_SECRET is missing or too short');
      }

      if (!env.RH_LEGADO_WEBHOOK_SECRET) {
        issues.push('RH_LEGADO_WEBHOOK_SECRET is missing');
      }

      // Check URLs
      try {
        new URL(env.PLATFORM_AUTH_URL);
        new URL(env.PLATFORM_AUTHZ_URL);
        new URL(env.PLATFORM_NOTIFICATIONS_URL);
      } catch {
        issues.push('One or more Platform API URLs are invalid');
      }

      if (issues.length > 0) {
        return {
          status: 'error',
          message: 'Environment configuration issues found',
          details: { issues },
          timestamp: new Date(),
        };
      }

      return {
        status: 'healthy',
        message: 'Environment configuration is valid',
        details: {
          nodeEnv: env.NODE_ENV,
          port: env.PORT,
          logLevel: env.LOG_LEVEL,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Environment check failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemory(): Promise<HealthStatus> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const freeMemory = totalMemory - usedMemory;
      const usagePercentage = (usedMemory / totalMemory) * 100;

      const details = {
        heapUsed: `${Math.round(usedMemory / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(totalMemory / 1024 / 1024)} MB`,
        heapFree: `${Math.round(freeMemory / 1024 / 1024)} MB`,
        usagePercentage: `${usagePercentage.toFixed(1)}%`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      };

      // Warning if memory usage is high
      if (usagePercentage > 85) {
        return {
          status: 'warning',
          message: 'High memory usage detected',
          details,
          timestamp: new Date(),
        };
      }

      // Error if memory usage is critical
      if (usagePercentage > 95) {
        return {
          status: 'error',
          message: 'Critical memory usage detected',
          details,
          timestamp: new Date(),
        };
      }

      return {
        status: 'healthy',
        message: 'Memory usage is normal',
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Memory check failed: ${error instanceof Error ? error.message : error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Perform complete system health check
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const [database, redis, environment, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkEnvironment(),
      this.checkMemory(),
    ]);

    // Determine overall status
    const components = { database, redis, environment, memory };
    const statuses = Object.values(components).map(c => c.status);

    let overallStatus: 'healthy' | 'warning' | 'error';
    let overallMessage: string;

    if (statuses.includes('error')) {
      overallStatus = 'error';
      overallMessage = 'System has critical issues';
    } else if (statuses.includes('warning')) {
      overallStatus = 'warning';
      overallMessage = 'System has warnings';
    } else {
      overallStatus = 'healthy';
      overallMessage = 'All systems operational';
    }

    return {
      overall: {
        status: overallStatus,
        message: overallMessage,
        timestamp: new Date(),
      },
      components,
    };
  }

  /**
   * Parse Redis info string into key-value pairs
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }
}

// Export default health check service
export const healthCheckService = new HealthCheckService();