import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';

export interface CorridorDefinition {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  polygon: Feature<Polygon>;
  bounds: [number, number, number, number]; // [west, south, east, north]
  isPreset: boolean;
}

/**
 * Generates a corridor polygon from a center point with a given radius.
 * Used for user-searched neighborhoods where no preset polygon exists.
 */
export function generateCorridorPolygon(
  center: [number, number],
  radiusKm: number = 1.0
): Feature<Polygon> {
  const point = turf.point(center);
  const buffered = turf.buffer(point, radiusKm, { units: 'kilometers' });
  return buffered as Feature<Polygon>;
}

/**
 * Creates a full CorridorDefinition from a Mapbox geocoder result.
 */
export function corridorFromGeocoderResult(result: {
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
}): CorridorDefinition {
  const center = result.center;
  // Use bbox if available to determine radius, otherwise default 1km
  let radiusKm = 1.0;
  if (result.bbox) {
    const [west, south, east, north] = result.bbox;
    const corner = turf.point([west, south]);
    const opposite = turf.point([east, north]);
    const diag = turf.distance(corner, opposite, { units: 'kilometers' });
    radiusKm = Math.max(0.5, Math.min(diag / 2, 3.0)); // clamp 0.5-3km
  }

  const polygon = generateCorridorPolygon(center, radiusKm);
  const bbox = turf.bbox(polygon) as [number, number, number, number];

  // Create a deterministic ID from coordinates
  const id = `search-${Math.round(center[0] * 1000)}-${Math.round(center[1] * 1000)}`;

  return {
    id,
    name: result.place_name.split(',')[0], // First part of place name
    center,
    polygon,
    bounds: bbox,
    isPreset: false,
  };
}

/**
 * Hashes a coordinate pair into a cache-friendly string key.
 * Rounds to ~100m precision to allow near-duplicate hits.
 */
export function coordsCacheKey(center: [number, number]): string {
  const lng = Math.round(center[0] * 1000) / 1000;
  const lat = Math.round(center[1] * 1000) / 1000;
  return `${lng}_${lat}`;
}
