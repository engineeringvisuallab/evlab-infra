import * as THREE from 'three';
import { terrainMesh } from '../models/terrain.js';
export function buildTerrain(o, sel) {
  const g = new THREE.Group(), { idx, stats } = terrainMesh(o), pos = new Float32Array(o.points.length * 3), col = new Float32Array(o.points.length * 3);
  const lo = new THREE.Color(0x2f6f4e), hi = new THREE.Color(0xb59a6a), c = new THREE.Color(); // elevation tint only; not a data classification
  o.points.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); c.copy(lo).lerp(hi, stats.maxZ > stats.minZ ? (p.z - stats.minZ) / (stats.maxZ - stats.minZ) : 0.5); col.set([c.r, c.g, c.b], i * 3); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, emissive: sel ? 0x332200 : 0 }));
  m.receiveShadow = true; m.userData.id = o.id; g.add(m);
  if (sel) g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xd4a64a, transparent: true, opacity: 0.35 })));
  return g;
}
