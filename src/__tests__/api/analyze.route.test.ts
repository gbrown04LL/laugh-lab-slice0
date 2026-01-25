import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/analyze/route';
import { NextRequest } from 'next/server';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';
import { checkUsageLimit, incrementUsage } from '@/lib/usage';

// Mock dependencies
vi.mock('@/lib/analysis/pipeline', () => ({
  runAnalysisPipeline: vi.fn(),
}));

vi.mock('@/lib/usage', () => ({
  checkUsageLimit: vi.fn(),
  incrementUsage: vi.fn(),
}));

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue({}),
});

vi.mock('@/lib/db', () => ({
  default: vi.fn(() => ({
    insert: mockInsert,
  })),
}));

vi.mock('@/lib/db/schema', () => ({
  analyses: 'analyses',
}));

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it('returns 400 if script is missing', async () => {
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    const req = createRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('returns 400 if script is too short', async () => {
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    const req = createRequest({ script: 'too short' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('too short');
  });

  it('returns 400 if script is too long', async () => {
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    const req = createRequest({ script: 'a'.repeat(150001) });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('maximum length');
  });

  it('returns 429 if usage limit exceeded', async () => {
    (checkUsageLimit as any).mockResolvedValue({ 
      allowed: false, 
      reason: 'Monthly limit reached', 
      remaining: 0, 
      limit: 2 
    });
    const req = createRequest({ script: 'Valid script length '.repeat(10) });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Monthly limit reached');
  });

  it('returns 500 if pipeline fails', async () => {
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    (runAnalysisPipeline as any).mockResolvedValue({ success: false, error: 'Pipeline error' });
    
    const req = createRequest({ script: 'Valid script length '.repeat(10) });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Pipeline error');
  });

  it('returns 200 and analysis data on success', async () => {
    const mockResult = { 
      success: true, 
      data: { 
        metrics: { overall_score: 85 },
        classification: { inferred_format: 'sitcom' }
      } 
    };
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    (runAnalysisPipeline as any).mockResolvedValue(mockResult);
    (incrementUsage as any).mockResolvedValue({});

    const req = createRequest({ 
      script: 'Valid script length '.repeat(10),
      format: 'sitcom',
      title: 'Test Script'
    }, { 'x-fingerprint': 'test-fingerprint' });
    
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResult.data);
    expect(data.remaining).toBe(1);
    
    // Verify DB save and usage increment
    expect(mockInsert).toHaveBeenCalled();
    expect(incrementUsage).toHaveBeenCalledWith('test-fingerprint');
  });

  it('uses IP as identifier if fingerprint is missing', async () => {
    (checkUsageLimit as any).mockResolvedValue({ allowed: true, remaining: 2, limit: 2 });
    (runAnalysisPipeline as any).mockResolvedValue({ success: true, data: {} });
    
    const req = createRequest({ script: 'Valid script length '.repeat(10) }, { 'x-forwarded-for': '1.2.3.4' });
    await POST(req);

    expect(checkUsageLimit).toHaveBeenCalledWith('1.2.3.4');
  });
});
