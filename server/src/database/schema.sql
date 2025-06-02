-- Huzzology Database Schema
-- PostgreSQL with JSONB for hybrid relational/document approach

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- CORE ARCHETYPE TABLES
-- ============================================================================

-- Main archetypes table
CREATE TABLE archetypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE, -- URL-friendly version
    description TEXT,
    keywords TEXT[], -- Array of hashtags and terms
    color VARCHAR(7), -- Hex color for visualization
    
    -- Metadata stored as JSONB for flexibility
    metadata JSONB DEFAULT '{}',
    
    -- Popularity and influence metrics
    influence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (influence_score >= 0.0 AND influence_score <= 1.0),
    popularity_score DECIMAL(10,2) DEFAULT 0.0,
    trending_score DECIMAL(10,2) DEFAULT 0.0,
    
    -- Temporal data
    origin_date DATE,
    peak_popularity_date DATE,
    
    -- Status and moderation
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending', 'rejected')),
    moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Reference to users table (to be created)
    updated_by UUID
);

-- Archetype relationships (graph structure)
CREATE TABLE archetype_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES archetypes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES archetypes(id) ON DELETE CASCADE,
    
    -- Relationship types
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'parent', 'child', 'related', 'conflicting', 'evolved_from', 'evolved_to', 
        'similar', 'opposite', 'influenced_by', 'influences'
    )),
    
    -- Relationship strength/weight
    weight DECIMAL(3,2) DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
    
    -- Additional relationship metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Prevent self-references and duplicate relationships
    CONSTRAINT no_self_reference CHECK (source_id != target_id),
    CONSTRAINT unique_relationship UNIQUE (source_id, target_id, relationship_type)
);

-- Archetype categories/tags for organization
CREATE TABLE archetype_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    parent_id UUID REFERENCES archetype_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-many relationship between archetypes and categories
CREATE TABLE archetype_category_mappings (
    archetype_id UUID REFERENCES archetypes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES archetype_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (archetype_id, category_id)
);

-- ============================================================================
-- CONTENT EXAMPLES TABLES
-- ============================================================================

-- Content examples from various platforms
CREATE TABLE content_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archetype_id UUID NOT NULL REFERENCES archetypes(id) ON DELETE CASCADE,
    
    -- Platform information
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'twitter', 'reddit', 'youtube')),
    platform_id VARCHAR(255), -- Platform-specific content ID
    url TEXT NOT NULL,
    
    -- Content metadata (platform-specific, stored as JSONB)
    content_data JSONB DEFAULT '{}',
    
    -- Common fields across platforms
    caption TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'text', 'audio', 'carousel')),
    
    -- Engagement metrics (stored as JSONB for flexibility)
    engagement_metrics JSONB DEFAULT '{}',
    
    -- Creator information
    creator_data JSONB DEFAULT '{}',
    
    -- AI classification results
    classification_results JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    
    -- Moderation and status
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Temporal data
    content_created_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique content per platform
    CONSTRAINT unique_platform_content UNIQUE (platform, platform_id)
);

-- ============================================================================
-- USER AND MODERATION TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(255),
    
    -- User preferences and settings
    preferences JSONB DEFAULT '{}',
    
    -- User role and permissions
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'curator')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile information
    profile_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- User interactions with archetypes
CREATE TABLE user_archetype_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    archetype_id UUID NOT NULL REFERENCES archetypes(id) ON DELETE CASCADE,
    
    -- Interaction types
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'view', 'like', 'save', 'share', 'comment', 'report', 'contribute'
    )),
    
    -- Additional interaction data
    interaction_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for user activity queries
    INDEX idx_user_interactions_user_time (user_id, created_at),
    INDEX idx_user_interactions_archetype_time (archetype_id, created_at)
);

-- Moderation logs
CREATE TABLE moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    
    -- What was moderated
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('archetype', 'content_example', 'user', 'relationship')),
    target_id UUID NOT NULL,
    
    -- Moderation action
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag', 'edit', 'delete', 'restore')),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Reason and notes
    reason VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Archetype search indexes
CREATE INDEX idx_archetypes_name_trgm ON archetypes USING GIN (name gin_trgm_ops);
CREATE INDEX idx_archetypes_description_trgm ON archetypes USING GIN (description gin_trgm_ops);
CREATE INDEX idx_archetypes_keywords ON archetypes USING GIN (keywords);
CREATE INDEX idx_archetypes_metadata ON archetypes USING GIN (metadata);
CREATE INDEX idx_archetypes_status ON archetypes (status, moderation_status);
CREATE INDEX idx_archetypes_popularity ON archetypes (popularity_score DESC, trending_score DESC);

-- Full-text search index
CREATE INDEX idx_archetypes_fulltext ON archetypes USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || array_to_string(keywords, ' '))
);

-- Relationship indexes for graph traversal
CREATE INDEX idx_relationships_source ON archetype_relationships (source_id, relationship_type);
CREATE INDEX idx_relationships_target ON archetype_relationships (target_id, relationship_type);
CREATE INDEX idx_relationships_type ON archetype_relationships (relationship_type, weight DESC);

-- Content example indexes
CREATE INDEX idx_content_archetype ON content_examples (archetype_id, moderation_status);
CREATE INDEX idx_content_platform ON content_examples (platform, content_created_at DESC);
CREATE INDEX idx_content_data ON content_examples USING GIN (content_data);
CREATE INDEX idx_content_engagement ON content_examples USING GIN (engagement_metrics);
CREATE INDEX idx_content_classification ON content_examples USING GIN (classification_results);
CREATE INDEX idx_content_featured ON content_examples (is_featured, moderation_status) WHERE is_featured = TRUE;

-- User and interaction indexes
CREATE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_username ON users (username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_role ON users (role, is_active);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_archetypes_updated_at BEFORE UPDATE ON archetypes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_examples_updated_at BEFORE UPDATE ON content_examples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for archetype with relationship counts
CREATE VIEW archetype_summary AS
SELECT 
    a.*,
    COALESCE(rel_out.outgoing_count, 0) as outgoing_relationships,
    COALESCE(rel_in.incoming_count, 0) as incoming_relationships,
    COALESCE(content.content_count, 0) as content_examples_count,
    COALESCE(interactions.interaction_count, 0) as total_interactions
FROM archetypes a
LEFT JOIN (
    SELECT source_id, COUNT(*) as outgoing_count
    FROM archetype_relationships
    GROUP BY source_id
) rel_out ON a.id = rel_out.source_id
LEFT JOIN (
    SELECT target_id, COUNT(*) as incoming_count
    FROM archetype_relationships
    GROUP BY target_id
) rel_in ON a.id = rel_in.target_id
LEFT JOIN (
    SELECT archetype_id, COUNT(*) as content_count
    FROM content_examples
    WHERE moderation_status = 'approved'
    GROUP BY archetype_id
) content ON a.id = content.archetype_id
LEFT JOIN (
    SELECT archetype_id, COUNT(*) as interaction_count
    FROM user_archetype_interactions
    GROUP BY archetype_id
) interactions ON a.id = interactions.archetype_id;

-- View for trending archetypes
CREATE VIEW trending_archetypes AS
SELECT 
    a.*,
    (a.trending_score * 0.4 + a.popularity_score * 0.3 + a.influence_score * 0.3) as combined_score
FROM archetypes a
WHERE a.status = 'active' AND a.moderation_status = 'approved'
ORDER BY combined_score DESC, a.updated_at DESC; 