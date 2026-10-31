// LandXML 1.2 (subset): TIN surfaces <-> terrain, Line/Curve alignments with PVI profiles <-> roads/watercourses.
// LandXML coordinates are "northing easting [elevation]". Export is always metric. Spirals, pipe networks and other content are not supported.
import { parseXml, kids, kid, nums } from './xml-lite.js';
import { createTerrain, terrainMesh, MAX_POINTS } from '../models/terrain.js';
import { createRoad } from '../models/road.js';
import { createWatercourse } from '../models/watercourse.js';
import { alignmentElements } from '../models/alignment.js';
import { validateObject } from '../models/registry.js';
import { CONFIG } from '../config.js';
const FACTORS = { meter: 1, metre: 1, millimeter: 0.001, millimetre: 0.001, centimeter: 0.01, centimetre: 0.01, kilometer: 1000, kilometre: 1000, foot: 0.3048, ussurveyfoot: 1200 / 3937, inch: 0.0254, mile: 1609.344 };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export function exportLandXml(project) {
  const O = project.meta.projOrigin || { x: 0, y: 0 }, f = v => (+v).toFixed(4), NE = p => `${f(p.y + O.y)} ${f(p.x + O.x)}`, skipped = [], counts = { surfaces: 0, alignments: 0 };
  const surfaces = [], aligns = [];
  for (const o of project.objects) {
    if (o.type === 'terrain') {
      const { idx } = terrainMesh(o); counts.surfaces++;
      surfaces.push(`    <Surface name="${esc(o.name)}"><Definition surfType="TIN"><Pnts>\n${o.points.map((p, i) => `      <P id="${i + 1}">${f(p.y + O.y)} ${f(p.x + O.x)} ${f(p.z)}</P>`).join('\n')}\n      </Pnts><Faces>\n${Array.from({ length: idx.length / 3 }, (_, t) => `      <F>${idx[3 * t] + 1} ${idx[3 * t + 1] + 1} ${idx[3 * t + 2] + 1}</F>`).join('\n')}\n      </Faces></Definition></Surface>`);
    } else if (o.type === 'road' || o.type === 'watercourse') {
      const { elements, length, stations } = alignmentElements(o.points); counts.alignments++;
      const geom = elements.map(e => e.type === 'line' ? `        <Line length="${f(e.length)}"><Start>${NE(e.start)}</Start><End>${NE(e.end)}</End></Line>`
        : `        <Curve rot="${e.rot}" crvType="arc" length="${f(e.length)}" radius="${f(e.radius)}"><Start>${NE(e.start)}</Start><Center>${NE(e.center)}</Center><End>${NE(e.end)}</End><PI>${NE(e.pi)}</PI></Curve>`).join('\n');
      aligns.push(`    <Alignment name="${esc(o.name)}" length="${f(length)}" staStart="0.0000" desc="${o.type === 'road' ? 'Road' : 'Watercourse'} (EVLab Infra ${esc(o.id)})">\n      <CoordGeom>\n${geom}\n      </CoordGeom>\n      <Profile name="${esc(o.name)}"><ProfAlign name="Finish Grade">\n${o.points.map((p, i) => `        <PVI>${f(stations[i])} ${f(p.z)}</PVI>`).join('\n')}\n      </ProfAlign></Profile>\n    </Alignment>`);
    } else skipped.push(`${o.id} (${o.type}): not part of the supported LandXML subset`);
  }
  if (!surfaces.length && !aligns.length) throw new Error('Nothing to export: LandXML export covers terrain surfaces and road or watercourse alignments.');
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" version="1.2" date="${now.slice(0, 10)}" time="${now.slice(11, 19)}" language="English" readOnly="false">
  <Units><Metric areaUnit="squareMeter" linearUnit="meter" volumeUnit="cubicMeter" temperatureUnit="celsius" pressureUnit="HPA" diameterUnit="millimeter" angularUnit="decimal degrees" directionUnit="decimal degrees"/></Units>
  <Project name="${esc(project.meta.name)}"/>
  <Application name="EVLab Infra" desc="Preliminary infrastructure planning" manufacturer="Engineering Visual Lab" version="${esc(CONFIG.version)}"/>
${surfaces.length ? `  <Surfaces>\n${surfaces.join('\n')}\n  </Surfaces>\n` : ''}${aligns.length ? `  <Alignments>\n${aligns.join('\n')}\n  </Alignments>\n` : ''}</LandXML>
`;
  return { xml, counts, skipped };
}
export function importLandXml(text, { lineAs = 'road', newId, origin = null, hasObjects = false }) {
  const root = parseXml(text); if (root.name !== 'LandXML') throw new Error('This is not a LandXML file (the root element must be LandXML).');
  const warnings = [], skipped = []; let k = 1;
  const ue = (kid(root, 'Units') || { children: [] }).children[0];
  if (ue) { k = FACTORS[(ue.attrs.linearUnit || '').toLowerCase()]; if (!k) throw new Error(`Unsupported linear unit "${ue.attrs.linearUnit}".`); } else warnings.push('No Units element: coordinates were assumed to be metres.');
  const items = [];
  for (const s of kids(kid(root, 'Surfaces'), 'Surface')) {
    const name = s.attrs.name || 'Surface', def = kid(s, 'Definition');
    if (!def || (def.attrs.surfType || 'TIN') !== 'TIN') { skipped.push(`Surface "${name}": only TIN surfaces are supported`); continue; }
    const all = kids(kid(def, 'Pnts'), 'P').map(p => nums(p.text)), good = all.filter(a => a.length >= 3 && a.slice(0, 3).every(Number.isFinite));
    if (good.length < all.length) skipped.push(`Surface "${name}": ${all.length - good.length} point(s) without three numbers were skipped`);
    if (good.length < 3) { skipped.push(`Surface "${name}": needs at least 3 points`); continue; }
    if (good.length > MAX_POINTS) { skipped.push(`Surface "${name}": ${good.length} points exceed the limit of ${MAX_POINTS}; thin the data first`); continue; }
    if (kid(def, 'Faces')) warnings.push(`Surface "${name}": the given faces are ignored; the surface is rebuilt as a Delaunay TIN from the points.`);
    items.push({ kind: 'terrain', name, pts: good.map(a => ({ x: a[1] * k, y: a[0] * k, z: a[2] * k })) });
  }
  for (const a of kids(kid(root, 'Alignments'), 'Alignment')) {
    const name = a.attrs.name || 'Alignment';
    try {
      const els = (kid(a, 'CoordGeom') || { children: [] }).children.filter(c => ['Line', 'Curve', 'Spiral', 'IrregularLine', 'Chain'].includes(c.name)); if (!els.length) throw new Error('has no geometry');
      const bad = els.find(e => e.name !== 'Line' && e.name !== 'Curve'); if (bad) throw new Error(`contains a ${bad.name} (only Line and Curve are supported)`);
      const pt = (e, nm) => { const el = kid(e, nm); const v = el && nums(el.text); if (!v || v.length < 2 || !v.slice(0, 2).every(Number.isFinite)) throw new Error(`element ${e.name} has an invalid ${nm}`); return { x: v[1] * k, y: v[0] * k }; };
      let cum = (Number(a.attrs.staStart) || 0) * k; const V = [{ ...pt(els[0], 'Start'), sta: cum }];
      els.forEach((e, i) => {
        const next = els[i + 1], s = pt(e, 'Start'), en = pt(e, 'End');
        if (e.name === 'Line') { cum += e.attrs.length ? Number(e.attrs.length) * k : Math.hypot(en.x - s.x, en.y - s.y); if (!(next && next.name === 'Curve')) V.push({ ...en, sta: cum }); return; }
        if (next && next.name === 'Curve') throw new Error('curves that follow each other directly are not supported');
        const c = pt(e, 'Center'), r = (Number(e.attrs.radius) * k) || Math.hypot(s.x - c.x, s.y - c.y), ccw = (e.attrs.rot || '').toLowerCase() === 'ccw';
        let d = ccw ? Math.atan2(en.y - c.y, en.x - c.x) - Math.atan2(s.y - c.y, s.x - c.x) : Math.atan2(s.y - c.y, s.x - c.x) - Math.atan2(en.y - c.y, en.x - c.x); d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (d < 1e-6 || d > Math.PI * 0.99) throw new Error('a curve turns too little or too much for this model (limit about 178 degrees)');
        let pi; if (kid(e, 'PI')) pi = pt(e, 'PI'); else {
          const dir = (p, sgn) => { const vx = p.x - c.x, vy = p.y - c.y, l = Math.hypot(vx, vy) || 1; return ccw ? { x: -vy / l, y: vx / l } : { x: vy / l, y: -vx / l }; };
          const d1 = dir(s), d2 = dir(en), den = d1.x * d2.y - d1.y * d2.x; if (Math.abs(den) < 1e-9) throw new Error('cannot find the PI of a curve');
          const t1 = ((en.x - s.x) * d2.y - (en.y - s.y) * d2.x) / den; pi = { x: s.x + d1.x * t1, y: s.y + d1.y * t1 };
        }
        V.push({ ...pi, r, sta: cum + r * Math.tan(d / 2) }); cum += e.attrs.length ? Number(e.attrs.length) * k : r * d; if (!next) V.push({ ...en, sta: cum });
      });
      const prof = kids(a, 'Profile').flatMap(p => kids(p, 'ProfAlign'))[0];
      const pvis = prof ? prof.children.filter(c => ['PVI', 'ParaCurve', 'UnsymParaCurve', 'CircCurve'].includes(c.name)).map(c => nums(c.text)).filter(v => v.length >= 2 && v[0] === v[0] && v[1] === v[1]).map(v => ({ s: v[0] * k, z: v[1] * k })).sort((p, q) => p.s - q.s) : [];
      if (!pvis.length) warnings.push(`Alignment "${name}": no profile found, elevations were set to 0.`);
      let clamped = false; const zAt = s => { if (!pvis.length) return 0; if (s <= pvis[0].s) { clamped ||= s < pvis[0].s - 0.01; return pvis[0].z; } for (let j = 1; j < pvis.length; j++) if (s <= pvis[j].s) { const A = pvis[j - 1], B = pvis[j]; return A.z + (B.z - A.z) * (s - A.s) / ((B.s - A.s) || 1); } clamped = true; return pvis.at(-1).z; };
      const pts = []; for (const v of V) { const p = { x: v.x, y: v.y, z: zAt(v.sta) }; if (v.r) p.r = v.r; if (!pts.length || Math.hypot(p.x - pts.at(-1).x, p.y - pts.at(-1).y) > 1e-6) pts.push(p); }
      if (clamped) warnings.push(`Alignment "${name}": some stations lie outside the profile; end elevations were used. Vertical curves are treated as straight grades between PVIs.`);
      if (pts.length < 2) throw new Error('needs at least 2 distinct points'); items.push({ kind: 'alignment', name, pts });
    } catch (e) { skipped.push(`Alignment "${name}": ${e.message}`); }
  }
  let off = { x: 0, y: 0 }; const all = items.flatMap(i => i.pts);
  if (all.length) {
    const xs = all.map(p => p.x), ys = all.map(p => p.y), big = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs)) > 1e5;
    if (origin) off = origin; else if (big) { if (hasObjects) throw new Error('This file uses large (projected) coordinates. Import it into a new, empty project so the local origin can be set.');
      off = { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.round((Math.min(...ys) + Math.max(...ys)) / 2) }; }
  }
  const r4 = v => +v.toFixed(4), objects = [];
  for (const it of items) {
    const pts = it.pts.map(p => ({ ...p, x: r4(p.x - off.x), y: r4(p.y - off.y), z: r4(p.z), ...(p.r ? { r: r4(p.r) } : {}) }));
    const o = it.kind === 'terrain' ? createTerrain(newId(), pts) : (lineAs === 'watercourse' ? createWatercourse : createRoad)(newId(), pts); o.name = it.name;
    const errs = validateObject(o); if (errs.length) skipped.push(`${it.kind === 'terrain' ? 'Surface' : 'Alignment'} "${it.name}": ${errs[0]}`); else objects.push(o);
  }
  return { objects, warnings, skipped, origin: off, originSet: !origin && (off.x !== 0 || off.y !== 0) };
}
