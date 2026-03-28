/**
 * strip-food-deserts.js
 * 
 * Strips the USDA Food Access Research Atlas CSV down to only
 * the 2 columns PulseRoute uses: CensusTract and LILATracts_1And10.
 * 
 * Run once:
 *   node scripts/strip-food-deserts.js
 * 
 * Input:  data/census/raw/food_deserts.csv   (full download, ~80-150MB)
 * Output: data/census/food_deserts.csv       (stripped, ~1-2MB)
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'data', 'census', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'data', 'census');
const FILENAME = 'food_deserts.csv';

const KEEP_COLUMNS = ['CensusTract', 'LILATracts_1And10'];

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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Main
console.log('Stripping food desert CSV...\n');

const inputPath = path.join(RAW_DIR, FILENAME);
const outputPath = path.join(OUT_DIR, FILENAME);

if (!fs.existsSync(inputPath)) {
  // Also check if it's directly in the census folder
  const altPath = path.join(OUT_DIR, FILENAME);
  if (fs.existsSync(altPath) && fs.statSync(altPath).size > 10 * 1024 * 1024) {
    // File exists in output dir but is large — treat it as the raw file
    console.log(`Found large ${FILENAME} in data/census/ — stripping in place.`);
    const raw = fs.readFileSync(altPath, 'utf-8').replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/);
    processAndWrite(lines, altPath);
  } else {
    if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
    console.log(`Place ${FILENAME} in data/census/raw/ and run again.`);
  }
} else {
  const raw = fs.readFileSync(inputPath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/);
  processAndWrite(lines, outputPath, inputPath);
}

function processAndWrite(lines, outputPath, inputPath) {
  if (lines.length < 2) {
    console.log('  File has fewer than 2 lines — nothing to strip.');
    return;
  }

  const headers = parseCSVRow(lines[0]);

  // Find column indices
  const indices = KEEP_COLUMNS.map(col => {
    const idx = headers.findIndex(h => h.replace(/"/g, '') === col);
    if (idx === -1) console.log(`  WARNING: Column "${col}" not found`);
    return idx;
  }).filter(idx => idx !== -1);

  if (indices.length === 0) {
    console.log('  No matching columns found. Check your CSV format.');
    console.log('  First 5 headers:', headers.slice(0, 5).join(', '));
    return;
  }

  console.log(`  Keeping ${indices.length} of ${headers.length} columns`);

  const outputLines = [];
  let rowCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVRow(line);
    const stripped = indices.map(idx => row[idx] || '');
    outputLines.push(stripped.join(','));
    rowCount++;
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');

  const outputSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  if (inputPath) {
    const inputSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
    const reduction = Math.round((1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100);
    console.log(`  ${inputSize}MB → ${outputSize}MB (${reduction}% reduction)`);
  } else {
    console.log(`  Output: ${outputSize}MB`);
  }
  console.log(`  ${rowCount - 1} tracts written to ${outputPath}`);
  console.log('\nDone.');
}
