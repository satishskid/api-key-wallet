import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authentication';
import { Logger } from '../utils/logger';
import { monitoring } from '../services/monitoringService';

const router = Router();

// GET /analytics/overview - Get usage overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    Logger.info('Analytics overview requested', { userId: req.user?.id });

    // Simplified analytics for demonstration
    const analytics = {
      totalKeys: 1,
      activeKeys: 1,
      totalUsage: 0,
      dailyUsage: 0,
      monthlyUsage: 0,
      keysByTier: {
        free: 1,
        paid: 0,
        premium: 0
      },
      keysByService: {
        demo: 1
      },
      quotaUtilization: [
        {
          keyId: 'key_demo_001',
          service: 'demo',
          used: 0,
          limit: 1000,
          percentage: 0
        }
      ]
    };

    monitoring.requestsTotal.inc({ method: 'GET', route: '/analytics/overview', status_code: '200', service: 'analytics' });

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

export default router;
