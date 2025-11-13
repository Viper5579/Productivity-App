import { Module } from '../../core/plugin-manager';
import authRoutes from './auth.routes';
import { authService } from './auth.service';
import { logger } from '../../core/logger';

/**
 * Authentication Module
 * Handles user registration, login, and session management
 */
export const AuthModule: Module = {
  name: 'auth',
  routes: authRoutes,

  async initialize() {
    logger.info('Initializing Auth module...');

    // Setup periodic cleanup of expired sessions (every hour)
    setInterval(
      async () => {
        try {
          await authService.cleanupExpiredSessions();
        } catch (error) {
          logger.error('Failed to cleanup expired sessions:', error);
        }
      },
      60 * 60 * 1000
    ); // 1 hour

    logger.info('Auth module initialized');
  },

  async cleanup() {
    logger.info('Cleaning up Auth module...');
    // Cleanup logic if needed
  },
};

// Export services and types for other modules
export { authService } from './auth.service';
export * from './auth.types';
