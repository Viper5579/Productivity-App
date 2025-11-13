# Productivity Gamification App

A modular personal productivity application that automatically pulls academic assignments from Canvas LMS, gamifies task completion, tracks daily habits, and provides performance metrics.

## 🎯 Overview

This application helps students stay on top of their academic work by:

- 🎓 Automatically syncing assignments from Canvas LMS
- ✅ Smart filtering to show only relevant assignments
- 📋 Assignment completion tracking
- 🎮 Gamification with XP, levels, and streaks (Phase 2+)
- 📊 Analytics and performance tracking (Phase 4)
- 🤖 AI-powered insights (Phase 5)

**Key Design Principle**: Every feature is a self-contained module that can be easily added or removed without breaking the core app.

## ✅ Current Status: Phase 1 Complete

### Implemented Features

- ✅ User authentication (registration, login, JWT)
- ✅ Canvas LMS integration (multiple instances supported)
- ✅ Automatic assignment synchronization (every 30 minutes)
- ✅ Smart assignment filtering (removes informational items)
- ✅ Assignment completion tracking
- ✅ User-defined filter patterns
- ✅ Background sync worker
- ✅ Dashboard with assignment list
- ✅ Canvas connection management UI
- ✅ Modular plugin architecture

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Canvas LMS account with API access

### Setup (5 minutes)

1. **Clone and install**
```bash
git clone <your-repo>
cd Productivity-App
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Setup backend**
```bash
cd backend
npm install
cp ../.env.example ../.env
# Edit .env with your secrets
npm run migrate
npm run dev
```

4. **Setup frontend** (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

5. **Access the app**
- Open http://localhost:3000
- Register an account
- Go to Canvas Setup
- Add your Canvas connection

### Getting Canvas API Token

1. Login to Canvas
2. Account → Settings
3. Scroll to "Approved Integrations"
4. Click "+ New Access Token"
5. Copy token and paste in app

## 📁 Project Structure

```
productivity-app/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── core/        # Framework (app, database, logger, plugins)
│   │   ├── modules/     # Feature modules
│   │   │   ├── auth/           ← Authentication
│   │   │   ├── canvas/         ← Canvas LMS integration
│   │   │   ├── assignments/    ← Assignment management
│   │   │   ├── gamification/   ← Phase 2
│   │   │   ├── habits/         ← Phase 3
│   │   │   ├── scheduling/     ← Phase 3
│   │   │   └── analytics/      ← Phase 4
│   │   └── shared/      # Shared utilities
│   └── migrations/      # Database migrations
│
├── frontend/            # React + TypeScript
│   ├── src/
│   │   ├── core/       # App setup, routing, API
│   │   ├── features/   # Feature modules (matches backend)
│   │   └── shared/     # Shared UI components
│
├── docs/               # Documentation
├── docker-compose.yml  # PostgreSQL + Redis
└── .env.example       # Environment template
```

## 🏗️ Architecture

### Modular Plugin System

Each feature is a self-contained module that:
- Has its own routes, services, and database tables
- Declares dependencies on other modules
- Can be enabled/disabled with feature flags
- Registers itself with the plugin manager

**Example Module:**
```typescript
export const CanvasModule: Module = {
  name: 'canvas',
  routes: canvasRoutes,
  dependencies: ['auth'],

  async initialize() {
    canvasSyncWorker.start();
  },

  async cleanup() {
    canvasSyncWorker.stop();
  }
};
```

### Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js (API server)
- PostgreSQL + Kysely (database)
- Redis + BullMQ (background jobs)
- JWT (authentication)
- Zod (validation)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Zustand (state management)
- Tailwind CSS (styling)
- React Hook Form + Zod

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Canvas Integration
- `POST /api/canvas/connections` - Create connection
- `GET /api/canvas/connections` - List connections
- `POST /api/canvas/connections/:id/sync` - Sync now
- `DELETE /api/canvas/connections/:id` - Remove

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments/:id/complete` - Mark complete
- `POST /api/assignments/:id/uncomplete` - Undo
- `GET /api/assignments/stats` - Get statistics
- `GET /api/assignments/filters` - Get filters
- `POST /api/assignments/filters` - Add filter

## 🗄️ Database Schema

**Phase 1 Tables:**
- `users` - User accounts
- `user_sessions` - Active sessions
- `canvas_connections` - Canvas integrations
- `canvas_courses` - Synced courses
- `canvas_raw_assignments` - Raw Canvas data
- `assignments` - Filtered assignments
- `assignment_completions` - Completion tracking
- `assignment_filter_patterns` - User filters
- `sync_history` - Sync logs

See `backend/migrations/001_initial_schema.sql` for full schema.

## 🔧 Configuration

Edit `.env` file:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/productivity_app

# Security
JWT_SECRET=your-secret-key-min-32-characters
ENCRYPTION_KEY=exactly-32-characters-for-aes256

# Canvas Sync
CANVAS_SYNC_INTERVAL_MINUTES=30

# Feature Flags
FEATURE_CANVAS_INTEGRATION=true
FEATURE_GAMIFICATION=false
FEATURE_HABITS=false
FEATURE_SCHEDULING=false
FEATURE_ANALYTICS=false
```

## 🔐 Security

- Passwords: bcrypt hashing
- Canvas tokens: AES-256-GCM encryption at rest
- Authentication: JWT tokens
- Input validation: Zod schemas
- SQL injection: Prevented by Kysely
- CORS: Configured

## 🎮 Adding/Removing Features

### Add a New Module

1. Create `backend/src/modules/your-feature/`
2. Implement module interface
3. Register in `core/app.ts`
4. Add frontend in `frontend/src/features/your-feature/`
5. Add feature flag in `.env`

### Remove a Module

1. Set feature flag to `false`
2. Module won't load (automatic)
3. Optionally delete module files
4. UI checks feature flags

Example - Remove Canvas:
```bash
# .env
FEATURE_CANVAS_INTEGRATION=false
```

Module won't load, Canvas UI hidden automatically.

## 🗺️ Roadmap

### ✅ Phase 1: Canvas & Task Management (DONE)
- Canvas integration
- Assignment sync & filtering
- Completion tracking
- Basic UI

### 🔄 Phase 2: Gamification (Next)
- XP & level system
- Streak tracking
- Achievements
- Visual feedback

### 📅 Phase 3: Habits & Scheduling
- Daily missions
- Habit tracking
- Priority algorithm
- Time blocking

### 📊 Phase 4: Analytics
- Performance metrics
- Data visualization
- Insights
- Reports

### 🤖 Phase 5: AI Enhancement
- Smart filtering
- Time estimation
- Personalized scheduling
- NL interface

## 🐛 Troubleshooting

**Backend won't start:**
```bash
docker-compose ps              # Check services running
npm run migrate               # Run migrations
cat backend/logs/error.log    # Check logs
```

**Canvas sync not working:**
- Verify Canvas URL is correct
- Check API token is valid
- Try manual sync from UI
- Check logs in `backend/logs/`

**No assignments showing:**
- Wait for first sync (30 min) or trigger manually
- Check filter patterns
- Call `/api/assignments/process`

## 📖 Documentation

- `ARCHITECTURE.md` - Detailed architecture guide
- `backend/migrations/` - Database schema
- `docs/` - Additional documentation

## 🤝 Contributing

The modular design makes it easy to contribute:

1. Pick a feature from the roadmap
2. Create module following existing patterns
3. Register with plugin manager
4. Add tests
5. Document

## 📄 License

MIT

---

**Built with modularity in mind** - easily extend or remove features without breaking the app.