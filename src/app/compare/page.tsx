'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCorridorAnalysis } from '@/hooks/useCorridorAnalysis';
import type { CorridorSelection } from '@/hooks/useSelectedCorridor';
import { corridorFromGeocoderResult } from '@/lib/corridors/generator';
import CompareSelector from '@/components/compare/CompareSelector';
import CompareView from '@/components/compare/CompareView';
import type { FeatureCollection } from 'geojson';

export default function ComparePage() {
  const [corridorA, setCorridorA] = useState<CorridorSelection | null>(null);
  const [corridorB, setCorridorB] = useState<CorridorSelection | null>(null);

  // Fetch preset corridors for quick-select buttons
  const { data: corridorsData } = useQuery<FeatureCollection>({
    queryKey: ['corridors'],
    queryFn: async () => {
      const res = await fetch('/api/corridors');
      return res.json();
    },
  });

  const corridorList = useMemo(() => {
    if (!corridorsData) return [];
    return corridorsData.features.map((f) => ({
      id: f.properties?.id || '',
      name: f.properties?.name || '',
    }));
  }, [corridorsData]);

  // Fetch analyses — pass full corridor object so center is included for dynamic searches
  const { data: scoreA, isLoading: loadingA } = useCorridorAnalysis(
    corridorA?.id ?? null,
    corridorA
  );
  const { data: scoreB, isLoading: loadingB } = useCorridorAnalysis(
    corridorB?.id ?? null,
    corridorB
  );

  // Handle search result for side A
  const handleSearchA = useCallback((result: {
    place_name: string;
    center: [number, number];
    bbox?: [number, number, number, number];
  }) => {
    const corridor = corridorFromGeocoderResult(result);
    setCorridorA({
      id: corridor.id,
      name: corridor.name,
      center: corridor.center,
      polygon: corridor.polygon,
      bounds: corridor.bounds,
      isPreset: false,
    });
  }, []);

  // Handle search result for side B
  const handleSearchB = useCallback((result: {
    place_name: string;
    center: [number, number];
    bbox?: [number, number, number, number];
  }) => {
    const corridor = corridorFromGeocoderResult(result);
    setCorridorB({
      id: corridor.id,
      name: corridor.name,
      center: corridor.center,
      polygon: corridor.polygon,
      bounds: corridor.bounds,
      isPreset: false,
    });
  }, []);

  // Handle preset selection for side A
  const handlePresetA = useCallback((id: string) => {
    const preset = corridorList.find((c) => c.id === id);
    if (!preset) return;
    setCorridorA({
      id: preset.id,
      name: preset.name,
      isPreset: true,
    });
  }, [corridorList]);

  // Handle preset selection for side B
  const handlePresetB = useCallback((id: string) => {
    const preset = corridorList.find((c) => c.id === id);
    if (!preset) return;
    setCorridorB({
      id: preset.id,
      name: preset.name,
      isPreset: true,
    });
  }, [corridorList]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Corridor Comparison</h1>
                <p className="text-xs text-gray-400">Compare latent demand across any two neighborhoods</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L3 5V11L8 14L13 11V5L8 2Z" stroke="white" strokeWidth="1.2" fill="none" />
                  <circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.2" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">PulseRoute</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <CompareSelector
          corridors={corridorList}
          nameA={corridorA?.name || ''}
          nameB={corridorB?.name || ''}
          onSearchA={handleSearchA}
          onSearchB={handleSearchB}
          onPresetA={handlePresetA}
          onPresetB={handlePresetB}
        />

        <CompareView
          scoreA={scoreA || null}
          scoreB={scoreB || null}
          nameA={corridorA?.name || ''}
          nameB={corridorB?.name || ''}
          isLoadingA={loadingA}
          isLoadingB={loadingB}
        />
      </main>
    </div>
  );
}
