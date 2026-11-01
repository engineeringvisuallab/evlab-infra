// Large projected coordinates (e.g. UTM, over 100 000) are re-centered so the local model stays small and precise.
// The origin is stored in the project (meta.projOrigin) and added back by LandXML export.
export function localize(points, { origin = null, hasObjects = false } = {}) {
  let off = { x: 0, y: 0 };
  if (points.length) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y), big = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs)) > 1e5;
    if (origin) off = origin;
    else if (big) { if (hasObjects) throw new Error('This data uses large (projected) coordinates. Import it into a new, empty project so the local origin can be set.');
      off = { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.round((Math.min(...ys) + Math.max(...ys)) / 2) }; }
  }
  return { points: points.map(p => ({ ...p, x: +(p.x - off.x).toFixed(4), y: +(p.y - off.y).toFixed(4) })), origin: off, originSet: !origin && (off.x !== 0 || off.y !== 0) };
}
