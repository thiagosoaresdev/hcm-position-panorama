import { CacheService } from './redis.js';
import { loggingConfig } from '../config/environment.js';

/**
 * Cache strategy patterns for different data types
 */
export enum CachePattern {
  // Short-lived cache for frequently changing data
  REALTIME = 'realtime',
  // Medium-lived cache for semi-static data
  SEMI_STATIC = 'semi_static',
  // Long-lived cache for rarely changing data
  STATIC = 'static',
  // Session-based cache
  SESSION = 'session',
  // User-specific cache
  USER_SPECIFIC = 'user_specific'
}

/**
 * Cache configuration for different patterns
 */
const CACHE_CONFIGS = {
  [CachePattern.REALTIME]: { ttl: 30, prefix: 'rt' }, // 30 seconds
  [CachePattern.SEMI_STATIC]: { ttl: 300, prefix: 'ss' }, // 5 minutes
  [CachePattern.STATIC]: { ttl: 3600, prefix: 'st' }, // 1 hour
  [CachePattern.SESSION]: { ttl: 1800, prefix: 'sess' }, // 30 minutes
  [CachePattern.USER_SPECIFIC]: { ttl: 600, prefix: 'user' } // 10 minutes
};

/**
 * Enhanced caching service with intelligent strategies
 */
export class CacheStrategyService {
  private cache: CacheService;
  private hitRates: Map<string, { hits: number; misses: number }> = new Map();

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
  }

  /**
   * Generate cache key with pattern prefix
   */
  private generateKey(pattern: CachePattern, key: string, userId?: string): string {
    const config = CACHE_CONFIGS[pattern];
    const baseKey = `${config.prefix}:${key}`;
    
    if (pattern === CachePattern.USER_SPECIFIC && userId) {
      return `${baseKey}:${userId}`;
    }
    
    return baseKey;
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(key: string, hit: boolean): void {
    if (!this.hitRates.has(key)) {
      this.hitRates.set(key, { hits: 0, misses: 0 });
    }
    
    const stats = this.hitRates.get(key)!;
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
  }

  /**
   * Set value with intelligent caching strategy
   */
  async set<T>(
    pattern: CachePattern,
    key: string,
    value: T,
    userId?: string,
    customTTL?: number
  ): Promise<void> {
    const config = CACHE_CONFIGS[pattern];
    const cacheKey = this.generateKey(pattern, key, userId);
    const ttl = customTTL || config.ttl;

    try {
      await this.cache.set(cacheKey, value, ttl);
      
      if (loggingConfig.level === 'debug') {
        console.log(`Cache SET [${pattern}]`, { key: cacheKey, ttl });
      }
    } catch (error) {
      console.error(`Cache SET error [${pattern}]`, { key: cacheKey, error });
      throw error;
    }
  }

  /**
   * Get value with hit rate tracking
   */
  async get<T>(
    pattern: CachePattern,
    key: string,
    userId?: string
  ): Promise<T | null> {
    const cacheKey = this.generateKey(pattern, key, userId);

    try {
      const value = await this.cache.get<T>(cacheKey);
      const hit = value !== null;
      
      this.updateHitRate(cacheKey, hit);
      
      if (loggingConfig.level === 'debug') {
        console.log(`Cache ${hit ? 'HIT' : 'MISS'} [${pattern}]`, { key: cacheKey });
      }
      
      return value;
    } catch (error) {
      console.error(`Cache GET error [${pattern}]`, { key: cacheKey, error });
      this.updateHitRate(cacheKey, false);
      return null;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    pattern: CachePattern,
    key: string,
    fetchFunction: () => Promise<T>,
    userId?: string,
    customTTL?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(pattern, key, userId);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fetchFunction();
      await this.set(pattern, key, result, userId, customTTL);
      return result;
    } catch (error) {
      console.error(`Cache getOrSet error [${pattern}]`, { key, error });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: CachePattern, keyPattern: string): Promise<void> {
    const config = CACHE_CONFIGS[pattern];
    const searchPattern = `${config.prefix}:${keyPattern}*`;
    
    try {
      // This would require Redis SCAN command implementation
      // For now, we'll implement a simple approach
      console.log(`Cache invalidation requested for pattern: ${searchPattern}`);
      
      // In a real implementation, you would:
      // 1. Use Redis SCAN to find matching keys
      // 2. Delete all matching keys
      // 3. Update hit rate statistics
      
    } catch (error) {
      console.error(`Cache invalidation error [${pattern}]`, { keyPattern, error });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    hitRates: Record<string, { hitRate: number; totalRequests: number }>;
    cacheStats: Record<string, string>;
  }> {
    const hitRates: Record<string, { hitRate: number; totalRequests: number }> = {};
    
    for (const [key, stats] of this.hitRates.entries()) {
      const totalRequests = stats.hits + stats.misses;
      const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;
      
      hitRates[key] = {
        hitRate: Math.round(hitRate * 100) / 100,
        totalRequests
      };
    }

    const cacheStats = await this.cache.getStats();

    return { hitRates, cacheStats };
  }

  /**
   * Clear all cache entries (use with caution)
   */
  async clearAll(): Promise<void> {
    await this.cache.clear();
    this.hitRates.clear();
    console.log('All cache entries cleared');
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(warmUpData: Array<{
    pattern: CachePattern;
    key: string;
    fetchFunction: () => Promise<any>;
    userId?: string;
  }>): Promise<void> {
    console.log(`Starting cache warm-up for ${warmUpData.length} entries`);
    
    const promises = warmUpData.map(async ({ pattern, key, fetchFunction, userId }) => {
      try {
        const data = await fetchFunction();
        await this.set(pattern, key, data, userId);
        console.log(`Cache warmed up: ${pattern}:${key}`);
      } catch (error) {
        console.error(`Cache warm-up failed for ${pattern}:${key}`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warm-up completed');
  }
}

/**
 * Specific cache strategies for different domain entities
 */
export class DomainCacheStrategies {
  constructor(private cacheStrategy: CacheStrategyService) {}

  // Dashboard KPIs - Real-time data with short TTL
  async getDashboardKPIs(filters: any, userId: string): Promise<any> {
    const key = `dashboard:kpis:${JSON.stringify(filters)}`;
    return this.cacheStrategy.getOrSet(
      CachePattern.REALTIME,
      key,
      async () => {
        // This would call the actual dashboard service
        throw new Error('Dashboard service not implemented in cache layer');
      },
      userId
    );
  }

  // Quadro Lotação data - Semi-static with medium TTL
  async getQuadroLotacao(planoVagasId: string, filters: any): Promise<any> {
    const key = `quadro:${planoVagasId}:${JSON.stringify(filters)}`;
    return this.cacheStrategy.getOrSet(
      CachePattern.SEMI_STATIC,
      key,
      async () => {
        // This would call the actual quadro service
        throw new Error('Quadro service not implemented in cache layer');
      }
    );
  }

  // Master data - Static with long TTL
  async getMasterData(type: 'empresas' | 'cargos' | 'centros_custo'): Promise<any> {
    const key = `master:${type}`;
    return this.cacheStrategy.getOrSet(
      CachePattern.STATIC,
      key,
      async () => {
        // This would call the actual repository
        throw new Error('Repository not implemented in cache layer');
      }
    );
  }

  // User permissions - User-specific cache
  async getUserPermissions(userId: string, resource: string): Promise<any> {
    const key = `permissions:${resource}`;
    return this.cacheStrategy.getOrSet(
      CachePattern.USER_SPECIFIC,
      key,
      async () => {
        // This would call the authorization service
        throw new Error('Authorization service not implemented in cache layer');
      },
      userId
    );
  }

  // Analytics reports - Semi-static with custom TTL based on complexity
  async getAnalyticsReport(reportType: string, filters: any): Promise<any> {
    const key = `analytics:${reportType}:${JSON.stringify(filters)}`;
    const customTTL = this.getAnalyticsTTL(reportType);
    
    return this.cacheStrategy.getOrSet(
      CachePattern.SEMI_STATIC,
      key,
      async () => {
        // This would call the analytics service
        throw new Error('Analytics service not implemented in cache layer');
      },
      undefined,
      customTTL
    );
  }

  private getAnalyticsTTL(reportType: string): number {
    // Complex reports get longer TTL
    const ttlMap: Record<string, number> = {
      'occupancy': 300,      // 5 minutes
      'pcd_compliance': 600, // 10 minutes
      'trends': 900,         // 15 minutes
      'comparative': 1800    // 30 minutes
    };
    
    return ttlMap[reportType] || 300;
  }

  // Invalidation methods for different domains
  async invalidateDashboard(userId?: string): Promise<void> {
    await this.cacheStrategy.invalidatePattern(CachePattern.REALTIME, 'dashboard');
    if (userId) {
      await this.cacheStrategy.invalidatePattern(CachePattern.USER_SPECIFIC, `dashboard:${userId}`);
    }
  }

  async invalidateQuadro(planoVagasId?: string): Promise<void> {
    const pattern = planoVagasId ? `quadro:${planoVagasId}` : 'quadro';
    await this.cacheStrategy.invalidatePattern(CachePattern.SEMI_STATIC, pattern);
  }

  async invalidateMasterData(type?: string): Promise<void> {
    const pattern = type ? `master:${type}` : 'master';
    await this.cacheStrategy.invalidatePattern(CachePattern.STATIC, pattern);
  }

  async invalidateUserData(userId: string): Promise<void> {
    await this.cacheStrategy.invalidatePattern(CachePattern.USER_SPECIFIC, `*:${userId}`);
  }
}

// Export singleton instances
export const cacheStrategyService = new CacheStrategyService();
export const domainCacheStrategies = new DomainCacheStrategies(cacheStrategyService);

/**
 * Cache warming configuration for application startup
 */
export const CACHE_WARMUP_CONFIG = [
  {
    pattern: CachePattern.STATIC,
    key: 'master:empresas',
    fetchFunction: async () => {
      // Would fetch all active companies
      return [];
    }
  },
  {
    pattern: CachePattern.STATIC,
    key: 'master:cargos',
    fetchFunction: async () => {
      // Would fetch all active positions
      return [];
    }
  },
  {
    pattern: CachePattern.STATIC,
    key: 'master:centros_custo',
    fetchFunction: async () => {
      // Would fetch all active cost centers
      return [];
    }
  }
];