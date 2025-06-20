import express, { Response } from 'express';
import { authentication, AuthenticatedRequest } from '../middleware/authentication';
import { CostTrackingService } from '../services/costTrackingService';
import { db } from '../services/databaseService';
import { Logger } from '../utils/logger';

const router = express.Router();

/**
 * Beta Testing Routes for cost validation and feedback collection
 */

// Submit beta feedback
router.post('/feedback', authentication, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { feature, rating, feedback, costSavings } = req.body;
    const userId = req.user!.id;

    if (!feature || !rating) {
      res.status(400).json({
        error: 'Missing required fields: feature and rating'
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
      return;
    }

    const betaFeedback = await db.db.betaFeedback.create({
      data: {
        userId,
        feature,
        rating,
        feedback: feedback || null,
        costSavings: costSavings ? parseFloat(costSavings) : null,
      }
    });

    Logger.info('Beta feedback submitted', {
      userId,
      feature,
      rating,
      feedbackId: betaFeedback.id
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: betaFeedback.id
    });

  } catch (error) {
    Logger.error('Failed to submit beta feedback', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: (error as Error).message
    });
  }
});

// Get user's cost savings report
router.get('/savings-report', authentication, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const periodDays = parseInt(req.query.days as string) || 30;

    if (periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        error: 'Period must be between 1 and 365 days'
      });
    }

    const savingsReport = await CostTrackingService.calculateSavings(userId, periodDays);

    res.json({
      success: true,
      data: savingsReport
    });

  } catch (error) {
    Logger.error('Failed to generate savings report', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to generate savings report',
      message: (error as Error).message
    });
  }
});

// Get cost optimization suggestions
router.get('/optimization-suggestions', authentication, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const suggestions = await CostTrackingService.generateOptimizationSuggestions(userId);

    res.json({
      success: true,
      data: {
        suggestions,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.error('Failed to generate optimization suggestions', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: (error as Error).message
    });
  }
});

// Get cost trends for dashboard
router.get('/cost-trends', authentication, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: 'Days parameter must be between 1 and 365'
      });
    }

    const trends = await CostTrackingService.getCostTrends(userId, days);

    res.json({
      success: true,
      data: {
        trends,
        period: `${days} days`,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.error('Failed to get cost trends', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to get cost trends',
      message: (error as Error).message
    });
  }
});

// Beta program statistics (admin only)
router.get('/beta-stats', authentication, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    // Get beta program statistics
    const [
      totalBetaUsers,
      totalFeedback,
      avgRating,
      totalCostSavings,
      recentFeedback
    ] = await Promise.all([
      db.db.user.count({ where: { subscription: 'FREE' } }), // Assuming beta users are on free tier
      db.db.betaFeedback.count(),
      db.db.betaFeedback.aggregate({
        _avg: {
          rating: true
        }
      }),
      db.db.betaFeedback.aggregate({
        _sum: {
          costSavings: true
        }
      }),
      db.db.betaFeedback.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, name: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        betaStats: {
          totalUsers: totalBetaUsers,
          totalFeedback: totalFeedback,
          averageRating: avgRating._avg.rating || 0,
          totalReportedSavings: totalCostSavings._sum.costSavings || 0,
        },
        recentFeedback: recentFeedback.map(f => ({
          id: f.id,
          feature: f.feature,
          rating: f.rating,
          feedback: f.feedback,
          costSavings: f.costSavings,
          user: f.user.email,
          createdAt: f.createdAt
        }))
      }
    });

  } catch (error) {
    Logger.error('Failed to get beta stats', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to get beta statistics',
      message: (error as Error).message
    });
  }
});

// Manually track cost (for testing/demo purposes)
router.post('/track-cost', authentication, async (req: AuthenticatedRequest, res) => {
  try {
    const { service, requests, estimatedCost, usedFreeTier } = req.body;
    const userId = req.user!.id;

    if (!service || !requests || estimatedCost === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: service, requests, estimatedCost'
      });
    }

    await CostTrackingService.trackCostData(
      userId,
      service,
      parseInt(requests),
      parseFloat(estimatedCost),
      Boolean(usedFreeTier)
    );

    res.json({
      success: true,
      message: 'Cost data tracked successfully'
    });

  } catch (error) {
    Logger.error('Failed to track cost data', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to track cost data',
      message: (error as Error).message
    });
  }
});

export default router;
