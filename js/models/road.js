// Preliminary road model: centerline control points (x, y, z = top-of-road elevation) plus width/thickness.
import { N, checkSchema } from './schema.js';
import { alignment } from './alignment.js';
export const MATERIALS = ['Asphalt', 'Concrete', 'Gravel', 'Earth'];
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('width', 'Road width (m)', 0.5, 100), N('thickness', 'Thickness (m)', 0.01, 5),
  { k: 'material', l: 'Material', t: 'select', opts: MATERIALS }, { k: 'color', l: 'Color', t: 'color' }];
export const createRoad = (id, points) => ({ id, name: 'Road', category: 'roads', type: 'road', width: 7, thickness: 0.3, material: 'Asphalt', color: '#475569', points });
export function validate(o) { return [...checkSchema(schema, o), ...checkPoints(o)]; }
export function checkPoints(o) {
  const e = [];
  if (!Array.isArray(o.points) || o.points.length < 2) e.push('Road needs at least 2 control points');
  else o.points.forEach((p, i) => { if (p && p.r != null && (!Number.isFinite(p.r) || p.r < 1 || p.r > 1e5)) e.push(`Point ${i + 1}: curve radius must be between 1 and 100000 m`); for (const k of 'xyz') if (!p || !Number.isFinite(p[k]) || Math.abs(p[k]) > (k === 'z' ? 1e4 : 1e6)) e.push(`Point ${i + 1}: ${k.toUpperCase()} is invalid`); });
  return e;
}
export function chainage(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return c; }
export function roadStats(control) {
  const pts = alignment(control).pts; let len3d = 0, maxGradePct = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y), dz = pts[i].z - pts[i - 1].z;
    len3d += Math.hypot(d, dz); if (d > 1e-9) maxGradePct = Math.max(maxGradePct, Math.abs(dz) / d * 100);
  }
  return { plan: chainage(pts).at(-1), len3d, maxGradePct };
}
export const fmtStation = s => { const r = Math.round(s); return `${Math.floor(r / 1000)}+${String(r % 1000).padStart(3, '0')}`; };
// Plan-view edge offsets (average-tangent method; no mitering). Used by DXF export.
export function roadEdges(pts, width) {
  const hw = width / 2, n = pts.length, left = [], right = [];
  pts.forEach((p, i) => { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * hw, ny = dx / l * hw;
    left.push([p.x + nx, p.y + ny]); right.push([p.x - nx, p.y - ny]); });
  return { left, right };
}
// Insert a control point on the segment nearest to (x, y), without changing the road's shape. Returns null if too close to an existing point.
export function insertPoint(pts, x, y) {
  let best = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy; if (l2 < 1e-12) continue;
    const t = Math.min(Math.max(((x - a.x) * dx + (y - a.y) * dy) / l2, 0), 1), qx = a.x + dx * t, qy = a.y + dy * t, d = Math.hypot(x - qx, y - qy);
    if (!best || d < best.d) best = { d, i, t, qx, qy };
  }
  if (!best || best.t < 1e-6 || best.t > 1 - 1e-6) return null;
  const a = pts[best.i], b = pts[best.i + 1], p = { x: +best.qx.toFixed(3), y: +best.qy.toFixed(3), z: +(a.z + (b.z - a.z) * best.t).toFixed(3) };
  return { index: best.i + 1, points: [...pts.slice(0, best.i + 1), p, ...pts.slice(best.i + 1)] };
}
