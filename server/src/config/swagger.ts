/**
 * OpenAPI/Swagger Configuration for Huzzology API
 * Comprehensive API documentation with all endpoints, schemas, and authentication
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Huzzology API',
    version: '1.0.0',
    description: `
      Huzzology is a real-time visual mapping application for women's pop culture archetypes, trends, and aesthetics.
      This API provides comprehensive endpoints for managing archetypes, content examples, user interactions, and moderation workflows.
      
      ## Features
      - **Archetype Management**: Create, update, and explore cultural archetypes
      - **Content Examples**: Manage social media content examples linked to archetypes
      - **User Management**: User registration, authentication, and profile management
      - **Moderation**: Content moderation workflows and quality control
      - **Real-time Updates**: WebSocket support for live data synchronization
      - **Analytics**: Trend analysis and performance metrics
      
      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
    `,
    contact: {
      name: 'Huzzology API Support',
      email: 'support@huzzology.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server',
    },
    {
      url: 'https://api.huzzology.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login endpoint',
      },
    },
    schemas: {
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Request validation failed',
          },
          errorId: {
            type: 'string',
            example: 'err_1234567890_abc123def',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          path: {
            type: 'string',
            example: '/api/archetypes',
          },
          method: {
            type: 'string',
            example: 'POST',
          },
        },
        required: ['success', 'error', 'message'],
      },

      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
        },
        required: ['success'],
      },

      // Platform Enum
      Platform: {
        type: 'string',
        enum: ['tiktok', 'instagram', 'twitter', 'reddit', 'youtube'],
        example: 'tiktok',
      },

      // Media Type Enum
      MediaType: {
        type: 'string',
        enum: ['image', 'video', 'text', 'audio', 'carousel'],
        example: 'video',
      },

      // Moderation Status Enum
      ModerationStatus: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        example: 'pending',
      },

      // User Role Enum
      UserRole: {
        type: 'string',
        enum: ['user', 'moderator', 'curator', 'admin'],
        example: 'user',
      },

      // Engagement Metrics Schema
      EngagementMetrics: {
        type: 'object',
        properties: {
          likes: {
            type: 'integer',
            minimum: 0,
            example: 1250,
          },
          shares: {
            type: 'integer',
            minimum: 0,
            example: 89,
          },
          comments: {
            type: 'integer',
            minimum: 0,
            example: 156,
          },
          views: {
            type: 'integer',
            minimum: 0,
            example: 45000,
          },
          saves: {
            type: 'integer',
            minimum: 0,
            example: 234,
          },
          retweets: {
            type: 'integer',
            minimum: 0,
            example: 45,
            description: 'Twitter-specific metric',
          },
          upvotes: {
            type: 'integer',
            minimum: 0,
            example: 892,
            description: 'Reddit-specific metric',
          },
          downvotes: {
            type: 'integer',
            minimum: 0,
            example: 23,
            description: 'Reddit-specific metric',
          },
        },
        additionalProperties: true,
      },

      // Creator Data Schema
      CreatorData: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            example: '@fashionista_2024',
          },
          display_name: {
            type: 'string',
            example: 'Fashion Influencer',
          },
          follower_count: {
            type: 'integer',
            minimum: 0,
            example: 125000,
          },
          verified: {
            type: 'boolean',
            example: true,
          },
          profile_url: {
            type: 'string',
            format: 'uri',
            example: 'https://tiktok.com/@fashionista_2024',
          },
        },
        additionalProperties: true,
      },

      // Classification Results Schema
      ClassificationResults: {
        type: 'object',
        properties: {
          archetype_matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                archetype_id: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  example: 0.85,
                },
                reasoning: {
                  type: 'string',
                  example: 'Strong visual and thematic alignment with archetype characteristics',
                },
              },
              required: ['archetype_id', 'confidence'],
            },
          },
          keywords_extracted: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['aesthetic', 'minimalist', 'clean girl', 'natural'],
          },
          sentiment_score: {
            type: 'number',
            minimum: -1,
            maximum: 1,
            example: 0.7,
          },
          aesthetic_tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['minimalist', 'natural', 'effortless'],
          },
          ai_model_used: {
            type: 'string',
            example: 'gpt-4-vision-preview',
          },
          processed_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['archetype_matches', 'keywords_extracted', 'processed_at'],
        additionalProperties: true,
      },

      // User Schema
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          username: {
            type: 'string',
            example: 'fashionlover123',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          role: {
            $ref: '#/components/schemas/UserRole',
          },
          preferences: {
            type: 'object',
            properties: {
              favorite_archetypes: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'uuid',
                },
              },
              hidden_platforms: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Platform',
                },
              },
              content_filter_level: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                example: 'medium',
              },
            },
          },
          profile_data: {
            type: 'object',
            additionalProperties: true,
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          last_login_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'username', 'email', 'role', 'is_active', 'created_at', 'updated_at'],
      },

      // Archetype Schema
      Archetype: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          name: {
            type: 'string',
            example: 'Clean Girl Aesthetic',
          },
          slug: {
            type: 'string',
            example: 'clean-girl-aesthetic',
          },
          description: {
            type: 'string',
            example: 'A minimalist beauty trend emphasizing natural, effortless-looking makeup and hair.',
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['minimalist', 'natural', 'effortless', 'dewy skin'],
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['beauty', 'lifestyle'],
          },
          color_palette: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
            },
            example: ['#F5F5DC', '#E6E6FA', '#FFF8DC'],
          },
          metadata: {
            type: 'object',
            properties: {
              origin_date: {
                type: 'string',
                format: 'date',
                example: '2020-01-01',
              },
              peak_popularity: {
                type: 'string',
                format: 'date',
                example: '2022-06-01',
              },
              influence_score: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                example: 0.85,
              },
              platforms: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Platform',
                },
              },
            },
          },
          popularity_score: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.78,
          },
          influence_score: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.85,
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'archived'],
            example: 'active',
          },
          moderation_status: {
            $ref: '#/components/schemas/ModerationStatus',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'name', 'slug', 'description', 'keywords', 'status', 'created_at', 'updated_at'],
      },

      // Content Example Schema
      ContentExample: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          archetype_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          platform: {
            $ref: '#/components/schemas/Platform',
          },
          platform_id: {
            type: 'string',
            example: '7123456789012345678',
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://www.tiktok.com/@user/video/7123456789012345678',
          },
          content_data: {
            type: 'object',
            additionalProperties: true,
            example: {
              title: 'Clean Girl Morning Routine',
              duration: 30,
              hashtags: ['#cleangirl', '#morningroutine', '#skincare'],
            },
          },
          caption: {
            type: 'string',
            example: 'My effortless morning routine for that clean girl look ✨ #cleangirl #morningroutine',
          },
          media_type: {
            $ref: '#/components/schemas/MediaType',
          },
          engagement_metrics: {
            $ref: '#/components/schemas/EngagementMetrics',
          },
          creator_data: {
            $ref: '#/components/schemas/CreatorData',
          },
          classification_results: {
            $ref: '#/components/schemas/ClassificationResults',
          },
          confidence_score: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.92,
          },
          moderation_status: {
            $ref: '#/components/schemas/ModerationStatus',
          },
          is_featured: {
            type: 'boolean',
            example: false,
          },
          content_created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T08:30:00.000Z',
          },
          scraped_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'archetype_id', 'platform', 'url', 'moderation_status', 'scraped_at', 'created_at', 'updated_at'],
      },

      // Authentication Request Schemas
      RegisterRequest: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            example: 'fashionlover123',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'SecurePassword123!',
          },
          preferences: {
            type: 'object',
            properties: {
              favorite_archetypes: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'uuid',
                },
              },
              hidden_platforms: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Platform',
                },
              },
              content_filter_level: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                default: 'medium',
              },
            },
          },
        },
        required: ['username', 'email', 'password'],
      },

      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'SecurePassword123!',
          },
        },
        required: ['email', 'password'],
      },

      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User',
              },
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              expires_in: {
                type: 'string',
                example: '7d',
              },
            },
            required: ['user', 'token', 'expires_in'],
          },
          message: {
            type: 'string',
            example: 'Login successful',
          },
        },
        required: ['success', 'data'],
      },

      // Create/Update Request Schemas
      CreateArchetypeRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'Clean Girl Aesthetic',
          },
          slug: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
            example: 'clean-girl-aesthetic',
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            example: 'A minimalist beauty trend emphasizing natural, effortless-looking makeup and hair.',
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            example: ['minimalist', 'natural', 'effortless', 'dewy skin'],
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['beauty', 'lifestyle'],
          },
          color_palette: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
            },
            example: ['#F5F5DC', '#E6E6FA', '#FFF8DC'],
          },
          platforms: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Platform',
            },
            minItems: 1,
            example: ['tiktok', 'instagram'],
          },
        },
        required: ['name', 'slug', 'description', 'keywords', 'platforms'],
      },

      CreateContentExampleRequest: {
        type: 'object',
        properties: {
          archetype_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          platform: {
            $ref: '#/components/schemas/Platform',
          },
          platform_id: {
            type: 'string',
            example: '7123456789012345678',
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://www.tiktok.com/@user/video/7123456789012345678',
          },
          content_data: {
            type: 'object',
            additionalProperties: true,
            default: {},
          },
          caption: {
            type: 'string',
            example: 'My effortless morning routine for that clean girl look ✨',
          },
          media_type: {
            $ref: '#/components/schemas/MediaType',
          },
          engagement_metrics: {
            $ref: '#/components/schemas/EngagementMetrics',
          },
          creator_data: {
            $ref: '#/components/schemas/CreatorData',
          },
          confidence_score: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.92,
          },
          content_created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T08:30:00.000Z',
          },
        },
        required: ['archetype_id', 'platform', 'url'],
      },

      // Pagination Schema
      PaginationInfo: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            example: 50,
          },
          offset: {
            type: 'integer',
            minimum: 0,
            example: 0,
          },
          total: {
            type: 'integer',
            minimum: 0,
            example: 150,
          },
          has_more: {
            type: 'boolean',
            example: true,
          },
        },
        required: ['limit', 'offset', 'total'],
      },

      // Search Response Schema
      SearchResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              oneOf: [
                { $ref: '#/components/schemas/Archetype' },
                { $ref: '#/components/schemas/ContentExample' },
              ],
            },
          },
          pagination: {
            $ref: '#/components/schemas/PaginationInfo',
          },
        },
        required: ['success', 'data', 'pagination'],
      },

      // Request Schemas for Archetypes
      NewArchetypeRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'Clean Girl Aesthetic',
          },
          slug: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
            example: 'clean-girl-aesthetic',
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            example: 'A minimalist beauty trend emphasizing natural, effortless-looking makeup and hair.',
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            example: ['minimalist', 'natural', 'effortless', 'dewy skin'],
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['beauty', 'lifestyle'],
          },
          color_palette: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
            },
            example: ['#F5F5DC', '#E6E6FA', '#FFF8DC'],
          },
          metadata: {
            type: 'object',
            properties: {
              origin_date: {
                type: 'string',
                format: 'date',
                example: '2020-01-01',
              },
              peak_popularity: {
                type: 'string',
                format: 'date',
                example: '2022-06-01',
              },
              influence_score: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                example: 0.85,
              },
              platforms: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Platform',
                },
              },
            },
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'draft', 'archived'],
            default: 'active',
            example: 'active',
          },
        },
        required: ['name', 'slug', 'description', 'keywords'],
      },

      UpdateArchetypeRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'Clean Girl Aesthetic',
          },
          slug: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
            example: 'clean-girl-aesthetic',
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            example: 'A minimalist beauty trend emphasizing natural, effortless-looking makeup and hair.',
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['minimalist', 'natural', 'effortless', 'dewy skin'],
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['beauty', 'lifestyle'],
          },
          color_palette: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
            },
            example: ['#F5F5DC', '#E6E6FA', '#FFF8DC'],
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'draft', 'archived'],
            example: 'active',
          },
          moderation_status: {
            $ref: '#/components/schemas/ModerationStatus',
          },
        },
      },

      // Relationship Schemas
      ArchetypeRelationship: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          source_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          target_id: {
            type: 'string',
            format: 'uuid',
            example: '456e7890-e89b-12d3-a456-426614174000',
          },
          relationship_type: {
            type: 'string',
            enum: ['evolution', 'similarity', 'opposition', 'influence', 'subcategory', 'parent_category'],
            example: 'evolution',
          },
          weight: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.8,
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'source_id', 'target_id', 'relationship_type', 'weight', 'created_at', 'updated_at'],
      },

      NewRelationshipRequest: {
        type: 'object',
        properties: {
          target_id: {
            type: 'string',
            format: 'uuid',
            example: '456e7890-e89b-12d3-a456-426614174000',
          },
          relationship_type: {
            type: 'string',
            enum: ['evolution', 'similarity', 'opposition', 'influence', 'subcategory', 'parent_category'],
            example: 'evolution',
          },
          weight: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.5,
            example: 0.8,
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
            default: {},
          },
        },
        required: ['target_id', 'relationship_type'],
      },

      UpdateRelationshipRequest: {
        type: 'object',
        properties: {
          relationship_type: {
            type: 'string',
            enum: ['evolution', 'similarity', 'opposition', 'influence', 'subcategory', 'parent_category'],
            example: 'evolution',
          },
          weight: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.8,
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },

      // User Interaction Schema
      UserInteraction: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          archetype_id: {
            type: 'string',
            format: 'uuid',
            example: '456e7890-e89b-12d3-a456-426614174000',
          },
          interaction_type: {
            type: 'string',
            enum: ['view', 'like', 'save', 'share', 'comment'],
            example: 'like',
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
            description: 'Additional metadata about the interaction',
            example: {
              platform: 'web',
              session_id: 'sess_123456',
              referrer: 'search',
            },
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'user_id', 'archetype_id', 'interaction_type', 'created_at', 'updated_at'],
      },

      // Moderation Log Schema
      ModerationLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          moderator_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          target_type: {
            type: 'string',
            description: 'Type of content being moderated',
            example: 'archetype',
          },
          target_id: {
            type: 'string',
            format: 'uuid',
            example: '456e7890-e89b-12d3-a456-426614174000',
          },
          action: {
            type: 'string',
            enum: ['approve', 'reject', 'flag', 'remove', 'restore', 'warn', 'suspend', 'ban'],
            description: 'Moderation action taken',
            example: 'approve',
          },
          reason: {
            type: 'string',
            description: 'Reason for the moderation action',
            example: 'Content meets community guidelines',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the action',
            example: 'Reviewed and approved after user appeal',
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
            description: 'Additional metadata about the action',
            example: {
              appeal_id: 'appeal_123',
              review_time_minutes: 15,
            },
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['id', 'moderator_id', 'target_type', 'target_id', 'action', 'created_at', 'updated_at'],
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad Request - Invalid input parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes',
              method: 'POST',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'AUTHENTICATION_ERROR',
              message: 'Authentication required',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes',
              method: 'POST',
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'AUTHORIZATION_ERROR',
              message: 'Insufficient permissions',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes',
              method: 'POST',
            },
          },
        },
      },
      NotFound: {
        description: 'Not Found - Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'NOT_FOUND',
              message: 'Resource not found',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes/123',
              method: 'GET',
            },
          },
        },
      },
      TooManyRequests: {
        description: 'Too Many Requests - Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes/search',
              method: 'GET',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred',
              errorId: 'err_1234567890_abc123def',
              timestamp: '2024-01-15T10:30:00.000Z',
              path: '/api/archetypes',
              method: 'GET',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and profile management',
    },
    {
      name: 'Archetypes',
      description: 'Cultural archetype management and exploration',
    },
    {
      name: 'Content Examples',
      description: 'Social media content examples linked to archetypes',
    },
    {
      name: 'Users',
      description: 'User management and interactions',
    },
    {
      name: 'Moderation',
      description: 'Content moderation workflows',
    },
    {
      name: 'Admin',
      description: 'Administrative functions and monitoring',
    },
    {
      name: 'Analytics',
      description: 'Trend analysis and performance metrics',
    },
    {
      name: 'Content Scraping',
      description: 'Social media content scraping and data collection',
    },
    {
      name: 'Performance',
      description: 'System performance monitoring and optimization',
    },
    {
      name: 'Health',
      description: 'System health and monitoring',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'Huzzology API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
}; 