import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/scripts/route';
import { NextRequest } from 'next/server';
import { STUB_USER_ID } from '@/lib/types';

const mockCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: vi.fn(() => ({
    scriptSubmission: {
      create: mockCreate,
    },
  })),
  getPrismaClient: vi.fn(() => ({
    scriptSubmission: {
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

describe('POST /api/scripts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing script text', async () => {
    const req = new NextRequest('http://localhost/api/scripts', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].code).toBe('INPUT_VALIDATION_FAILED');
  });

  it('returns 400 for script text that is too long', async () => {
    const req = new NextRequest('http://localhost/api/scripts', {
      method: 'POST',
      body: JSON.stringify({ text: 'a'.repeat(100001) }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors[0].message).toBe('Validation failed');
  });

  it('returns 201 and created script on success', async () => {
    const mockScript = {
      id: 'script-id',
      user_id: STUB_USER_ID,
      created_at: new Date(),
    };
    mockCreate.mockResolvedValue(mockScript);
    
    const req = new NextRequest('http://localhost/api/scripts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Sample script text.' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe('script-id');
  });

  it('returns 500 on database failure', async () => {
    mockCreate.mockRejectedValue(new Error('DB Error'));
    
    const req = new NextRequest('http://localhost/api/scripts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Sample script text.' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.errors[0].code).toBe('INTERNAL_ERROR');
  });
});
