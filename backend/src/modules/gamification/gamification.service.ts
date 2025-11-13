import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { xpCalculatorService } from './xp-calculator.service';
import { streakTrackerService } from './streak-tracker.service';
import { achievementService } from './achievement.service';
import {
  UserXp,
  LevelUpResult,
  GamificationStats,
  LEVEL_CONFIG,
  XpCalculationInput,
} from './gamification.types';

/**
 * Main Gamification Service
 * Orchestrates XP, streaks, and achievements
 */
export class GamificationService {
  /**
   * Process gamification for assignment completion
   * This is called when a user completes an assignment
   */
  async processAssignmentCompletion(input: XpCalculationInput): Promise<LevelUpResult> {
    const { userId, assignmentId, pointsPossible, daysBeforeDue, completionQuality } = input;

    logger.info(`Processing gamification for assignment ${assignmentId} by user ${userId}`);

    // 1. Calculate base XP
    const xpCalc = xpCalculatorService.calculateXp(input);

    // 2. Update streak
    const streakResult = await streakTrackerService.updateStreak(userId);

    // 3. Calculate streak bonus XP
    const streakBonusXp = xpCalculatorService.calculateStreakBonus(
      xpCalc.baseXp,
      streakResult.currentStreak
    );

    // 4. Total XP with streak bonus
    const totalXp = xpCalc.totalXp + streakBonusXp;

    // 5. Award XP and check for level-up
    const levelUpResult = await this.awardXp(userId, {
      amount: totalXp,
      source: 'assignment',
      assignmentId,
      metadata: {
        baseXp: xpCalc.baseXp,
        earlyBonus: xpCalc.earlyBonus,
        streakBonus: streakBonusXp,
        qualityBonus: xpCalc.qualityBonus,
        multiplier: xpCalc.multiplier,
        breakdown: xpCalc.breakdown,
        streakCount: streakResult.currentStreak,
        streakIncreased: streakResult.streakIncreased,
      },
    });

    // 6. Check for achievements
    const achievementsResult = await achievementService.checkAchievements(userId);

    // Award XP for unlocked achievements
    for (const achievement of achievementsResult.unlocked) {
      if (achievement.achievement && achievement.achievement.xpReward > 0) {
        await this.awardXp(userId, {
          amount: achievement.achievement.xpReward,
          source: 'achievement',
          metadata: {
            achievementCode: achievement.achievement.code,
            achievementName: achievement.achievement.name,
          },
        });
      }
    }

    // 7. Combine results
    const result: LevelUpResult = {
      ...levelUpResult,
      achievements: achievementsResult.unlocked,
    };

    logger.info(`Gamification processed: +${totalXp} XP, Level ${result.newLevel}, ${achievementsResult.unlocked.length} achievements`);

    return result;
  }

  /**
   * Award XP to a user
   */
  async awardXp(
    userId: string,
    options: {
      amount: number;
      source: 'assignment' | 'streak_bonus' | 'achievement' | 'daily_bonus';
      assignmentId?: string;
      reason?: string;
      metadata?: any;
    }
  ): Promise<LevelUpResult> {
    const { amount, source, assignmentId, reason, metadata } = options;

    // Get or create user XP
    let userXp = await this.getUserXp(userId);

    if (!userXp) {
      userXp = await this.initializeUserXp(userId);
    }

    // Store old level
    const oldLevel = userXp.currentLevel;
    const oldXp = userXp.currentXp;

    // Add XP
    userXp.currentXp += amount;
    userXp.totalXpEarned += amount;

    // Check for level-up
    let leveledUp = false;
    let newLevel = userXp.currentLevel;

    while (userXp.currentXp >= userXp.xpToNextLevel) {
      userXp.currentXp -= userXp.xpToNextLevel;
      userXp.currentLevel++;
      leveledUp = true;

      // Log level-up
      await this.logLevelUp(userId, userXp.currentLevel - 1, userXp.currentLevel, userXp.totalXpEarned);

      // Update XP requirement for next level
      userXp.xpToNextLevel = LEVEL_CONFIG.getXpForLevel(userXp.currentLevel + 1);

      logger.info(`User ${userId} leveled up to ${userXp.currentLevel}!`);
    }

    newLevel = userXp.currentLevel;

    // Save updated XP
    await this.saveUserXp(userId, userXp);

    // Log XP transaction
    await this.logXpTransaction({
      userId,
      assignmentId: assignmentId || null,
      xpAmount: amount,
      source,
      multiplier: 1.0,
      reason: reason || null,
      metadata: metadata || null,
    });

    return {
      leveledUp,
      oldLevel,
      newLevel,
      xpGained: amount,
      totalXp: userXp.totalXpEarned,
      nextLevelXp: userXp.xpToNextLevel,
      achievements: [], // Will be added by caller
    };
  }

  /**
   * Get user's XP and level info
   */
  async getUserXp(userId: string): Promise<UserXp | null> {
    const record = await db
      .selectFrom('user_xp')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!record) {
      return null;
    }

    return this.mapUserXpFromDb(record);
  }

  /**
   * Initialize XP for new user
   */
  private async initializeUserXp(userId: string): Promise<UserXp> {
    const record = await db
      .insertInto('user_xp')
      .values({
        user_id: userId,
        current_xp: 0,
        total_xp_earned: 0,
        current_level: 1,
        xp_to_next_level: LEVEL_CONFIG.getXpForLevel(2),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Initialized XP for user ${userId}`);
    return this.mapUserXpFromDb(record);
  }

  /**
   * Save user XP
   */
  private async saveUserXp(userId: string, userXp: UserXp): Promise<void> {
    await db
      .updateTable('user_xp')
      .set({
        current_xp: userXp.currentXp,
        total_xp_earned: userXp.totalXpEarned,
        current_level: userXp.currentLevel,
        xp_to_next_level: userXp.xpToNextLevel,
      })
      .where('user_id', '=', userId)
      .execute();
  }

  /**
   * Log XP transaction
   */
  private async logXpTransaction(data: {
    userId: string;
    assignmentId: string | null;
    xpAmount: number;
    source: string;
    multiplier: number;
    reason: string | null;
    metadata: any;
  }): Promise<void> {
    await db
      .insertInto('xp_transactions')
      .values({
        user_id: data.userId,
        assignment_id: data.assignmentId,
        xp_amount: data.xpAmount,
        source: data.source,
        multiplier: data.multiplier,
        reason: data.reason,
        metadata: data.metadata,
      })
      .execute();
  }

  /**
   * Log level-up event
   */
  private async logLevelUp(userId: string, oldLevel: number, newLevel: number, xpAtLevelup: number): Promise<void> {
    await db
      .insertInto('level_history')
      .values({
        user_id: userId,
        old_level: oldLevel,
        new_level: newLevel,
        xp_at_levelup: xpAtLevelup,
      })
      .execute();
  }

  /**
   * Get comprehensive gamification stats for a user
   */
  async getUserStats(userId: string): Promise<GamificationStats> {
    // Get XP
    let xp = await this.getUserXp(userId);
    if (!xp) {
      xp = await this.initializeUserXp(userId);
    }

    // Get streak
    let streak = await streakTrackerService.getUserStreak(userId);
    if (!streak) {
      streak = {
        id: '',
        userId,
        currentDailyStreak: 0,
        longestDailyStreak: 0,
        lastActivityDate: null,
        currentWeeklyStreak: 0,
        longestWeeklyStreak: 0,
        lastWeeklyActivity: null,
        currentMonthlyStreak: 0,
        longestMonthlyStreak: 0,
        lastMonthlyActivity: null,
        streakShieldsAvailable: 1,
        lastShieldResetDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Get achievements
    const achievements = await achievementService.getUserAchievements(userId);
    const achievementsByCategory = achievements.reduce((acc, a) => {
      if (a.achievement) {
        acc[a.achievement.category] = (acc[a.achievement.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get recent XP transactions
    const recentTransactions = await db
      .selectFrom('xp_transactions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(10)
      .execute();

    return {
      xp,
      streak,
      achievements: {
        total: achievements.length,
        recent: achievements.slice(0, 5),
        byCategory: achievementsByCategory,
      },
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        userId: t.user_id,
        assignmentId: t.assignment_id,
        xpAmount: t.xp_amount,
        source: t.source as any,
        multiplier: t.multiplier || 1.0,
        reason: t.reason,
        metadata: t.metadata,
        createdAt: t.created_at,
      })),
      dailyStats: null, // TODO: Implement daily stats aggregation
    };
  }

  /**
   * Get leaderboard (top users by level/XP)
   */
  async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; level: number; totalXp: number; rank: number }>> {
    const results = await db
      .selectFrom('user_xp as ux')
      .innerJoin('users as u', 'ux.user_id', 'u.id')
      .select([
        'ux.user_id',
        'ux.current_level',
        'ux.total_xp_earned',
        'u.name',
      ])
      .orderBy('ux.current_level', 'desc')
      .orderBy('ux.total_xp_earned', 'desc')
      .limit(limit)
      .execute();

    return results.map((r, index) => ({
      userId: r.user_id,
      name: r.name,
      level: r.current_level,
      totalXp: r.total_xp_earned,
      rank: index + 1,
    })) as any;
  }

  private mapUserXpFromDb(record: any): UserXp {
    return {
      id: record.id,
      userId: record.user_id,
      currentXp: record.current_xp,
      totalXpEarned: record.total_xp_earned,
      currentLevel: record.current_level,
      xpToNextLevel: record.xp_to_next_level,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export const gamificationService = new GamificationService();
