import { useState, useEffect, useRef } from 'react';
import { parsePartialPilotResponse } from '@/lib/ai/parser';

interface UseStreamingPilotProps {
  corridorId: string | null;
  corridorName: string;
  score: number | null;
  center?: [number, number];
  demand: {
    zeroCar: number;
    employment: number;
    poverty: number;
  } | null;
}

export function useStreamingPilot({
  corridorId,
  corridorName,
  score,
  center,
  demand,
}: UseStreamingPilotProps) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [headway, setHeadway] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [cost, setCost] = useState('');
  const [grant, setGrant] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Don't fire until we have consistent data
    if (!corridorId || score === null || !demand || !corridorName) return;

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setIsStreaming(true);
    setError(null);
    setHeadway('');
    setVehicle('');
    setCost('');
    setGrant('');

    const run = async () => {
      try {
        const response = await fetch('/api/pilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            corridorId,
            corridorName,
            score,
            demand,
            center,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Pilot fetch failed');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) return;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);

          const parsed = parsePartialPilotResponse(accumulated);
          if (parsed.headway) setHeadway(parsed.headway);
          if (parsed.vehicle) setVehicle(parsed.vehicle);
          if (parsed.cost) setCost(parsed.cost);
          if (parsed.grant) setGrant(parsed.grant);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Pilot streaming error:', err);
        if (!controller.signal.aborted) {
          setError('Failed to generate pilot design');
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
  }, [corridorId, corridorName, score, center, demand]);

  return { text, headway, vehicle, cost, grant, isStreaming, error };
}
