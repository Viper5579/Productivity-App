import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { Achievement, AchievementDefinition, AchievementCheckResult } from './gamification.types';

/**
 * Achievement Service
 * Checks and unlocks achievements based on user progress
 */
export class AchievementService {
  /**
   * Check and unlock achievements after an assignment completion
   */
  async checkAchievements(userId: string): Promise<AchievementCheckResult> {
    const result: AchievementCheckResult = {
      unlocked: [],
      progress: new Map(),
    };

    // Get all active achievement definitions
    const definitions = await db
      .selectFrom('achievement_definitions')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('display_order')
      .execute();

    // Get user's existing achievements
    const existing = await db
      .selectFrom('user_achievements')
      .select(['achievement_id'])
      .where('user_id', '=', userId)
      .execute();

    const existingIds = new Set(existing.map((a) => a.achievement_id));

    // Check each achievement
    for (const def of definitions) {
      // Skip if already unlocked
      if (existingIds.has(def.id)) {
        continue;
      }

      const { unlocked, progress } = await this.checkAchievement(userId, def);

      if (unlocked) {
        const achievement = await this.unlockAchievement(userId, def, progress);
        result.unlocked.push(achievement);
      } else {
        result.progress.set(def.code, progress);
      }
    }

    if (result.unlocked.length > 0) {
      logger.info(`User ${userId} unlocked ${result.unlocked.length} achievements`);
    }

    return result;
  }

  /**
   * Check a single achievement
   */
  private async checkAchievement(
    userId: string,
    def: AchievementDefinition
  ): Promise<{ unlocked: boolean; progress: number }> {
    let current = 0;
    const required = def.requirementValue;

    switch (def.requirementType) {
      case 'assignment_count':
        current = await this.getAssignmentCount(userId);
        break;

      case 'streak_days':
        current = await this.getCurrentStreak(userId);
        break;

      case 'early_completions':
        current = await this.getEarlyCompletionCount(userId);
        break;

      case 'xp_total':
        current = await this.getTotalXp(userId);
        break;

      case 'level_reached':
        current = await this.getCurrentLevel(userId);
        break;

      case 'perfect_week':
        current = await this.checkPerfectWeek(userId) ? 1 : 0;
        break;

      default:
        logger.warn(`Unknown requirement type: ${def.requirementType}`);
        return { unlocked: false, progress: 0 };
    }

    const progress = Math.floor((current / required) * 100);
    const unlocked = current >= required;

    return { unlocked, progress };
  }

  /**
   * Unlock an achievement for a user
   */
  private async unlockAchievement(
    userId: string,
    def: any,
    progress: number
  ): Promise<Achievement> {
    const record = await db
      .insertInto('user_achievements')
      .values({
        user_id: userId,
        achievement_id: def.id,
        progress,
        metadata: {
          unlockedAt: new Date().toISOString(),
        },
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Achievement unlocked: ${def.name} for user ${userId}`);

    // Map to Achievement type
    return {
      id: record.id,
      userId: record.user_id,
      achievementId: record.achievement_id,
      achievement: this.mapAchievementDefinitionFromDb(def),
      unlockedAt: record.unlocked_at,
      progress: record.progress || 0,
      metadata: record.metadata,
    };
  }

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const records = await db
      .selectFrom('user_achievements as ua')
      .innerJoin('achievement_definitions as ad', 'ua.achievement_id', 'ad.id')
      .select([
        'ua.id',
        'ua.user_id',
        'ua.achievement_id',
        'ua.unlocked_at',
        'ua.progress',
        'ua.metadata',
        'ad.code',
        'ad.name',
        'ad.description',
        'ad.category',
        'ad.icon',
        'ad.tier',
        'ad.requirement_type',
        'ad.requirement_value',
        'ad.xp_reward',
        'ad.is_active',
        'ad.display_order',
        'ad.created_at',
      ])
      .where('ua.user_id', '=', userId)
      .orderBy('ua.unlocked_at', 'desc')
      .execute();

    return records.map((r) => ({
      id: r.id,
      userId: r.user_id,
      achievementId: r.achievement_id,
      unlockedAt: r.unlocked_at,
      progress: r.progress || 0,
      metadata: r.metadata,
      achievement: {
        id: r.achievement_id,
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.category as any,
        icon: r.icon,
        tier: r.tier as any,
        requirementType: r.requirement_type,
        requirementValue: r.requirement_value,
        xpReward: r.xp_reward,
        isActive: r.is_active,
        displayOrder: r.display_order,
        createdAt: r.created_at,
      },
    }));
  }

  /**
   * Get all achievement definitions with user progress
   */
  async getAllAchievementsWithProgress(
    userId: string
  ): Promise<Array<AchievementDefinition & { unlocked: boolean; progress: number }>> {
    // Get all definitions
    const definitions = await db
      .selectFrom('achievement_definitions')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('display_order')
      .execute();

    // Get user achievements
    const unlocked = await db
      .selectFrom('user_achievements')
      .select(['achievement_id', 'progress'])
      .where('user_id', '=', userId)
      .execute();

    const unlockedMap = new Map(unlocked.map((a) => [a.achievement_id, a.progress || 0]));

    // Combine
    const results = await Promise.all(
      definitions.map(async (def) => {
        const isUnlocked = unlockedMap.has(def.id);
        let progress = isUnlocked ? 100 : 0;

        if (!isUnlocked) {
          const check = await this.checkAchievement(
            userId,
            this.mapAchievementDefinitionFromDb(def)
          );
          progress = check.progress;
        }

        return {
          ...this.mapAchievementDefinitionFromDb(def),
          unlocked: isUnlocked,
          progress,
        };
      })
    );

    return results;
  }

  // ============================================================================
  // Helper Methods for Requirement Checking
  // ============================================================================

  private async getAssignmentCount(userId: string): Promise<number> {
    const result = await db
      .selectFrom('assignments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('is_completed', '=', true)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  private async getCurrentStreak(userId: string): Promise<number> {
    const streak = await db
      .selectFrom('user_streaks')
      .select(['current_daily_streak'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return streak?.current_daily_streak || 0;
  }

  private async getEarlyCompletionCount(userId: string): Promise<number> {
    const result = await db
      .selectFrom('assignment_completions')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('days_before_due', '>', 0)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  private async getTotalXp(userId: string): Promise<number> {
    const xp = await db
      .selectFrom('user_xp')
      .select(['total_xp_earned'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return xp?.total_xp_earned || 0;
  }

  private async getCurrentLevel(userId: string): Promise<number> {
    const xp = await db
      .selectFrom('user_xp')
      .select(['current_level'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return xp?.current_level || 1;
  }

  private async checkPerfectWeek(userId: string): Promise<boolean> {
    // TODO: Implement perfect week check
    // Check if all assignments due this week are completed
    return false;
  }

  private mapAchievementDefinitionFromDb(record: any): AchievementDefinition {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      category: record.category,
      icon: record.icon,
      tier: record.tier,
      requirementType: record.requirement_type,
      requirementValue: record.requirement_value,
      xpReward: record.xp_reward,
      isActive: record.is_active,
      displayOrder: record.display_order,
      createdAt: record.created_at,
    };
  }
}

export const achievementService = new AchievementService();
