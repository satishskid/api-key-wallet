import { Router, Request, Response } from 'express';
import { monitoring } from '../services/monitoringService';
import { db } from '../services/databaseService';

const router = Router();

// Prometheus metrics endpoint
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await monitoring.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// JSON metrics for dashboard
router.get('/metrics/json', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await monitoring.getMetricsJson();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Error collecting metrics' });
  }
});

// Health check with detailed status
router.get('/health/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await db.healthCheck();
    const status = health.database && health.redis ? 'healthy' : 'unhealthy';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: health.database ? 'healthy' : 'unhealthy',
        redis: health.redis ? 'healthy' : 'unhealthy',
        memory: {
          used: process.memoryUsage(),
          uptime: process.uptime(),
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
