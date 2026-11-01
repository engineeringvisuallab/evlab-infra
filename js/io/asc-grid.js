// ESRI ASCII grid (.asc) elevation raster -> x, y, z points (cell centres). Large grids are thinned by taking every step-th cell.
import { fromGeo, checkOrigin } from '../core/coordinates.js';
export const MAX_CELLS = 4e6;
export function parseAscGrid(text, { mode = 'local', origin, k = 1, maxPoints = 10000 } = {}) {
  const hdr = {}, re = /^\s*([A-Za-z_]+)\s+(\S+)\s*$/; let pos = 0;
  for (let n = 0; n < 7; n++) { const e = text.indexOf('\n', pos), line = text.slice(pos, e < 0 ? text.length : e), m = re.exec(line); if (!m || !/^(ncols|nrows|xll|yll|cellsize|dx|dy|nodata)/i.test(m[1])) break; hdr[m[1].toLowerCase()] = m[2]; pos = e < 0 ? text.length : e + 1; }
  const num = key => { const v = Number(hdr[key]); return Number.isFinite(v) ? v : NaN; };
  const ncols = num('ncols'), nrows = num('nrows'), cs = hdr.cellsize !== undefined ? num('cellsize') : num('dx'), csy = hdr.cellsize !== undefined ? cs : (hdr.dy !== undefined ? num('dy') : cs);
  const cx = hdr.xllcenter !== undefined, cy = hdr.yllcenter !== undefined, xll = num(cx ? 'xllcenter' : 'xllcorner'), yll = num(cy ? 'yllcenter' : 'yllcorner');
  const nodata = hdr.nodata_value !== undefined ? num('nodata_value') : -9999;
  if (![ncols, nrows].every(v => Number.isInteger(v) && v > 0)) throw new Error('ASC header needs positive integer ncols and nrows.');
  if (![cs, csy].every(v => v > 0) || !Number.isFinite(xll) || !Number.isFinite(yll)) throw new Error('ASC header needs xllcorner/xllcenter, yllcorner/yllcenter and a positive cellsize.');
  if (ncols * nrows > MAX_CELLS) throw new Error(`The grid has ${ncols * nrows} cells; the limit is ${MAX_CELLS}. Clip or resample it first.`);
  if (mode === 'geographic') checkOrigin(origin);
  let step = 1; while (Math.ceil(ncols / step) * Math.ceil(nrows / step) > maxPoints) step++;
  const body = text.slice(pos), tok = /\S+/g, points = []; let idx = 0, nd = 0, bad = 0, m;
  while ((m = tok.exec(body))) {
    const row = Math.floor(idx / ncols), col = idx - row * ncols; idx++;
    if (row % step || col % step) continue;
    const z = Number(m[0]); if (!Number.isFinite(z)) { bad++; continue; } if (z === nodata) { nd++; continue; }
    const x = xll + (cx ? col : col + 0.5) * cs, y = yll + (cy ? nrows - 1 - row : nrows - 1 - row + 0.5) * csy;
    if (mode === 'geographic') { if (Math.abs(x) > 180 || Math.abs(y) > 90) throw new Error('Cell coordinates are outside longitude/latitude range: is this grid really geographic?'); const [px, py] = fromGeo(x, y, origin); points.push({ x: +px.toFixed(3), y: +py.toFixed(3), z: +(z * k).toFixed(6) }); }
    else points.push({ x: x * k, y: y * k, z: +(z * k).toFixed(6) });
  }
  if (idx !== ncols * nrows) throw new Error(`Expected ${ncols * nrows} values but found ${idx}.`);
  if (points.length < 3) throw new Error('The grid has fewer than 3 valid cells.');
  return { points, step, ncols, nrows, cellsize: cs, nodata: nd, bad };
}
