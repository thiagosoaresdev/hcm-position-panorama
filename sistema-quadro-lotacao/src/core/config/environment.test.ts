import { describe, it, expect } from 'vitest';

describe('Environment Configuration', () => {
  it('should load environment variables with defaults', () => {
    // Mock environment variables for testing
    const originalEnv = process.env;
    
    // Set minimal required environment
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PLATFORM_CLIENT_SECRET: 'test-secret-with-minimum-32-chars',
      JWT_SECRET: 'test-jwt-secret-with-minimum-32-characters',
      RH_LEGADO_WEBHOOK_SECRET: 'test-webhook-secret',
    };

    // Import after setting environment
    const { env, databaseConfig, redisConfig } = require('./environment.js');

    // Test basic configuration
    expect(env.NODE_ENV).toBe('test');
    expect(env.DATABASE_HOST).toBe('localhost');
    expect(env.DATABASE_PORT).toBe(5432);
    expect(env.REDIS_HOST).toBe('localhost');
    expect(env.REDIS_PORT).toBe(6379);

    // Test database configuration
    expect(databaseConfig.host).toBe('localhost');
    expect(databaseConfig.port).toBe(5432);
    expect(databaseConfig.database).toBe('sistema_quadro_lotacao');
    expect(databaseConfig.pool.min).toBe(2);
    expect(databaseConfig.pool.max).toBe(10);

    // Test Redis configuration
    expect(redisConfig.host).toBe('localhost');
    expect(redisConfig.port).toBe(6379);
    expect(redisConfig.db).toBe(0);
    expect(redisConfig.ttl).toBe(3600);

    // Restore original environment
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    const originalEnv = process.env;
    
    // Test missing required variable
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PLATFORM_CLIENT_SECRET: '', // Empty secret should fail
      JWT_SECRET: 'test-jwt-secret-with-minimum-32-characters',
      RH_LEGADO_WEBHOOK_SECRET: 'test-webhook-secret',
    };

    expect(() => {
      // This should throw due to validation
      require('./environment.js');
    }).toThrow();

    // Restore original environment
    process.env = originalEnv;
  });

  it('should provide helper functions', () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      PLATFORM_CLIENT_SECRET: 'test-secret-with-minimum-32-chars',
      JWT_SECRET: 'test-jwt-secret-with-minimum-32-characters',
      RH_LEGADO_WEBHOOK_SECRET: 'test-webhook-secret',
    };

    const { isDevelopment, isProduction, isTest } = require('./environment.js');

    expect(isDevelopment).toBe(true);
    expect(isProduction).toBe(false);
    expect(isTest).toBe(false);

    // Restore original environment
    process.env = originalEnv;
  });
});