/**
 * AI Enhancement Module
 * FULLY MODULAR - App works 100% without this module
 *
 * This module enhances existing features with AI capabilities.
 * When disabled or unavailable, all features gracefully fall back to
 * heuristics, patterns, and templates.
 *
 * Key principles:
 * 1. Never required for core functionality
 * 2. All features have non-AI fallbacks
 * 3. User controls their own API keys (if they want real AI)
 * 4. Feature toggles for granular control
 */

import { Module } from '../../core/plugin-manager';
import { aiRoutes } from './ai.routes';
import { logger } from '../../core/logger';

export const AIModule: Module = {
  name: 'ai',
  routes: aiRoutes,
  dependencies: ['auth'], // Only depends on auth for user context

  async initialize() {
    logger.info('AI Enhancement module initialized (fallback mode)');
    logger.info('Note: AI features work without external APIs using heuristics');
  },

  async cleanup() {
    logger.info('AI Enhancement module cleanup');
  },
};

export * from './ai.types';
export * from './ai.service';
