import { createBlock } from '../models/block.js';
import { createBridge } from '../models/bridge.js';
import { createCulvert } from '../models/culvert.js';
import { downloadProject, readProjectFile } from '../io/json-io.js';
export function initToolbar({ sm, project, history, selection, state, bus, setTool }) {
  const cam = sm.cam, $ = s => document.querySelector(s), camBtn = $('#btn-camera'), file = $('#file-open');
  const flip = (b, on) => b.classList.toggle('on', on);
  const del = () => { if (!selection.id) return; history.record(); const id = selection.id; selection.set(null); project.remove(id); };
  const place = make => { const t = cam.controls.target, s = v => state.snap ? Math.round(v / state.gridSize) * state.gridSize : v;
    history.record(); selection.set(project.add(make(project.newId(), s(t.x), s(t.y))).id); };
  const act = {
    new: () => { if (project.objects.length && !confirm('Start a new project? Unsaved changes will be lost.')) return; selection.set(null); project.reset(); history.clear(); },
    open: () => file.click(), save: () => downloadProject(project),
    undo: () => history.undo(), redo: () => history.redo(),
    add: () => { const t = cam.controls.target, s = v => state.snap ? Math.round(v / state.gridSize) * state.gridSize : v;
      history.record(); const o = project.add(createBlock(project.newId(), s(t.x), s(t.y))); selection.set(o.id); },
    delete: del, addBridge: () => place(createBridge), addCulvert: () => place(createCulvert), crossings: () => bus.emit('panel', 'crossings'), io: () => bus.emit('panel', 'io'), validate: () => bus.emit('panel', 'validate'),
    tool: b => setTool(b.dataset.tool),
    snap: b => { state.snap = !state.snap; flip(b, state.snap); bus.emit('snap'); },
    camera: () => { cam.setMode(cam.mode === 'perspective' ? 'orthographic' : 'perspective'); camBtn.textContent = cam.mode === 'perspective' ? 'Perspective' : 'Orthographic'; },
    reset: () => cam.fit(null), fit: () => cam.fit(sm.modelBox()),
    grid: b => { sm.grid.visible = !sm.grid.visible; flip(b, sm.grid.visible); },
    axes: b => { sm.axes.visible = !sm.axes.visible; flip(b, sm.axes.visible); },
    shadows: b => { const on = !sm.renderer.shadowMap.enabled; sm.setShadows(on); flip(b, on); }
  };
  document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => act[b.dataset.action](b)));
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    try { const d = await readProjectFile(f); selection.set(null); project.load(d); history.clear(); }
    catch (e) { alert('Could not open file.\n' + e.message); }
  });
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (k === 'delete' || k === 'backspace') del();
    else if (c && k === 'z') { e.preventDefault(); e.shiftKey ? history.redo() : history.undo(); }
    else if (c && k === 'y') { e.preventDefault(); history.redo(); }
  });
  const sync = () => { $('#btn-undo').disabled = !history.u.length; $('#btn-redo').disabled = !history.r.length; };
  bus.on('history', sync); sync();
  bus.on('tool', t => document.querySelectorAll('[data-action=tool]').forEach(b => flip(b, b.dataset.tool === t)));
}
