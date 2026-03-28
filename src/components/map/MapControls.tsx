'use client';

interface MapControlsProps {
  onResetView: () => void;
}

export default function MapControls({ onResetView }: MapControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* City badge */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            Atlanta, GA
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 ml-4">
          4 corridors analyzed
        </p>
      </div>

      {/* Reset button */}
      <button
        onClick={onResetView}
        className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1.5C4.24 1.5 2 3.74 2 6.5C2 9.26 4.24 11.5 7 11.5C9.76 11.5 12 9.26 12 6.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M12 2.5V6.5H8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Reset View
      </button>

      {/* Legend */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2.5 shadow-md border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Latent Demand
        </p>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-6 rounded-sm bg-demand-low" />
          <div className="h-2.5 w-6 rounded-sm bg-demand-medium" />
          <div className="h-2.5 w-6 rounded-sm bg-demand-high" />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-gray-400">Low</span>
          <span className="text-[9px] text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
}
