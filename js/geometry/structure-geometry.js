import * as THREE from 'three';
function frame(o, sel) {
  const g = new THREE.Group(); g.position.set(o.x, o.y, 0); g.rotation.z = THREE.MathUtils.degToRad(o.rotation);
  g.box = (sx, sy, sz, cx, cy, cz, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: sel ? 0x886600 : 0 }));
    m.position.set(cx, cy, cz); m.castShadow = m.receiveShadow = true; m.userData.id = o.id; g.add(m); };
  return g;
}
export function buildBridge(o, sel) {
  const g = frame(o, sel), u = o.z - o.deckThickness; g.box(o.length, o.width, o.deckThickness, 0, 0, o.z - o.deckThickness / 2, o.color);
  if (o.groundLevel != null) {
    const h = u - o.groundLevel;
    if (h > 0.01) {
      const cz = o.groundLevel + h / 2, ab = o.abutmentThickness, c = 0x94a3b8;
      g.box(ab, o.width, h, -(o.length - ab) / 2, 0, cz, c); g.box(ab, o.width, h, (o.length - ab) / 2, 0, cz, c);
      for (let i = 1; i <= o.pierCount; i++) g.box(o.pierWidth, o.width * 0.5, h, -o.length / 2 + o.length * i / (o.pierCount + 1), 0, cz, c);
    }
  }
  return g;
}
export function buildCulvert(o, sel) {
  const g = frame(o, sel), { barrels: n, barrelWidth: bw, barrelHeight: bh, wallThickness: t, length: L } = o, W = n * bw + (n + 1) * t;
  g.box(L, W, t, 0, 0, o.z - t / 2, o.color); g.box(L, W, t, 0, 0, o.z + bh + t / 2, o.color);
  for (let i = 0; i <= n; i++) g.box(L, t, bh, 0, -W / 2 + t / 2 + i * (bw + t), o.z + bh / 2, o.color);
  return g;
}
