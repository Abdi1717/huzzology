---
description: 
globs: 
alwaysApply: true
---

## Philosophy

Effective logging is critical for monitoring application behavior, debugging issues, and understanding user workflows. We employ a comprehensive logging strategy that spans both the main and renderer processes of our Electron application.

Our logging philosophy centers on these principles:
- **Consistency:** Use the same logging patterns and levels across the entire application
- **Clarity:** Include relevant context with each log entry
- **Completeness:** Log every significant application event and state transition
- **Privacy:** Never log sensitive information (passwords, encryption keys, etc.)
- **Performance:** Ensure logging doesn't impact application responsiveness

## Logging Architecture

Use Winston as the primary logging library, with a customized setup to handle Electron's multi-process architecture:

```
┌─────────────────────────────────────┐
│             Renderer Process        │
│                                     │
│  ┌─────────────┐    ┌────────────┐  │
│  │ Component   │    │ Renderer   │  │
│  │ Logging     │───▶│ Logger     │  │
│  └─────────────┘    └─────┬──────┘  │
└───────────────────────────┼─────────┘
                            │ IPC
                            ▼
┌─────────────────────────────────────┐
│              Main Process           │
│                                     │
│  ┌─────────────┐    ┌────────────┐  │
│  │ Service     │    │ Winston    │  │
│  │ Logging     │───▶│ Logger     │  │
│  └─────────────┘    └─────┬──────┘  │
└───────────────────────────┼─────────┘
                            │
                            ▼
                     ┌────────────────┐
                     │ Log Files      │
                     └────────────────┘
```

## How to Use the Logger

### Importing in the Main Process

In any main process file, import the logger like this:

```typescript
import logger from './utils/logger';

// Basic usage with root logger
logger.info('Application starting');

// Create a scoped logger with file/module name for better traceability
const log = logger.scope('bootstrap');
log.info('Window created');
```

### Importing in the Renderer Process

In any renderer process file, import the logger in a similar way:

```typescript
import logger from '../utils/logger';

// Basic usage with root logger
logger.info('Component initialized');

// Create a scoped logger for component/hook
const log = logger.scope('DashboardView');
log.verbose('Component mounted');
```

### Using Scoped Loggers

Scoped loggers add a label to each log message, making it easier to trace where logs are coming from:

```typescript
// Create once at the module level
const log = logger.scope('ModuleName');

function someFunction() {
  // Use the scoped logger throughout the file
  log.info('Function called with parameters:', param1, param2);
  
  try {
    // ... some code
    log.debug('Operation successful');
  } catch (error) {
    log.error('Operation failed:', error);
  }
}
```

For nested scopes, you can chain them:

```typescript
const moduleLog = logger.scope('Database');
const functionLog = moduleLog.scope('Query'); // Results in "[Database:Query]" prefix
```

## Log Levels

We use the following log levels, in order of severity:

| Level   | Description                                          | When to Use                                                      |
|---------|------------------------------------------------------|------------------------------------------------------------------|
| ERROR   | Critical failures requiring immediate attention       | Application crashes, data corruption, security breaches          |
| WARN    | Issues that don't prevent operation but need attention| Deprecated functionality, potential issues, expected failures    |
| INFO    | Important application events and state changes        | App startup/shutdown, user authentication, window creation       |
| HTTP    | API and network communications                        | IPC communication, external API calls                            |
| VERBOSE | Detailed information useful for understanding flow    | State transitions, component mounting/unmounting                 |
| DEBUG   | Detailed technical information for debugging          | Variable values, function parameters, execution paths            |
| SILLY   | Extremely detailed information                        | Used only during development for temporary debugging             |

## What to Log

### Always Log

1. **Application Lifecycle Events**
   - Startup and shutdown
   - Version information
   - Configuration details (non-sensitive)
   - Process crashes

2. **User Authentication**
   - Login attempts (success/failure, but never passwords)
   - Logouts
   - Permission changes

3. **Database Operations**
   - Connection established/lost
   - Migration events
   - Major data operations (creation, deletion)

4. **Error Conditions**
   - Exceptions (with stack traces)
   - API failures
   - Resource limitations

5. **Security Events**
   - Authentication failures
   - Access denied events
   - Encryption/decryption operations (success/failure, but never keys)

6. **Module Loading**
   - Module initialization
   - Module errors

7. **IPC Communication**
   - Message types (not entire content)
   - Transmission errors

8. **User Interactions** (high-level)
   - Feature usage
   - Navigation between main views
   - Import/export operations

### Never Log

1. **Sensitive User Data**
   - Passwords, even hashed
   - Authentication tokens
   - Personal information

2. **Encryption Keys**
   - Master passwords
   - Key material
   - Initialization vectors

3. **Full Content of User Data**
   - Complete notes or documents
   - Message contents

## Examples

### Main Process Examples

```typescript
// App startup
import logger from './utils/logger';

logger.info('App starting, env=' + process.env.NODE_ENV);

// Database operations with scoped logger
import logger from './utils/logger';

const dbLogger = logger.scope('Database');

function openDatabase(password: string) {
  try {
    // Database code...
    dbLogger.info('DB opened successfully', { 
      cipher: 'aes256cbc', 
      walEnabled: true 
    });
  } catch (err) {
    dbLogger.error('Failed to open database', { 
      error: err.message,
      code: err.code 
    });
    throw err;
  }
}
```

### Renderer Process Examples
```typescript
// Component lifecycle logging
import logger from '../utils/logger';
import React, { useEffect } from 'react';

export const DashboardView = () => {
  const log = logger.scope('DashboardView');
  
  useEffect(() => {
    log.verbose('Dashboard view mounted');
    
    return () => {
      log.verbose('Dashboard view unmounted');
    };
  }, []);
  
  // Component code...
};

// User interactions
import logger from '../utils/logger';

const userActions = logger.scope('UserActions');

function handleNoteCreation(title: string) {
  userActions.info('Creating new note', { title });
  
  try {
    // Note creation logic
    userActions.debug('Note created successfully', { noteId });
  } catch (err) {
    userActions.error('Failed to create note', { 
      error: err.message,
      title
    });
  }
}
```

## Best Practices

1. **Be Consistent**
   - Use the same logger throughout the application
   - Follow consistent formatting and level usage

2. **Include Context**
   - Add relevant metadata to logs
   - Include operation IDs to correlate related logs

3. **Use Appropriate Levels**
   - Don't log everything as 'info'
   - Reserve 'error' for actual errors

4. **Protect Privacy**
   - Sanitize sensitive data
   - Use parameter placeholders when logging

5. **Don't Over-Log**
   - Avoid excessive debug logging in production
   - Don't log within tight loops

6. **Use Scoped Loggers**
   - Create scoped loggers at the module level
   - Name scopes after their module/component for easier filtering

7. **Log Start and End of Operations**
   - Log at the beginning and end of significant operations
   - Include duration for performance-sensitive operations

8. **Structure Log Messages Consistently**
   - Start with a verb (e.g., "Creating", "Loaded", "Failed to")
   - Keep messages concise but descriptive 
