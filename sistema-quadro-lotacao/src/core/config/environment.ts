import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const environmentSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_NAME: z.string().default('sistema_quadro_lotacao'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_SSL: z.coerce.boolean().default(false),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TTL: z.coerce.number().default(3600),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000/api'),

  // Senior Platform APIs
  PLATFORM_AUTH_URL: z.string().url().default('https://api.senior.com.br/auth'),
  PLATFORM_AUTHZ_URL: z.string().url().default('https://api.senior.com.br/authorization'),
  PLATFORM_NOTIFICATIONS_URL: z.string().url().default('https://api.senior.com.br/notifications'),
  PLATFORM_CLIENT_ID: z.string().default('QUADRO_VAGAS_APP'),
  PLATFORM_CLIENT_SECRET: z.string().min(1, 'Platform client secret is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // RH Legado Integration
  RH_LEGADO_WEBHOOK_SECRET: z.string().min(1, 'RH Legado webhook secret is required'),
  RH_LEGADO_API_URL: z.string().url().default('https://api.rhlegado.com.br'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

// Validate and export environment configuration
export const env = environmentSchema.parse(process.env);

// Database connection configuration
export const databaseConfig = {
  connectionString: env.DATABASE_URL || `postgresql://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`,
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  ssl: env.DATABASE_SSL,
  pool: {
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
  },
};

// Redis connection configuration
export const redisConfig = {
  url: env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  ttl: env.REDIS_TTL,
};

// Platform APIs configuration
export const platformConfig = {
  auth: {
    url: env.PLATFORM_AUTH_URL,
    clientId: env.PLATFORM_CLIENT_ID,
    clientSecret: env.PLATFORM_CLIENT_SECRET,
  },
  authorization: {
    url: env.PLATFORM_AUTHZ_URL,
  },
  notifications: {
    url: env.PLATFORM_NOTIFICATIONS_URL,
  },
};

// JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

// Application configuration
export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiBaseUrl: env.API_BASE_URL,
  corsOrigin: env.CORS_ORIGIN,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
};

// RH Legado configuration
export const rhLegadoConfig = {
  webhookSecret: env.RH_LEGADO_WEBHOOK_SECRET,
  apiUrl: env.RH_LEGADO_API_URL,
};

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  format: env.LOG_FORMAT,
};

// Environment helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isStaging = env.NODE_ENV === 'staging';