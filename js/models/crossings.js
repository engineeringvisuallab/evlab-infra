// Plan-view crossing finder. Results are POTENTIAL interactions to verify, never confirmed clashes.
import { nodeZ } from './pipe.js';
export const CHECKLIST = [
  ['survey', 'Watercourse and ground survey data obtained and checked'], ['utility', 'Utility owners consulted about crossing arrangements'],
  ['clearance', 'Clearance requirements confirmed with the relevant authority'], ['hydraulic', 'Hydraulic capacity and flood levels assessed by a qualified engineer'],
  ['scour', 'Scour and bank protection considered'], ['structural', 'Structural design by a qualified engineer (the concept is not structural design)'],
  ['permits', 'Permits and environmental requirements checked'], ['assumptions', 'Project assumptions recorded and reviewed']];
function segInt(p1, p2, p3, p4) {
  const rx = p2.x - p1.x, ry = p2.y - p1.y, sx = p4.x - p3.x, sy = p4.y - p3.y, d = rx * sy - ry * sx; if (Math.abs(d) < 1e-12) return null;
  const t = ((p3.x - p1.x) * sy - (p3.y - p1.y) * sx) / d, u = ((p3.x - p1.x) * ry - (p3.y - p1.y) * rx) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u } : null;
}
export function findCrossings(project) {
  const out = [], min = project.meta.crossing ? project.meta.crossing.minClearance : null, all = project.objects, of = t => all.filter(o => o.type === t);
  const lines = [...of('road'), ...of('watercourse')], structs = [...of('bridge'), ...of('culvert')];
  for (const p of of('pipe')) {
    const a = project.get(p.fromId), b = project.get(p.toId); if (!a || !b) continue;
    const incomplete = [a, b].some(n => n.invert == null && n.groundLevel == null);
    for (const o of lines) for (let i = 0; i < o.points.length - 1; i++) {
      const h = segInt(a, b, o.points[i], o.points[i + 1]); if (!h) continue;
      const pz = nodeZ(a) + (nodeZ(b) - nodeZ(a)) * h.t, crown = pz + p.diameter / 1000;
      const oz = o.points[i].z + (o.points[i + 1].z - o.points[i].z) * h.u, ref = o.type === 'road' ? oz - o.thickness : oz, gap = ref - crown;
      let status;
      if (incomplete) status = 'Pipe levels not set: vertical separation cannot be assessed';
      else if (gap < 0) status = 'Elevation ranges overlap: potential conflict, verify with survey data';
      else if (min == null) status = 'No clearance requirement entered';
      else status = gap < min ? 'Below the entered clearance requirement' : 'Meets the entered clearance (geometric check only)';
      out.push({ kind: o.type === 'road' ? 'pipe × road' : 'pipe × watercourse', a: p.id, b: o.id, x: a.x + (b.x - a.x) * h.t, y: a.y + (b.y - a.y) * h.t, gap: incomplete ? null : gap, status });
    }
  }
  for (const r of of('road')) for (const w of of('watercourse'))
    for (let i = 0; i < r.points.length - 1; i++) for (let j = 0; j < w.points.length - 1; j++) {
      const h = segInt(r.points[i], r.points[i + 1], w.points[j], w.points[j + 1]); if (!h) continue;
      const x = r.points[i].x + (r.points[i + 1].x - r.points[i].x) * h.t, y = r.points[i].y + (r.points[i + 1].y - r.points[i].y) * h.t;
      const s = structs.find(s => Math.hypot(s.x - x, s.y - y) <= 25);
      out.push({ kind: 'road × watercourse', a: r.id, b: w.id, x, y, gap: null, status: s ? `${s.type} ${s.id} recorded nearby` : 'No bridge or culvert recorded nearby' });
    }
  return out;
}
