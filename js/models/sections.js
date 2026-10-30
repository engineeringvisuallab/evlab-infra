// Longitudinal ground line and cross-sections along a road, from terrain when present. Flat cross-fall; no side slopes, superelevation or earthwork volumes.
import { chainage } from './road.js';
import { elevationAt } from './terrain.js';
export function atStation(P, s) {
  const c = chainage(P), L = c[c.length - 1]; s = Math.min(Math.max(s, 0), L); let i = 0; while (i < P.length - 2 && c[i + 1] < s) i++;
  const a = P[i], b = P[i + 1], len = c[i + 1] - c[i] || 1, f = (s - c[i]) / len, dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  return { x: a.x + dx * f, y: a.y + dy * f, z: a.z + (b.z - a.z) * f, ux: dx / l, uy: dy / l };
}
const ground = (terrains, x, y) => { for (const t of terrains) { const z = elevationAt(t, x, y); if (z != null) return z; } return null; };
export function groundProfile(P, terrains, n = 80) {
  if (!terrains.length) return null; const L = chainage(P).at(-1), out = [];
  for (let k = 0; k <= n; k++) { const s = L * k / n, p = atStation(P, s); out.push({ s, z: ground(terrains, p.x, p.y) }); }
  return out.some(g => g.z != null) ? out : null;
}
export function crossSection(P, road, s, terrains) {
  const p = atStation(P, s), half = Math.max(road.width * 2, 12), pts = [];
  for (let k = -20; k <= 20; k++) { const off = half * k / 20; pts.push({ off, z: terrains.length ? ground(terrains, p.x - p.uy * off, p.y + p.ux * off) : null }); } // positive offset = left of travel direction
  return { station: s, z: p.z, width: road.width, thickness: road.thickness, half, ground: pts, groundCL: terrains.length ? ground(terrains, p.x, p.y) : null };
}
