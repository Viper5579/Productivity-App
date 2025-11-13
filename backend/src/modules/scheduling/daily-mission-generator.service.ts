/**
 * Daily Mission Generator Service
 * Generates prioritized daily task lists from assignments and habits
 */

import { db } from '../../core/database';
import { priorityCalculatorService } from './priority-calculator.service';
import {
  DailyMissionWithItems,
  MissionGenerationResult,
  GenerateDailyMissionDto,
  PrioritySettings,
  MissionItem,
} from './scheduling.types';
import { logger } from '../../core/logger';

export class DailyMissionGeneratorService {
  /**
   * Generate daily mission for a user
   */
  async generateDailyMission(
    userId: string,
    options: GenerateDailyMissionDto = {}
  ): Promise<MissionGenerationResult> {
    const { date, maxItems = 10 } = options;
    const missionDate = date || new Date().toISOString().split('T')[0];

    // Check if mission already exists
    const existingMission = await db
      .selectFrom('daily_missions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('mission_date', '=', missionDate)
      .executeTakeFirst();

    if (existingMission) {
      // Return existing mission with items
      return this.getMissionWithItems(existingMission.id);
    }

    // Get user priority settings
    const settings = await this.getOrCreatePrioritySettings(userId);

    // Get candidate items (assignments + habits)
    const candidateItems = await this.getCandidateItems(userId, missionDate);

    // Calculate priorities for all items
    const itemsWithPriority = candidateItems
      .map((item) => {
        const priority = priorityCalculatorService.calculatePriority({
          itemType: item.type,
          title: item.title,
          description: item.description || undefined,
          dueDate: item.dueDate || undefined,
          pointsPossible: item.pointsPossible || undefined,
          estimatedDuration: item.estimatedDuration || undefined,
          xpReward: item.xpReward || undefined,
          userSettings: settings,
        });

        return {
          ...item,
          priorityScore: priority.score,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, maxItems);

    // Create mission
    const totalXp = itemsWithPriority.reduce((sum, item) => sum + (item.xpReward || 0), 0);

    const mission = await db
      .insertInto('daily_missions')
      .values({
        user_id: userId,
        mission_date: missionDate,
        is_generated: true,
        is_completed: false,
        completion_percentage: 0,
        total_items: itemsWithPriority.length,
        completed_items: 0,
        total_xp_available: totalXp,
        xp_earned: 0,
        generated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create mission items
    const missionItems: MissionItem[] = [];

    for (let i = 0; i < itemsWithPriority.length; i++) {
      const item = itemsWithPriority[i];

      const missionItem = await db
        .insertInto('mission_items')
        .values({
          mission_id: mission.id,
          user_id: userId,
          item_type: item.type,
          assignment_id: item.assignmentId || null,
          habit_id: item.habitId || null,
          priority_score: item.priorityScore,
          sort_order: i,
          title: item.title,
          description: item.description || null,
          estimated_duration_minutes: item.estimatedDuration || null,
          xp_reward: item.xpReward || 0,
          is_completed: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      missionItems.push(this.mapMissionItemFromDb(missionItem));
    }

    logger.info(
      `Generated daily mission for user ${userId} on ${missionDate} with ${missionItems.length} items`
    );

    return {
      mission: {
        ...this.mapMissionFromDb(mission),
        items: missionItems,
      },
      itemsGenerated: missionItems.length,
      totalXpAvailable: totalXp,
    };
  }

  /**
   * Get today's mission for user
   */
  async getTodaysMission(userId: string): Promise<DailyMissionWithItems | null> {
    const today = new Date().toISOString().split('T')[0];

    const mission = await db
      .selectFrom('daily_missions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('mission_date', '=', today)
      .executeTakeFirst();

    if (!mission) {
      return null;
    }

    return this.getMissionWithItems(mission.id);
  }

  /**
   * Get mission with all its items
   */
  async getMissionWithItems(missionId: string): Promise<DailyMissionWithItems> {
    const mission = await db
      .selectFrom('daily_missions')
      .selectAll()
      .where('id', '=', missionId)
      .executeTakeFirstOrThrow();

    const items = await db
      .selectFrom('mission_items')
      .selectAll()
      .where('mission_id', '=', missionId)
      .orderBy('sort_order', 'asc')
      .execute();

    return {
      ...this.mapMissionFromDb(mission),
      items: items.map(this.mapMissionItemFromDb),
    };
  }

  /**
   * Mark mission item as completed
   */
  async completeMissionItem(missionItemId: string, userId: string): Promise<void> {
    // Update mission item
    await db
      .updateTable('mission_items')
      .set({
        is_completed: true,
        completed_at: new Date(),
      })
      .where('id', '=', missionItemId)
      .where('user_id', '=', userId)
      .execute();

    // Get mission item to get mission ID and XP
    const item = await db
      .selectFrom('mission_items')
      .selectAll()
      .where('id', '=', missionItemId)
      .executeTakeFirstOrThrow();

    // Update mission stats
    const mission = await db
      .selectFrom('daily_missions')
      .selectAll()
      .where('id', '=', item.mission_id)
      .executeTakeFirstOrThrow();

    const newCompletedCount = mission.completed_items + 1;
    const newXpEarned = mission.xp_earned + item.xp_reward;
    const newPercentage = Math.round((newCompletedCount / mission.total_items) * 100);
    const isFullyCompleted = newCompletedCount >= mission.total_items;

    await db
      .updateTable('daily_missions')
      .set({
        completed_items: newCompletedCount,
        xp_earned: newXpEarned,
        completion_percentage: newPercentage,
        is_completed: isFullyCompleted,
        completed_at: isFullyCompleted ? new Date() : null,
      })
      .where('id', '=', item.mission_id)
      .execute();

    logger.info(
      `Completed mission item ${missionItemId}, mission ${item.mission_id} now ${newPercentage}% complete`
    );
  }

  /**
   * Get or create user priority settings
   */
  private async getOrCreatePrioritySettings(userId: string): Promise<PrioritySettings> {
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

    return this.mapSettingsFromDb(settings);
  }

  /**
   * Get candidate items for daily mission (assignments + habits)
   */
  private async getCandidateItems(
    userId: string,
    date: string
  ): Promise<
    Array<{
      type: 'assignment' | 'habit';
      title: string;
      description: string | null;
      dueDate: Date | null;
      pointsPossible: number | null;
      estimatedDuration: number | null;
      xpReward: number | null;
      assignmentId?: string;
      habitId?: string;
    }>
  > {
    const items: any[] = [];

    // Get incomplete assignments (not completed and not filtered out)
    const assignments = await db
      .selectFrom('assignments')
      .select(['id', 'title', 'description', 'due_date', 'points_possible'])
      .where('user_id', '=', userId)
      .where('is_completed', '=', false)
      .where('is_filtered_out', '=', false)
      .execute();

    for (const assignment of assignments) {
      // Estimate XP based on points
      const estimatedXp = assignment.points_possible
        ? Math.max(Math.floor(assignment.points_possible * 10), 100)
        : 100;

      // Estimate duration based on points (rough heuristic: 1 point = 5 minutes)
      const estimatedDuration = assignment.points_possible
        ? Math.min(assignment.points_possible * 5, 180) // Cap at 3 hours
        : 60;

      items.push({
        type: 'assignment' as const,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        pointsPossible: assignment.points_possible,
        estimatedDuration,
        xpReward: estimatedXp,
        assignmentId: assignment.id,
      });
    }

    // Get active habits not completed today
    const habits = await db
      .selectFrom('habit_definitions as hd')
      .leftJoin('habit_completions as hc', (join) =>
        join
          .onRef('hc.habit_id', '=', 'hd.id')
          .onRef('hc.user_id', '=', 'hd.user_id')
          .on('hc.completed_date', '=', date)
      )
      .select([
        'hd.id',
        'hd.name',
        'hd.description',
        'hd.target_value',
        'hd.target_unit',
        'hd.xp_reward',
      ])
      .where('hd.user_id', '=', userId)
      .where('hd.is_active', '=', true)
      .where('hc.id', 'is', null) // Not completed today
      .execute();

    for (const habit of habits) {
      items.push({
        type: 'habit' as const,
        title: habit.name,
        description: habit.description,
        dueDate: null, // Habits don't have due dates
        pointsPossible: null,
        estimatedDuration: habit.target_value || 30, // Use target or default
        xpReward: habit.xp_reward,
        habitId: habit.id,
      });
    }

    return items;
  }

  /**
   * Map database row to PrioritySettings
   */
  private mapSettingsFromDb(row: any): PrioritySettings {
    return {
      id: row.id,
      userId: row.user_id,
      dueDateWeight: row.due_date_weight,
      difficultyWeight: row.difficulty_weight,
      importanceWeight: row.importance_weight,
      estimatedTimeWeight: row.estimated_time_weight,
      preferMorningTasks: row.prefer_morning_tasks,
      preferQuickWins: row.prefer_quick_wins,
      preferHighXp: row.prefer_high_xp,
      workStartTime: row.work_start_time,
      workEndTime: row.work_end_time,
      breakDurationMinutes: row.break_duration_minutes,
      focusBlockDurationMinutes: row.focus_block_duration_minutes,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to DailyMission
   */
  private mapMissionFromDb(row: any): any {
    return {
      id: row.id,
      userId: row.user_id,
      missionDate: row.mission_date,
      isGenerated: row.is_generated,
      isCompleted: row.is_completed,
      completionPercentage: row.completion_percentage,
      totalItems: row.total_items,
      completedItems: row.completed_items,
      totalXpAvailable: row.total_xp_available,
      xpEarned: row.xp_earned,
      generatedAt: row.generated_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Map database row to MissionItem
   */
  private mapMissionItemFromDb(row: any): MissionItem {
    return {
      id: row.id,
      missionId: row.mission_id,
      userId: row.user_id,
      itemType: row.item_type,
      assignmentId: row.assignment_id,
      habitId: row.habit_id,
      priorityScore: Number(row.priority_score),
      sortOrder: row.sort_order,
      title: row.title,
      description: row.description,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      xpReward: row.xp_reward,
      isCompleted: row.is_completed,
      completedAt: row.completed_at,
      timeBlockId: row.time_block_id,
      createdAt: row.created_at,
    };
  }
}

export const dailyMissionGeneratorService = new DailyMissionGeneratorService();
