import * as turf from '@turf/turf';
import type { GTFSStop } from './types';
import type { Feature, Polygon } from 'geojson';

/**
 * Builds a corridor polygon by buffering a line through stops.
 * This creates the geographic boundary for spatial analysis.
 */
export function buildCorridorPolygon(
  stops: GTFSStop[],
  bufferKm: number = 0.5
): Feature<Polygon> | null {
  if (stops.length < 2) return null;

  const coords = stops.map((s) => [s.stop_lon, s.stop_lat] as [number, number]);
  const line = turf.lineString(coords);
  const buffered = turf.buffer(line, bufferKm, { units: 'kilometers' });

  return buffered as Feature<Polygon>;
}

/**
 * Filters stops that fall within a corridor polygon.
 * Used to identify which transit stops serve a given corridor.
 */
export function getStopsInCorridor(
  stops: GTFSStop[],
  corridorPolygon: Feature<Polygon>
): GTFSStop[] {
  return stops.filter((stop) => {
    const point = turf.point([stop.stop_lon, stop.stop_lat]);
    return turf.booleanPointInPolygon(point, corridorPolygon);
  });
}
