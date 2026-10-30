import { collectWarnings, validateObject, GRADE_HEURISTIC_PCT } from '../models/registry.js';
export function initValidationPanel(root, { project, selection, bus }) {
  let open = false;
  const mk = (t, props = {}, kids = []) => { const e = document.createElement(t); Object.assign(e, props); kids.forEach(k => e.append(k)); return e; };
  function render() {
    root.hidden = !open; if (!open) return; root.replaceChildren();
    const close = mk('button', { textContent: 'Close' }); close.addEventListener('click', () => { open = false; render(); });
    root.append(mk('div', { className: 'chead' }, [mk('h2', { textContent: 'Validation' }), close]));
    const hard = project.objects.flatMap(o => validateObject(o).map(e => `${o.id}: ${e}`)), warn = collectWarnings(project);
    root.append(mk('p', { textContent: hard.length ? `${hard.length} invalid value(s):` : `Attribute checks passed for all ${project.objects.length} object(s).` }));
    hard.forEach(h => root.append(mk('p', { className: 'err', textContent: h })));
    root.append(mk('h2', { textContent: `Warnings (${warn.length})` }));
    if (!warn.length) root.append(mk('p', { className: 'muted', textContent: 'No warnings.' }));
    for (const w of warn) { const b = mk('button', { textContent: 'Select' }); b.addEventListener('click', () => selection.set(w.id)); root.append(mk('div', { className: 'chk' }, [b, mk('span', { className: 'warn', textContent: w.msg })])); }
    root.append(mk('p', { className: 'muted', textContent: `Warnings flag missing or inconsistent data. The grade warning (> ${GRADE_HEURISTIC_PCT}%) is a simple heuristic, not a design standard. Passing these checks does not mean a design is correct.` }));
  }
  bus.on('panel', n => { open = n === 'validate' ? !open : false; render(); }); bus.on('model-changed', render); render();
}
