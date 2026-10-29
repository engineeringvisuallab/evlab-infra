export function onClick(dom, fn) {
  let d = null;
  dom.addEventListener('pointerdown', e => { if (e.button === 0) d = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('pointerup', e => { if (d && e.target === dom && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) fn(e); d = null; });
}
export const snapper = s => v => s.snap ? Math.round(v / s.gridSize) * s.gridSize : v;
