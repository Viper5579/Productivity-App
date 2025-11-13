import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { encryptionService } from '../../shared/utils/encryption.service';
import { CanvasApiClient } from './canvas-api.client';
import {
  CreateConnectionInput,
  UpdateConnectionInput,
  CanvasConnection,
  SyncResult,
} from './canvas.types';

export class CanvasService {
  /**
   * Create a new Canvas connection
   */
  async createConnection(
    userId: string,
    data: CreateConnectionInput
  ): Promise<CanvasConnection> {
    // Encrypt access token before storing
    const encryptedToken = encryptionService.encrypt(data.accessToken);

    // Test connection before saving
    const client = new CanvasApiClient(data.canvasUrl, data.accessToken);
    const isValid = await client.testConnection();

    if (!isValid) {
      throw new Error('Invalid Canvas credentials or URL');
    }

    // Get Canvas user ID
    const canvasUser = await client.getCurrentUser();

    // Create connection
    const connection = await db
      .insertInto('canvas_connections')
      .values({
        user_id: userId,
        canvas_url: data.canvasUrl,
        canvas_user_id: String(canvasUser.id),
        access_token_encrypted: encryptedToken,
        is_active: true,
      })
      .returning([
        'id',
        'user_id',
        'canvas_url',
        'canvas_user_id',
        'is_active',
        'last_sync_at',
        'last_sync_status',
        'last_sync_error',
        'created_at',
        'updated_at',
      ])
      .executeTakeFirstOrThrow();

    logger.info(`Created Canvas connection for user ${userId}`);

    // Trigger initial sync (async, don't wait)
    this.syncConnection(connection.id).catch((error) => {
      logger.error(`Failed to trigger initial sync for connection ${connection.id}:`, error);
    });

    return this.mapConnectionFromDb(connection);
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId: string): Promise<CanvasConnection[]> {
    const connections = await db
      .selectFrom('canvas_connections')
      .select([
        'id',
        'user_id',
        'canvas_url',
        'canvas_user_id',
        'is_active',
        'last_sync_at',
        'last_sync_status',
        'last_sync_error',
        'created_at',
        'updated_at',
      ])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();

    return connections.map(this.mapConnectionFromDb);
  }

  /**
   * Get a specific connection
   */
  async getConnection(connectionId: string): Promise<CanvasConnection | null> {
    const connection = await db
      .selectFrom('canvas_connections')
      .select([
        'id',
        'user_id',
        'canvas_url',
        'canvas_user_id',
        'is_active',
        'last_sync_at',
        'last_sync_status',
        'last_sync_error',
        'created_at',
        'updated_at',
      ])
      .where('id', '=', connectionId)
      .executeTakeFirst();

    return connection ? this.mapConnectionFromDb(connection) : null;
  }

  /**
   * Update a Canvas connection
   */
  async updateConnection(
    connectionId: string,
    userId: string,
    data: UpdateConnectionInput
  ): Promise<CanvasConnection> {
    const updateData: any = {};

    if (data.canvasUrl) {
      updateData.canvas_url = data.canvasUrl;
    }

    if (data.accessToken) {
      updateData.access_token_encrypted = encryptionService.encrypt(data.accessToken);
    }

    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
    }

    const connection = await db
      .updateTable('canvas_connections')
      .set(updateData)
      .where('id', '=', connectionId)
      .where('user_id', '=', userId)
      .returning([
        'id',
        'user_id',
        'canvas_url',
        'canvas_user_id',
        'is_active',
        'last_sync_at',
        'last_sync_status',
        'last_sync_error',
        'created_at',
        'updated_at',
      ])
      .executeTakeFirstOrThrow();

    logger.info(`Updated Canvas connection ${connectionId}`);

    return this.mapConnectionFromDb(connection);
  }

  /**
   * Delete a Canvas connection
   */
  async deleteConnection(connectionId: string, userId: string): Promise<void> {
    await db
      .deleteFrom('canvas_connections')
      .where('id', '=', connectionId)
      .where('user_id', '=', userId)
      .execute();

    logger.info(`Deleted Canvas connection ${connectionId}`);
  }

  /**
   * Sync a Canvas connection (fetch courses and assignments)
   */
  async syncConnection(connectionId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      coursesProcessed: 0,
      assignmentsProcessed: 0,
      errors: [],
    };

    try {
      // Get connection with encrypted token
      const connection = await db
        .selectFrom('canvas_connections')
        .select(['id', 'canvas_url', 'access_token_encrypted', 'user_id'])
        .where('id', '=', connectionId)
        .executeTakeFirst();

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Update sync status to in_progress
      await this.updateSyncStatus(connectionId, 'in_progress', null);

      // Decrypt token
      const accessToken = encryptionService.decrypt(connection.access_token_encrypted);

      // Create Canvas API client
      const client = new CanvasApiClient(connection.canvas_url, accessToken);

      // Fetch and store courses
      const courses = await client.getCourses();
      logger.info(`Fetched ${courses.length} courses for connection ${connectionId}`);

      for (const course of courses) {
        try {
          // Upsert course
          await db
            .insertInto('canvas_courses')
            .values({
              connection_id: connectionId,
              canvas_course_id: String(course.id),
              name: course.name,
              course_code: course.course_code || null,
              start_at: course.start_at ? new Date(course.start_at) : null,
              end_at: course.end_at ? new Date(course.end_at) : null,
              is_active: course.workflow_state === 'available',
            })
            .onConflict((oc) =>
              oc.columns(['connection_id', 'canvas_course_id']).doUpdateSet({
                name: course.name,
                course_code: course.course_code || null,
                start_at: course.start_at ? new Date(course.start_at) : null,
                end_at: course.end_at ? new Date(course.end_at) : null,
                is_active: course.workflow_state === 'available',
              })
            )
            .execute();

          result.coursesProcessed++;

          // Fetch assignments for this course
          const assignments = await client.getCourseAssignments(course.id);
          logger.info(
            `Fetched ${assignments.length} assignments for course ${course.id}`
          );

          // Get course UUID for foreign key
          const dbCourse = await db
            .selectFrom('canvas_courses')
            .select(['id'])
            .where('connection_id', '=', connectionId)
            .where('canvas_course_id', '=', String(course.id))
            .executeTakeFirstOrThrow();

          for (const assignment of assignments) {
            try {
              // Upsert assignment
              await db
                .insertInto('canvas_raw_assignments')
                .values({
                  course_id: dbCourse.id,
                  canvas_assignment_id: String(assignment.id),
                  name: assignment.name,
                  description: assignment.description || null,
                  due_at: assignment.due_at ? new Date(assignment.due_at) : null,
                  points_possible: assignment.points_possible || null,
                  assignment_type: assignment.submission_types?.[0] || null,
                  html_url: assignment.html_url || null,
                  is_published: assignment.published !== false,
                  raw_data: assignment,
                })
                .onConflict((oc) =>
                  oc.columns(['course_id', 'canvas_assignment_id']).doUpdateSet({
                    name: assignment.name,
                    description: assignment.description || null,
                    due_at: assignment.due_at ? new Date(assignment.due_at) : null,
                    points_possible: assignment.points_possible || null,
                    assignment_type: assignment.submission_types?.[0] || null,
                    html_url: assignment.html_url || null,
                    is_published: assignment.published !== false,
                    raw_data: assignment,
                  })
                )
                .execute();

              result.assignmentsProcessed++;
            } catch (error) {
              logger.error(`Failed to store assignment ${assignment.id}:`, error);
              result.errors.push(`Assignment ${assignment.id}: ${error}`);
            }
          }
        } catch (error) {
          logger.error(`Failed to process course ${course.id}:`, error);
          result.errors.push(`Course ${course.id}: ${error}`);
        }
      }

      // Update sync status to success
      await this.updateSyncStatus(connectionId, 'success', null);

      result.success = result.errors.length === 0;

      logger.info(
        `Sync completed for connection ${connectionId}: ${result.coursesProcessed} courses, ${result.assignmentsProcessed} assignments`
      );

      return result;
    } catch (error: any) {
      logger.error(`Sync failed for connection ${connectionId}:`, error);
      await this.updateSyncStatus(connectionId, 'failed', error.message);

      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Update sync status for a connection
   */
  private async updateSyncStatus(
    connectionId: string,
    status: string,
    error: string | null
  ): Promise<void> {
    await db
      .updateTable('canvas_connections')
      .set({
        last_sync_at: new Date(),
        last_sync_status: status,
        last_sync_error: error,
      })
      .where('id', '=', connectionId)
      .execute();
  }

  /**
   * Map database connection to CanvasConnection type
   */
  private mapConnectionFromDb(connection: any): CanvasConnection {
    return {
      id: connection.id,
      userId: connection.user_id,
      canvasUrl: connection.canvas_url,
      canvasUserId: connection.canvas_user_id,
      isActive: connection.is_active,
      lastSyncAt: connection.last_sync_at,
      lastSyncStatus: connection.last_sync_status,
      lastSyncError: connection.last_sync_error,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
    };
  }
}

export const canvasService = new CanvasService();
