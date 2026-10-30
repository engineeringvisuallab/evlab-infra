// Conceptual watercourse alignment: control points (x, y, z = bed level). Not survey data.
import { N, checkSchema } from './schema.js';
import { checkPoints } from './road.js';
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('width', 'Channel width (m)', 0.5, 1000), { k: 'color', l: 'Color', t: 'color' }];
export const createWatercourse = (id, points) => ({ id, name: 'Watercourse', category: 'watercourses', type: 'watercourse', width: 6, color: '#2563eb', points });
export const validate = o => [...checkSchema(schema, o), ...checkPoints(o)];
