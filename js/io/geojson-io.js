// GeoJSON import/export with EXPLICIT coordinate handling.
// 'local': x/y are project metres (not lon/lat; marked with a legacy crs member). 'geographic': lon/lat via a local tangent-plane
// approximation around a user-given origin. Valid for small areas only (a few km); not a projected CRS and not survey-grade.
import { createRoad } from '../models/road.js';
import { createWatercourse } from '../models/watercourse.js';
import { createNode } from '../models/pipe.js';
import { validateObject } from '../models/registry.js';
import { toGeo, fromGeo, checkOrigin } from '../core/coordinates.js';
export function toGeoJSON(project, { mode, origin }) {
  if (mode === 'geographic') checkOrigin(origin);
  const c = (x, y, z) => { const xy = mode === 'geographic' ? toGeo(x, y, origin).map(v => +v.toFixed(8)) : [+x.toFixed(3), +y.toFixed(3)]; return z == null ? xy : [...xy, +z.toFixed(3)]; };
  const features = [], skipped = [];
  for (const o of project.objects) {
    let g;
    if (o.type === 'terrain') g = { type: 'MultiPoint', coordinates: o.points.map(p => c(p.x, p.y, p.z)) };
    else if (o.points) g = { type: 'LineString', coordinates: o.points.map(p => c(p.x, p.y, p.z)) };
    else if (o.type === 'pipe') { const a = project.get(o.fromId), b = project.get(o.toId); if (!a || !b) { skipped.push(`${o.id}: connected node missing`); continue; }
      g = { type: 'LineString', coordinates: [a, b].map(n => c(n.x, n.y, n.invert ?? n.groundLevel ?? null)) }; }
    else g = { type: 'Point', coordinates: c(o.x, o.y, o.type === 'node' ? (o.invert ?? o.groundLevel ?? null) : o.z) };
    const properties = Object.fromEntries(Object.entries(o).filter(([k, v]) => k !== 'points' && k !== 'x' && k !== 'y' && (v === null || typeof v !== 'object')));
    if (o.points && o.type !== 'terrain' && o.points.some(p => p.r > 0)) properties.curveRadii = o.points.map(p => p.r ?? null); // curve radii travel with the control points
    features.push({ type: 'Feature', geometry: g, properties });
  }
  const geojson = { type: 'FeatureCollection', ...(mode === 'local' ? { crs: { type: 'name', properties: { name: 'LOCAL-ENG' } } } : {}),
    evlab: { coordinateMode: mode, origin: mode === 'geographic' ? origin : null,
      note: mode === 'local' ? 'Coordinates are local engineering metres, NOT longitude/latitude.' : 'Approximate local tangent-plane conversion around the origin; small areas only; not survey-grade.' }, features };
  return { geojson, skipped };
}
export function fromGeoJSON(text, { mode, origin, lineAs, newId }) {
  let d; try { d = JSON.parse(text); } catch (e) { throw new Error('This file is not valid JSON: ' + e.message); }
  if (d && d.type === 'Feature') d = { type: 'FeatureCollection', features: [d] };
  if (!d || d.type !== 'FeatureCollection' || !Array.isArray(d.features)) throw new Error('Expected a GeoJSON FeatureCollection.');
  if (mode === 'geographic') checkOrigin(origin);
  const objects = [], skipped = [], warnings = [], declared = d.crs && d.crs.properties && d.crs.properties.name;
  if (declared && mode === 'geographic') warnings.push(`File declares CRS "${declared}"; it was treated as longitude/latitude as you chose.`);
  if (declared && mode === 'local') warnings.push(`File declares CRS "${declared}"; it was treated as local metres as you chose.`);
  const conv = c => {
    if (!Array.isArray(c) || c.length < 2 || !c.every(Number.isFinite)) throw new Error('invalid coordinate');
    if (mode === 'geographic') { if (Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) throw new Error('longitude/latitude out of range (is this file really geographic?)');
      const [x, y] = fromGeo(c[0], c[1], origin); return { x: +x.toFixed(3), y: +y.toFixed(3), z: c.length > 2 ? c[2] : 0 }; }
    return { x: c[0], y: c[1], z: c.length > 2 ? c[2] : 0 };
  };
  d.features.forEach((f, i) => {
    const g = f && f.geometry, tag = `Feature ${i + 1}`; if (!g || !g.type) { skipped.push(`${tag}: no geometry`); return; }
    try {
      let o;
      if (g.type === 'Point') { const p = conv(g.coordinates); o = createNode(newId(), 'Junction', p.x, p.y); if (g.coordinates.length > 2) o.groundLevel = p.z; }
      else if (g.type === 'LineString') {
        o = (lineAs === 'watercourse' ? createWatercourse : createRoad)(newId(), g.coordinates.map(conv));
        const cr = f.properties && f.properties.curveRadii; if (Array.isArray(cr) && cr.length === o.points.length) cr.forEach((r, k) => { if (Number.isFinite(r) && r > 0) o.points[k].r = r; });
      }
      else { skipped.push(`${tag}: geometry type ${g.type} is not supported`); return; }
      const nm = f.properties && f.properties.name; if (typeof nm === 'string' && nm.trim()) o.name = nm.trim();
      const errs = validateObject(o); if (errs.length) throw new Error(errs[0]); objects.push(o);
    } catch (e) { skipped.push(`${tag}: ${e.message}`); }
  });
  return { objects, skipped, warnings };
}
