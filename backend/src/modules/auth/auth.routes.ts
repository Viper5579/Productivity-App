import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { registerSchema, loginSchema } from './auth.types';

const router = Router();

/**
 * Auth routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', validateBody(registerSchema), (req, res) =>
  authController.register(req, res)
);

router.post('/login', validateBody(loginSchema), (req, res) =>
  authController.login(req, res)
);

// Protected routes
router.get('/me', authenticateToken, (req, res) =>
  authController.getCurrentUser(req, res)
);

router.post('/logout', authenticateToken, (req, res) =>
  authController.logout(req, res)
);

router.get('/verify', authenticateToken, (req, res) =>
  authController.verifyToken(req, res)
);

export default router;
