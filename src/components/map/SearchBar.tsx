'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
}

interface SearchBarProps {
  onSelect: (result: SearchResult) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
        `?access_token=${token}` +
        `&types=neighborhood,locality,place,poi` +
        `&country=us` +
        `&limit=5`
      );
      if (!res.ok) return;
      const data = await res.json();
      const features: SearchResult[] = (data.features || []).map((f: {
        id: string;
        place_name: string;
        center: [number, number];
        bbox?: [number, number, number, number];
      }) => ({
        id: f.id,
        place_name: f.place_name,
        center: f.center,
        bbox: f.bbox,
      }));
      setResults(features);
      setIsOpen(features.length > 0);
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.place_name.split(',')[0]);
    setIsOpen(false);
    setResults([]);
    onSelect(result);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        {/* Search icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search any neighborhood..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary placeholder:text-gray-400 shadow-sm"
        />

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Clear button */}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-medium text-gray-800 block">
                {result.place_name.split(',')[0]}
              </span>
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {result.place_name.split(',').slice(1).join(',').trim()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
