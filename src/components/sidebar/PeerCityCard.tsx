'use client';

interface PeerCity {
  city: string;
  corridor: string;
  beforeRidership: number;
  afterRidership: number;
  headwayBefore: number;
  headwayAfter: number;
  year: number;
  ridershipLift: number;
  notes: string;
}

interface PeerCityCardProps {
  peerCity: PeerCity | null;
}

export default function PeerCityCard({ peerCity }: PeerCityCardProps) {
  if (!peerCity) return null;

  return (
    <div
      className="border-l-4 border-l-emerald-500 bg-emerald-50/50 rounded-r-lg p-4 animate-fade-up"
      style={{ animationDelay: '300ms' }}
    >
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-600">
          <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Peer City Evidence
      </h3>

      <p className="text-sm font-semibold text-gray-900">
        {peerCity.city} — {peerCity.corridor}
      </p>

      <div className="mt-2.5 grid grid-cols-2 gap-3">
        {/* Ridership comparison */}
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase">Ridership</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-500 line-through">
              {peerCity.beforeRidership.toLocaleString()}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-emerald-600">
              <path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-bold text-emerald-700">
              {peerCity.afterRidership.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600">
            +{peerCity.ridershipLift}% lift
          </span>
        </div>

        {/* Headway improvement */}
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase">Headway</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-500 line-through">
              {peerCity.headwayBefore}min
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-emerald-600">
              <path d="M2 5H8M8 5L5 2M8 5L5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-bold text-emerald-700">
              {peerCity.headwayAfter}min
            </span>
          </div>
          <span className="text-[10px] text-gray-500">{peerCity.year}</span>
        </div>
      </div>

      <p className="mt-2.5 text-[11px] text-gray-600 leading-relaxed">
        {peerCity.notes}
      </p>
    </div>
  );
}
