import { TYPES } from '../models/registry.js';
import { checkValue } from '../models/schema.js';
import { roadStats } from '../models/road.js';
import { pipeLength, nodeZ } from '../models/pipe.js';
export const esc = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export const toCsv = rows => rows.map(r => r.map(esc).join(',')).join('\r\n') + '\r\n';
export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, ''); const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"' && cell === '') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
    else cell += c;
  }
  if (q) throw new Error('CSV has an unterminated quoted field');
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}
export const HEADERS = ['id', 'type', 'subtype', 'category', 'name', 'x_m', 'y_m', 'z_m', 'length_m', 'width_m', 'diameter_mm', 'material', 'asset_id', 'ground_level_m', 'invert_level_m'];
export function inventoryRows(project) {
  const r3 = v => v == null || v === '' ? '' : +Number(v).toFixed(3), rows = [HEADERS];
  for (const o of project.objects) {
    let x = '', y = '', z = '', len = '', w = '', d = '', sub = '';
    if (o.type === 'terrain') sub = o.points.length + ' points';
    else if (o.points) { ({ x, y, z } = o.points[0]); len = roadStats(o.points).plan; w = o.width; }
    else if (o.type === 'pipe') { const a = project.get(o.fromId), L = pipeLength(o, project); if (a) { x = a.x; y = a.y; z = nodeZ(a); } len = L ? L.len3d : ''; d = o.diameter; }
    else if (o.type === 'node') { x = o.x; y = o.y; z = o.invert ?? o.groundLevel ?? ''; sub = o.nodeType; }
    else { x = o.x; y = o.y; z = o.z; len = o.length; w = o.type === 'culvert' ? o.barrels * o.barrelWidth + (o.barrels + 1) * o.wallThickness : o.width; }
    rows.push([o.id, o.type, sub, o.category, o.name, r3(x), r3(y), r3(z), r3(len), r3(w), d, o.material ?? '', o.assetId ?? '', o.groundLevel ?? '', o.invert ?? '']);
  }
  return rows;
}
// CSV import updates attributes of EXISTING objects matched by id. Blank cells are left unchanged. Nothing is applied here (pure).
const COLS = { name: 'name', material: 'material', asset_id: 'assetId', diameter_mm: 'diameter', ground_level_m: 'groundLevel', invert_level_m: 'invert' };
export function importAssets(project, text) {
  const rows = parseCsv(text); if (rows.length < 2) throw new Error('CSV has no data rows');
  const head = rows[0].map(h => h.trim().toLowerCase()), ci = head.indexOf('id'); if (ci < 0) throw new Error('CSV needs an "id" column');
  const editable = head.map((h, i) => COLS[h] ? [h, i] : null).filter(Boolean);
  const unknownCols = head.filter(h => h && h !== 'id' && !COLS[h] && !HEADERS.includes(h));
  const patches = new Map(), errors = [], ignored = [];
  rows.slice(1).forEach((r, ri) => {
    const n = ri + 2, id = (r[ci] || '').trim(), o = project.get(id); if (!o) { errors.push(`Row ${n}: unknown ID "${id}"`); return; }
    const schema = TYPES[o.type].schema, patch = {};
    for (const [h, i] of editable) {
      const raw = (r[i] ?? '').trim(); if (raw === '') continue;
      const key = COLS[h], f = schema.find(f => f.k === key); if (!f) { ignored.push(`Row ${n}: column ${h} does not apply to ${o.type} ${id}`); continue; }
      const v = f.t === 'number' ? Number(raw) : raw, err = checkValue(f, v); if (err) { errors.push(`Row ${n} (${id}): ${err}`); continue; }
      if (v !== o[key]) patch[key] = v;
    }
    if (Object.keys(patch).length) patches.set(id, { ...(patches.get(id) || {}), ...patch });
  });
  return { patches: [...patches].map(([id, patch]) => ({ id, patch })), errors, ignored, unknownCols };
}
