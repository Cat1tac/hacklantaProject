/**
 * Min-max normalization clamped to 0-100 range.
 * Converts raw Census/data values into comparable 0-100 scores.
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized * 10) / 10));
}

/**
 * Known ranges for each Census variable based on national data.
 * Used to contextualize local values against national benchmarks.
 */
export const FACTOR_RANGES = {
  zeroCar: { min: 0, max: 80, unit: '% of households', description: 'Households with zero vehicles available' },
  employment: { min: 0, max: 5000, unit: 'jobs/sq mi', description: 'Employment density within corridor' },
  poverty: { min: 0, max: 60, unit: '%', description: 'Population below federal poverty line' },
  foodDesert: { min: 0, max: 1, unit: 'boolean', description: 'USDA Low Income Low Access designation' },
} as const;

export type FactorKey = keyof typeof FACTOR_RANGES;
