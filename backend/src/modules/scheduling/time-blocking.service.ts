/**
 * Time Blocking Service
 * Manages time blocks and auto-scheduling
 */

import { db } from '../../core/database';
import {
  TimeBlock,
  TimeBlockWithItem,
  CreateTimeBlockDto,
  UpdateTimeBlockDto,
} from './scheduling.types';
import { logger } from '../../core/logger';

export class TimeBlockingService {
  /**
   * Get all time blocks for a user on a specific date
   */
  async getTimeBlocks(userId: string, date: string): Promise<TimeBlockWithItem[]> {
    const blocks = await db
      .selectFrom('time_blocks as tb')
      .leftJoin('mission_items as mi', 'mi.id', 'tb.mission_item_id')
      .select([
        'tb.id',
        'tb.user_id',
        'tb.block_date',
        'tb.start_time',
        'tb.end_time',
        'tb.block_type',
        'tb.mission_item_id',
        'tb.title',
        'tb.description',
        'tb.color',
        'tb.is_completed',
        'tb.completed_at',
        'tb.created_at',
        'tb.updated_at',
        'mi.item_type',
        'mi.assignment_id',
        'mi.habit_id',
        'mi.priority_score',
        'mi.xp_reward',
      ])
      .where('tb.user_id', '=', userId)
      .where('tb.block_date', '=', date)
      .orderBy('tb.start_time', 'asc')
      .execute();

    return blocks.map((row) => ({
      id: row.id,
      userId: row.user_id,
      blockDate: row.block_date,
      startTime: row.start_time,
      endTime: row.end_time,
      blockType: row.block_type as any,
      missionItemId: row.mission_item_id,
      title: row.title,
      description: row.description,
      color: row.color,
      isCompleted: row.is_completed,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      missionItem: row.mission_item_id
        ? {
            id: row.mission_item_id,
            itemType: row.item_type as any,
            assignmentId: row.assignment_id,
            habitId: row.habit_id,
            priorityScore: Number(row.priority_score || 0),
            xpReward: row.xp_reward || 0,
            title: row.title,
            description: row.description,
          }
        : undefined,
    }));
  }

  /**
   * Get time blocks for a date range
   */
  async getTimeBlocksInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeBlockWithItem[]> {
    const blocks = await db
      .selectFrom('time_blocks as tb')
      .leftJoin('mission_items as mi', 'mi.id', 'tb.mission_item_id')
      .select([
        'tb.id',
        'tb.user_id',
        'tb.block_date',
        'tb.start_time',
        'tb.end_time',
        'tb.block_type',
        'tb.mission_item_id',
        'tb.title',
        'tb.description',
        'tb.color',
        'tb.is_completed',
        'tb.completed_at',
        'tb.created_at',
        'tb.updated_at',
      ])
      .where('tb.user_id', '=', userId)
      .where('tb.block_date', '>=', startDate)
      .where('tb.block_date', '<=', endDate)
      .orderBy('tb.start_time', 'asc')
      .execute();

    return blocks.map(this.mapTimeBlockFromDb);
  }

  /**
   * Create a new time block
   */
  async createTimeBlock(userId: string, data: CreateTimeBlockDto): Promise<TimeBlock> {
    // Check for conflicts
    const conflicts = await this.checkConflicts(
      userId,
      data.blockDate,
      new Date(data.startTime),
      new Date(data.endTime)
    );

    if (conflicts.length > 0) {
      throw new Error(
        `Time block conflicts with existing blocks: ${conflicts.map((c) => c.title).join(', ')}`
      );
    }

    const block = await db
      .insertInto('time_blocks')
      .values({
        user_id: userId,
        block_date: data.blockDate,
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        block_type: data.blockType,
        mission_item_id: data.missionItemId || null,
        title: data.title,
        description: data.description || null,
        color: data.color || this.getDefaultColorForType(data.blockType),
        is_completed: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // If linked to a mission item, update the mission item
    if (data.missionItemId) {
      await db
        .updateTable('mission_items')
        .set({ time_block_id: block.id })
        .where('id', '=', data.missionItemId)
        .execute();
    }

    logger.info(`Created time block: ${block.title} for user ${userId}`);
    return this.mapTimeBlockFromDb(block);
  }

  /**
   * Update a time block
   */
  async updateTimeBlock(
    blockId: string,
    userId: string,
    data: UpdateTimeBlockDto
  ): Promise<TimeBlock> {
    const updateData: any = {};

    if (data.startTime !== undefined) updateData.start_time = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.end_time = new Date(data.endTime);
    if (data.blockType !== undefined) updateData.block_type = data.blockType;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isCompleted !== undefined) {
      updateData.is_completed = data.isCompleted;
      if (data.isCompleted) {
        updateData.completed_at = new Date();
      } else {
        updateData.completed_at = null;
      }
    }

    // If updating time, check for conflicts
    if (data.startTime || data.endTime) {
      const currentBlock = await db
        .selectFrom('time_blocks')
        .selectAll()
        .where('id', '=', blockId)
        .executeTakeFirst();

      if (currentBlock) {
        const startTime = data.startTime ? new Date(data.startTime) : currentBlock.start_time;
        const endTime = data.endTime ? new Date(data.endTime) : currentBlock.end_time;

        const conflicts = await this.checkConflicts(
          userId,
          currentBlock.block_date.toISOString().split('T')[0],
          startTime,
          endTime,
          blockId // Exclude current block from conflict check
        );

        if (conflicts.length > 0) {
          throw new Error(
            `Time block conflicts with existing blocks: ${conflicts.map((c) => c.title).join(', ')}`
          );
        }
      }
    }

    const block = await db
      .updateTable('time_blocks')
      .set(updateData)
      .where('id', '=', blockId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Updated time block: ${blockId}`);
    return this.mapTimeBlockFromDb(block);
  }

  /**
   * Delete a time block
   */
  async deleteTimeBlock(blockId: string, userId: string): Promise<void> {
    // Unlink mission item if exists
    await db
      .updateTable('mission_items')
      .set({ time_block_id: null })
      .where('time_block_id', '=', blockId)
      .execute();

    await db
      .deleteFrom('time_blocks')
      .where('id', '=', blockId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(`Deleted time block: ${blockId}`);
  }

  /**
   * Auto-schedule mission items into time blocks
   */
  async autoScheduleMissionItems(
    userId: string,
    missionId: string,
    date: string
  ): Promise<TimeBlock[]> {
    // Get user settings
    const settings = await db
      .selectFrom('priority_settings')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!settings) {
      throw new Error('User priority settings not found');
    }

    // Get unscheduled mission items
    const items = await db
      .selectFrom('mission_items')
      .selectAll()
      .where('mission_id', '=', missionId)
      .where('is_completed', '=', false)
      .where('time_block_id', 'is', null)
      .orderBy('priority_score', 'desc')
      .execute();

    if (items.length === 0) {
      return [];
    }

    // Get existing blocks for the day
    const existingBlocks = await this.getTimeBlocks(userId, date);

    // Generate time slots
    const workStart = settings.work_start_time || '09:00';
    const workEnd = settings.work_end_time || '17:00';
    const focusDuration = settings.focus_block_duration_minutes;
    const breakDuration = settings.break_duration_minutes;

    const availableSlots = this.generateAvailableSlots(
      date,
      workStart,
      workEnd,
      focusDuration,
      breakDuration,
      existingBlocks
    );

    const createdBlocks: TimeBlock[] = [];

    for (let i = 0; i < items.length && i < availableSlots.length; i++) {
      const item = items[i];
      const slot = availableSlots[i];

      try {
        const block = await this.createTimeBlock(userId, {
          blockDate: date,
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
          blockType: 'task',
          missionItemId: item.id,
          title: item.title,
          description: item.description || undefined,
        });

        createdBlocks.push(block);
      } catch (error) {
        logger.warn(`Failed to schedule item ${item.id}:`, error);
      }
    }

    logger.info(
      `Auto-scheduled ${createdBlocks.length} items for mission ${missionId} on ${date}`
    );
    return createdBlocks;
  }

  /**
   * Check for time block conflicts
   */
  private async checkConflicts(
    userId: string,
    date: string,
    startTime: Date,
    endTime: Date,
    excludeBlockId?: string
  ): Promise<TimeBlock[]> {
    let query = db
      .selectFrom('time_blocks')
      .selectAll()
      .where('user_id', '=', userId)
      .where('block_date', '=', date)
      .where((eb) =>
        eb.or([
          // New block starts during existing block
          eb.and([eb('start_time', '<=', startTime), eb('end_time', '>', startTime)]),
          // New block ends during existing block
          eb.and([eb('start_time', '<', endTime), eb('end_time', '>=', endTime)]),
          // New block contains existing block
          eb.and([eb('start_time', '>=', startTime), eb('end_time', '<=', endTime)]),
        ])
      );

    if (excludeBlockId) {
      query = query.where('id', '!=', excludeBlockId);
    }

    const conflicts = await query.execute();
    return conflicts.map(this.mapTimeBlockFromDb);
  }

  /**
   * Generate available time slots
   */
  private generateAvailableSlots(
    date: string,
    workStart: string,
    workEnd: string,
    focusDuration: number,
    breakDuration: number,
    existingBlocks: TimeBlock[]
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];

    const [startHour, startMin] = workStart.split(':').map(Number);
    const [endHour, endMin] = workEnd.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + focusDuration * 60 * 1000);

      if (slotEnd > endTime) break;

      // Check if slot conflicts with existing blocks
      const hasConflict = existingBlocks.some((block) => {
        const blockStart = new Date(block.startTime);
        const blockEnd = new Date(block.endTime);
        return currentTime < blockEnd && slotEnd > blockStart;
      });

      if (!hasConflict) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
        });
      }

      // Move to next slot (with break)
      currentTime = new Date(slotEnd.getTime() + breakDuration * 60 * 1000);
    }

    return slots;
  }

  /**
   * Get default color for block type
   */
  private getDefaultColorForType(blockType: string): string {
    const colors: Record<string, string> = {
      task: '#3b82f6', // blue
      break: '#10b981', // green
      focus: '#8b5cf6', // purple
      meeting: '#f59e0b', // amber
      free: '#6b7280', // gray
    };
    return colors[blockType] || '#3b82f6';
  }

  /**
   * Map database row to TimeBlock
   */
  private mapTimeBlockFromDb(row: any): TimeBlock {
    return {
      id: row.id,
      userId: row.user_id,
      blockDate: row.block_date,
      startTime: row.start_time,
      endTime: row.end_time,
      blockType: row.block_type,
      missionItemId: row.mission_item_id,
      title: row.title,
      description: row.description,
      color: row.color,
      isCompleted: row.is_completed,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const timeBlockingService = new TimeBlockingService();
