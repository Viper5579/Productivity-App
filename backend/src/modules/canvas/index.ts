import { Module } from '../../core/plugin-manager';
import canvasRoutes from './canvas.routes';
import { canvasSyncWorker } from './canvas-sync.worker';
import { logger } from '../../core/logger';

/**
 * Canvas LMS Integration Module
 * Handles Canvas connections, course/assignment syncing
 */
export const CanvasModule: Module = {
  name: 'canvas',
  routes: canvasRoutes,
  dependencies: ['auth'], // Requires auth module for user authentication

  async initialize() {
    logger.info('Initializing Canvas module...');

    // Start background sync worker
    canvasSyncWorker.start();

    logger.info('Canvas module initialized');
  },

  async cleanup() {
    logger.info('Cleaning up Canvas module...');

    // Stop background sync worker
    canvasSyncWorker.stop();

    logger.info('Canvas module cleaned up');
  },
};

// Export services and types for other modules
export { canvasService } from './canvas.service';
export { CanvasApiClient } from './canvas-api.client';
export * from './canvas.types';
