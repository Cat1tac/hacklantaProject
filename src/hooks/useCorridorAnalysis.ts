import { useQuery } from '@tanstack/react-query';
import type { CorridorScore } from '@/lib/scoring/types';
import type { CorridorSelection } from './useSelectedCorridor';

interface AnalyzePayload {
  corridorId: string;
  center?: [number, number];
  name?: string;
}

async function fetchAnalysis(payload: AnalyzePayload): Promise<CorridorScore> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Analysis fetch failed');
  return response.json();
}

export function useCorridorAnalysis(
  corridorId: string | null,
  corridor?: CorridorSelection | null
) {
  const payload: AnalyzePayload | null = corridorId
    ? {
        corridorId,
        center: corridor?.center,
        name: corridor?.name,
      }
    : null;

  return useQuery({
    queryKey: ['analysis', corridorId, corridor?.center?.join(',')],
    queryFn: () => fetchAnalysis(payload!),
    enabled: !!payload,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}
