import { Router } from 'express';
import { gamificationController } from './gamification.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * Gamification routes
 * Base path: /api/gamification
 * All routes require authentication
 */

router.use(authenticateToken);

// Stats and overview
router.get('/stats', (req, res) => gamificationController.getStats(req, res));

// XP and levels
router.get('/xp', (req, res) => gamificationController.getXp(req, res));

// Streaks
router.get('/streak', (req, res) => gamificationController.getStreak(req, res));

// Achievements
router.get('/achievements', (req, res) => gamificationController.getAchievements(req, res));
router.get('/achievements/all', (req, res) => gamificationController.getAllAchievements(req, res));

// Leaderboard
router.get('/leaderboard', (req, res) => gamificationController.getLeaderboard(req, res));

export default router;
