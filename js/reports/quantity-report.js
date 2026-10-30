// Preliminary geometric quantities from entered coordinates and dimensions. Not a bill of quantities.
import { roadStats } from '../models/road.js';
import { toDisplay, SYS } from '../core/units.js';
import { terrainMesh } from '../models/terrain.js';
import { pipeLength } from '../models/pipe.js';
import { toCsv } from '../io/csv-io.js';
const f = (v, d = 2) => +Number(v).toFixed(d);
const assumptions = S => [
  'All quantities are geometric and preliminary, computed from entered coordinates and dimensions. They are not a bill of quantities.',
  'Road surface area = plan length × width; volume = area × thickness. Curves are included along the arc; junction widening, mitering and side slopes are ignored.',
  'Pipe lengths are 3D distances between node coordinates (invert level, else ground level, else 0). Fittings, trenching, bedding and cover are not included.',
  'Bridge piers and abutments are simple boxes between ground level and the deck underside. Foundations are not included.',
  'Culvert concrete = top and bottom slabs plus walls of a box section. Wing walls, headwalls and bedding are excluded.',
  'Terrain is a triangulated surface through the entered points with linear interpolation. Cut and fill volumes are not calculated.',
  `Units: ${S.len}, ${S.area}, ${S.vol}; pipe diameter in ${S.dia}. Data is stored in metres and converted for display.`];
export function quantities(project) {
  const U = project.meta.units === 'ft' ? 'ft' : 'm', S = SYS[U], cl = (v, d = 2) => f(toDisplay('len', v, U), d), ca = v => f(toDisplay('area', v, U)), cv = v => f(toDisplay('vol', v, U)), cd = v => f(toDisplay('dia', v, U));
  const O = t => project.objects.filter(o => o.type === t), sections = [], notes = [], sum = (a, k) => a.reduce((s, r) => s + r[k], 0);
  const roads = O('road');
  if (roads.length) {
    const rr = roads.map(o => { const s = roadStats(o.points), a = s.plan * o.width; return { o, plan: s.plan, l3: s.len3d, a, v: a * o.thickness }; });
    const rows = rr.map(r => [r.o.id, r.o.name, r.o.material, cl(r.plan), cl(r.l3), cl(r.o.width), cl(r.o.thickness, 3), ca(r.a), cv(r.v)]);
    rows.push(['', 'TOTAL', '', cl(sum(rr, 'plan')), cl(sum(rr, 'l3')), '', '', ca(sum(rr, 'a')), cv(sum(rr, 'v'))]);
    sections.push({ title: 'Roads', headers: ['ID', 'Name', 'Material', `Plan length (${S.len})`, `3D length (${S.len})`, `Width (${S.len})`, `Thickness (${S.len})`, `Surface area (${S.area})`, `Volume (${S.vol})`], rows });
  }
  const wcs = O('watercourse');
  if (wcs.length) sections.push({ title: 'Watercourses', headers: ['ID', 'Name', `Width (${S.len})`, `Plan length (${S.len})`], rows: wcs.map(o => [o.id, o.name, cl(o.width), cl(roadStats(o.points).plan)]) });
  const terr = O('terrain');
  if (terr.length) sections.push({ title: 'Terrain (TIN)', headers: ['ID', 'Name', 'Points', 'Triangles', `Plan area (${S.area})`, `Min Z (${S.len})`, `Max Z (${S.len})`], rows: terr.map(o => { const s = terrainMesh(o).stats; return [o.id, o.name, o.points.length, s.triangles, ca(s.area), cl(s.minZ, 3), cl(s.maxZ, 3)]; }) });
  const pipes = O('pipe');
  if (pipes.length) {
    const by = new Map(), rows = pipes.map(p => {
      const L = pipeLength(p, project); if (!L) notes.push(`Pipe ${p.id}: connected node missing, length not calculated.`);
      else { const k = p.diameter + '|' + p.material, e = by.get(k) || { d: p.diameter, m: p.material, n: 0, len: 0 }; e.n++; e.len += L.len3d; by.set(k, e); }
      return [p.id, p.name, p.fromId, p.toId, cd(p.diameter), p.material, L ? cl(L.len3d, 3) : '—', L ? cl(L.plan, 3) : '—', p.assetId || ''];
    });
    sections.push({ title: 'Pipes', headers: ['ID', 'Name', 'From', 'To', `Diameter (${S.dia})`, 'Material', `3D length (${S.len})`, `Plan length (${S.len})`, 'Asset ID'], rows });
    sections.push({ title: 'Pipe length by diameter and material', headers: [`Diameter (${S.dia})`, 'Material', 'Count', `Total 3D length (${S.len})`], rows: [...by.values()].sort((a, b) => a.d - b.d).map(e => [cd(e.d), e.m, e.n, cl(e.len, 3)]) });
  }
  const nodes = O('node');
  if (nodes.length) { const c = {}; nodes.forEach(n => c[n.nodeType] = (c[n.nodeType] || 0) + 1); sections.push({ title: 'Network nodes', headers: ['Type', 'Count'], rows: Object.entries(c) }); }
  const bridges = O('bridge');
  if (bridges.length) sections.push({ title: 'Bridges (conceptual)', headers: ['ID', 'Name', `Length (${S.len})`, `Width (${S.len})`, `Deck area (${S.area})`, `Deck volume (${S.vol})`, 'Piers', `Support height (${S.len})`, `Pier volume (${S.vol})`, `Abutment volume (${S.vol})`],
    rows: bridges.map(o => { const h = o.groundLevel == null ? null : o.z - o.deckThickness - o.groundLevel, ok = h != null && h > 0.01;
      if (!ok) notes.push(`Bridge ${o.id}: support quantities not calculated (ground level not set or not below the deck).`);
      return [o.id, o.name, cl(o.length), cl(o.width), ca(o.length * o.width), cv(o.length * o.width * o.deckThickness), o.pierCount, ok ? cl(h) : '—', ok ? cv(o.pierCount * o.pierWidth * o.width * 0.5 * h) : '—', ok ? cv(2 * o.abutmentThickness * o.width * h) : '—']; }) });
  const culverts = O('culvert');
  if (culverts.length) sections.push({ title: 'Culverts (conceptual)', headers: ['ID', 'Name', 'Barrels', `Barrel W×H (${S.len})`, `Length (${S.len})`, `Concrete volume (${S.vol})`, `Total opening area (${S.area})`],
    rows: culverts.map(o => { const W = o.barrels * o.barrelWidth + (o.barrels + 1) * o.wallThickness;
      return [o.id, o.name, o.barrels, `${cl(o.barrelWidth)} × ${cl(o.barrelHeight)}`, cl(o.length), cv(o.length * (2 * W * o.wallThickness + (o.barrels + 1) * o.wallThickness * o.barrelHeight)), ca(o.barrels * o.barrelWidth * o.barrelHeight)]; }) });
  const nb = O('block').length; if (nb) notes.push(`${nb} generic reference block(s) are excluded from quantities.`);
  return { sections, notes, assumptions: assumptions(S) };
}
export function quantityCsv(q) {
  const rows = [['Preliminary quantity report (geometric, not a bill of quantities)'], []];
  for (const s of q.sections) rows.push([s.title], s.headers, ...s.rows, []);
  rows.push(['Notes'], ...q.notes.map(n => [n]), [], ['Calculation assumptions'], ...q.assumptions.map(a => [a]));
  return toCsv(rows);
}
