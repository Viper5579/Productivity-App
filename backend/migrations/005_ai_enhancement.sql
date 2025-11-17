-- Phase 5: AI Enhancement Migration
-- Fully optional module - app works 100% without AI

-- ============================================================================
-- AI USER SETTINGS (per-user AI configuration)
-- ============================================================================

CREATE TABLE ai_user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- AI enablement
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    provider VARCHAR(50) NOT NULL DEFAULT 'none', -- 'openai', 'anthropic', 'none'
    api_key_encrypted TEXT, -- User's own API key (encrypted)

    -- Feature toggles (all default to true so they work when enabled)
    enable_time_estimation BOOLEAN NOT NULL DEFAULT true,
    enable_smart_priority BOOLEAN NOT NULL DEFAULT true,
    enable_insight_generation BOOLEAN NOT NULL DEFAULT true,
    enable_natural_language BOOLEAN NOT NULL DEFAULT true,

    -- Usage tracking
    total_requests_today INTEGER NOT NULL DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE,
    daily_limit INTEGER NOT NULL DEFAULT 100,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_provider CHECK (provider IN ('openai', 'anthropic', 'none'))
);

CREATE INDEX idx_ai_settings_user ON ai_user_settings(user_id);

-- AI-generated insights cache (optional, for better performance)
CREATE TABLE ai_generated_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    source VARCHAR(50) NOT NULL DEFAULT 'template', -- 'ai' or 'template'

    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    is_actionable BOOLEAN NOT NULL DEFAULT false,

    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_source CHECK (source IN ('ai', 'template', 'heuristic')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_ai_insights_user ON ai_generated_insights(user_id);
CREATE INDEX idx_ai_insights_active ON ai_generated_insights(user_id, is_dismissed) WHERE is_dismissed = false;
CREATE INDEX idx_ai_insights_expires ON ai_generated_insights(expires_at) WHERE expires_at IS NOT NULL;

-- Time estimation cache (to avoid recalculating)
CREATE TABLE ai_time_estimations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Reference to what was estimated
    reference_type VARCHAR(50) NOT NULL, -- 'assignment', 'habit', 'custom_task'
    reference_id UUID,

    -- Estimation data
    task_title VARCHAR(500) NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'medium',
    reasoning TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'heuristic',

    -- Tracking
    was_accurate BOOLEAN, -- User feedback
    actual_minutes INTEGER, -- If user provides actual time

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_confidence CHECK (confidence IN ('low', 'medium', 'high')),
    CONSTRAINT valid_est_source CHECK (source IN ('ai', 'heuristic'))
);

CREATE INDEX idx_time_estimations_user ON ai_time_estimations(user_id);
CREATE INDEX idx_time_estimations_reference ON ai_time_estimations(reference_type, reference_id);

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ai_user_settings_updated_at BEFORE UPDATE ON ai_user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
