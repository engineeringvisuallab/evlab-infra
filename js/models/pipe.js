// Water network model: nodes (junction/valve/pump/reservoir) and pipes between them. Geometry only, no hydraulics.
import { N, checkSchema } from './schema.js';
export const NODE_TYPES = ['Junction', 'Valve', 'Pump', 'Reservoir'];
export const PIPE_MATERIALS = ['Unspecified', 'HDPE', 'PVC', 'Ductile iron', 'Steel', 'Concrete'];
const asset = { k: 'assetId', l: 'Asset ID', t: 'text', nullable: true };
export const nodeSchema = [{ k: 'name', l: 'Name', t: 'text' }, { k: 'nodeType', l: 'Node type', t: 'select', opts: NODE_TYPES },
  N('x', 'X (m)', -1e6, 1e6), N('y', 'Y (m)', -1e6, 1e6), N('groundLevel', 'Ground level (m)', -1e4, 1e4, { nullable: true }),
  N('invert', 'Invert level (m)', -1e4, 1e4, { nullable: true }), asset];
export const pipeSchema = [{ k: 'name', l: 'Name', t: 'text' }, N('diameter', 'Diameter (mm)', 10, 5000),
  { k: 'material', l: 'Material', t: 'select', opts: PIPE_MATERIALS }, asset];
export const createNode = (id, nodeType, x, y) => ({ id, name: nodeType, category: 'junctions', type: 'node', nodeType, x, y, groundLevel: null, invert: null, assetId: '' });
export const createPipe = (id, fromId, toId) => ({ id, name: 'Pipe', category: 'pipelines', type: 'pipe', fromId, toId, diameter: 200, material: 'Unspecified', assetId: '' });
export const nodeZ = n => n.invert ?? n.groundLevel ?? 0; // elevation used for drawing and length
export const validateNode = o => checkSchema(nodeSchema, o);
export function validatePipe(o) {
  const e = checkSchema(pipeSchema, o);
  if (!o.fromId || !o.toId || o.fromId === o.toId) e.push('Pipe must connect two different nodes'); return e;
}
export function pipeLength(p, project) {
  const a = project.get(p.fromId), b = project.get(p.toId); if (!a || !b) return null;
  const plan = Math.hypot(b.x - a.x, b.y - a.y), dz = nodeZ(b) - nodeZ(a);
  return { plan, dz, len3d: Math.hypot(plan, dz) };
}
