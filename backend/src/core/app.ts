import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './logger';
import { PluginManager } from './plugin-manager';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API info endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'Productivity Gamification App API',
      version: '1.0.0',
      features: config.features,
    });
  });

  return app;
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    error: {
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.path,
    },
  });
};

/**
 * Setup plugin manager and register modules
 */
export const setupModules = async (app: Express): Promise<PluginManager> => {
  const pluginManager = new PluginManager(app);

  // Import and register modules based on feature flags
  // Modules will be registered here as we implement them

  // Auth module (always enabled - required for core functionality)
  try {
    const { AuthModule } = await import('../modules/auth');
    pluginManager.register(AuthModule);
  } catch (error) {
    logger.warn('Auth module not available:', error);
  }

  // Canvas integration module
  if (config.features.canvasIntegration) {
    try {
      const { CanvasModule } = await import('../modules/canvas');
      pluginManager.register(CanvasModule);
    } catch (error) {
      logger.warn('Canvas module not available:', error);
    }
  }

  // Assignments module
  try {
    const { AssignmentsModule } = await import('../modules/assignments');
    pluginManager.register(AssignmentsModule);
  } catch (error) {
    logger.warn('Assignments module not available:', error);
  }

  // Gamification module (Phase 2)
  if (config.features.gamification) {
    try {
      const { GamificationModule } = await import('../modules/gamification');
      pluginManager.register(GamificationModule);
    } catch (error) {
      logger.warn('Gamification module not available:', error);
    }
  }

  // Habits module (Phase 3)
  if (config.features.habits) {
    try {
      const { HabitsModule } = await import('../modules/habits');
      pluginManager.register(HabitsModule);
    } catch (error) {
      logger.warn('Habits module not available:', error);
    }
  }

  // Scheduling module (Phase 3)
  if (config.features.scheduling) {
    try {
      const { SchedulingModule } = await import('../modules/scheduling');
      pluginManager.register(SchedulingModule);
    } catch (error) {
      logger.warn('Scheduling module not available:', error);
    }
  }

  // Analytics module (Phase 4)
  if (config.features.analytics) {
    try {
      const { AnalyticsModule } = await import('../modules/analytics');
      pluginManager.register(AnalyticsModule);
    } catch (error) {
      logger.warn('Analytics module not available:', error);
    }
  }

  // Initialize all registered modules
  await pluginManager.initializeAll();

  return pluginManager;
};
