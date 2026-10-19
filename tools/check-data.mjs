// tools/check-data.mjs
// Verifies place ids, itinerary refs, and travel-time keys against index.html
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Only ids inside the A array (CATEGORIES also uses {id:"..."} so scope the scan)
const aBlock = html.match(/const A = \[([\s\S]*?)\n\];/);
if (!aBlock) { console.error('A array not found'); process.exit(1); }
// [a-zA-Z0-9-] (not [a-z0-9-]): ids may hold uppercase, e.g. "slSlaughters"
const ids = [...aBlock[1].matchAll(/\{id:"([a-zA-Z0-9-]+)"/g)].map(m => m[1]);
const idSet = new Set(ids);
if (idSet.size !== ids.length) {
  console.error('Duplicate ids:', ids.filter((x, i) => ids.indexOf(x) !== i));
  process.exit(1);
}

const defM = html.match(/const DEFAULT_ITIN = \{([\s\S]*?)\n\};/);
if (!defM) { console.error('DEFAULT_ITIN not found'); process.exit(1); }
for (const m of defM[1].matchAll(/"([a-zA-Z0-9-]+)"/g)) {
  if (!idSet.has(m[1])) { console.error('DEFAULT_ITIN missing id:', m[1]); process.exit(1); }
}

const ttM = html.match(/const TRAVEL_TIMES = \{([\s\S]*?)\n\};/);
if (!ttM) { console.error('TRAVEL_TIMES not found'); process.exit(1); }
for (const m of ttM[1].matchAll(/"([a-zA-Z0-9-]+)\|([a-zA-Z0-9-]+)"/g)) {
  if (!idSet.has(m[1])) { console.error('TRAVEL_TIMES unknown left id:', m[1]); process.exit(1); }
  if (!idSet.has(m[2])) { console.error('TRAVEL_TIMES unknown right id:', m[2]); process.exit(1); }
}

const rsM = html.match(/const RAIN_SWAPS = \{([\s\S]*?)\n\};/);
if (rsM) {
  for (const m of rsM[1].matchAll(/"([a-zA-Z0-9-]+)"/g)) {
    if (!idSet.has(m[1])) { console.error('RAIN_SWAPS missing id:', m[1]); process.exit(1); }
  }
}

for (const m of html.matchAll(/itin:\{([\s\S]*?)\}\}/g)) {
  for (const s of m[1].matchAll(/"([a-zA-Z0-9-]+)"/g)) {
    if (!idSet.has(s[1])) { console.error('PRESETS missing id:', s[1]); process.exit(1); }
  }
}

console.log(`OK — ${ids.length} places, all refs resolve`);
