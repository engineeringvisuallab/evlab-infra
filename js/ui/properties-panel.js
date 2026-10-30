import { TYPES, collectWarnings } from '../models/registry.js';
import { toDisplay, fromDisplay, SYS } from '../core/units.js';
import { checkValue, N } from '../models/schema.js';
import { roadStats } from '../models/road.js';
import { pipeLength } from '../models/pipe.js';
import { terrainMesh, elevationAt } from '../models/terrain.js';
import { drawProfile, drawSection } from './profile-view.js';
import { alignment } from '../models/alignment.js';
import { groundProfile, crossSection } from '../models/sections.js';
import { chainage, fmtStation } from '../models/road.js';
const CAT = { block: 'Project / generic reference block', road: 'Road (preliminary geometry)', node: 'Water network node', pipe: 'Water pipe', bridge: 'Bridge (concept)', culvert: 'Culvert (concept)', watercourse: 'Watercourse (concept)', terrain: 'Terrain (TIN from points)' };
export function initPropertiesPanel(root, { project, selection, history, bus }) {
  const mk = (t, props = {}, kids = []) => { const e = document.createElement(t); Object.assign(e, props); kids.forEach(k => e.append(k)); return e; };
  const row = (label, input) => mk('label', { className: 'row' }, [mk('span', { textContent: label }), input]);
  const info = (a, b) => mk('p', { className: 'muted', textContent: `${a}: ${b}` });
  const note = t => mk('p', { className: 'muted', textContent: t });
  let flash = ''; const sec = { s: 0 };
  const SU = () => project.meta.units === 'ft' ? 'ft' : 'm';
  const dl = (v, d = 3, u = true) => toDisplay('len', v, SU()).toFixed(d) + (u ? ' ' + SYS[SU()].len : ''), da = (v, d = 2) => toDisplay('area', v, SU()).toFixed(d) + ' ' + SYS[SU()].area, dv = (v, d = 3) => toDisplay('vol', v, SU()).toFixed(d) + ' ' + SYS[SU()].vol;
  const kind = f => /\(mm\)/.test(f.l) ? 'dia' : /\(m\)/.test(f.l) ? 'len' : null, ulab = l => l.replace('(mm)', `(${SYS[SU()].dia})`).replace('(m)', `(${SYS[SU()].len})`);
  function render() {
    root.replaceChildren(mk('h2', { textContent: 'Properties' }));
    const o = selection.id && project.get(selection.id), msg = mk('p', { className: 'err' }); if (flash) { msg.textContent = flash; flash = ''; }
    if (!o) {
      const n = mk('input', { value: project.meta.name });
      const us = mk('select', {}, [['m', 'Metres (m, mm)'], ['ft', 'Feet (ft, in)']].map(([k, l]) => mk('option', { value: k, textContent: l, selected: k === SU() })));
      us.addEventListener('change', () => { history.record(); project.meta.units = us.value; project.changed(); });
      n.addEventListener('change', () => { const v = n.value.trim(); if (!v) { n.value = project.meta.name; return; } history.record(); project.meta.name = v; project.changed(); });
      root.append(row('Project name', n), info('Created', project.meta.created), info('Last modified', project.meta.modified || '—'), info('App version', project.meta.appVersion),
        info('Coordinate system', project.meta.crs), row('Display units', us), note('Click an object to edit it. Use the Select, Road or Pipe tool in the toolbar.'), note('Display units apply to this screen, reports and terrain CSV import. Data is stored in metres. Inventory CSV, GeoJSON, DXF and STL are always metric.'));
      const g = project.meta.geo || { originLon: null, originLat: null };
      const geoRow = (k, l, min, max) => { const f = N(k, l, min, max, { nullable: true }), i = mk('input', { type: 'number', step: 'any', value: g[k] ?? '' });
        i.addEventListener('change', () => { const v = i.value === '' ? null : parseFloat(i.value), err = checkValue(f, v); if (err) { msg.textContent = err; i.value = g[k] ?? ''; return; } history.record(); project.meta.geo = { ...g, [k]: v }; project.changed(); }); return row(l, i); };
      root.append(mk('h2', { textContent: 'Geographic origin (optional)' }), geoRow('originLon', 'Origin longitude (°)', -180, 180), geoRow('originLat', 'Origin latitude (°)', -90, 90), msg,
        note('Where local (0, 0) sits on Earth, in WGS84 degrees. Used for the lon/lat readout and GeoJSON. Small-area approximation, not survey-grade.')); return;
    }
    const commit = patch => { msg.textContent = ''; history.record(); project.update(o.id, patch); };
    root.append(row('ID', mk('input', { value: o.id, disabled: true })), row('Type', mk('input', { value: CAT[o.type], disabled: true })));
    for (const f of TYPES[o.type].schema) {
      let inp, parse = v => v; const kd = f.t === 'number' ? kind(f) : null, shown = () => o[f.k] == null ? '' : (kd ? +toDisplay(kd, o[f.k], SU()).toFixed(4) : o[f.k]);
      if (f.t === 'select') inp = mk('select', {}, f.opts.map(v => mk('option', { value: v, textContent: v, selected: v === o[f.k] })));
      else if (f.t === 'color') inp = mk('input', { type: 'color', value: o[f.k] });
      else if (f.t === 'number') { inp = mk('input', { type: 'number', step: 'any', value: shown() }); parse = v => v === '' ? null : parseFloat(v); }
      else if (f.t === 'textarea') { inp = mk('textarea', { value: o[f.k] ?? '', rows: 3 }); parse = v => v.trim(); }
      else { inp = mk('input', { value: o[f.k] ?? '' }); parse = v => v.trim(); }
      inp.addEventListener('change', () => {
        const raw = parse(inp.value), ff = kd ? { ...f, l: ulab(f.l), min: toDisplay(kd, f.min, SU()), max: toDisplay(kd, f.max, SU()) } : f, err = checkValue(ff, raw);
        if (err) { msg.textContent = err; inp.value = shown(); return; }
        commit({ [f.k]: kd && raw !== null ? +fromDisplay(kd, raw, SU()).toFixed(6) : raw }); });
      root.append(row(ulab(f.l), inp));
    }
    root.append(msg);
    collectWarnings(project).filter(w => w.id === o.id).forEach(w => root.append(mk('p', { className: 'warn', textContent: '⚠ ' + w.msg.slice(o.id.length + 2) })));
    if (o.type === 'block') root.append(info('Volume (W×L×H)', dv((o.width * o.length * o.height), 3)), note('Generic test block. Not an engineering element.'));
    if (o.type === 'node') root.append(info('Connected pipes', project.objects.filter(p => p.type === 'pipe' && (p.fromId === o.id || p.toId === o.id)).length), note('Drawn at invert level, else ground level, else 0. Leave levels blank if unknown.'));
    if (o.type === 'pipe') {
      const L = pipeLength(o, project);
      root.append(info('From → To', `${o.fromId} → ${o.toId}`));
      if (L) root.append(info('Length (3D, from coordinates)', dl(L.len3d, 3)), info('Plan length', dl(L.plan, 3)), info('Slope', L.plan > 0 ? (L.dz / L.plan * 100).toFixed(2) + ' %' : '—'));
      root.append(note('Geometric modeling only. No hydraulic analysis is performed.'));
    }
    if (o.type === 'bridge') {
      const u = o.z - o.deckThickness; root.append(info('Deck underside elevation', dl(u, 3)), info('Deck area (L×W)', da((o.length * o.width), 2)));
      if (o.groundLevel != null) root.append(info('Support height', dl(Math.max(u - o.groundLevel, 0), 3)));
      if (o.waterLevel != null) { const c = u - o.waterLevel; root.append(info('Clearance (underside − design water level)', dl(c, 3) + (o.clearanceRequired != null ? (c >= o.clearanceRequired ? ' — meets entered requirement (geometric check only)' : ' — BELOW entered requirement') : ''))); }
      root.append(note('Conceptual model: not construction-ready or structurally certified.'));
    }
    if (o.type === 'culvert') root.append(info('Overall width', dl((o.barrels * o.barrelWidth + (o.barrels + 1) * o.wallThickness), 3)), info('Total opening area', da((o.barrels * o.barrelWidth * o.barrelHeight), 3)), note('Conceptual model: no hydraulic capacity check; not construction-ready or structurally certified.'));
    if (o.type === 'terrain') {
      const { stats, dupes } = terrainMesh(o);
      root.append(info('Points', o.points.length + (dupes ? ` (${dupes} duplicate ignored)` : '')), info('Triangles', stats.triangles), info('Plan area', da(stats.area, 1)), info('Elevation range', `${dl(stats.minZ, 3, false)} to ${dl(stats.maxZ, 3)}`));
      const apply = (label, collect) => { const b = mk('button', { textContent: label }); b.addEventListener('click', () => {
        const patches = [], outside = []; collect(patches, outside);
        if (!patches.length) { msg.textContent = outside.length ? `All ${outside.length} target(s) are outside this terrain.` : 'Nothing to update.'; return; }
        history.record(); patches.forEach(([t, patch]) => Object.assign(t, patch)); flash = `Updated ${patches.length}; ${outside.length} outside the terrain left unchanged.`; project.changed(); }); return b; };
      root.append(apply('Set road control-point elevations from terrain', (ps, out) => project.objects.filter(r => r.type === 'road').forEach(r => {
          let miss = false; const pts = r.points.map(p => { const z = elevationAt(o, p.x, p.y); if (z == null) { miss = true; return p; } return { ...p, z: +z.toFixed(3) }; });
          if (miss) out.push(r.id); else ps.push([r, { points: pts }]); })),
        apply('Set node ground levels from terrain', (ps, out) => project.objects.filter(n => n.type === 'node').forEach(n => { const z = elevationAt(o, n.x, n.y); if (z == null) out.push(n.id); else ps.push([n, { groundLevel: +z.toFixed(3) }]); })),
        note('Surface = triangulated irregular network (TIN) through your points, linear interpolation. Accuracy depends on your data; not survey-grade. A road is updated only if every control point is inside the terrain.'));
    }
    if (o.points && o.type !== 'terrain') {
      const s = roadStats(o.points);
      root.append(info('Plan length', dl(s.plan, 3)), info('3D length', dl(s.len3d, 3)), info('Max segment grade', s.maxGradePct.toFixed(2) + ' %'), mk('h2', { textContent: 'Control points' }));
      alignment(o.points).curves.forEach(c => root.append(info(`Curve at point ${c.index + 1}`, `R ${dl(c.radius, 2)}${c.clamped ? ` (requested ${dl(c.requested, 2)}, reduced to fit)` : ''} · deflection ${c.deltaDeg.toFixed(1)}° · tangent ${dl(c.tangent, 2)} · arc ${dl(c.length, 2)}`)));
      root.append(note(`Columns: X, Y, Z (${SYS[SU()].len}) and curve radius R (${SYS[SU()].len}) at interior points. Blank R = sharp corner. Circular arcs only; no spirals or design standards.`));
      o.points.forEach((p, i) => {
        const r = mk('div', { className: 'pt' }, [mk('span', { textContent: i + 1 })]);
        for (const k of ['x', 'y', 'z']) {
          const inp = mk('input', { type: 'number', step: 'any', value: +toDisplay('len', p[k], SU()).toFixed(4) });
          inp.addEventListener('change', () => { const v = fromDisplay('len', parseFloat(inp.value), SU());
            if (!Number.isFinite(v) || Math.abs(v) > (k === 'z' ? 1e4 : 1e6)) { msg.textContent = `Point ${i + 1} ${k.toUpperCase()} is invalid or out of range`; inp.value = +toDisplay('len', p[k], SU()).toFixed(4); return; }
            const pts = o.points.map(q => ({ ...q })); pts[i][k] = +v.toFixed(6); commit({ points: pts }); });
          r.append(inp);
        }
        const ri = mk('input', { type: 'number', step: 'any', value: p.r == null ? '' : +toDisplay('len', p.r, SU()).toFixed(4), placeholder: 'R', title: 'Curve radius, interior points only', disabled: i === 0 || i === o.points.length - 1 });
        ri.addEventListener('change', () => { const raw = ri.value === '' ? null : parseFloat(ri.value), v = raw === null ? null : fromDisplay('len', raw, SU());
          if (v !== null && (!Number.isFinite(v) || v < 1 || v > 1e5)) { msg.textContent = `Point ${i + 1}: radius is out of range (1 to 100000 m), or leave blank`; ri.value = p.r == null ? '' : +toDisplay('len', p.r, SU()).toFixed(4); return; }
          const pts = o.points.map(q => ({ ...q })); if (v === null) delete pts[i].r; else pts[i].r = +v.toFixed(6); commit({ points: pts }); });
        r.append(ri);
        const del = mk('button', { textContent: '×', title: 'Delete point', disabled: o.points.length <= 2 });
        del.addEventListener('click', () => commit({ points: o.points.filter((_, j) => j !== i) })); r.append(del); root.append(r);
      });
      const add = mk('button', { textContent: 'Add point at end' });
      add.addEventListener('click', () => { const n = o.points.length, a = o.points[n - 2], b = o.points[n - 1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        commit({ points: [...o.points, { x: b.x + (b.x - a.x) / l * 10, y: b.y + (b.y - a.y) / l * 10, z: b.z + (b.z - a.z) / l * 10 }] }); });
      const cv = mk('canvas', { width: 240, height: 130, className: 'profile' });
      root.append(add, note('Tip: with the Select tool, drag the gold handles to move a point in plan, and double-click the road to insert a point on that segment. Edit elevation (Z) in the table.'), mk('h2', { textContent: 'Longitudinal profile' }), cv, note(o.type === 'road' ? 'Preliminary geometry, not a final road design. Straight segments and simple circular arcs only; no spirals, superelevation or design standards.' : 'Conceptual watercourse alignment from user-entered bed levels. Not survey data; no hydraulic analysis.'));
      const dn = alignment(o.points).pts, terrains = project.objects.filter(t => t.type === 'terrain');
      const du = { k: toDisplay('len', 1, SU()), unit: SYS[SU()].len };
      drawProfile(cv, dn, o.type === 'road' ? groundProfile(dn, terrains) : null, du);
      if (o.type === 'road') {
        const L = chainage(dn).at(-1), sl = mk('input', { type: 'range', min: 0, max: L, step: Math.max(L / 200, 0.01), value: Math.min(sec.s, L) }), cs = mk('canvas', { width: 240, height: 150, className: 'profile' }), lab = mk('p', { className: 'muted' });
        const draw = () => { sec.s = +sl.value; const x = crossSection(dn, o, sec.s, terrains); drawSection(cs, x, du);
          lab.textContent = `Station ${fmtStation(x.station)} · road top ${dl(x.z, 2)}` + (x.groundCL == null ? (terrains.length ? ' · outside the terrain' : ' · no terrain loaded') : ` · ground at centerline ${dl(x.groundCL, 2)} → ${x.groundCL > x.z ? 'road in cut' : 'road on fill'} ${dl(Math.abs(x.groundCL - x.z), 2)}`) + '. Flat cross-fall; no side slopes, superelevation or earthwork volumes.'; };
        sl.addEventListener('input', draw); root.append(mk('h2', { textContent: 'Cross-section' }), sl, cs, lab); draw();
      }
    }
  }
  bus.on('selection', render); bus.on('model-changed', render); render();
}
