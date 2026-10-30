import * as THREE from 'three';
import { fmt } from '../core/units.js';
import { onClick, snapper } from './tool-utils.js';
// Click two points (object surface, else ground plane). Reports 3D, horizontal and vertical distance.
export function initMeasureTool({ sm, state, bus, setTool }) {
  const dom = sm.renderer.domElement, snap = snapper(state); let pts = [], grp = null;
  const clear = () => { if (grp) { sm.scene.remove(grp); grp.traverse(x => { x.geometry?.dispose(); x.material?.map?.dispose(); x.material?.dispose(); }); grp = null; } };
  const point = e => { const h = sm.pick(e); if (h) return h.point.clone(); const p = sm.groundPoint(e); return p ? new THREE.Vector3(snap(p.x), snap(p.y), 0) : null; };
  function draw() {
    clear(); grp = new THREE.Group();
    grp.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: 0xd4a64a, size: 9, sizeAttenuation: false, depthTest: false })));
    if (pts.length === 2) {
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xd4a64a, depthTest: false })));
      const d = pts[0].distanceTo(pts[1]), c = document.createElement('canvas'); c.width = 160; c.height = 40; const x = c.getContext('2d');
      x.font = 'bold 26px sans-serif'; x.fillStyle = '#facc15'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(fmt(d, state.units, 2), 80, 20);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true })), k = Math.max(d * 0.12, 1.5);
      sp.position.copy(pts[0]).add(pts[1]).multiplyScalar(0.5); sp.scale.set(k * 4, k, 1); grp.add(sp);
    }
    sm.scene.add(grp);
  }
  const reset = () => { pts = []; clear(); bus.emit('measure', ''); };
  onClick(dom, e => {
    if (state.tool !== 'measure') return; const p = point(e); if (!p) return;
    if (pts.length === 2) reset(); pts.push(p); draw();
    if (pts.length === 2) { const [a, b] = pts; bus.emit('measure', `Distance ${fmt(a.distanceTo(b), state.units)} · horizontal ${fmt(Math.hypot(b.x - a.x, b.y - a.y), state.units)} · vertical ${fmt(b.z - a.z, state.units)}`); }
  });
  addEventListener('keydown', e => { if (state.tool === 'measure' && e.key === 'Escape') { reset(); setTool('select'); } });
  bus.on('tool', t => { if (t !== 'measure') reset(); });
}
