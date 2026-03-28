'use client';

import SkeletonLoader from '@/components/ui/SkeletonLoader';
import GrantParagraph from './GrantParagraph';

interface PilotDesignerProps {
  headway: string;
  vehicle: string;
  cost: string;
  grant: string;
  isStreaming: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}

function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      {loading && !value ? (
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className="text-sm font-bold text-gray-900 truncate">{value || '—'}</p>
      )}
    </div>
  );
}

export default function PilotDesigner({
  headway,
  vehicle,
  cost,
  grant,
  isStreaming,
}: PilotDesignerProps) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: '400ms' }}>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary">
          <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M4 6H10M4 9H7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Micro-Transit Pilot Design
      </h3>

      {/* Stat cards row */}
      <div className="flex gap-2 mb-4">
        <StatCard
          label="Headway"
          value={headway}
          loading={isStreaming}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary-400">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M6 3V6L8 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Vehicle"
          value={vehicle}
          loading={isStreaming}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary-400">
              <rect x="1" y="4" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="3.5" cy="9.5" r="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
              <circle cx="8.5" cy="9.5" r="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
            </svg>
          }
        />
        <StatCard
          label="Est. Cost"
          value={cost}
          loading={isStreaming}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary-400">
              <path d="M6 1V11M8 3H5C4.17 3 3.5 3.67 3.5 4.5S4.17 6 5 6H7C7.83 6 8.5 6.67 8.5 7.5S7.83 9 7 9H3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Grant paragraph */}
      <GrantParagraph grant={grant} isStreaming={isStreaming} />
    </div>
  );
}
