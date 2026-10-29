import { chainage } from '../models/road.js';
// Longitudinal profile: elevation (Z) against chainage along the plan view. Straight lines between control points; no vertical curves.
export function drawProfile(cv, pts) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, m = { l: 40, r: 8, t: 8, b: 18 };
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, W, H);
  const c = chainage(pts), L = c.at(-1) || 1; let lo = Math.min(...pts.map(p => p.z)), hi = Math.max(...pts.map(p => p.z));
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const X = s => m.l + s / L * (W - m.l - m.r), Y = z => H - m.b - (z - lo) / (hi - lo) * (H - m.t - m.b);
  g.strokeStyle = '#26344f'; g.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
  g.fillStyle = '#8a99b3'; g.font = '10px sans-serif'; g.textAlign = 'right'; g.fillText(hi.toFixed(1) + ' m', m.l - 3, m.t + 8); g.fillText(lo.toFixed(1) + ' m', m.l - 3, H - m.b);
  g.textAlign = 'left'; g.fillText('0', m.l, H - 4); g.textAlign = 'right'; g.fillText(L.toFixed(0) + ' m', W - m.r, H - 4);
  g.strokeStyle = '#d4a64a'; g.lineWidth = 2; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(c[i]), Y(p.z)) : g.moveTo(X(c[i]), Y(p.z))); g.stroke();
  g.fillStyle = '#10b981'; pts.forEach((p, i) => { g.beginPath(); g.arc(X(c[i]), Y(p.z), 3, 0, 7); g.fill(); });
}
