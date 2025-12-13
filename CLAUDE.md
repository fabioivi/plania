# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlanIA is a teaching plan generation platform for IFMS (Instituto Federal de Mato Grosso do Sul) academic system. It uses AI (Claude, OpenAI, Gemini, OpenRouter) to generate teaching plans based on scraped academic data from IFMS's system.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** NestJS, TypeScript, TypeORM, Bull (Redis queue), Playwright (web scraping)
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **AI Providers:** Multiple LLM providers with configurable support

## Development Commands

### Starting Development Environment

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
npm run start
# or
npm run dev

# Start services concurrently (alternative)
npm run dev:concurrent

# Start individual services
npm run dev:frontend    # Frontend only (port 3000)
npm run dev:backend     # Backend only (port 3001)
```

### Building

```bash
npm run build              # Build all workspaces
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only
```

### Docker Commands

```bash
# Start PostgreSQL and Redis only
npm run docker:up

# Stop Docker containers
npm run docker:down

# View logs
npm run docker:logs
npm run docker:logs:postgres
```

### Backend-Specific Commands

```bash
cd apps/backend

# Development
npm run dev              # Watch mode

# Production
npm run build
npm run start           # or npm run start:prod

# Testing
npm run test
npm run test:login      # Test IFMS academic login
npm run test:crypto     # Test encryption

# Linting
npm run lint
```

### Frontend-Specific Commands

```bash
cd apps/frontend

# Development
npm run dev

# Production
npm run build
npm run start

# Linting
npm run lint
```

## Architecture

### Monorepo Structure

This is a **workspace monorepo** with two main applications:

- `apps/backend/` - NestJS API server
- `apps/frontend/` - Next.js application

### Backend Architecture (NestJS)

**Module Organization:**
- `auth/` - User authentication, JWT strategy, LLM configuration management
- `academic/` - Academic credentials management, diaries, teaching plans
- `scraping/` - Playwright-based IFMS scraping service with debug support
- `ai/` - Multi-provider LLM service (Claude, OpenAI, Gemini, OpenRouter) and teaching plan generation
- `queue/` - Bull queue processors for async tasks (auth verification, scraping)
- `sync/` - Server-Sent Events (SSE) for real-time progress updates
- `plans/` - Teaching plans management

**Key Services:**
- `ScrapingService` - Uses Playwright to scrape IFMS academic system
  - Configurable human-like delays (can be disabled via `ENABLE_HUMAN_DELAYS`)
  - Debug mode with screenshot/HTML capture capability
  - Session management with cookie persistence
- `LLMService` - Provider-agnostic LLM interface with multiple backends
- `TeachingPlanGeneratorService` - Generates teaching plans from diary data using AI
- `CryptoService` - AES-256-GCM encryption for credential storage
- `SyncEventsService` - Real-time progress updates via SSE

**Database Entities:**
- `User` - Application users
- `LLMConfig` - User-specific LLM provider configurations
- `AcademicCredential` - Encrypted IFMS credentials per user
- `Diary` - Academic diaries scraped from IFMS
- `DiaryContent` - Individual class entries within diaries
- `TeachingPlan` - Generated/scraped teaching plans
- `TeachingPlanHistory` - Version history for teaching plans
- `ScrapingDebug` - Debug information for scraping operations

**Queue System (Bull/Redis):**
- `auth-queue` - Credential verification jobs
- `scraping-queue` - Async scraping operations
- `plans-queue` - Teaching plan generation jobs

### Frontend Architecture (Next.js)

**App Router Structure:**
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard
- `/disciplines` - Discipline management
- `/diaries/[id]` - Diary detail view
- `/diaries/[id]/generate` - Generate teaching plan from diary
- `/teaching-plans/[id]` - Teaching plan view
- `/settings` - User settings (including LLM configuration)

**Key Components:**
- `AuthContext` - Global authentication state
- `ProtectedRoute` - Route guard for authenticated routes
- `SyncProgressDialog` - Real-time progress display using SSE
- `TeachingPlanView` - Display and edit teaching plans
- `DiaryContentTable` / `DiaryContentReorderable` - Manage diary content with drag-and-drop
- `LLMConfigSection` - Configure LLM providers

**State Management:**
- React Context for authentication
- Custom hooks: `useSyncProgress`, `useSyncState`
- Server-Sent Events for real-time updates

**Design System:**
- Monochromatic theme based on shadcn/ui
- Components in `src/components/ui/`
- TailwindCSS with custom configuration
- Full documentation in `apps/frontend/design-system/README.md`

### AI/LLM Integration

The application supports multiple LLM providers through a unified interface:

**Providers:**
- Claude (Anthropic)
- OpenAI (GPT-4, etc.)
- Gemini (Google)
- OpenRouter (aggregator)

**Configuration:**
- User-level LLM configurations stored in `LLMConfig` entity
- Each user can configure their preferred provider and model
- API keys encrypted before storage
- Default fallback to environment-configured provider

**Teaching Plan Generation:**
1. Fetch diary data (syllabus, schedule, content)
2. Build structured prompt with course context
3. Request JSON response from LLM using schema validation
4. Parse and validate response against JSON schema
5. Store generated plan with version history

### Web Scraping Strategy

**IFMS Scraping Flow:**
1. Launch headless Chromium browser (Playwright)
2. Navigate to login page
3. Authenticate with encrypted credentials
4. Navigate to desired pages (diaries, teaching plans, etc.)
5. Extract data using configurable CSS selectors
6. Parse and normalize data
7. Store in database
8. Optional: Capture screenshots/HTML for debugging

**Important Files:**
- `ifms.routes.ts` - URL builders and route definitions
- `ifms.selectors.config.ts` - CSS selector configurations
- `extraction.utils.ts` - HTML parsing utilities
- `scraping.service.ts` - Main scraping orchestrator

### Real-time Sync Progress

Uses Server-Sent Events (SSE) to stream progress updates:

**Backend:**
- `SyncEventsService` emits events with progress percentage and messages
- Events are JTW-authenticated

**Frontend:**
- `useSyncProgress` hook connects to SSE endpoint
- `SyncProgressDialog` displays real-time updates
- Automatic reconnection on disconnect

## Development Standards & Best Practices

### REST API Standards

**CRITICAL:** This project follows strict REST conventions for all API endpoints.

**HTTP Methods:**
```typescript
GET    /resource         // Retrieve resource(s) - READ
POST   /resource         // Create new resource - CREATE
PUT    /resource/:id     // Update entire resource - UPDATE
PATCH  /resource/:id     // Partial update - PARTIAL UPDATE
DELETE /resource/:id     // Delete resource - DELETE
```

**Examples:**
```typescript
// ✅ CORRECT
GET    /academic/teaching-plans/:id           // Get plan
POST   /academic/teaching-plans/ai            // Create AI plan
PUT    /academic/teaching-plans/:id           // Update plan
DELETE /academic/teaching-plans/:id           // Delete plan

// ❌ INCORRECT - Don't do this
POST   /academic/teaching-plans/:id           // DON'T use POST for updates
GET    /academic/teaching-plans/update/:id    // DON'T use GET for mutations
```

**Response Format:**
```typescript
// Success responses
{
  success: true,
  data: { ... },           // or specific field like 'plan', 'diary'
  message?: string         // Optional success message
}

// Error responses
{
  success: false,
  message: string,
  errors?: ValidationError[]
}
```

### React Query for Data Fetching

**CRITICAL:** ALWAYS use React Query hooks for API calls in the frontend. Never use raw `fetch` or `axios` in components.

**Location of Hooks:**
- All React Query hooks are in `apps/frontend/src/hooks/api/`
- Organized by domain: `useDiaries.ts`, `useTeachingPlans.ts`, `useAuth.ts`, etc.
- Centralized exports in `apps/frontend/src/hooks/api/index.ts`

**Query Hooks Pattern:**
```typescript
// ✅ CORRECT - Use existing hooks
import { useTeachingPlan, useTeachingPlans } from '@/hooks/api'

function MyComponent() {
  const { data: plan, isLoading, error } = useTeachingPlan(planId)
  const { data: plans = [] } = useTeachingPlans(diaryId)

  // Component logic...
}
```

**Mutation Hooks Pattern:**
```typescript
// ✅ CORRECT - Use mutation hooks
import { useSyncTeachingPlan, useUpdateTeachingPlan } from '@/hooks/api'

function MyComponent() {
  const { mutate: syncPlan, isPending: syncing } = useSyncTeachingPlan()

  const handleSync = () => {
    syncPlan(planId, {
      onSuccess: () => toast.success('Synced!'),
      onError: (err) => toast.error(err.message)
    })
  }
}
```

**Creating New Hooks:**

When adding a new API endpoint, ALWAYS create a corresponding React Query hook:

```typescript
// apps/frontend/src/hooks/api/useTeachingPlans.ts

/**
 * Save AI-generated teaching plan
 */
export function useSaveAITeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveAITeachingPlanRequest) =>
      teachingPlanService.saveAIGeneratedPlan(data),
    onSuccess: (data) => {
      // Invalidate related queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
      toast.success('Plano salvo com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar plano'
      toast.error(message)
    },
  })
}
```

**Query Keys:**
- Centralized in `apps/frontend/src/lib/api/query-client.ts`
- Follow hierarchical structure: `queryKeys.teachingPlans.detail(id)`
- Used for cache invalidation and refetching

**Benefits:**
- Automatic caching and background refetching
- Loading and error states handled automatically
- Optimistic updates support
- Request deduplication
- Stale-while-revalidate pattern

**What NOT to do:**
```typescript
// ❌ WRONG - Don't use raw API calls in components
const [data, setData] = useState(null)
useEffect(() => {
  fetch('/api/teaching-plans/123')
    .then(res => res.json())
    .then(setData)
}, [])

// ❌ WRONG - Don't bypass React Query
const handleSave = async () => {
  await axios.post('/api/teaching-plans', data)
  // Manual refetch... no cache invalidation... error handling...
}
```

### Data Flow Architecture

**Frontend → Backend:**
1. Component uses React Query hook
2. Hook calls service function (`apps/frontend/src/services/api.ts`)
3. Service uses `apiClient` (axios instance with interceptors)
4. Request sent to NestJS backend

**Backend → Database:**
1. Controller receives request (validates with DTOs)
2. Calls service method
3. Service uses TypeORM repositories
4. Database operation executed
5. Response returned with standard format

## Environment Setup

### Required Environment Variables

**Backend (.env):**
```bash
NODE_ENV=development
PORT=3001

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=plania

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars-minimum
ENCRYPTION_KEY=change-this-32-char-secret-key!  # Must be 32 characters

# Frontend
FRONTEND_URL=http://localhost:3000

# Scraping
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
IFMS_BASE_URL=https://academico.ifms.edu.br
```

**Note:** The encryption key MUST be exactly 32 characters for AES-256-GCM encryption.

### Database Setup

1. Ensure PostgreSQL and Redis are running (via Docker or local installation)
2. Backend will auto-create tables when `synchronize: true` in development
3. Migrations are in `apps/backend/src/migrations/`

## API Documentation

When backend is running, Swagger documentation is available at:
- http://localhost:3001/api/docs

Key API endpoints:
- `/api/auth/*` - Authentication (register, login, logout)
- `/api/academic/*` - Academic credentials, diaries, sync operations
- `/api/ai/*` - Teaching plan generation
- `/api/sync/events` - SSE endpoint for real-time progress

## Testing

### Backend Tests

```bash
cd apps/backend

# Run all tests
npm run test

# Test IFMS login scraping
npm run test:login

# Test encryption/decryption
npm run test:crypto
```

### Manual Testing

Use the Swagger UI at http://localhost:3001/api/docs to test API endpoints interactively.

## Common Development Tasks

### Adding a New LLM Provider

1. Create provider implementation in `apps/backend/src/modules/ai/`
   - Implement `LLMProvider` interface
   - Add model mappings
2. Register in `LLMService.getProvider()` switch statement
3. Update `LLMConfig` entity if new fields needed
4. Add configuration UI in frontend `LLMConfigSection.tsx`

### Modifying Scraping Selectors

1. Update selectors in `apps/backend/src/modules/scraping/ifms.selectors.config.ts`
2. Test with debug mode enabled to capture screenshots
3. Use `ScrapingDebugService` to store debug artifacts

### Adding New shadcn/ui Components

```bash
cd apps/frontend
npx shadcn-ui@latest add [component-name]
```

Components are automatically configured to use the monochromatic theme.

## Important Notes

- **Encryption:** Academic credentials are encrypted using AES-256-GCM before storage
- **Queue Processing:** Long-running tasks (scraping, verification) use Bull queues
- **Rate Limiting:** Academic service has configurable rate limiting (currently disabled: `MIN_REQUEST_INTERVAL = 0`)
- **Human Delays:** Scraping service has configurable delays to simulate human behavior (toggle via `ENABLE_HUMAN_DELAYS`)
- **TypeORM Sync:** Auto-synchronization is ONLY enabled in development mode
- **CORS:** Backend CORS is configured for frontend URL from environment

## Port Configuration

- Frontend: 3000
- Backend: 3001
- PostgreSQL: 5433 (mapped from container's 5432)
- Redis: 6380 (mapped from container's 6379)
- Adminer (DB UI): 8080

## Design System

The frontend uses a custom monochromatic design system built with shadcn/ui and TailwindCSS. See `apps/frontend/design-system/README.md` for complete documentation on:
- Color palette (8 monochrome tones)
- Typography system
- Component usage
- Accessibility guidelines (WCAG 2.1 AA compliance)
