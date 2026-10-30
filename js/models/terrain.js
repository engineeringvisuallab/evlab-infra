// Terrain = triangulated irregular network (TIN) through user-supplied x, y, z points, with linear interpolation.
// Accuracy depends entirely on the input data. No breaklines, no raster DEM, not survey-grade.
import { checkSchema } from './schema.js';
export const MAX_POINTS = 5000;
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, { k: 'source', l: 'Data source / assumptions', t: 'textarea', nullable: true }];
export const createTerrain = (id, points) => ({ id, name: 'Terrain', category: 'terrain', type: 'terrain', source: '', points });
// Bowyer-Watson Delaunay triangulation. Returns triangle index triples (counter-clockwise) into pts and the number of duplicate points skipped.
export function triangulate(pts) {
  const n = pts.length; if (n < 3) return { idx: [], dupes: 0 };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const d = Math.max(x1 - x0, y1 - y0) || 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = [], map = [], seen = new Set(); let dupes = 0;
  pts.forEach((p, i) => { const x = (p.x - mx) / d, y = (p.y - my) / d, k = Math.round(x * 1e9) + ',' + Math.round(y * 1e9); if (seen.has(k)) { dupes++; return; } seen.add(k); P.push([x, y]); map.push(i); });
  const m = P.length; if (m < 3) return { idx: [], dupes };
  P.push([-1e3, -1e3], [1e3, -1e3], [0, 1e3]);
  const circ = (a, b, c) => {
    const A = P[a], B = P[b], C = P[c], dd = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])); if (Math.abs(dd) < 1e-30) return null;
    const a2 = A[0] * A[0] + A[1] * A[1], b2 = B[0] * B[0] + B[1] * B[1], c2 = C[0] * C[0] + C[1] * C[1];
    const x = (a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / dd, y = (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / dd;
    return { a, b, c, x, y, r2: (A[0] - x) ** 2 + (A[1] - y) ** 2 };
  };
  let T = [circ(m, m + 1, m + 2)];
  for (let i = 0; i < m; i++) {
    const [px, py] = P[i], keep = [], edges = new Map();
    for (const t of T) {
      if ((px - t.x) ** 2 + (py - t.y) ** 2 < t.r2 * (1 - 1e-10)) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) { const k = u < v ? u + '_' + v : v + '_' + u, e = edges.get(k); if (e) e.n++; else edges.set(k, { u, v, n: 1 }); }
      else keep.push(t);
    }
    T = keep; for (const e of edges.values()) if (e.n === 1) { const t = circ(e.u, e.v, i); if (t) T.push(t); }
  }
  const idx = [];
  for (const t of T) {
    if (t.a >= m || t.b >= m || t.c >= m) continue;
    let [a, b, c] = [map[t.a], map[t.b], map[t.c]]; const cr = (pts[b].x - pts[a].x) * (pts[c].y - pts[a].y) - (pts[b].y - pts[a].y) * (pts[c].x - pts[a].x);
    if (Math.abs(cr) < 1e-10 * d * d) continue; if (cr < 0) [b, c] = [c, b]; idx.push(a, b, c);
  }
  return { idx, dupes };
}
const cache = new WeakMap();
export function terrainMesh(o) {
  let r = cache.get(o.points);
  if (!r) {
    const { idx, dupes } = triangulate(o.points); let area = 0, minZ = Infinity, maxZ = -Infinity; const P = o.points;
    for (let i = 0; i < idx.length; i += 3) { const a = P[idx[i]], b = P[idx[i + 1]], c = P[idx[i + 2]]; area += ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2; }
    for (const p of P) { minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    r = { idx, dupes, stats: { triangles: idx.length / 3, area, minZ, maxZ } }; cache.set(o.points, r);
  }
  return r;
}
// Elevation at (x, y), or null when outside the triangulated area.
export function elevationAt(o, x, y) {
  const P = o.points, { idx } = terrainMesh(o);
  for (let i = 0; i < idx.length; i += 3) {
    const a = P[idx[i]], b = P[idx[i + 1]], c = P[idx[i + 2]], den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    const l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / den, l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / den, l3 = 1 - l1 - l2, e = -1e-9;
    if (l1 >= e && l2 >= e && l3 >= e) return l1 * a.z + l2 * b.z + l3 * c.z;
  }
  return null;
}
export function validate(o) {
  const e = checkSchema(schema, o);
  if (!Array.isArray(o.points) || o.points.length < 3) { e.push('Terrain needs at least 3 points'); return e; }
  if (o.points.length > MAX_POINTS) { e.push(`Terrain has ${o.points.length} points; the limit is ${MAX_POINTS}`); return e; }
  o.points.forEach((p, i) => { for (const k of 'xyz') if (!p || !Number.isFinite(p[k]) || Math.abs(p[k]) > (k === 'z' ? 1e4 : 1e6)) e.push(`Point ${i + 1}: ${k.toUpperCase()} is invalid`); });
  if (!e.length && !terrainMesh(o).idx.length) e.push('Points are collinear or duplicated: they must spread in two directions');
  return e;
}
