import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../core/config';
import { logger } from '../../core/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify token
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.warn('Invalid token:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
      req.user = {
        id: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};
