// Local engineering coordinates are metres on a tangent plane at a geographic origin (WGS84 lon/lat, degrees).
// Approximation for small areas (a few km). It is not a projected CRS (UTM, state plane, ...) and is not survey-grade.
const m = lat0 => { const p = lat0 * Math.PI / 180; return { lat: 111132.92 - 559.82 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p), lon: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p) }; };
export const LOCAL_CRS = 'LOCAL-ENG';
export const toGeo = (x, y, o) => { const k = m(o.lat); return [o.lon + x / k.lon, o.lat + y / k.lat]; };
export const fromGeo = (lon, lat, o) => { const k = m(o.lat); return [(lon - o.lon) * k.lon, (lat - o.lat) * k.lat]; };
export function checkOrigin(o) {
  if (!o || !Number.isFinite(o.lon) || !Number.isFinite(o.lat) || Math.abs(o.lon) > 180 || Math.abs(o.lat) > 90)
    throw new Error('Set a geographic origin first: longitude (−180 to 180) and latitude (−90 to 90), in Properties with nothing selected.');
}
