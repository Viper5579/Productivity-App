import { Router } from 'express';
import { canvasController } from './canvas.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { createConnectionSchema, updateConnectionSchema } from './canvas.types';

const router = Router();

/**
 * Canvas routes
 * Base path: /api/canvas
 * All routes require authentication
 */

router.use(authenticateToken);

// Connection management
router.post(
  '/connections',
  validateBody(createConnectionSchema),
  (req, res) => canvasController.createConnection(req, res)
);

router.get('/connections', (req, res) =>
  canvasController.getConnections(req, res)
);

router.get('/connections/:id', (req, res) =>
  canvasController.getConnection(req, res)
);

router.patch(
  '/connections/:id',
  validateBody(updateConnectionSchema),
  (req, res) => canvasController.updateConnection(req, res)
);

router.delete('/connections/:id', (req, res) =>
  canvasController.deleteConnection(req, res)
);

// Sync operations
router.post('/connections/:id/sync', (req, res) =>
  canvasController.syncConnection(req, res)
);

export default router;
