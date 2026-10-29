// Select tool: click selects any object; drag moves blocks, nodes and roads on the ground plane (pipes follow their nodes).
export function initPicking({ sm, project, selection, history, state }) {
  const dom = sm.renderer.domElement; let drag = null, down = null;
  const snap = v => state.snap ? Math.round(v / state.gridSize) * state.gridSize : v;
  const anchor = o => o.type === 'road' ? o.points[0] : o;
  dom.addEventListener('pointerdown', e => {
    if (e.button !== 0 || state.tool !== 'select') return;
    const hit = sm.pick(e);
    if (hit) {
      const id = hit.object.userData.id; selection.set(id);
      const o = project.get(id), p = sm.groundPoint(e);
      if (p && o.type !== 'pipe') { const a = anchor(o); drag = { id, dx: a.x - p.x, dy: a.y - p.y, moved: false }; sm.cam.controls.enabled = false; }
    } else down = { x: e.clientX, y: e.clientY };
  }, true);
  window.addEventListener('pointermove', e => {
    if (!drag) return; const p = sm.groundPoint(e), o = project.get(drag.id); if (!p || !o) return;
    const a = anchor(o), x = +snap(p.x + drag.dx).toFixed(3), y = +snap(p.y + drag.dy).toFixed(3);
    if (x === a.x && y === a.y) return;
    if (!drag.moved) { history.record(); drag.moved = true; }
    project.update(drag.id, o.type === 'road' ? { points: o.points.map(q => ({ ...q, x: +(q.x + x - a.x).toFixed(3), y: +(q.y + y - a.y).toFixed(3) })) } : { x, y });
  });
  window.addEventListener('pointerup', e => {
    if (drag) { drag = null; sm.cam.controls.enabled = true; }
    else if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 4) selection.set(null);
    down = null;
  });
}
