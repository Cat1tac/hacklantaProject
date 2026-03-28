import fs from 'fs';
import path from 'path';
import type { CorridorScore } from '@/lib/scoring/types';

export interface FullAnalysis {
  score: CorridorScore;
  narrative: string;
  pilot: {
    headway: string;
    vehicle: string;
    cost: string;
    grant: string;
  };
  timestamp: string;
}

/**
 * Reads pre-cached fallback data from the data/fallbacks/ directory.
 * This is demo insurance — served if both KV and live API calls fail.
 */
export function getFallback(corridorId: string): FullAnalysis | null {
  try {
    // Extract numeric ID from "corridor-1" format
    const id = corridorId.replace('corridor-', '');
    const fallbackPath = path.join(
      process.cwd(),
      'data',
      'fallbacks',
      `corridor-${id}.json`
    );
    const data = fs.readFileSync(fallbackPath, 'utf-8');
    return JSON.parse(data) as FullAnalysis;
  } catch {
    return null;
  }
}

/**
 * Lists all available fallback corridor IDs.
 */
export function getAvailableFallbacks(): string[] {
  try {
    const dir = path.join(process.cwd(), 'data', 'fallbacks');
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}
