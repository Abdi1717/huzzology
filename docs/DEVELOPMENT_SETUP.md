# Development Environment Setup

This guide will help you set up your development environment for the Huzzology project.

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version

### Recommended Tools

- **VS Code** or **Cursor** with the following extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Auto Rename Tag
  - Bracket Pair Colorizer

## Environment Verification

Check your current versions:

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
git --version   # Any recent version
```

**Current Environment Status:**
- ✅ Node.js: v20.12.2 (meets requirement ≥18.0.0)
- ✅ npm: 10.5.0 (meets requirement ≥9.0.0)
- ✅ Git: Available

## Project Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd huzzology
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install
   
   # Install workspace dependencies
   npm run setup
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Verify setup**:
   ```bash
   # Check if TypeScript compiles
   npm run build
   
   # Run linting
   npm run lint
   
   # Run tests
   npm test
   ```

## Development Workflow

### Starting Development Servers

```bash
# Start both client and server in development mode
npm run dev

# Or start them individually:
npm run dev:client  # React app on http://localhost:3000
npm run dev:server  # API server on http://localhost:8000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run build` | Build both client and server for production |
| `npm run test` | Run all tests |
| `npm run lint` | Run ESLint on all workspaces |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Clean build artifacts |

### Workspace Structure

```
huzzology/
├── client/          # React frontend (port 3000)
├── server/          # Node.js backend (port 8000)
├── shared/          # Shared types and utilities
└── docs/            # Documentation
```

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Recommended Extensions

Install these VS Code extensions:

```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension dbaeumer.vscode-eslint
```

## Troubleshooting

### Common Issues

1. **Node version mismatch**:
   - Use nvm to manage Node.js versions
   - Install Node.js 18+ from [nodejs.org](https://nodejs.org)

2. **Permission errors on npm install**:
   - Don't use `sudo` with npm
   - Configure npm to use a different directory for global packages

3. **Port conflicts**:
   - Client runs on port 3000, server on port 8000
   - Change ports in `client/vite.config.ts` and `server/src/index.ts` if needed

4. **TypeScript compilation errors**:
   - Ensure all workspaces are built: `npm run build`
   - Check TypeScript configuration in each workspace

### Getting Help

- Check the [README.md](../README.md) for project overview
- Review [project rules](.cursor/rules/) for coding standards
- Use Taskmaster for project management: `npm run tasks`

## Next Steps

After setting up your environment:

1. Review the [project structure](../README.md#project-structure)
2. Check current tasks: `npm run tasks:next`
3. Start with the development workflow
4. Follow the coding standards in `.cursor/rules/`

---

**Environment Setup Complete!** 🎉

You're ready to start developing Huzzology. Happy coding! 