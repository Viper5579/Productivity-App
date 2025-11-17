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
// HABITS MODULE TABLES (Phase 3)
// ============================================================================

export interface HabitTemplatesTable {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  suggested_frequency: string;
  suggested_target: number | null;
  suggested_target_unit: string | null;
  base_xp_reward: number;
  is_active: boolean;
  sort_order: number;
  created_at: Timestamp;
}

export interface HabitDefinitionsTable {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  frequency_type: string;
  frequency_target: number | null;
  frequency_days: any; // JSONB
  has_target: boolean;
  target_value: number | null;
  target_unit: string | null;
  xp_reward: number;
  bonus_xp_on_streak: number;
  is_active: boolean;
  archived_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface HabitCompletionsTable {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: Date;
  actual_value: number | null;
  notes: string | null;
  quality_rating: number | null;
  xp_earned: number;
  streak_count: number;
  bonus_xp_earned: number;
  completed_at: Timestamp;
}

export interface HabitStreaksTable {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date: Date | null;
  total_completions: number;
  updated_at: Timestamp;
}

// ============================================================================
// SCHEDULING MODULE TABLES (Phase 3)
// ============================================================================

export interface PrioritySettingsTable {
  id: string;
  user_id: string;
  due_date_weight: number;
  difficulty_weight: number;
  importance_weight: number;
  estimated_time_weight: number;
  prefer_morning_tasks: boolean;
  prefer_quick_wins: boolean;
  prefer_high_xp: boolean;
  work_start_time: string | null; // TIME type
  work_end_time: string | null; // TIME type
  break_duration_minutes: number;
  focus_block_duration_minutes: number;
  updated_at: Timestamp;
}

export interface DailyMissionsTable {
  id: string;
  user_id: string;
  mission_date: Date;
  is_generated: boolean;
  is_completed: boolean;
  completion_percentage: number;
  total_items: number;
  completed_items: number;
  total_xp_available: number;
  xp_earned: number;
  generated_at: Timestamp | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
}

export interface MissionItemsTable {
  id: string;
  mission_id: string;
  user_id: string;
  item_type: string;
  assignment_id: string | null;
  habit_id: string | null;
  priority_score: number;
  sort_order: number;
  title: string;
  description: string | null;
  estimated_duration_minutes: number | null;
  xp_reward: number;
  is_completed: boolean;
  completed_at: Timestamp | null;
  time_block_id: string | null;
  created_at: Timestamp;
}

export interface TimeBlocksTable {
  id: string;
  user_id: string;
  block_date: Date;
  start_time: Timestamp;
  end_time: Timestamp;
  block_type: string;
  mission_item_id: string | null;
  title: string;
  description: string | null;
  color: string | null;
  is_completed: boolean;
  completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// ANALYTICS MODULE TABLES (Phase 4)
// ============================================================================

export interface WeeklyAnalyticsTable {
  id: string;
  user_id: string;
  week_start_date: Date;
  week_end_date: Date;
  assignments_completed: number;
  assignments_total: number;
  completion_rate: number;
  average_days_early: number | null;
  overdue_count: number;
  xp_earned: number;
  average_daily_xp: number;
  highest_single_day_xp: number;
  habits_completed: number;
  habit_completion_rate: number;
  active_habits_count: number;
  longest_streak_this_week: number;
  streak_at_week_start: number;
  streak_at_week_end: number;
  total_study_time_minutes: number;
  average_daily_study_minutes: number;
  average_quality_rating: number | null;
  high_quality_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface MonthlyAnalyticsTable {
  id: string;
  user_id: string;
  month_start_date: Date;
  month_end_date: Date;
  year: number;
  month: number;
  assignments_completed: number;
  assignments_total: number;
  completion_rate: number;
  average_days_early: number | null;
  overdue_count: number;
  xp_earned: number;
  average_daily_xp: number;
  highest_single_day_xp: number;
  xp_from_assignments: number;
  xp_from_habits: number;
  xp_from_bonuses: number;
  habits_completed: number;
  habit_completion_rate: number;
  total_habit_streaks: number;
  levels_gained: number;
  level_at_month_start: number;
  level_at_month_end: number;
  achievements_unlocked: number;
  total_study_time_minutes: number;
  average_daily_study_minutes: number;
  best_day_of_week: number | null;
  best_day_xp: number;
  most_productive_date: Date | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CategoryAnalyticsTable {
  id: string;
  user_id: string;
  category: string;
  category_type: string;
  period_type: string;
  period_start: Date | null;
  period_end: Date | null;
  total_items: number;
  completed_items: number;
  completion_rate: number;
  xp_earned: number;
  average_xp_per_item: number;
  average_quality_rating: number | null;
  average_days_early: number | null;
  total_streak_days: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserInsightsTable {
  id: string;
  user_id: string;
  insight_type: string;
  insight_category: string;
  title: string;
  description: string;
  metric_value: number | null;
  metric_unit: string | null;
  related_data: any; // JSONB
  is_active: boolean;
  generated_at: Timestamp;
  expires_at: Timestamp | null;
  created_at: Timestamp;
}

export interface ProductivityTimeAnalysisTable {
  id: string;
  user_id: string;
  day_of_week: number;
  hour_of_day: number;
  tasks_completed: number;
  xp_earned: number;
  average_quality: number | null;
  total_sessions: number;
  productivity_score: number;
  updated_at: Timestamp;
}

export interface PersonalBestsTable {
  id: string;
  user_id: string;
  metric_name: string;
  metric_category: string;
  current_value: number;
  previous_value: number | null;
  achieved_at: Timestamp;
  context_data: any; // JSONB
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// AI ENHANCEMENT MODULE TABLES (Phase 5)
// ============================================================================

export interface AIUserSettingsTable {
  id: string;
  user_id: string;
  is_enabled: boolean;
  provider: string;
  api_key_encrypted: string | null;
  enable_time_estimation: boolean;
  enable_smart_priority: boolean;
  enable_insight_generation: boolean;
  enable_natural_language: boolean;
  total_requests_today: number;
  last_request_at: Timestamp | null;
  daily_limit: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AIGeneratedInsightsTable {
  id: string;
  user_id: string;
  insight_type: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  source: string;
  is_read: boolean;
  is_dismissed: boolean;
  is_actionable: boolean;
  generated_at: Timestamp;
  expires_at: Timestamp | null;
  metadata: any; // JSONB
  created_at: Timestamp;
}

export interface AITimeEstimationsTable {
  id: string;
  user_id: string;
  reference_type: string;
  reference_id: string | null;
  task_title: string;
  estimated_minutes: number;
  confidence: string;
  reasoning: string | null;
  source: string;
  was_accurate: boolean | null;
  actual_minutes: number | null;
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

  // Habits tables (Phase 3)
  habit_templates: HabitTemplatesTable;
  habit_definitions: HabitDefinitionsTable;
  habit_completions: HabitCompletionsTable;
  habit_streaks: HabitStreaksTable;

  // Scheduling tables (Phase 3)
  priority_settings: PrioritySettingsTable;
  daily_missions: DailyMissionsTable;
  mission_items: MissionItemsTable;
  time_blocks: TimeBlocksTable;

  // Analytics tables (Phase 4)
  weekly_analytics: WeeklyAnalyticsTable;
  monthly_analytics: MonthlyAnalyticsTable;
  category_analytics: CategoryAnalyticsTable;
  user_insights: UserInsightsTable;
  productivity_time_analysis: ProductivityTimeAnalysisTable;
  personal_bests: PersonalBestsTable;

  // AI Enhancement tables (Phase 5)
  ai_user_settings: AIUserSettingsTable;
  ai_generated_insights: AIGeneratedInsightsTable;
  ai_time_estimations: AITimeEstimationsTable;
}
