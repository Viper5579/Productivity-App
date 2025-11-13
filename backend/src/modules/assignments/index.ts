import { Module } from '../../core/plugin-manager';
import assignmentsRoutes from './assignments.routes';
import { assignmentsService } from './assignments.service';
import { logger } from '../../core/logger';
import { db } from '../../core/database';

/**
 * Assignments Module
 * Handles filtered assignments, completions, and filter patterns
 */
export const AssignmentsModule: Module = {
  name: 'assignments',
  routes: assignmentsRoutes,
  dependencies: ['auth'], // Requires auth module

  async initialize() {
    logger.info('Initializing Assignments module...');

    // Listen for Canvas sync completions and process assignments
    // This would be better with an event bus, but for now we'll do it manually
    // When Canvas module syncs, it should trigger assignment processing

    logger.info('Assignments module initialized');
  },

  async cleanup() {
    logger.info('Cleaning up Assignments module...');
    // Cleanup logic if needed
  },
};

// Export services and types for other modules
export { assignmentsService } from './assignments.service';
export { assignmentFilterService } from './assignment-filter.service';
export * from './assignments.types';
