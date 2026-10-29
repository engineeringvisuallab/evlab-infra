import { validateObject } from '../models/registry.js';
import { newMeta } from './project.js';
export const FORMAT = 'evlab-infra-project', SCHEMA = 1;
export const serialize = p => JSON.stringify({ format: FORMAT, schema: SCHEMA, ...JSON.parse(p.snapshot()) }, null, 2);
export function parse(text) {
  let d; try { d = JSON.parse(text); } catch (e) { throw new Error('This file is not valid JSON: ' + e.message); }
  if (!d || d.format !== FORMAT) throw new Error('This is not an EVLab Infra project file.');
  if (d.schema > SCHEMA) throw new Error(`File schema ${d.schema} is newer than this app supports (${SCHEMA}).`);
  if (!Array.isArray(d.objects)) throw new Error('Project file has no objects list.');
  const byId = new Map();
  d.objects.forEach((o, i) => {
    const errs = validateObject(o);
    if (errs.length) throw new Error(`Object ${i + 1}${o && o.id ? ' (' + o.id + ')' : ''}: ${errs[0]}${/unsupported/.test(errs[0]) ? '. Nothing was loaded, so no data is lost.' : ''}`);
    if (byId.has(o.id)) throw new Error(`Duplicate object ID ${o.id}.`); byId.set(o.id, o);
  });
  d.objects.filter(o => o.type === 'pipe').forEach(o => {
    for (const k of ['fromId', 'toId']) if (!byId.get(o[k]) || byId.get(o[k]).type !== 'node') throw new Error(`Pipe ${o.id} refers to a missing node (${o[k]}).`);
  });
  const nums = d.objects.map(o => +(/^OBJ-(\d+)$/.exec(o.id) || [0, 0])[1]);
  return { meta: { ...newMeta(), ...(d.meta || {}), units: 'm' }, objects: d.objects, nextId: Math.max(+d.nextId || 1, ...nums.map(n => n + 1)) };
}
