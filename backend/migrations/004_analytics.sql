-- Phase 4: Analytics Migration
-- Adds analytics aggregation tables and views for performance insights

-- ============================================================================
-- ANALYTICS MODULE
-- ============================================================================

-- Weekly Analytics Aggregation
CREATE TABLE weekly_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    -- Assignment metrics
    assignments_completed INTEGER NOT NULL DEFAULT 0,
    assignments_total INTEGER NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    average_days_early DECIMAL(5,2),
    overdue_count INTEGER NOT NULL DEFAULT 0,

    -- XP metrics
    xp_earned INTEGER NOT NULL DEFAULT 0,
    average_daily_xp DECIMAL(10,2) NOT NULL DEFAULT 0,
    highest_single_day_xp INTEGER NOT NULL DEFAULT 0,

    -- Habit metrics
    habits_completed INTEGER NOT NULL DEFAULT 0,
    habit_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    active_habits_count INTEGER NOT NULL DEFAULT 0,

    -- Streak metrics
    longest_streak_this_week INTEGER NOT NULL DEFAULT 0,
    streak_at_week_start INTEGER NOT NULL DEFAULT 0,
    streak_at_week_end INTEGER NOT NULL DEFAULT 0,

    -- Time metrics
    total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
    average_daily_study_minutes DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Quality metrics
    average_quality_rating DECIMAL(3,2),
    high_quality_count INTEGER NOT NULL DEFAULT 0, -- ratings 4-5

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_week UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_weekly_analytics_user ON weekly_analytics(user_id);
CREATE INDEX idx_weekly_analytics_dates ON weekly_analytics(week_start_date, week_end_date);

-- Monthly Analytics Aggregation
CREATE TABLE monthly_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Assignment metrics
    assignments_completed INTEGER NOT NULL DEFAULT 0,
    assignments_total INTEGER NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    average_days_early DECIMAL(5,2),
    overdue_count INTEGER NOT NULL DEFAULT 0,

    -- XP metrics
    xp_earned INTEGER NOT NULL DEFAULT 0,
    average_daily_xp DECIMAL(10,2) NOT NULL DEFAULT 0,
    highest_single_day_xp INTEGER NOT NULL DEFAULT 0,
    xp_from_assignments INTEGER NOT NULL DEFAULT 0,
    xp_from_habits INTEGER NOT NULL DEFAULT 0,
    xp_from_bonuses INTEGER NOT NULL DEFAULT 0,

    -- Habit metrics
    habits_completed INTEGER NOT NULL DEFAULT 0,
    habit_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_habit_streaks INTEGER NOT NULL DEFAULT 0,

    -- Level metrics
    levels_gained INTEGER NOT NULL DEFAULT 0,
    level_at_month_start INTEGER NOT NULL DEFAULT 1,
    level_at_month_end INTEGER NOT NULL DEFAULT 1,

    -- Achievement metrics
    achievements_unlocked INTEGER NOT NULL DEFAULT 0,

    -- Time metrics
    total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
    average_daily_study_minutes DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Best day metrics
    best_day_of_week INTEGER, -- 0-6
    best_day_xp INTEGER NOT NULL DEFAULT 0,
    most_productive_date DATE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_month UNIQUE (user_id, year, month),
    CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
    CONSTRAINT valid_day_of_week CHECK (best_day_of_week IS NULL OR (best_day_of_week >= 0 AND best_day_of_week <= 6))
);

CREATE INDEX idx_monthly_analytics_user ON monthly_analytics(user_id);
CREATE INDEX idx_monthly_analytics_date ON monthly_analytics(year, month);

-- Category Performance Tracking
CREATE TABLE category_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- assignment type or habit category
    category_type VARCHAR(50) NOT NULL, -- 'assignment' or 'habit'

    -- Period
    period_type VARCHAR(20) NOT NULL, -- 'week', 'month', 'all_time'
    period_start DATE,
    period_end DATE,

    -- Metrics
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    average_xp_per_item DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Performance
    average_quality_rating DECIMAL(3,2),
    average_days_early DECIMAL(5,2), -- for assignments
    total_streak_days INTEGER NOT NULL DEFAULT 0, -- for habits

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_category_type CHECK (category_type IN ('assignment', 'habit')),
    CONSTRAINT valid_period_type CHECK (period_type IN ('week', 'month', 'all_time'))
);

CREATE INDEX idx_category_analytics_user ON category_analytics(user_id);
CREATE INDEX idx_category_analytics_category ON category_analytics(category);
CREATE INDEX idx_category_analytics_period ON category_analytics(period_type, period_start);

-- User Insights (cached insights and recommendations)
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    insight_type VARCHAR(50) NOT NULL, -- 'best_day', 'top_category', 'improvement_area', etc.
    insight_category VARCHAR(50) NOT NULL, -- 'productivity', 'habits', 'streaks', 'achievements'

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(50),

    -- Contextual data
    related_data JSONB, -- Additional context (dates, categories, etc.)

    -- Validity
    is_active BOOLEAN NOT NULL DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_insight_type CHECK (insight_type IN (
        'best_day', 'best_time', 'top_category', 'top_habit',
        'improvement_area', 'streak_milestone', 'productivity_trend',
        'time_management', 'consistency_tip'
    ))
);

CREATE INDEX idx_user_insights_user ON user_insights(user_id);
CREATE INDEX idx_user_insights_active ON user_insights(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_insights_category ON user_insights(insight_category);
CREATE INDEX idx_user_insights_expires ON user_insights(expires_at) WHERE expires_at IS NOT NULL;

-- Productivity Time Blocks (tracks when user is most productive)
CREATE TABLE productivity_time_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Time period
    day_of_week INTEGER NOT NULL, -- 0-6
    hour_of_day INTEGER NOT NULL, -- 0-23

    -- Metrics
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    average_quality DECIMAL(3,2),
    total_sessions INTEGER NOT NULL DEFAULT 0,

    -- Derived scores
    productivity_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- Composite score

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_time_slot UNIQUE (user_id, day_of_week, hour_of_day),
    CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT valid_hour CHECK (hour_of_day >= 0 AND hour_of_day <= 23)
);

CREATE INDEX idx_productivity_time_user ON productivity_time_analysis(user_id);
CREATE INDEX idx_productivity_time_score ON productivity_time_analysis(productivity_score DESC);

-- Personal Bests (record-keeping for achievements)
CREATE TABLE personal_bests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    metric_name VARCHAR(100) NOT NULL, -- 'longest_streak', 'highest_daily_xp', etc.
    metric_category VARCHAR(50) NOT NULL, -- 'streaks', 'xp', 'habits', 'assignments'

    current_value DECIMAL(10,2) NOT NULL,
    previous_value DECIMAL(10,2),

    achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
    context_data JSONB, -- Additional context about when/how achieved

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_metric UNIQUE (user_id, metric_name)
);

CREATE INDEX idx_personal_bests_user ON personal_bests(user_id);
CREATE INDEX idx_personal_bests_category ON personal_bests(metric_category);

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE TRIGGER update_weekly_analytics_updated_at BEFORE UPDATE ON weekly_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_analytics_updated_at BEFORE UPDATE ON monthly_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_analytics_updated_at BEFORE UPDATE ON category_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productivity_time_updated_at BEFORE UPDATE ON productivity_time_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_bests_updated_at BEFORE UPDATE ON personal_bests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
