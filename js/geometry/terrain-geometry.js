import * as THREE from 'three';
import { terrainMesh, triangleSlopeDeg } from '../models/terrain.js';
import { contourSegments } from '../models/contours.js';
const LO = new THREE.Color(0x2f6f4e), HI = new THREE.Color(0xb59a6a), PLAIN = new THREE.Color(0x7c8a6a), GREEN = new THREE.Color(0x3fa66b), YELLOW = new THREE.Color(0xe0c341), RED = new THREE.Color(0xd9534f);
// Slope colour: flat = green, 22 degrees = yellow, 45 degrees or steeper = red. Elevation tint is only a visual aid.
export const slopeColor = deg => { const t = Math.min(deg / 45, 1); return t < 0.5 ? GREEN.clone().lerp(YELLOW, t * 2) : YELLOW.clone().lerp(RED, (t - 0.5) * 2); };
export function buildTerrain(o, sel) {
  const g = new THREE.Group(), { idx, stats } = terrainMesh(o), P = o.points, tri = idx.length / 3, pos = new Float32Array(tri * 9), col = new Float32Array(tri * 9), shading = o.shading || 'Elevation';
  const elev = z => LO.clone().lerp(HI, stats.maxZ > stats.minZ ? (z - stats.minZ) / (stats.maxZ - stats.minZ) : 0.5);
  for (let t = 0; t < tri; t++) {
    const v = [P[idx[3 * t]], P[idx[3 * t + 1]], P[idx[3 * t + 2]]], sc = shading === 'Slope' ? slopeColor(triangleSlopeDeg(...v)) : null;
    v.forEach((p, j) => { pos.set([p.x, p.y, p.z], t * 9 + j * 3); const c = sc || (shading === 'Plain' ? PLAIN : elev(p.z)); col.set([c.r, c.g, c.b], t * 9 + j * 3); });
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, emissive: sel ? 0x332200 : 0 }));
  m.receiveShadow = true; m.userData.id = o.id; g.add(m);
  if (o.contourInterval) {
    const { segs } = contourSegments(o, o.contourInterval);
    if (segs.length) {
      const p = new Float32Array(segs.length * 6), c = new Float32Array(segs.length * 6), minor = new THREE.Color(0xe2e8f0), major = new THREE.Color(0xfacc15);
      segs.forEach((s, i) => { const z = s[4] * o.contourInterval + 0.03, cc = s[4] % 5 === 0 ? major : minor; p.set([s[0], s[1], z, s[2], s[3], z], i * 6); c.set([cc.r, cc.g, cc.b, cc.r, cc.g, cc.b], i * 6); });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(p, 3)); lg.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true })));
    }
  }
  if (sel) g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xd4a64a, transparent: true, opacity: 0.35 })));
  return g;
}
