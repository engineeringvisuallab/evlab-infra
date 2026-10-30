// Preliminary geometric quantities from entered coordinates and dimensions. Not a bill of quantities.
import { roadStats } from '../models/road.js';
import { pipeLength } from '../models/pipe.js';
import { toCsv } from '../io/csv-io.js';
const f = (v, d = 2) => +Number(v).toFixed(d);
export const ASSUMPTIONS = [
  'All quantities are geometric and preliminary, computed from entered coordinates and dimensions. They are not a bill of quantities.',
  'Road surface area = plan length × width; volume = area × thickness. Curves, junction widening, mitering and side slopes are ignored.',
  'Pipe lengths are 3D distances between node coordinates (invert level, else ground level, else 0). Fittings, trenching, bedding and cover are not included.',
  'Bridge piers and abutments are simple boxes between ground level and the deck underside. Foundations are not included.',
  'Culvert concrete = top and bottom slabs plus walls of a box section. Wing walls, headwalls and bedding are excluded.',
  'Units: metres, square metres, cubic metres; pipe diameter in millimetres.'];
export function quantities(project) {
  const O = t => project.objects.filter(o => o.type === t), sections = [], notes = [];
  const sum = (rows, i) => f(rows.reduce((s, r) => s + (typeof r[i] === 'number' ? r[i] : 0), 0));
  const roads = O('road');
  if (roads.length) {
    const rows = roads.map(o => { const s = roadStats(o.points), a = s.plan * o.width; return [o.id, o.name, o.material, f(s.plan), f(s.len3d), o.width, o.thickness, f(a), f(a * o.thickness)]; });
    rows.push(['', 'TOTAL', '', sum(rows, 3), sum(rows, 4), '', '', sum(rows, 7), sum(rows, 8)]);
    sections.push({ title: 'Roads', headers: ['ID', 'Name', 'Material', 'Plan length (m)', '3D length (m)', 'Width (m)', 'Thickness (m)', 'Surface area (m²)', 'Volume (m³)'], rows });
  }
  const wcs = O('watercourse');
  if (wcs.length) sections.push({ title: 'Watercourses', headers: ['ID', 'Name', 'Width (m)', 'Plan length (m)'], rows: wcs.map(o => [o.id, o.name, o.width, f(roadStats(o.points).plan)]) });
  const pipes = O('pipe');
  if (pipes.length) {
    const by = new Map(), rows = pipes.map(p => {
      const L = pipeLength(p, project); if (!L) notes.push(`Pipe ${p.id}: connected node missing, length not calculated.`);
      else { const k = p.diameter + '|' + p.material, e = by.get(k) || { d: p.diameter, m: p.material, n: 0, len: 0 }; e.n++; e.len += L.len3d; by.set(k, e); }
      return [p.id, p.name, p.fromId, p.toId, p.diameter, p.material, L ? f(L.len3d, 3) : '—', L ? f(L.plan, 3) : '—', p.assetId || ''];
    });
    sections.push({ title: 'Pipes', headers: ['ID', 'Name', 'From', 'To', 'Diameter (mm)', 'Material', '3D length (m)', 'Plan length (m)', 'Asset ID'], rows });
    sections.push({ title: 'Pipe length by diameter and material', headers: ['Diameter (mm)', 'Material', 'Count', 'Total 3D length (m)'], rows: [...by.values()].sort((a, b) => a.d - b.d).map(e => [e.d, e.m, e.n, f(e.len, 3)]) });
  }
  const nodes = O('node');
  if (nodes.length) { const c = {}; nodes.forEach(n => c[n.nodeType] = (c[n.nodeType] || 0) + 1); sections.push({ title: 'Network nodes', headers: ['Type', 'Count'], rows: Object.entries(c) }); }
  const bridges = O('bridge');
  if (bridges.length) sections.push({ title: 'Bridges (conceptual)', headers: ['ID', 'Name', 'Length (m)', 'Width (m)', 'Deck area (m²)', 'Deck volume (m³)', 'Piers', 'Support height (m)', 'Pier volume (m³)', 'Abutment volume (m³)'],
    rows: bridges.map(o => { const h = o.groundLevel == null ? null : o.z - o.deckThickness - o.groundLevel, ok = h != null && h > 0.01;
      if (!ok) notes.push(`Bridge ${o.id}: support quantities not calculated (ground level not set or not below the deck).`);
      return [o.id, o.name, o.length, o.width, f(o.length * o.width), f(o.length * o.width * o.deckThickness), o.pierCount, ok ? f(h) : '—', ok ? f(o.pierCount * o.pierWidth * o.width * 0.5 * h) : '—', ok ? f(2 * o.abutmentThickness * o.width * h) : '—']; }) });
  const culverts = O('culvert');
  if (culverts.length) sections.push({ title: 'Culverts (conceptual)', headers: ['ID', 'Name', 'Barrels', 'Barrel W×H (m)', 'Length (m)', 'Concrete volume (m³)', 'Total opening area (m²)'],
    rows: culverts.map(o => { const W = o.barrels * o.barrelWidth + (o.barrels + 1) * o.wallThickness;
      return [o.id, o.name, o.barrels, `${o.barrelWidth} × ${o.barrelHeight}`, o.length, f(o.length * (2 * W * o.wallThickness + (o.barrels + 1) * o.wallThickness * o.barrelHeight)), f(o.barrels * o.barrelWidth * o.barrelHeight)]; }) });
  const nb = O('block').length; if (nb) notes.push(`${nb} generic reference block(s) are excluded from quantities.`);
  return { sections, notes, assumptions: ASSUMPTIONS };
}
export function quantityCsv(q) {
  const rows = [['Preliminary quantity report (geometric, not a bill of quantities)'], []];
  for (const s of q.sections) rows.push([s.title], s.headers, ...s.rows, []);
  rows.push(['Notes'], ...q.notes.map(n => [n]), [], ['Calculation assumptions'], ...q.assumptions.map(a => [a]));
  return toCsv(rows);
}
