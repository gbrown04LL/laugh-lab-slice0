import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/jobs/route';
import { NextRequest } from 'next/server';
import { STUB_USER_ID } from '@/lib/types';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: vi.fn(() => ({
    scriptSubmission: {
      findUnique: mockFindUnique,
    },
    analysisJob: {
      create: mockCreate,
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

describe('POST /api/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validScriptId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 400 for invalid script_id format', async () => {
    const req = new NextRequest('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ script_id: 'invalid-uuid' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].code).toBe('INPUT_VALIDATION_FAILED');
  });

  it('returns 404 if script does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    
    const req = new NextRequest('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ script_id: validScriptId }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Script not found');
  });

  it('returns 404 if script belongs to another user', async () => {
    mockFindUnique.mockResolvedValue({
      id: validScriptId,
      user_id: 'other-user',
    });
    
    const req = new NextRequest('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ script_id: validScriptId }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.errors[0].message).toBe('Script not found');
  });

  it('returns 201 and created job on success', async () => {
    mockFindUnique.mockResolvedValue({
      id: validScriptId,
      user_id: STUB_USER_ID,
    });
    const mockJob = {
      id: 'job-id',
      script_id: validScriptId,
      user_id: STUB_USER_ID,
      status: 'pending',
      run_id: null,
      created_at: new Date(),
      started_at: null,
      completed_at: null,
    };
    mockCreate.mockResolvedValue(mockJob);
    
    const req = new NextRequest('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ script_id: validScriptId }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe('job-id');
    expect(data.status).toBe('pending');
  });
});
