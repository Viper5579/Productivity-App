import { Response } from 'express';
import { canvasService } from './canvas.service';
import { CreateConnectionInput, UpdateConnectionInput } from './canvas.types';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class CanvasController {
  /**
   * Create a new Canvas connection
   * POST /api/canvas/connections
   */
  async createConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const data: CreateConnectionInput = req.body;
      const connection = await canvasService.createConnection(req.user.id, data);

      res.status(201).json({
        success: true,
        data: { connection },
        message: 'Canvas connection created successfully',
      });
    } catch (error: any) {
      logger.error('Create Canvas connection error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create Canvas connection',
      });
    }
  }

  /**
   * Get all Canvas connections for the user
   * GET /api/canvas/connections
   */
  async getConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const connections = await canvasService.getUserConnections(req.user.id);

      res.status(200).json({
        success: true,
        data: { connections },
      });
    } catch (error: any) {
      logger.error('Get Canvas connections error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get Canvas connections',
      });
    }
  }

  /**
   * Get a specific Canvas connection
   * GET /api/canvas/connections/:id
   */
  async getConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const connection = await canvasService.getConnection(req.params.id);

      if (!connection) {
        res.status(404).json({
          success: false,
          error: 'Canvas connection not found',
        });
        return;
      }

      // Verify ownership
      if (connection.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { connection },
      });
    } catch (error: any) {
      logger.error('Get Canvas connection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get Canvas connection',
      });
    }
  }

  /**
   * Update a Canvas connection
   * PATCH /api/canvas/connections/:id
   */
  async updateConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const data: UpdateConnectionInput = req.body;
      const connection = await canvasService.updateConnection(
        req.params.id,
        req.user.id,
        data
      );

      res.status(200).json({
        success: true,
        data: { connection },
        message: 'Canvas connection updated successfully',
      });
    } catch (error: any) {
      logger.error('Update Canvas connection error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update Canvas connection',
      });
    }
  }

  /**
   * Delete a Canvas connection
   * DELETE /api/canvas/connections/:id
   */
  async deleteConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await canvasService.deleteConnection(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Canvas connection deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete Canvas connection error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to delete Canvas connection',
      });
    }
  }

  /**
   * Trigger a sync for a Canvas connection
   * POST /api/canvas/connections/:id/sync
   */
  async syncConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const connection = await canvasService.getConnection(req.params.id);

      if (!connection) {
        res.status(404).json({
          success: false,
          error: 'Canvas connection not found',
        });
        return;
      }

      // Verify ownership
      if (connection.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Trigger sync (async)
      canvasService.syncConnection(req.params.id).catch((error) => {
        logger.error(`Background sync failed for connection ${req.params.id}:`, error);
      });

      res.status(202).json({
        success: true,
        message: 'Sync started',
      });
    } catch (error: any) {
      logger.error('Sync Canvas connection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start sync',
      });
    }
  }
}

export const canvasController = new CanvasController();
