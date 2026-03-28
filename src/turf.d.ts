declare module '@turf/turf' {
  export function point(coordinates: number[], properties?: Record<string, unknown>): GeoJSON.Feature<GeoJSON.Point>;
  export function lineString(coordinates: number[][], properties?: Record<string, unknown>): GeoJSON.Feature<GeoJSON.LineString>;
  export function buffer(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection, radius: number, options?: { units?: string }): GeoJSON.Feature<GeoJSON.Polygon>;
  export function booleanPointInPolygon(point: GeoJSON.Feature<GeoJSON.Point>, polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Feature): boolean;
  export function bbox(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.Geometry): [number, number, number, number];
}
