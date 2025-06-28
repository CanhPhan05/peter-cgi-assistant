-- Peter CGI Assistant - Integrated Database Schema (FIXED)
-- Không lưu users table vì dùng external authentication

-- User Settings table (lưu API keys và preferences)
CREATE TABLE user_settings (
    user_id VARCHAR PRIMARY KEY, -- Hash of email from external system
    api_key TEXT, -- Encrypted OpenAI API Key
    default_model VARCHAR DEFAULT 'gpt-4o',
    custom_prompts JSONB,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table (modified to include user_email)
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR,
    user_id VARCHAR NOT NULL, -- Hash of email
    user_email VARCHAR NOT NULL, -- Store email for reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (modified to include user_email)
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    role VARCHAR NOT NULL, -- 'user' | 'assistant' | 'system'
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_email VARCHAR, -- Store for tracking
    image_ids TEXT[], -- Array of image IDs
    created_at TIMESTAMP DEFAULT NOW()
);

-- Images table (modified to include user info)
CREATE TABLE images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_url TEXT NOT NULL,
    thumbnail_url TEXT,
    size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    content_type VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL, -- Hash of email
    user_email VARCHAR NOT NULL, -- Store email for reference
    created_at TIMESTAMP DEFAULT NOW()
);

-- API Usage tracking table (for monitoring)
CREATE TABLE api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    user_email VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    prompt_tokens INTEGER,
    response_tokens INTEGER,
    total_tokens INTEGER,
    cost FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Login sessions table (track device access)
CREATE TABLE login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    user_email VARCHAR NOT NULL,
    device_id VARCHAR NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR,
    login_time TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_user_email ON conversations(user_email);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_user_email ON images(user_email);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

CREATE INDEX idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX idx_login_sessions_device_id ON login_sessions(device_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations table
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_settings table
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for user statistics (FIXED - specify table prefixes)
CREATE VIEW user_stats AS
SELECT 
    c.user_id,
    c.user_email,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(DISTINCT m.id) as message_count,
    COUNT(DISTINCT i.id) as image_count,
    COALESCE(SUM(au.total_tokens), 0) as total_tokens_used,
    COALESCE(SUM(au.cost), 0) as total_cost,
    MAX(ls.last_activity) as last_activity,
    MIN(c.created_at) as first_conversation
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN images i ON c.user_id = i.user_id
LEFT JOIN api_usage au ON c.user_id = au.user_id
LEFT JOIN login_sessions ls ON c.user_id = ls.user_id
GROUP BY c.user_id, c.user_email; 