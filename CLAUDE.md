# CLAUDE.md - AI Assistant Guide for Laugh Lab

**Version**: 1.0.0
**Last Updated**: 2026-01-23
**Repository**: gbrown04LL/laugh-lab-slice0

This document provides comprehensive guidance for AI assistants (like Claude) working on the Laugh Lab codebase. It covers architecture, conventions, workflows, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Directory Structure](#directory-structure)
4. [Database Layer](#database-layer)
5. [Key Files Reference](#key-files-reference)
6. [Development Workflows](#development-workflows)
7. [Code Conventions & Patterns](#code-conventions--patterns)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Deployment](#deployment)
10. [Common Tasks & Examples](#common-tasks--examples)
11. [Important Constraints](#important-constraints)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Laugh Lab** is an AI-powered comedy script analysis platform (Slice-0 MVP) that provides professional feedback on comedy scripts using a three-stage analysis pipeline.

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM (primary), Prisma (legacy - being phased out)
- **AI/LLM**: OpenAI GPT-4o
- **Validation**: Zod
- **Deployment**: Vercel
- **UI Components**: React 18, Recharts for visualizations
- **Node Version**: 22.x

### Key Features

- **Three-stage analysis pipeline**: LLM extraction → deterministic scoring → LLM coaching
- **Rate limiting**: 2 free analyses per month per anonymous user
- **Browser fingerprinting**: Anonymous user tracking via FingerprintJS
- **Immutable results**: Analysis reports cannot be modified after creation
- **Script hashing**: Scripts are hashed (SHA256), never stored in raw form
- **Type safety**: Comprehensive Zod schemas for all data structures

---

## Architecture & Design Principles

### Three-Stage Analysis Pipeline

```
┌─────────────────────────┐
│  Stage 1: Prompt A      │  → LLM-powered joke extraction
│  (GPT-4o)               │     Output: Jokes, classifications, metrics
└──────────────┬──────────┘
               ↓
┌──────────────────────────┐
│  Stage 2: Scoring Engine │  → Deterministic TypeScript calculations
│  (Pure TypeScript)       │     Output: Overall score, percentiles, gaps
└──────────────┬───────────┘
               ↓
┌──────────────────────────┐
│  Stage 3: Prompt B       │  → LLM-powered coaching feedback
│  (GPT-4o)                │     Output: Strengths, opportunities, suggestions
└──────────────────────────┘
```

### Core Design Principles

1. **Determinism in Stage 2**: Same input MUST produce same scores
2. **Immutability**: Analysis results are append-only, never modified
3. **Type Safety**: All data structures validated with Zod schemas
4. **Security**: Never log raw script text, use hashes instead
5. **Auditability**: Structured logging with request IDs and timing
6. **Error Resilience**: Partial results stored even on failures
7. **Schema Versioning**: All outputs include `schema_version: "1.0.0"`

### Truth Contract Pattern

All analysis outputs conform to `FinalOutputSchema` (defined in `/src/lib/types.ts`):

```typescript
{
  schema_version: "1.0.0",
  run: { run_id, created_at, tier_config, script_fingerprint },
  prompt_a?: PromptAOutput,     // Optional (may fail)
  prompt_b?: PromptBOutput,     // Optional (may fail)
  errors?: ErrorObject[]        // Tracks all failures
}
```

This ensures every analysis result is:
- Versioned (for schema evolution)
- Traceable (run metadata)
- Auditable (errors tracked)
- Parseable (Zod validated)

---

## Directory Structure

```
laugh-lab-slice0/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Home/testing page (Slice-0 UI)
│   │   ├── layout.tsx                # Root layout with metadata
│   │   ├── api/                      # API routes (backend endpoints)
│   │   │   ├── health/               # Database health check
│   │   │   ├── scripts/              # Script submission
│   │   │   ├── jobs/                 # Job management
│   │   │   │   ├── route.ts          # Create job
│   │   │   │   └── [job_id]/run/     # Run analysis
│   │   │   ├── reports/              # Report retrieval
│   │   │   └── analyze/              # Unified analysis endpoint
│   │   └── report/[id]/              # Dynamic report display page
│   ├── components/
│   │   └── report/                   # Analysis report UI components
│   │       ├── ReportPage.tsx        # Main report container
│   │       ├── ScoreGauge.tsx        # Score visualization (0-100)
│   │       ├── MetricsCards.tsx      # LPM, LPJ, Balance metrics
│   │       ├── StrengthsSection.tsx  # Strengths display
│   │       ├── OpportunitiesSection.tsx # Issues/opportunities
│   │       ├── PunchUpWorkshop.tsx   # Punch-up suggestions
│   │       ├── CharacterBalanceChart.tsx # Character analysis
│   │       └── AnalysisProgress.tsx  # Progress indicator
│   └── lib/                          # Core business logic
│       ├── db/                       # Database layer
│       │   ├── schema.ts             # Drizzle schema definitions
│       │   └── index.ts              # DB client initialization
│       ├── llm/                      # LLM integrations (legacy)
│       │   ├── openai-client.ts      # OpenAI API wrapper
│       │   ├── promptA.ts            # Stage 1: Joke extraction
│       │   └── promptB.ts            # Stage 3: Coaching feedback
│       ├── scoring/
│       │   └── engine.ts             # Stage 2: Scoring logic (DETERMINISTIC)
│       ├── analysis/
│       │   └── pipeline.ts           # Pipeline orchestrator
│       ├── types.ts                  # Comprehensive Zod schemas (40+ types)
│       ├── prompts.ts                # LLM system prompts
│       ├── fingerprint.ts            # Script fingerprinting
│       ├── client-fingerprint.ts     # Browser fingerprinting
│       ├── usage.ts                  # Rate limiting logic
│       ├── openai.ts                 # OpenAI integration wrapper
│       ├── logger.ts                 # Structured logging utility
│       ├── prisma.ts                 # Prisma client (LEGACY - avoid)
│       └── api-errors.ts             # Error handling utilities
├── Configuration Files
│   ├── tsconfig.json                 # TypeScript config
│   ├── next.config.js                # Next.js config
│   ├── drizzle.config.ts             # Drizzle ORM config
│   ├── vercel.json                   # Vercel deployment config
│   ├── package.json                  # Dependencies & scripts
│   └── .env.example                  # Environment variables template
└── Documentation
    ├── SETUP.md                      # Setup & deployment guide
    ├── DEPLOYMENT_CHECKLIST.md       # Pre-deployment checklist
    ├── CLAUDE.md                     # This file
    └── test-seinfeld-script.txt      # Sample test script
```

### Path Aliases

TypeScript is configured with path aliases:
- `@/*` maps to `./src/*`
- Example: `import { logger } from '@/lib/logger'`

---

## Database Layer

### Technology

- **Database**: Neon PostgreSQL (serverless, pooled connections)
- **Primary ORM**: Drizzle ORM
- **Legacy ORM**: Prisma (being phased out - avoid using)
- **Driver**: `@neondatabase/serverless`

### Tables

#### `analyses` Table
Stores completed analysis results (immutable).

```typescript
// Location: /src/lib/db/schema.ts
{
  id: uuid (primary key, random default)
  fingerprint: text (user identifier)
  title: text (default: 'Untitled Script')
  format: text (sitcom, feature, sketch, standup)
  scriptHash: text (SHA256 hash - NOT the raw script)
  result: jsonb (full FinalOutput JSON)
  createdAt: timestamp (default: now)
}
```

#### `usageTracking` Table
Tracks monthly usage for rate limiting.

```typescript
{
  id: uuid (primary key, random default)
  identifier: text (unique - fingerprint or IP)
  monthlyCount: integer (default: 0)
  monthKey: text ("YYYY-MM" format)
  updatedAt: timestamp (default: now)
}
```

### Database Access Pattern

**IMPORTANT**: Use Drizzle ORM, NOT Prisma.

```typescript
// Correct pattern
import { db } from '@/lib/db';
import { analyses, usageTracking } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Insert
await db.insert(analyses).values({ ... });

// Query
const results = await db.select().from(analyses).where(eq(analyses.id, id));
```

### Environment Variables

```bash
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/database?sslmode=require"
```

**Note**: Always use the **pooled** connection string from Neon (ends with `-pooler`).

---

## Key Files Reference

### Core Type Definitions

**File**: `/src/lib/types.ts`
**Purpose**: Single source of truth for all Zod schemas and TypeScript types.

Key exports:
- `SCHEMA_VERSION = "1.0.0"` - Current schema version
- `STUB_USER_ID = "test-user-1"` - Stubbed user for Slice-0
- `FinalOutputSchema` - Complete analysis output structure
- `PromptAOutputSchema` - Stage 1 output
- `PromptBOutputSchema` - Stage 3 output
- `ErrorObjectSchema` - Error tracking structure
- 40+ additional types and enums

### Analysis Pipeline

**File**: `/src/lib/analysis/pipeline.ts`
**Purpose**: Orchestrates the three-stage analysis pipeline.

Key function:
```typescript
export async function runAnalysisPipeline(
  script: string,
  format: string,
  title: string
): Promise<FinalOutput>
```

Workflow:
1. Validates input
2. Runs Prompt A (joke extraction)
3. Runs scoring engine (deterministic)
4. Runs Prompt B (coaching feedback)
5. Returns validated `FinalOutput`

### Scoring Engine

**File**: `/src/lib/scoring/engine.ts`
**Purpose**: **DETERMINISTIC** scoring calculations (Stage 2).

**CRITICAL**: This file must remain deterministic. Do NOT introduce:
- Random number generation
- Date/time dependencies
- External API calls
- Non-deterministic operations

Key constants:
```typescript
COMPLEXITY_WEIGHTS = [1.2, 1.7, 2.3, 2.8, 3.3]
GENRE_CALIBRATION_FACTORS = { sitcom: 1.0, feature: 0.85, ... }
```

### LLM System Prompts

**File**: `/src/lib/prompts.ts`
**Purpose**: System prompts for OpenAI API calls.

Exports:
- `PROMPT_A_SYSTEM` - Joke extraction instructions (with JSON schema)
- `PROMPT_B_SYSTEM` - Coaching feedback instructions (with JSON schema)

**Note**: These prompts are structure-only, no prose in system prompts.

### OpenAI Integration

**File**: `/src/lib/openai.ts`
**Purpose**: Wrapper around OpenAI API.

```typescript
export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string>
```

Uses `gpt-4o` model with `response_format: { type: "json_object" }`.

### Rate Limiting

**File**: `/src/lib/usage.ts`
**Purpose**: Usage tracking and rate limiting logic.

Key functions:
```typescript
export async function checkUsageLimit(identifier: string): Promise<{ allowed: boolean, remaining: number }>
export async function incrementUsage(identifier: string): Promise<void>
```

Free tier: 2 analyses per month per user.

### Logging

**File**: `/src/lib/logger.ts`
**Purpose**: Structured logging with timing.

```typescript
import { logger } from '@/lib/logger';

logger.info('Starting analysis', { requestId });
logger.timing('Stage 1 completed', duration);
logger.error('OpenAI API failed', error);
```

**SECURITY**: Never log raw script text. Use script hash instead.

### Error Handling

**File**: `/src/lib/api-errors.ts`
**Purpose**: Standardized error creation and responses.

```typescript
export function createErrorObject(
  code: string,
  message: string,
  stage: AnalysisStage,
  retryable: boolean,
  requestId: string,
  details: Record<string, unknown>
): ErrorObject
```

### Database Schema

**File**: `/src/lib/db/schema.ts`
**Purpose**: Drizzle ORM table definitions.

**File**: `/src/lib/db/index.ts`
**Purpose**: Database client initialization.

```typescript
import { db } from '@/lib/db';
```

---

## Development Workflows

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```bash
   DATABASE_URL="postgresql://..."
   OPENAI_API_KEY="sk-..."
   LAUGHLAB_LLM_MODEL="gpt-4o"
   NODE_ENV="development"
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   App available at: `http://localhost:3000`

### Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

### Available Scripts

```json
{
  "dev": "next dev",              // Development server
  "build": "next build",          // Production build
  "start": "next start",          // Production server
  "lint": "next lint",            // Linting
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

### Testing Workflow

1. **Run linter**:
   ```bash
   npm run lint
   ```

2. **Test API endpoint locally**:
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -H "X-Fingerprint: test-user-123" \
     -d '{
       "script": "Your test script...",
       "format": "sitcom",
       "title": "Test Script"
     }'
   ```

3. **Test with sample script**:
   Use `/home/user/laugh-lab-slice0/test-seinfeld-script.txt`

### Git Workflow

**Current branch**: `claude/claude-md-mkraruv8g1avhq27-Wd8Ms`

Always work on feature branches starting with `claude/`.

```bash
# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add comprehensive CLAUDE.md documentation"

# Push to remote
git push -u origin claude/claude-md-mkraruv8g1avhq27-Wd8Ms
```

---

## Code Conventions & Patterns

### TypeScript Conventions

1. **Strict mode enabled**: All type errors must be resolved
2. **Use Zod for validation**: Runtime validation for all external data
3. **Prefer explicit types**: Avoid `any`, use `unknown` when needed
4. **Path aliases**: Use `@/` prefix for imports

```typescript
// Good
import { logger } from '@/lib/logger';
import { FinalOutputSchema } from '@/lib/types';

// Avoid
import { logger } from '../../../lib/logger';
```

### Async/Await Patterns

Always use async/await, never raw Promises or callbacks.

```typescript
// Good
async function analyze() {
  try {
    const result = await runAnalysisPipeline(script, format, title);
    return result;
  } catch (error) {
    logger.error('Analysis failed', error);
    throw error;
  }
}

// Avoid
function analyze() {
  return runAnalysisPipeline(script, format, title)
    .then(result => result)
    .catch(error => { throw error; });
}
```

### Error Handling Pattern

1. Use `try/catch` blocks
2. Create structured error objects
3. Log errors with context
4. Return user-friendly messages

```typescript
try {
  const result = await someOperation();
} catch (error) {
  logger.error('Operation failed', { error, context });

  const errorObj = createErrorObject(
    'OPERATION_FAILED',
    'Detailed message',
    'prompt_a',
    true,
    requestId,
    { /* details */ }
  );

  return NextResponse.json({ error: errorObj }, { status: 500 });
}
```

### API Route Pattern

All API routes follow this structure:

```typescript
// /src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  field: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    // 2. Business logic
    const result = await processRequest(validated);

    // 3. Return response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 4. Error handling
    logger.error('Request failed', error);
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Component Patterns

React components use Server Components by default, Client Components when needed.

```typescript
// Server Component (default)
export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await fetchReport(params.id);
  return <ReportUI report={report} />;
}

// Client Component (when needed)
'use client';
import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState('');
  // ...
}
```

### Logging Patterns

```typescript
// Info logging
logger.info('Operation started', { requestId, context });

// Timing
const start = Date.now();
// ... operation ...
logger.timing('Operation completed', Date.now() - start);

// Error logging
logger.error('Operation failed', { error, requestId, context });

// NEVER log sensitive data
logger.error('Script processing failed', { scriptHash }); // Good
logger.error('Script processing failed', { script });     // BAD - security violation
```

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
  - `openai-client.ts` (utility)
  - `ReportPage.tsx` (component)
- **Variables**: camelCase (`scriptHash`, `analysisResult`)
- **Types**: PascalCase (`FinalOutput`, `PromptAOutput`)
- **Constants**: UPPER_SNAKE_CASE (`SCHEMA_VERSION`, `STUB_USER_ID`)
- **Functions**: camelCase (`runAnalysisPipeline`, `checkUsageLimit`)

---

## Testing & Quality Assurance

### Current Test Coverage

- **Scoring Engine**: Determinism tests implemented
- **Database**: Connection tests in `/api/health`
- **Pipeline**: Manual testing via `/app/page.tsx`

### Testing Best Practices

1. **Determinism testing**: Verify Stage 2 always produces same output
2. **Zod validation**: Ensure all API responses match schemas
3. **Error scenarios**: Test LLM failures, database errors, rate limiting
4. **End-to-end**: Test full pipeline with sample scripts

### Manual Testing Checklist

- [ ] Database health check: `GET /api/health`
- [ ] Script submission: `POST /api/scripts`
- [ ] Job creation: `POST /api/jobs`
- [ ] Analysis execution: `POST /api/jobs/[id]/run`
- [ ] Report retrieval: `GET /api/reports/[id]`
- [ ] Unified analyze: `POST /api/analyze`
- [ ] Rate limiting: Exceed 2 analyses per month
- [ ] Report display: `/report/[id]` page renders

---

## Deployment

### Vercel Deployment

**Platform**: Vercel (serverless functions)

### Environment Variables (Production)

Set these in Vercel dashboard:

```bash
DATABASE_URL="postgresql://..."           # Neon pooled connection
OPENAI_API_KEY="sk-..."                   # OpenAI API key
LAUGHLAB_LLM_MODEL="gpt-4o"               # LLM model
NODE_ENV="production"                     # Environment
```

### Deployment Steps

1. **Configure environment variables** in Vercel
2. **Push to GitHub**:
   ```bash
   git push origin main
   ```
3. **Vercel auto-deploys** from GitHub
4. **Test production API**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/analyze \
     -H "Content-Type: application/json" \
     -H "X-Fingerprint: test-123" \
     -d '{ "script": "...", "format": "sitcom", "title": "Test" }'
   ```

### Deployment Constraints

- **Function timeout**: 60 seconds (Vercel limit)
- **Request size**: Max 4.5MB (Next.js limit)
- **Database**: Use pooled connections only
- **Build command**: `next build` (no Prisma operations)

See `DEPLOYMENT_CHECKLIST.md` for detailed pre-deployment steps.

---

## Common Tasks & Examples

### Task 1: Add a New API Endpoint

```typescript
// /src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const RequestSchema = z.object({
  input: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    logger.info('Request received', { requestId });

    const body = await request.json();
    const { input } = RequestSchema.parse(body);

    // Business logic here
    const result = await processInput(input);

    return NextResponse.json({
      success: true,
      data: result,
      requestId
    });
  } catch (error) {
    logger.error('Request failed', { error, requestId });
    return NextResponse.json(
      { error: 'Request failed', requestId },
      { status: 500 }
    );
  }
}
```

### Task 2: Query Database with Drizzle

```typescript
import { db } from '@/lib/db';
import { analyses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Insert
const newAnalysis = await db.insert(analyses).values({
  fingerprint: 'user-123',
  title: 'My Script',
  format: 'sitcom',
  scriptHash: 'abc123...',
  result: { /* JSON */ },
}).returning();

// Query by ID
const analysis = await db.select()
  .from(analyses)
  .where(eq(analyses.id, analysisId))
  .limit(1);

// Query by fingerprint
const userAnalyses = await db.select()
  .from(analyses)
  .where(eq(analyses.fingerprint, userFingerprint))
  .orderBy(analyses.createdAt);
```

### Task 3: Add a New Zod Schema

```typescript
// /src/lib/types.ts

// Define schema
export const MyNewSchema = z.object({
  field1: z.string(),
  field2: z.number().int().positive(),
  field3: z.enum(['option1', 'option2']).optional(),
});

// Export type
export type MyNewType = z.infer<typeof MyNewSchema>;

// Use in code
const validated = MyNewSchema.parse(untrustedData);
```

### Task 4: Add a New React Component

```typescript
// /src/components/report/MyComponent.tsx

interface MyComponentProps {
  data: string;
  count: number;
}

export function MyComponent({ data, count }: MyComponentProps) {
  return (
    <div className="my-component">
      <h2>{data}</h2>
      <p>Count: {count}</p>
    </div>
  );
}
```

### Task 5: Modify Scoring Engine (CAREFULLY)

**CRITICAL**: Maintain determinism!

```typescript
// /src/lib/scoring/engine.ts

// Good: Deterministic calculation
function calculateNewMetric(jokes: Joke[]): number {
  return jokes.reduce((sum, joke) => sum + joke.length, 0) / jokes.length;
}

// BAD: Non-deterministic (uses random)
function calculateNewMetric(jokes: Joke[]): number {
  return Math.random() * jokes.length; // NEVER DO THIS
}

// BAD: Non-deterministic (uses date)
function calculateNewMetric(jokes: Joke[]): number {
  return Date.now() % jokes.length; // NEVER DO THIS
}
```

---

## Important Constraints

### Security Constraints

1. **Never log raw script text**: Use `scriptHash` instead
2. **Never store raw scripts**: Always hash with SHA256
3. **Validate all input**: Use Zod schemas
4. **Rate limit anonymous users**: 2 analyses per month
5. **Use environment variables**: For secrets (API keys, DB URLs)

### Performance Constraints

1. **Vercel function timeout**: 60 seconds maximum
2. **Database queries**: Use pooled connections only
3. **LLM calls**: May take 20-40 seconds each
4. **Total pipeline time**: Target under 60 seconds

### Data Constraints

1. **Script length**: 100 - 150,000 characters
2. **Immutable results**: Never modify analysis records
3. **Schema versioning**: Always include `schema_version`
4. **Error tracking**: Store errors with partial results

### Architectural Constraints

1. **Stage 2 determinism**: Scoring engine must be deterministic
2. **Drizzle only**: Do NOT use Prisma (legacy)
3. **Type safety**: All external data must be Zod validated
4. **Error resilience**: Pipeline continues on partial failures

---

## Troubleshooting

### Database Connection Issues

**Symptom**: `Connection refused` or timeout errors

**Solution**:
1. Verify `DATABASE_URL` in `.env.local` or Vercel
2. Ensure using **pooled** connection string (ends with `-pooler`)
3. Check `sslmode=require` is in connection string
4. Test with: `GET /api/health`

### OpenAI API Errors

**Symptom**: `API key invalid` or rate limit errors

**Solution**:
1. Verify `OPENAI_API_KEY` is set correctly
2. Check OpenAI account has sufficient credits
3. Verify `gpt-4o` model access in your account
4. Check rate limits: https://platform.openai.com/account/limits

### Rate Limiting Not Working

**Symptom**: Users can exceed 2 analyses per month

**Solution**:
1. Verify `X-Fingerprint` header is being sent
2. Check `usageTracking` table exists in database
3. Verify `monthKey` format is correct (`YYYY-MM`)
4. Check server logs for database errors

### Build Failures on Vercel

**Symptom**: Build fails with Prisma errors

**Solution**:
1. Ensure `vercel.json` has correct build command
2. Build command should be: `next build` (no Prisma)
3. Remove any Prisma generate steps from build
4. Use Drizzle ORM exclusively

### Type Errors After Schema Changes

**Symptom**: TypeScript errors after modifying schemas

**Solution**:
1. Regenerate types: `npm run db:generate`
2. Restart TypeScript server in IDE
3. Check Zod schema matches database schema
4. Ensure all imports are updated

### Scoring Engine Non-Determinism

**Symptom**: Same input produces different scores

**Solution**:
1. Check for `Math.random()` usage (remove it)
2. Check for `Date.now()` or `new Date()` (remove it)
3. Check for external API calls (remove them)
4. Verify all calculations use only input data

---

## Quick Reference

### File Paths

| Purpose | Path |
|---------|------|
| Types & Schemas | `/src/lib/types.ts` |
| Database Schema | `/src/lib/db/schema.ts` |
| Analysis Pipeline | `/src/lib/analysis/pipeline.ts` |
| Scoring Engine | `/src/lib/scoring/engine.ts` |
| LLM Prompts | `/src/lib/prompts.ts` |
| OpenAI Client | `/src/lib/openai.ts` |
| Rate Limiting | `/src/lib/usage.ts` |
| Logging | `/src/lib/logger.ts` |
| Error Handling | `/src/lib/api-errors.ts` |
| Main Test UI | `/src/app/page.tsx` |
| Report Display | `/src/app/report/[id]/page.tsx` |
| Unified Analyze API | `/src/app/api/analyze/route.ts` |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `LAUGHLAB_LLM_MODEL` | LLM model to use | `gpt-4o` |
| `NODE_ENV` | Environment | `development` or `production` |

### Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| `SCHEMA_VERSION` | `"1.0.0"` | `/src/lib/types.ts` |
| `STUB_USER_ID` | `"test-user-1"` | `/src/lib/types.ts` |
| Free tier limit | 2 analyses/month | `/src/lib/usage.ts` |
| Node version | 22.x | `package.json` |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Database health check |
| `POST` | `/api/scripts` | Submit script text |
| `POST` | `/api/jobs` | Create analysis job |
| `POST` | `/api/jobs/[id]/run` | Run analysis |
| `GET` | `/api/reports/[id]` | Get analysis report |
| `POST` | `/api/analyze` | **Unified analysis endpoint** (recommended) |

---

## Additional Resources

- **Setup Guide**: `/home/user/laugh-lab-slice0/SETUP.md`
- **Deployment Checklist**: `/home/user/laugh-lab-slice0/DEPLOYMENT_CHECKLIST.md`
- **Sample Script**: `/home/user/laugh-lab-slice0/test-seinfeld-script.txt`
- **Neon Docs**: https://neon.tech/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-23 | Initial comprehensive documentation |

---

**For questions or clarifications, refer to the codebase documentation or consult the development team.**
