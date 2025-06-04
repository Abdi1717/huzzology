# Huzzology Project Structure

```
huzzology/
├── client/                          # Frontend React Application
│   ├── public/                      # Static assets
│   │   ├── vite.svg                # Vite logo
│   │   └── favicon.ico             # Application favicon
│   ├── src/                        # Source code
│   │   ├── components/             # React components
│   │   │   ├── graph/              # Graph visualization components
│   │   │   │   ├── ArchetypeNode.tsx
│   │   │   │   ├── GraphVisualization.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/             # Layout system components
│   │   │   │   ├── AppFooter.tsx
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── AppSidebar.tsx
│   │   │   ├── moderation/         # Content moderation components
│   │   │   ├── panels/             # Panel components
│   │   │   ├── ui/                 # ShadCN UI components (30+ components)
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── filter-badge.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── search-input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── theme-toggle.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ErrorBoundary.tsx   # Error boundary component
│   │   │   └── Layout.tsx          # Legacy layout component
│   │   ├── contexts/               # React contexts
│   │   │   └── ThemeContext.tsx    # Theme management context
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── use-toast.ts        # Toast notification hook
│   │   │   ├── useApi.ts           # API integration hooks
│   │   │   ├── useArchetypeData.ts # Archetype data management
│   │   │   ├── useNavigation.ts    # Type-safe navigation
│   │   │   └── useTheme.ts         # Theme management hook
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── api-client.ts       # HTTP API client
│   │   │   ├── mock-api.ts         # Mock API service
│   │   │   ├── mock-data.ts        # Mock data definitions
│   │   │   └── utils.ts            # Utility functions
│   │   ├── pages/                  # Page components
│   │   │   ├── ApiDemo.tsx         # API demonstration page
│   │   │   ├── ComponentsDemo.tsx  # UI components showcase
│   │   │   ├── Explore.tsx         # Explore page
│   │   │   ├── GraphDemo.tsx       # Graph visualization demo
│   │   │   ├── Home.tsx            # Home page
│   │   │   ├── LayoutDemo.tsx      # Layout demonstration
│   │   │   └── NotFound.tsx        # 404 error page
│   │   ├── stores/                 # State management
│   │   │   └── archetypeStore.ts   # Zustand archetype store
│   │   ├── test/                   # Test utilities
│   │   │   └── setup.ts            # Test setup configuration
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── archetype.ts        # Archetype data types
│   │   │   └── graph.ts            # Graph visualization types
│   │   ├── utils/                  # Utility functions
│   │   │   └── routes.ts           # Route definitions
│   │   ├── App.tsx                 # Main application component
│   │   ├── index.css               # Global styles
│   │   ├── main.tsx                # Application entry point
│   │   └── vite-env.d.ts           # Vite environment types
│   ├── .eslintrc.cjs               # ESLint configuration
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies
│   ├── postcss.config.js           # PostCSS configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── tsconfig.node.json          # Node TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   └── vitest.config.ts            # Vitest test configuration
├── docker/                         # Docker configuration
├── docs/                           # Project documentation
│   ├── ARCHITECTURE_OVERVIEW.md   # System architecture documentation
│   ├── PROJECT_STRUCTURE_TREE.md  # This file - project structure
│   └── ShadCN-context.md          # ShadCN component inventory
├── memory-bank/                    # Memory bank for AI context
├── server/                         # Backend API (Future implementation)
│   ├── src/                        # Server source code
│   │   ├── config/                 # Configuration files
│   │   ├── database/               # Database models and migrations
│   │   ├── middleware/             # Express middleware
│   │   ├── models/                 # Data models
│   │   ├── routes/                 # API routes
│   │   ├── scrapers/               # Data scraping utilities
│   │   ├── services/               # Business logic services
│   │   ├── test/                   # Server tests
│   │   └── utils/                  # Server utilities
│   └── package.json                # Server dependencies
├── shared/                         # Shared code between client/server
│   ├── src/                        # Shared source code
│   │   ├── constants/              # Shared constants
│   │   ├── schemas/                # Data schemas
│   │   ├── types/                  # Shared TypeScript types
│   │   ├── utils/                  # Shared utilities
│   │   └── validators/             # Data validation
│   └── package.json                # Shared dependencies
├── tasks/                          # Task management files
│   ├── task_001.txt                # Project Setup and Planning
│   ├── task_002.txt                # Database Design and Setup
│   ├── task_003.txt                # Data Collection and Scraping
│   ├── task_004.txt                # Frontend Foundation with React ✅
│   ├── task_005.txt                # Backend API Development
│   ├── task_006.txt                # Graph Visualization Implementation
│   ├── task_007.txt                # Real-time Features
│   ├── task_008.txt                # Content Moderation System
│   ├── task_009.txt                # Testing and Quality Assurance
│   ├── task_010.txt                # Deployment and DevOps
│   ├── task_011.txt                # Performance Optimization
│   └── tasks.json                  # Task management data
├── .cursor/                        # Cursor IDE configuration
│   ├── rules/                      # Development rules and guidelines
│   │   ├── Ai_agent_meta_rules_behavior.mdc
│   │   ├── DevOps_Deployment.mdc
│   │   ├── General_Performance_Optimizations.mdc
│   │   ├── Language_Specific_Rules.mdc
│   │   ├── communication_Documentation_rules.mdc
│   │   ├── core.mdc
│   │   ├── core_system_rules.mdc
│   │   ├── cursor_rules.mdc
│   │   ├── dev_workflow.mdc
│   │   ├── documentation_update.mdc
│   │   ├── error_handling_Debugging.mdc
│   │   ├── github-taskmaster.mdc
│   │   ├── huzzology-project.mdc
│   │   ├── logging.mdc
│   │   ├── memory-bank.mdc
│   │   ├── performance_optimization.mdc
│   │   ├── project_structure_and_organization_rules.mdc
│   │   ├── security.mdc
│   │   ├── self_improve.mdc
│   │   ├── shadcn_components.mdc
│   │   ├── styling-guidelines.mdc
│   │   ├── taskmaster.mdc
│   │   └── testing_and_quality_assurance_rules_code.mdc
│   └── mcp.json                    # MCP configuration
├── docker-compose.yml              # Docker Compose configuration
├── package.json                    # Root package.json
├── package-lock.json               # Dependency lock file
├── README.md                       # Project documentation
└── tsconfig.json                   # Root TypeScript configuration

## Key Directories Explained

### `/client` - Frontend Application
- **React 18 + TypeScript**: Modern React application with full type safety
- **ShadCN UI**: 30+ accessible UI components built on Radix UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **ReactFlow**: Graph visualization library

### `/server` - Backend API (Future)
- **Express.js**: Node.js web framework
- **Database Integration**: PostgreSQL with Prisma ORM
- **API Routes**: RESTful API endpoints
- **Data Scrapers**: Social media data collection

### `/shared` - Common Code
- **Types**: Shared TypeScript interfaces
- **Schemas**: Data validation schemas
- **Constants**: Application-wide constants
- **Utilities**: Shared helper functions

### `/docs` - Documentation
- **Architecture**: System design and technical decisions
- **Component Inventory**: ShadCN UI component tracking
- **Project Structure**: This file - canonical project map

### `/tasks` - Task Management
- **Individual Tasks**: Detailed task specifications
- **Task Data**: JSON-based task tracking
- **Progress Tracking**: Development milestone management

### `/.cursor` - Development Environment
- **Rules**: Coding standards and best practices
- **MCP Configuration**: AI assistant integration
- **Development Guidelines**: Project-specific conventions

## File Count Summary
- **Total Components**: 30+ UI components
- **React Pages**: 7 main pages
- **Custom Hooks**: 5 specialized hooks
- **Type Definitions**: 2 comprehensive type files
- **Documentation Files**: 3 major documentation files
- **Configuration Files**: 15+ build and development configs

## Technology Stack Summary
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, ShadCN UI
- **State Management**: Zustand, React Context
- **Routing**: React Router 6 with type safety
- **Visualization**: ReactFlow with custom nodes
- **Testing**: Vitest, React Testing Library
- **Build Tools**: Vite, ESLint, Prettier
- **Development**: Cursor IDE with MCP integration

---

*Last Updated: January 2025*
*Status: Frontend Foundation Complete (Task 4) ✅*
*Next: Backend API Development (Task 5)*
