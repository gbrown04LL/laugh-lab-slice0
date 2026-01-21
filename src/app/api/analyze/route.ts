import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';
import { checkUsageLimit, incrementUsage } from '@/lib/usage';
import { db } from '@/lib/db';
import { analyses } from '@/lib/db/schema';
import crypto from 'crypto';

export const maxDuration = 60; // Allow up to 60 seconds for analysis

export async function POST(req: NextRequest) {
  try {
    // 1. Get identifier
    const fingerprint = req.headers.get('x-fingerprint');
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 'unknown';
    const identifier = fingerprint || ip;

    console.log('[Analyze API] Request from identifier:', identifier);

    // 2. Check usage limits
    const usage = await checkUsageLimit(identifier);
    if (!usage.allowed) {
      console.log('[Analyze API] Usage limit exceeded for:', identifier);
      return NextResponse.json({
        success: false,
        error: usage.reason,
        remaining: usage.remaining,
        limit: usage.limit,
      }, { status: 429 });
    }

    console.log('[Analyze API] Usage check passed. Remaining:', usage.remaining);

    // 3. Parse request
    const body = await req.json();
    const { script, format = 'auto', title = 'Untitled Script' } = body;

    // 4. Validate
    if (!script || typeof script !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Script text is required',
      }, { status: 400 });
    }

    if (script.length > 150000) {
      return NextResponse.json({
        success: false,
        error: 'Script exceeds maximum length (150,000 characters)',
      }, { status: 400 });
    }

    if (script.length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Script is too short for meaningful analysis',
      }, { status: 400 });
    }

    console.log('[Analyze API] Starting analysis pipeline...');

    // 5. Run analysis pipeline
    const result = await runAnalysisPipeline(script, format, title);

    if (!result.success) {
      console.error('[Analyze API] Pipeline failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }

    console.log('[Analyze API] Pipeline completed successfully');

    // 6. Save to database
    const scriptHash = crypto.createHash('sha256').update(script).digest('hex');
    
    try {
      await db.insert(analyses).values({
        fingerprint: identifier,
        title: title || 'Untitled Script',
        format: format || 'auto',
        scriptHash,
        result: result.data as any, // Store the full analysis result as JSONB
      });
      console.log('[Analyze API] Analysis saved to database');
    } catch (dbError) {
      console.error('[Analyze API] Database save failed:', dbError);
      // Continue even if database save fails - user still gets their analysis
    }

    // 7. Increment usage counter
    try {
      await incrementUsage(identifier);
      console.log('[Analyze API] Usage counter incremented');
    } catch (usageError) {
      console.error('[Analyze API] Usage increment failed:', usageError);
      // Continue even if increment fails
    }

    // 8. Return success with analysis data
    return NextResponse.json({
      success: true,
      data: result.data,
      remaining: usage.remaining - 1,
      limit: usage.limit,
    });

  } catch (error) {
    console.error('[Analyze API] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
