declare module '@turf/turf' {
  export * from '@turf/helpers';
  export function buffer(geojson: any, radius: number, options?: { units?: string }): any;
  export function lineString(coordinates: number[][], properties?: any): any;
  export function point(coordinates: number[], properties?: any): any;
  export function booleanPointInPolygon(point: any, polygon: any): boolean;
}
