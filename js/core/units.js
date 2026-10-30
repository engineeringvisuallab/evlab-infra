export const UNITS = { m: 1, mm: 0.001, ft: 0.3048 };
export const toMetres = (v, u = 'm') => v * UNITS[u];
export const fromMetres = (v, u = 'm') => v / UNITS[u];
export const fmt = (v, u = 'm', d = 3) => `${fromMetres(v, u).toFixed(d)} ${u}`;
// Display units. Data is always stored in metres (pipe diameter in mm); these convert for display and typed input only.
export const SYS = { m: { len: 'm', dia: 'mm', area: 'm²', vol: 'm³' }, ft: { len: 'ft', dia: 'in', area: 'ft²', vol: 'ft³' } };
const K = { m: { len: 1, dia: 1, area: 1, vol: 1 }, ft: { len: 1 / 0.3048, dia: 1 / 25.4, area: 1 / 0.09290304, vol: 1 / 0.028316846592 } };
export const toDisplay = (kind, v, sys = 'm') => v * K[sys][kind];
export const fromDisplay = (kind, v, sys = 'm') => v / K[sys][kind];
