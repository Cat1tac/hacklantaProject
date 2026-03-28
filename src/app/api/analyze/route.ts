import { NextRequest, NextResponse } from 'next/server';
import { scoreCorridors } from '@/lib/scoring/engine';
import { getCached, setCached, corridorCacheKey, coordsCacheKey } from '@/lib/cache/kv';
import { getFallback } from '@/lib/cache/fallback';
import { fetchDynamicCensusTracts, aggregateDynamicMetrics } from '@/lib/census/dynamic-fetcher';
import { getTractsForCounty, aggregateTracts } from '@/lib/census/csv-loader';
import type { CorridorScore, ScoringInput } from '@/lib/scoring/types';

/**
 * Preset corridor center coordinates and county FIPS.
 * Used to look up real Census data from local CSVs.
 */
const PRESET_CORRIDORS: Record<string, { lat: number; lng: number; state: string; county: string }> = {
  'corridor-1': { lat: 33.7325, lng: -84.2522, state: '13', county: '089' }, // South DeKalb — DeKalb County
  'corridor-2': { lat: 33.7625, lng: -84.4090, state: '13', county: '121' }, // English Ave — Fulton County
  'corridor-3': { lat: 33.7350, lng: -84.3975, state: '13', county: '121' }, // Mechanicsville — Fulton County
  'corridor-4': { lat: 33.8150, lng: -84.2525, state: '13', county: '089' }, // Clarkston — DeKalb County
};

/**
 * Builds a ScoringInput from Census CSV data for a given county.
 */
function buildScoringInputFromCSV(
  corridorId: string,
  state: string,
  county: string
): ScoringInput | null {
  const tracts = getTractsForCounty(state, county);
  if (tracts.length === 0) return null;

  const metrics = aggregateTracts(tracts);
  return {
    corridorId,
    zeroCar: metrics.zeroCar,
    employment: metrics.employment,
    poverty: metrics.poverty,
    foodDesert: metrics.foodDesert,
  };
}

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

    // Determine cache key
    const cacheKey = center
      ? coordsCacheKey(center, 'analysis')
      : corridorCacheKey(corridorId, 'analysis');

    // Check cache
    const cached = await getCached<CorridorScore>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // === PRESET CORRIDOR — use known county FIPS to pull CSV data ===
    const preset = PRESET_CORRIDORS[corridorId];
    if (preset) {
      const input = buildScoringInputFromCSV(corridorId, preset.state, preset.county);
      if (input) {
        const results = scoreCorridors([input]);
        const score = results[0];
        await setCached(cacheKey, score, 86400);
        return NextResponse.json(score);
      }
      // CSV data not available — try fallback JSON
      const fallback = getFallback(corridorId);
      if (fallback) {
        return NextResponse.json(fallback.score);
      }
    }

    // === DYNAMIC SEARCH CORRIDOR — resolve FIPS from coordinates, then CSV lookup ===
    if (center) {
      const [lng, lat] = center;

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
        // No CSV data for this county — use national median estimates
        demandInput = {
          corridorId,
          zeroCar: 22,
          employment: 2000,
          poverty: 18,
          foodDesert: 0,
        };
        console.warn(`No Census CSV data for coordinates ${lat},${lng}. Using national estimates.`);
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
