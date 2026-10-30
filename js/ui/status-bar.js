import { fmt, toDisplay, SYS } from '../core/units.js';
import { elevationAt } from '../models/terrain.js';
import { toGeo } from '../core/coordinates.js';
import { collectWarnings } from '../models/registry.js';
const HINTS = { select: 'Select / Move', road: 'Draw road — click points · Enter or double-click = finish · Esc = cancel',
  watercourse: 'Draw watercourse — click points · Enter or double-click = finish · Esc = cancel',
  measure: 'Measure — click two points (object surface or ground) · Esc = clear',
  pipe: 'Draw pipe — click to place or pick nodes · Enter, double-click or Esc = finish' };
export function initStatusBar({ bus, state, project }) {
  const $ = id => document.getElementById(id);
  bus.on('cursor', p => {
    const g = project.meta.geo; let t = p ? `X ${fmt(p.x, state.units)}  Y ${fmt(p.y, state.units)}` : 'X —  Y —';
    if (p && g && g.originLon != null && g.originLat != null) { const [lo, la] = toGeo(p.x, p.y, { lon: g.originLon, lat: g.originLat }); t += `  (lon ${lo.toFixed(6)}, lat ${la.toFixed(6)})`; }
    if (p) for (const o of project.objects) if (o.type === 'terrain') { const z = elevationAt(o, p.x, p.y); if (z != null) { t += `  terrain Z ${fmt(z, state.units)}`; break; } }
    $('st-cursor').textContent = t; });
  $('st-valid').style.cursor = 'pointer'; $('st-valid').addEventListener('click', () => bus.emit('panel', 'validate'));
  $('st-units').textContent = `Units: ${state.units}`;
  bus.on('status', t => { $('st-save').textContent = t; });
  bus.on('measure', t => { $('st-measure').textContent = t; });
  const lab = () => { $('st-tool').textContent = `Tool: ${HINTS[state.tool]} · Snap ${state.snap ? +toDisplay('len', state.gridSize, state.units).toFixed(2) + ' ' + SYS[state.units].len : 'off'}`; };
  bus.on('snap', lab); bus.on('tool', lab);
  bus.on('model-changed', () => lab());
  const upd = () => {
    $('st-units').textContent = `Units: ${state.units}`;
    $('st-crs').textContent = 'CRS: ' + project.meta.crs;
    $('st-count').textContent = `Objects: ${project.objects.length}`;
    const w = collectWarnings(project);
    $('st-valid').textContent = w.length ? `⚠ ${w.length} warning(s) — hover` : 'Validation: no warnings';
    $('st-valid').title = w.map(x => x.msg).slice(0, 25).join('\n');
  };
  bus.on('model-changed', upd); lab(); upd();
}
