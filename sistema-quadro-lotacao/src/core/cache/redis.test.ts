import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock redis module
const mockRedisClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  setEx: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue('{"test":"data"}'),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(true),
  ttl: vi.fn().mockResolvedValue(3600),
  flushDb: vi.fn().mockResolvedValue('OK'),
  info: vi.fn().mockResolvedValue('used_memory:1024\nused_memory_human:1K'),
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue('OK'),
};

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

describe('Redis Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize Redis client', async () => {
    const { initializeRedis } = await import('./redis.js');
    
    const client = await initializeRedis();
    expect(client).toBeDefined();
    expect(mockRedisClient.connect).toHaveBeenCalled();
  });

  it('should set and get cache values', async () => {
    const { CacheService } = await import('./redis.js');
    
    const cache = new CacheService(mockRedisClient as any);
    
    // Test set
    await cache.set('test-key', { test: 'data' }, 3600);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 3600, '{"test":"data"}');
    
    // Test get
    const result = await cache.get('test-key');
    expect(result).toEqual({ test: 'data' });
    expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
  });

  it('should delete cache values', async () => {
    const { CacheService } = await import('./redis.js');
    
    const cache = new CacheService(mockRedisClient as any);
    
    const deleted = await cache.delete('test-key');
    expect(deleted).toBe(true);
    expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
  });

  it('should check if key exists', async () => {
    const { CacheService } = await import('./redis.js');
    
    const cache = new CacheService(mockRedisClient as any);
    
    const exists = await cache.exists('test-key');
    expect(exists).toBe(true);
    expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
  });

  it('should manage sessions', async () => {
    const { SessionService } = await import('./redis.js');
    
    const sessionService = new SessionService();
    
    // Create session
    await sessionService.createSession('session-123', { userId: 'user-1' });
    
    // Get session
    mockRedisClient.get.mockResolvedValueOnce('{"userId":"user-1"}');
    const session = await sessionService.getSession('session-123');
    expect(session).toEqual({ userId: 'user-1' });
  });

  it('should test Redis connection', async () => {
    const { testRedisConnection } = await import('./redis.js');
    
    const isConnected = await testRedisConnection();
    expect(isConnected).toBe(true);
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });
});