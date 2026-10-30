// Select tool: click selects any object; drag moves blocks, nodes and roads on the ground plane (pipes follow their nodes).
// Drag a gold handle of a selected road or watercourse to move one control point in plan (X, Y); edit elevation (Z) in the Properties table.
export function initPicking({ sm, project, selection, history, state }) {
  const dom = sm.renderer.domElement; let drag = null, down = null;
  const snap = v => state.snap ? Math.round(v / state.gridSize) * state.gridSize : v;
  const anchor = o => o.points ? o.points[0] : o;
  dom.addEventListener('pointerdown', e => {
    if (e.button !== 0 || state.tool !== 'select') return;
    const hh = sm.pickHandle(e);
    if (hh && hh.object.userData.id === selection.id) {
      const o = project.get(selection.id), i = hh.object.userData.handle, q = o.points[i], p = sm.planePoint(e, q.z);
      if (p) { drag = { id: o.id, index: i, z: q.z, dx: q.x - p.x, dy: q.y - p.y, moved: false }; sm.cam.controls.enabled = false; return; }
    }
    const hit = sm.pick(e);
    if (hit) {
      const id = hit.object.userData.id; selection.set(id);
      const o = project.get(id), p = sm.groundPoint(e);
      if (p && o.type !== 'pipe') { const a = anchor(o); drag = { id, dx: a.x - p.x, dy: a.y - p.y, moved: false }; sm.cam.controls.enabled = false; }
    } else down = { x: e.clientX, y: e.clientY };
  }, true);
  window.addEventListener('pointermove', e => {
    if (!drag) return; const o = project.get(drag.id); if (!o) return;
    if (drag.index !== undefined) {
      const p = sm.planePoint(e, drag.z); if (!p) return;
      const x = +snap(p.x + drag.dx).toFixed(3), y = +snap(p.y + drag.dy).toFixed(3), q = o.points[drag.index];
      if (x === q.x && y === q.y) return;
      if (!drag.moved) { history.record(); drag.moved = true; }
      project.update(o.id, { points: o.points.map((r, i) => i === drag.index ? { ...r, x, y } : r) }); return;
    }
    const p = sm.groundPoint(e); if (!p) return;
    const a = anchor(o), x = +snap(p.x + drag.dx).toFixed(3), y = +snap(p.y + drag.dy).toFixed(3);
    if (x === a.x && y === a.y) return;
    if (!drag.moved) { history.record(); drag.moved = true; }
    project.update(drag.id, o.points ? { points: o.points.map(q => ({ ...q, x: +(q.x + x - a.x).toFixed(3), y: +(q.y + y - a.y).toFixed(3) })) } : { x, y });
  });
  window.addEventListener('pointerup', e => {
    if (drag) { drag = null; sm.cam.controls.enabled = true; }
    else if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 4) selection.set(null);
    down = null;
  });
}
