-- Productivity Gamification App - Gamification Schema (Phase 2)
-- Migration: 002_gamification_schema

-- ============================================================================
-- GAMIFICATION MODULE
-- ============================================================================

-- User XP and Levels
CREATE TABLE user_xp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_xp INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0, -- Lifetime XP
    current_level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX idx_user_xp_level ON user_xp(current_level);

-- XP Transactions (history of all XP gains)
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'assignment', 'streak_bonus', 'achievement', 'daily_bonus'
    multiplier DECIMAL(4, 2) DEFAULT 1.0,
    reason TEXT,
    metadata JSONB, -- Additional context (days_early, streak_count, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source);

-- Level History (track level-ups)
CREATE TABLE level_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_level INTEGER NOT NULL,
    new_level INTEGER NOT NULL,
    xp_at_levelup INTEGER NOT NULL,
    leveled_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_level_history_user_id ON level_history(user_id);
CREATE INDEX idx_level_history_leveled_up_at ON level_history(leveled_up_at);

-- ============================================================================
-- STREAKS
-- ============================================================================

-- User Streaks
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Daily streak
    current_daily_streak INTEGER NOT NULL DEFAULT 0,
    longest_daily_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,

    -- Weekly streak
    current_weekly_streak INTEGER NOT NULL DEFAULT 0,
    longest_weekly_streak INTEGER NOT NULL DEFAULT 0,
    last_weekly_activity DATE,

    -- Monthly streak
    current_monthly_streak INTEGER NOT NULL DEFAULT 0,
    longest_monthly_streak INTEGER NOT NULL DEFAULT 0,
    last_monthly_activity DATE,

    -- Streak recovery (1 skip day per week)
    streak_shields_available INTEGER NOT NULL DEFAULT 1,
    last_shield_reset_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_daily ON user_streaks(current_daily_streak);

-- Streak History
CREATE TABLE streak_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'streak_started', 'streak_continued', 'streak_broken', 'shield_used', 'milestone_reached'
    streak_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    streak_count INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_streak_events_user_id ON streak_events(user_id);
CREATE INDEX idx_streak_events_created_at ON streak_events(created_at);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

-- Achievement Definitions (predefined achievements)
CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- 'first_assignment', 'week_warrior', 'early_bird'
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'completion', 'streak', 'speed', 'milestone'
    icon VARCHAR(100), -- Icon name or emoji
    tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
    requirement_type VARCHAR(50) NOT NULL, -- 'assignment_count', 'streak_days', 'early_completions', 'xp_total'
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievement_definitions_code ON achievement_definitions(code);
CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);

-- User Achievements (unlocked achievements)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0, -- For partially completed achievements
    metadata JSONB, -- Context when unlocked
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- ============================================================================
-- STATISTICS
-- ============================================================================

-- Daily Statistics (aggregated per day for analytics)
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    assignments_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    average_early_days DECIMAL(5, 2), -- Average days completed before due date
    total_points_earned DECIMAL(10, 2), -- Assignment points
    study_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stat_date)
);

CREATE INDEX idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update user_xp updated_at
CREATE TRIGGER update_user_xp_updated_at BEFORE UPDATE ON user_xp
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user_streaks updated_at
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Achievement Definitions
-- ============================================================================

INSERT INTO achievement_definitions (code, name, description, category, icon, tier, requirement_type, requirement_value, xp_reward, display_order) VALUES
-- Completion Achievements
('first_assignment', 'First Steps', 'Complete your first assignment', 'completion', '🎯', 'bronze', 'assignment_count', 1, 50, 1),
('assignment_10', 'Getting Started', 'Complete 10 assignments', 'completion', '📚', 'bronze', 'assignment_count', 10, 100, 2),
('assignment_25', 'Dedicated Student', 'Complete 25 assignments', 'completion', '⭐', 'silver', 'assignment_count', 25, 250, 3),
('assignment_50', 'Academic Warrior', 'Complete 50 assignments', 'completion', '🏆', 'gold', 'assignment_count', 50, 500, 4),
('assignment_100', 'Centurion', 'Complete 100 assignments', 'completion', '👑', 'platinum', 'assignment_count', 100, 1000, 5),

-- Streak Achievements
('streak_3', 'Streak Starter', 'Maintain a 3-day streak', 'streak', '🔥', 'bronze', 'streak_days', 3, 75, 10),
('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'streak', '⚡', 'silver', 'streak_days', 7, 200, 11),
('streak_14', 'Two Week Champion', 'Maintain a 14-day streak', 'streak', '💪', 'gold', 'streak_days', 14, 400, 12),
('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'streak', '🌟', 'platinum', 'streak_days', 30, 800, 13),

-- Early Completion Achievements
('early_bird_10', 'Early Bird', 'Complete 10 assignments early', 'speed', '🌅', 'bronze', 'early_completions', 10, 150, 20),
('early_bird_25', 'Proactive Student', 'Complete 25 assignments early', 'speed', '🚀', 'silver', 'early_completions', 25, 300, 21),
('early_bird_50', 'Time Master', 'Complete 50 assignments early', 'speed', '⏰', 'gold', 'early_completions', 50, 600, 22),

-- XP Milestones
('xp_1000', 'Rising Star', 'Earn 1,000 total XP', 'milestone', '✨', 'bronze', 'xp_total', 1000, 100, 30),
('xp_5000', 'XP Collector', 'Earn 5,000 total XP', 'milestone', '💎', 'silver', 'xp_total', 5000, 500, 31),
('xp_10000', 'XP Legend', 'Earn 10,000 total XP', 'milestone', '🔮', 'gold', 'xp_total', 10000, 1000, 32),

-- Level Achievements
('level_5', 'Leveling Up', 'Reach level 5', 'milestone', '📈', 'bronze', 'level_reached', 5, 100, 40),
('level_10', 'Expert Status', 'Reach level 10', 'milestone', '🎓', 'silver', 'level_reached', 10, 250, 41),
('level_20', 'Master Level', 'Reach level 20', 'milestone', '👨‍🎓', 'gold', 'level_reached', 20, 500, 42),

-- Perfect Week
('perfect_week', 'Perfect Week', 'Complete all assignments for a week', 'completion', '💯', 'gold', 'perfect_week', 1, 400, 50);
