import { Router, Response, NextFunction, Request } from 'express';
import { DatabaseKeyManagementService } from '../services/databaseKeyManagementService';
import { RoutingService } from '../services/routingService';
import { AuthenticatedRequest } from '../middleware/authentication';

const router = Router();

// Get user analytics overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const keys = await DatabaseKeyManagementService.listKeys(userId);

    const analytics = {
      totalKeys: keys.length,
      activeKeys: keys.filter((k: any) => k.status === 'active').length,
      totalUsage: keys.reduce((sum: number, k: any) => sum + (k.usageCount || 0), 0),
      dailyUsage: keys.reduce((sum: number, k: any) => sum + (k.dailyUsage || 0), 0),
      monthlyUsage: keys.reduce((sum: number, k: any) => sum + (k.monthlyUsage || 0), 0),
      keysByTier: {
        free: keys.filter((k: any) => k.tier === 'free').length,
        paid: keys.filter((k: any) => k.tier === 'paid').length,
        premium: keys.filter((k: any) => k.tier === 'premium').length
      },
      keysByService: keys.reduce((acc: any, k: any) => {
        acc[k.serviceName] = (acc[k.serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      quotaUtilization: keys.map((k: any) => ({
        keyId: k.id,
        service: k.serviceName,
        used: k.quotaUsed || 0,
        limit: k.quota,
        percentage: Math.round(((k.quotaUsed || 0) / k.quota) * 100)
      }))
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Get service health status
router.get('/health', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const services = RoutingService.listServices();
    const healthChecks = await Promise.all(
      services.map(service => require('../services/proxyService').ProxyService.checkServiceHealth(service.name))
    );

    res.json({
      services: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get usage statistics
router.get('/usage', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = '30d', service } = req.query;
    const userId = req.user!.id;
    
    let keys = await DatabaseKeyManagementService.listKeys(userId);
    
    if (service) {
      keys = keys.filter((k: any) => k.serviceName === service);
    }

    const usage = {
      period: period as string,
      service: service as string || 'all',
      totalRequests: keys.reduce((sum: number, k: any) => sum + (k.usageCount || 0), 0),
      totalCost: keys.reduce((sum: number, k: any) => sum + (k.quotaUsed || 0), 0),
      keyBreakdown: keys.map((k: any) => ({
        keyId: k.id,
        service: k.serviceName,
        tier: k.tier,
        requests: k.usageCount,
        cost: k.metadata.quotaUsed || 0,
        lastUsed: k.lastUsed
      }))
    };

    res.json(usage);
  } catch (error) {
    next(error);
  }
});

export default router;
