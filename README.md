# 🧠 Huzzology

> **Real-time visual mapping of women's pop culture archetypes, trends, and aesthetics**

Huzzology helps users (especially those outside the cultural loop) get a real-time visual map of evolving women's pop culture archetypes, trends, aesthetics, and memes — all gathered from across the internet.

## 🎯 Vision

Create the definitive platform for understanding women's pop culture archetypes through interactive data visualization, making cultural trends accessible and fun to explore.

## ✨ Features

### Core Functionality
- **Interactive Graph Visualization** - Explore archetype relationships using ReactFlow + Dagre
- **Real-time Data Ingestion** - Scrape content from TikTok, Twitter/X, Instagram, and Reddit
- **AI-Powered Classification** - Use embeddings and LLMs to cluster content into archetypes
- **Timeline Evolution** - Visualize how archetypes emerge and evolve over time
- **Smart Search & Filtering** - Find archetypes by keywords, platforms, or trends

### User Experience
- **"Start with a vibe"** onboarding - Discover through 3 trending archetypes
- **Detailed Archetype Panels** - Rich content with examples, influencers, and aesthetics
- **Mobile-First Design** - Touch-friendly interactions across all devices
- **Cultural Sensitivity** - Content moderation and inclusive representation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ReactFlow   │  │ Zustand     │  │ Tailwind CSS +      │  │
│  │ Graph       │  │ State Mgmt  │  │ Framer Motion       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Node.js + Express)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ RESTful     │  │ WebSocket   │  │ Authentication &    │  │
│  │ Endpoints   │  │ Real-time   │  │ Rate Limiting       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Data Processing Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Puppeteer/  │  │ OpenAI/     │  │ Content             │  │
│  │ Playwright  │  │ Cohere      │  │ Moderation          │  │
│  │ Scrapers    │  │ Embeddings  │  │ System              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (MongoDB/PostgreSQL)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Archetype   │  │ Content     │  │ User Data &         │  │
│  │ Metadata    │  │ Examples    │  │ Preferences         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **React 18+** with TypeScript
- **ReactFlow** for graph visualization
- **Dagre** for automatic graph layout
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** or **PostgreSQL** for data storage
- **Redis** for caching and sessions
- **Puppeteer/Playwright** for web scraping
- **OpenAI/Cohere** APIs for content classification

### Infrastructure
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **CDN** for media content delivery
- **WebSocket** for real-time updates

## 📋 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/huzzology.git
   cd huzzology
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your API keys
   # ANTHROPIC_API_KEY=your_key_here
   # OPENAI_API_KEY=your_key_here
   # DATABASE_URL=your_database_url_here
   ```

4. **Start development servers**
   ```bash
   # Start both client and server
   npm run dev
   
   # Or start individually
   npm run dev:client  # React app on http://localhost:3000
   npm run dev:server  # API server on http://localhost:8000
   ```

## 📁 Project Structure

```
huzzology/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── graph/      # ReactFlow components
│   │   │   ├── panels/     # Side panels for archetype details
│   │   │   ├── ui/         # Basic UI components
│   │   │   └── moderation/ # Content moderation interface
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Database models
│   │   ├── scrapers/       # Data ingestion modules
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Server utilities
│   └── tests/              # Server-side tests
├── shared/                 # Shared types and utilities
├── docs/                   # Project documentation
├── .cursor/                # Cursor IDE rules and configuration
└── tasks/                  # Taskmaster project management
```

## 🎨 Data Models

### Archetype Node
```typescript
interface ArchetypeNode {
  id: string;                    // kebab-case: 'clean-girl'
  label: string;                 // Display name: 'Clean Girl'
  description: string;           // Brief explanation
  keywords: string[];            // Hashtags and terms
  influences: string[];          // Related archetype IDs
  examples: ContentExample[];    // Source content
  color: string;                 // Hex color for visualization
  metadata: {
    origin_date?: string;
    peak_popularity?: string;
    influence_score: number;     // 0-1 scale
    platforms: Platform[];
  };
}
```

### Content Example
```typescript
interface ContentExample {
  platform: 'tiktok' | 'twitter' | 'instagram' | 'reddit';
  url: string;
  caption?: string;
  timestamp: string;
  engagement_metrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
  creator?: {
    username: string;
    follower_count?: number;
  };
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test suites
npm run test:client
npm run test:server
```

## 📊 Development Workflow

This project uses **Taskmaster** for project management. Key commands:

```bash
# View all tasks
npx task-master-ai list

# Get next task to work on
npx task-master-ai next

# View specific task details
npx task-master-ai show <task-id>

# Update task status
npx task-master-ai set-status --id=<task-id> --status=done
```

## 🔒 Security & Privacy

- **Content Filtering**: Automatic filtering of explicit content
- **Cultural Sensitivity**: Human moderation for appropriate representation
- **Data Protection**: GDPR compliance and user privacy protection
- **Rate Limiting**: Respectful scraping practices
- **Authentication**: Secure user authentication and authorization

## 🌟 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the coding standards** (see `.cursor/rules/`)
4. **Write tests** for new functionality
5. **Commit changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow the **Huzzology Project Rules** in `.cursor/rules/huzzology-project.mdc`
- Use **TypeScript** for all new code
- Write **comprehensive tests** for new features
- Ensure **mobile responsiveness** for UI components
- Consider **cultural sensitivity** in all content-related features

## 📈 Roadmap

### Phase 1: MVP (Months 1-3)
- [x] Project setup and infrastructure
- [ ] Basic graph visualization
- [ ] Content scraping pipeline
- [ ] AI-powered classification
- [ ] Mobile-responsive design

### Phase 2: Enhanced Features (Months 4-6)
- [ ] Real-time data updates
- [ ] Advanced search and filtering
- [ ] Timeline visualization
- [ ] Content moderation system
- [ ] User onboarding experience

### Phase 3: Advanced Analytics (Months 7-12)
- [ ] Trend forecasting
- [ ] Archetype comparison tools
- [ ] User-generated content
- [ ] API for third-party integrations
- [ ] Mobile app development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cultural Researchers** who study digital trends and social movements
- **Content Creators** who shape and define these archetypes
- **Open Source Community** for the amazing tools and libraries
- **Women's Pop Culture** for being endlessly creative and inspiring

---

**Made with 💜 for understanding and celebrating women's digital culture**

For questions, suggestions, or collaboration opportunities, please open an issue or reach out to the team.

## 🧠 Content Classification Engine

The core of Huzzology's intelligence is its **Content Classification Engine** - a sophisticated pipeline for analyzing and categorizing content into meaningful archetypes:

### Classification Pipeline

```
┌─────────────────────────┐
│ Content Ingestion       │◄───── Social Media Content
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Embedding Generation    │◄───── OpenAI text-embedding-ada-002
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Content Clustering      │◄───── K-means algorithm with
└───────────┬─────────────┘       dynamic cluster optimization
            ▼
┌─────────────────────────┐
│ Archetype Identification│◄───── LLM-based labeling (GPT models)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Content Classification  │◄───── Similarity-based assignment
└───────────┬─────────────┘       to existing archetypes
            ▼
┌─────────────────────────┐
│ Influence Calculation   │◄───── Multiple influence metrics
└───────────┬─────────────┘       (centrality, engagement, temporal)
            ▼
┌─────────────────────────┐
│ Visualization           │◄───── ReactFlow graph representation
└─────────────────────────┘
```

### Key Components

- **EmbeddingGenerator**: Converts raw content into vector embeddings using OpenAI's models
- **ContentClusterer**: Implements K-means clustering to group similar content
- **ArchetypeIdentifier**: Uses GPT models to identify and label emerging archetypes
- **ContentClassifier**: Assigns content to existing archetypes based on similarity
- **InfluenceCalculator**: Determines influence scores through multiple methodologies

### Technology Stack

- **Vector Embeddings**: OpenAI's text-embedding-ada-002 model
- **Clustering**: K-means implementation with dynamic cluster count
- **Language Models**: OpenAI GPT for archetype identification and labeling
- **Database Integration**: PostgreSQL with Drizzle ORM for persistence
- **API Access**: RESTful endpoints for classification operations

## 🎨 Data Models
