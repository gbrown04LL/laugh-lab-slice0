# CLAUDE.md - Laugh Lab Codebase Guide

This document provides a comprehensive guide for AI assistants working with the Laugh Lab codebase.

## Project Overview

**Laugh Lab** is an AI-powered comedy script analysis platform that provides professional-grade feedback on comedy writing. It uses a three-stage pipeline combining LLM analysis with deterministic scoring to deliver consistent, actionable insights.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **LLM**: OpenAI GPT-4o
- **Testing**: Vitest + React Testing Library + happy-dom
- **Validation**: Zod schemas
- **Charting**: Recharts
- **Runtime**: Node.js 22.x

## Project Structure

```
laugh-lab-slice0/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── analyze/        # Main analysis endpoint
│   │   │   ├── health/         # Health check endpoint
│   │   │   ├── jobs/           # Job management endpoints
│   │   │   ├── reports/        # Report retrieval
│   │   │   └── scripts/        # Script submission
│   │   ├── report/[id]/        # Dynamic report page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page with workflow UI
│   ├── components/
│   │   └── report/             # Report visualization components
│   │       ├── AnalysisProgress.tsx
│   │       ├── CharacterBalanceChart.tsx
│   │       ├── MetricsCards.tsx
│   │       ├── OpportunitiesSection.tsx
│   │       ├── PunchUpWorkshop.tsx
│   │       ├── ReportPage.tsx
│   │       ├── ScoreGauge.tsx
│   │       └── StrengthsSection.tsx
│   ├── lib/
│   │   ├── analysis/
│   │   │   └── pipeline.ts     # Main analysis pipeline orchestration
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection
│   │   │   └── schema.ts       # Drizzle schema definitions
│   │   ├── llm/
│   │   │   ├── openai-client.ts # OpenAI API wrapper
│   │   │   ├── promptA.ts      # Joke extraction prompt
│   │   │   └── promptB.ts      # Coaching feedback prompt
│   │   ├── scoring/
│   │   │   └── engine.ts       # Deterministic scoring calculations
│   │   ├── api-errors.ts       # Standardized error responses
│   │   ├── fingerprint.ts      # Server-side fingerprint handling
│   │   ├── client-fingerprint.ts # Browser fingerprinting
│   │   ├── logger.ts           # Structured logging
│   │   ├── types.ts            # Zod schemas and TypeScript types
│   │   ├── usage.ts            # Rate limiting logic
│   │   ├── openai.ts           # OpenAI client singleton
│   │   └── prisma.ts           # Prisma client (legacy)
│   └── __tests__/
│       ├── fixtures/           # Test data fixtures
│       ├── mocks/              # Mock implementations
│       └── setup.ts            # Test configuration
├── drizzle.config.ts           # Drizzle ORM configuration
├── vitest.config.ts            # Vitest test configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Core Architecture

### Three-Stage Analysis Pipeline

The analysis pipeline (`src/lib/analysis/pipeline.ts`) follows this flow:

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Stage 1: LLM   │ --> │  Stage 2: Scoring   │ --> │  Stage 3: LLM   │
│  Joke Extraction│     │  (Deterministic TS) │     │  Coaching       │
│  (Prompt A)     │     │  v2.0.0-canonical   │     │  (Prompt B)     │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

**Stage 1 - Prompt A** (`src/lib/llm/promptA.ts`):
- Extracts all jokes from the script
- Classifies joke complexity: basic, standard, intermediate, advanced, high
- Identifies comedy techniques (callbacks, misdirection, wordplay, etc.)
- Analyzes character joke distribution
- Detects "gaps" (10+ lines without jokes)

**Stage 2 - Scoring Engine** (`src/lib/scoring/engine.ts`):
- Deterministic TypeScript calculations (same input = same output)
- Applies complexity multipliers (basic: 1.2x to high: 3.3x)
- Calculates metrics: LPM, lines-per-joke, character balance
- Compares to genre-specific benchmarks
- Identifies the "Retention Cliff" (largest gap after 60% mark)

**Stage 3 - Prompt B** (`src/lib/llm/promptB.ts`):
- Generates encouraging coaching feedback
- Provides strengths to preserve
- Identifies opportunities for improvement
- Creates punch-up suggestions with alternatives
- Delivers a personalized coach's note

### Data Schemas ("Truth Contract")

All data structures are defined in `src/lib/types.ts` using Zod schemas:

- `PromptAOutputSchema` - Joke extraction output
- `PromptBOutputSchema` - Coaching feedback output
- `FinalOutputSchema` - Complete analysis result
- `ErrorObjectSchema` - Standardized error format

Key enums:
- `InferredFormat`: scene, half_hour, hour, feature
- `Severity`: minor, moderate, major
- `IssueType`: pacing_soft_spot, escalation_repeat, surprise_decay, etc.

### Database Schema

Defined in `src/lib/db/schema.ts`:

**`analyses` table:**
- Stores completed analysis results
- Fields: id, fingerprint, title, format, script_hash, result (JSONB), created_at

**`usage_tracking` table:**
- Tracks anonymous user rate limits
- Fields: id, identifier, monthly_count, month_key, updated_at
- Limit: 2 free analyses per month per identifier

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage

# Database operations
npm run db:generate   # Generate migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio

# Linting
npm run lint
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Database connectivity check |
| `/api/scripts` | POST | Submit script text |
| `/api/jobs` | POST | Create analysis job |
| `/api/jobs/[job_id]` | GET | Get job status |
| `/api/jobs/[job_id]/run` | POST | Execute analysis |
| `/api/reports/[run_id]` | GET | Retrieve analysis report |
| `/api/analyze` | POST | Direct analysis (combines all steps) |

### Request Headers
- `Content-Type: application/json`
- `X-Fingerprint: <browser-fingerprint>` (optional, falls back to IP)

### Script Constraints
- Minimum: 100 characters
- Maximum: 150,000 characters

## Testing Conventions

### Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx`
- Located alongside source files or in `src/__tests__/`

### Test Environment
- Uses `happy-dom` for DOM simulation
- Mocked environment variables in `src/__tests__/setup.ts`
- Mock LLM responses in `src/__tests__/mocks/llm.ts`

### Running Tests
```bash
npm test                    # Interactive watch mode
npm run test:run            # CI mode (single run)
npm run test:coverage       # Generate coverage report
npm run test:ui             # Vitest UI
```

## Key Conventions

### Import Aliases
Use `@/` for imports from `src/`:
```typescript
import { callLLM } from '@/lib/llm/openai-client';
import type { FinalOutput } from '@/lib/types';
```

### Error Handling
Use standardized error helpers from `src/lib/api-errors.ts`:
```typescript
import { errorResponse, validationError, notFoundError } from '@/lib/api-errors';

return errorResponse(400, [
  validationError("Invalid input", request_id, { field: "script" })
]);
```

### Logging
Use the structured logger from `src/lib/logger.ts`:
```typescript
import logger from '@/lib/logger';

logger.info("Job created", { job_id, user_id, request_id });
logger.error("Pipeline failed", { error: error.message });
```

### API Response Format
Success response:
```json
{
  "success": true,
  "data": { ... },
  "remaining": 1,
  "limit": 2
}
```

Error response:
```json
{
  "errors": [{
    "code": "INPUT_VALIDATION_FAILED",
    "message": "Script text is required",
    "stage": "input_validation",
    "retryable": false,
    "request_id": "req_abc123"
  }]
}
```

## Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://...?sslmode=require
OPENAI_API_KEY=sk-...
```

**Optional:**
```bash
LAUGHLAB_LLM_MODEL=gpt-4o    # Defaults to gpt-4o
NODE_ENV=production
```

## Scoring Algorithm Reference

### Complexity Multipliers
| Level | Multiplier | Description |
|-------|------------|-------------|
| basic | 1.2x | Puns, simple wordplay |
| standard | 1.7x | Setup-punchline, observational |
| intermediate | 2.3x | Character-based, running gags |
| advanced | 2.8x | Callbacks, misdirection |
| high | 3.3x | Multi-layered, meta-comedy |

### Genre Benchmarks
| Format | Target LPM | Target LPJ |
|--------|------------|------------|
| sitcom | 2.0 | 5.5 |
| feature | 1.0 | 12.0 |
| sketch | 2.5 | 4.0 |
| standup | 3.5 | 3.0 |

LPM = Laughs Per Minute, LPJ = Lines Per Joke

## Common Tasks

### Adding a New API Endpoint
1. Create route file in `src/app/api/<endpoint>/route.ts`
2. Use `generateRequestId()` for request tracking
3. Validate input with Zod schemas from `src/lib/types.ts`
4. Return standardized responses using `errorResponse()` helpers
5. Add structured logging with `logger`

### Modifying the Scoring Engine
1. Edit `src/lib/scoring/engine.ts`
2. Update corresponding tests in `src/lib/scoring/engine.test.ts`
3. Ensure determinism (no randomness, same input = same output)
4. Update benchmarks if adding new formats

### Adding a New Report Component
1. Create component in `src/components/report/`
2. Add corresponding test file `*.test.tsx`
3. Import and use in `src/components/report/ReportPage.tsx`
4. Map data from `output.prompt_a` or `output.prompt_b`

### Updating LLM Prompts
1. Edit prompt templates in `src/lib/llm/promptA.ts` or `promptB.ts`
2. Update corresponding TypeScript interfaces
3. Update test fixtures in `src/__tests__/fixtures/`
4. Test with sample scripts before deploying

## Deployment

The app deploys to Vercel with automatic deployments from GitHub.

### Pre-deployment Checklist
1. All tests pass: `npm run test:run`
2. Build succeeds: `npm run build`
3. Environment variables set in Vercel dashboard
4. Database migrations applied: `npm run db:push`

### Vercel Configuration
- `maxDuration: 60` on `/api/analyze` for longer analysis runs
- Uses pooled Neon connection string for serverless compatibility
