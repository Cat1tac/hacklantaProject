import { create } from 'zustand';
import type { Feature, Polygon } from 'geojson';

export interface CorridorSelection {
  id: string;
  name: string;
  description?: string;
  center?: [number, number];
  polygon?: Feature<Polygon>;
  bounds?: [number, number, number, number];
  isPreset: boolean;
}

interface CorridorState {
  selectedCorridorId: string | null;
  selectedCorridor: CorridorSelection | null;
  setSelectedCorridor: (id: string | null) => void;
  setSelectedCorridorFull: (corridor: CorridorSelection | null) => void;
}

export const useSelectedCorridor = create<CorridorState>((set) => ({
  selectedCorridorId: null,
  selectedCorridor: null,
  setSelectedCorridor: (id) =>
    set({ selectedCorridorId: id, selectedCorridor: id ? null : null }),
  setSelectedCorridorFull: (corridor) =>
    set({
      selectedCorridorId: corridor?.id ?? null,
      selectedCorridor: corridor,
    }),
}));
