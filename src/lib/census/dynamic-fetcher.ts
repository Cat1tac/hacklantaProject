import { getTractsForCounty, aggregateTracts, type TractData } from './csv-loader';

const GEOCODER_BASE = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';

interface FIPSResult {
  state: string;
  county: string;
  tract?: string;
}

/**
 * Resolves a lat/lng to state + county FIPS codes via Census Geocoder.
 */
async function resolveToFIPS(lat: number, lng: number): Promise<FIPSResult | null> {
  try {
    const url =
      `${GEOCODER_BASE}?x=${lng}&y=${lat}` +
      `&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const geographies = data?.result?.geographies?.['Census Tracts'];
    if (!geographies || geographies.length === 0) return null;

    const geo = geographies[0];
    return {
      state: geo.STATE,
      county: geo.COUNTY,
      tract: geo.TRACT,
    };
  } catch (error) {
    console.error('FIPS resolution failed:', error);
    return null;
  }
}

/**
 * Fetches Census tract data for an arbitrary lat/lng using local CSV files.
 * 1. Resolves coordinates → FIPS via Census Geocoder
 * 2. Looks up all tracts in that county from local CSVs
 * Returns the tracts and FIPS info.
 */
export async function fetchDynamicCensusTracts(
  lat: number,
  lng: number
): Promise<{ tracts: TractData[]; state: string; county: string } | null> {
  // Resolve coordinates to state/county FIPS
  const fips = await resolveToFIPS(lat, lng);
  if (!fips) {
    console.error('Could not resolve FIPS for', lat, lng);
    return null;
  }

  // Look up tracts from local CSV data
  const tracts = getTractsForCounty(fips.state, fips.county);
  
  if (tracts.length === 0) {
    console.warn(`No CSV data for county ${fips.state}${fips.county}. Is this county in your Census CSVs?`);
    return null;
  }

  console.log(`Found ${tracts.length} tracts for county ${fips.state}${fips.county}`);
  return { tracts, state: fips.state, county: fips.county };
}

/**
 * Aggregates tract data into corridor-level demand metrics.
 * Re-exported from csv-loader for backwards compatibility.
 */
export function aggregateDynamicMetrics(tracts: TractData[]) {
  return aggregateTracts(tracts);
}
