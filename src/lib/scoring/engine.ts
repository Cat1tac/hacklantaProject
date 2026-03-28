import { normalize } from './normalize';
import type { ScoringInput, CorridorScore, DemandFactor } from './types';

const WEIGHTS = {
  zeroCar: 0.35,
  employment: 0.25,
  poverty: 0.20,
  foodDesert: 0.20,
};

/**
 * Scores corridors based on latent demand proxies.
 * This replaces traditional ridership-based analysis with
 * destination-demand modeling — measuring where people NEED
 * to go rather than where they currently ride.
 */
export function scoreCorridors(inputs: ScoringInput[]): CorridorScore[] {
  return inputs.map((input) => {
    const factors: DemandFactor[] = [
      {
        name: 'Zero-car households',
        value: input.zeroCar,
        normalized: normalize(input.zeroCar, 0, 80),
        weight: WEIGHTS.zeroCar,
      },
      {
        name: 'Employment density',
        value: input.employment,
        normalized: normalize(input.employment, 0, 5000),
        weight: WEIGHTS.employment,
      },
      {
        name: 'Poverty rate',
        value: input.poverty,
        normalized: normalize(input.poverty, 0, 60),
        weight: WEIGHTS.poverty,
      },
      {
        name: 'Food desert',
        value: input.foodDesert,
        normalized: input.foodDesert ? 100 : 0,
        weight: WEIGHTS.foodDesert,
      },
    ];

    const score = Math.round(
      factors.reduce((sum, f) => sum + f.normalized * f.weight, 0)
    );

    const grade: CorridorScore['grade'] =
      score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    return { corridorId: input.corridorId, score, factors, grade };
  });
}
