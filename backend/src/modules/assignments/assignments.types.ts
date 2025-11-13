import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const completeAssignmentSchema = z.object({
  qualityRating: z.number().int().min(1).max(5).optional(),
  timeSpentMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const createFilterPatternSchema = z.object({
  patternType: z.enum(['keyword', 'assignment_type', 'points_range', 'course_name']),
  patternValue: z.string().min(1),
  action: z.enum(['include', 'exclude']),
});

export const updateAssignmentSchema = z.object({
  isCompleted: z.boolean().optional(),
  isFilteredOut: z.boolean().optional(),
  filterReason: z.string().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CompleteAssignmentInput = z.infer<typeof completeAssignmentSchema>;
export type CreateFilterPatternInput = z.infer<typeof createFilterPatternSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export interface Assignment {
  id: string;
  userId: string;
  rawAssignmentId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  pointsPossible: number | null;
  courseName: string | null;
  assignmentType: string | null;
  externalUrl: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  isFilteredOut: boolean;
  filterReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentCompletion {
  id: string;
  assignmentId: string;
  userId: string;
  completedAt: Date;
  daysBeforeDue: number | null;
  qualityRating: number | null;
  timeSpentMinutes: number | null;
  notes: string | null;
}

export interface FilterPattern {
  id: string;
  userId: string;
  patternType: string;
  patternValue: string;
  action: 'include' | 'exclude';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentListQuery {
  completed?: boolean;
  courseId?: string;
  dueAfter?: Date;
  dueBefore?: Date;
  includeFiltered?: boolean;
  limit?: number;
  offset?: number;
}

export interface AssignmentWithCourse extends Assignment {
  courseId?: string;
  courseCode?: string;
}
