import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from '../../src/middleware/errorHandler';
import { rateLimiter } from '../../src/middleware/rateLimiter';
import { authentication } from '../../src/middleware/authentication';
import authRoutes from '../../src/routes/authRoutes';
import keyRoutes from '../../src/routes/keyRoutes';
import proxyRoutes from '../../src/routes/proxyRoutes';
import analyticsRoutes from '../../src/routes/analyticsRoutes';
import monitoringRoutes from '../../src/routes/monitoringRoutes';
import { Logger } from '../../src/utils/logger';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'API Key Wallet',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        profile: 'GET /auth/profile'
      },
      keys: {
        list: 'GET /keys',
        create: 'POST /keys',
        update: 'PUT /keys/:id',
        delete: 'DELETE /keys/:id'
      },
      proxy: 'POST /proxy',
      analytics: {
        overview: 'GET /analytics/overview',
        usage: 'GET /analytics/usage'
      },
      monitoring: {
        metrics: 'GET /monitoring/metrics',
        health: 'GET /monitoring/health/detailed'
      }
    },
    documentation: 'https://github.com/satishskid/api-key-wallet'
  });
});

// Public routes (no authentication required)
app.use('/auth', authRoutes);
app.use('/monitoring', monitoringRoutes);

// Protected routes (authentication required)
app.use('/keys', authentication, keyRoutes);
app.use('/proxy', authentication, proxyRoutes);
app.use('/analytics', authentication, analyticsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'POST /auth/register',
      'POST /auth/login',
      'GET /auth/profile',
      'GET /keys',
      'POST /keys',
      'POST /proxy',
      'GET /analytics/overview',
      'GET /monitoring/metrics'
    ]
  });
});

// Export for Netlify Functions
export const handler = serverless(app);
