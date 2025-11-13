import { config } from './core/config';
import { logger } from './core/logger';
import { testDatabaseConnection, closeDatabaseConnection } from './core/database';
import { createApp, setupModules, errorHandler, notFoundHandler } from './core/app';

/**
 * Start the application server
 */
const startServer = async () => {
  try {
    logger.info('Starting Productivity Gamification App...');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Features enabled:`, config.features);

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create Express app
    const app = createApp();

    // Setup and initialize modules
    const pluginManager = await setupModules(app);

    // Register error handlers (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`API available at ${config.apiUrl}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Cleanup modules
        await pluginManager.cleanupAll();

        // Close database connection
        await closeDatabaseConnection();

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
