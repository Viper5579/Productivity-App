import { db } from '../../core/database';
import { logger } from '../../core/logger';
import { config } from '../../core/config';
import { canvasService } from './canvas.service';
import { assignmentsService } from '../assignments/assignments.service';

/**
 * Background worker for Canvas synchronization
 * Runs periodically to sync all active Canvas connections
 */
export class CanvasSyncWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the sync worker
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Canvas sync worker already running');
      return;
    }

    const intervalMs = config.canvasSyncIntervalMinutes * 60 * 1000;

    logger.info(
      `Starting Canvas sync worker (interval: ${config.canvasSyncIntervalMinutes} minutes)`
    );

    // Run immediately on start
    this.syncAllConnections();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.syncAllConnections();
    }, intervalMs);
  }

  /**
   * Stop the sync worker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Canvas sync worker stopped');
    }
  }

  /**
   * Sync all active Canvas connections
   */
  private async syncAllConnections(): Promise<void> {
    if (this.isRunning) {
      logger.info('Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      logger.info('Starting background Canvas sync...');

      // Get all active connections
      const connections = await db
        .selectFrom('canvas_connections')
        .select(['id', 'user_id', 'canvas_url'])
        .where('is_active', '=', true)
        .execute();

      logger.info(`Found ${connections.length} active Canvas connections to sync`);

      let successCount = 0;
      let failureCount = 0;

      // Sync each connection
      for (const connection of connections) {
        try {
          logger.info(`Syncing connection ${connection.id}...`);
          const result = await canvasService.syncConnection(connection.id);

          if (result.success) {
            successCount++;
            logger.info(
              `Successfully synced connection ${connection.id}: ${result.coursesProcessed} courses, ${result.assignmentsProcessed} assignments`
            );

            // Process assignments after successful sync
            try {
              await assignmentsService.processRawAssignments(connection.user_id);
              logger.info(`Processed assignments for user ${connection.user_id}`);
            } catch (error) {
              logger.error(`Failed to process assignments for user ${connection.user_id}:`, error);
            }
          } else {
            failureCount++;
            logger.error(
              `Sync failed for connection ${connection.id}: ${result.errors.join(', ')}`
            );
          }

          // Add a small delay between connections to avoid rate limiting
          await this.delay(2000); // 2 seconds
        } catch (error) {
          failureCount++;
          logger.error(`Error syncing connection ${connection.id}:`, error);
        }
      }

      logger.info(
        `Background Canvas sync completed: ${successCount} successful, ${failureCount} failed`
      );
    } catch (error) {
      logger.error('Background Canvas sync error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Trigger a manual sync (useful for testing)
   */
  async manualSync(): Promise<void> {
    await this.syncAllConnections();
  }
}

export const canvasSyncWorker = new CanvasSyncWorker();
