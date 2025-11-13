/**
 * Scheduling Routes
 */

import { Router } from 'express';
import { schedulingController } from './scheduling.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

export const schedulingRoutes = Router();

// All routes require authentication
schedulingRoutes.use(authenticate);

// Priority settings
schedulingRoutes.get('/priority-settings', (req, res) =>
  schedulingController.getPrioritySettings(req, res)
);
schedulingRoutes.put('/priority-settings', (req, res) =>
  schedulingController.updatePrioritySettings(req, res)
);

// Daily missions
schedulingRoutes.get('/missions/today', (req, res) =>
  schedulingController.getTodaysMission(req, res)
);
schedulingRoutes.post('/missions/generate', (req, res) =>
  schedulingController.generateMission(req, res)
);
schedulingRoutes.post('/missions/items/:id/complete', (req, res) =>
  schedulingController.completeMissionItem(req, res)
);

// Time blocks
schedulingRoutes.get('/time-blocks', (req, res) =>
  schedulingController.getTimeBlocks(req, res)
);
schedulingRoutes.post('/time-blocks', (req, res) =>
  schedulingController.createTimeBlock(req, res)
);
schedulingRoutes.put('/time-blocks/:id', (req, res) =>
  schedulingController.updateTimeBlock(req, res)
);
schedulingRoutes.delete('/time-blocks/:id', (req, res) =>
  schedulingController.deleteTimeBlock(req, res)
);

// Auto-scheduling
schedulingRoutes.post('/auto-schedule', (req, res) =>
  schedulingController.autoSchedule(req, res)
);
