'use client';

import { useMemo } from 'react';
import { useSelectedCorridor } from '@/hooks/useSelectedCorridor';
import { useCorridorAnalysis } from '@/hooks/useCorridorAnalysis';
import { useStreamingNarrative } from '@/hooks/useStreamingNarrative';
import { useStreamingPilot } from '@/hooks/useStreamingPilot';
import DemandGauge from './DemandGauge';
import FactorBars from './FactorBars';
import NarrativePanel from './NarrativePanel';
import PeerCityCard from './PeerCityCard';
import PilotDesigner from '@/components/pilot/PilotDesigner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ExportButton from '@/components/ui/ExportButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { FeatureCollection } from 'geojson';

import peerCitiesData from '../../../data/peer_cities.json';

interface ScoreSidebarProps {
  corridors: FeatureCollection | null;
}

export default function ScoreSidebar({ corridors }: ScoreSidebarProps) {
  const { selectedCorridorId, selectedCorridor } = useSelectedCorridor();
  const { data: analysis, isLoading: analysisLoading } = useCorridorAnalysis(
    selectedCorridorId,
    selectedCorridor
  );

  // Get corridor name — from Zustand state (search) or corridors GeoJSON (preset)
  const corridorName = useMemo(() => {
    if (selectedCorridor?.name) return selectedCorridor.name;
    if (!corridors || !selectedCorridorId) return '';
    const feature = corridors.features.find(
      (f) => f.properties?.id === selectedCorridorId
    );
    return feature?.properties?.name || '';
  }, [corridors, selectedCorridorId, selectedCorridor]);

  const corridorDescription = useMemo(() => {
    if (selectedCorridor && !selectedCorridor.isPreset) {
      return 'Searched neighborhood — live Census analysis';
    }
    if (!corridors || !selectedCorridorId) return '';
    const feature = corridors.features.find(
      (f) => f.properties?.id === selectedCorridorId
    );
    return feature?.properties?.currentService || '';
  }, [corridors, selectedCorridorId, selectedCorridor]);

  const center = selectedCorridor?.center;

  const peerCity = useMemo(() => {
    if (!analysis) return null;
    const index = analysis.score % peerCitiesData.length;
    return peerCitiesData[index];
  }, [analysis]);

  const demand = useMemo(() => {
    if (!analysis) return null;
    const zeroCar = analysis.factors.find((f) => f.name === 'Zero-car households');
    const employment = analysis.factors.find((f) => f.name === 'Employment density');
    const poverty = analysis.factors.find((f) => f.name === 'Poverty rate');
    return {
      zeroCar: zeroCar?.value ?? 0,
      employment: employment?.value ?? 0,
      poverty: poverty?.value ?? 0,
    };
  }, [analysis]);

  // Stable reference for peer city prop — prevents hook re-triggers
  const peerCityProp = useMemo(() => {
    if (!peerCity) return null;
    return { city: peerCity.city, corridor: peerCity.corridor, ridershipLift: peerCity.ridershipLift, year: peerCity.year };
  }, [peerCity]);

  const {
    text: narrativeText,
    isStreaming: narrativeStreaming,
  } = useStreamingNarrative({
    corridorId: selectedCorridorId,
    corridorName,
    score: analysis?.score ?? null,
    factors: analysis?.factors ?? null,
    center,
    peerCity: peerCityProp,
  });

  const {
    headway,
    vehicle,
    cost,
    grant,
    isStreaming: pilotStreaming,
  } = useStreamingPilot({
    corridorId: selectedCorridorId,
    corridorName,
    score: analysis?.score ?? null,
    center,
    demand,
  });

  // Empty state
  if (!selectedCorridorId) {
    return (
      <div className="w-96 bg-white border-l border-gray-100 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
            <path d="M14 3L5 8V20L14 25L23 20V8L14 3Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Analyze a Corridor</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Search any U.S. neighborhood above, or click a highlighted corridor on the map.
        </p>

        {/* Quick corridor list */}
        <div className="mt-6 w-full space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Preset Corridors</p>
          {corridors?.features.map((f) => (
            <button
              key={f.properties?.id}
              onClick={() => useSelectedCorridor.getState().setSelectedCorridor(f.properties?.id)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <span className="text-sm font-semibold text-gray-800 group-hover:text-primary">
                {f.properties?.name}
              </span>
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {f.properties?.currentService}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-100 flex flex-col animate-slide-in overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{corridorName}</h2>
              {selectedCorridor && !selectedCorridor.isPreset && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-accent/10 text-accent rounded-md uppercase">
                  Search
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{corridorDescription}</p>
          </div>
          <button
            onClick={() => useSelectedCorridor.getState().setSelectedCorridorFull(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-5">
          <ErrorBoundary>
            {analysisLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-xs text-gray-400 mt-3">Analyzing corridor demand...</p>
                </div>
              </div>
            )}

            {analysis && (
              <>
                <DemandGauge score={analysis.score} grade={analysis.grade} />
                <FactorBars factors={analysis.factors} />
              </>
            )}

            {(narrativeText || narrativeStreaming) && (
              <div className="pt-2 border-t border-gray-100">
                <NarrativePanel text={narrativeText} isStreaming={narrativeStreaming} />
              </div>
            )}

            {analysis && peerCity && (
              <PeerCityCard peerCity={peerCity} />
            )}

            {analysis && (
              <div className="pt-2 border-t border-gray-100">
                <PilotDesigner
                  headway={headway}
                  vehicle={vehicle}
                  cost={cost}
                  grant={grant}
                  isStreaming={pilotStreaming}
                />
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Footer with export */}
      {analysis && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <ExportButton corridorId={selectedCorridorId} />
        </div>
      )}
    </div>
  );
}
