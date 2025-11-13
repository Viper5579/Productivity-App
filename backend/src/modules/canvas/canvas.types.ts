import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const createConnectionSchema = z.object({
  canvasUrl: z.string().url('Invalid Canvas URL'),
  accessToken: z.string().min(1, 'Access token is required'),
});

export const updateConnectionSchema = z.object({
  canvasUrl: z.string().url('Invalid Canvas URL').optional(),
  accessToken: z.string().min(1, 'Access token is required').optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// Canvas API Response Types
// ============================================================================

export interface CanvasUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  start_at?: string;
  end_at?: string;
  enrollment_term_id?: number;
  workflow_state: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  assignment_group_id?: number;
  submission_types?: string[];
  html_url?: string;
  published?: boolean;
  grading_type?: string;
  [key: string]: any; // Additional fields
}

// ============================================================================
// Internal Types
// ============================================================================

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;

export interface CanvasConnection {
  id: string;
  userId: string;
  canvasUrl: string;
  canvasUserId: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasCourseData {
  id: string;
  connectionId: string;
  canvasCourseId: string;
  name: string;
  courseCode: string | null;
  startAt: Date | null;
  endAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  coursesProcessed: number;
  assignmentsProcessed: number;
  errors: string[];
}

export interface SyncJobData {
  connectionId: string;
  userId: string;
  manual?: boolean; // Whether this was triggered manually by user
}
