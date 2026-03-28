'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCorridorAnalysis } from '@/hooks/useCorridorAnalysis';
import CompareSelector from '@/components/compare/CompareSelector';
import CompareView from '@/components/compare/CompareView';
import Link from 'next/link';
import type { FeatureCollection } from 'geojson';

export default function ComparePage() {
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  // Fetch corridors
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

  // Fetch analyses
  const { data: scoreA, isLoading: loadingA } = useCorridorAnalysis(selectedA);
  const { data: scoreB, isLoading: loadingB } = useCorridorAnalysis(selectedB);

  const nameA = corridorList.find((c) => c.id === selectedA)?.name || '';
  const nameB = corridorList.find((c) => c.id === selectedB)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Corridor Comparison</h1>
                <p className="text-xs text-gray-400">Compare latent demand across corridors</p>
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
          selectedA={selectedA}
          selectedB={selectedB}
          onSelectA={setSelectedA}
          onSelectB={setSelectedB}
        />

        <CompareView
          scoreA={scoreA || null}
          scoreB={scoreB || null}
          nameA={nameA}
          nameB={nameB}
          isLoadingA={loadingA}
          isLoadingB={loadingB}
        />
      </main>
    </div>
  );
}
