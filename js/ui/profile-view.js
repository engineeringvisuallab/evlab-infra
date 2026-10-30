import { chainage } from '../models/road.js';
const COL = { bg: '#0b1220', frame: '#26344f', txt: '#8a99b3', gold: '#d4a64a', em: '#10b981', ground: '#4ade80', road: '#64748b' };
function frame(cv, x0, x1, lo, hi, m, du = { k: 1, unit: 'm' }) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.fillStyle = COL.bg; g.fillRect(0, 0, W, H); g.strokeStyle = COL.frame; g.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
  g.fillStyle = COL.txt; g.font = '10px sans-serif'; g.textAlign = 'right'; g.fillText((hi * du.k).toFixed(1) + ' ' + du.unit, m.l - 3, m.t + 8); g.fillText((lo * du.k).toFixed(1) + ' ' + du.unit, m.l - 3, H - m.b);
  return { g, X: s => m.l + (s - x0) / (x1 - x0) * (W - m.l - m.r), Y: z => H - m.b - (z - lo) / (hi - lo) * (H - m.t - m.b), W, H };
}
const line = (g, pts, X, Y, color, dash) => { g.strokeStyle = color; g.lineWidth = 1.5; g.setLineDash(dash || []); let pen = false; g.beginPath(); for (const p of pts) { if (p.z == null) { pen = false; continue; } pen ? g.lineTo(X(p.s), Y(p.z)) : g.moveTo(X(p.s), Y(p.z)); pen = true; } g.stroke(); g.setLineDash([]); };
// Longitudinal profile: elevation (Z) against chainage along the plan alignment; optional ground line from terrain. Straight lines between points; no vertical curves.
export function drawProfile(cv, pts, ground, du = { k: 1, unit: 'm' }) {
  const m = { l: 40, r: 8, t: 8, b: 18 }, c = chainage(pts), L = c.at(-1) || 1, zs = pts.map(p => p.z).concat((ground || []).filter(q => q.z != null).map(q => q.z));
  let lo = Math.min(...zs), hi = Math.max(...zs); if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const { g, X, Y, W, H } = frame(cv, 0, L, lo, hi, m, du); g.fillStyle = COL.txt; g.textAlign = 'left'; g.fillText('0', m.l, H - 4); g.textAlign = 'right'; g.fillText((L * du.k).toFixed(0) + ' ' + du.unit, W - m.r, H - 4);
  if (ground) line(g, ground, X, Y, COL.ground, [4, 3]);
  line(g, pts.map((p, i) => ({ s: c[i], z: p.z })), X, Y, COL.gold);
}
// Cross-section at one station: road slab (flat top) and ground across the road, offsets positive to the left.
export function drawSection(cv, sec, du = { k: 1, unit: 'm' }) {
  const m = { l: 40, r: 8, t: 8, b: 18 }, zs = [sec.z, sec.z - sec.thickness].concat(sec.ground.filter(p => p.z != null).map(p => p.z));
  let lo = Math.min(...zs) - 0.5, hi = Math.max(...zs) + 0.5; if (hi - lo < 2) { lo -= 1; hi += 1; }
  const { g, X, Y, W, H } = frame(cv, -sec.half, sec.half, lo, hi, m, du);
  g.fillStyle = COL.txt; g.textAlign = 'left'; g.fillText('R', m.l, H - 4); g.textAlign = 'right'; g.fillText('L  ±' + (sec.half * du.k).toFixed(0) + ' ' + du.unit, W - m.r, H - 4);
  line(g, sec.ground.map(p => ({ s: p.off, z: p.z })), X, Y, COL.ground);
  g.fillStyle = COL.road; g.fillRect(X(-sec.width / 2), Y(sec.z), X(sec.width / 2) - X(-sec.width / 2), Y(sec.z - sec.thickness) - Y(sec.z));
  g.strokeStyle = COL.em; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(0), Y(hi)); g.lineTo(X(0), Y(lo)); g.stroke(); g.setLineDash([]);
}
