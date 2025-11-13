/**
 * Scheduling Controller
 * HTTP handlers for scheduling endpoints
 */

import { Request, Response } from 'express';
import { dailyMissionGeneratorService } from './daily-mission-generator.service';
import { timeBlockingService } from './time-blocking.service';
import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { z } from 'zod';

// Validation schemas
const generateMissionSchema = z.object({
  date: z.string().optional(),
  maxItems: z.number().int().positive().max(20).optional(),
});

const updatePrioritySettingsSchema = z.object({
  dueDateWeight: z.number().int().min(0).max(100).optional(),
  difficultyWeight: z.number().int().min(0).max(100).optional(),
  importanceWeight: z.number().int().min(0).max(100).optional(),
  estimatedTimeWeight: z.number().int().min(0).max(100).optional(),
  preferMorningTasks: z.boolean().optional(),
  preferQuickWins: z.boolean().optional(),
  preferHighXp: z.boolean().optional(),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakDurationMinutes: z.number().int().positive().optional(),
  focusBlockDurationMinutes: z.number().int().positive().optional(),
});

const createTimeBlockSchema = z.object({
  blockDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  blockType: z.enum(['task', 'break', 'focus', 'meeting', 'free']),
  missionItemId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateTimeBlockSchema = createTimeBlockSchema.partial().omit({ blockDate: true });

export class SchedulingController {
  /**
   * GET /api/scheduling/priority-settings
   * Get user's priority settings
   */
  async getPrioritySettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      let settings = await db
        .selectFrom('priority_settings')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!settings) {
        // Create default settings
        settings = await db
          .insertInto('priority_settings')
          .values({
            user_id: userId,
            due_date_weight: 40,
            difficulty_weight: 20,
            importance_weight: 30,
            estimated_time_weight: 10,
            prefer_morning_tasks: false,
            prefer_quick_wins: false,
            prefer_high_xp: true,
            break_duration_minutes: 15,
            focus_block_duration_minutes: 50,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      res.json({
        id: settings.id,
        userId: settings.user_id,
        dueDateWeight: settings.due_date_weight,
        difficultyWeight: settings.difficulty_weight,
        importanceWeight: settings.importance_weight,
        estimatedTimeWeight: settings.estimated_time_weight,
        preferMorningTasks: settings.prefer_morning_tasks,
        preferQuickWins: settings.prefer_quick_wins,
        preferHighXp: settings.prefer_high_xp,
        workStartTime: settings.work_start_time,
        workEndTime: settings.work_end_time,
        breakDurationMinutes: settings.break_duration_minutes,
        focusBlockDurationMinutes: settings.focus_block_duration_minutes,
        updatedAt: settings.updated_at,
      });
    } catch (error) {
      logger.error('Error fetching priority settings:', error);
      res.status(500).json({ error: 'Failed to fetch priority settings' });
    }
  }

  /**
   * PUT /api/scheduling/priority-settings
   * Update user's priority settings
   */
  async updatePrioritySettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = updatePrioritySettingsSchema.parse(req.body);

      // Validate weights sum to 100 if all provided
      if (
        data.dueDateWeight !== undefined &&
        data.difficultyWeight !== undefined &&
        data.importanceWeight !== undefined &&
        data.estimatedTimeWeight !== undefined
      ) {
        const sum =
          data.dueDateWeight +
          data.difficultyWeight +
          data.importanceWeight +
          data.estimatedTimeWeight;
        if (sum !== 100) {
          return res.status(400).json({ error: 'Priority weights must sum to 100' });
        }
      }

      const updateData: any = {};
      if (data.dueDateWeight !== undefined) updateData.due_date_weight = data.dueDateWeight;
      if (data.difficultyWeight !== undefined)
        updateData.difficulty_weight = data.difficultyWeight;
      if (data.importanceWeight !== undefined)
        updateData.importance_weight = data.importanceWeight;
      if (data.estimatedTimeWeight !== undefined)
        updateData.estimated_time_weight = data.estimatedTimeWeight;
      if (data.preferMorningTasks !== undefined)
        updateData.prefer_morning_tasks = data.preferMorningTasks;
      if (data.preferQuickWins !== undefined) updateData.prefer_quick_wins = data.preferQuickWins;
      if (data.preferHighXp !== undefined) updateData.prefer_high_xp = data.preferHighXp;
      if (data.workStartTime !== undefined) updateData.work_start_time = data.workStartTime;
      if (data.workEndTime !== undefined) updateData.work_end_time = data.workEndTime;
      if (data.breakDurationMinutes !== undefined)
        updateData.break_duration_minutes = data.breakDurationMinutes;
      if (data.focusBlockDurationMinutes !== undefined)
        updateData.focus_block_duration_minutes = data.focusBlockDurationMinutes;

      const settings = await db
        .updateTable('priority_settings')
        .set(updateData)
        .where('user_id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.json({
        id: settings.id,
        userId: settings.user_id,
        dueDateWeight: settings.due_date_weight,
        difficultyWeight: settings.difficulty_weight,
        importanceWeight: settings.importance_weight,
        estimatedTimeWeight: settings.estimated_time_weight,
        preferMorningTasks: settings.prefer_morning_tasks,
        preferQuickWins: settings.prefer_quick_wins,
        preferHighXp: settings.prefer_high_xp,
        workStartTime: settings.work_start_time,
        workEndTime: settings.work_end_time,
        breakDurationMinutes: settings.break_duration_minutes,
        focusBlockDurationMinutes: settings.focus_block_duration_minutes,
        updatedAt: settings.updated_at,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Error updating priority settings:', error);
      res.status(500).json({ error: 'Failed to update priority settings' });
    }
  }

  /**
   * GET /api/scheduling/missions/today
   * Get today's daily mission
   */
  async getTodaysMission(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const mission = await dailyMissionGeneratorService.getTodaysMission(userId);

      if (!mission) {
        return res.status(404).json({ error: 'No mission found for today' });
      }

      res.json(mission);
    } catch (error) {
      logger.error('Error fetching today\'s mission:', error);
      res.status(500).json({ error: 'Failed to fetch mission' });
    }
  }

  /**
   * POST /api/scheduling/missions/generate
   * Generate a daily mission
   */
  async generateMission(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = generateMissionSchema.parse(req.body);

      const result = await dailyMissionGeneratorService.generateDailyMission(userId, data);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Error generating mission:', error);
      res.status(500).json({ error: 'Failed to generate mission' });
    }
  }

  /**
   * POST /api/scheduling/missions/items/:id/complete
   * Mark a mission item as completed
   */
  async completeMissionItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await dailyMissionGeneratorService.completeMissionItem(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error('Error completing mission item:', error);
      res.status(500).json({ error: 'Failed to complete mission item' });
    }
  }

  /**
   * GET /api/scheduling/time-blocks
   * Get time blocks for a date or date range
   */
  async getTimeBlocks(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { date, startDate, endDate } = req.query;

      if (startDate && endDate) {
        const blocks = await timeBlockingService.getTimeBlocksInRange(
          userId,
          startDate as string,
          endDate as string
        );
        return res.json(blocks);
      } else if (date) {
        const blocks = await timeBlockingService.getTimeBlocks(userId, date as string);
        return res.json(blocks);
      } else {
        // Default to today
        const today = new Date().toISOString().split('T')[0];
        const blocks = await timeBlockingService.getTimeBlocks(userId, today);
        return res.json(blocks);
      }
    } catch (error) {
      logger.error('Error fetching time blocks:', error);
      res.status(500).json({ error: 'Failed to fetch time blocks' });
    }
  }

  /**
   * POST /api/scheduling/time-blocks
   * Create a new time block
   */
  async createTimeBlock(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createTimeBlockSchema.parse(req.body);

      const block = await timeBlockingService.createTimeBlock(userId, data);
      res.status(201).json(block);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('conflicts')) {
        return res.status(409).json({ error: error.message });
      }
      logger.error('Error creating time block:', error);
      res.status(500).json({ error: 'Failed to create time block' });
    }
  }

  /**
   * PUT /api/scheduling/time-blocks/:id
   * Update a time block
   */
  async updateTimeBlock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = updateTimeBlockSchema.parse(req.body);

      const block = await timeBlockingService.updateTimeBlock(id, userId, data);
      res.json(block);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('conflicts')) {
        return res.status(409).json({ error: error.message });
      }
      logger.error('Error updating time block:', error);
      res.status(500).json({ error: 'Failed to update time block' });
    }
  }

  /**
   * DELETE /api/scheduling/time-blocks/:id
   * Delete a time block
   */
  async deleteTimeBlock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await timeBlockingService.deleteTimeBlock(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting time block:', error);
      res.status(500).json({ error: 'Failed to delete time block' });
    }
  }

  /**
   * POST /api/scheduling/auto-schedule
   * Auto-schedule mission items
   */
  async autoSchedule(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { missionId, date } = req.body;

      if (!missionId || !date) {
        return res.status(400).json({ error: 'missionId and date are required' });
      }

      const blocks = await timeBlockingService.autoScheduleMissionItems(userId, missionId, date);
      res.json({ blocksCreated: blocks.length, blocks });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Error auto-scheduling:', error);
      res.status(500).json({ error: 'Failed to auto-schedule items' });
    }
  }
}

export const schedulingController = new SchedulingController();
