// Generic reference block: a plain box used to test the editor. NOT an engineering element.
import { N, checkSchema } from './schema.js';
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('x', 'X (m)', -1e6, 1e6), N('y', 'Y (m)', -1e6, 1e6),
  N('z', 'Base elevation Z (m)', -1e4, 1e4), N('width', 'Width (m)', 0.01, 1e4), N('length', 'Length (m)', 0.01, 1e4),
  N('height', 'Height (m)', 0.01, 1e4), N('rotation', 'Rotation about Z (deg)', -360, 360), { k: 'color', l: 'Color', t: 'color' }];
export const createBlock = (id, x, y) => ({ id, name: 'Reference block', category: 'project', type: 'block',
  x, y, z: 0, width: 10, length: 10, height: 3, rotation: 0, color: '#10b981' });
export const validate = o => checkSchema(schema, o);
