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
  const cr = { ...newMeta().crossing, ...((d.meta && d.meta.crossing) || {}) };
  if ((cr.minClearance !== null && !Number.isFinite(cr.minClearance)) || typeof cr.assumptions !== 'string' || !cr.checklist || typeof cr.checklist !== 'object') throw new Error('Crossing settings in the file are invalid.');
  const geo = { ...newMeta().geo, ...((d.meta && d.meta.geo) || {}) };
  for (const [k, lim] of [['originLon', 180], ['originLat', 90]]) if (geo[k] !== null && (!Number.isFinite(geo[k]) || Math.abs(geo[k]) > lim)) throw new Error(`Geographic origin in the file is invalid (${k}).`);
  const projOrigin = d.meta && d.meta.projOrigin !== undefined ? d.meta.projOrigin : null;
  if (projOrigin !== null && !(projOrigin && Number.isFinite(projOrigin.x) && Number.isFinite(projOrigin.y) && Math.abs(projOrigin.x) < 1e9 && Math.abs(projOrigin.y) < 1e9)) throw new Error('Projected origin in the file is invalid.');
  const units = d.meta && d.meta.units !== undefined ? d.meta.units : 'm';
  if (units !== 'm' && units !== 'ft') throw new Error(`Unsupported display units "${units}" (use m or ft).`);
  const nums = d.objects.map(o => +(/^OBJ-(\d+)$/.exec(o.id) || [0, 0])[1]);
  return { meta: { ...newMeta(), ...(d.meta || {}), crossing: cr, geo, projOrigin, units }, objects: d.objects, nextId: Math.max(+d.nextId || 1, ...nums.map(n => n + 1)) };
}
