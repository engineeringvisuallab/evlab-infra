export const UNITS = { m: 1, mm: 0.001, ft: 0.3048 };
export const toMetres = (v, u = 'm') => v * UNITS[u];
export const fromMetres = (v, u = 'm') => v / UNITS[u];
export const fmt = (v, u = 'm', d = 3) => `${fromMetres(v, u).toFixed(d)} ${u}`;
