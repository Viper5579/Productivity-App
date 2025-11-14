/**
 * Analytics Controller
 * HTTP handlers for analytics endpoints
 */

import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { logger } from '../../core/logger';

export class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Get complete analytics dashboard data
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = await analyticsService.getDashboardData(userId);
      res.json(data);
    } catch (error) {
      logger.error('Error fetching analytics dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
    }
  }

  /**
   * GET /api/analytics/overview
   * Get overview metrics
   */
  async getOverview(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const overview = await analyticsService.getOverview(userId);
      res.json(overview);
    } catch (error) {
      logger.error('Error fetching overview:', error);
      res.status(500).json({ error: 'Failed to fetch overview' });
    }
  }

  /**
   * GET /api/analytics/xp-trend
   * Get XP trend data
   */
  async getXpTrend(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const trend = await analyticsService.getXpTrend(userId);
      res.json(trend);
    } catch (error) {
      logger.error('Error fetching XP trend:', error);
      res.status(500).json({ error: 'Failed to fetch XP trend' });
    }
  }

  /**
   * GET /api/analytics/completion-trend
   * Get completion trend data
   */
  async getCompletionTrend(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const trend = await analyticsService.getCompletionTrend(userId);
      res.json(trend);
    } catch (error) {
      logger.error('Error fetching completion trend:', error);
      res.status(500).json({ error: 'Failed to fetch completion trend' });
    }
  }

  /**
   * GET /api/analytics/category-performance
   * Get category performance data
   */
  async getCategoryPerformance(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const performance = await analyticsService.getCategoryPerformance(userId);
      res.json(performance);
    } catch (error) {
      logger.error('Error fetching category performance:', error);
      res.status(500).json({ error: 'Failed to fetch category performance' });
    }
  }

  /**
   * GET /api/analytics/insights
   * Get productivity insights
   */
  async getInsights(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const insights = await analyticsService.getInsights(userId);
      res.json(insights);
    } catch (error) {
      logger.error('Error fetching insights:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  }

  /**
   * GET /api/analytics/weekly-summary
   * Get weekly summary
   */
  async getWeeklySummary(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const summary = await analyticsService.getWeeklySummary(userId);
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching weekly summary:', error);
      res.status(500).json({ error: 'Failed to fetch weekly summary' });
    }
  }

  /**
   * GET /api/analytics/monthly-summary
   * Get monthly summary
   */
  async getMonthlySummary(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const summary = await analyticsService.getMonthlySummary(
        userId,
        parseInt(year as string),
        parseInt(month as string)
      );
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching monthly summary:', error);
      res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
  }
}

export const analyticsController = new AnalyticsController();
