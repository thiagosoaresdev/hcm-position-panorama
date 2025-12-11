import { initializeDatabase, testConnection as testDatabaseConnection } from '../database/connection.js';
import { initializeRedis, testRedisConnection } from '../cache/redis.js';
import { migrator } from '../database/migrator.js';
import { seeder } from '../database/seeder.js';
import { healthCheckService } from '../health/health-check.js';
import { env, isDevelopment } from '../config/environment.js';

/**
 * Infrastructure initialization service
 */
export class InfrastructureService {
  private initialized = false;

  /**
   * Initialize all infrastructure components
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Infrastructure already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing infrastructure...');

      // Step 1: Initialize database
      console.log('📦 Initializing database connection...');
      initializeDatabase();
      
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }
      console.log('✅ Database connection established');

      // Step 2: Run migrations
      console.log('🔄 Running database migrations...');
      await migrator.migrate();
      console.log('✅ Database migrations completed');

      // Step 3: Initialize Redis
      console.log('🔴 Initializing Redis connection...');
      await initializeRedis();
      
      const redisConnected = await testRedisConnection();
      if (!redisConnected) {
        throw new Error('Redis connection failed');
      }
      console.log('✅ Redis connection established');

      // Step 4: Seed data in development
      if (isDevelopment) {
        console.log('🌱 Seeding development data...');
        const stats = await seeder.getStats();
        const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
        
        if (totalRecords === 0) {
          await seeder.seed();
          console.log('✅ Development data seeded');
        } else {
          console.log('ℹ️  Development data already exists, skipping seed');
        }
      }

      // Step 5: Health check
      console.log('🏥 Performing initial health check...');
      const health = await healthCheckService.checkSystemHealth();
      
      if (health.overall.status === 'error') {
        throw new Error(`Health check failed: ${health.overall.message}`);
      }
      
      if (health.overall.status === 'warning') {
        console.log(`⚠️  Health check warnings: ${health.overall.message}`);
      } else {
        console.log('✅ All systems healthy');
      }

      this.initialized = true;
      console.log('🎉 Infrastructure initialization completed successfully');

      // Log configuration summary
      this.logConfigurationSummary();

    } catch (error) {
      console.error('❌ Infrastructure initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if infrastructure is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get infrastructure status
   */
  async getStatus() {
    return {
      initialized: this.initialized,
      health: await healthCheckService.checkSystemHealth(),
      environment: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        logLevel: env.LOG_LEVEL,
      },
    };
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Port: ${env.PORT}`);
    console.log(`   Database: ${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`);
    console.log(`   Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`);
    console.log(`   Log Level: ${env.LOG_LEVEL}`);
    console.log(`   Platform Auth: ${env.PLATFORM_AUTH_URL}`);
    console.log(`   Platform Authz: ${env.PLATFORM_AUTHZ_URL}`);
    console.log(`   Platform Notifications: ${env.PLATFORM_NOTIFICATIONS_URL}`);
    console.log('');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      console.log('🛑 Shutting down infrastructure...');

      // Close database connections
      const { closeDatabase } = await import('../database/connection.js');
      await closeDatabase();
      console.log('✅ Database connections closed');

      // Close Redis connections
      const { closeRedis } = await import('../cache/redis.js');
      await closeRedis();
      console.log('✅ Redis connections closed');

      this.initialized = false;
      console.log('✅ Infrastructure shutdown completed');
    } catch (error) {
      console.error('❌ Infrastructure shutdown failed:', error);
      throw error;
    }
  }
}

// Export default infrastructure service
export const infrastructureService = new InfrastructureService();

// Handle process signals for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await infrastructureService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await infrastructureService.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await infrastructureService.shutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await infrastructureService.shutdown();
  process.exit(1);
});