import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/jobs/[job_id]/run/route';
import { NextRequest } from 'next/server';
import { callOpenAI } from '@/lib/openai';
import { STUB_USER_ID } from '@/lib/types';

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn((calls: any[]) => Promise.all(calls));

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  default: vi.fn(() => ({
    analysisJob: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
    scriptSubmission: {
      findUnique: mockFindUnique,
    },
    analysisReport: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  })),
}));

vi.mock('@/lib/openai', () => ({
  callOpenAI: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    startTimer: vi.fn(() => vi.fn()),
  },
}));

describe('POST /api/jobs/[job_id]/run', () => {
  const validJobId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = () => {
    return new NextRequest(`http://localhost/api/jobs/${validJobId}/run`, {
      method: 'POST',
    });
  };

  it('returns 400 for invalid job_id format', async () => {
    const req = new NextRequest('http://localhost/api/jobs/invalid-uuid/run', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ job_id: 'invalid-uuid' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].code).toBe('INPUT_VALIDATION_FAILED');
  });

  it('returns 404 when job is not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    
    const req = createRequest();
    const res = await POST(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Job not found');
  });

  it('returns existing run_id for already-completed jobs', async () => {
    const mockJob = {
      id: validJobId,
      status: 'completed',
      run_id: 'existing-run-id',
      user_id: STUB_USER_ID,
    };
    mockFindFirst.mockResolvedValue(mockJob);
    
    const req = createRequest();
    const res = await POST(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.run_id).toBe('existing-run-id');
    expect(data.already_completed).toBe(true);
  });

  it('returns 409 when job is already running', async () => {
    mockFindFirst.mockResolvedValue({
      id: validJobId,
      status: 'running',
      user_id: STUB_USER_ID,
    });
    
    const req = createRequest();
    const res = await POST(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.errors[0].message).toBe('Job is already running');
  });

  it('executes full pipeline and returns 200 on success', async () => {
    const mockJob = {
      id: validJobId,
      status: 'pending',
      user_id: STUB_USER_ID,
      script: { text: 'Sample script text for analysis. '.repeat(10) }
    };
    const mockPromptA = {
      classification: { inferred_format: 'scene', word_count: 100, estimated_pages: 1, tier_compatibility: 'ok' },
      metrics: { overall_score: 80, lpm_intermediate_plus: 2, lines_per_joke: 5, peak_moments: [], character_balance: { ensemble_balance: 0.5, dominant_character: 'A', characters: [] }, retention_risk: { overall_risk: 'low', indicators: [] } },
      issue_candidates: [{ issue_id: 'i1', type: 'pacing_soft_spot', location: { type: 'scene', value: '1' }, severity: 'minor', tags: [], evidence: { quote_snippet: '...', metric_refs: [] } }]
    };
    const mockPromptB = {
      sections: {
        comedy_metrics_snapshot: { bullets: [] },
        strengths_to_preserve: [],
        whats_getting_in_the_way: [{ issue_id: 'i1', why_it_matters: '...', concrete_fix: { title: '...', steps: [], expected_result: '...' } }],
        recommended_fixes: [{ issue_id: 'i1', fix: '...' }],
        punch_up_suggestions: [],
        how_to_revise_this_efficiently: { revision_plan: { mode: 'time_boxed', steps: [] } }
      }
    };

    mockFindFirst.mockResolvedValue(mockJob);
    (callOpenAI as any)
      .mockResolvedValueOnce(mockPromptA)
      .mockResolvedValueOnce(mockPromptB);
    
    const req = createRequest();
    const res = await POST(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.run_id).toBeDefined();
    
    // Verify DB updates
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: validJobId },
      data: expect.objectContaining({ status: 'running' })
    }));
    expect(mockCreate).toHaveBeenCalled();
  });

  it('handles Prompt A validation failure and persists error report', async () => {
    const mockJob = {
      id: validJobId,
      status: 'pending',
      user_id: STUB_USER_ID,
      script: { text: 'Sample script text for analysis. '.repeat(10) }
    };
    mockFindFirst.mockResolvedValue(mockJob);
    (callOpenAI as any).mockResolvedValue({ invalid: 'schema' });
    
    const req = createRequest();
    const res = await POST(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.errors[0].code).toBe('PROMPT_A_FAILED');
    expect(mockCreate).toHaveBeenCalled();
  });
});
