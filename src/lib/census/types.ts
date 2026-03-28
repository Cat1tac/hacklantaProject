export interface CensusTract {
  geoid: string;
  zeroCar: number;
  employmentRate: number;
  povertyRate: number;
  totalHouseholds: number;
  centroid?: [number, number]; // [lng, lat]
}

export interface CensusAPIResponse {
  rows: string[][];
  headers: string[];
}
