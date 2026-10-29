import * as THREE from 'three';
import { createNode, createPipe, nodeZ } from '../models/pipe.js';
import { onClick, snapper } from './tool-utils.js';
export function initDrawPipeTool({ sm, project, history, selection, state, bus, setTool }) {
  const dom = sm.renderer.domElement, snap = snapper(state); let startId = null, line = null;
  const clear = () => { if (line) { sm.scene.remove(line); line.geometry.dispose(); line.material.dispose(); line = null; } };
  const end = () => { startId = null; clear(); setTool('select'); };
  onClick(dom, e => {
    if (state.tool !== 'pipe') return;
    const h = sm.pick(e), hit = h && project.get(h.object.userData.id), nodeHit = hit && hit.type === 'node' ? hit.id : null, p = sm.groundPoint(e);
    if (!nodeHit && !p) return; if (nodeHit && nodeHit === startId) return;
    if (!nodeHit || startId) history.record(); // one undo step per click
    const id = nodeHit || project.add(createNode(project.newId(), 'Junction', snap(p.x), snap(p.y))).id;
    if (startId) project.add(createPipe(project.newId(), startId, id));
    startId = id; selection.set(id);
  });
  dom.addEventListener('pointermove', e => {
    if (state.tool !== 'pipe' || !startId) return; const p = sm.groundPoint(e), a = project.get(startId); if (!p || !a) return; clear();
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, a.y, nodeZ(a)), new THREE.Vector3(snap(p.x), snap(p.y), nodeZ(a))]), new THREE.LineBasicMaterial({ color: 0xd4a64a })); sm.scene.add(line);
  });
  dom.addEventListener('dblclick', () => { if (state.tool === 'pipe') end(); });
  addEventListener('keydown', e => { if (state.tool === 'pipe' && (e.key === 'Enter' || e.key === 'Escape')) end(); });
  bus.on('tool', t => { if (t !== 'pipe') { startId = null; clear(); } });
}
