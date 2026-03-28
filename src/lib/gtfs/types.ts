export interface GTFSStop {
  stop_id: string;
  stop_lat: number;
  stop_lon: number;
  stop_name: string;
}

export interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_type: number;
}

export interface GTFSShape {
  shape_id: string;
  points: [number, number][];
}
