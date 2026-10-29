import * as THREE from 'three';
import { createRoad } from '../models/road.js';
import { onClick, snapper } from './tool-utils.js';
export function initDrawRoadTool({ sm, project, history, selection, state, bus, setTool }) {
  const dom = sm.renderer.domElement, snap = snapper(state); let pts = [], cur = null, line = null;
  const clear = () => { if (line) { sm.scene.remove(line); line.geometry.dispose(); line.material.dispose(); line = null; } };
  const draw = () => { clear(); if (!pts.length) return; const a = cur ? [...pts, cur] : pts;
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(a.map(p => new THREE.Vector3(p.x, p.y, 0.05))), new THREE.LineBasicMaterial({ color: 0xd4a64a })); sm.scene.add(line); };
  const cancel = () => { pts = []; cur = null; clear(); };
  const finish = () => {
    const u = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1e-6);
    if (u.length >= 2) { history.record(); selection.set(project.add(createRoad(project.newId(), u)).id); }
    cancel(); setTool('select');
  };
  onClick(dom, e => { if (state.tool !== 'road') return; const p = sm.groundPoint(e); if (p) { pts.push({ x: snap(p.x), y: snap(p.y), z: 0 }); draw(); } });
  dom.addEventListener('dblclick', () => { if (state.tool === 'road' && pts.length) finish(); });
  dom.addEventListener('pointermove', e => { if (state.tool !== 'road' || !pts.length) return; const p = sm.groundPoint(e); if (p) { cur = { x: snap(p.x), y: snap(p.y) }; draw(); } });
  addEventListener('keydown', e => { if (state.tool !== 'road') return; if (e.key === 'Enter') finish(); else if (e.key === 'Escape') { cancel(); setTool('select'); } });
  bus.on('tool', t => { if (t !== 'road') cancel(); });
}
