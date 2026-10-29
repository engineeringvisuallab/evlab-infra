import * as THREE from 'three';
import { buildRoad } from '../geometry/road-geometry.js';
import { buildNode, buildPipe } from '../geometry/pipe-geometry.js';
function buildBlock(o, sel) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(o.width, o.length, o.height), new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.7 }));
  m.position.set(o.x, o.y, o.z + o.height / 2); m.rotation.z = THREE.MathUtils.degToRad(o.rotation); m.castShadow = m.receiveShadow = true; m.userData.id = o.id;
  if (sel) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xd4a64a })));
  return m;
}
export function initObjectSync({ sm, project, selection, bus }) {
  const names = ['project', 'roads', 'pipelines', 'junctions'];
  const dispose = c => c.traverse(x => { x.geometry?.dispose(); const m = x.material; if (m) { m.map?.dispose(); m.dispose(); } });
  function sync() {
    for (const n of names) for (const c of [...sm.layers[n].children]) { dispose(c); sm.layers[n].remove(c); }
    for (const o of project.objects) {
      const sel = o.id === selection.id;
      const obj = o.type === 'block' ? buildBlock(o, sel) : o.type === 'road' ? buildRoad(o, sel) : o.type === 'node' ? buildNode(o, sel) : o.type === 'pipe' ? buildPipe(o, project, sel) : null;
      if (obj) sm.layers[o.category]?.add(obj);
    }
  }
  bus.on('model-changed', sync); bus.on('selection', sync); sync();
}
