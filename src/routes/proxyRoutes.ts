import { Router, Response, NextFunction } from 'express';
import { ProxyService } from '../services/proxyService';
import { AuthenticatedRequest } from '../middleware/authentication';

const router = Router();

// Proxy API requests
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const proxyRequest = {
      method: req.method,
      endpoint: req.path,
      headers: req.headers as Record<string, string>,
      body: req.body,
      query: req.query as Record<string, string>,
      serviceHint: req.headers['x-service-hint'] as string
    };

    const response = await ProxyService.executeRequest(req.user!.id, proxyRequest);

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.set(key, value);
    });

    // Add custom headers
    res.set({
      'X-API-Wallet-Service': response.service,
      'X-API-Wallet-Key': response.keyUsed,
      'X-API-Wallet-Cost': response.cost.toString(),
      'X-API-Wallet-Tier': response.tier,
      'X-API-Wallet-Response-Time': response.responseTime.toString()
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
