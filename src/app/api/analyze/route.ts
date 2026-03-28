import { NextRequest, NextResponse } from 'next/server';
import { scoreCorridors } from '@/lib/scoring/engine';
import { getCached, setCached, corridorCacheKey, coordsCacheKey } from '@/lib/cache/kv';
import { getFallback } from '@/lib/cache/fallback';
import { fetchDynamicCensusTracts, aggregateDynamicMetrics } from '@/lib/census/dynamic-fetcher';
import type { CorridorScore, ScoringInput } from '@/lib/scoring/types';

// Pre-computed corridor demand data for preset corridors (fast path)
const CORRIDOR_DEMAND: Record<string, ScoringInput> = {
  'corridor-1': {
    corridorId: 'corridor-1',
    zeroCar: 38, employment: 3200, poverty: 28, foodDesert: 1,
  },
  'corridor-2': {
    corridorId: 'corridor-2',
    zeroCar: 52, employment: 4100, poverty: 42, foodDesert: 1,
  },
  'corridor-3': {
    corridorId: 'corridor-3',
    zeroCar: 35, employment: 2800, poverty: 36, foodDesert: 1,
  },
  'corridor-4': {
    corridorId: 'corridor-4',
    zeroCar: 58, employment: 3600, poverty: 45, foodDesert: 1,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { corridorId, center, name } = body as {
      corridorId: string;
      center?: [number, number];
      name?: string;
    };

    if (!corridorId) {
      return NextResponse.json(
        { error: 'corridorId is required' },
        { status: 400 }
      );
    }

    // Determine cache key — coordinate-based for searches, ID-based for presets
    const cacheKey = center
      ? coordsCacheKey(center, 'analysis')
      : corridorCacheKey(corridorId, 'analysis');

    // Check cache
    const cached = await getCached<CorridorScore>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // === PRESET CORRIDOR (fast path) ===
    const presetInput = CORRIDOR_DEMAND[corridorId];
    if (presetInput) {
      const results = scoreCorridors([presetInput]);
      const score = results[0];
      await setCached(cacheKey, score, 86400);
      return NextResponse.json(score);
    }

    // === DYNAMIC SEARCH CORRIDOR ===
    if (center) {
      const [lng, lat] = center;

      // Fetch Census data for this location
      const censusResult = await fetchDynamicCensusTracts(lat, lng);

      let demandInput: ScoringInput;

      if (censusResult && censusResult.tracts.length > 0) {
        const metrics = aggregateDynamicMetrics(censusResult.tracts);
        demandInput = {
          corridorId,
          zeroCar: metrics.zeroCar,
          employment: metrics.employment,
          poverty: metrics.poverty,
          foodDesert: metrics.foodDesert,
        };
      } else {
        // Absolute fallback — use national median estimates
        demandInput = {
          corridorId,
          zeroCar: 22,
          employment: 2000,
          poverty: 18,
          foodDesert: 0,
        };
      }

      const results = scoreCorridors([demandInput]);
      const score = results[0];
      await setCached(cacheKey, score, 86400);
      return NextResponse.json(score);
    }

    // === FALLBACK for unknown preset ID ===
    const fallback = getFallback(corridorId);
    if (fallback) {
      return NextResponse.json(fallback.score);
    }

    return NextResponse.json(
      { error: `Unknown corridor: ${corridorId}` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Analysis error:', error);

    // Serve fallback on any error
    try {
      const { corridorId } = await request.clone().json();
      const fallback = getFallback(corridorId);
      if (fallback) {
        return NextResponse.json(fallback.score);
      }
    } catch {}

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
