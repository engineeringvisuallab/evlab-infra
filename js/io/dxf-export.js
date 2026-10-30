// Plan-view (2D) ASCII DXF, R12 style: LINE and CIRCLE entities, Z written as 0. NOT DWG. Elevations are not exported.
import { terrainMesh } from '../models/terrain.js';
import { alignment } from '../models/alignment.js';
import { roadEdges } from '../models/road.js';
const LAYERS = { ROAD_CENTERLINE: 2, ROAD_EDGE: 7, WATERCOURSE: 5, PIPE: 4, NODE: 3, BRIDGE: 6, CULVERT: 8, BLOCK: 1, TERRAIN_TIN: 9 };
export function toDxf(project) {
  const e = [], counts = {}, skipped = [], f = v => (+v).toFixed(6);
  const line = (l, a, b) => { counts[l] = (counts[l] || 0) + 1; e.push('0', 'LINE', '8', l, '10', f(a[0]), '20', f(a[1]), '30', '0', '11', f(b[0]), '21', f(b[1]), '31', '0'); };
  const poly = (l, pts) => { for (let i = 0; i < pts.length - 1; i++) line(l, pts[i], pts[i + 1]); };
  const rect = (l, o, len, wid) => { const a = o.rotation * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const P = [[-len / 2, -wid / 2], [len / 2, -wid / 2], [len / 2, wid / 2], [-len / 2, wid / 2]].map(([x, y]) => [o.x + x * c - y * s, o.y + x * s + y * c]); poly(l, [...P, P[0]]); };
  for (const o of project.objects) {
    if (o.type === 'road') { const dn = alignment(o.points).pts; poly('ROAD_CENTERLINE', dn.map(p => [p.x, p.y])); const ed = roadEdges(dn, o.width); poly('ROAD_EDGE', ed.left); poly('ROAD_EDGE', ed.right); }
    else if (o.type === 'watercourse') poly('WATERCOURSE', alignment(o.points).pts.map(p => [p.x, p.y]));
    else if (o.type === 'pipe') { const a = project.get(o.fromId), b = project.get(o.toId); if (!a || !b) skipped.push(`${o.id}: connected node missing`); else line('PIPE', [a.x, a.y], [b.x, b.y]); }
    else if (o.type === 'node') { counts.NODE = (counts.NODE || 0) + 1; e.push('0', 'CIRCLE', '8', 'NODE', '10', f(o.x), '20', f(o.y), '30', '0', '40', '0.6'); }
    else if (o.type === 'bridge') rect('BRIDGE', o, o.length, o.width);
    else if (o.type === 'culvert') rect('CULVERT', o, o.length, o.barrels * o.barrelWidth + (o.barrels + 1) * o.wallThickness);
    else if (o.type === 'terrain') { const { idx } = terrainMesh(o), seen = new Set(), edge = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (seen.has(k)) return; seen.add(k); line('TERRAIN_TIN', [o.points[a].x, o.points[a].y], [o.points[b].x, o.points[b].y]); };
      for (let i = 0; i < idx.length; i += 3) { edge(idx[i], idx[i + 1]); edge(idx[i + 1], idx[i + 2]); edge(idx[i + 2], idx[i]); } }
    else if (o.type === 'block') rect('BLOCK', o, o.width, o.length);
    else skipped.push(`${o.id}: type ${o.type} not exported`);
  }
  const names = Object.keys(LAYERS), t = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LTYPE', '70', '1', '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0', '0', 'ENDTAB',
    '0', 'TABLE', '2', 'LAYER', '70', String(names.length)];
  names.forEach(n => t.push('0', 'LAYER', '2', n, '70', '0', '62', String(LAYERS[n]), '6', 'CONTINUOUS')); t.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES', ...e, '0', 'ENDSEC', '0', 'EOF');
  return { text: t.join('\n') + '\n', counts, skipped };
}
