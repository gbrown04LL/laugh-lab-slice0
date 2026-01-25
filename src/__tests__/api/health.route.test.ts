import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    startTimer: vi.fn(() => vi.fn()),
  },
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and ok:true when database is connected', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([1]);
    
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('returns 503 and ok:false when database connection fails', async () => {
    (prisma.$queryRaw as any).mockRejectedValue(new Error('Connection failed'));
    
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.ok).toBe(false);
    expect(data.errors[0].code).toBe('INTERNAL_ERROR');
  });
});
