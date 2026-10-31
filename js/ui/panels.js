// Show/hide and resize the explorer, properties panel, status bar and toolbar. Choices are remembered in this browser.
const KEY = 'evlab-infra-ui', NAMES = ['explorer', 'properties', 'status', 'toolbar'], SIDE = ['explorer', 'properties', 'status'];
const LIMITS = { explorer: [160, 520, 230], properties: [260, 640, 310] }; // min, max, default width in px
export function initPanelToggles() {
  let hidden = {}, sizes = { explorer: LIMITS.explorer[2], properties: LIMITS.properties[2] };
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; NAMES.forEach(n => { hidden[n] = s[n] === true; });
    for (const k of Object.keys(sizes)) if (Number.isFinite(s.sizes && s.sizes[k])) sizes[k] = Math.min(Math.max(s.sizes[k], LIMITS[k][0]), LIMITS[k][1]); } catch (e) { NAMES.forEach(n => { hidden[n] = false; }); }
  const $ = id => document.getElementById(id), arrows = { explorer: ['◀', '▶'], properties: ['▶', '◀'], status: ['▼', '▲'] };
  const apply = () => {
    NAMES.forEach(n => { document.body.classList.toggle('hide-' + n, hidden[n]); const b = document.querySelector(`[data-panel="${n}"]`); if (b) b.classList.toggle('on', !hidden[n]); });
    SIDE.forEach(n => { const t = $('tab-' + n); if (t) t.textContent = arrows[n][hidden[n] ? 1 : 0]; });
    document.body.style.setProperty('--ex', hidden.explorer ? '0px' : sizes.explorer + 'px'); document.body.style.setProperty('--pr', hidden.properties ? '0px' : sizes.properties + 'px');
    const f = $('btn-full'); if (f) f.classList.toggle('on', SIDE.every(n => hidden[n]));
    try { localStorage.setItem(KEY, JSON.stringify({ ...hidden, sizes })); } catch (e) { /* storage unavailable: choices not remembered */ }
  };
  const toggle = n => { hidden[n] = !hidden[n]; apply(); };
  const full = () => { const h = !SIDE.every(n => hidden[n]); SIDE.forEach(n => { hidden[n] = h; }); apply(); };
  document.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.panel)));
  SIDE.forEach(n => { const t = $('tab-' + n); if (t) t.addEventListener('click', () => toggle(n)); });
  $('btn-full').addEventListener('click', full); $('tb-restore').addEventListener('click', () => { hidden.toolbar = false; apply(); });
  for (const side of ['explorer', 'properties']) { // drag the splitter on a panel edge to resize; double-click to reset
    const el = $('split-' + side), [min, max, def] = LIMITS[side];
    el.addEventListener('dblclick', () => { sizes[side] = def; apply(); });
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); el.setPointerCapture(e.pointerId); const aside = $(side);
      const move = ev => { const r = aside.getBoundingClientRect(); sizes[side] = Math.round(Math.min(Math.max(side === 'explorer' ? ev.clientX - r.left : r.right - ev.clientX, min), max)); apply(); };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); }; el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
  }
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key.toLowerCase() === 'f') full(); else if (e.key === '[') toggle('explorer'); else if (e.key === ']') toggle('properties');
  });
  apply();
}
