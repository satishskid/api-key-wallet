import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authentication } from './middleware/authentication';
import authRoutes from './routes/authRoutes';
import keyRoutes from './routes/keyRoutes.simple';
import proxyRoutes from './routes/proxyRoutes.simple';
import analyticsRoutes from './routes/analyticsRoutes.simple';
import monitoringRoutes from './routes/monitoringRoutes';
import { Logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6789;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:6789'],
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => Logger.info(message.trim())
  }
}));

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
    version: process.env.npm_package_version || '1.0.0'
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

const server = app.listen(PORT, () => {
  Logger.info(`🚀 API Key Wallet server running on port ${PORT}`);
  Logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    Logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
