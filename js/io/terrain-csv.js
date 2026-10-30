// Terrain points from CSV: columns x, y, z (header optional). 'local' = project metres; 'geographic' = lon/lat converted around the project origin.
import { parseCsv } from './csv-io.js';
import { fromGeo, checkOrigin } from '../core/coordinates.js';
import { MAX_POINTS } from '../models/terrain.js';
const NAMES = { x: ['x', 'xm', 'easting', 'e', 'lon', 'longitude'], y: ['y', 'ym', 'northing', 'n', 'lat', 'latitude'], z: ['z', 'zm', 'elevation', 'elev', 'height', 'h'] };
export function parseTerrainCsv(text, { mode, origin, k = 1 }) { // k = metres per input unit (0.3048 when the file is in feet)
  const rows = parseCsv(text); if (!rows.length) throw new Error('The CSV file is empty.');
  let cols = [0, 1, 2], start = 0, names = null; const num = s => (s ?? '').trim() === '' ? NaN : Number(s);
  if (rows[0].some(c => c.trim() !== '' && !Number.isFinite(Number(c)))) {
    names = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z]/g, '')); cols = ['x', 'y', 'z'].map(k => names.findIndex(h => NAMES[k].includes(h)));
    if (cols.some(i => i < 0)) throw new Error('The header must name x, y and z columns (for example x,y,z or easting,northing,elevation).'); start = 1;
  }
  if (mode === 'geographic') checkOrigin(origin);
  const points = [], skipped = [], warnings = [];
  rows.slice(start).forEach((r, i) => {
    const row = i + start + 1, v = cols.map(c => num(r[c])); if (!v.every(Number.isFinite)) { skipped.push(`Row ${row}: x, y and z must all be numbers`); return; }
    if (mode === 'geographic') { if (Math.abs(v[0]) > 180 || Math.abs(v[1]) > 90) { skipped.push(`Row ${row}: longitude/latitude out of range`); return; }
      const [x, y] = fromGeo(v[0], v[1], origin); points.push({ x: +x.toFixed(3), y: +y.toFixed(3), z: +(v[2] * k).toFixed(6) }); } else points.push({ x: +(v[0] * k).toFixed(6), y: +(v[1] * k).toFixed(6), z: +(v[2] * k).toFixed(6) });
  });
  if (points.length > MAX_POINTS) throw new Error(`Too many points (${points.length}). The limit is ${MAX_POINTS}; thin the data first.`);
  if (points.length < 3) throw new Error('Need at least 3 valid points.');
  if (mode === 'local' && names && names.some(h => h.startsWith('lon') || h.startsWith('lat'))) warnings.push('Column names look like longitude/latitude, but local mode is selected: values were used as metres.');
  return { points, skipped, warnings };
}
