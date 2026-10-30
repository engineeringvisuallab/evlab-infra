import * as block from './block.js';
import * as road from './road.js';
import * as bridge from './bridge.js';
import * as culvert from './culvert.js';
import * as wc from './watercourse.js';
import * as terrain from './terrain.js';
import { alignment } from './alignment.js';
import { nodeSchema, pipeSchema, validateNode, validatePipe, pipeLength } from './pipe.js';
export const GRADE_HEURISTIC_PCT = 12;
export const TYPES = {
  block: { schema: block.schema, validate: block.validate }, road: { schema: road.schema, validate: road.validate },
  bridge: { schema: bridge.schema, validate: bridge.validate }, culvert: { schema: culvert.schema, validate: culvert.validate },
  watercourse: { schema: wc.schema, validate: wc.validate }, terrain: { schema: terrain.schema, validate: terrain.validate },
  node: { schema: nodeSchema, validate: validateNode }, pipe: { schema: pipeSchema, validate: validatePipe }
};
export const validateObject = o => { const t = o && TYPES[o.type]; return t ? t.validate(o) : [`unsupported type "${o && o.type}"`]; };
// Non-fatal warnings about missing or inconsistent attributes
export function collectWarnings(project) {
  const w = [], add = (o, m) => w.push({ id: o.id, msg: `${o.id}: ${m}` });
  const used = new Set(); project.objects.forEach(o => { if (o.type === 'pipe') { used.add(o.fromId); used.add(o.toId); } });
  for (const o of project.objects) {
    if (o.type === 'node') {
      if (o.invert == null) add(o, 'invert level not set (drawn at ground level or 0)');
      if (o.groundLevel == null) add(o, 'ground level not set');
      if (o.invert != null && o.groundLevel != null && o.invert > o.groundLevel) add(o, 'invert is above ground level');
      if (!o.assetId) add(o, 'asset ID missing');
      if (!used.has(o.id)) add(o, 'node has no connected pipes');
    } else if (o.type === 'bridge') {
      const u = o.z - o.deckThickness;
      if (o.groundLevel == null) add(o, 'ground level not set: supports not drawn'); else if (u - o.groundLevel <= 0.01) add(o, 'ground level is at or above the deck underside');
      if (o.waterLevel != null && o.clearanceRequired != null && u - o.waterLevel < o.clearanceRequired) add(o, 'clearance below the entered requirement');
    } else if (o.type === 'road' || o.type === 'watercourse') {
      const s = road.roadStats(o.points);
      alignment(o.points).curves.filter(c => c.clamped).forEach(c => add(o, `curve at point ${c.index + 1}: radius reduced from ${c.requested} m to ${c.radius.toFixed(2)} m to fit the adjacent segments`));
      if (o.points.some((p, i) => p.r > 0 && (i === 0 || i === o.points.length - 1))) add(o, 'a curve radius on an end point is ignored');
      if (o.points.some((p, i) => i && Math.hypot(p.x - o.points[i - 1].x, p.y - o.points[i - 1].y) < 1e-6)) add(o, 'duplicate consecutive control points (zero-length segment)');
      if (o.type === 'road' && s.maxGradePct > GRADE_HEURISTIC_PCT) add(o, `max segment grade ${s.maxGradePct.toFixed(1)}% exceeds ${GRADE_HEURISTIC_PCT}% (simple heuristic, not a design standard)`);
    } else if (o.type === 'terrain') {
      const d = terrain.terrainMesh(o).dupes; if (d) add(o, `${d} duplicate point(s) ignored`);
    } else if (o.type === 'pipe') {
      if (o.material === 'Unspecified') add(o, 'material unspecified');
      if (!o.assetId) add(o, 'asset ID missing');
      const L = pipeLength(o, project);
      if (!L) add(o, 'connected node is missing'); else if (L.len3d < 0.01) add(o, 'pipe has zero length');
    }
  }
  const dup = new Map(); project.objects.forEach(o => { if ((o.type === 'node' || o.type === 'pipe') && o.assetId) dup.set(o.assetId, [...(dup.get(o.assetId) || []), o]); });
  dup.forEach((list, k) => { if (list.length > 1) list.forEach(o => add(o, `asset ID "${k}" is used by ${list.length} objects`)); });
  return w;
}
