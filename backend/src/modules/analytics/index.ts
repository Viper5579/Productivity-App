/**
 * Analytics Module
 * Exports module registration for the plugin system
 */

import { Module } from '../../core/plugin-manager';
import { analyticsRoutes } from './analytics.routes';
import { logger } from '../../core/logger';

export const AnalyticsModule: Module = {
  name: 'analytics',
  routes: analyticsRoutes,
  dependencies: ['auth', 'gamification', 'habits'], // Depends on data from other modules

  async initialize() {
    logger.info('Analytics module initialized');
  },

  async cleanup() {
    logger.info('Analytics module cleanup');
  },
};

export * from './analytics.types';
export * from './analytics.service';
