import { Router, Response, NextFunction } from 'express';
import { DatabaseKeyManagementService } from '../services/databaseKeyManagementService';
import { RoutingService } from '../services/routingService';
import { ServiceType, KeyTier, KeyStatus } from '../models/types';
import { AuthenticatedRequest } from '../middleware/authentication';
import { Logger } from '../utils/logger';

const router = Router();

// Register a new API key
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key, service, tier = KeyTier.FREE, metadata = {} } = req.body;

    if (!key || !service) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Key and service are required'
      });
      return;
    }

    const detectedService = RoutingService.detectService(key);
    const finalService = detectedService || service;

    const keyMetadata = {
      type: metadata.type || ServiceType.OTHER,
      service: finalService,
      quota: metadata.quota || 1000,
      quotaPeriod: metadata.quotaPeriod || 'monthly',
      ...metadata
    };

    const apiKey = await DatabaseKeyManagementService.registerKey(
      req.user!.id,
      key,
      keyMetadata,
      tier
    );

    res.status(201).json({
      message: 'API key registered successfully',
      key: apiKey
    });
  } catch (error) {
    next(error);
  }
});

// List user's API keys
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { service, tier, status, type } = req.query;

    const filters: any = {};
    if (service) filters.service = service as string;
    if (tier) filters.tier = tier as KeyTier;
    if (status) filters.status = status as KeyStatus;
    if (type) filters.type = type as ServiceType;

    const keys = await DatabaseKeyManagementService.listKeys(req.user!.id, filters);

    res.json({
      keys,
      total: keys.length
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific API key
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const key = await DatabaseKeyManagementService.getKey(id, req.user!.id);

    if (!key) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found'
      });
      return;
    }

    const quota = await DatabaseKeyManagementService.checkQuota(id);

    res.json({
      key,
      quota
    });
  } catch (error) {
    next(error);
  }
});

// Update an API key
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { metadata, status, tier } = req.body;

    const updates: any = {};
    if (metadata) updates.metadata = metadata;
    if (status) updates.status = status;
    if (tier) updates.tier = tier;

    const updatedKey = await DatabaseKeyManagementService.updateKey(
      id,
      req.user!.id,
      updates
    );

    if (!updatedKey) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found'
      });
      return;
    }

    res.json({
      message: 'API key updated successfully',
      key: updatedKey
    });
  } catch (error) {
    next(error);
  }
});

// Delete an API key
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await DatabaseKeyManagementService.deleteKey(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found'
      });
      return;
    }

    res.json({
      message: 'API key deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
