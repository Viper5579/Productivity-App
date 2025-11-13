/**
 * Habits Routes
 */

import { Router } from 'express';
import { habitsController } from './habits.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

export const habitsRoutes = Router();

// All routes require authentication
habitsRoutes.use(authenticate);

// Habit templates
habitsRoutes.get('/templates', (req, res) => habitsController.getTemplates(req, res));

// Habit CRUD
habitsRoutes.get('/', (req, res) => habitsController.getUserHabits(req, res));
habitsRoutes.get('/stats', (req, res) => habitsController.getHabitStats(req, res));
habitsRoutes.get('/:id', (req, res) => habitsController.getHabitById(req, res));
habitsRoutes.post('/', (req, res) => habitsController.createHabit(req, res));
habitsRoutes.post('/from-template/:templateId', (req, res) =>
  habitsController.createFromTemplate(req, res)
);
habitsRoutes.put('/:id', (req, res) => habitsController.updateHabit(req, res));
habitsRoutes.delete('/:id', (req, res) => habitsController.deleteHabit(req, res));

// Habit completions
habitsRoutes.post('/complete', (req, res) => habitsController.completeHabit(req, res));
habitsRoutes.get('/:id/history', (req, res) => habitsController.getCompletionHistory(req, res));
