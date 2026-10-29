import { CONFIG } from '../config.js';
export function initProjectTree(el, { sm, project, selection, bus }) {
  function render() {
    el.replaceChildren();
    for (const [id, label] of CONFIG.layers) {
      const objs = project.objects.filter(o => o.category === id);
      const li = document.createElement('li');
      const cb = Object.assign(document.createElement('input'), { type: 'checkbox', checked: sm.layers[id].visible });
      cb.setAttribute('aria-label', 'Toggle ' + label);
      cb.addEventListener('change', () => { sm.layers[id].visible = cb.checked; });
      const n = Object.assign(document.createElement('span'), { className: 'n', textContent: objs.length });
      li.append(cb, Object.assign(document.createElement('span'), { textContent: label }), n); el.append(li);
      for (const o of objs) {
        const c = document.createElement('li'); c.className = 'child' + (o.id === selection.id ? ' sel' : '');
        c.textContent = `${o.id} · ${o.name}`; c.addEventListener('click', () => selection.set(o.id)); el.append(c);
      }
    }
  }
  bus.on('model-changed', render); bus.on('selection', render); render();
}
