import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private redis: Redis;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      Logger.error('Redis connection error', error);
    });

    this.redis.on('connect', () => {
      Logger.info('Redis connected successfully');
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  get db() {
    return this.prisma;
  }

  get cache() {
    return this.redis;
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Database connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      await this.redis.quit();
      Logger.info('Database and Redis disconnected');
    } catch (error) {
      Logger.error('Error disconnecting from database', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ database: boolean; redis: boolean }> {
    try {
      const [dbHealth, redisHealth] = await Promise.allSettled([
        this.prisma.$queryRaw`SELECT 1`,
        this.redis.ping(),
      ]);

      return {
        database: dbHealth.status === 'fulfilled',
        redis: redisHealth.status === 'fulfilled' && redisHealth.value === 'PONG',
      };
    } catch (error) {
      Logger.error('Health check failed', error);
      return { database: false, redis: false };
    }
  }

  // Cache utilities
  async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      Logger.warn('Cache get failed', { key, error });
      return null;
    }
  }

  async cacheSet(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      Logger.warn('Cache set failed', { key, error });
    }
  }

  async cacheDel(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      Logger.warn('Cache delete failed', { key, error });
    }
  }

  async cacheIncr(key: string, ttlSeconds: number = 3600): Promise<number> {
    try {
      const result = await this.redis.incr(key);
      if (result === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      Logger.warn('Cache increment failed', { key, error });
      return 0;
    }
  }
}

export const db = DatabaseService.getInstance();
export default DatabaseService;
