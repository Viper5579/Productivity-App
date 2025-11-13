import { Response } from 'express';
import { gamificationService } from './gamification.service';
import { achievementService } from './achievement.service';
import { streakTrackerService } from './streak-tracker.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { logger } from '../../core/logger';

export class GamificationController {
  /**
   * Get user's gamification stats
   * GET /api/gamification/stats
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const stats = await gamificationService.getUserStats(req.user.id);

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error: any) {
      logger.error('Get gamification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get gamification stats',
      });
    }
  }

  /**
   * Get user's XP and level info
   * GET /api/gamification/xp
   */
  async getXp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      let xp = await gamificationService.getUserXp(req.user.id);

      res.status(200).json({
        success: true,
        data: { xp },
      });
    } catch (error: any) {
      logger.error('Get XP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get XP',
      });
    }
  }

  /**
   * Get user's streak info
   * GET /api/gamification/streak
   */
  async getStreak(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const streak = await streakTrackerService.getUserStreak(req.user.id);

      res.status(200).json({
        success: true,
        data: { streak },
      });
    } catch (error: any) {
      logger.error('Get streak error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get streak',
      });
    }
  }

  /**
   * Get user's achievements
   * GET /api/gamification/achievements
   */
  async getAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const achievements = await achievementService.getUserAchievements(req.user.id);

      res.status(200).json({
        success: true,
        data: { achievements },
      });
    } catch (error: any) {
      logger.error('Get achievements error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get achievements',
      });
    }
  }

  /**
   * Get all achievements with user progress
   * GET /api/gamification/achievements/all
   */
  async getAllAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const achievements = await achievementService.getAllAchievementsWithProgress(req.user.id);

      res.status(200).json({
        success: true,
        data: { achievements },
      });
    } catch (error: any) {
      logger.error('Get all achievements error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get all achievements',
      });
    }
  }

  /**
   * Get leaderboard
   * GET /api/gamification/leaderboard
   */
  async getLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await gamificationService.getLeaderboard(limit);

      res.status(200).json({
        success: true,
        data: { leaderboard },
      });
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard',
      });
    }
  }
}

export const gamificationController = new GamificationController();
