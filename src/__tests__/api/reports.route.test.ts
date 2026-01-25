import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/reports/[run_id]/route';
import { NextRequest } from 'next/server';
import { STUB_USER_ID } from '@/lib/types';

const mockFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: vi.fn(() => ({
    analysisReport: {
      findUnique: mockFindUnique,
    },
  })),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    startTimer: vi.fn(() => vi.fn()),
  },
}));

describe('GET /api/reports/[run_id]', () => {
  const validRunId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid run_id format', async () => {
    const req = new NextRequest(`http://localhost/api/reports/invalid-uuid`);
    const res = await GET(req, { params: Promise.resolve({ run_id: 'invalid-uuid' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].code).toBe('INPUT_VALIDATION_FAILED');
  });

  it('returns 404 if report not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    
    const req = new NextRequest(`http://localhost/api/reports/${validRunId}`);
    const res = await GET(req, { params: Promise.resolve({ run_id: validRunId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Report not found');
  });

  it('returns 404 if report belongs to another user', async () => {
    mockFindUnique.mockResolvedValue({
      id: validRunId,
      user_id: 'other-user',
    });
    
    const req = new NextRequest(`http://localhost/api/reports/${validRunId}`);
    const res = await GET(req, { params: Promise.resolve({ run_id: validRunId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Report not found');
  });

  it('returns 200 and report data on success', async () => {
    const mockReport = {
      id: validRunId,
      job_id: 'job-id',
      user_id: STUB_USER_ID,
      schema_version: '1.0.0',
      output: { schema_version: '1.0.0', run: {}, prompt_a: {}, prompt_b: {} },
      created_at: new Date(),
    };
    mockFindUnique.mockResolvedValue(mockReport);
    
    const req = new NextRequest(`http://localhost/api/reports/${validRunId}`);
    const res = await GET(req, { params: Promise.resolve({ run_id: validRunId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(validRunId);
    expect(data.schema_version).toBe('1.0.0');
  });
});
