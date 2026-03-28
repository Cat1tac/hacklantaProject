import * as turf from '@turf/turf';
import type { CensusTract } from './types';
import type { FeatureCollection, Feature, Polygon } from 'geojson';

interface TractGeoJSON {
  geoid: string;
  centroid: [number, number]; // [lng, lat]
}

/**
 * Joins Census tracts to corridor polygons using centroid containment.
 * Returns a map of corridor IDs to the tracts that fall within each corridor.
 */
export function joinTractsToCorridors(
  tracts: CensusTract[],
  tractCentroids: TractGeoJSON[],
  corridors: FeatureCollection
): Map<string, CensusTract[]> {
  const result = new Map<string, CensusTract[]>();

  // Initialize empty arrays for each corridor
  corridors.features.forEach((corridor) => {
    const corridorId = corridor.properties?.id;
    if (corridorId) {
      result.set(corridorId, []);
    }
  });

  // For each tract centroid, find which corridor contains it
  tractCentroids.forEach((tractGeo) => {
    const matchingTract = tracts.find((t) => t.geoid === tractGeo.geoid);
    if (!matchingTract) return;

    const point = turf.point(tractGeo.centroid);

    corridors.features.forEach((corridor) => {
      const corridorId = corridor.properties?.id;
      if (!corridorId) return;

      try {
        if (turf.booleanPointInPolygon(point, corridor as Feature<Polygon>)) {
          result.get(corridorId)!.push(matchingTract);
        }
      } catch {
        // Skip invalid geometries
      }
    });
  });

  return result;
}

/**
 * Aggregates tract-level Census data into corridor-level demand metrics.
 * Used to create ScoringInput from raw Census tracts.
 */
export function aggregateCorridorMetrics(tracts: CensusTract[]): {
  zeroCar: number;
  employment: number;
  poverty: number;
} {
  if (tracts.length === 0) {
    return { zeroCar: 0, employment: 0, poverty: 0 };
  }

  const totalHH = tracts.reduce((sum, t) => sum + t.totalHouseholds, 0);
  const weightedZeroCar =
    tracts.reduce((sum, t) => sum + t.zeroCar * t.totalHouseholds, 0) / totalHH;
  const avgPoverty =
    tracts.reduce((sum, t) => sum + t.povertyRate, 0) / tracts.length;
  const avgEmployment =
    tracts.reduce((sum, t) => sum + t.employmentRate, 0) / tracts.length;

  return {
    zeroCar: Math.round(weightedZeroCar),
    employment: Math.round(avgEmployment * 50), // Scale to jobs/sq mi estimate
    poverty: Math.round(avgPoverty),
  };
}
