-- LDAPA Intelligent Portal Database Schema
-- Compatible with both SQLite (dev) and PostgreSQL (production/Supabase)

-- ============================================
-- PROVIDERS
-- ============================================
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT,
    service_types TEXT NOT NULL,          -- JSON array: e.g. '["evaluator","tutor"]'
    specializations TEXT DEFAULT '[]',    -- JSON array
    serves_ages TEXT DEFAULT '[]',        -- JSON array
    address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PA',
    zip_code TEXT,
    region TEXT,
    cost_tier TEXT NOT NULL,              -- 'free','sliding_scale','low_cost','standard'
    insurance_accepted INTEGER DEFAULT 0,
    accepts_medicaid INTEGER DEFAULT 0,
    cost_notes TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified',  -- 'verified','unverified','archived'
    last_verified_at TEXT,
    staff_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_providers_city ON providers (city);
CREATE INDEX IF NOT EXISTS idx_providers_zip ON providers (zip_code);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers (verification_status);

-- ============================================
-- CHAT SESSIONS (anonymous)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_location TEXT,                   -- JSON: { city, zip } or null
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
    message_count INTEGER NOT NULL DEFAULT 0,
    escalated INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,                    -- 'user' or 'assistant'
    content TEXT NOT NULL,
    providers_shown TEXT DEFAULT '[]',     -- JSON array of provider IDs
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id, created_at);

-- ============================================
-- CHAT FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS chat_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    rating TEXT NOT NULL,                  -- 'up' or 'down'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON chat_feedback (session_id);

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
