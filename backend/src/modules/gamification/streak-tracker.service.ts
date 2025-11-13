import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { format, differenceInDays, startOfDay, isToday, isYesterday } from 'date-fns';
import { UserStreak, StreakUpdateResult } from './gamification.types';

/**
 * Streak Tracker Service
 * Handles daily, weekly, and monthly streak tracking with recovery mechanics
 */
export class StreakTrackerService {
  /**
   * Update user's streak after completing an assignment
   */
  async updateStreak(userId: string): Promise<StreakUpdateResult> {
    const today = startOfDay(new Date());

    // Get or create user streak
    let streak = await this.getUserStreak(userId);

    if (!streak) {
      streak = await this.initializeUserStreak(userId);
    }

    const result: StreakUpdateResult = {
      streakContinued: false,
      streakIncreased: false,
      streakBroken: false,
      shieldUsed: false,
      currentStreak: streak.currentDailyStreak,
      bonusXp: 0,
      milestoneReached: false,
    };

    // Check if already completed today
    if (streak.lastActivityDate && isToday(streak.lastActivityDate)) {
      result.streakContinued = true;
      result.currentStreak = streak.currentDailyStreak;
      return result;
    }

    // Check if streak should continue
    if (streak.lastActivityDate) {
      if (isYesterday(streak.lastActivityDate)) {
        // Streak continues!
        result.streakContinued = true;
        result.streakIncreased = true;
        streak.currentDailyStreak += 1;

        // Update longest streak if necessary
        if (streak.currentDailyStreak > streak.longestDailyStreak) {
          streak.longestDailyStreak = streak.currentDailyStreak;
        }

        result.currentStreak = streak.currentDailyStreak;

        // Check for streak milestones
        if ([3, 7, 14, 30, 60, 90].includes(streak.currentDailyStreak)) {
          result.milestoneReached = true;
        }

        // Log streak event
        await this.logStreakEvent(userId, 'streak_continued', 'daily', streak.currentDailyStreak);
      } else {
        // Streak broken - check for shield
        const daysMissed = differenceInDays(today, streak.lastActivityDate);

        if (daysMissed === 2 && streak.streakShieldsAvailable > 0) {
          // Use streak shield!
          result.shieldUsed = true;
          result.streakContinued = true;
          streak.streakShieldsAvailable -= 1;
          streak.currentDailyStreak += 1;
          result.currentStreak = streak.currentDailyStreak;

          await this.logStreakEvent(
            userId,
            'shield_used',
            'daily',
            streak.currentDailyStreak,
            { daysMissed }
          );

          logger.info(`User ${userId} used streak shield. Streak preserved at ${streak.currentDailyStreak}`);
        } else {
          // Streak broken
          result.streakBroken = true;
          const oldStreak = streak.currentDailyStreak;
          streak.currentDailyStreak = 1; // Start fresh
          result.currentStreak = 1;

          await this.logStreakEvent(userId, 'streak_broken', 'daily', oldStreak, {
            newStreak: 1,
            daysMissed,
          });

          logger.info(`User ${userId} streak broken. Was ${oldStreak}, now 1`);
        }
      }
    } else {
      // First activity ever
      streak.currentDailyStreak = 1;
      streak.longestDailyStreak = 1;
      result.streakIncreased = true;
      result.currentStreak = 1;

      await this.logStreakEvent(userId, 'streak_started', 'daily', 1);
    }

    // Update last activity date
    streak.lastActivityDate = today;

    // Reset shields weekly
    await this.resetShieldsIfNeeded(streak);

    // Save streak
    await this.saveUserStreak(userId, streak);

    return result;
  }

  /**
   * Get user's current streak
   */
  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const record = await db
      .selectFrom('user_streaks')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!record) {
      return null;
    }

    return this.mapStreakFromDb(record);
  }

  /**
   * Initialize streak for new user
   */
  private async initializeUserStreak(userId: string): Promise<UserStreak> {
    const record = await db
      .insertInto('user_streaks')
      .values({
        user_id: userId,
        current_daily_streak: 0,
        longest_daily_streak: 0,
        current_weekly_streak: 0,
        longest_weekly_streak: 0,
        current_monthly_streak: 0,
        longest_monthly_streak: 0,
        streak_shields_available: 1,
        last_shield_reset_date: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Initialized streak tracking for user ${userId}`);
    return this.mapStreakFromDb(record);
  }

  /**
   * Save user streak to database
   */
  private async saveUserStreak(userId: string, streak: UserStreak): Promise<void> {
    await db
      .updateTable('user_streaks')
      .set({
        current_daily_streak: streak.currentDailyStreak,
        longest_daily_streak: streak.longestDailyStreak,
        last_activity_date: streak.lastActivityDate,
        current_weekly_streak: streak.currentWeeklyStreak,
        longest_weekly_streak: streak.longestWeeklyStreak,
        current_monthly_streak: streak.currentMonthlyStreak,
        longest_monthly_streak: streak.longestMonthlyStreak,
        streak_shields_available: streak.streakShieldsAvailable,
        last_shield_reset_date: streak.lastShieldResetDate,
      })
      .where('user_id', '=', userId)
      .execute();
  }

  /**
   * Reset streak shields weekly
   */
  private async resetShieldsIfNeeded(streak: UserStreak): Promise<void> {
    if (!streak.lastShieldResetDate) {
      streak.lastShieldResetDate = new Date();
      streak.streakShieldsAvailable = 1;
      return;
    }

    const daysSinceReset = differenceInDays(new Date(), streak.lastShieldResetDate);

    if (daysSinceReset >= 7) {
      streak.streakShieldsAvailable = 1;
      streak.lastShieldResetDate = new Date();
      logger.info(`Reset streak shields for user`);
    }
  }

  /**
   * Log streak event
   */
  private async logStreakEvent(
    userId: string,
    eventType: string,
    streakType: string,
    streakCount: number,
    metadata: any = {}
  ): Promise<void> {
    await db
      .insertInto('streak_events')
      .values({
        user_id: userId,
        event_type: eventType,
        streak_type: streakType,
        streak_count: streakCount,
        metadata,
      })
      .execute();
  }

  /**
   * Get streak statistics for a user
   */
  async getStreakStats(userId: string): Promise<UserStreak | null> {
    return this.getUserStreak(userId);
  }

  /**
   * Map database record to UserStreak
   */
  private mapStreakFromDb(record: any): UserStreak {
    return {
      id: record.id,
      userId: record.user_id,
      currentDailyStreak: record.current_daily_streak,
      longestDailyStreak: record.longest_daily_streak,
      lastActivityDate: record.last_activity_date,
      currentWeeklyStreak: record.current_weekly_streak,
      longestWeeklyStreak: record.longest_weekly_streak,
      lastWeeklyActivity: record.last_weekly_activity,
      currentMonthlyStreak: record.current_monthly_streak,
      longestMonthlyStreak: record.longest_monthly_streak,
      lastMonthlyActivity: record.last_monthly_activity,
      streakShieldsAvailable: record.streak_shields_available,
      lastShieldResetDate: record.last_shield_reset_date,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export const streakTrackerService = new StreakTrackerService();
