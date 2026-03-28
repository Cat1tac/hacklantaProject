import fs from 'fs';
import path from 'path';

export interface TractData {
  geoid: string;         // 11-digit FIPS: state(2) + county(3) + tract(6)
  state: string;         // 2-digit state FIPS
  county: string;        // 3-digit county FIPS
  zeroCar: number;       // % of households with zero vehicles
  totalHouseholds: number;
  employmentRate: number; // Employment/population ratio %
  povertyRate: number;   // % below poverty level
  foodDesert: number;    // 1 = LILA tract (food desert), 0 = not
}

// In-memory index: loaded once, reused for all requests
let tractIndex: Map<string, TractData> | null = null;
let countyIndex: Map<string, TractData[]> | null = null;

/**
 * Extracts the 11-digit FIPS from Census GEO_ID format.
 * Input:  "1400000US01001020100"
 * Output: "01001020100"
 */
function extractFIPS(geoId: string): string {
  const match = geoId.match(/US(\d+)$/);
  return match ? match[1] : geoId;
}

/**
 * Zero-pads a FIPS code to 11 digits.
 * USDA food desert file uses unpadded codes (e.g., "1001020100" instead of "01001020100").
 */
function padFIPS(fips: string): string {
  return fips.padStart(11, '0');
}

/**
 * Parses a Census CSV, skipping the descriptive header row (row 2).
 * Row 0 = column codes (used as keys), Row 1 = human-readable labels (skipped).
 * Returns Map of FIPS -> row values.
 */
function parseCensusCSV(filePath: string): Map<string, string[]> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const content = raw.replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 3) return new Map();

  const result = new Map<string, string[]>();

  // Row 0 = column code headers, Row 1 = descriptive headers (skip), Row 2+ = data
  for (let i = 2; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length < 3) continue;
    const geoId = row[0];
    if (!geoId || !geoId.includes('US')) continue;
    const fips = extractFIPS(geoId);
    result.set(fips, row);
  }

  return result;
}

/**
 * Parses the USDA Food Access Research Atlas CSV.
 * This has a DIFFERENT format than Census CSVs:
 * - Single header row (no descriptive row 2)
 * - CensusTract column has unpadded FIPS codes
 * - LILATracts_1And10 column: 1 = food desert, 0 = not
 * Returns Map of 11-digit FIPS -> food desert flag (0 or 1).
 */
function parseFoodDesertCSV(filePath: string): Map<string, number> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const content = raw.replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return new Map();

  const headers = parseCSVRow(lines[0]);
  const tractIdx = headers.indexOf('CensusTract');
  const lilaIdx = headers.indexOf('LILATracts_1And10');

  if (tractIdx === -1 || lilaIdx === -1) {
    console.error('Food desert CSV missing required columns. Expected CensusTract and LILATracts_1And10.');
    console.error('Found headers:', headers.slice(0, 10).join(', '));
    return new Map();
  }

  const result = new Map<string, number>();

  // Row 0 = headers, Row 1+ = data (no descriptive row to skip)
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length <= Math.max(tractIdx, lilaIdx)) continue;

    const rawFips = row[tractIdx];
    if (!rawFips || rawFips === 'CensusTract') continue;

    const fips = padFIPS(rawFips);
    const lila = parseInt(row[lilaIdx]);
    result.set(fips, isNaN(lila) ? 0 : lila);
  }

  return result;
}

/**
 * Simple CSV row parser that handles quoted fields.
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Safely parses a Census value to a number.
 * Handles commas, percentages, "-", "N", "(X)", "**", and missing data.
 */
function safeParseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '').replace(/%/g, '').trim();
  if (cleaned === '-' || cleaned === 'N' || cleaned === '(X)' || cleaned === '**' || cleaned === '') {
    return 0;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Finds the column index by code name in the header row.
 */
function colIndex(headers: string[], code: string): number {
  return headers.findIndex((h) => h === code);
}

/**
 * Loads all Census CSVs and the USDA food desert file into in-memory indexes.
 * Files expected at:
 *   data/census/car_ownership.csv     (B08201)
 *   data/census/employment.csv        (S2301)
 *   data/census/poverty_status.csv    (S1701)
 *   data/census/food_deserts.csv      (USDA Food Access Research Atlas)
 *
 * Call this once — it caches the result.
 */
export function loadCensusData(): {
  byTract: Map<string, TractData>;
  byCounty: Map<string, TractData[]>;
} {
  if (tractIndex && countyIndex) {
    return { byTract: tractIndex, byCounty: countyIndex };
  }

  const censusDir = path.join(process.cwd(), 'data', 'census');
  const carPath = path.join(censusDir, 'car_ownership.csv');
  const empPath = path.join(censusDir, 'employment.csv');
  const povPath = path.join(censusDir, 'poverty_status.csv');
  const foodPath = path.join(censusDir, 'food_deserts.csv');

  // Check required files exist
  for (const f of [carPath, empPath, povPath]) {
    if (!fs.existsSync(f)) {
      console.error(`Census CSV not found: ${f}`);
      console.error('Place your Census CSVs in data/census/ directory.');
      tractIndex = new Map();
      countyIndex = new Map();
      return { byTract: tractIndex, byCounty: countyIndex };
    }
  }

  console.log('Loading Census CSVs...');

  // Parse headers to find column indices
  const carRaw = fs.readFileSync(carPath, 'utf-8').replace(/^\uFEFF/, '');
  const empRaw = fs.readFileSync(empPath, 'utf-8').replace(/^\uFEFF/, '');
  const povRaw = fs.readFileSync(povPath, 'utf-8').replace(/^\uFEFF/, '');

  const carHeaders = parseCSVRow(carRaw.split(/\r?\n/)[0]);
  const empHeaders = parseCSVRow(empRaw.split(/\r?\n/)[0]);
  const povHeaders = parseCSVRow(povRaw.split(/\r?\n/)[0]);

  const carTotalIdx = colIndex(carHeaders, 'B08201_001E');
  const carZeroIdx = colIndex(carHeaders, 'B08201_002E');
  const empRateIdx = colIndex(empHeaders, 'S2301_C03_001E');
  const povRateIdx = colIndex(povHeaders, 'S1701_C03_001E');

  console.log(`Column indices — carTotal:${carTotalIdx}, carZero:${carZeroIdx}, empRate:${empRateIdx}, povRate:${povRateIdx}`);

  // Parse data rows
  const carData = parseCensusCSV(carPath);
  const empData = parseCensusCSV(empPath);
  const povData = parseCensusCSV(povPath);

  // Parse food desert data (optional file — won't block if missing)
  let foodData = new Map<string, number>();
  if (fs.existsSync(foodPath)) {
    foodData = parseFoodDesertCSV(foodPath);
    console.log(`Loaded food desert data: ${foodData.size} tracts`);
  } else {
    console.warn('Food desert CSV not found at data/census/food_deserts.csv — will estimate from poverty rate.');
  }

  console.log(`Loaded tracts — car:${carData.size}, emp:${empData.size}, pov:${povData.size}`);

  // Build tract index by merging all datasets
  const tracts = new Map<string, TractData>();
  const counties = new Map<string, TractData[]>();

  carData.forEach((carRow, fips) => {
    const totalHH = safeParseNum(carRow[carTotalIdx]);
    const zeroCarHH = safeParseNum(carRow[carZeroIdx]);
    const zeroCarPct = totalHH > 0 ? Math.round((zeroCarHH / totalHH) * 100) : 0;

    const empRow = empData.get(fips);
    const empRate = empRow ? safeParseNum(empRow[empRateIdx]) : 0;

    const povRow = povData.get(fips);
    const povRate = povRow ? safeParseNum(povRow[povRateIdx]) : 0;

    // Food desert: use USDA data if available, otherwise estimate from poverty
    let foodDesert = 0;
    if (foodData.size > 0) {
      foodDesert = foodData.get(fips) ?? 0;
    } else {
      foodDesert = povRate > 20 ? 1 : 0;
    }

    const state = fips.substring(0, 2);
    const county = fips.substring(2, 5);

    const tract: TractData = {
      geoid: fips,
      state,
      county,
      zeroCar: zeroCarPct,
      totalHouseholds: totalHH,
      employmentRate: empRate,
      povertyRate: povRate,
      foodDesert,
    };

    tracts.set(fips, tract);

    const countyKey = `${state}${county}`;
    if (!counties.has(countyKey)) {
      counties.set(countyKey, []);
    }
    counties.get(countyKey)!.push(tract);
  });

  // Assign to module-level cache
  tractIndex = tracts;
  countyIndex = counties;

  console.log(`Census index built: ${tracts.size} tracts across ${counties.size} counties`);

  return { byTract: tracts, byCounty: counties };
}

/**
 * Gets all tracts for a given state+county FIPS.
 */
export function getTractsForCounty(state: string, county: string): TractData[] {
  const { byCounty } = loadCensusData();
  return byCounty.get(`${state}${county}`) || [];
}

/**
 * Gets a single tract by full FIPS code.
 */
export function getTract(fips: string): TractData | null {
  const { byTract } = loadCensusData();
  return byTract.get(fips) || null;
}

/**
 * Aggregates tract data into corridor-level demand metrics.
 * Uses real food desert flags from USDA data.
 */
export function aggregateTracts(tracts: TractData[]): {
  zeroCar: number;
  employment: number;
  poverty: number;
  foodDesert: number;
  totalHouseholds: number;
  tractCount: number;
} {
  if (tracts.length === 0) {
    return { zeroCar: 0, employment: 0, poverty: 0, foodDesert: 0, totalHouseholds: 0, tractCount: 0 };
  }

  const totalHH = tracts.reduce((s, t) => s + t.totalHouseholds, 0);

  const weightedZeroCar = totalHH > 0
    ? tracts.reduce((s, t) => s + t.zeroCar * t.totalHouseholds, 0) / totalHH
    : 0;

  const avgEmployment = tracts.reduce((s, t) => s + t.employmentRate, 0) / tracts.length;
  const avgPoverty = tracts.reduce((s, t) => s + t.povertyRate, 0) / tracts.length;

  // Food desert: 1 if ANY tract in the corridor is a food desert
  const foodDesert = tracts.some((t) => t.foodDesert === 1) ? 1 : 0;

  return {
    zeroCar: Math.round(weightedZeroCar),
    employment: Math.round(avgEmployment * 50),
    poverty: Math.round(avgPoverty),
    foodDesert,
    totalHouseholds: totalHH,
    tractCount: tracts.length,
  };
}
