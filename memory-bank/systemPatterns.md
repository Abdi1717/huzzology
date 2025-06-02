# System Patterns

## Architecture Patterns

### Component Design Patterns
- **Composition over Inheritance**: Build complex components by composing simpler ones
- **Wrapper Pattern**: External components wrapped in `@/components/external-wrappers/`
- **Feature-Based Organization**: Components grouped by feature domain
- **Accessibility-First**: Every component designed with a11y as primary concern

### File Organization Patterns
```
.cursor/rules/           # Development rules and guidelines
├── core.mdc            # Plan/Act mode and core behavior
├── memory-bank.mdc     # Memory persistence rules
├── dev_workflow.mdc    # Development workflow patterns
├── taskmaster.mdc      # Task management integration
└── styling-guidelines.mdc # UI/UX standards

memory-bank/            # Persistent context across sessions
├── projectbrief.md     # Mission and goals
├── productContext.md   # Problem definition and value prop
├── techContext.md      # Technology stack and decisions
├── systemPatterns.md   # This file - design patterns
├── activeContext.md    # Current focus and recent changes
└── progress.md         # Milestones and completed features
```

### State Management Patterns
- **Context for Global State**: React Context for app-wide state
- **Local State for Components**: useState/useReducer for component-specific state
- **Custom Hooks**: Encapsulate complex state logic in reusable hooks
- **Prop Drilling Avoidance**: Use Context or component composition to avoid deep prop passing

## Development Patterns

### Plan/Act Workflow
1. **Plan Mode**: Analyze requirements, design approach, identify files to change
2. **User Types "ACT"**: Switch to execution mode
3. **Act Mode**: Implement planned changes
4. **Return to Plan**: Automatically return to planning after completion

### Memory Management
- **Read Before Act**: Always read memory-bank files before starting tasks
- **Update After Significant Changes**: Update memory bank when patterns change
- **Cross-Reference Rules**: Integrate with existing `.cursor/rules/` files
- **Context Preservation**: Maintain context across development sessions

### Task Management Integration
- **Taskmaster MCP**: AI-powered task breakdown and management
- **GitHub MCP**: Automated commits and project management
- **Context7 MCP**: Knowledge management and documentation

## UI/UX Patterns

### Component Hierarchy
```
Page Components (app/)
├── Layout Components (components/layouts/)
├── Feature Components (components/features/)
│   ├── ShadCN UI Components (components/ui/)
│   ├── Custom Components (components/custom/)
│   └── External Wrappers (components/external-wrappers/)
└── Utility Components (hooks/, lib/)
```

### Styling Patterns
- **Tailwind Utility-First**: Use Tailwind classes for all styling
- **Component Variants**: Use class-variance-authority for component variants
- **Responsive Design**: Mobile-first responsive design patterns
- **Dark/Light Mode**: Consistent theming across all components

### Accessibility Patterns
- **Semantic HTML**: Use proper HTML elements for their intended purpose
- **ARIA Attributes**: Add ARIA labels, roles, and properties where needed
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Focus Management**: Proper focus indicators and focus management
- **Screen Reader Support**: Descriptive text and proper labeling

## Code Quality Patterns

### TypeScript Patterns
- **Strict Typing**: Enable strict mode, avoid `any` type
- **Interface Definitions**: Clear interfaces for all component props
- **Type Guards**: Use type guards for runtime type checking
- **Utility Types**: Leverage TypeScript utility types (Partial, Pick, etc.)

### Testing Patterns
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Accessibility Tests**: Automated accessibility testing

### Error Handling Patterns
- **Error Boundaries**: React error boundaries for graceful error handling
- **Try-Catch Blocks**: Proper error handling in async operations
- **User-Friendly Messages**: Clear, actionable error messages for users
- **Logging**: Comprehensive logging for debugging and monitoring

## Integration Patterns

### MCP Integration
- **Taskmaster**: Task breakdown, progress tracking, dependency management
- **GitHub**: Automated commits, branch management, issue tracking
- **Context7**: Knowledge management, component documentation, research

### External Library Integration
- **Wrapper Components**: All external components wrapped for consistency
- **Gradual Adoption**: Introduce new libraries incrementally
- **Documentation**: Update ShadCN-context.md for all new components
- **Accessibility Verification**: Ensure external components meet a11y standards

## Performance Patterns

### Optimization Strategies
- **Code Splitting**: Dynamic imports for heavy components
- **Lazy Loading**: Load components and data on demand
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Bundle Analysis**: Regular bundle size monitoring and optimization

### Caching Patterns
- **Static Asset Caching**: Aggressive caching for images and static files
- **API Response Caching**: Cache API responses where appropriate
- **Component Memoization**: Prevent unnecessary re-renders

## Security Patterns

### Data Protection
- **Environment Variables**: Sensitive data in environment variables
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Proper sanitization and escaping
- **CSRF Protection**: Use Next.js built-in protections

### Authentication Patterns
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Implement proper authorization
- **Session Management**: Secure session handling
