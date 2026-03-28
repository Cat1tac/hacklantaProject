'use client';

import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface NarrativePanelProps {
  text: string;
  isStreaming: boolean;
}

export default function NarrativePanel({ text, isStreaming }: NarrativePanelProps) {
  if (!text && !isStreaming) {
    return <SkeletonLoader lines={5} />;
  }

  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1" />
        </svg>
        AI Demand Analysis
      </h3>
      <div className="relative">
        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-cursor-blink align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
