import { useState, useEffect, useRef } from 'react';
import type { DemandFactor } from '@/lib/scoring/types';

interface UseStreamingNarrativeProps {
  corridorId: string | null;
  corridorName: string;
  score: number | null;
  factors: DemandFactor[] | null;
  center?: [number, number];
  peerCity: {
    city: string;
    corridor: string;
    ridershipLift: number;
    year: number;
  } | null;
}

export function useStreamingNarrative({
  corridorId,
  corridorName,
  score,
  factors,
  center,
  peerCity,
}: UseStreamingNarrativeProps) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeCorridorRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't fire until we have consistent data
    if (!corridorId || score === null || !factors || !corridorName) return;

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    activeCorridorRef.current = corridorId;

    setText('');
    setIsStreaming(true);
    setError(null);

    const run = async () => {
      try {
        const response = await fetch('/api/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            corridorId,
            corridorName,
            score,
            factors,
            peerCity,
            center,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Narrative fetch failed');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Check if this request was superseded
          if (controller.signal.aborted) return;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Narrative streaming error:', err);
        if (!controller.signal.aborted) {
          setError('Failed to generate narrative');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsStreaming(false);
        }
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [corridorId, corridorName, score, factors, center, peerCity]);

  const cleanText = text.replace(/<\/?narrative>/g, '').trim();

  return { text: cleanText, isStreaming, error };
}
