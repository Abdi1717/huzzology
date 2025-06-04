/**
 * API Documentation Routes
 * Serves OpenAPI/Swagger documentation and related endpoints
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { swaggerSpec, swaggerUiOptions } from '../config/swagger.js';

const router = Router();

/**
 * @swagger
 * /docs:
 *   get:
 *     summary: API Documentation (Swagger UI)
 *     description: Interactive API documentation using Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

/**
 * @swagger
 * /docs/json:
 *   get:
 *     summary: OpenAPI Specification (JSON)
 *     description: Raw OpenAPI specification in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /docs/yaml:
 *   get:
 *     summary: OpenAPI Specification (YAML)
 *     description: Raw OpenAPI specification in YAML format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/yaml:
 *             schema:
 *               type: string
 */
router.get('/yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.send(yaml.dump(swaggerSpec));
});

/**
 * @swagger
 * /docs/redoc:
 *   get:
 *     summary: API Documentation (ReDoc)
 *     description: Alternative API documentation using ReDoc
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: ReDoc HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/redoc', (req, res) => {
  const redocHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Huzzology API Documentation - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <redoc spec-url='/api/docs/json'></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `;
  res.send(redocHtml);
});

/**
 * @swagger
 * /docs/postman:
 *   get:
 *     summary: Postman Collection
 *     description: Download Postman collection for API testing
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Postman collection JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/postman', (req, res) => {
  // Generate Postman collection from OpenAPI spec
  const postmanCollection = {
    info: {
      name: 'Huzzology API',
      description: swaggerSpec.info.description,
      version: swaggerSpec.info.version,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:3001/api',
        type: 'string',
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string',
      },
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Register User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  username: 'testuser',
                  email: 'test@example.com',
                  password: 'SecurePassword123!',
                }),
              },
              url: {
                raw: '{{base_url}}/auth/register',
                host: ['{{base_url}}'],
                path: ['auth', 'register'],
              },
            },
          },
          {
            name: 'Login User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'test@example.com',
                  password: 'SecurePassword123!',
                }),
              },
              url: {
                raw: '{{base_url}}/auth/login',
                host: ['{{base_url}}'],
                path: ['auth', 'login'],
              },
            },
          },
          {
            name: 'Get Current User',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}',
                },
              ],
              url: {
                raw: '{{base_url}}/auth/me',
                host: ['{{base_url}}'],
                path: ['auth', 'me'],
              },
            },
          },
        ],
      },
      {
        name: 'Archetypes',
        item: [
          {
            name: 'Search Archetypes',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/archetypes/search?q=clean girl&limit=10',
                host: ['{{base_url}}'],
                path: ['archetypes', 'search'],
                query: [
                  {
                    key: 'q',
                    value: 'clean girl',
                  },
                  {
                    key: 'limit',
                    value: '10',
                  },
                ],
              },
            },
          },
          {
            name: 'Get Trending Archetypes',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/archetypes/trending?limit=20',
                host: ['{{base_url}}'],
                path: ['archetypes', 'trending'],
                query: [
                  {
                    key: 'limit',
                    value: '20',
                  },
                ],
              },
            },
          },
          {
            name: 'Create Archetype',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}',
                },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  name: 'Test Archetype',
                  slug: 'test-archetype',
                  description: 'A test archetype for API documentation',
                  keywords: ['test', 'example'],
                  platforms: ['tiktok', 'instagram'],
                }),
              },
              url: {
                raw: '{{base_url}}/archetypes',
                host: ['{{base_url}}'],
                path: ['archetypes'],
              },
            },
          },
        ],
      },
      {
        name: 'Content Examples',
        item: [
          {
            name: 'Search Content Examples',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/content-examples/search?platforms=tiktok&limit=10',
                host: ['{{base_url}}'],
                path: ['content-examples', 'search'],
                query: [
                  {
                    key: 'platforms',
                    value: 'tiktok',
                  },
                  {
                    key: 'limit',
                    value: '10',
                  },
                ],
              },
            },
          },
          {
            name: 'Create Content Example',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}',
                },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  archetype_id: '123e4567-e89b-12d3-a456-426614174000',
                  platform: 'tiktok',
                  url: 'https://www.tiktok.com/@user/video/7123456789012345678',
                  caption: 'Test content example',
                }),
              },
              url: {
                raw: '{{base_url}}/content-examples',
                host: ['{{base_url}}'],
                path: ['content-examples'],
              },
            },
          },
        ],
      },
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="huzzology-api.postman_collection.json"');
  res.json(postmanCollection);
});

export default router; 