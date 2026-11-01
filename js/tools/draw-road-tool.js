import * as THREE from 'three';
import { createRoad } from '../models/road.js';
import { alignment } from '../models/alignment.js';
import { onClick, snapper } from './tool-utils.js';
export function initDrawRoadTool({ sm, project, history, selection, state, bus, setTool }, tool = 'road', create = createRoad) {
  const dom = sm.renderer.domElement, snap = snapper(state); let pts = [], cur = null, line = null;
  const clear = () => { if (line) { sm.scene.remove(line); line.geometry.dispose(); line.material.dispose(); line = null; } };
  const draw = () => { clear(); if (!pts.length) return; const R = project.meta.defaultRadius, a0 = cur ? [...pts, cur] : pts, a = alignment(a0.map((p, i) => ({ x: p.x, y: p.y, z: 0, ...(R > 0 && i > 0 && i < a0.length - 1 ? { r: R } : {}) }))).pts;
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(a.map(p => new THREE.Vector3(p.x, p.y, 0.05))), new THREE.LineBasicMaterial({ color: 0xd4a64a })); sm.scene.add(line); };
  const cancel = () => { pts = []; cur = null; clear(); };
  const finish = () => {
    const u = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1e-6);
    const R = project.meta.defaultRadius; if (R > 0) u.forEach((p, i) => { if (i > 0 && i < u.length - 1) p.r = R; }); // bends are added automatically
    if (u.length >= 2) { history.record(); selection.set(project.add(create(project.newId(), u)).id); }
    cancel(); setTool('select');
  };
  onClick(dom, e => { if (state.tool !== tool) return; const p = sm.groundPoint(e); if (p) { pts.push({ x: snap(p.x), y: snap(p.y), z: 0 }); draw(); } });
  dom.addEventListener('dblclick', () => { if (state.tool === tool && pts.length) finish(); });
  dom.addEventListener('pointermove', e => { if (state.tool !== tool || !pts.length) return; const p = sm.groundPoint(e); if (p) { cur = { x: snap(p.x), y: snap(p.y) }; draw(); } });
  addEventListener('keydown', e => { if (state.tool !== tool) return; if (e.key === 'Enter') finish(); else if (e.key === 'Escape') { cancel(); setTool('select'); } });
  bus.on('tool', t => { if (t !== tool) cancel(); });
}
