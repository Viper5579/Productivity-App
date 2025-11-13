/**
 * Habits Service
 * Manages habit definitions, completions, and streaks
 */

import { db } from '../../core/database';
import {
  HabitDefinition,
  HabitCompletion,
  HabitStreak,
  HabitWithStreak,
  CreateHabitDto,
  UpdateHabitDto,
  CompleteHabitDto,
  HabitCompletionResult,
  HabitStats,
  HabitTemplate,
} from './habits.types';
import { logger } from '../../core/logger';

export class HabitsService {
  /**
   * Get all habit templates
   */
  async getTemplates(): Promise<HabitTemplate[]> {
    const templates = await db
      .selectFrom('habit_templates')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('sort_order', 'asc')
      .execute();

    return templates.map(this.mapTemplateFromDb);
  }

  /**
   * Get all habits for a user with streak information
   */
  async getUserHabits(userId: string, includeArchived = false): Promise<HabitWithStreak[]> {
    let query = db
      .selectFrom('habit_definitions as hd')
      .leftJoin('habit_streaks as hs', (join) =>
        join.onRef('hs.habit_id', '=', 'hd.id').onRef('hs.user_id', '=', 'hd.user_id')
      )
      .select([
        'hd.id',
        'hd.user_id',
        'hd.name',
        'hd.description',
        'hd.category',
        'hd.icon',
        'hd.frequency_type',
        'hd.frequency_target',
        'hd.frequency_days',
        'hd.has_target',
        'hd.target_value',
        'hd.target_unit',
        'hd.xp_reward',
        'hd.bonus_xp_on_streak',
        'hd.is_active',
        'hd.archived_at',
        'hd.created_at',
        'hd.updated_at',
        'hs.current_streak',
        'hs.longest_streak',
        'hs.last_completion_date',
        'hs.total_completions',
      ])
      .where('hd.user_id', '=', userId);

    if (!includeArchived) {
      query = query.where('hd.is_active', '=', true);
    }

    const results = await query.orderBy('hd.created_at', 'desc').execute();

    // Get today's date to check if completed today
    const today = new Date().toISOString().split('T')[0];

    // Get today's completions
    const todayCompletions = await db
      .selectFrom('habit_completions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('completed_date', '=', today)
      .execute();

    const completionsMap = new Map(todayCompletions.map((c) => [c.habit_id, c]));

    return results.map((row) => {
      const todayCompletion = completionsMap.get(row.id);
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        category: row.category as any,
        icon: row.icon,
        frequencyType: row.frequency_type as any,
        frequencyTarget: row.frequency_target,
        frequencyDays: row.frequency_days ? (row.frequency_days as number[]) : null,
        hasTarget: row.has_target,
        targetValue: row.target_value,
        targetUnit: row.target_unit,
        xpReward: row.xp_reward,
        bonusXpOnStreak: row.bonus_xp_on_streak,
        isActive: row.is_active,
        archivedAt: row.archived_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        streak: row.current_streak !== null
          ? {
              currentStreak: row.current_streak,
              longestStreak: row.longest_streak!,
              lastCompletionDate: row.last_completion_date,
              totalCompletions: row.total_completions!,
            }
          : null,
        todayCompleted: !!todayCompletion,
        todayCompletion: todayCompletion ? this.mapCompletionFromDb(todayCompletion) : undefined,
      };
    });
  }

  /**
   * Get a single habit by ID
   */
  async getHabitById(habitId: string, userId: string): Promise<HabitDefinition | null> {
    const habit = await db
      .selectFrom('habit_definitions')
      .selectAll()
      .where('id', '=', habitId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!habit) {
      return null;
    }

    return this.mapHabitFromDb(habit);
  }

  /**
   * Create a new habit
   */
  async createHabit(userId: string, data: CreateHabitDto): Promise<HabitDefinition> {
    const habit = await db
      .insertInto('habit_definitions')
      .values({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        icon: data.icon || null,
        frequency_type: data.frequencyType,
        frequency_target: data.frequencyTarget || null,
        frequency_days: data.frequencyDays ? JSON.stringify(data.frequencyDays) : null,
        has_target: data.hasTarget || false,
        target_value: data.targetValue || null,
        target_unit: data.targetUnit || null,
        xp_reward: data.xpReward || 50,
        bonus_xp_on_streak: data.bonusXpOnStreak || 0,
        is_active: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Initialize streak record
    await db
      .insertInto('habit_streaks')
      .values({
        habit_id: habit.id,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
      })
      .execute();

    logger.info(`Created new habit: ${habit.name} for user ${userId}`);
    return this.mapHabitFromDb(habit);
  }

  /**
   * Create habit from template
   */
  async createHabitFromTemplate(userId: string, templateId: string): Promise<HabitDefinition> {
    const template = await db
      .selectFrom('habit_templates')
      .selectAll()
      .where('id', '=', templateId)
      .executeTakeFirst();

    if (!template) {
      throw new Error('Template not found');
    }

    return this.createHabit(userId, {
      name: template.name,
      description: template.description || undefined,
      category: template.category as any,
      icon: template.icon || undefined,
      frequencyType: template.suggested_frequency as any,
      frequencyTarget: template.suggested_target || undefined,
      hasTarget: !!template.suggested_target,
      targetValue: template.suggested_target || undefined,
      targetUnit: template.suggested_target_unit || undefined,
      xpReward: template.base_xp_reward,
      bonusXpOnStreak: 0,
    });
  }

  /**
   * Update a habit
   */
  async updateHabit(
    habitId: string,
    userId: string,
    data: UpdateHabitDto
  ): Promise<HabitDefinition> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.frequencyType !== undefined) updateData.frequency_type = data.frequencyType;
    if (data.frequencyTarget !== undefined) updateData.frequency_target = data.frequencyTarget;
    if (data.frequencyDays !== undefined)
      updateData.frequency_days = JSON.stringify(data.frequencyDays);
    if (data.hasTarget !== undefined) updateData.has_target = data.hasTarget;
    if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
    if (data.targetUnit !== undefined) updateData.target_unit = data.targetUnit;
    if (data.xpReward !== undefined) updateData.xp_reward = data.xpReward;
    if (data.bonusXpOnStreak !== undefined)
      updateData.bonus_xp_on_streak = data.bonusXpOnStreak;
    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
      if (!data.isActive) {
        updateData.archived_at = new Date();
      } else {
        updateData.archived_at = null;
      }
    }

    const habit = await db
      .updateTable('habit_definitions')
      .set(updateData)
      .where('id', '=', habitId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Updated habit: ${habitId}`);
    return this.mapHabitFromDb(habit);
  }

  /**
   * Delete a habit (soft delete - archive)
   */
  async deleteHabit(habitId: string, userId: string): Promise<void> {
    await db
      .updateTable('habit_definitions')
      .set({
        is_active: false,
        archived_at: new Date(),
      })
      .where('id', '=', habitId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(`Archived habit: ${habitId}`);
  }

  /**
   * Complete a habit
   */
  async completeHabit(userId: string, data: CompleteHabitDto): Promise<HabitCompletionResult> {
    const { habitId, completedDate, actualValue, notes, qualityRating } = data;

    // Get habit
    const habit = await this.getHabitById(habitId, userId);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Use provided date or today
    const dateStr = completedDate || new Date().toISOString().split('T')[0];

    // Check if already completed today
    const existing = await db
      .selectFrom('habit_completions')
      .selectAll()
      .where('habit_id', '=', habitId)
      .where('completed_date', '=', dateStr)
      .executeTakeFirst();

    if (existing) {
      throw new Error('Habit already completed for this date');
    }

    // Get or create streak record
    let streak = await db
      .selectFrom('habit_streaks')
      .selectAll()
      .where('habit_id', '=', habitId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!streak) {
      await db
        .insertInto('habit_streaks')
        .values({
          habit_id: habitId,
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
        })
        .execute();

      streak = await db
        .selectFrom('habit_streaks')
        .selectAll()
        .where('habit_id', '=', habitId)
        .where('user_id', '=', userId)
        .executeTakeFirstOrThrow();
    }

    // Calculate streak
    const newStreakCount = this.calculateStreak(
      streak.current_streak,
      streak.last_completion_date,
      dateStr
    );

    // Calculate XP
    const baseXp = habit.xpReward;
    const bonusXp =
      newStreakCount >= 7 && habit.bonusXpOnStreak > 0 ? habit.bonusXpOnStreak : 0;
    const totalXp = baseXp + bonusXp;

    // Create completion record
    const completion = await db
      .insertInto('habit_completions')
      .values({
        habit_id: habitId,
        user_id: userId,
        completed_date: dateStr,
        actual_value: actualValue || null,
        notes: notes || null,
        quality_rating: qualityRating || null,
        xp_earned: totalXp,
        streak_count: newStreakCount,
        bonus_xp_earned: bonusXp,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update streak
    await db
      .updateTable('habit_streaks')
      .set({
        current_streak: newStreakCount,
        longest_streak: Math.max(newStreakCount, streak.longest_streak),
        last_completion_date: dateStr,
        total_completions: streak.total_completions + 1,
      })
      .where('habit_id', '=', habitId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(
      `Completed habit: ${habitId} for user ${userId}, earned ${totalXp} XP, streak: ${newStreakCount}`
    );

    return {
      completion: this.mapCompletionFromDb(completion),
      xpEarned: totalXp,
      bonusXpEarned: bonusXp,
      newStreakCount,
      leveledUp: false, // Will be updated by gamification service
    };
  }

  /**
   * Get habit completion history
   */
  async getCompletionHistory(
    habitId: string,
    userId: string,
    limit = 30
  ): Promise<HabitCompletion[]> {
    const completions = await db
      .selectFrom('habit_completions')
      .selectAll()
      .where('habit_id', '=', habitId)
      .where('user_id', '=', userId)
      .orderBy('completed_date', 'desc')
      .limit(limit)
      .execute();

    return completions.map(this.mapCompletionFromDb);
  }

  /**
   * Get habit stats for user
   */
  async getUserHabitStats(userId: string): Promise<HabitStats> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get habit counts
    const habitCounts = await db
      .selectFrom('habit_definitions')
      .select([
        db.fn.count('id').as('total'),
        db.fn
          .count('id')
          .$if(true, (qb) => qb.filterWhere('is_active', '=', true))
          .as('active'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Get completion counts
    const todayCount = await db
      .selectFrom('habit_completions')
      .select(db.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('completed_date', '=', today)
      .executeTakeFirst();

    const weekCount = await db
      .selectFrom('habit_completions')
      .select(db.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('completed_date', '>=', weekAgo)
      .executeTakeFirst();

    const monthCount = await db
      .selectFrom('habit_completions')
      .select(db.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('completed_date', '>=', monthAgo)
      .executeTakeFirst();

    // Get longest current streak
    const longestStreak = await db
      .selectFrom('habit_streaks')
      .select('current_streak')
      .where('user_id', '=', userId)
      .orderBy('current_streak', 'desc')
      .limit(1)
      .executeTakeFirst();

    // Get total XP earned
    const totalXp = await db
      .selectFrom('habit_completions')
      .select(db.fn.sum('xp_earned').as('total_xp'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return {
      totalHabits: Number(habitCounts?.total || 0),
      activeHabits: Number(habitCounts?.active || 0),
      totalCompletionsToday: Number(todayCount?.count || 0),
      totalCompletionsThisWeek: Number(weekCount?.count || 0),
      totalCompletionsThisMonth: Number(monthCount?.count || 0),
      longestCurrentStreak: longestStreak?.current_streak || 0,
      totalXpEarnedFromHabits: Number(totalXp?.total_xp || 0),
    };
  }

  /**
   * Calculate new streak count based on last completion
   */
  private calculateStreak(
    currentStreak: number,
    lastCompletionDate: Date | null,
    newCompletionDate: string
  ): number {
    if (!lastCompletionDate) {
      return 1; // First completion
    }

    const lastDate = new Date(lastCompletionDate);
    const newDate = new Date(newCompletionDate);

    // Calculate days between
    const daysDiff = Math.floor(
      (newDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      return currentStreak + 1;
    } else if (daysDiff === 0) {
      // Same day - shouldn't happen due to unique constraint
      return currentStreak;
    } else {
      // Streak broken - start over
      return 1;
    }
  }

  /**
   * Map database row to HabitDefinition
   */
  private mapHabitFromDb(row: any): HabitDefinition {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      category: row.category,
      icon: row.icon,
      frequencyType: row.frequency_type,
      frequencyTarget: row.frequency_target,
      frequencyDays: row.frequency_days ? JSON.parse(row.frequency_days) : null,
      hasTarget: row.has_target,
      targetValue: row.target_value,
      targetUnit: row.target_unit,
      xpReward: row.xp_reward,
      bonusXpOnStreak: row.bonus_xp_on_streak,
      isActive: row.is_active,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to HabitCompletion
   */
  private mapCompletionFromDb(row: any): HabitCompletion {
    return {
      id: row.id,
      habitId: row.habit_id,
      userId: row.user_id,
      completedDate: row.completed_date,
      actualValue: row.actual_value,
      notes: row.notes,
      qualityRating: row.quality_rating,
      xpEarned: row.xp_earned,
      streakCount: row.streak_count,
      bonusXpEarned: row.bonus_xp_earned,
      completedAt: row.completed_at,
    };
  }

  /**
   * Map database row to HabitTemplate
   */
  private mapTemplateFromDb(row: any): HabitTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      icon: row.icon,
      suggestedFrequency: row.suggested_frequency,
      suggestedTarget: row.suggested_target,
      suggestedTargetUnit: row.suggested_target_unit,
      baseXpReward: row.base_xp_reward,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }
}

export const habitsService = new HabitsService();
