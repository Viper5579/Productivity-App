# Productivity Gamification App - Architecture

## Design Principles

### 1. Modularity First
- Each feature is a self-contained module with clear interfaces
- Modules can be removed without breaking the core app
- Dependencies flow one direction (no circular dependencies)

### 2. Plugin Architecture
- Features register themselves with the core system
- Core app works without any plugins
- Plugins communicate through events and service interfaces

### 3. Clear Separation of Concerns
- **Presentation Layer**: UI components (React)
- **Application Layer**: Business logic and orchestration
- **Domain Layer**: Core entities and rules
- **Infrastructure Layer**: External services, database, APIs

## Project Structure

```
productivity-app/
├── backend/
│   ├── src/
│   │   ├── core/                    # Core application framework
│   │   │   ├── app.ts              # Express app setup
│   │   │   ├── database.ts         # Database connection
│   │   │   ├── logger.ts           # Logging infrastructure
│   │   │   └── plugin-manager.ts   # Plugin registration system
│   │   │
│   │   ├── modules/                 # Feature modules (all optional)
│   │   │   ├── auth/               # Authentication module
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.model.ts
│   │   │   │   └── index.ts        # Module export/registration
│   │   │   │
│   │   │   ├── canvas/             # Canvas LMS integration
│   │   │   │   ├── canvas.routes.ts
│   │   │   │   ├── canvas.service.ts
│   │   │   │   ├── canvas-api.client.ts
│   │   │   │   ├── canvas-sync.worker.ts
│   │   │   │   ├── canvas.model.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── assignments/        # Assignment management
│   │   │   │   ├── assignment.routes.ts
│   │   │   │   ├── assignment.service.ts
│   │   │   │   ├── assignment-filter.service.ts
│   │   │   │   ├── assignment.model.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── gamification/       # XP, levels, streaks (Phase 2)
│   │   │   │   └── [Phase 2]
│   │   │   │
│   │   │   ├── habits/             # Habit tracking (Phase 3)
│   │   │   │   └── [Phase 3]
│   │   │   │
│   │   │   ├── scheduling/         # Intelligent scheduling (Phase 3)
│   │   │   │   └── [Phase 3]
│   │   │   │
│   │   │   └── analytics/          # Analytics dashboard (Phase 4)
│   │   │       └── [Phase 4]
│   │   │
│   │   ├── shared/                  # Shared utilities
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── middleware/
│   │   │   └── validators/
│   │   │
│   │   └── server.ts               # Application entry point
│   │
│   ├── migrations/                  # Database migrations
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── core/                    # Core framework
│   │   │   ├── App.tsx
│   │   │   ├── Router.tsx
│   │   │   ├── api-client.ts
│   │   │   └── hooks/
│   │   │
│   │   ├── features/                # Feature modules (all optional)
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── canvas/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── assignments/
│   │   │   │   └── [components, hooks, pages]
│   │   │   │
│   │   │   ├── gamification/        # Phase 2
│   │   │   ├── habits/              # Phase 3
│   │   │   ├── scheduling/          # Phase 3
│   │   │   └── analytics/           # Phase 4
│   │   │
│   │   ├── shared/                  # Shared UI components
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   │
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                          # Shared between frontend/backend
│   ├── types/
│   └── constants/
│
└── docs/                            # Documentation
    ├── PHASE-1.md
    ├── PHASE-2.md
    └── API.md
```

## Module System

### Module Registration (Backend)

Each module exports a registration function:

```typescript
// modules/canvas/index.ts
export const CanvasModule = {
  name: 'canvas',
  routes: canvasRoutes,
  services: [CanvasSyncService],
  migrations: ['001_canvas_tables.sql'],
  dependencies: ['auth', 'assignments']  // Optional dependencies
};
```

### Module Loading (Backend)

```typescript
// core/plugin-manager.ts
class PluginManager {
  private modules: Map<string, Module> = new Map();

  register(module: Module) {
    // Register routes, services, etc.
    // Check dependencies
    // Initialize module
  }

  unregister(moduleName: string) {
    // Clean up module
    // Remove routes
    // Stop services
  }
}
```

### Feature Flags

```typescript
// config/features.ts
export const FEATURES = {
  CANVAS_INTEGRATION: true,
  GAMIFICATION: false,      // Phase 2
  HABITS: false,            // Phase 3
  SCHEDULING: false,        // Phase 3
  ANALYTICS: false,         // Phase 4
  AI_ENHANCEMENT: false     // Phase 5
};
```

## Module Communication

### Event Bus Pattern

Modules communicate through events, not direct calls:

```typescript
// Example: Assignment completion triggers XP calculation
eventBus.emit('assignment:completed', { assignmentId, userId, completedAt });

// Gamification module listens (if enabled)
eventBus.on('assignment:completed', (data) => {
  xpService.calculateAndAwardXP(data);
});
```

### Service Interfaces

Modules expose services through interfaces:

```typescript
// modules/canvas/canvas.service.interface.ts
export interface ICanvasService {
  syncAssignments(userId: string): Promise<void>;
  getAssignments(userId: string): Promise<Assignment[]>;
}

// Other modules use the interface, not the implementation
```

## Database Strategy

### Modular Schema

Each module owns its tables:

```sql
-- auth module
users
user_sessions

-- canvas module
canvas_connections
canvas_courses
canvas_raw_assignments

-- assignments module
assignments
assignment_completions

-- gamification module (Phase 2)
user_xp
user_levels
streaks
```

### Soft Dependencies

Use foreign keys for hard dependencies, service calls for soft dependencies:

```typescript
// Hard: assignment belongs to user (core relationship)
assignments.user_id -> users.id

// Soft: XP calculation uses assignment (optional feature)
// Use service call instead of FK
```

## How to Remove a Module

1. **Disable in config**: Set feature flag to `false`
2. **Remove route registration**: Comment out in module loader
3. **Database cleanup**: Migrations handle backwards compatibility
4. **UI cleanup**: Remove feature from router

Example - Removing Canvas Integration:

```typescript
// 1. Disable feature
FEATURES.CANVAS_INTEGRATION = false

// 2. Module won't load (automatic)
if (FEATURES.CANVAS_INTEGRATION) {
  pluginManager.register(CanvasModule);
}

// 3. UI automatically hides (feature flag check)
{FEATURES.CANVAS_INTEGRATION && <CanvasSetup />}
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Kysely (lightweight, type-safe)
- **Validation**: Zod
- **Authentication**: JWT + bcrypt
- **Background Jobs**: BullMQ + Redis
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight)
- **API Client**: TanStack Query (React Query)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts (Phase 4)
- **Testing**: Vitest + React Testing Library

### DevOps
- **Containerization**: Docker + Docker Compose
- **Environment**: dotenv
- **Logging**: Winston (backend), Console (frontend)
- **Code Quality**: ESLint, Prettier

## Security Architecture

### Encryption at Rest
```typescript
// Sensitive data encrypted before storage
class EncryptionService {
  encrypt(data: string): string;
  decrypt(data: string): string;
}

// Canvas tokens always encrypted
canvasToken = encryptionService.encrypt(rawToken);
```

### API Token Management
```typescript
// Separate storage for API credentials
api_credentials table (encrypted)
  - user_id
  - service_name
  - encrypted_token
  - created_at
  - last_used_at
```

### Rate Limiting
```typescript
// Per-user, per-endpoint rate limits
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});
```

## Performance Considerations

### Caching Strategy
- **Redis**: Session data, frequently accessed assignments
- **In-memory**: Feature flags, configuration
- **Database**: Query results (PostgreSQL built-in)

### Background Processing
- **Sync Jobs**: Canvas sync every 30 minutes
- **XP Calculations**: Async, doesn't block completion marking
- **Analytics**: Pre-calculated, cached results

### Offline Support
- **Frontend**: Service Worker + IndexedDB (optional Phase 6)
- **Sync Queue**: Store actions when offline, sync when online

## Development Workflow

### Starting Development
```bash
# Start all services
docker-compose up -d

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

### Adding a New Module

1. Create module folder in `modules/`
2. Implement routes, services, models
3. Create module registration file
4. Register with plugin manager
5. Add feature flag
6. Create frontend feature folder
7. Add to router (with feature flag check)

### Testing Strategy

- **Unit Tests**: Individual functions, utilities
- **Integration Tests**: Module interactions, API endpoints
- **E2E Tests**: Critical user flows (Playwright)
- **Test Coverage**: Minimum 70% for core modules

## Deployment Architecture

```
[Load Balancer]
      |
      v
[App Servers] (stateless, horizontal scaling)
      |
      +-- [PostgreSQL] (primary + replica)
      +-- [Redis] (session + cache + queues)
      +-- [Background Workers] (BullMQ)
```

## Monitoring & Observability

- **Application Logs**: Winston -> CloudWatch/Datadog
- **Error Tracking**: Sentry
- **Performance**: Custom middleware timing
- **Health Checks**: `/health` endpoint
- **Metrics**: Prometheus + Grafana (optional)

## Future Extensibility

### Plugin Marketplace (Future)
- Third-party modules can be added
- Sandboxed execution
- Version compatibility checks

### API for External Integrations
- RESTful API for all features
- Webhook support for external systems
- OAuth for third-party apps

## Summary

This architecture prioritizes:
1. **Modularity**: Easy to add/remove features
2. **Scalability**: Stateless design, horizontal scaling
3. **Maintainability**: Clear structure, strong typing
4. **Security**: Encryption, authentication, rate limiting
5. **Performance**: Caching, async processing, optimization
6. **Developer Experience**: Hot reload, strong typing, good tooling
