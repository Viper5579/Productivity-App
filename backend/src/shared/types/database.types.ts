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
// GAMIFICATION MODULE TABLES (Phase 2)
// ============================================================================

export interface UserXpTable {
  id: string;
  user_id: string;
  current_xp: number;
  total_xp_earned: number;
  current_level: number;
  xp_to_next_level: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface XpTransactionsTable {
  id: string;
  user_id: string;
  assignment_id: string | null;
  xp_amount: number;
  source: string;
  multiplier: number | null;
  reason: string | null;
  metadata: any; // JSONB
  created_at: Timestamp;
}

export interface LevelHistoryTable {
  id: string;
  user_id: string;
  old_level: number;
  new_level: number;
  xp_at_levelup: number;
  leveled_up_at: Timestamp;
}

export interface UserStreaksTable {
  id: string;
  user_id: string;
  current_daily_streak: number;
  longest_daily_streak: number;
  last_activity_date: Date | null;
  current_weekly_streak: number;
  longest_weekly_streak: number;
  last_weekly_activity: Date | null;
  current_monthly_streak: number;
  longest_monthly_streak: number;
  last_monthly_activity: Date | null;
  streak_shields_available: number;
  last_shield_reset_date: Date | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface StreakEventsTable {
  id: string;
  user_id: string;
  event_type: string;
  streak_type: string;
  streak_count: number;
  metadata: any; // JSONB
  created_at: Timestamp;
}

export interface AchievementDefinitionsTable {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  tier: string | null;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
  display_order: number;
  created_at: Timestamp;
}

export interface UserAchievementsTable {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Timestamp;
  progress: number | null;
  metadata: any; // JSONB
}

export interface DailyStatsTable {
  id: string;
  user_id: string;
  stat_date: Date;
  assignments_completed: number | null;
  xp_earned: number | null;
  average_early_days: number | null;
  total_points_earned: number | null;
  study_time_minutes: number | null;
  created_at: Timestamp;
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

  // Gamification tables (Phase 2)
  user_xp: UserXpTable;
  xp_transactions: XpTransactionsTable;
  level_history: LevelHistoryTable;
  user_streaks: UserStreaksTable;
  streak_events: StreakEventsTable;
  achievement_definitions: AchievementDefinitionsTable;
  user_achievements: UserAchievementsTable;
  daily_stats: DailyStatsTable;
}
