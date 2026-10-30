// Show/hide the explorer, properties panel, status bar and toolbar. The choice is remembered in this browser.
const KEY = 'evlab-infra-ui', NAMES = ['explorer', 'properties', 'status', 'toolbar'], SIDE = ['explorer', 'properties', 'status'];
export function initPanelToggles() {
  let hidden = {};
  try { hidden = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { hidden = {}; }
  NAMES.forEach(n => { hidden[n] = hidden[n] === true; });
  const apply = () => {
    NAMES.forEach(n => { document.body.classList.toggle('hide-' + n, hidden[n]); const b = document.querySelector(`[data-panel="${n}"]`); if (b) b.classList.toggle('on', !hidden[n]); });
    const f = document.getElementById('btn-full'); if (f) f.classList.toggle('on', SIDE.every(n => hidden[n]));
    try { localStorage.setItem(KEY, JSON.stringify(hidden)); } catch (e) { /* storage unavailable: choice not remembered */ }
  };
  const full = () => { const h = !SIDE.every(n => hidden[n]); SIDE.forEach(n => { hidden[n] = h; }); apply(); };
  document.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => { hidden[b.dataset.panel] = !hidden[b.dataset.panel]; apply(); }));
  document.getElementById('btn-full').addEventListener('click', full);
  document.getElementById('tb-restore').addEventListener('click', () => { hidden.toolbar = false; apply(); });
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) full(); });
  apply();
}
