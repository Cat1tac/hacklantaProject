import type { GTFSStop, GTFSRoute, GTFSShape } from './types';

function parseCSVLines(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  return lines.map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
}

export function parseStops(csvText: string): GTFSStop[] {
  const rows = parseCSVLines(csvText);
  const header = rows[0];
  const idIdx = header.indexOf('stop_id');
  const latIdx = header.indexOf('stop_lat');
  const lonIdx = header.indexOf('stop_lon');
  const nameIdx = header.indexOf('stop_name');

  return rows.slice(1).map((row) => ({
    stop_id: row[idIdx] || '',
    stop_lat: parseFloat(row[latIdx]) || 0,
    stop_lon: parseFloat(row[lonIdx]) || 0,
    stop_name: row[nameIdx] || '',
  }));
}

export function parseRoutes(csvText: string): GTFSRoute[] {
  const rows = parseCSVLines(csvText);
  const header = rows[0];
  const idIdx = header.indexOf('route_id');
  const nameIdx = header.indexOf('route_short_name');
  const typeIdx = header.indexOf('route_type');

  return rows.slice(1).map((row) => ({
    route_id: row[idIdx] || '',
    route_short_name: row[nameIdx] || '',
    route_type: parseInt(row[typeIdx]) || 0,
  }));
}

export function parseShapes(csvText: string): GTFSShape[] {
  const rows = parseCSVLines(csvText);
  const header = rows[0];
  const idIdx = header.indexOf('shape_id');
  const latIdx = header.indexOf('shape_pt_lat');
  const lonIdx = header.indexOf('shape_pt_lon');
  const seqIdx = header.indexOf('shape_pt_sequence');

  const grouped = new Map<string, { lat: number; lon: number; seq: number }[]>();

  rows.slice(1).forEach((row) => {
    const shapeId = row[idIdx];
    if (!shapeId) return;
    if (!grouped.has(shapeId)) grouped.set(shapeId, []);
    grouped.get(shapeId)!.push({
      lat: parseFloat(row[latIdx]) || 0,
      lon: parseFloat(row[lonIdx]) || 0,
      seq: parseInt(row[seqIdx]) || 0,
    });
  });

  return Array.from(grouped.entries()).map(([shape_id, points]) => ({
    shape_id,
    points: points
      .sort((a, b) => a.seq - b.seq)
      .map((p) => [p.lat, p.lon] as [number, number]),
  }));
}
