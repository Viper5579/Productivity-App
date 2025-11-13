import { Router } from 'express';
import { assignmentsController } from './assignments.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import {
  completeAssignmentSchema,
  createFilterPatternSchema,
  updateAssignmentSchema,
} from './assignments.types';

const router = Router();

/**
 * Assignments routes
 * Base path: /api/assignments
 * All routes require authentication
 */

router.use(authenticateToken);

// Assignment operations
router.get('/', (req, res) => assignmentsController.getAssignments(req, res));

router.get('/stats', (req, res) => assignmentsController.getCompletionStats(req, res));

router.post('/process', (req, res) => assignmentsController.processAssignments(req, res));

router.get('/:id', (req, res) => assignmentsController.getAssignment(req, res));

router.patch(
  '/:id',
  validateBody(updateAssignmentSchema),
  (req, res) => assignmentsController.updateAssignment(req, res)
);

router.post(
  '/:id/complete',
  validateBody(completeAssignmentSchema),
  (req, res) => assignmentsController.completeAssignment(req, res)
);

router.post('/:id/uncomplete', (req, res) =>
  assignmentsController.uncompleteAssignment(req, res)
);

// Filter pattern operations
router.get('/filters', (req, res) => assignmentsController.getFilterPatterns(req, res));

router.post(
  '/filters',
  validateBody(createFilterPatternSchema),
  (req, res) => assignmentsController.createFilterPattern(req, res)
);

router.delete('/filters/:id', (req, res) =>
  assignmentsController.deleteFilterPattern(req, res)
);

export default router;
