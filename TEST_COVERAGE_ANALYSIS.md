# Test Coverage Analysis - Laugh Lab

## Executive Summary

This document analyzes the current test coverage of the Laugh Lab codebase and identifies areas for improvement.

**Current Status:**
- **Test Files:** 30 files
- **Passing Tests:** 538 tests
- **Estimated Coverage:** ~65-70%
- **Testing Framework:** Vitest 1.0.4 with React Testing Library

| Category | Tested | Total | Coverage |
|----------|--------|-------|----------|
| API Routes | 7 | 7 | **100%** |
| Report Components | 8 | 12 | 67% |
| Core Library | 13 | 18 | 72% |
| Pages | 2 | 2 | 100% |

---

## Current Coverage by Area

### Well-Tested Areas (High Coverage)

| Area | Files Tested | Notes |
|------|--------------|-------|
| API Routes | 7/7 (100%) | All endpoints have comprehensive tests |
| Core Business Logic | 13/18 (72%) | Types, pipeline, scoring, fingerprinting |
| Report Components | 8/12 (67%) | Main visualization components tested |
| Pages | 2/2 (100%) | Home page and report page tested |

### Untested Areas (Coverage Gaps)

| Category | Files | Impact |
|----------|-------|--------|
| Evidence-Lock Pipeline | `evidenceLockPipeline.ts` | **CRITICAL** - New feature, untested |
| Schema Validation | `schemas/receipt.ts` | **HIGH** - Complex Zod schemas |
| Prompt Templates | `stageA_receipts.ts`, `stageB_summary.ts`, `promptA.ts`, `promptB.ts` | **MEDIUM** - LLM prompts |
| Database Layer | `db/index.ts`, `db/schema.ts` | **MEDIUM** - No integration tests |
| UI Components | 4 components | **LOW** - Presentational only |

---

## Priority 1: Critical Gaps

### 1.1 Evidence-Lock Pipeline (`src/lib/analysis/evidenceLockPipeline.ts`)

**Why it matters:** This is a recent feature (added in commit 1f57578) that orchestrates the two-stage LLM pipeline with retry logic and fallback handling. Bugs here could cause analysis failures.

**Lines of code:** 208 lines
**Complexity:** High (async, retry logic, error handling, validation)

**Recommended Test Cases:**

```typescript
// evidenceLockPipeline.test.ts

describe('runEvidenceLockPipeline', () => {
  describe('Stage A: Receipt Extraction', () => {
    it('should extract receipts from valid script and promptA output');
    it('should build correct stageAInput from promptAOutput');
    it('should throw error when Stage A validation fails');
    it('should handle missing jokesByLine gracefully');
    it('should extract line numbers from location values');
  });

  describe('Stage B: Executive Summary', () => {
    it('should generate summary citing approved receipts');
    it('should retry once when validation fails');
    it('should use fallback after two failed attempts');
    it('should parse Stage B output correctly');
  });

  describe('Validation and Retry Logic', () => {
    it('should validate that summary only cites approved receipts');
    it('should set retryCount to 1 after first retry');
    it('should set usedFallback to true when using fallback');
    it('should return complete EvidenceLockResult');
  });

  describe('Error Handling', () => {
    it('should use fallback on Stage B parsing error');
    it('should use fallback on OpenAI API error');
    it('should log appropriate messages at each stage');
  });
});
```

**Mocking Strategy:**
- Mock `callOpenAI` to return controlled responses
- Mock `validateSummary` to test retry/fallback paths
- Use existing LLM mock utilities from `src/__tests__/mocks/llm.ts`

---

### 1.2 Receipt Schema Validation (`src/lib/schemas/receipt.ts`)

**Why it matters:** This file contains complex Zod schemas with regex patterns, custom refinements, and helper functions. Schema validation errors could cause silent failures.

**Lines of code:** 240 lines
**Complexity:** High (regex patterns, custom refinements, helper functions)

**Recommended Test Cases:**

```typescript
// receipt.test.ts

describe('Receipt Schemas', () => {
  describe('ReceiptIdSchema', () => {
    it('should accept r01 through r15');
    it('should reject r00, r16, and invalid formats');
  });

  describe('ReceiptRangeSchema', () => {
    it('should accept "[Lines 1-10] ->" format');
    it('should accept various dash types (en-dash, minus, hyphen)');
    it('should reject malformed ranges');
  });

  describe('ReceiptSchema', () => {
    it('should validate complete receipt object');
    it('should enforce quote <=20 words');
    it('should enforce note 8-20 words');
    it('should require at least one tag');
    it('should validate severity enum');
    it('should validate confidence 0-1');
  });

  describe('StageAOutputSchema', () => {
    it('should require 10-15 receipts');
    it('should reject fewer than 10 receipts');
    it('should reject more than 15 receipts');
  });

  describe('categorizeReceipt', () => {
    it('should return "working" for low severity with positive tags');
    it('should return "opportunity" for high severity');
    it('should return "opportunity" when no positive tags');
  });

  describe('normalizeRange', () => {
    it('should normalize all dash types to en-dash');
    it('should handle multiple dashes in string');
  });
});
```

---

## Priority 2: Important Gaps

### 2.1 LLM Prompt Templates

**Files:**
- `src/lib/prompts/stageA_receipts.ts`
- `src/lib/prompts/stageB_summary.ts`
- `src/lib/llm/promptA.ts`
- `src/lib/llm/promptB.ts`

**Why it matters:** Prompt templates affect LLM output quality. Tests ensure prompts are well-formed and include required context.

**Recommended Test Cases:**

```typescript
// stageA_receipts.test.ts
describe('buildStageAPrompt', () => {
  it('should include script_text in prompt');
  it('should include jokesByLine when provided');
  it('should include characters when provided');
  it('should include metrics_snapshot');
  it('should produce valid string prompt');
});

// stageB_summary.test.ts
describe('buildStageBPrompt', () => {
  it('should include all receipts');
  it('should include format type');
  it('should include metrics');
  it('should instruct to cite only approved receipts');
});
```

### 2.2 Database Layer Integration Tests

**Files:** `src/lib/db/index.ts`, `src/lib/db/schema.ts`

**Why it matters:** While unit tests mock the database, integration tests ensure actual DB operations work correctly.

**Recommended Test Cases:**

```typescript
// db.integration.test.ts
describe('Database Operations', () => {
  describe('getDb', () => {
    it('should throw error when DATABASE_URL is not set');
    it('should return singleton instance');
    it('should connect to database successfully');
  });

  // With test database
  describe('CRUD Operations', () => {
    it('should create and retrieve scripts');
    it('should create and retrieve jobs');
    it('should create and retrieve reports');
    it('should handle foreign key constraints');
  });
});
```

---

## Priority 3: Nice-to-Have

### 3.1 Untested UI Components

These are presentational components with simple logic:

| Component | File | Lines | Recommended Tests |
|-----------|------|-------|-------------------|
| `CoverageSummary` | `CoverageSummary.tsx` | 64 | Render summary sections, test `generateSummaryFromData` helper |
| `EvidenceChip` | `EvidenceChip.tsx` | 49 | Render variants, test `LocationChips` and `TagChips` helpers |
| `ExecutiveSummary` | `ExecutiveSummary.tsx` | 48 | Render quick stats, test `getSummaryMessage` for score ranges |
| `PriorityFixPlan` | `PriorityFixPlan.tsx` | 61 | Render steps, calculate total minutes, handle empty array |

**Example Tests:**

```typescript
// CoverageSummary.test.tsx
describe('CoverageSummary', () => {
  it('should render all three summary paragraphs');
});

describe('generateSummaryFromData', () => {
  it('should generate praise from strengths with "exceptional" for score >= 80');
  it('should generate praise with "strong" for score >= 70');
  it('should generate constructive from top issue');
  it('should include retention risk when not low');
  it('should generate nextSteps from revision plan');
});

// EvidenceChip.test.tsx
describe('EvidenceChip', () => {
  it('should render text content');
  it('should apply correct styling for all variants');
});

describe('LocationChips', () => {
  it('should render scene chip for scene type');
  it('should render line range chip for line_range type');
  it('should return null when no location');
});

// ExecutiveSummary.test.tsx
describe('ExecutiveSummary', () => {
  it('should show excellent message for score >= 80');
  it('should show strong message for score >= 70');
  it('should show solid message for score >= 50');
  it('should show attention message for score < 50');
  it('should display correct counts for stats');
});

// PriorityFixPlan.test.tsx
describe('PriorityFixPlan', () => {
  it('should render all steps with numbers');
  it('should calculate and display total minutes');
  it('should return null for empty steps');
  it('should display individual step timebox');
});
```

### 3.2 End-to-End Tests

Add Playwright for full user flow testing:

```typescript
// e2e/analysis-flow.spec.ts
describe('Comedy Script Analysis Flow', () => {
  it('should complete full analysis from input to report');
  it('should handle rate limiting gracefully');
  it('should show progress during analysis');
  it('should display complete report with all sections');
});
```

---

## Recommended Implementation Order

| Priority | Area | Estimated Effort | Impact |
|----------|------|------------------|--------|
| **P1** | Evidence-Lock Pipeline | 4-6 hours | High |
| **P1** | Receipt Schema | 2-3 hours | High |
| **P2** | Prompt Templates | 2-3 hours | Medium |
| **P2** | Database Integration | 4-6 hours | Medium |
| **P3** | UI Components (4) | 2-4 hours | Low |
| **P3** | E2E Tests | 8+ hours | Medium |

**Total estimated effort to reach 90%+ coverage:** ~25-30 hours

---

## Testing Infrastructure

### Current Setup (Strong Foundation)
- Vitest 1.0.4 with v8 coverage provider
- React Testing Library 14.0.0
- Good mock utilities in `src/__tests__/mocks/llm.ts`
- Test fixtures for LLM outputs in `src/__tests__/fixtures/`
- Global test setup in `src/__tests__/setup.ts`

### Available Test Scripts
```bash
npm test              # Run tests in watch mode
npm run test:run      # Single run (CI mode)
npm run test:coverage # With coverage report
npm run test:ui       # Interactive UI dashboard
```

### Recommendations for Infrastructure

1. **Add snapshot tests** for prompt templates to catch unintended changes
2. **Set up CI coverage thresholds** to prevent regression (target: 80%)
3. **Add test database** for integration tests (use separate DATABASE_URL)
4. **Consider Playwright** for E2E tests of critical user flows

---

## Summary

The codebase has a solid testing foundation with 538 passing tests and 100% API route coverage. The main gaps are:

1. **Critical:** Evidence-Lock Pipeline (new feature, high complexity)
2. **Critical:** Receipt Schema validation (complex Zod schemas)
3. **Important:** LLM prompt templates and database integration
4. **Nice-to-have:** 4 presentational UI components

Addressing Priority 1 items would significantly improve reliability and catch potential regressions in the critical analysis path.

---

*Updated: 2026-01-28*
