-- Phase 3: Habits and Scheduling Migration
-- Adds habit tracking, daily missions, time blocking, and priority system

-- ============================================================================
-- HABITS MODULE
-- ============================================================================

-- Habit Templates (pre-defined habits users can add)
CREATE TABLE habit_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- study, exercise, health, productivity, etc.
    icon VARCHAR(50), -- emoji or icon name
    suggested_frequency VARCHAR(50) NOT NULL, -- daily, weekly, custom
    suggested_target INTEGER, -- e.g., 30 minutes, 3 times
    suggested_target_unit VARCHAR(50), -- minutes, times, pages
    base_xp_reward INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User's Habit Definitions
CREATE TABLE habit_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(50),

    -- Frequency settings
    frequency_type VARCHAR(50) NOT NULL, -- daily, weekly, custom
    frequency_target INTEGER, -- how many times per period
    frequency_days JSONB, -- for weekly: [1,3,5] = Mon, Wed, Fri

    -- Target settings
    has_target BOOLEAN NOT NULL DEFAULT false,
    target_value INTEGER,
    target_unit VARCHAR(50), -- minutes, pages, reps, etc.

    -- Gamification
    xp_reward INTEGER NOT NULL DEFAULT 50,
    bonus_xp_on_streak INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_frequency CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
    CONSTRAINT valid_target_when_enabled CHECK (
        (has_target = false) OR
        (has_target = true AND target_value IS NOT NULL AND target_unit IS NOT NULL)
    )
);

CREATE INDEX idx_habit_definitions_user ON habit_definitions(user_id);
CREATE INDEX idx_habit_definitions_active ON habit_definitions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_habit_definitions_category ON habit_definitions(category);

-- Habit Completions (daily completion records)
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Completion data
    completed_date DATE NOT NULL,
    actual_value INTEGER, -- actual minutes/pages/reps completed
    notes TEXT,
    quality_rating INTEGER, -- 1-5, optional

    -- Gamification
    xp_earned INTEGER NOT NULL DEFAULT 0,
    streak_count INTEGER NOT NULL DEFAULT 1,
    bonus_xp_earned INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_habit_completion_per_day UNIQUE (habit_id, completed_date),
    CONSTRAINT valid_quality_rating CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5))
);

CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_date);

-- Habit Streaks (current streak tracking per habit)
CREATE TABLE habit_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completion_date DATE,

    -- Tracking
    total_completions INTEGER NOT NULL DEFAULT 0,

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_habit_streak UNIQUE (habit_id, user_id)
);

CREATE INDEX idx_habit_streaks_habit ON habit_streaks(habit_id);
CREATE INDEX idx_habit_streaks_user ON habit_streaks(user_id);

-- ============================================================================
-- SCHEDULING MODULE
-- ============================================================================

-- Priority Settings (user preferences for priority calculation)
CREATE TABLE priority_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Weight factors (total should = 100)
    due_date_weight INTEGER NOT NULL DEFAULT 40,
    difficulty_weight INTEGER NOT NULL DEFAULT 20,
    importance_weight INTEGER NOT NULL DEFAULT 30,
    estimated_time_weight INTEGER NOT NULL DEFAULT 10,

    -- Preferences
    prefer_morning_tasks BOOLEAN NOT NULL DEFAULT false,
    prefer_quick_wins BOOLEAN NOT NULL DEFAULT false,
    prefer_high_xp BOOLEAN NOT NULL DEFAULT true,

    -- Auto-scheduling preferences
    work_start_time TIME, -- e.g., 09:00
    work_end_time TIME, -- e.g., 17:00
    break_duration_minutes INTEGER NOT NULL DEFAULT 15,
    focus_block_duration_minutes INTEGER NOT NULL DEFAULT 50,

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_weight_total CHECK (
        due_date_weight + difficulty_weight + importance_weight + estimated_time_weight = 100
    )
);

-- Daily Missions (auto-generated daily task lists)
CREATE TABLE daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    mission_date DATE NOT NULL,

    -- Status
    is_generated BOOLEAN NOT NULL DEFAULT false,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completion_percentage INTEGER NOT NULL DEFAULT 0,

    -- Stats
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    total_xp_available INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_mission_per_day UNIQUE (user_id, mission_date),
    CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

CREATE INDEX idx_daily_missions_user ON daily_missions(user_id);
CREATE INDEX idx_daily_missions_date ON daily_missions(mission_date);
CREATE INDEX idx_daily_missions_user_date ON daily_missions(user_id, mission_date);

-- Mission Items (individual items in a daily mission)
CREATE TABLE mission_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Item reference (either assignment or habit)
    item_type VARCHAR(50) NOT NULL, -- assignment, habit
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES habit_definitions(id) ON DELETE CASCADE,

    -- Priority & ordering
    priority_score DECIMAL(5,2) NOT NULL,
    sort_order INTEGER NOT NULL,

    -- Display info (cached for performance)
    title VARCHAR(500) NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER,
    xp_reward INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Time block assignment
    time_block_id UUID,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_item_type CHECK (item_type IN ('assignment', 'habit')),
    CONSTRAINT valid_item_reference CHECK (
        (item_type = 'assignment' AND assignment_id IS NOT NULL AND habit_id IS NULL) OR
        (item_type = 'habit' AND habit_id IS NOT NULL AND assignment_id IS NULL)
    )
);

CREATE INDEX idx_mission_items_mission ON mission_items(mission_id);
CREATE INDEX idx_mission_items_user ON mission_items(user_id);
CREATE INDEX idx_mission_items_assignment ON mission_items(assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX idx_mission_items_habit ON mission_items(habit_id) WHERE habit_id IS NOT NULL;
CREATE INDEX idx_mission_items_priority ON mission_items(mission_id, priority_score DESC);

-- Time Blocks (scheduled time slots for tasks)
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Time slot
    block_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Block type
    block_type VARCHAR(50) NOT NULL, -- task, break, focus, meeting

    -- Associated item (optional - can be unallocated time)
    mission_item_id UUID REFERENCES mission_items(id) ON DELETE SET NULL,

    -- Display info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20), -- for calendar display

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_block_type CHECK (block_type IN ('task', 'break', 'focus', 'meeting', 'free')),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_time_blocks_user ON time_blocks(user_id);
CREATE INDEX idx_time_blocks_date ON time_blocks(block_date);
CREATE INDEX idx_time_blocks_user_date ON time_blocks(user_id, block_date);
CREATE INDEX idx_time_blocks_time_range ON time_blocks(start_time, end_time);
CREATE INDEX idx_time_blocks_mission_item ON time_blocks(mission_item_id) WHERE mission_item_id IS NOT NULL;

-- ============================================================================
-- SEED DATA: Habit Templates
-- ============================================================================

INSERT INTO habit_templates (name, description, category, icon, suggested_frequency, suggested_target, suggested_target_unit, base_xp_reward, sort_order) VALUES
-- Study Habits
('Deep Study Session', 'Focused study time without distractions', 'study', '📚', 'daily', 120, 'minutes', 100, 1),
('Review Notes', 'Review and consolidate class notes', 'study', '📝', 'daily', 30, 'minutes', 50, 2),
('Practice Problems', 'Work through practice problems or exercises', 'study', '✏️', 'daily', 10, 'problems', 75, 3),
('Read Textbook', 'Read assigned textbook chapters', 'study', '📖', 'daily', 20, 'pages', 60, 4),
('Flashcard Review', 'Review flashcards for memorization', 'study', '🎴', 'daily', 50, 'cards', 40, 5),

-- Health & Wellness
('Morning Exercise', 'Morning workout or physical activity', 'health', '💪', 'daily', 30, 'minutes', 75, 10),
('Meditation', 'Mindfulness or meditation practice', 'health', '🧘', 'daily', 15, 'minutes', 50, 11),
('Drink Water', 'Stay hydrated throughout the day', 'health', '💧', 'daily', 8, 'glasses', 30, 12),
('Healthy Meal Prep', 'Prepare nutritious meals', 'health', '🥗', 'weekly', 3, 'meals', 60, 13),
('Sleep 8 Hours', 'Get adequate sleep', 'health', '😴', 'daily', 8, 'hours', 50, 14),

-- Productivity
('Plan Tomorrow', 'Plan tasks for the next day', 'productivity', '📅', 'daily', 10, 'minutes', 40, 20),
('Morning Routine', 'Complete morning routine', 'productivity', '☀️', 'daily', 1, 'times', 50, 21),
('Inbox Zero', 'Process all emails', 'productivity', '📧', 'daily', 1, 'times', 40, 22),
('Clean Workspace', 'Organize and clean study/work area', 'productivity', '🧹', 'daily', 15, 'minutes', 30, 23),
('Weekly Review', 'Review progress and plan next week', 'productivity', '📊', 'weekly', 1, 'times', 100, 24),

-- Personal Development
('Read Book', 'Read for personal development', 'personal', '📕', 'daily', 30, 'minutes', 60, 30),
('Learn New Skill', 'Practice a new skill or hobby', 'personal', '🎯', 'daily', 30, 'minutes', 70, 31),
('Journal', 'Reflect and write in journal', 'personal', '✍️', 'daily', 15, 'minutes', 40, 32),
('Language Practice', 'Practice foreign language', 'personal', '🗣️', 'daily', 20, 'minutes', 50, 33),
('Side Project', 'Work on personal project', 'personal', '🚀', 'weekly', 3, 'sessions', 80, 34);

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_habit_definitions_updated_at BEFORE UPDATE ON habit_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_streaks_updated_at BEFORE UPDATE ON habit_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_priority_settings_updated_at BEFORE UPDATE ON priority_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON time_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
