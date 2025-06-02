-- Sample Data for Huzzology Database
-- Realistic examples of women's pop culture archetypes

-- ============================================================================
-- SAMPLE ARCHETYPE CATEGORIES
-- ============================================================================

INSERT INTO archetype_categories (id, name, description, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Aesthetic', 'Visual and style-based archetypes', '#FF6B9D'),
('550e8400-e29b-41d4-a716-446655440002', 'Lifestyle', 'Lifestyle and behavior-based archetypes', '#4ECDC4'),
('550e8400-e29b-41d4-a716-446655440003', 'Fashion', 'Fashion and clothing-focused archetypes', '#45B7D1'),
('550e8400-e29b-41d4-a716-446655440004', 'Mindset', 'Personality and mindset archetypes', '#96CEB4'),
('550e8400-e29b-41d4-a716-446655440005', 'Era', 'Time period or nostalgic archetypes', '#FFEAA7');

-- ============================================================================
-- SAMPLE ARCHETYPES
-- ============================================================================

INSERT INTO archetypes (id, name, slug, description, keywords, color, metadata, influence_score, popularity_score, trending_score, origin_date, status, moderation_status) VALUES

-- Clean Girl
('550e8400-e29b-41d4-a716-446655440010', 
 'Clean Girl', 
 'clean-girl',
 'Effortless, natural beauty aesthetic emphasizing minimal makeup, slicked-back hair, and dewy skin',
 ARRAY['clean girl', 'minimal makeup', 'natural beauty', 'dewy skin', 'slicked hair', 'effortless'],
 '#E8F5E8',
 '{"origin_platform": "tiktok", "key_influencers": ["Hailey Bieber", "Bella Hadid"], "signature_products": ["hair gel", "lip balm", "moisturizer"], "time_of_day": "morning routine"}',
 0.85,
 92.5,
 78.3,
 '2022-03-15',
 'active',
 'approved'),

-- Mob Wife
('550e8400-e29b-41d4-a716-446655440011',
 'Mob Wife',
 'mob-wife',
 'Luxurious, dramatic aesthetic inspired by mafia wives featuring fur coats, gold jewelry, and bold makeup',
 ARRAY['mob wife', 'fur coat', 'gold jewelry', 'dramatic makeup', 'luxury', 'bold'],
 '#8B4513',
 '{"origin_platform": "tiktok", "key_influencers": ["Bella Hadid", "Kim Kardashian"], "signature_items": ["fur coat", "gold hoops", "red lipstick"], "inspiration": "The Sopranos, Goodfellas"}',
 0.78,
 88.2,
 95.7,
 '2024-01-10',
 'active',
 'approved'),

-- Coquette
('550e8400-e29b-41d4-a716-446655440012',
 'Coquette',
 'coquette',
 'Feminine, romantic aesthetic featuring bows, pink colors, ballet flats, and delicate accessories',
 ARRAY['coquette', 'bows', 'pink', 'ballet', 'feminine', 'romantic', 'delicate'],
 '#FFB6C1',
 '{"origin_platform": "tumblr", "key_influencers": ["Lily Rose Depp", "Alexa Demie"], "signature_items": ["hair bows", "ballet flats", "pink blush"], "inspiration": "French girl, ballet core"}',
 0.72,
 85.1,
 82.4,
 '2023-06-20',
 'active',
 'approved'),

-- Dark Academia
('550e8400-e29b-41d4-a716-446655440013',
 'Dark Academia',
 'dark-academia',
 'Scholarly, gothic aesthetic inspired by elite universities, featuring tweed, books, and moody atmospheres',
 ARRAY['dark academia', 'tweed', 'books', 'gothic', 'scholarly', 'university', 'vintage'],
 '#2F4F4F',
 '{"origin_platform": "tumblr", "key_influencers": ["Emma Watson", "Timothée Chalamet"], "signature_items": ["tweed blazer", "vintage books", "wire glasses"], "inspiration": "Oxford, Cambridge, The Secret History"}',
 0.68,
 76.8,
 65.2,
 '2020-09-12',
 'active',
 'approved'),

-- That Girl
('550e8400-e29b-41d4-a716-446655440014',
 'That Girl',
 'that-girl',
 'Aspirational lifestyle aesthetic focused on wellness, productivity, and having your life together',
 ARRAY['that girl', 'wellness', 'productivity', 'morning routine', 'healthy', 'organized'],
 '#90EE90',
 '{"origin_platform": "tiktok", "key_influencers": ["Matilda Djerf", "Emma Chamberlain"], "signature_items": ["stanley cup", "workout set", "green smoothie"], "lifestyle": "5am wake up, pilates, journaling"}',
 0.81,
 89.3,
 71.6,
 '2021-08-05',
 'active',
 'approved'),

-- Coastal Grandmother
('550e8400-e29b-41d4-a716-446655440015',
 'Coastal Grandmother',
 'coastal-grandmother',
 'Relaxed, sophisticated aesthetic inspired by seaside living and Nancy Meyers films',
 ARRAY['coastal grandmother', 'linen', 'neutral tones', 'seaside', 'nancy meyers', 'sophisticated'],
 '#F5F5DC',
 '{"origin_platform": "tiktok", "key_influencers": ["Ina Garten", "Nancy Meyers"], "signature_items": ["linen shirt", "wicker basket", "blue and white ceramics"], "inspiration": "The Hamptons, Something\'s Gotta Give"}',
 0.65,
 72.4,
 58.9,
 '2022-05-18',
 'active',
 'approved');

-- ============================================================================
-- ARCHETYPE CATEGORY MAPPINGS
-- ============================================================================

INSERT INTO archetype_category_mappings (archetype_id, category_id) VALUES
-- Clean Girl
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001'), -- Aesthetic
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002'), -- Lifestyle

-- Mob Wife
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001'), -- Aesthetic
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003'), -- Fashion

-- Coquette
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001'), -- Aesthetic
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003'), -- Fashion

-- Dark Academia
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001'), -- Aesthetic
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004'), -- Mindset

-- That Girl
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002'), -- Lifestyle
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004'), -- Mindset

-- Coastal Grandmother
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001'), -- Aesthetic
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002'); -- Lifestyle

-- ============================================================================
-- ARCHETYPE RELATIONSHIPS
-- ============================================================================

INSERT INTO archetype_relationships (id, source_id, target_id, relationship_type, weight, metadata) VALUES

-- Clean Girl relationships
('550e8400-e29b-41d4-a716-446655440020', 
 '550e8400-e29b-41d4-a716-446655440010', 
 '550e8400-e29b-41d4-a716-446655440014', 
 'related', 
 0.7,
 '{"reason": "Both emphasize natural, effortless beauty and wellness"}'),

('550e8400-e29b-41d4-a716-446655440021',
 '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440011',
 'opposite',
 0.9,
 '{"reason": "Minimal vs. maximal approach to beauty and styling"}'),

-- Mob Wife relationships
('550e8400-e29b-41d4-a716-446655440022',
 '550e8400-e29b-41d4-a716-446655440011',
 '550e8400-e29b-41d4-a716-446655440012',
 'conflicting',
 0.8,
 '{"reason": "Bold, dramatic vs. soft, delicate aesthetics"}'),

-- Coquette relationships
('550e8400-e29b-41d4-a716-446655440023',
 '550e8400-e29b-41d4-a716-446655440012',
 '550e8400-e29b-41d4-a716-446655440013',
 'related',
 0.6,
 '{"reason": "Both draw from romantic, vintage inspirations"}'),

-- Dark Academia relationships
('550e8400-e29b-41d4-a716-446655440024',
 '550e8400-e29b-41d4-a716-446655440013',
 '550e8400-e29b-41d4-a716-446655440015',
 'similar',
 0.5,
 '{"reason": "Both appreciate sophisticated, timeless aesthetics"}'),

-- That Girl relationships
('550e8400-e29b-41d4-a716-446655440025',
 '550e8400-e29b-41d4-a716-446655440014',
 '550e8400-e29b-41d4-a716-446655440015',
 'evolved_to',
 0.6,
 '{"reason": "That Girl lifestyle can evolve into Coastal Grandmother as one ages"}');

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================

INSERT INTO users (id, email, username, display_name, preferences, role, profile_data) VALUES

('550e8400-e29b-41d4-a716-446655440030',
 'curator@huzzology.com',
 'culturecurator',
 'Culture Curator',
 '{"theme": "light", "notifications": {"email": true, "trending_archetypes": true}, "content_filters": {"platforms": ["tiktok", "instagram"]}}',
 'curator',
 '{"bio": "Tracking the evolution of pop culture aesthetics", "expertise": ["fashion", "beauty", "lifestyle"]}'),

('550e8400-e29b-41d4-a716-446655440031',
 'moderator@huzzology.com',
 'trendmod',
 'Trend Moderator',
 '{"theme": "dark", "notifications": {"email": true, "new_content": true}, "privacy": {"profile_visibility": "public"}}',
 'moderator',
 '{"bio": "Ensuring quality content curation", "specialties": ["content moderation", "trend analysis"]}');

-- ============================================================================
-- SAMPLE CONTENT EXAMPLES
-- ============================================================================

INSERT INTO content_examples (id, archetype_id, platform, platform_id, url, content_data, caption, media_type, engagement_metrics, creator_data, classification_results, confidence_score, moderation_status, is_featured, content_created_at) VALUES

-- Clean Girl TikTok example
('550e8400-e29b-41d4-a716-446655440040',
 '550e8400-e29b-41d4-a716-446655440010',
 'tiktok',
 '7234567890123456789',
 'https://tiktok.com/@user/video/7234567890123456789',
 '{"duration": 30, "effects": ["natural lighting"], "sounds": ["original audio"], "hashtags": ["#cleangirl", "#naturalbeauty", "#minimalmakeup"]}',
 'My 5-minute clean girl morning routine ✨ #cleangirl #naturalbeauty',
 'video',
 '{"likes": 125000, "shares": 8500, "comments": 3200, "views": 890000}',
 '{"username": "beautyminimalist", "display_name": "Sarah M", "follower_count": 45000, "verified": false}',
 '{"archetype_matches": [{"archetype_id": "550e8400-e29b-41d4-a716-446655440010", "confidence": 0.92, "reasoning": "Clear demonstration of clean girl aesthetic"}], "keywords_extracted": ["clean girl", "natural", "minimal", "routine"], "aesthetic_tags": ["natural", "effortless", "glowing"], "ai_model_used": "gpt-4-vision", "processed_at": "2024-01-15T10:30:00Z"}',
 0.92,
 'approved',
 true,
 '2024-01-15T08:00:00Z'),

-- Mob Wife Instagram example
('550e8400-e29b-41d4-a716-446655440041',
 '550e8400-e29b-41d4-a716-446655440011',
 'instagram',
 'C_xyz123abc',
 'https://instagram.com/p/C_xyz123abc',
 '{"post_type": "carousel", "image_count": 3, "filters": ["dramatic"], "location": "New York City"}',
 'Channeling my inner mob wife energy 💎 Fur coat season is here',
 'carousel',
 '{"likes": 89000, "comments": 1200, "saves": 5600, "shares": 890}',
 '{"username": "luxelifestyle", "display_name": "Bella R", "follower_count": 230000, "verified": true}',
 '{"archetype_matches": [{"archetype_id": "550e8400-e29b-41d4-a716-446655440011", "confidence": 0.88, "reasoning": "Features signature mob wife elements: fur coat, gold jewelry"}], "keywords_extracted": ["mob wife", "fur coat", "luxury", "dramatic"], "aesthetic_tags": ["luxurious", "bold", "dramatic"], "ai_model_used": "gpt-4-vision", "processed_at": "2024-01-20T14:15:00Z"}',
 0.88,
 'approved',
 true,
 '2024-01-20T12:00:00Z'),

-- Coquette Pinterest example
('550e8400-e29b-41d4-a716-446655440042',
 '550e8400-e29b-41d4-a716-446655440012',
 'instagram',
 'C_abc789xyz',
 'https://instagram.com/p/C_abc789xyz',
 '{"post_type": "single", "filters": ["soft", "vintage"], "styling": "flat lay"}',
 'Coquette essentials: bows, ballet flats, and pink everything 🎀',
 'image',
 '{"likes": 34000, "comments": 890, "saves": 12000, "shares": 450}',
 '{"username": "coquettecore", "display_name": "Emma L", "follower_count": 78000, "verified": false}',
 '{"archetype_matches": [{"archetype_id": "550e8400-e29b-41d4-a716-446655440012", "confidence": 0.95, "reasoning": "Perfect representation of coquette aesthetic with bows and pink colors"}], "keywords_extracted": ["coquette", "bows", "ballet flats", "pink", "feminine"], "aesthetic_tags": ["feminine", "romantic", "delicate"], "ai_model_used": "gpt-4-vision", "processed_at": "2024-01-25T16:45:00Z"}',
 0.95,
 'approved',
 false,
 '2024-01-25T14:30:00Z');

-- ============================================================================
-- SAMPLE USER INTERACTIONS
-- ============================================================================

INSERT INTO user_archetype_interactions (id, user_id, archetype_id, interaction_type, interaction_data) VALUES

('550e8400-e29b-41d4-a716-446655440050',
 '550e8400-e29b-41d4-a716-446655440030',
 '550e8400-e29b-41d4-a716-446655440010',
 'save',
 '{"collection": "trending aesthetics", "notes": "Great example for clean girl trend analysis"}'),

('550e8400-e29b-41d4-a716-446655440051',
 '550e8400-e29b-41d4-a716-446655440030',
 '550e8400-e29b-41d4-a716-446655440011',
 'view',
 '{"duration": 45, "source": "trending page"}'),

('550e8400-e29b-41d4-a716-446655440052',
 '550e8400-e29b-41d4-a716-446655440031',
 '550e8400-e29b-41d4-a716-446655440012',
 'like',
 '{"reaction": "love", "shared": false}');

-- ============================================================================
-- SAMPLE MODERATION LOGS
-- ============================================================================

INSERT INTO moderation_logs (id, moderator_id, target_type, target_id, action, previous_status, new_status, reason, notes) VALUES

('550e8400-e29b-41d4-a716-446655440060',
 '550e8400-e29b-41d4-a716-446655440031',
 'content_example',
 '550e8400-e29b-41d4-a716-446655440040',
 'approve',
 'pending',
 'approved',
 'Quality content',
 'Excellent example of clean girl aesthetic, high engagement, appropriate content'),

('550e8400-e29b-41d4-a716-446655440061',
 '550e8400-e29b-41d4-a716-446655440031',
 'archetype',
 '550e8400-e29b-41d4-a716-446655440011',
 'approve',
 'pending',
 'approved',
 'Trending archetype',
 'Mob wife aesthetic is trending and well-documented across platforms'); 