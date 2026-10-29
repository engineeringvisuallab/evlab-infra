// Preliminary road model: centerline control points (x, y, z = top-of-road elevation) plus width/thickness.
import { N, checkSchema } from './schema.js';
export const MATERIALS = ['Asphalt', 'Concrete', 'Gravel', 'Earth'];
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('width', 'Road width (m)', 0.5, 100), N('thickness', 'Thickness (m)', 0.01, 5),
  { k: 'material', l: 'Material', t: 'select', opts: MATERIALS }, { k: 'color', l: 'Color', t: 'color' }];
export const createRoad = (id, points) => ({ id, name: 'Road', category: 'roads', type: 'road', width: 7, thickness: 0.3, material: 'Asphalt', color: '#475569', points });
export function validate(o) {
  const e = checkSchema(schema, o);
  if (!Array.isArray(o.points) || o.points.length < 2) e.push('Road needs at least 2 control points');
  else o.points.forEach((p, i) => { for (const k of 'xyz') if (!p || !Number.isFinite(p[k]) || Math.abs(p[k]) > (k === 'z' ? 1e4 : 1e6)) e.push(`Point ${i + 1}: ${k.toUpperCase()} is invalid`); });
  return e;
}
export function chainage(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return c; }
export function roadStats(pts) {
  let len3d = 0, maxGradePct = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y), dz = pts[i].z - pts[i - 1].z;
    len3d += Math.hypot(d, dz); if (d > 1e-9) maxGradePct = Math.max(maxGradePct, Math.abs(dz) / d * 100);
  }
  return { plan: chainage(pts).at(-1), len3d, maxGradePct };
}
export const fmtStation = s => { const r = Math.round(s); return `${Math.floor(r / 1000)}+${String(r % 1000).padStart(3, '0')}`; };
