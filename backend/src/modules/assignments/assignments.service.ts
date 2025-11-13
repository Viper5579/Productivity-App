import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { assignmentFilterService } from './assignment-filter.service';
import {
  Assignment,
  AssignmentCompletion,
  FilterPattern,
  CompleteAssignmentInput,
  CreateFilterPatternInput,
  UpdateAssignmentInput,
  AssignmentListQuery,
} from './assignments.types';
import { differenceInDays } from 'date-fns';

export class AssignmentsService {
  /**
   * Process raw Canvas assignments and create filtered assignments
   * Called after Canvas sync
   */
  async processRawAssignments(userId: string): Promise<number> {
    try {
      // Get user's filter patterns
      const patterns = await this.getUserFilterPatterns(userId);

      // Get all raw assignments for user's connections
      const rawAssignments = await db
        .selectFrom('canvas_raw_assignments as ra')
        .innerJoin('canvas_courses as cc', 'ra.course_id', 'cc.id')
        .innerJoin('canvas_connections as con', 'cc.connection_id', 'con.id')
        .select([
          'ra.id as raw_id',
          'ra.name',
          'ra.description',
          'ra.due_at',
          'ra.points_possible',
          'ra.assignment_type',
          'ra.html_url',
          'ra.is_published',
          'cc.name as course_name',
        ])
        .where('con.user_id', '=', userId)
        .where('con.is_active', '=', true)
        .execute();

      logger.info(`Processing ${rawAssignments.length} raw assignments for user ${userId}`);

      let processedCount = 0;

      for (const raw of rawAssignments) {
        // Apply filtering
        const filterResult = assignmentFilterService.applyUserFilters(
          {
            name: raw.name,
            description: raw.description,
            points_possible: raw.points_possible,
            assignment_type: raw.assignment_type,
            course_name: raw.course_name,
          },
          patterns
        );

        // Upsert assignment
        await db
          .insertInto('assignments')
          .values({
            user_id: userId,
            raw_assignment_id: raw.raw_id,
            title: raw.name,
            description: raw.description,
            due_date: raw.due_at,
            points_possible: raw.points_possible,
            course_name: raw.course_name,
            assignment_type: raw.assignment_type,
            external_url: raw.html_url,
            is_filtered_out: !filterResult.include,
            filter_reason: filterResult.reason || null,
          })
          .onConflict((oc) =>
            oc.column('raw_assignment_id').doUpdateSet({
              title: raw.name,
              description: raw.description,
              due_date: raw.due_at,
              points_possible: raw.points_possible,
              course_name: raw.course_name,
              assignment_type: raw.assignment_type,
              external_url: raw.html_url,
              is_filtered_out: !filterResult.include,
              filter_reason: filterResult.reason || null,
            })
          )
          .execute();

        processedCount++;
      }

      logger.info(`Processed ${processedCount} assignments for user ${userId}`);
      return processedCount;
    } catch (error) {
      logger.error(`Failed to process raw assignments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get assignments for a user
   */
  async getUserAssignments(
    userId: string,
    query: AssignmentListQuery = {}
  ): Promise<Assignment[]> {
    let queryBuilder = db
      .selectFrom('assignments')
      .selectAll()
      .where('user_id', '=', userId);

    // Apply filters
    if (query.completed !== undefined) {
      queryBuilder = queryBuilder.where('is_completed', '=', query.completed);
    }

    if (!query.includeFiltered) {
      queryBuilder = queryBuilder.where('is_filtered_out', '=', false);
    }

    if (query.dueAfter) {
      queryBuilder = queryBuilder.where('due_date', '>=', query.dueAfter);
    }

    if (query.dueBefore) {
      queryBuilder = queryBuilder.where('due_date', '<=', query.dueBefore);
    }

    // Order by due date (soonest first), nulls last
    queryBuilder = queryBuilder.orderBy('due_date', 'asc');

    // Apply pagination
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.offset(query.offset);
    }

    const assignments = await queryBuilder.execute();

    return assignments.map(this.mapAssignmentFromDb);
  }

  /**
   * Get a single assignment
   */
  async getAssignment(assignmentId: string, userId: string): Promise<Assignment | null> {
    const assignment = await db
      .selectFrom('assignments')
      .selectAll()
      .where('id', '=', assignmentId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return assignment ? this.mapAssignmentFromDb(assignment) : null;
  }

  /**
   * Mark assignment as complete
   */
  async completeAssignment(
    assignmentId: string,
    userId: string,
    data: CompleteAssignmentInput
  ): Promise<AssignmentCompletion> {
    // Get assignment
    const assignment = await this.getAssignment(assignmentId, userId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.isCompleted) {
      throw new Error('Assignment already completed');
    }

    const completedAt = new Date();

    // Calculate days before due
    let daysBeforeDue: number | null = null;
    if (assignment.dueDate) {
      daysBeforeDue = differenceInDays(assignment.dueDate, completedAt);
    }

    // Mark assignment as completed
    await db
      .updateTable('assignments')
      .set({
        is_completed: true,
        completed_at: completedAt,
      })
      .where('id', '=', assignmentId)
      .execute();

    // Create completion record
    const completion = await db
      .insertInto('assignment_completions')
      .values({
        assignment_id: assignmentId,
        user_id: userId,
        completed_at: completedAt,
        days_before_due: daysBeforeDue,
        quality_rating: data.qualityRating || null,
        time_spent_minutes: data.timeSpentMinutes || null,
        notes: data.notes || null,
      })
      .returning([
        'id',
        'assignment_id',
        'user_id',
        'completed_at',
        'days_before_due',
        'quality_rating',
        'time_spent_minutes',
        'notes',
      ])
      .executeTakeFirstOrThrow();

    logger.info(`Assignment ${assignmentId} marked as completed by user ${userId}`);

    // Trigger gamification (if enabled)
    try {
      const { config } = await import('../../core/config');
      if (config.features.gamification) {
        const { gamificationService } = await import('../gamification/gamification.service');

        // Process gamification asynchronously
        gamificationService.processAssignmentCompletion({
          assignmentId,
          userId,
          pointsPossible: assignment.pointsPossible || 0,
          daysBeforeDue,
          completionQuality: data.qualityRating || null,
        }).catch((error) => {
          logger.error(`Failed to process gamification for assignment ${assignmentId}:`, error);
        });
      }
    } catch (error) {
      // Gamification module not available - that's okay
      logger.debug('Gamification not available:', error);
    }

    return this.mapCompletionFromDb(completion);
  }

  /**
   * Mark assignment as incomplete
   */
  async uncompleteAssignment(assignmentId: string, userId: string): Promise<void> {
    await db
      .updateTable('assignments')
      .set({
        is_completed: false,
        completed_at: null,
      })
      .where('id', '=', assignmentId)
      .where('user_id', '=', userId)
      .execute();

    // Delete completion records
    await db
      .deleteFrom('assignment_completions')
      .where('assignment_id', '=', assignmentId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(`Assignment ${assignmentId} marked as incomplete by user ${userId}`);
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string,
    userId: string,
    data: UpdateAssignmentInput
  ): Promise<Assignment> {
    const assignment = await db
      .updateTable('assignments')
      .set(data)
      .where('id', '=', assignmentId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapAssignmentFromDb(assignment);
  }

  /**
   * Get user's filter patterns
   */
  async getUserFilterPatterns(userId: string): Promise<FilterPattern[]> {
    const patterns = await db
      .selectFrom('assignment_filter_patterns')
      .selectAll()
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .execute();

    return patterns.map(this.mapFilterPatternFromDb);
  }

  /**
   * Create filter pattern
   */
  async createFilterPattern(
    userId: string,
    data: CreateFilterPatternInput
  ): Promise<FilterPattern> {
    const pattern = await db
      .insertInto('assignment_filter_patterns')
      .values({
        user_id: userId,
        pattern_type: data.patternType,
        pattern_value: data.patternValue,
        action: data.action,
        is_active: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Created filter pattern for user ${userId}: ${data.patternType}=${data.patternValue}`);

    // Reprocess assignments with new filter
    await this.processRawAssignments(userId);

    return this.mapFilterPatternFromDb(pattern);
  }

  /**
   * Delete filter pattern
   */
  async deleteFilterPattern(patternId: string, userId: string): Promise<void> {
    await db
      .deleteFrom('assignment_filter_patterns')
      .where('id', '=', patternId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(`Deleted filter pattern ${patternId} for user ${userId}`);

    // Reprocess assignments without this filter
    await this.processRawAssignments(userId);
  }

  /**
   * Get completion stats for a user
   */
  async getCompletionStats(userId: string): Promise<{
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
  }> {
    const now = new Date();

    // Get total assignments (not filtered out)
    const totalResult = await db
      .selectFrom('assignments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('is_filtered_out', '=', false)
      .executeTakeFirstOrThrow();

    // Get completed assignments
    const completedResult = await db
      .selectFrom('assignments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('is_filtered_out', '=', false)
      .where('is_completed', '=', true)
      .executeTakeFirstOrThrow();

    // Get overdue assignments
    const overdueResult = await db
      .selectFrom('assignments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('is_filtered_out', '=', false)
      .where('is_completed', '=', false)
      .where('due_date', '<', now)
      .executeTakeFirstOrThrow();

    const total = Number(totalResult.count);
    const completed = Number(completedResult.count);
    const overdue = Number(overdueResult.count);

    return {
      total,
      completed,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Map database assignment to Assignment type
   */
  private mapAssignmentFromDb(assignment: any): Assignment {
    return {
      id: assignment.id,
      userId: assignment.user_id,
      rawAssignmentId: assignment.raw_assignment_id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      pointsPossible: assignment.points_possible,
      courseName: assignment.course_name,
      assignmentType: assignment.assignment_type,
      externalUrl: assignment.external_url,
      isCompleted: assignment.is_completed,
      completedAt: assignment.completed_at,
      isFilteredOut: assignment.is_filtered_out,
      filterReason: assignment.filter_reason,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
    };
  }

  /**
   * Map database completion to AssignmentCompletion type
   */
  private mapCompletionFromDb(completion: any): AssignmentCompletion {
    return {
      id: completion.id,
      assignmentId: completion.assignment_id,
      userId: completion.user_id,
      completedAt: completion.completed_at,
      daysBeforeDue: completion.days_before_due,
      qualityRating: completion.quality_rating,
      timeSpentMinutes: completion.time_spent_minutes,
      notes: completion.notes,
    };
  }

  /**
   * Map database filter pattern to FilterPattern type
   */
  private mapFilterPatternFromDb(pattern: any): FilterPattern {
    return {
      id: pattern.id,
      userId: pattern.user_id,
      patternType: pattern.pattern_type,
      patternValue: pattern.pattern_value,
      action: pattern.action,
      isActive: pattern.is_active,
      createdAt: pattern.created_at,
      updatedAt: pattern.updated_at,
    };
  }
}

export const assignmentsService = new AssignmentsService();
