/**
 * Drizzle ORM Schema for Huzzology Database
 * Corresponds to PostgreSQL schema with JSONB support
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  jsonb, 
  decimal, 
  date, 
  timestamp, 
  boolean,
  primaryKey,
  unique,
  check,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// CORE ARCHETYPE TABLES
// ============================================================================

export const archetypes = pgTable('archetypes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  keywords: text('keywords').array(),
  color: varchar('color', { length: 7 }),
  
  // Metadata stored as JSONB
  metadata: jsonb('metadata').default({}),
  
  // Popularity and influence metrics
  influence_score: decimal('influence_score', { precision: 3, scale: 2 }).default('0.0'),
  popularity_score: decimal('popularity_score', { precision: 10, scale: 2 }).default('0.0'),
  trending_score: decimal('trending_score', { precision: 10, scale: 2 }).default('0.0'),
  
  // Temporal data
  origin_date: date('origin_date'),
  peak_popularity_date: date('peak_popularity_date'),
  
  // Status and moderation
  status: varchar('status', { length: 20 }).default('active'),
  moderation_status: varchar('moderation_status', { length: 20 }).default('approved'),
  
  // Audit fields
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by'),
}, (table) => ({
  // Indexes
  nameIdx: index('idx_archetypes_name').on(table.name),
  descriptionIdx: index('idx_archetypes_description').on(table.description),
  keywordsIdx: index('idx_archetypes_keywords').on(table.keywords),
  metadataIdx: index('idx_archetypes_metadata').on(table.metadata),
  statusIdx: index('idx_archetypes_status').on(table.status, table.moderation_status),
  popularityIdx: index('idx_archetypes_popularity').on(table.popularity_score, table.trending_score),
  
  // Constraints
  influenceScoreCheck: check('influence_score_check', 
    `influence_score >= 0.0 AND influence_score <= 1.0`),
  statusCheck: check('status_check', 
    `status IN ('active', 'archived', 'pending', 'rejected')`),
  moderationStatusCheck: check('moderation_status_check', 
    `moderation_status IN ('pending', 'approved', 'rejected', 'flagged')`),
}));

export const archetypeRelationships = pgTable('archetype_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  source_id: uuid('source_id').notNull().references(() => archetypes.id, { onDelete: 'cascade' }),
  target_id: uuid('target_id').notNull().references(() => archetypes.id, { onDelete: 'cascade' }),
  relationship_type: varchar('relationship_type', { length: 50 }).notNull(),
  weight: decimal('weight', { precision: 3, scale: 2 }).default('0.5'),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  created_by: uuid('created_by'),
}, (table) => ({
  // Indexes
  sourceIdx: index('idx_relationships_source').on(table.source_id, table.relationship_type),
  targetIdx: index('idx_relationships_target').on(table.target_id, table.relationship_type),
  typeIdx: index('idx_relationships_type').on(table.relationship_type, table.weight),
  
  // Constraints
  noSelfReference: check('no_self_reference', `source_id != target_id`),
  weightCheck: check('weight_check', `weight >= 0.0 AND weight <= 1.0`),
  relationshipTypeCheck: check('relationship_type_check', 
    `relationship_type IN ('parent', 'child', 'related', 'conflicting', 'evolved_from', 'evolved_to', 'similar', 'opposite', 'influenced_by', 'influences')`),
  uniqueRelationship: unique('unique_relationship').on(table.source_id, table.target_id, table.relationship_type),
}));

export const archetypeCategories = pgTable('archetype_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  parent_id: uuid('parent_id').references(() => archetypeCategories.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const archetypeCategoryMappings = pgTable('archetype_category_mappings', {
  archetype_id: uuid('archetype_id').notNull().references(() => archetypes.id, { onDelete: 'cascade' }),
  category_id: uuid('category_id').notNull().references(() => archetypeCategories.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.archetype_id, table.category_id] }),
}));

// ============================================================================
// CONTENT EXAMPLES TABLES
// ============================================================================

export const contentExamples = pgTable('content_examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  archetype_id: uuid('archetype_id').notNull().references(() => archetypes.id, { onDelete: 'cascade' }),
  
  // Platform information
  platform: varchar('platform', { length: 50 }).notNull(),
  platform_id: varchar('platform_id', { length: 255 }),
  url: text('url').notNull(),
  
  // Content metadata (platform-specific, stored as JSONB)
  content_data: jsonb('content_data').default({}),
  
  // Common fields across platforms
  caption: text('caption'),
  media_type: varchar('media_type', { length: 20 }),
  
  // Engagement metrics (stored as JSONB for flexibility)
  engagement_metrics: jsonb('engagement_metrics').default({}),
  
  // Creator information
  creator_data: jsonb('creator_data').default({}),
  
  // AI classification results
  classification_results: jsonb('classification_results').default({}),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }),
  
  // Moderation and status
  moderation_status: varchar('moderation_status', { length: 20 }).default('pending'),
  is_featured: boolean('is_featured').default(false),
  
  // Temporal data
  content_created_at: timestamp('content_created_at', { withTimezone: true }),
  scraped_at: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
  
  // Audit fields
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  archetypeIdx: index('idx_content_archetype').on(table.archetype_id, table.moderation_status),
  platformIdx: index('idx_content_platform').on(table.platform, table.content_created_at),
  contentDataIdx: index('idx_content_data').on(table.content_data),
  engagementIdx: index('idx_content_engagement').on(table.engagement_metrics),
  classificationIdx: index('idx_content_classification').on(table.classification_results),
  featuredIdx: index('idx_content_featured').on(table.is_featured, table.moderation_status),
  
  // Constraints
  platformCheck: check('platform_check', 
    `platform IN ('tiktok', 'instagram', 'twitter', 'reddit', 'youtube')`),
  mediaTypeCheck: check('media_type_check', 
    `media_type IN ('image', 'video', 'text', 'audio', 'carousel')`),
  moderationStatusCheck: check('moderation_status_check', 
    `moderation_status IN ('pending', 'approved', 'rejected', 'flagged')`),
  confidenceScoreCheck: check('confidence_score_check', 
    `confidence_score >= 0.0 AND confidence_score <= 1.0`),
  uniquePlatformContent: unique('unique_platform_content').on(table.platform, table.platform_id),
}));

// ============================================================================
// USER AND MODERATION TABLES
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  display_name: varchar('display_name', { length: 255 }),
  
  // User preferences and settings
  preferences: jsonb('preferences').default({}),
  
  // User role and permissions
  role: varchar('role', { length: 20 }).default('user'),
  is_active: boolean('is_active').default(true),
  
  // Profile information
  profile_data: jsonb('profile_data').default({}),
  
  // Audit fields
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  last_login_at: timestamp('last_login_at', { withTimezone: true }),
}, (table) => ({
  // Indexes
  emailIdx: index('idx_users_email').on(table.email),
  usernameIdx: index('idx_users_username').on(table.username),
  roleIdx: index('idx_users_role').on(table.role, table.is_active),
  
  // Constraints
  roleCheck: check('role_check', 
    `role IN ('user', 'moderator', 'admin', 'curator')`),
}));

export const userArchetypeInteractions = pgTable('user_archetype_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  archetype_id: uuid('archetype_id').notNull().references(() => archetypes.id, { onDelete: 'cascade' }),
  interaction_type: varchar('interaction_type', { length: 50 }).notNull(),
  interaction_data: jsonb('interaction_data').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  userTimeIdx: index('idx_user_interactions_user_time').on(table.user_id, table.created_at),
  archetypeTimeIdx: index('idx_user_interactions_archetype_time').on(table.archetype_id, table.created_at),
  
  // Constraints
  interactionTypeCheck: check('interaction_type_check', 
    `interaction_type IN ('view', 'like', 'save', 'share', 'comment', 'report', 'contribute')`),
}));

export const moderationLogs = pgTable('moderation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  moderator_id: uuid('moderator_id').notNull().references(() => users.id),
  target_type: varchar('target_type', { length: 50 }).notNull(),
  target_id: uuid('target_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  previous_status: varchar('previous_status', { length: 20 }),
  new_status: varchar('new_status', { length: 20 }),
  reason: varchar('reason', { length: 255 }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Constraints
  targetTypeCheck: check('target_type_check', 
    `target_type IN ('archetype', 'content_example', 'user', 'relationship')`),
  actionCheck: check('action_check', 
    `action IN ('approve', 'reject', 'flag', 'unflag', 'edit', 'delete', 'restore')`),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const archetypesRelations = relations(archetypes, ({ many, one }) => ({
  // Outgoing relationships (this archetype as source)
  outgoingRelationships: many(archetypeRelationships, {
    relationName: 'sourceArchetype',
  }),
  // Incoming relationships (this archetype as target)
  incomingRelationships: many(archetypeRelationships, {
    relationName: 'targetArchetype',
  }),
  // Content examples
  contentExamples: many(contentExamples),
  // Category mappings
  categoryMappings: many(archetypeCategoryMappings),
  // User interactions
  userInteractions: many(userArchetypeInteractions),
  // Creator and updater
  creator: one(users, {
    fields: [archetypes.created_by],
    references: [users.id],
    relationName: 'archetypeCreator',
  }),
  updater: one(users, {
    fields: [archetypes.updated_by],
    references: [users.id],
    relationName: 'archetypeUpdater',
  }),
}));

export const archetypeRelationshipsRelations = relations(archetypeRelationships, ({ one }) => ({
  sourceArchetype: one(archetypes, {
    fields: [archetypeRelationships.source_id],
    references: [archetypes.id],
    relationName: 'sourceArchetype',
  }),
  targetArchetype: one(archetypes, {
    fields: [archetypeRelationships.target_id],
    references: [archetypes.id],
    relationName: 'targetArchetype',
  }),
  creator: one(users, {
    fields: [archetypeRelationships.created_by],
    references: [users.id],
    relationName: 'relationshipCreator',
  }),
}));

export const archetypeCategoriesRelations = relations(archetypeCategories, ({ many, one }) => ({
  // Parent category
  parent: one(archetypeCategories, {
    fields: [archetypeCategories.parent_id],
    references: [archetypeCategories.id],
    relationName: 'parentCategory',
  }),
  // Child categories
  children: many(archetypeCategories, {
    relationName: 'parentCategory',
  }),
  // Archetype mappings
  archetypeMappings: many(archetypeCategoryMappings),
}));

export const archetypeCategoryMappingsRelations = relations(archetypeCategoryMappings, ({ one }) => ({
  archetype: one(archetypes, {
    fields: [archetypeCategoryMappings.archetype_id],
    references: [archetypes.id],
  }),
  category: one(archetypeCategories, {
    fields: [archetypeCategoryMappings.category_id],
    references: [archetypeCategories.id],
  }),
}));

export const contentExamplesRelations = relations(contentExamples, ({ one }) => ({
  archetype: one(archetypes, {
    fields: [contentExamples.archetype_id],
    references: [archetypes.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  // Archetypes created/updated
  createdArchetypes: many(archetypes, {
    relationName: 'archetypeCreator',
  }),
  updatedArchetypes: many(archetypes, {
    relationName: 'archetypeUpdater',
  }),
  // Relationships created
  createdRelationships: many(archetypeRelationships, {
    relationName: 'relationshipCreator',
  }),
  // User interactions
  archetypeInteractions: many(userArchetypeInteractions),
  // Moderation logs
  moderationLogs: many(moderationLogs),
}));

export const userArchetypeInteractionsRelations = relations(userArchetypeInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userArchetypeInteractions.user_id],
    references: [users.id],
  }),
  archetype: one(archetypes, {
    fields: [userArchetypeInteractions.archetype_id],
    references: [archetypes.id],
  }),
}));

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  moderator: one(users, {
    fields: [moderationLogs.moderator_id],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Archetype = typeof archetypes.$inferSelect;
export type NewArchetype = typeof archetypes.$inferInsert;

export type ArchetypeRelationship = typeof archetypeRelationships.$inferSelect;
export type NewArchetypeRelationship = typeof archetypeRelationships.$inferInsert;

export type ArchetypeCategory = typeof archetypeCategories.$inferSelect;
export type NewArchetypeCategory = typeof archetypeCategories.$inferInsert;

export type ContentExample = typeof contentExamples.$inferSelect;
export type NewContentExample = typeof contentExamples.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserArchetypeInteraction = typeof userArchetypeInteractions.$inferSelect;
export type NewUserArchetypeInteraction = typeof userArchetypeInteractions.$inferInsert;

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type NewModerationLog = typeof moderationLogs.$inferInsert; 