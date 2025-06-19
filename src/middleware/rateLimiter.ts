import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

class RateLimitStore {
  private store = new Map<string, RateLimitInfo>();

  get(key: string): RateLimitInfo | undefined {
    const info = this.store.get(key);
    if (info && Date.now() > info.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return info;
  }

  set(key: string, count: number, windowMs: number): void {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs
    });
  }

  increment(key: string, windowMs: number): number {
    const existing = this.get(key);
    if (existing) {
      existing.count++;
      return existing.count;
    } else {
      this.set(key, 1, windowMs);
      return 1;
    }
  }
}

const rateLimitStore = new RateLimitStore();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '1000');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || 'unknown';
  const currentCount = rateLimitStore.increment(key, WINDOW_MS);

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - currentCount).toString(),
    'X-RateLimit-Reset': new Date(Date.now() + WINDOW_MS).toISOString()
  });

  if (currentCount > MAX_REQUESTS) {
    Logger.warn(`Rate limit exceeded for IP: ${key}`, {
      currentCount,
      limit: MAX_REQUESTS,
      url: req.url
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
    return;
  }

  next();
};
