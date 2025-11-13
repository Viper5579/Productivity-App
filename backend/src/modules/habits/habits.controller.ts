/**
 * Habits Controller
 * HTTP handlers for habit endpoints
 */

import { Request, Response } from 'express';
import { habitsService } from './habits.service';
import { logger } from '../../core/logger';
import { z } from 'zod';

// Validation schemas
const createHabitSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['study', 'health', 'productivity', 'personal', 'other']),
  icon: z.string().optional(),
  frequencyType: z.enum(['daily', 'weekly', 'custom']),
  frequencyTarget: z.number().int().positive().optional(),
  frequencyDays: z.array(z.number().int().min(0).max(6)).optional(),
  hasTarget: z.boolean().optional(),
  targetValue: z.number().int().positive().optional(),
  targetUnit: z.string().optional(),
  xpReward: z.number().int().positive().optional(),
  bonusXpOnStreak: z.number().int().min(0).optional(),
});

const updateHabitSchema = createHabitSchema.partial();

const completeHabitSchema = z.object({
  habitId: z.string().uuid(),
  completedDate: z.string().optional(), // ISO date string
  actualValue: z.number().int().positive().optional(),
  notes: z.string().optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
});

export class HabitsController {
  /**
   * GET /api/habits/templates
   * Get all habit templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const templates = await habitsService.getTemplates();
      res.json(templates);
    } catch (error) {
      logger.error('Error fetching habit templates:', error);
      res.status(500).json({ error: 'Failed to fetch habit templates' });
    }
  }

  /**
   * GET /api/habits
   * Get all habits for the authenticated user
   */
  async getUserHabits(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const includeArchived = req.query.includeArchived === 'true';

      const habits = await habitsService.getUserHabits(userId, includeArchived);
      res.json(habits);
    } catch (error) {
      logger.error('Error fetching user habits:', error);
      res.status(500).json({ error: 'Failed to fetch habits' });
    }
  }

  /**
   * GET /api/habits/:id
   * Get a specific habit
   */
  async getHabitById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const habit = await habitsService.getHabitById(id, userId);

      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json(habit);
    } catch (error) {
      logger.error('Error fetching habit:', error);
      res.status(500).json({ error: 'Failed to fetch habit' });
    }
  }

  /**
   * POST /api/habits
   * Create a new habit
   */
  async createHabit(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createHabitSchema.parse(req.body);

      const habit = await habitsService.createHabit(userId, data);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Error creating habit:', error);
      res.status(500).json({ error: 'Failed to create habit' });
    }
  }

  /**
   * POST /api/habits/from-template/:templateId
   * Create habit from template
   */
  async createFromTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const habit = await habitsService.createHabitFromTemplate(userId, templateId);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return res.status(404).json({ error: 'Template not found' });
      }
      logger.error('Error creating habit from template:', error);
      res.status(500).json({ error: 'Failed to create habit from template' });
    }
  }

  /**
   * PUT /api/habits/:id
   * Update a habit
   */
  async updateHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = updateHabitSchema.parse(req.body);

      const habit = await habitsService.updateHabit(id, userId, data);
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Error updating habit:', error);
      res.status(500).json({ error: 'Failed to update habit' });
    }
  }

  /**
   * DELETE /api/habits/:id
   * Archive a habit
   */
  async deleteHabit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await habitsService.deleteHabit(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting habit:', error);
      res.status(500).json({ error: 'Failed to delete habit' });
    }
  }

  /**
   * POST /api/habits/complete
   * Mark a habit as completed
   */
  async completeHabit(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = completeHabitSchema.parse(req.body);

      const result = await habitsService.completeHabit(userId, data);

      // Trigger gamification if enabled
      try {
        const { config } = await import('../../core/config');
        if (config.features.gamification) {
          const { gamificationService } = await import('../gamification/gamification.service');

          // Award XP for habit completion
          const gamificationResult = await gamificationService.awardXp(userId, {
            amount: result.xpEarned,
            source: 'habit_completion',
            habitId: data.habitId,
            reason: `Completed habit${result.newStreakCount > 1 ? ` (${result.newStreakCount} day streak)` : ''}`,
            metadata: {
              habitId: data.habitId,
              streakCount: result.newStreakCount,
              bonusXp: result.bonusXpEarned,
            },
          });

          result.leveledUp = gamificationResult.leveledUp;
          result.newLevel = gamificationResult.newLevel;
        }
      } catch (error) {
        logger.debug('Gamification not available for habit completion:', error);
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already completed')) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Habit not found') {
        return res.status(404).json({ error: 'Habit not found' });
      }
      logger.error('Error completing habit:', error);
      res.status(500).json({ error: 'Failed to complete habit' });
    }
  }

  /**
   * GET /api/habits/:id/history
   * Get completion history for a habit
   */
  async getCompletionHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

      const history = await habitsService.getCompletionHistory(id, userId, limit);
      res.json(history);
    } catch (error) {
      logger.error('Error fetching completion history:', error);
      res.status(500).json({ error: 'Failed to fetch completion history' });
    }
  }

  /**
   * GET /api/habits/stats
   * Get habit statistics for the user
   */
  async getHabitStats(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const stats = await habitsService.getUserHabitStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching habit stats:', error);
      res.status(500).json({ error: 'Failed to fetch habit stats' });
    }
  }
}

export const habitsController = new HabitsController();
