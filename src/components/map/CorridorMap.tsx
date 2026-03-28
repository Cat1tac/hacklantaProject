'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import { useSelectedCorridor } from '@/hooks/useSelectedCorridor';
import MapControls from './MapControls';
import type { FeatureCollection, Feature, Polygon } from 'geojson';

export interface CorridorMapHandle {
  flyTo: (center: [number, number], zoom?: number) => void;
  addDynamicPolygon: (polygon: Feature<Polygon>, name: string, score?: number) => void;
}

interface CorridorMapProps {
  corridors: FeatureCollection | null;
  scores: Record<string, number>;
}

const ATLANTA_CENTER: [number, number] = [-84.388, 33.749];
const ATLANTA_ZOOM = 11;

const CorridorMap = forwardRef<CorridorMapHandle, CorridorMapProps>(
  function CorridorMap({ corridors, scores }, ref) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { selectedCorridorId, setSelectedCorridor } = useSelectedCorridor();

    const [webglSupported, setWebglSupported] = useState(true);
    useEffect(() => {
      if (typeof window !== 'undefined' && !mapboxgl.supported()) {
        setWebglSupported(false);
      }
    }, []);

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom: number = 13) => {
        mapRef.current?.flyTo({ center, zoom, duration: 1400 });
      },
      addDynamicPolygon: (polygon: Feature<Polygon>, name: string, score: number = 50) => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return;

        const data: FeatureCollection = {
          type: 'FeatureCollection',
          features: [{
            ...polygon,
            properties: { ...polygon.properties, name, score, id: 'dynamic-search' },
          }],
        };

        if (map.getSource('dynamic-corridor')) {
          (map.getSource('dynamic-corridor') as mapboxgl.GeoJSONSource).setData(data as GeoJSON.GeoJSON);
        } else {
          map.addSource('dynamic-corridor', { type: 'geojson', data: data as GeoJSON.GeoJSON });

          map.addLayer({
            id: 'dynamic-fill',
            type: 'fill',
            source: 'dynamic-corridor',
            paint: {
              'fill-color': [
                'interpolate', ['linear'], ['get', 'score'],
                20, '#ef4444', 50, '#eab308', 80, '#22c55e',
              ],
              'fill-opacity': 0.45,
            },
          });

          map.addLayer({
            id: 'dynamic-border',
            type: 'line',
            source: 'dynamic-corridor',
            paint: {
              'line-color': [
                'interpolate', ['linear'], ['get', 'score'],
                20, '#dc2626', 50, '#ca8a04', 80, '#16a34a',
              ],
              'line-width': 3,
              'line-dasharray': [2, 2],
            },
          });

          map.addLayer({
            id: 'dynamic-label',
            type: 'symbol',
            source: 'dynamic-corridor',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 14,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-anchor': 'center',
            },
            paint: {
              'text-color': '#1e293b',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
            },
          });
        }
      },
    }), [mapLoaded]);

    // Initialize map
    useEffect(() => {
      if (!mapContainer.current || !webglSupported) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: ATLANTA_CENTER,
        zoom: ATLANTA_ZOOM,
        pitch: 0,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => setMapLoaded(true));

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, [webglSupported]);

    // Add preset corridor data to map
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapLoaded || !corridors) return;

      const enriched = {
        ...corridors,
        features: corridors.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            score: scores[f.properties?.id] ?? 50,
          },
        })),
      };

      if (map.getSource('corridors')) {
        (map.getSource('corridors') as mapboxgl.GeoJSONSource).setData(enriched as GeoJSON.GeoJSON);
      } else {
        map.addSource('corridors', { type: 'geojson', data: enriched as GeoJSON.GeoJSON });

        map.addLayer({
          id: 'corridor-fill',
          type: 'fill',
          source: 'corridors',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'score'],
              20, '#ef4444', 50, '#eab308', 80, '#22c55e',
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              0.55, 0.35,
            ],
          },
        });

        map.addLayer({
          id: 'corridor-border',
          type: 'line',
          source: 'corridors',
          paint: {
            'line-color': [
              'interpolate', ['linear'], ['get', 'score'],
              20, '#dc2626', 50, '#ca8a04', 80, '#16a34a',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3.5, 1.5,
            ],
          },
        });

        map.addLayer({
          id: 'corridor-labels',
          type: 'symbol',
          source: 'corridors',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-anchor': 'center',
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#1e293b',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        map.on('click', 'corridor-fill', (e) => {
          if (e.features && e.features[0]?.properties?.id) {
            setSelectedCorridor(e.features[0].properties.id);
          }
        });

        map.on('mouseenter', 'corridor-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'corridor-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    }, [mapLoaded, corridors, scores, setSelectedCorridor]);

    // Highlight selected preset corridor
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapLoaded || !corridors) return;

      corridors.features.forEach((feature, i) => {
        map.setFeatureState(
          { source: 'corridors', id: i },
          { selected: feature.properties?.id === selectedCorridorId }
        );
      });
    }, [selectedCorridorId, mapLoaded, corridors]);

    const handleResetView = () => {
      mapRef.current?.flyTo({
        center: ATLANTA_CENTER,
        zoom: ATLANTA_ZOOM,
        duration: 1200,
      });
    };

    if (!webglSupported) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Map Unavailable</h2>
            <p className="text-sm text-gray-600 mb-4">WebGL is not supported in this browser.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex-1 h-full">
        <div ref={mapContainer} className="absolute inset-0" />
        <MapControls onResetView={handleResetView} />
      </div>
    );
  }
);

export default CorridorMap;
