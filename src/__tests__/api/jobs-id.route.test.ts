import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/jobs/[job_id]/route';
import { NextRequest } from 'next/server';
import { STUB_USER_ID } from '@/lib/types';

const mockFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: vi.fn(() => ({
    analysisJob: {
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

describe('GET /api/jobs/[job_id]', () => {
  const validJobId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid job_id format', async () => {
    const req = new NextRequest(`http://localhost/api/jobs/invalid-uuid`);
    const res = await GET(req, { params: Promise.resolve({ job_id: 'invalid-uuid' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].code).toBe('INPUT_VALIDATION_FAILED');
  });

  it('returns 404 if job not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    
    const req = new NextRequest(`http://localhost/api/jobs/${validJobId}`);
    const res = await GET(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Job not found');
  });

  it('returns 404 if job belongs to another user', async () => {
    mockFindUnique.mockResolvedValue({
      id: validJobId,
      user_id: 'other-user',
    });
    
    const req = new NextRequest(`http://localhost/api/jobs/${validJobId}`);
    const res = await GET(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Job not found');
  });

  it('returns 200 and job data on success', async () => {
    const mockJob = {
      id: validJobId,
      script_id: 'script-id',
      user_id: STUB_USER_ID,
      status: 'completed',
      run_id: 'run-id',
      created_at: new Date(),
      started_at: new Date(),
      completed_at: new Date(),
    };
    mockFindUnique.mockResolvedValue(mockJob);
    
    const req = new NextRequest(`http://localhost/api/jobs/${validJobId}`);
    const res = await GET(req, { params: Promise.resolve({ job_id: validJobId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(validJobId);
    expect(data.status).toBe('completed');
  });
});
