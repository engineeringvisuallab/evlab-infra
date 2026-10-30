// Conceptual bridge: deck, piers and abutments. Not construction-ready or structurally certified.
import { N, checkSchema } from './schema.js';
export const MATERIALS = ['Concrete', 'Steel', 'Timber', 'Composite'];
export const schema = [{ k: 'name', l: 'Name', t: 'text' }, N('x', 'X (m)', -1e6, 1e6), N('y', 'Y (m)', -1e6, 1e6),
  N('z', 'Deck top elevation (m)', -1e4, 1e4), N('length', 'Length (m)', 1, 2000), N('width', 'Deck width (m)', 1, 200),
  N('deckThickness', 'Deck thickness (m)', 0.1, 10), N('rotation', 'Rotation about Z (deg)', -360, 360),
  N('pierCount', 'Number of piers', 0, 20, { int: true }), N('pierWidth', 'Pier width (m)', 0.1, 20), N('abutmentThickness', 'Abutment thickness (m)', 0.2, 20),
  N('groundLevel', 'Ground / bed level at supports (m)', -1e4, 1e4, { nullable: true }), N('waterLevel', 'Design water level (m, user-entered)', -1e4, 1e4, { nullable: true }),
  N('clearanceRequired', 'Required clearance (m)', 0, 100, { nullable: true }), { k: 'material', l: 'Material', t: 'select', opts: MATERIALS },
  { k: 'color', l: 'Color', t: 'color' }, { k: 'assumptions', l: 'Assumptions', t: 'textarea', nullable: true }];
export const createBridge = (id, x, y) => ({ id, name: 'Bridge', category: 'bridges', type: 'bridge', x, y, z: 5, length: 30, width: 9, deckThickness: 1,
  rotation: 0, pierCount: 1, pierWidth: 1.2, abutmentThickness: 1.5, groundLevel: 0, waterLevel: null, clearanceRequired: null,
  material: 'Concrete', color: '#a8a29e', assumptions: '' });
export const validate = o => checkSchema(schema, o);
