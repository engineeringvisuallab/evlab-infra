import { TYPES, collectWarnings } from '../models/registry.js';
import { checkValue } from '../models/schema.js';
import { roadStats } from '../models/road.js';
import { pipeLength } from '../models/pipe.js';
import { drawProfile } from './profile-view.js';
const CAT = { block: 'Project / generic reference block', road: 'Road (preliminary geometry)', node: 'Water network node', pipe: 'Water pipe' };
export function initPropertiesPanel(root, { project, selection, history, bus }) {
  const mk = (t, props = {}, kids = []) => { const e = document.createElement(t); Object.assign(e, props); kids.forEach(k => e.append(k)); return e; };
  const row = (label, input) => mk('label', { className: 'row' }, [mk('span', { textContent: label }), input]);
  const info = (a, b) => mk('p', { className: 'muted', textContent: `${a}: ${b}` });
  const note = t => mk('p', { className: 'muted', textContent: t });
  function render() {
    root.replaceChildren(mk('h2', { textContent: 'Properties' }));
    const o = selection.id && project.get(selection.id), msg = mk('p', { className: 'err' });
    if (!o) {
      const n = mk('input', { value: project.meta.name });
      n.addEventListener('change', () => { const v = n.value.trim(); if (!v) { n.value = project.meta.name; return; } history.record(); project.meta.name = v; project.changed(); });
      root.append(row('Project name', n), info('Created', project.meta.created), info('Last modified', project.meta.modified || '—'), info('App version', project.meta.appVersion),
        info('Coordinate system', project.meta.crs), info('Units', project.meta.units), note('Click an object to edit it. Use the Select, Road or Pipe tool in the toolbar.')); return;
    }
    const commit = patch => { msg.textContent = ''; history.record(); project.update(o.id, patch); };
    root.append(row('ID', mk('input', { value: o.id, disabled: true })), row('Type', mk('input', { value: CAT[o.type], disabled: true })));
    for (const f of TYPES[o.type].schema) {
      let inp, parse = v => v;
      if (f.t === 'select') inp = mk('select', {}, f.opts.map(v => mk('option', { value: v, textContent: v, selected: v === o[f.k] })));
      else if (f.t === 'color') inp = mk('input', { type: 'color', value: o[f.k] });
      else if (f.t === 'number') { inp = mk('input', { type: 'number', step: 'any', value: o[f.k] ?? '' }); parse = v => v === '' ? null : parseFloat(v); }
      else { inp = mk('input', { value: o[f.k] ?? '' }); parse = v => v.trim(); }
      inp.addEventListener('change', () => { const v = parse(inp.value), err = checkValue(f, v); if (err) { msg.textContent = err; inp.value = o[f.k] ?? ''; return; } commit({ [f.k]: v }); });
      root.append(row(f.l, inp));
    }
    root.append(msg);
    collectWarnings(project).filter(w => w.id === o.id).forEach(w => root.append(mk('p', { className: 'warn', textContent: '⚠ ' + w.msg.slice(o.id.length + 2) })));
    if (o.type === 'block') root.append(info('Volume (W×L×H)', (o.width * o.length * o.height).toFixed(3) + ' m³'), note('Generic test block. Not an engineering element.'));
    if (o.type === 'node') root.append(info('Connected pipes', project.objects.filter(p => p.type === 'pipe' && (p.fromId === o.id || p.toId === o.id)).length), note('Drawn at invert level, else ground level, else 0. Leave levels blank if unknown.'));
    if (o.type === 'pipe') {
      const L = pipeLength(o, project);
      root.append(info('From → To', `${o.fromId} → ${o.toId}`));
      if (L) root.append(info('Length (3D, from coordinates)', L.len3d.toFixed(3) + ' m'), info('Plan length', L.plan.toFixed(3) + ' m'), info('Slope', L.plan > 0 ? (L.dz / L.plan * 100).toFixed(2) + ' %' : '—'));
      root.append(note('Geometric modeling only. No hydraulic analysis is performed.'));
    }
    if (o.type === 'road') {
      const s = roadStats(o.points);
      root.append(info('Plan length', s.plan.toFixed(3) + ' m'), info('3D length', s.len3d.toFixed(3) + ' m'), info('Max segment grade', s.maxGradePct.toFixed(2) + ' %'), mk('h2', { textContent: 'Control points (X, Y, Z in m)' }));
      o.points.forEach((p, i) => {
        const r = mk('div', { className: 'pt' }, [mk('span', { textContent: i + 1 })]);
        for (const k of ['x', 'y', 'z']) {
          const inp = mk('input', { type: 'number', step: 'any', value: p[k] });
          inp.addEventListener('change', () => { const v = parseFloat(inp.value);
            if (!Number.isFinite(v) || Math.abs(v) > (k === 'z' ? 1e4 : 1e6)) { msg.textContent = `Point ${i + 1} ${k.toUpperCase()} is invalid`; inp.value = p[k]; return; }
            const pts = o.points.map(q => ({ ...q })); pts[i][k] = v; commit({ points: pts }); });
          r.append(inp);
        }
        const del = mk('button', { textContent: '×', title: 'Delete point', disabled: o.points.length <= 2 });
        del.addEventListener('click', () => commit({ points: o.points.filter((_, j) => j !== i) })); r.append(del); root.append(r);
      });
      const add = mk('button', { textContent: 'Add point at end' });
      add.addEventListener('click', () => { const n = o.points.length, a = o.points[n - 2], b = o.points[n - 1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        commit({ points: [...o.points, { x: b.x + (b.x - a.x) / l * 10, y: b.y + (b.y - a.y) / l * 10, z: b.z + (b.z - a.z) / l * 10 }] }); });
      const cv = mk('canvas', { width: 240, height: 130, className: 'profile' });
      root.append(add, mk('h2', { textContent: 'Longitudinal profile' }), cv, note('Preliminary geometry, not a final road design. Straight segments only; no curves, superelevation or design standards.'));
      drawProfile(cv, o.points);
    }
  }
  bus.on('selection', render); bus.on('model-changed', render); render();
}
