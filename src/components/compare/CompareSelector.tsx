'use client';

interface CompareSelectorProps {
  corridors: Array<{ id: string; name: string }>;
  selectedA: string | null;
  selectedB: string | null;
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
}

export default function CompareSelector({
  corridors,
  selectedA,
  selectedB,
  onSelectA,
  onSelectB,
}: CompareSelectorProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
          Corridor A
        </label>
        <select
          value={selectedA || ''}
          onChange={(e) => onSelectA(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
        >
          <option value="">Select corridor...</option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id} disabled={c.id === selectedB}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-5">
        <span className="text-sm font-bold text-gray-300">vs</span>
      </div>

      <div className="flex-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
          Corridor B
        </label>
        <select
          value={selectedB || ''}
          onChange={(e) => onSelectB(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
        >
          <option value="">Select corridor...</option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id} disabled={c.id === selectedA}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
