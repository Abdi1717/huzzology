# Tech Context

## Core Technology Stack

### Frontend Framework
- **Next.js 15.3.2** with App Router
- **React 19.1.0** with React DOM 19.1.0
- **TypeScript 5.3.3** for type safety

### Styling & UI
- **Tailwind CSS 3.3.3** for utility-first styling
- **ShadCN UI** components via Radix UI primitives
- **Framer Motion 12.11.0** for animations
- **next-themes 0.4.6** for dark/light mode support
- **Lucide React 0.294.0** for icons

### Data Visualization
- **D3.js 7.9.0** for complex visualizations
- **Visx** for React-based D3 components (Sankey diagrams)
- **Chart.js 4.4.9** with React Chart.js 2 for standard charts
- **Recharts 2.15.3** for React-native charts
- **React Force Graph 1.47.6** for network visualizations

### Development Tools
- **ESLint 8.55.0** with TypeScript, React, and accessibility plugins
- **Prettier 3.5.3** for code formatting
- **Jest 29.7.0** with Testing Library for unit testing
- **Playwright 1.52.0** for end-to-end testing
- **Husky 9.1.7** for git hooks

### Build & Optimization
- **Webpack 5.99.8** for bundling
- **Bundle Analyzer** for performance monitoring
- **Autoprefixer** for CSS compatibility
- **SVGR** for SVG component generation

## Architecture Decisions

### Component Architecture
- **ShadCN UI as Primary**: Radix UI primitives with custom styling
- **Fallback Libraries**: Headless UI, Flowbite for missing components
- **Component Wrapping**: External components wrapped in `@/components/external-wrappers/`
- **Custom Components**: Project-specific components in `@/components/custom/`

### State Management
- **React Context** for global state
- **Local State** with hooks for component-specific state
- **No Redux**: Keeping state management simple and React-native

### File Structure
```
app/                    # Next.js App Router pages
├── dashboard/          # Main dashboard sections
│   ├── commute/       # Commute planning
│   ├── network/       # Network management
│   ├── notes/         # Note-taking
│   ├── radar/         # Personal insights
│   └── tasks/         # Task management
components/
├── ui/                # ShadCN UI components
├── custom/            # Project-specific components
├── external-wrappers/ # Wrapped external components
├── features/          # Feature-specific components
└── layouts/           # Layout components
```

### Integration Points
- **Taskmaster MCP**: AI-powered task management integration
- **GitHub MCP**: Automated version control and project management
- **Context7 MCP**: Knowledge management and component documentation

## Performance Considerations
- **Bundle Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Route-based and component-based splitting
- **Caching**: Aggressive caching strategies for static assets

## Accessibility Standards
- **WCAG AA Compliance**: Minimum accessibility standard
- **ESLint JSX A11y**: Automated accessibility linting
- **Semantic HTML**: Proper HTML structure and ARIA attributes
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper labeling and descriptions

## Development Workflow
- **Plan/Act Mode**: Structured development with memory persistence
- **Rule-Based Development**: Comprehensive `.cursor/rules/` system
- **Memory Bank**: Persistent context across development sessions
- **Automated Testing**: Unit, integration, and e2e testing
- **Code Quality**: ESLint, Prettier, and TypeScript for quality assurance

## Security Considerations
- **No Hardcoded Secrets**: Environment variables for sensitive data
- **Input Validation**: Comprehensive validation for all user inputs
- **XSS Prevention**: Proper sanitization and escaping
- **CSRF Protection**: Built-in Next.js protections

## Deployment & CI/CD
- **Vercel Deployment**: Optimized for Next.js applications
- **GitHub Actions**: Automated testing and deployment
- **Environment Management**: Separate configs for dev/staging/prod
- **Performance Monitoring**: Bundle analysis and performance tracking
