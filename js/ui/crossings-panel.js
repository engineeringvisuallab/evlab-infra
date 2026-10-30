import { findCrossings, CHECKLIST } from '../models/crossings.js';
export function initCrossingsPanel(root, { project, selection, history, bus }) {
  let open = false;
  const mk = (t, props = {}, kids = []) => { const e = document.createElement(t); Object.assign(e, props); kids.forEach(k => e.append(k)); return e; };
  const set = fn => { history.record(); project.meta.crossing = fn({ ...project.meta.crossing, checklist: { ...project.meta.crossing.checklist } }); project.changed(); };
  function render() {
    root.hidden = !open; if (!open) return; root.replaceChildren();
    const close = mk('button', { textContent: 'Close' }); close.addEventListener('click', () => { open = false; render(); });
    root.append(mk('div', { className: 'chead' }, [mk('h2', { textContent: 'Crossings and preliminary assessment' }), close]));
    const msg = mk('p', { className: 'err' }), c = project.meta.crossing;
    const min = mk('input', { type: 'number', step: 'any', value: c.minClearance ?? '' });
    min.addEventListener('change', () => { const v = min.value === '' ? null : parseFloat(min.value);
      if (v !== null && (!Number.isFinite(v) || v < 0 || v > 100)) { msg.textContent = 'Clearance must be between 0 and 100 m'; min.value = c.minClearance ?? ''; return; } set(x => ({ ...x, minClearance: v })); });
    const as = mk('textarea', { value: c.assumptions, rows: 4, placeholder: 'Project-specific assumptions and sources' });
    as.addEventListener('change', () => set(x => ({ ...x, assumptions: as.value })));
    root.append(mk('label', { className: 'row' }, [mk('span', { textContent: 'Required vertical clearance (m)' }), min]), msg, mk('h2', { textContent: 'Project assumptions' }), as);
    const rows = findCrossings(project), tb = mk('table');
    tb.append(mk('tr', {}, ['Type', 'Items', 'Plan X, Y (m)', 'Vertical gap', 'Status', ''].map(t => mk('th', { textContent: t }))));
    for (const r of rows) {
      const b = mk('button', { textContent: 'Select' }); b.addEventListener('click', () => selection.set(r.a));
      tb.append(mk('tr', {}, [r.kind, `${r.a} × ${r.b}`, `${r.x.toFixed(2)}, ${r.y.toFixed(2)}`, r.gap == null ? '—' : r.gap.toFixed(2) + ' m', r.status].map(t => mk('td', { textContent: t })).concat(mk('td', {}, [b]))));
    }
    root.append(mk('h2', { textContent: `Crossing inventory (${rows.length})` }), rows.length ? mk('div', { className: 'scroll' }, [tb]) : mk('p', { className: 'muted', textContent: 'No plan-view crossings found between pipes, roads and watercourses.' }),
      mk('p', { className: 'muted', textContent: 'Vertical gap = underside of road (or watercourse bed) minus pipe crown, from entered levels. These are potential interactions found from plan geometry and entered levels. They are not confirmed physical clashes.' }), mk('h2', { textContent: 'Preliminary checklist' }));
    for (const [k, label] of CHECKLIST) {
      const cb = mk('input', { type: 'checkbox', checked: !!c.checklist[k] }); cb.addEventListener('change', () => set(x => ({ ...x, checklist: { ...x.checklist, [k]: cb.checked } })));
      root.append(mk('label', { className: 'chk' }, [cb, mk('span', { textContent: label })]));
    }
    root.append(mk('p', { className: 'muted', textContent: 'Conceptual models are not construction-ready or structurally certified. Verified engineering design is required.' }));
  }
  bus.on('panel', n => { open = n === 'crossings' ? !open : false; render(); }); bus.on('model-changed', render); render();
}
