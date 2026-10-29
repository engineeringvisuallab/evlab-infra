import { fmt } from '../core/units.js';
import { collectWarnings } from '../models/registry.js';
const HINTS = { select: 'Select / Move', road: 'Draw road — click points · Enter or double-click = finish · Esc = cancel',
  pipe: 'Draw pipe — click to place or pick nodes · Enter, double-click or Esc = finish' };
export function initStatusBar({ bus, state, project }) {
  const $ = id => document.getElementById(id);
  bus.on('cursor', p => { $('st-cursor').textContent = p ? `X ${fmt(p.x, state.units)}  Y ${fmt(p.y, state.units)}` : 'X —  Y —'; });
  $('st-units').textContent = `Units: ${state.units}`;
  bus.on('status', t => { $('st-save').textContent = t; });
  const lab = () => { $('st-tool').textContent = `Tool: ${HINTS[state.tool]} · Snap ${state.snap ? state.gridSize + ' m' : 'off'}`; };
  bus.on('snap', lab); bus.on('tool', lab);
  const upd = () => {
    $('st-count').textContent = `Objects: ${project.objects.length}`;
    const w = collectWarnings(project);
    $('st-valid').textContent = w.length ? `⚠ ${w.length} warning(s) — hover` : 'Validation: no warnings';
    $('st-valid').title = w.map(x => x.msg).slice(0, 25).join('\n');
  };
  bus.on('model-changed', upd); lab(); upd();
}
