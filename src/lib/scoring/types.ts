export interface DemandFactor {
  name: string;
  value: number;
  normalized: number;
  weight: number;
}

export interface CorridorScore {
  corridorId: string;
  score: number;
  factors: DemandFactor[];
  grade: 'A' | 'B' | 'C' | 'D';
}

export interface ScoringInput {
  corridorId: string;
  zeroCar: number;
  employment: number;
  poverty: number;
  foodDesert: number;
}
