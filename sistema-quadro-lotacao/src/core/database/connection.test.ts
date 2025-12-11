import { describe, it, expect, vi } from 'vitest';

// Mock pg module
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    query: vi.fn().mockResolvedValue({ rows: [{ current_time: new Date() }], rowCount: 1 }),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    }),
    end: vi.fn().mockResolvedValue(undefined),
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
  })),
}));

describe('Database Connection', () => {
  it('should initialize database pool', async () => {
    const { initializeDatabase } = await import('./connection.js');
    
    const pool = initializeDatabase();
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  it('should execute queries', async () => {
    const { query } = await import('./connection.js');
    
    const result = await query('SELECT NOW() as current_time');
    expect(result).toBeDefined();
    expect(result.rows).toBeDefined();
  });

  it('should handle transactions', async () => {
    const { transaction } = await import('./connection.js');
    
    const result = await transaction(async (client) => {
      await client.query('BEGIN');
      return 'success';
    });
    
    expect(result).toBe('success');
  });

  it('should get pool statistics', async () => {
    const { getPoolStats } = await import('./connection.js');
    
    const stats = getPoolStats();
    expect(stats).toBeDefined();
    if (stats) {
      expect(typeof stats.totalCount).toBe('number');
      expect(typeof stats.idleCount).toBe('number');
      expect(typeof stats.waitingCount).toBe('number');
    }
  });
});