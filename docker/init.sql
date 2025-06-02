-- Huzzology Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS huzzology;

-- Set default schema
SET search_path TO huzzology, public;

-- Create basic tables (these will be managed by Prisma migrations in production)
CREATE TABLE IF NOT EXISTS archetypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    traits TEXT[],
    platforms TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(100) NOT NULL,
    popularity INTEGER DEFAULT 0,
    archetype_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    caption TEXT,
    engagement JSONB,
    archetype_id UUID REFERENCES archetypes(id),
    trend_id UUID REFERENCES trends(id),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_archetypes_category ON archetypes(category);
CREATE INDEX IF NOT EXISTS idx_trends_platform ON trends(platform);
CREATE INDEX IF NOT EXISTS idx_trends_popularity ON trends(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_content_platform ON content(platform);
CREATE INDEX IF NOT EXISTS idx_content_archetype_id ON content(archetype_id);
CREATE INDEX IF NOT EXISTS idx_content_trend_id ON content(trend_id);
CREATE INDEX IF NOT EXISTS idx_content_scraped_at ON content(scraped_at DESC);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_archetypes_name_search ON archetypes USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trends_name_search ON trends USING gin(name gin_trgm_ops);

-- Insert sample data for development
INSERT INTO archetypes (name, description, category, traits, platforms) VALUES
('Clean Girl', 'Minimalist beauty aesthetic focusing on natural, effortless looks', 'beauty', ARRAY['minimal makeup', 'natural hair', 'dewy skin'], ARRAY['instagram', 'tiktok']),
('Dark Academia', 'Aesthetic inspired by classic literature and gothic architecture', 'lifestyle', ARRAY['vintage clothing', 'books', 'coffee'], ARRAY['pinterest', 'instagram']),
('Cottagecore', 'Romanticized rural life aesthetic with focus on simple living', 'lifestyle', ARRAY['nature', 'baking', 'vintage fashion'], ARRAY['pinterest', 'instagram', 'tiktok'])
ON CONFLICT DO NOTHING;

INSERT INTO trends (name, description, platform, popularity) VALUES
('Glazed Donut Nails', 'Sheer, glossy nail trend popularized by Hailey Bieber', 'instagram', 85),
('BookTok Recommendations', 'Book recommendations trending on TikTok', 'tiktok', 92),
('Cottage Baking', 'Rustic baking content with vintage aesthetics', 'pinterest', 78)
ON CONFLICT DO NOTHING; 