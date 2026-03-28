import { NextRequest, NextResponse } from 'next/server';
import { getCached, corridorCacheKey } from '@/lib/cache/kv';
import { getFallback, type FullAnalysis } from '@/lib/cache/fallback';
import { parsePilotResponse } from '@/lib/ai/parser';
import type { CorridorScore } from '@/lib/scoring/types';

export async function GET(request: NextRequest) {
  const corridorId = request.nextUrl.searchParams.get('id');

  if (!corridorId) {
    return NextResponse.json(
      { error: 'id query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Try to assemble from cache
    const [analysis, narrative, pilotRaw] = await Promise.all([
      getCached<CorridorScore>(corridorCacheKey(corridorId, 'analysis')),
      getCached<string>(corridorCacheKey(corridorId, 'narrative')),
      getCached<string>(corridorCacheKey(corridorId, 'pilot')),
    ]);

    if (analysis && narrative && pilotRaw) {
      const pilot = parsePilotResponse(pilotRaw);
      const report: FullAnalysis = {
        score: analysis,
        narrative,
        pilot,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(report);
    }

    // Fall back to pre-cached data
    const fallback = getFallback(corridorId);
    if (fallback) {
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { error: 'No report data available for this corridor' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Report error:', error);
    const fallback = getFallback(corridorId);
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
