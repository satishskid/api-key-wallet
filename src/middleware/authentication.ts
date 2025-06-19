import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authentication = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Skip authentication for health check and public endpoints
  if (req.path === '/health' || req.path.startsWith('/api/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required'
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    Logger.debug('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    next();
  } catch (error) {
    Logger.warn('Invalid access token', {
      token: token.substring(0, 10) + '...',
      error: (error as Error).message
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired access token'
    });
  }
};
