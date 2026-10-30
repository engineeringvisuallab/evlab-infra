export const N = (k, l, min, max, x = {}) => ({ k, l, t: 'number', min, max, ...x });
export function checkValue(f, v) {
  if (v === null || v === undefined || v === '') return f.nullable ? null : `${f.l} is required`;
  if (f.t === 'number') {
    if (typeof v !== 'number' || !Number.isFinite(v)) return `${f.l} must be a number`;
    if (f.int && !Number.isInteger(v)) return `${f.l} must be a whole number`;
    if (v < f.min || v > f.max) return `${f.l} must be between ${f.min} and ${f.max}`;
  } else if (f.t === 'select') { if (!f.opts.includes(v)) return `${f.l}: invalid choice`; }
  else if (f.t === 'color') { if (!/^#[0-9a-fA-F]{6}$/.test(v)) return `${f.l} must look like #10b981`; }
  else if (typeof v !== 'string') return `${f.l} must be text`;
  return null;
}
export const checkSchema = (schema, o) => schema.map(f => checkValue(f, o[f.k])).filter(Boolean);
