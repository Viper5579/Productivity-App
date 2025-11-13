-- Productivity Gamification App - Initial Schema (Phase 1)
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTH MODULE
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- CANVAS MODULE
-- ============================================================================

-- Canvas LMS connections
CREATE TABLE canvas_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    canvas_url VARCHAR(512) NOT NULL,
    canvas_user_id VARCHAR(255),
    access_token_encrypted TEXT NOT NULL, -- Encrypted Canvas API token
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),
    last_sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvas_connections_user_id ON canvas_connections(user_id);
CREATE INDEX idx_canvas_connections_active ON canvas_connections(is_active);

-- Canvas courses
CREATE TABLE canvas_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES canvas_connections(id) ON DELETE CASCADE,
    canvas_course_id VARCHAR(255) NOT NULL,
    name VARCHAR(512) NOT NULL,
    course_code VARCHAR(255),
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(connection_id, canvas_course_id)
);

CREATE INDEX idx_canvas_courses_connection_id ON canvas_courses(connection_id);
CREATE INDEX idx_canvas_courses_canvas_id ON canvas_courses(canvas_course_id);

-- Canvas raw assignments (unfiltered data from Canvas API)
CREATE TABLE canvas_raw_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES canvas_courses(id) ON DELETE CASCADE,
    canvas_assignment_id VARCHAR(255) NOT NULL,
    name VARCHAR(512) NOT NULL,
    description TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    points_possible DECIMAL(10, 2),
    assignment_type VARCHAR(100),
    html_url VARCHAR(512),
    is_published BOOLEAN DEFAULT true,
    raw_data JSONB, -- Store full Canvas API response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, canvas_assignment_id)
);

CREATE INDEX idx_canvas_raw_assignments_course_id ON canvas_raw_assignments(course_id);
CREATE INDEX idx_canvas_raw_assignments_canvas_id ON canvas_raw_assignments(canvas_assignment_id);
CREATE INDEX idx_canvas_raw_assignments_due_at ON canvas_raw_assignments(due_at);

-- ============================================================================
-- ASSIGNMENTS MODULE
-- ============================================================================

-- Filtered assignments (user-relevant assignments)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_assignment_id UUID REFERENCES canvas_raw_assignments(id) ON DELETE SET NULL,
    title VARCHAR(512) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    points_possible DECIMAL(10, 2),
    course_name VARCHAR(512),
    assignment_type VARCHAR(100),
    external_url VARCHAR(512),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_filtered_out BOOLEAN DEFAULT false, -- User manually filtered this out
    filter_reason VARCHAR(255), -- Why was this filtered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_completed ON assignments(is_completed);
CREATE INDEX idx_assignments_filtered ON assignments(is_filtered_out);

-- Assignment completions (tracking completion history)
CREATE TABLE assignment_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    days_before_due INTEGER, -- Negative if late
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    time_spent_minutes INTEGER,
    notes TEXT
);

CREATE INDEX idx_assignment_completions_assignment_id ON assignment_completions(assignment_id);
CREATE INDEX idx_assignment_completions_user_id ON assignment_completions(user_id);
CREATE INDEX idx_assignment_completions_completed_at ON assignment_completions(completed_at);

-- Assignment filter patterns (user-defined filters)
CREATE TABLE assignment_filter_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL, -- 'keyword', 'assignment_type', 'points_range'
    pattern_value TEXT NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'include' or 'exclude'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignment_filter_patterns_user_id ON assignment_filter_patterns(user_id);
CREATE INDEX idx_assignment_filter_patterns_active ON assignment_filter_patterns(is_active);

-- ============================================================================
-- SYNC TRACKING
-- ============================================================================

-- Sync history (track all sync operations)
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES canvas_connections(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL, -- 'in_progress', 'success', 'failed'
    courses_synced INTEGER DEFAULT 0,
    assignments_synced INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB
);

CREATE INDEX idx_sync_history_connection_id ON sync_history(connection_id);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at);
CREATE INDEX idx_sync_history_status ON sync_history(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_connections_updated_at BEFORE UPDATE ON canvas_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_courses_updated_at BEFORE UPDATE ON canvas_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_raw_assignments_updated_at BEFORE UPDATE ON canvas_raw_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_filter_patterns_updated_at BEFORE UPDATE ON assignment_filter_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
