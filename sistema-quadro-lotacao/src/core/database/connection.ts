import { Pool, PoolClient, QueryResult } from 'pg';
import { databaseConfig, loggingConfig } from '../config/environment.js';

// Database connection pool
let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: databaseConfig.connectionString,
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: databaseConfig.database,
    user: databaseConfig.user,
    password: databaseConfig.password,
    ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
    min: databaseConfig.pool.min,
    max: databaseConfig.pool.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  // Handle pool connection events
  pool.on('connect', (client) => {
    if (loggingConfig.level === 'debug') {
      console.log('New client connected to database');
    }
  });

  pool.on('acquire', (client) => {
    if (loggingConfig.level === 'debug') {
      console.log('Client acquired from pool');
    }
  });

  pool.on('remove', (client) => {
    if (loggingConfig.level === 'debug') {
      console.log('Client removed from pool');
    }
  });

  return pool;
}

/**
 * Get database connection pool
 */
export function getDatabase(): Pool {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  const start = Date.now();
  
  try {
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (loggingConfig.level === 'debug') {
      console.log('Executed query', {
        text,
        duration,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error', {
      text,
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful', {
      currentTime: result.rows[0]?.current_time,
    });
    return true;
  } catch (error) {
    console.error('Database connection failed', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

/**
 * Get database pool statistics
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}