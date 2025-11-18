/**
 * AI Enhancement Routes
 * All AI features are optional and enhance existing functionality
 */

import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

export const aiRoutes = Router();

// All routes require authentication
aiRoutes.use(authenticateToken);

// Status and settings
aiRoutes.get('/status', (req, res) => aiController.getStatus(req, res));
aiRoutes.get('/settings', (req, res) => aiController.getSettings(req, res));
aiRoutes.put('/settings', (req, res) => aiController.updateSettings(req, res));

// AI features (all have fallbacks)
aiRoutes.post('/estimate-time', (req, res) => aiController.estimateTime(req, res));
aiRoutes.post('/suggest-priority', (req, res) => aiController.suggestPriority(req, res));
aiRoutes.post('/generate-insights', (req, res) => aiController.generateInsights(req, res));
aiRoutes.post('/parse-natural-language', (req, res) => aiController.parseNaturalLanguage(req, res));
