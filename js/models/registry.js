import * as block from './block.js';
import * as road from './road.js';
import { nodeSchema, pipeSchema, validateNode, validatePipe, pipeLength } from './pipe.js';
export const TYPES = {
  block: { schema: block.schema, validate: block.validate }, road: { schema: road.schema, validate: road.validate },
  node: { schema: nodeSchema, validate: validateNode }, pipe: { schema: pipeSchema, validate: validatePipe }
};
export const validateObject = o => { const t = o && TYPES[o.type]; return t ? t.validate(o) : [`unsupported type "${o && o.type}"`]; };
// Non-fatal warnings about missing or inconsistent attributes
export function collectWarnings(project) {
  const w = [], add = (o, m) => w.push({ id: o.id, msg: `${o.id}: ${m}` });
  for (const o of project.objects) {
    if (o.type === 'node') {
      if (o.invert == null) add(o, 'invert level not set (drawn at ground level or 0)');
      if (o.groundLevel == null) add(o, 'ground level not set');
      if (o.invert != null && o.groundLevel != null && o.invert > o.groundLevel) add(o, 'invert is above ground level');
      if (!o.assetId) add(o, 'asset ID missing');
    } else if (o.type === 'pipe') {
      if (o.material === 'Unspecified') add(o, 'material unspecified');
      if (!o.assetId) add(o, 'asset ID missing');
      const L = pipeLength(o, project);
      if (!L) add(o, 'connected node is missing'); else if (L.len3d < 0.01) add(o, 'pipe has zero length');
    }
  }
  return w;
}
