/**
 * AI Enhancement Controller
 * HTTP handlers for AI features (fully optional)
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { aiService } from './ai.service';
import { logger } from '../../core/logger';
import { z } from 'zod';

// Validation schemas
const updateSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  provider: z.enum(['openai', 'anthropic', 'none']).optional(),
  apiKey: z.string().optional(),
  enableTimeEstimation: z.boolean().optional(),
  enableSmartPriority: z.boolean().optional(),
  enableInsightGeneration: z.boolean().optional(),
  enableNaturalLanguage: z.boolean().optional(),
  dailyLimit: z.number().int().positive().optional(),
});

const timeEstimationSchema = z.object({
  taskTitle: z.string().min(1),
  taskDescription: z.string().optional(),
  taskType: z.string().optional(),
  pointsPossible: z.number().optional(),
});

const prioritySuggestionSchema = z.object({
  taskTitle: z.string().min(1),
  taskDescription: z.string().optional(),
  dueDate: z.string().optional(),
  pointsPossible: z.number().optional(),
  currentPriorityScore: z.number().min(0).max(100),
});

const naturalLanguageSchema = z.object({
  input: z.string().min(1).max(500),
  context: z.any().optional(),
});

export class AIController {
  /**
   * GET /api/ai/status
   * Get AI status and feature availability
   */
  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const status = await aiService.getStatus(userId);
      res.json(status);
    } catch (error) {
      logger.error('Error fetching AI status:', error);
      res.status(500).json({ error: 'Failed to fetch AI status' });
    }
  }

  /**
   * GET /api/ai/settings
   * Get user's AI settings
   */
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = await aiService.getUserSettings(userId);

      // Don't return the actual encrypted key
      res.json({
        id: settings.id,
        isEnabled: settings.isEnabled,
        provider: settings.provider,
        hasApiKey: settings.apiKeyEncrypted !== null,
        enableTimeEstimation: settings.enableTimeEstimation,
        enableSmartPriority: settings.enableSmartPriority,
        enableInsightGeneration: settings.enableInsightGeneration,
        enableNaturalLanguage: settings.enableNaturalLanguage,
        dailyLimit: settings.dailyLimit,
        usage: {
          requestsToday: settings.totalRequestsToday,
          lastRequestAt: settings.lastRequestAt,
        },
      });
    } catch (error) {
      logger.error('Error fetching AI settings:', error);
      res.status(500).json({ error: 'Failed to fetch AI settings' });
    }
  }

  /**
   * PUT /api/ai/settings
   * Update user's AI settings
   */
  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data = updateSettingsSchema.parse(req.body);

      const settings = await aiService.updateSettings(userId, data);

      res.json({
        id: settings.id,
        isEnabled: settings.isEnabled,
        provider: settings.provider,
        hasApiKey: settings.apiKeyEncrypted !== null,
        enableTimeEstimation: settings.enableTimeEstimation,
        enableSmartPriority: settings.enableSmartPriority,
        enableInsightGeneration: settings.enableInsightGeneration,
        enableNaturalLanguage: settings.enableNaturalLanguage,
        dailyLimit: settings.dailyLimit,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Error updating AI settings:', error);
      res.status(500).json({ error: 'Failed to update AI settings' });
    }
  }

  /**
   * POST /api/ai/estimate-time
   * Get AI-powered time estimation for a task
   */
  async estimateTime(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data = timeEstimationSchema.parse(req.body);

      const estimation = await aiService.estimateTaskTime(userId, {
        ...data,
        userHistoryAvailable: true,
      });

      res.json(estimation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('disabled')) {
        return res.status(403).json({ error: error.message });
      }
      logger.error('Error estimating time:', error);
      res.status(500).json({ error: 'Failed to estimate time' });
    }
  }

  /**
   * POST /api/ai/suggest-priority
   * Get AI-suggested priority score
   */
  async suggestPriority(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data = prioritySuggestionSchema.parse(req.body);

      const suggestion = await aiService.getSuggestedPriority(userId, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });

      res.json(suggestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('disabled')) {
        return res.status(403).json({ error: error.message });
      }
      logger.error('Error suggesting priority:', error);
      res.status(500).json({ error: 'Failed to suggest priority' });
    }
  }

  /**
   * POST /api/ai/generate-insights
   * Generate AI-powered productivity insights
   */
  async generateInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const metrics = req.body.metrics || {};

      const insights = await aiService.generateInsights(userId, metrics);
      res.json(insights);
    } catch (error) {
      if (error instanceof Error && error.message.includes('disabled')) {
        return res.status(403).json({ error: error.message });
      }
      logger.error('Error generating insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }

  /**
   * POST /api/ai/parse-natural-language
   * Parse natural language input for task creation
   */
  async parseNaturalLanguage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const data = naturalLanguageSchema.parse(req.body);

      const result = await aiService.parseNaturalLanguage(userId, data.input, data.context);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('disabled')) {
        return res.status(403).json({ error: error.message });
      }
      logger.error('Error parsing natural language:', error);
      res.status(500).json({ error: 'Failed to parse input' });
    }
  }
}

export const aiController = new AIController();
