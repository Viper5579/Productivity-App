/**
 * Analytics Routes
 */

import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

export const analyticsRoutes = Router();

// All routes require authentication
analyticsRoutes.use(authenticate);

// Dashboard and overview
analyticsRoutes.get('/dashboard', (req, res) => analyticsController.getDashboard(req, res));
analyticsRoutes.get('/overview', (req, res) => analyticsController.getOverview(req, res));

// Trends
analyticsRoutes.get('/xp-trend', (req, res) => analyticsController.getXpTrend(req, res));
analyticsRoutes.get('/completion-trend', (req, res) => analyticsController.getCompletionTrend(req, res));

// Performance and insights
analyticsRoutes.get('/category-performance', (req, res) => analyticsController.getCategoryPerformance(req, res));
analyticsRoutes.get('/insights', (req, res) => analyticsController.getInsights(req, res));

// Reports
analyticsRoutes.get('/weekly-summary', (req, res) => analyticsController.getWeeklySummary(req, res));
analyticsRoutes.get('/monthly-summary', (req, res) => analyticsController.getMonthlySummary(req, res));
