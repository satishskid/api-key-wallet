import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from '../src/middleware/errorHandler';
import { rateLimiter } from '../src/middleware/rateLimiter';
import { authentication } from '../src/middleware/authentication';
import authRoutes from '../src/routes/authRoutes';
import keyRoutes from '../src/routes/keyRoutes.simple';
import proxyRoutes from '../src/routes/proxyRoutes.simple';
import analyticsRoutes from '../src/routes/analyticsRoutes.simple';
import monitoringRoutes from '../src/routes/monitoringRoutes';
import { Logger } from '../src/utils/logger';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware (simplified for serverless)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting
app.use(rateLimiter);

// Public routes (no authentication required)
app.use('/auth', authRoutes);
app.use('/monitoring', monitoringRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: 'vercel'
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'API Key Wallet',
    version: '1.0.0',
    description: 'Enterprise API key management and routing platform',
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/auth',
      keys: '/keys (authenticated)',
      proxy: '/proxy (authenticated)',
      analytics: '/analytics (authenticated)',
      monitoring: '/monitoring'
    },
    documentation: 'https://github.com/satishskid/api-key-wallet'
  });
});

// Protected routes (authentication required)
app.use('/keys', authentication, keyRoutes);
app.use('/proxy', authentication, proxyRoutes);
app.use('/analytics', authentication, analyticsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Export for Vercel
export default app;
