'use client';

/**
 * CorridorLayer is managed directly within CorridorMap.tsx
 * via Mapbox GL JS source/layer API.
 *
 * This file provides corridor-related utility functions
 * used by the map component.
 */

import type { FeatureCollection } from 'geojson';

/**
 * Enriches corridor features with score data for map visualization.
 */
export function enrichCorridorsWithScores(
  corridors: FeatureCollection,
  scores: Record<string, number>
): FeatureCollection {
  return {
    ...corridors,
    features: corridors.features.map((feature, index) => ({
      ...feature,
      id: index,
      properties: {
        ...feature.properties,
        score: scores[feature.properties?.id] ?? 50,
      },
    })),
  };
}

/**
 * Returns the color for a given demand score.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#65a30d';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

/**
 * Returns the grade label for a given score.
 */
export function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}
