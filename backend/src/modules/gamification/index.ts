import { Module } from '../../core/plugin-manager';
import gamificationRoutes from './gamification.routes';
import { logger } from '../../core/logger';

/**
 * Gamification Module (Phase 2)
 * Handles XP, levels, streaks, and achievements
 */
export const GamificationModule: Module = {
  name: 'gamification',
  routes: gamificationRoutes,
  dependencies: ['auth', 'assignments'], // Requires auth and assignments modules

  async initialize() {
    logger.info('Initializing Gamification module...');

    // The gamification module listens to assignment completion events
    // Integration happens in the assignments module

    logger.info('Gamification module initialized');
  },

  async cleanup() {
    logger.info('Cleaning up Gamification module...');
    // Cleanup logic if needed
  },
};

// Export services and types for other modules
export { gamificationService } from './gamification.service';
export { xpCalculatorService } from './xp-calculator.service';
export { streakTrackerService } from './streak-tracker.service';
export { achievementService } from './achievement.service';
export * from './gamification.types';
