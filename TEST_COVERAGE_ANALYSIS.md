# Test Coverage Analysis - Laugh Lab

## Executive Summary

The Laugh Lab codebase has **~42% test coverage** with 507 total tests across 16 test files. While UI components and core library functions are well-tested, there are significant gaps in **API route testing** and **database integration testing**.

| Category | Tested | Total | Coverage |
|----------|--------|-------|----------|
| React Components | 8 | 8 | 100% |
| Library Functions | 8 | 16 | 50% |
| API Routes | 0 | 7 | 0% |
| Page Components | 0 | 3 | 0% |

---

## Current Test Status

**Test Results:** 488 passing, 19 failing (mock configuration issues in usage.test.ts)
**Test Files:** 16 test files
**Total Test Lines:** ~4,910 lines

### What's Well-Tested

#### 1. React Components (100% coverage)
All 8 report components have tests:
- `AnalysisProgress.test.tsx` - Progress indicator states
- `CharacterBalanceChart.test.tsx` - Chart rendering and data handling
- `MetricsCards.test.tsx` - Key metrics display
- `OpportunitiesSection.test.tsx` - Improvement areas display
- `PunchUpWorkshop.test.tsx` - Interactive punch-up suggestions
- `ReportPage.test.tsx` - Main report page (comprehensive - 470 lines)
- `ScoreGauge.test.tsx` - Score visualization
- `StrengthsSection.test.tsx` - Strengths display

#### 2. Type/Schema Validation (1,012 lines)
`lib/types.test.ts` comprehensively tests all Zod schemas:
- CreateScriptSchema, CreateJobSchema
- ErrorObjectSchema, TierConfigSchema
- CharacterBalanceSchema, MetricsSchema
- PromptAOutputSchema, PromptBOutputSchema
- FinalOutputSchema

#### 3. Core Business Logic
- `lib/analysis/pipeline.test.ts` (603 lines) - Analysis pipeline execution
- `lib/scoring/engine.test.ts` - Score calculations, LPM/LPJ metrics
- `lib/api-errors.test.ts` (354 lines) - Error handling utilities
- `lib/fingerprint.test.ts` - Script fingerprinting
- `lib/openai.test.ts` & `lib/llm/openai-client.test.ts` - LLM client

---

## Priority 1: Critical Gaps (High Impact)

### 1.1 API Route Tests - **0% Coverage**

**Files needing tests:**
- `src/app/api/analyze/route.ts` (118 lines)
- `src/app/api/jobs/route.ts`
- `src/app/api/jobs/[job_id]/route.ts`
- `src/app/api/jobs/[job_id]/run/route.ts` (519 lines)
- `src/app/api/reports/[run_id]/route.ts`
- `src/app/api/scripts/route.ts`
- `src/app/api/health/route.ts`

**Recommended test scenarios for `analyze/route.ts`:**

```typescript
// src/__tests__/api/analyze.route.test.ts
describe('POST /api/analyze', () => {
  describe('Input Validation', () => {
    it('should return 400 when script is missing');
    it('should return 400 when script is too short (<100 chars)');
    it('should return 400 when script exceeds max length (>150,000 chars)');
    it('should accept valid script with default format');
    it('should accept custom format parameter');
  });

  describe('Usage Limits', () => {
    it('should return 429 when usage limit exceeded');
    it('should decrement remaining count on success');
    it('should use fingerprint header for identification');
    it('should fall back to IP when fingerprint missing');
  });

  describe('Analysis Pipeline', () => {
    it('should return analysis data on success');
    it('should return 500 when pipeline fails');
    it('should save analysis to database');
    it('should continue when database save fails');
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors');
    it('should return proper error format on failure');
  });
});
```

**Recommended test scenarios for `jobs/[job_id]/run/route.ts`:**

```typescript
// src/__tests__/api/jobs-run.route.test.ts
describe('POST /api/jobs/[job_id]/run', () => {
  describe('Validation', () => {
    it('should return 400 for invalid job_id format');
    it('should return 404 when job not found');
    it('should return 404 when script not found for job');
  });

  describe('Job State Management', () => {
    it('should return existing run_id for completed jobs (idempotent)');
    it('should return 409 when job is already running');
    it('should return 409 when job previously failed');
    it('should mark job as running when starting');
  });

  describe('Prompt Execution', () => {
    it('should execute Prompt A successfully');
    it('should handle Prompt A validation failure');
    it('should execute Prompt B with Prompt A results');
    it('should validate Prompt B issue_id references');
    it('should reject unknown issue_ids from Prompt B');
  });

  describe('Persistence', () => {
    it('should persist successful analysis report');
    it('should persist error report on failure');
    it('should mark job completed after success');
    it('should validate final output against schema');
  });
});
```

### 1.2 Fix Existing Test Failures

The `usage.test.ts` file has 19 failing tests due to improper mock configuration:

```typescript
// Current issue: No "default" export in mock
// Fix: Update the mock to include default export

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: mockDb, // Add default export
  };
});
```

---

## Priority 2: Important Gaps (Medium Impact)

### 2.1 Page Component Tests

**Files needing tests:**
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/app/report/[id]/page.tsx` - Report page

**Recommended tests:**

```typescript
// src/__tests__/pages/home.test.tsx
describe('Home Page', () => {
  it('should render script input form');
  it('should show character count');
  it('should disable submit when script too short');
  it('should handle form submission');
  it('should show loading state during analysis');
  it('should navigate to report on success');
  it('should display error messages');
});

// src/__tests__/pages/report.test.tsx
describe('Report Page', () => {
  it('should fetch and display report data');
  it('should show loading state while fetching');
  it('should handle report not found (404)');
  it('should handle API errors gracefully');
});
```

### 2.2 Logger Utility Tests

**File:** `src/lib/logger.ts` (58 lines)

```typescript
// src/__tests__/lib/logger.test.ts
describe('Logger', () => {
  describe('log levels', () => {
    it('should format info messages correctly');
    it('should format warn messages correctly');
    it('should format error messages correctly');
    it('should only output debug in development');
  });

  describe('context formatting', () => {
    it('should include context as JSON');
    it('should handle empty context');
    it('should include all context properties');
  });

  describe('timer', () => {
    it('should log start message');
    it('should log completion with duration');
    it('should preserve original context');
  });
});
```

### 2.3 Database Integration Tests

**Files needing tests:**
- `src/lib/db/index.ts` - Database initialization
- `src/lib/db/schema.ts` - Drizzle schema
- `src/lib/prisma.ts` - Prisma client

**Recommendation:** Use a test database (SQLite in-memory or test PostgreSQL) for integration tests.

```typescript
// src/__tests__/integration/database.test.ts
describe('Database Operations', () => {
  beforeAll(async () => {
    // Set up test database
  });

  afterAll(async () => {
    // Clean up
  });

  describe('Scripts', () => {
    it('should create a new script');
    it('should retrieve script by id');
    it('should update script');
  });

  describe('Jobs', () => {
    it('should create job linked to script');
    it('should update job status');
    it('should query jobs by user');
  });

  describe('Reports', () => {
    it('should store analysis report');
    it('should retrieve report by run_id');
    it('should store JSONB output correctly');
  });
});
```

---

## Priority 3: Nice-to-Have Improvements

### 3.1 End-to-End Tests

Add Playwright or Cypress for full user flow testing:

```typescript
// e2e/analysis-flow.spec.ts
describe('Comedy Script Analysis Flow', () => {
  it('should complete full analysis from input to report');
  it('should handle rate limiting gracefully');
  it('should persist analysis for return visits');
});
```

### 3.2 LLM Prompt Template Tests

**Files:** `src/lib/llm/promptA.ts`, `src/lib/llm/promptB.ts`

Test that prompts:
- Include required sections
- Have proper system instructions
- Don't exceed token limits

### 3.3 Performance/Load Tests

- Test scoring engine with large scripts
- Test API endpoints under load
- Memory usage during analysis

---

## Implementation Roadmap

### Phase 1: Fix & Stabilize (Immediate)
1. Fix mock configuration in `usage.test.ts` (19 failing tests)
2. Review and update test setup file

### Phase 2: API Route Coverage (Week 1-2)
1. Create test utilities for mocking Next.js request/response
2. Add tests for `analyze/route.ts` (highest traffic endpoint)
3. Add tests for `jobs/[job_id]/run/route.ts` (most complex endpoint)
4. Add tests for remaining 5 routes

### Phase 3: Integration Testing (Week 2-3)
1. Set up test database infrastructure
2. Add database operation tests
3. Add page component tests

### Phase 4: E2E & Polish (Week 3-4)
1. Set up Playwright
2. Add critical path E2E tests
3. Add logger and utility tests
4. Achieve 80%+ coverage target

---

## Testing Best Practices Observed

### Strengths
- Comprehensive schema validation testing
- Good component isolation with mock data
- Proper use of fixtures for LLM responses
- Testing both success and error paths

### Areas to Improve
- Need to mock external dependencies consistently
- Add integration tests for database operations
- Test API routes with proper Next.js context mocking
- Add E2E tests for critical user flows

---

## Metrics Target

| Metric | Current | Target |
|--------|---------|--------|
| Overall Coverage | ~42% | 80% |
| API Routes | 0% | 100% |
| Library Functions | 50% | 90% |
| Integration Tests | 0 | 10+ |
| E2E Tests | 0 | 5+ |

---

*Generated: 2026-01-25*
