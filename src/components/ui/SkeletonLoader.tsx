'use client';

interface SkeletonLoaderProps {
  lines?: number;
}

export default function SkeletonLoader({ lines = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-3 animate-pulse" role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`rounded-md bg-gray-200 ${i % 2 === 0 ? 'h-4' : 'h-3'} ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
