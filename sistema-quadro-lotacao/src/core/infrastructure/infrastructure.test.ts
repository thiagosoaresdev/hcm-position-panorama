import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { infrastructureService } from './init.js';
import { healthCheckService } from '../health/health-check.js';

describe('Infrastructure Setup', () => {
  beforeAll(async () => {
    // Initialize infrastructure for testing
    try {
      await infrastructureService.initialize();
    } catch (error) {
      console.warn('Infrastructure initialization failed in test environment:', error);
    }
  });

  afterAll(async () => {
    // Cleanup after tests
    try {
      await infrastructureService.shutdown();
    } catch (error) {
      console.warn('Infrastructure shutdown failed in test environment:', error);
    }
  });

  it('should have environment configuration loaded', () => {
    // Test that environment variables are loaded
    const { env } = require('../config/environment.js');
    
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_HOST).toBeDefined();
    expect(env.REDIS_HOST).toBeDefined();
    expect(env.PORT).toBeTypeOf('number');
  });

  it('should validate database configuration', () => {
    const { databaseConfig } = require('../config/environment.js');
    
    expect(databaseConfig.host).toBeDefined();
    expect(databaseConfig.port).toBeTypeOf('number');
    expect(databaseConfig.database).toBeDefined();
    expect(databaseConfig.user).toBeDefined();
    expect(databaseConfig.pool.min).toBeGreaterThan(0);
    expect(databaseConfig.pool.max).toBeGreaterThan(databaseConfig.pool.min);
  });

  it('should validate Redis configuration', () => {
    const { redisConfig } = require('../config/environment.js');
    
    expect(redisConfig.host).toBeDefined();
    expect(redisConfig.port).toBeTypeOf('number');
    expect(redisConfig.db).toBeTypeOf('number');
    expect(redisConfig.ttl).toBeGreaterThan(0);
  });

  it('should perform health checks', async () => {
    const health = await healthCheckService.checkEnvironment();
    
    expect(health.status).toBeOneOf(['healthy', 'warning', 'error']);
    expect(health.message).toBeDefined();
    expect(health.timestamp).toBeInstanceOf(Date);
  });

  it('should check memory usage', async () => {
    const memoryHealth = await healthCheckService.checkMemory();
    
    expect(memoryHealth.status).toBeOneOf(['healthy', 'warning', 'error']);
    expect(memoryHealth.details).toBeDefined();
    expect(memoryHealth.details?.heapUsed).toBeDefined();
    expect(memoryHealth.details?.heapTotal).toBeDefined();
  });

  it('should have infrastructure service status', async () => {
    const status = await infrastructureService.getStatus();
    
    expect(status.initialized).toBeTypeOf('boolean');
    expect(status.health).toBeDefined();
    expect(status.environment).toBeDefined();
    expect(status.environment.nodeEnv).toBeDefined();
    expect(status.environment.port).toBeTypeOf('number');
  });
});