/**
 * Database table type definitions for Kysely
 * These should match the database schema
 */

import { ColumnType } from 'kysely';

// Helper type for timestamp columns
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

// ============================================================================
// AUTH MODULE TABLES
// ============================================================================

export interface UsersTable {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_login_at: Timestamp | null;
}

export interface UserSessionsTable {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Timestamp;
  created_at: Timestamp;
  ip_address: string | null;
  user_agent: string | null;
}

// ============================================================================
// CANVAS MODULE TABLES
// ============================================================================

export interface CanvasConnectionsTable {
  id: string;
  user_id: string;
  canvas_url: string;
  canvas_user_id: string | null;
  access_token_encrypted: string;
  is_active: boolean;
  last_sync_at: Timestamp | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CanvasCoursesTable {
  id: string;
  connection_id: string;
  canvas_course_id: string;
  name: string;
  course_code: string | null;
  start_at: Timestamp | null;
  end_at: Timestamp | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CanvasRawAssignmentsTable {
  id: string;
  course_id: string;
  canvas_assignment_id: string;
  name: string;
  description: string | null;
  due_at: Timestamp | null;
  points_possible: number | null;
  assignment_type: string | null;
  html_url: string | null;
  is_published: boolean;
  raw_data: any; // JSONB
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// ASSIGNMENTS MODULE TABLES
// ============================================================================

export interface AssignmentsTable {
  id: string;
  user_id: string;
  raw_assignment_id: string | null;
  title: string;
  description: string | null;
  due_date: Timestamp | null;
  points_possible: number | null;
  course_name: string | null;
  assignment_type: string | null;
  external_url: string | null;
  is_completed: boolean;
  completed_at: Timestamp | null;
  is_filtered_out: boolean;
  filter_reason: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AssignmentCompletionsTable {
  id: string;
  assignment_id: string;
  user_id: string;
  completed_at: Timestamp;
  days_before_due: number | null;
  quality_rating: number | null;
  time_spent_minutes: number | null;
  notes: string | null;
}

export interface AssignmentFilterPatternsTable {
  id: string;
  user_id: string;
  pattern_type: string;
  pattern_value: string;
  action: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// SYNC TRACKING TABLES
// ============================================================================

export interface SyncHistoryTable {
  id: string;
  connection_id: string;
  started_at: Timestamp;
  completed_at: Timestamp | null;
  status: string;
  courses_synced: number;
  assignments_synced: number;
  error_message: string | null;
  error_details: any; // JSONB
}

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  users: UsersTable;
  user_sessions: UserSessionsTable;
  canvas_connections: CanvasConnectionsTable;
  canvas_courses: CanvasCoursesTable;
  canvas_raw_assignments: CanvasRawAssignmentsTable;
  assignments: AssignmentsTable;
  assignment_completions: AssignmentCompletionsTable;
  assignment_filter_patterns: AssignmentFilterPatternsTable;
  sync_history: SyncHistoryTable;
}
