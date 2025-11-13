import { Response } from 'express';
import { assignmentsService } from './assignments.service';
import {
  CompleteAssignmentInput,
  CreateFilterPatternInput,
  UpdateAssignmentInput,
  AssignmentListQuery,
} from './assignments.types';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class AssignmentsController {
  /**
   * Get assignments for the current user
   * GET /api/assignments
   */
  async getAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const query: AssignmentListQuery = {
        completed: req.query.completed === 'true',
        includeFiltered: req.query.includeFiltered === 'true',
        dueAfter: req.query.dueAfter ? new Date(req.query.dueAfter as string) : undefined,
        dueBefore: req.query.dueBefore ? new Date(req.query.dueBefore as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const assignments = await assignmentsService.getUserAssignments(req.user.id, query);

      res.status(200).json({
        success: true,
        data: { assignments },
      });
    } catch (error: any) {
      logger.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assignments',
      });
    }
  }

  /**
   * Get a specific assignment
   * GET /api/assignments/:id
   */
  async getAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const assignment = await assignmentsService.getAssignment(req.params.id, req.user.id);

      if (!assignment) {
        res.status(404).json({
          success: false,
          error: 'Assignment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { assignment },
      });
    } catch (error: any) {
      logger.error('Get assignment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assignment',
      });
    }
  }

  /**
   * Complete an assignment
   * POST /api/assignments/:id/complete
   */
  async completeAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const data: CompleteAssignmentInput = req.body;
      const completion = await assignmentsService.completeAssignment(
        req.params.id,
        req.user.id,
        data
      );

      res.status(200).json({
        success: true,
        data: { completion },
        message: 'Assignment marked as complete',
      });
    } catch (error: any) {
      logger.error('Complete assignment error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to complete assignment',
      });
    }
  }

  /**
   * Mark assignment as incomplete
   * POST /api/assignments/:id/uncomplete
   */
  async uncompleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await assignmentsService.uncompleteAssignment(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Assignment marked as incomplete',
      });
    } catch (error: any) {
      logger.error('Uncomplete assignment error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to uncomplete assignment',
      });
    }
  }

  /**
   * Update an assignment
   * PATCH /api/assignments/:id
   */
  async updateAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const data: UpdateAssignmentInput = req.body;
      const assignment = await assignmentsService.updateAssignment(
        req.params.id,
        req.user.id,
        data
      );

      res.status(200).json({
        success: true,
        data: { assignment },
        message: 'Assignment updated',
      });
    } catch (error: any) {
      logger.error('Update assignment error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to update assignment',
      });
    }
  }

  /**
   * Get completion stats
   * GET /api/assignments/stats
   */
  async getCompletionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const stats = await assignmentsService.getCompletionStats(req.user.id);

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error: any) {
      logger.error('Get completion stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get completion stats',
      });
    }
  }

  /**
   * Trigger assignment processing (manual)
   * POST /api/assignments/process
   */
  async processAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const count = await assignmentsService.processRawAssignments(req.user.id);

      res.status(200).json({
        success: true,
        data: { processedCount: count },
        message: 'Assignments processed',
      });
    } catch (error: any) {
      logger.error('Process assignments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process assignments',
      });
    }
  }

  /**
   * Get filter patterns
   * GET /api/assignments/filters
   */
  async getFilterPatterns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const patterns = await assignmentsService.getUserFilterPatterns(req.user.id);

      res.status(200).json({
        success: true,
        data: { patterns },
      });
    } catch (error: any) {
      logger.error('Get filter patterns error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get filter patterns',
      });
    }
  }

  /**
   * Create filter pattern
   * POST /api/assignments/filters
   */
  async createFilterPattern(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const data: CreateFilterPatternInput = req.body;
      const pattern = await assignmentsService.createFilterPattern(req.user.id, data);

      res.status(201).json({
        success: true,
        data: { pattern },
        message: 'Filter pattern created',
      });
    } catch (error: any) {
      logger.error('Create filter pattern error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to create filter pattern',
      });
    }
  }

  /**
   * Delete filter pattern
   * DELETE /api/assignments/filters/:id
   */
  async deleteFilterPattern(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await assignmentsService.deleteFilterPattern(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Filter pattern deleted',
      });
    } catch (error: any) {
      logger.error('Delete filter pattern error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to delete filter pattern',
      });
    }
  }
}

export const assignmentsController = new AssignmentsController();
