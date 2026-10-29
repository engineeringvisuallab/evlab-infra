import * as THREE from 'three';
import { nodeZ, pipeLength } from '../models/pipe.js';
const mat = (color, sel) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: sel ? 0x886600 : 0x000000 });
export function buildNode(o, sel) {
  const g = new THREE.Group(), z = nodeZ(o); let geo, color, rot = 0;
  switch (o.nodeType) {
    case 'Valve': geo = new THREE.BoxGeometry(1.2, 1.2, 1.2); color = 0xf87171; break;
    case 'Pump': geo = new THREE.CylinderGeometry(0.8, 0.8, 1.4, 20); color = 0xfb923c; rot = Math.PI / 2; break;
    case 'Reservoir': geo = new THREE.CylinderGeometry(3, 3, 4, 28); color = 0x22d3ee; rot = Math.PI / 2; break;
    default: geo = new THREE.SphereGeometry(0.6, 20, 14); color = 0x38bdf8;
  }
  const m = new THREE.Mesh(geo, mat(color, sel)); m.rotation.x = rot; m.position.set(o.x, o.y, z); m.castShadow = true; m.userData.id = o.id; g.add(m);
  if (o.invert != null && o.groundLevel != null)
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x, o.y, o.invert), new THREE.Vector3(o.x, o.y, o.groundLevel)]), new THREE.LineBasicMaterial({ color: 0xd4a64a })));
  return g;
}
export function buildPipe(o, project, sel) {
  const g = new THREE.Group(), a = project.get(o.fromId), b = project.get(o.toId); if (!a || !b) return g;
  const A = new THREE.Vector3(a.x, a.y, nodeZ(a)), B = new THREE.Vector3(b.x, b.y, nodeZ(b)), len = A.distanceTo(B); if (len < 1e-6) return g;
  const r = Math.max(o.diameter / 2000, 0.03), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat(0x60a5fa, sel));
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true; m.userData.id = o.id; g.add(m); return g;
}
