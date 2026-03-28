'use client';

import SearchBar from '@/components/map/SearchBar';

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
}

interface CompareSelectorProps {
  corridors: Array<{ id: string; name: string }>;
  nameA: string;
  nameB: string;
  onSearchA: (result: SearchResult) => void;
  onSearchB: (result: SearchResult) => void;
  onPresetA: (id: string) => void;
  onPresetB: (id: string) => void;
}

export default function CompareSelector({
  corridors,
  nameA,
  nameB,
  onSearchA,
  onSearchB,
  onPresetA,
  onPresetB,
}: CompareSelectorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        {/* Side A */}
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Corridor A
          </label>
          <SearchBar onSelect={onSearchA} />
          {nameA && (
            <p className="mt-2 text-sm font-semibold text-primary">{nameA}</p>
          )}
          {/* Preset quick-select */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => onPresetA(c.id)}
                className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-100 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* VS divider */}
        <div className="pt-8">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-400">vs</span>
          </div>
        </div>

        {/* Side B */}
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Corridor B
          </label>
          <SearchBar onSelect={onSearchB} />
          {nameB && (
            <p className="mt-2 text-sm font-semibold text-accent">{nameB}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => onPresetB(c.id)}
                className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-100 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
