import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  Logger.error(`Error ${statusCode}: ${message}`, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: process.env.NODE_ENV === 'development' ? stack : undefined
  });

  const response = {
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack })
    },
    timestamp: new Date().toISOString(),
    path: req.url
  };

  res.status(statusCode).json(response);
};
