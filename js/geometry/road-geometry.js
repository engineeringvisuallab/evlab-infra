import * as THREE from 'three';
import { chainage, fmtStation } from '../models/road.js';
import { CONFIG } from '../config.js';
const line = (pts, mat) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), mat);
function label(text) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d');
  x.font = 'bold 22px sans-serif'; x.fillStyle = '#e2e8f0'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 16);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
}
export function buildRoad(o, sel, stations = true) {
  const g = new THREE.Group(), P = o.points, n = P.length, hw = o.width / 2, t = o.thickness;
  const tan = P.map((p, i) => { const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, n - 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; });
  const v = [], left = [], right = [];
  P.forEach((p, i) => { const nx = -tan[i][1] * hw, ny = tan[i][0] * hw;
    v.push(p.x + nx, p.y + ny, p.z, p.x - nx, p.y - ny, p.z, p.x + nx, p.y + ny, p.z - t, p.x - nx, p.y - ny, p.z - t);
    left.push([p.x + nx, p.y + ny, p.z + 0.03]); right.push([p.x - nx, p.y - ny, p.z + 0.03]); });
  const idx = [], quad = (p, q, r, s) => idx.push(p, q, r, q, s, r);
  for (let i = 0; i < n - 1; i++) { const a = i * 4, b = a + 4; quad(a, a + 1, b, b + 1); quad(a + 2, a + 3, b + 2, b + 3); quad(a, a + 2, b, b + 2); quad(a + 1, a + 3, b + 1, b + 3); }
  const e = (n - 1) * 4; idx.push(0, 1, 2, 1, 3, 2, e, e + 1, e + 2, e + 1, e + 3, e + 2);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: o.color, side: THREE.DoubleSide, roughness: 0.9 }));
  mesh.castShadow = mesh.receiveShadow = true; mesh.userData.id = o.id; g.add(mesh);
  const edge = new THREE.LineBasicMaterial({ color: sel ? 0xd4a64a : 0xe2e8f0 });
  g.add(line(left, edge), line(right, edge));
  if (sel) { // draggable control-point handles (Select tool)
    const r = Math.max(hw * 0.3, 0.5);
    P.forEach((p, i) => { const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd4a64a, depthTest: false }));
      h.position.set(p.x, p.y, p.z + 0.3); h.renderOrder = 10; h.userData.id = o.id; h.userData.handle = i; g.add(h); });
  }
  const cl = line(P.map(p => [p.x, p.y, p.z + 0.04]), new THREE.LineDashedMaterial({ color: 0xd4a64a, dashSize: 1, gapSize: 0.5 })); cl.computeLineDistances(); g.add(cl);
  if (!stations) return g;
  // station markers (chainage measured along the plan view)
  const c = chainage(P), L = c[n - 1]; let step = CONFIG.stationInterval; while (L / step > 300) step *= 2;
  const k = Math.max(hw * 0.5, 1.5);
  for (let s = 0, seg = 0; s <= L + 1e-9; s += step) {
    while (seg < n - 2 && c[seg + 1] < s) seg++;
    const len = c[seg + 1] - c[seg] || 1, f = Math.min(Math.max((s - c[seg]) / len, 0), 1), a = P[seg], b = P[seg + 1];
    const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, z = a.z + (b.z - a.z) * f + 0.05, dx = (b.x - a.x) / len, dy = (b.y - a.y) / len;
    g.add(line([[x - dy * hw, y + dx * hw, z], [x + dy * hw, y - dx * hw, z]], new THREE.LineBasicMaterial({ color: 0x10b981 })));
    const sp = label(fmtStation(s)); sp.position.set(x - dy * (hw + k), y + dx * (hw + k), z + 0.5); sp.scale.set(k * 4, k, 1); g.add(sp);
  }
  return g;
}
