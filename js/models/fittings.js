// Pipe fittings DERIVED from the network geometry (nothing is stored): bends, tees, crosses, dead ends and reducers at Junction nodes.
// Angles are the 3D deflection between the two pipes. Standard bend sizes are matched within 2.5 degrees; this is a preliminary take-off, not a fitting schedule.
import { nodeZ } from './pipe.js';
export const STD_ANGLES = [11.25, 22.5, 45, 90];
function arms(project, node) {
  const out = [];
  for (const p of project.objects) {
    if (p.type !== 'pipe') continue; const other = p.fromId === node.id ? project.get(p.toId) : p.toId === node.id ? project.get(p.fromId) : null; if (!other) continue;
    const v = { x: other.x - node.x, y: other.y - node.y, z: nodeZ(other) - nodeZ(node) }, len = Math.hypot(v.x, v.y, v.z); if (len < 1e-9) continue;
    out.push({ pipe: p, len, u: { x: v.x / len, y: v.y / len, z: v.z / len } });
  }
  return out;
}
const deflection = (a, b) => 180 - Math.acos(Math.max(-1, Math.min(1, a.u.x * b.u.x + a.u.y * b.u.y + a.u.z * b.u.z))) * 180 / Math.PI;
export const maxPipeRadius = (project, node) => Math.max(0, ...arms(project, node).map(a => a.pipe.diameter / 2000));
export function fittingAt(project, node) {
  if (!node || node.type !== 'node' || node.nodeType !== 'Junction') return null;
  const d = arms(project, node), n = d.length; if (!n) return null;
  const dia = [...new Set(d.map(x => x.pipe.diameter))].sort((a, b) => b - a), base = { nodeId: node.id, pipes: d.map(x => x.pipe.id), diameters: dia, diameter: dia[0], reducing: dia.length > 1 };
  if (n === 1) return { ...base, kind: 'Dead end', label: 'Dead end (cap)' };
  if (n === 2) {
    const a = deflection(d[0], d[1]); if (a < 1 && dia.length === 1) return null; // straight joint, no fitting
    if (a < 1) return { ...base, kind: 'Reducer', label: 'Reducer' };
    const s = STD_ANGLES.reduce((b, c) => Math.abs(c - a) < Math.abs(b - a) ? c : b), std = Math.abs(s - a) <= 2.5 ? s : null;
    return { ...base, kind: 'Bend', angleDeg: a, standard: std, label: (std ? `${std}° bend` : `${a.toFixed(1)}° bend (non-standard)`) + (dia.length > 1 ? ' + reducer' : '') };
  }
  const kind = n === 3 ? 'Tee' : n === 4 ? 'Cross' : 'Manifold'; return { ...base, kind, label: kind + (dia.length > 1 ? ' (reducing)' : '') };
}
export const allFittings = project => project.objects.filter(o => o.type === 'node').map(n => fittingAt(project, n)).filter(Boolean);
// If allowable bend radii are entered on the pipes, check that the bend fits: the arc needs tangent length R*tan(angle/2) on each side, and a pipe can give at most half its length to each end.
export function bendRadiusProblem(project, node) {
  const d = arms(project, node); if (d.length !== 2) return null; const R = Math.max(d[0].pipe.minBendRadius || 0, d[1].pipe.minBendRadius || 0); if (!(R > 0)) return null;
  const a = deflection(d[0], d[1]); if (a < 1) return null; const T = R * Math.tan(a * Math.PI / 360), room = Math.min(d[0].len, d[1].len) / 2;
  return T > room ? { R, T, room, angleDeg: a } : null;
}
