// Contour lines from the terrain TIN (marching triangles). Output: flat list of [x1, y1, x2, y2, k] with level = k * interval.
import { terrainMesh } from './terrain.js';
export const MAX_LEVELS = 400;
export function contourSegments(o, interval) {
  const { idx, stats } = terrainMesh(o), P = o.points, segs = [];
  if (!(interval > 0)) return { segs, levels: 0, tooMany: false };
  const levels = Math.floor(stats.maxZ / interval) - Math.ceil(stats.minZ / interval) + 1; if (levels > MAX_LEVELS) return { segs, levels, tooMany: true };
  for (let t = 0; t < idx.length; t += 3) {
    const V = [P[idx[t]], P[idx[t + 1]], P[idx[t + 2]]], lo = Math.min(V[0].z, V[1].z, V[2].z), hi = Math.max(V[0].z, V[1].z, V[2].z);
    for (let k = Math.ceil(lo / interval); k * interval <= hi; k++) {
      const L = k * interval, pts = [];
      for (let e = 0; e < 3; e++) { const a = V[e], b = V[(e + 1) % 3]; if ((a.z < L) !== (b.z < L)) { const u = (L - a.z) / (b.z - a.z); pts.push(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u); } }
      if (pts.length === 4) segs.push([pts[0], pts[1], pts[2], pts[3], k]);
    }
  }
  return { segs, levels, tooMany: false };
}
