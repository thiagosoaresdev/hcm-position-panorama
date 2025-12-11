import { createClient, RedisClientType } from 'redis';
import { redisConfig, loggingConfig } from '../config/environment.js';

// Redis client instance
let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: redisConfig.url,
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 50, 1000);
      },
    },
    password: redisConfig.password,
    database: redisConfig.db,
  });

  // Handle Redis events
  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  redisClient.on('connect', () => {
    if (loggingConfig.level === 'debug') {
      console.log('Redis client connected');
    }
  });

  redisClient.on('ready', () => {
    console.log('Redis client ready');
  });

  redisClient.on('end', () => {
    console.log('Redis client disconnected');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis client reconnecting');
  });

  // Connect to Redis
  await redisClient.connect();

  return redisClient;
}

/**
 * Get Redis client
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Cache service with automatic serialization
 */
export class CacheService {
  private client: RedisClientType;
  private defaultTTL: number;

  constructor(client?: RedisClientType, defaultTTL?: number) {
    this.client = client || getRedisClient();
    this.defaultTTL = defaultTTL || redisConfig.ttl;
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = ttlSeconds || this.defaultTTL;
      
      await this.client.setEx(key, ttl, serializedValue);
      
      if (loggingConfig.level === 'debug') {
        console.log('Cache SET', { key, ttl });
      }
    } catch (error) {
      console.error('Cache SET error', {
        key,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        if (loggingConfig.level === 'debug') {
          console.log('Cache MISS', { key });
        }
        return null;
      }

      if (loggingConfig.level === 'debug') {
        console.log('Cache HIT', { key });
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache GET error', {
        key,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      
      if (loggingConfig.level === 'debug') {
        console.log('Cache DELETE', { key, deleted: result > 0 });
      }
      
      return result > 0;
    } catch (error) {
      console.error('Cache DELETE error', {
        key,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache EXISTS error', {
        key,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error('Cache EXPIRE error', {
        key,
        ttlSeconds,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Cache TTL error', {
        key,
        error: error instanceof Error ? error.message : error,
      });
      return -1;
    }
  }

  /**
   * Clear all cache entries (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache CLEAR error', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, string>> {
    try {
      const info = await this.client.info('memory');
      return this.parseRedisInfo(info);
    } catch (error) {
      console.error('Cache STATS error', {
        error: error instanceof Error ? error.message : error,
      });
      return {};
    }
  }

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
}

/**
 * Session management using Redis
 */
export class SessionService {
  private cache: CacheService;
  private sessionTTL: number;

  constructor(cache?: CacheService, sessionTTL?: number) {
    this.cache = cache || new CacheService();
    this.sessionTTL = sessionTTL || 3600; // 1 hour default
  }

  /**
   * Create a new session
   */
  async createSession<T>(sessionId: string, data: T): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.set(key, data, this.sessionTTL);
  }

  /**
   * Get session data
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.get<T>(key);
  }

  /**
   * Update session data
   */
  async updateSession<T>(sessionId: string, data: T): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.set(key, data, this.sessionTTL);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.delete(key);
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.expire(key, this.sessionTTL);
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    console.log('Redis connection successful');
    return true;
  } catch (error) {
    console.error('Redis connection failed', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}

// Export default cache service instance
export const cacheService = new CacheService();
export const sessionService = new SessionService();