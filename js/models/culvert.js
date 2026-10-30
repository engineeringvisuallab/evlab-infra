// Conceptual box culvert (barrels along local X = flow direction). No hydraulic capacity check.
import { N, checkSchema } from './schema.js';
export const MATERIALS = ['Reinforced concrete', 'Precast concrete', 'Corrugated steel', 'HDPE'];
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('x', 'X (m)', -1e6, 1e6), N('y', 'Y (m)', -1e6, 1e6),
  N('z', 'Barrel invert elevation (m)', -1e4, 1e4), N('length', 'Length (m)', 0.5, 500), N('rotation', 'Rotation about Z (deg)', -360, 360),
  N('barrels', 'Number of barrels', 1, 10, { int: true }), N('barrelWidth', 'Barrel width (m)', 0.1, 20), N('barrelHeight', 'Barrel height (m)', 0.1, 20),
  N('wallThickness', 'Wall thickness (m)', 0.05, 3), { k: 'material', l: 'Material', t: 'select', opts: MATERIALS },
  { k: 'color', l: 'Color', t: 'color' }, { k: 'assumptions', l: 'Assumptions', t: 'textarea', nullable: true }];
export const createCulvert = (id, x, y) => ({ id, name: 'Culvert', category: 'culverts', type: 'culvert', x, y, z: 0, length: 12, rotation: 0,
  barrels: 2, barrelWidth: 2, barrelHeight: 1.5, wallThickness: 0.3, material: 'Reinforced concrete', color: '#9ca3af', assumptions: '' });
export const validate = o => checkSchema(schema, o);
