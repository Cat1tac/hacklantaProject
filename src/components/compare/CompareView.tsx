'use client';

import DemandGauge from '@/components/sidebar/DemandGauge';
import FactorBars from '@/components/sidebar/FactorBars';
import type { CorridorScore } from '@/lib/scoring/types';

interface CompareViewProps {
  scoreA: CorridorScore | null;
  scoreB: CorridorScore | null;
  nameA: string;
  nameB: string;
  isLoadingA: boolean;
  isLoadingB: boolean;
}

export default function CompareView({
  scoreA,
  scoreB,
  nameA,
  nameB,
  isLoadingA,
  isLoadingB,
}: CompareViewProps) {
  if (!scoreA && !scoreB) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">Select two corridors to compare</p>
        <p className="text-sm mt-1">Choose from the dropdowns above</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Column A */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 text-center">{nameA}</h3>
        {isLoadingA ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full animate-spin border-2 border-primary-300 border-t-primary-600" />
          </div>
        ) : scoreA ? (
          <div className="space-y-5">
            <DemandGauge score={scoreA.score} grade={scoreA.grade} />
            <FactorBars factors={scoreA.factors} />
          </div>
        ) : null}
      </div>

      {/* Column B */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 text-center">{nameB}</h3>
        {isLoadingB ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full animate-spin border-2 border-primary-300 border-t-primary-600" />
          </div>
        ) : scoreB ? (
          <div className="space-y-5">
            <DemandGauge score={scoreB.score} grade={scoreB.grade} />
            <FactorBars factors={scoreB.factors} />
          </div>
        ) : null}
      </div>

      {/* Difference row */}
      {scoreA && scoreB && (
        <div className="col-span-2 bg-gray-50 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Factor Comparison
          </h4>
          <div className="space-y-2">
            {scoreA.factors.map((factorA, i) => {
              const factorB = scoreB.factors[i];
              if (!factorB) return null;
              const diff = factorA.normalized - factorB.normalized;
              return (
                <div key={factorA.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-40">{factorA.name}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${factorA.normalized}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 w-8 text-right">
                      {factorA.normalized.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-14 text-center">
                    <span
                      className={`text-xs font-bold ${
                        diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-700 w-8">
                      {factorB.normalized.toFixed(0)}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="bg-accent rounded-full h-2"
                        style={{ width: `${factorB.normalized}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
