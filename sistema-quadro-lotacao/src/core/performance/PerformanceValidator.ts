import { performance } from 'perf_hooks';
import { getDatabase } from '../database/connection.js';
import { getRedisClient } from '../cache/redis.js';
import { performanceMonitor } from '../monitoring/PerformanceMonitor.js';

/**
 * Performance validation results
 */
export interface PerformanceValidationResult {
  passed: boolean;
  results: {
    databaseResponseTime: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
    apiResponseTime: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
    dashboardLoadTime: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
    cacheHitRate: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
    memoryUsage: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
    databaseConnections: {
      passed: boolean;
      actual: number;
      threshold: number;
      message: string;
    };
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallScore: number;
  };
  recommendations: string[];
}

/**
 * Performance validation thresholds
 */
export interface PerformanceThresholds {
  databaseResponseTime: number; // milliseconds
  apiResponseTime: number; // milliseconds
  dashboardLoadTime: number; // milliseconds
  cacheHitRate: number; // percentage
  memoryUsage: number; // percentage
  databaseConnections: number; // percentage of max
}

/**
 * Default performance thresholds based on requirements
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  databaseResponseTime: 100, // 100ms for database queries
  apiResponseTime: 1000, // 1 second for API responses (requirement)
  dashboardLoadTime: 3000, // 3 seconds for dashboard (requirement)
  cacheHitRate: 80, // 80% cache hit rate
  memoryUsage: 85, // 85% memory usage
  databaseConnections: 80 // 80% of max database connections
};

/**
 * Performance validator service
 */
export class PerformanceValidator {
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Run comprehensive performance validation
   */
  async validatePerformance(): Promise<PerformanceValidationResult> {
    console.log('Starting performance validation...');
    
    const results = {
      databaseResponseTime: await this.validateDatabaseResponseTime(),
      apiResponseTime: await this.validateAPIResponseTime(),
      dashboardLoadTime: await this.validateDashboardLoadTime(),
      cacheHitRate: await this.validateCacheHitRate(),
      memoryUsage: await this.validateMemoryUsage(),
      databaseConnections: await this.validateDatabaseConnections()
    };

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallScore = Math.round((passedTests / totalTests) * 100);

    const recommendations = this.generateRecommendations(results);

    const validationResult: PerformanceValidationResult = {
      passed: failedTests === 0,
      results,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallScore
      },
      recommendations
    };

    console.log(`Performance validation completed. Score: ${overallScore}% (${passedTests}/${totalTests} tests passed)`);
    
    return validationResult;
  }

  /**
   * Validate database response time
   */
  private async validateDatabaseResponseTime(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    try {
      const db = getDatabase();
      const startTime = performance.now();
      
      // Test with a simple query
      await db.query('SELECT 1');
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const passed = responseTime <= this.thresholds.databaseResponseTime;
      
      return {
        passed,
        actual: responseTime,
        threshold: this.thresholds.databaseResponseTime,
        message: passed 
          ? `Database response time is acceptable (${responseTime}ms)`
          : `Database response time is too slow (${responseTime}ms > ${this.thresholds.databaseResponseTime}ms)`
      };
    } catch (error) {
      return {
        passed: false,
        actual: -1,
        threshold: this.thresholds.databaseResponseTime,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate API response time (simulated)
   */
  private async validateAPIResponseTime(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    try {
      // Simulate API call by running a complex database query
      const db = getDatabase();
      const startTime = performance.now();
      
      // Simulate a typical API query (quadro lotacao with joins)
      await db.query(`
        SELECT ql.*, pt.nome as posto_nome, c.nome as cargo_nome
        FROM quadro_lotacao ql
        LEFT JOIN postos_trabalho pt ON ql.posto_trabalho_id = pt.id
        LEFT JOIN cargos c ON ql.cargo_id = c.id
        WHERE ql.ativo = true
        LIMIT 10
      `);
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const passed = responseTime <= this.thresholds.apiResponseTime;
      
      return {
        passed,
        actual: responseTime,
        threshold: this.thresholds.apiResponseTime,
        message: passed 
          ? `API response time is acceptable (${responseTime}ms)`
          : `API response time is too slow (${responseTime}ms > ${this.thresholds.apiResponseTime}ms)`
      };
    } catch (error) {
      return {
        passed: false,
        actual: -1,
        threshold: this.thresholds.apiResponseTime,
        message: `API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate dashboard load time (simulated)
   */
  private async validateDashboardLoadTime(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    try {
      const db = getDatabase();
      const startTime = performance.now();
      
      // Simulate dashboard queries (multiple parallel queries)
      const queries = [
        // Occupancy stats
        db.query(`
          SELECT 
            SUM(vagas_previstas) as total_previstas,
            SUM(vagas_efetivas) as total_efetivas
          FROM quadro_lotacao 
          WHERE ativo = true
        `),
        // Recent activities (audit logs)
        db.query(`
          SELECT * FROM audit_logs 
          ORDER BY timestamp DESC 
          LIMIT 10
        `),
        // PcD compliance (colaboradores)
        db.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN pcd = true THEN 1 END) as pcd_count
          FROM colaboradores 
          WHERE status = 'ativo'
        `)
      ];
      
      await Promise.all(queries);
      
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      
      const passed = loadTime <= this.thresholds.dashboardLoadTime;
      
      return {
        passed,
        actual: loadTime,
        threshold: this.thresholds.dashboardLoadTime,
        message: passed 
          ? `Dashboard load time is acceptable (${loadTime}ms)`
          : `Dashboard load time is too slow (${loadTime}ms > ${this.thresholds.dashboardLoadTime}ms)`
      };
    } catch (error) {
      return {
        passed: false,
        actual: -1,
        threshold: this.thresholds.dashboardLoadTime,
        message: `Dashboard validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate cache hit rate
   */
  private async validateCacheHitRate(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    try {
      const redis = getRedisClient();
      
      // Get Redis stats
      const info = await redis.info('stats');
      const stats = this.parseRedisInfo(info);
      
      const hits = parseInt(stats.keyspace_hits) || 0;
      const misses = parseInt(stats.keyspace_misses) || 0;
      const total = hits + misses;
      
      const hitRate = total > 0 ? (hits / total) * 100 : 0;
      const passed = hitRate >= this.thresholds.cacheHitRate;
      
      return {
        passed,
        actual: Math.round(hitRate * 100) / 100,
        threshold: this.thresholds.cacheHitRate,
        message: passed 
          ? `Cache hit rate is acceptable (${hitRate.toFixed(1)}%)`
          : `Cache hit rate is too low (${hitRate.toFixed(1)}% < ${this.thresholds.cacheHitRate}%)`
      };
    } catch (error) {
      return {
        passed: false,
        actual: -1,
        threshold: this.thresholds.cacheHitRate,
        message: `Cache validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate memory usage
   */
  private async validateMemoryUsage(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    const memoryUsage = process.memoryUsage();
    const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const passed = usagePercent <= this.thresholds.memoryUsage;
    
    return {
      passed,
      actual: Math.round(usagePercent * 100) / 100,
      threshold: this.thresholds.memoryUsage,
      message: passed 
        ? `Memory usage is acceptable (${usagePercent.toFixed(1)}%)`
        : `Memory usage is too high (${usagePercent.toFixed(1)}% > ${this.thresholds.memoryUsage}%)`
    };
  }

  /**
   * Validate database connections
   */
  private async validateDatabaseConnections(): Promise<{
    passed: boolean;
    actual: number;
    threshold: number;
    message: string;
  }> {
    try {
      const db = getDatabase();
      
      // Get current connection count
      const result = await db.query(`
        SELECT count(*) as connection_count 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      const currentConnections = parseInt(result.rows[0].connection_count) || 0;
      const maxConnections = 100; // This should come from config
      const usagePercent = (currentConnections / maxConnections) * 100;
      const passed = usagePercent <= this.thresholds.databaseConnections;
      
      return {
        passed,
        actual: Math.round(usagePercent * 100) / 100,
        threshold: this.thresholds.databaseConnections,
        message: passed 
          ? `Database connection usage is acceptable (${usagePercent.toFixed(1)}%)`
          : `Database connection usage is too high (${usagePercent.toFixed(1)}% > ${this.thresholds.databaseConnections}%)`
      };
    } catch (error) {
      return {
        passed: false,
        actual: -1,
        threshold: this.thresholds.databaseConnections,
        message: `Database connection validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: any): string[] {
    const recommendations: string[] = [];

    if (!results.databaseResponseTime.passed) {
      recommendations.push('Consider adding database indexes for frequently queried columns');
      recommendations.push('Review and optimize slow database queries');
      recommendations.push('Consider database connection pooling optimization');
    }

    if (!results.apiResponseTime.passed) {
      recommendations.push('Implement response caching for frequently accessed endpoints');
      recommendations.push('Optimize database queries in API endpoints');
      recommendations.push('Consider implementing pagination for large result sets');
    }

    if (!results.dashboardLoadTime.passed) {
      recommendations.push('Implement dashboard data caching with appropriate TTL');
      recommendations.push('Consider lazy loading for dashboard components');
      recommendations.push('Optimize dashboard queries with proper indexes');
    }

    if (!results.cacheHitRate.passed) {
      recommendations.push('Review cache TTL settings and increase where appropriate');
      recommendations.push('Implement cache warming for frequently accessed data');
      recommendations.push('Review cache invalidation strategy to avoid unnecessary cache misses');
    }

    if (!results.memoryUsage.passed) {
      recommendations.push('Review memory leaks in application code');
      recommendations.push('Optimize object creation and garbage collection');
      recommendations.push('Consider increasing available memory or implementing memory limits');
    }

    if (!results.databaseConnections.passed) {
      recommendations.push('Optimize database connection pool settings');
      recommendations.push('Review long-running database transactions');
      recommendations.push('Consider implementing connection pooling with pgbouncer');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance metrics are within acceptable thresholds');
      recommendations.push('Continue monitoring performance metrics regularly');
      recommendations.push('Consider implementing automated performance testing in CI/CD pipeline');
    }

    return recommendations;
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
   * Run continuous performance monitoring
   */
  startContinuousMonitoring(intervalMs: number = 300000): void { // 5 minutes default
    console.log(`Starting continuous performance monitoring (interval: ${intervalMs}ms)`);
    
    setInterval(async () => {
      try {
        const result = await this.validatePerformance();
        
        if (!result.passed) {
          console.warn('Performance validation failed:', {
            score: result.summary.overallScore,
            failedTests: result.summary.failedTests,
            recommendations: result.recommendations.slice(0, 3) // Top 3 recommendations
          });
        } else {
          console.log(`Performance validation passed (Score: ${result.summary.overallScore}%)`);
        }
      } catch (error) {
        console.error('Error during continuous performance monitoring:', error);
      }
    }, intervalMs);
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<string> {
    const result = await this.validatePerformance();
    
    let report = '# Performance Validation Report\n\n';
    report += `**Overall Score:** ${result.summary.overallScore}% (${result.summary.passedTests}/${result.summary.totalTests} tests passed)\n\n`;
    
    report += '## Test Results\n\n';
    
    for (const [testName, testResult] of Object.entries(result.results)) {
      const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
      report += `### ${testName}\n`;
      report += `- **Status:** ${status}\n`;
      report += `- **Actual:** ${testResult.actual}${testName.includes('Time') ? 'ms' : testName.includes('Rate') || testName.includes('Usage') || testName.includes('Connections') ? '%' : ''}\n`;
      report += `- **Threshold:** ${testResult.threshold}${testName.includes('Time') ? 'ms' : testName.includes('Rate') || testName.includes('Usage') || testName.includes('Connections') ? '%' : ''}\n`;
      report += `- **Message:** ${testResult.message}\n\n`;
    }
    
    report += '## Recommendations\n\n';
    for (const recommendation of result.recommendations) {
      report += `- ${recommendation}\n`;
    }
    
    report += '\n---\n';
    report += `*Report generated on ${new Date().toISOString()}*\n`;
    
    return report;
  }
}

// Export singleton instance
export const performanceValidator = new PerformanceValidator();