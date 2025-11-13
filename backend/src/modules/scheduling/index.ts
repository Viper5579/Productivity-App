/**
 * Scheduling Module
 * Exports module registration for the plugin system
 */

import { Module } from '../../core/plugin-manager';
import { schedulingRoutes } from './scheduling.routes';
import { logger } from '../../core/logger';

export const SchedulingModule: Module = {
  name: 'scheduling',
  routes: schedulingRoutes,
  dependencies: ['auth', 'assignments', 'habits'], // Depends on assignments and habits for mission generation

  async initialize() {
    logger.info('Scheduling module initialized');
  },

  async cleanup() {
    logger.info('Scheduling module cleanup');
  },
};

export * from './scheduling.types';
export * from './priority-calculator.service';
export * from './daily-mission-generator.service';
export * from './time-blocking.service';
