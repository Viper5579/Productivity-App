/**
 * Habits Module
 * Exports module registration for the plugin system
 */

import { Module } from '../../core/plugin-manager';
import { habitsRoutes } from './habits.routes';
import { logger } from '../../core/logger';

export const HabitsModule: Module = {
  name: 'habits',
  routes: habitsRoutes,
  dependencies: ['auth'], // Can optionally integrate with gamification

  async initialize() {
    logger.info('Habits module initialized');
  },

  async cleanup() {
    logger.info('Habits module cleanup');
  },
};

export * from './habits.types';
export * from './habits.service';
