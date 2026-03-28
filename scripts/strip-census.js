/**
 * strip-census.js
 * 
 * Strips Census CSV files down to only the columns PulseRoute uses.
 * Run once after downloading CSVs from data.census.gov:
 * 
 *   node scripts/strip-census.js
 * 
 * Input:  data/census/raw/car_ownership.csv  (full download, ~50-200MB)
 *         data/census/raw/employment.csv
 *         data/census/raw/poverty_status.csv
 * 
 * Output: data/census/car_ownership.csv      (stripped, ~1-5MB)
 *         data/census/employment.csv
 *         data/census/poverty_status.csv
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'data', 'census', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'data', 'census');

// Columns to keep from each file (plus GEO_ID and NAME which are always kept)
const KEEP_COLUMNS = {
  'car_ownership.csv': ['GEO_ID', 'NAME', 'B08201_001E', 'B08201_002E'],
  'employment.csv':    ['GEO_ID', 'NAME', 'S2301_C03_001E'],
  'poverty_status.csv':['GEO_ID', 'NAME', 'S1701_C03_001E'],
};

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function stripFile(filename) {
  const inputPath = path.join(RAW_DIR, filename);
  const outputPath = path.join(OUT_DIR, filename);
  const keepCols = KEEP_COLUMNS[filename];

  if (!fs.existsSync(inputPath)) {
    console.log(`  SKIP: ${inputPath} not found`);
    return;
  }

  console.log(`  Processing ${filename}...`);
  const raw = fs.readFileSync(inputPath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/);

  if (lines.length < 3) {
    console.log(`  SKIP: ${filename} has fewer than 3 lines`);
    return;
  }

  // Row 0 = column codes (headers)
  const headers = parseCSVRow(lines[0]);
  
  // Find indices of columns to keep
  const indices = keepCols.map(col => {
    const idx = headers.findIndex(h => h.replace(/"/g, '') === col);
    if (idx === -1) console.log(`    WARNING: Column ${col} not found in ${filename}`);
    return idx;
  }).filter(idx => idx !== -1);

  console.log(`    Keeping ${indices.length} of ${headers.length} columns`);

  // Build output lines
  const outputLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVRow(line);
    const stripped = indices.map(idx => row[idx] || '');
    outputLines.push(stripped.join(','));
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');

  const inputSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
  const outputSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`    ${inputSize}MB → ${outputSize}MB (${Math.round((1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100)}% reduction)`);
}

// Main
console.log('Stripping Census CSVs to PulseRoute columns only...\n');

if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  console.log(`Created ${RAW_DIR}`);
  console.log('Place your full Census CSV downloads in data/census/raw/ and run again.\n');
  process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

for (const filename of Object.keys(KEEP_COLUMNS)) {
  stripFile(filename);
}

// Copy food_deserts.csv as-is if present (it's already small)
const foodSrc = path.join(RAW_DIR, 'food_deserts.csv');
const foodDst = path.join(OUT_DIR, 'food_deserts.csv');
if (fs.existsSync(foodSrc)) {
  fs.copyFileSync(foodSrc, foodDst);
  const size = (fs.statSync(foodSrc).size / 1024 / 1024).toFixed(1);
  console.log(`  Copied food_deserts.csv (${size}MB)`);
} else if (!fs.existsSync(foodDst)) {
  console.log('  NOTE: food_deserts.csv not found in raw/ — skipped');
}

console.log('\nDone. Stripped files are in data/census/');
console.log('Add data/census/raw/ to .gitignore (large originals)');
console.log('Commit data/census/*.csv (small stripped files)');
