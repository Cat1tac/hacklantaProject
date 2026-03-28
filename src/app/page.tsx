'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import CorridorMap, { type CorridorMapHandle } from '@/components/map/CorridorMap';
import ScoreSidebar from '@/components/sidebar/ScoreSidebar';
import SearchBar from '@/components/map/SearchBar';
import { useSelectedCorridor } from '@/hooks/useSelectedCorridor';
import { corridorFromGeocoderResult } from '@/lib/corridors/generator';
import type { FeatureCollection } from 'geojson';
import Link from 'next/link';

export default function HomePage() {
  const { selectedCorridorId, selectedCorridor } = useSelectedCorridor();
  const mapRef = useRef<CorridorMapHandle>(null);

  // Fetch preset corridors list
  const { data: corridors } = useQuery<FeatureCollection>({
    queryKey: ['corridors'],
    queryFn: async () => {
      const res = await fetch('/api/corridors');
      if (!res.ok) throw new Error('Failed to fetch corridors');
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });

  // Pre-fetch scores for preset corridors (map coloring)
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!corridors) return;
    const fetchScores = async () => {
      const scoreMap: Record<string, number> = {};
      await Promise.all(
        corridors.features.map(async (f) => {
          const id = f.properties?.id;
          if (!id) return;
          try {
            const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ corridorId: id }),
            });
            if (res.ok) {
              const data = await res.json();
              scoreMap[id] = data.score;
            }
          } catch {
            scoreMap[id] = 50;
          }
        })
      );
      setScores(scoreMap);
    };
    fetchScores();
  }, [corridors]);

  // Handle search result selection
  const handleSearchSelect = useCallback((result: {
    place_name: string;
    center: [number, number];
    bbox?: [number, number, number, number];
  }) => {
    const corridor = corridorFromGeocoderResult(result);

    // Update Zustand with full corridor definition
    useSelectedCorridor.getState().setSelectedCorridorFull({
      id: corridor.id,
      name: corridor.name,
      center: corridor.center,
      polygon: corridor.polygon,
      bounds: corridor.bounds,
      isPreset: false,
    });

    // Fly map to location and draw the polygon
    mapRef.current?.flyTo(corridor.center, 13);
    mapRef.current?.addDynamicPolygon(corridor.polygon, corridor.name);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Top nav bar */}
      <nav className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L3 5V13L9 16L15 13V5L9 2Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="9" cy="9" r="2.5" stroke="white" strokeWidth="1.5" />
              <path d="M9 6.5V2M9 16V11.5" stroke="white" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
          <div className="mr-4">
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">PulseRoute</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">Transit Demand Intelligence</p>
          </div>

          {/* Search bar in nav */}
          <SearchBar onSelect={handleSearchSelect} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/compare"
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
          >
            Compare
          </Link>
          {selectedCorridorId && selectedCorridor?.isPreset !== false && (
            <Link
              href={`/report/${selectedCorridorId}`}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors"
            >
              Full Report
            </Link>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <CorridorMap ref={mapRef} corridors={corridors || null} scores={scores} />
        <ScoreSidebar corridors={corridors || null} />
      </div>
    </div>
  );
}
