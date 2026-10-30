// Preliminary horizontal alignment: straight lines joined by circular arcs (fillets). A control point may carry an optional radius r (m).
// No spirals, no superelevation, no design standards. The arc is replaced by a polyline (2 degree steps) for drawing, lengths and chainage.
export function alignment(P, stepDeg = 2) {
  const n = P.length, curves = [];
  if (n < 3) return { pts: P.map(p => ({ x: p.x, y: p.y, z: p.z })), curves };
  const seg = []; for (let i = 0; i < n - 1; i++) { const dx = P[i + 1].x - P[i].x, dy = P[i + 1].y - P[i].y, len = Math.hypot(dx, dy); seg.push({ len, ux: dx / (len || 1), uy: dy / (len || 1) }); }
  const T = new Array(n).fill(0), info = new Array(n).fill(null);
  for (let i = 1; i < n - 1; i++) {
    const r = P[i].r; if (!(r > 0)) continue; const a = seg[i - 1], b = seg[i]; if (a.len < 1e-9 || b.len < 1e-9) continue;
    const cross = a.ux * b.uy - a.uy * b.ux, delta = Math.atan2(Math.abs(cross), a.ux * b.ux + a.uy * b.uy);
    if (delta < 0.5 * Math.PI / 180 || delta > Math.PI - 1e-3) continue; // almost straight, or a full reversal
    info[i] = { r, delta, sign: Math.sign(cross) }; T[i] = r * Math.tan(delta / 2);
  }
  for (let i = 0; i < n - 1; i++) { const need = T[i] + T[i + 1], room = seg[i].len * (1 - 1e-9); if (need > room) { const k = room / need; T[i] *= k; T[i + 1] *= k; } } // tangents must fit the segments
  const out = [{ x: P[0].x, y: P[0].y, z: P[0].z }];
  for (let i = 1; i < n - 1; i++) {
    if (!info[i] || T[i] <= 1e-9) { out.push({ x: P[i].x, y: P[i].y, z: P[i].z }); continue; }
    const a = seg[i - 1], b = seg[i], t = T[i], { delta: d, sign: s } = info[i], r = t / Math.tan(d / 2);
    const z1 = P[i].z - (P[i].z - P[i - 1].z) * t / a.len, z2 = P[i].z + (P[i + 1].z - P[i].z) * t / b.len;
    const x1 = P[i].x - a.ux * t, y1 = P[i].y - a.uy * t, cx = x1 - a.uy * s * r, cy = y1 + a.ux * s * r, a0 = Math.atan2(y1 - cy, x1 - cx);
    const steps = Math.max(2, Math.ceil(d / (stepDeg * Math.PI / 180)));
    for (let k = 0; k <= steps; k++) { const ang = a0 + s * d * k / steps; out.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), z: z1 + (z2 - z1) * k / steps }); }
    curves.push({ index: i, requested: info[i].r, radius: r, clamped: r < info[i].r * (1 - 1e-6), deltaDeg: d * 180 / Math.PI, tangent: t, length: r * d });
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y, z: P[n - 1].z });
  return { pts: out, curves };
}
