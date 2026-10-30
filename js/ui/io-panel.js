import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { download, downloadProject } from '../io/json-io.js';
import { toCsv, inventoryRows, importAssets } from '../io/csv-io.js';
import { toGeoJSON, fromGeoJSON } from '../io/geojson-io.js';
import { toDxf } from '../io/dxf-export.js';
import { quantities, quantityCsv } from '../reports/quantity-report.js';
import { projectReportHtml } from '../reports/project-report.js';
const safe = n => n.replace(/[^\w-]+/g, '_') || 'project';
export function initIoPanel(root, { project, selection, history, bus, sm }) {
  let open = false, log = [], mode = 'local', lineAs = 'road';
  const mk = (t, props = {}, kids = []) => { const e = document.createElement(t); Object.assign(e, props); kids.forEach(k => e.append(k)); return e; };
  const run = fn => { try { const r = fn(); if (r) log = [].concat(r); } catch (e) { log = ['Error: ' + e.message]; } render(); };
  const btn = (label, fn, disabled = false) => { const b = mk('button', { textContent: label, disabled }); b.addEventListener('click', () => run(fn)); return b; };
  const origin = () => { const g = project.meta.geo || {}; return { lon: g.originLon, lat: g.originLat }; }, name = () => safe(project.meta.name);
  const pick = (accept, handler) => { const i = mk('input', { type: 'file', accept }); i.addEventListener('change', async () => { const f = i.files[0]; if (!f) return; try { log = handler(await f.text()); } catch (e) { log = ['Error: ' + e.message]; } render(); }); i.click(); };
  const importCsv = t => { const r = importAssets(project, t);
    if (r.patches.length) { history.record(); r.patches.forEach(p => Object.assign(project.get(p.id), p.patch)); project.changed(); }
    return [`Updated ${r.patches.length} object(s) from CSV. Blank cells were left unchanged.`, ...r.errors.map(x => 'Skipped: ' + x), ...r.ignored.map(x => 'Ignored: ' + x), ...r.unknownCols.map(x => 'Unrecognised column ignored: ' + x)]; };
  const importGeo = t => { const r = fromGeoJSON(t, { mode, origin: origin(), lineAs, newId: () => project.newId() });
    if (r.objects.length) { history.record(); r.objects.forEach(o => project.objects.push(o)); project.changed(); }
    return [`Imported ${r.objects.length} feature(s) (${mode} coordinates; points → junction nodes, lines → ${lineAs}s).`, ...r.warnings, ...r.skipped.map(x => 'Not imported: ' + x)]; };
  const stl = () => { const o = project.get(selection.id); if (!o) throw new Error('Select an object first.');
    const g = sm.layers[o.category].children.find(c => { let hit = false; c.traverse(x => { if (x.userData.id === o.id) hit = true; }); return hit; });
    if (!g) throw new Error('Object has no 3D mesh.'); g.updateMatrixWorld(true);
    const hs = []; g.traverse(x => { if (x.userData.handle !== undefined && x.parent) hs.push([x, x.parent]); }); hs.forEach(([h, p]) => p.remove(h)); // editing handles are not geometry
    try { let meshes = 0; g.traverse(x => { if (x.isMesh) meshes++; }); if (!meshes) throw new Error('Object has no mesh to export.');
      download(`${safe(o.id)}.stl`, new STLExporter().parse(g, { binary: true }), 'model/stl'); return [`Exported ${o.id} as binary STL (${meshes} mesh part(s); units = metres, Z up).`]; }
    finally { hs.forEach(([h, p]) => p.add(h)); } };
  const section = (title, ...kids) => [mk('h2', { textContent: title }), mk('div', { className: 'btns' }, kids)];
  function render() {
    root.hidden = !open; if (!open) return; root.replaceChildren();
    const close = mk('button', { textContent: 'Close' }); close.addEventListener('click', () => { open = false; render(); });
    root.append(mk('div', { className: 'chead' }, [mk('h2', { textContent: 'Import / Export / Reports' }), close]));
    const sel = (opts, v, set) => { const s = mk('select', {}, opts.map(([k, l]) => mk('option', { value: k, textContent: l, selected: k === v }))); s.addEventListener('change', () => set(s.value)); return s; };
    const num = (v, ph, set) => { const i = mk('input', { type: 'number', step: 'any', value: v, placeholder: ph }); i.addEventListener('input', () => set(i.value)); return i; };
    const lab = (t, el) => mk('label', { className: 'row' }, [mk('span', { textContent: t }), el]);
    root.append(...section('Project', btn('Export project (JSON)', () => { downloadProject(project); return ['Project JSON downloaded.']; })),
      ...section('Asset inventory (CSV)', btn('Export inventory CSV', () => { download(name() + '-inventory.csv', '\ufeff' + toCsv(inventoryRows(project)), 'text/csv'); return [`Exported ${project.objects.length} asset(s).`]; }),
        btn('Import CSV (update attributes by ID)', () => { pick('.csv,text/csv', importCsv); })),
      mk('p', { className: 'muted', textContent: 'CSV import only updates name, material, asset_id, diameter_mm, ground_level_m and invert_level_m of existing IDs. Blank cells are ignored; every skipped row is listed below.' }),
      ...section('Reports', btn('Quantity report (CSV)', () => { download(name() + '-quantities.csv', '\ufeff' + quantityCsv(quantities(project)), 'text/csv'); return ['Quantity report downloaded.']; }),
        btn('Open printable report', () => { const w = window.open(URL.createObjectURL(new Blob([projectReportHtml(project)], { type: 'text/html' })), '_blank'); return [w ? 'Report opened in a new tab. Use its Print button.' : 'The browser blocked the new tab. Use "Download report" instead.']; }),
        btn('Download report (.html)', () => { download(name() + '-report.html', projectReportHtml(project), 'text/html'); return ['Report downloaded.']; })),
      mk('h2', { textContent: 'GeoJSON' }),
      lab('Coordinates', sel([['local', 'Local project metres (not lon/lat)'], ['geographic', 'Geographic lon/lat around an origin']], mode, v => { mode = v; })),
      mk('p', { className: 'muted', textContent: `Geographic origin (set it in Properties when nothing is selected): ${origin().lon == null ? 'not set' : origin().lon + ', ' + origin().lat}` }),
      lab('Import lines as', sel([['road', 'Roads'], ['watercourse', 'Watercourses']], lineAs, v => { lineAs = v; })),
      mk('div', { className: 'btns' }, [btn('Export GeoJSON', () => { const r = toGeoJSON(project, { mode, origin: origin() }); download(name() + '.geojson', JSON.stringify(r.geojson, null, 2), 'application/geo+json');
        return [`Exported ${r.geojson.features.length} feature(s) (${mode} coordinates).`, r.geojson.evlab.note, ...r.skipped.map(x => 'Not exported: ' + x)]; }), btn('Import GeoJSON', () => { pick('.geojson,.json,application/geo+json', importGeo); })]),
      mk('p', { className: 'muted', textContent: 'Geographic mode uses a simple local approximation around your origin (small areas only, not a projected CRS, not survey-grade). Only Point and LineString import; other geometry is listed as not imported.' }),
      ...section('CAD and 3D', btn('Export DXF (plan view)', () => { const r = toDxf(project); download(name() + '.dxf', r.text, 'application/dxf');
        return ['DXF (plan view, ASCII R12-style, elevations not exported; not DWG). Entities: ' + (Object.entries(r.counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'), ...r.skipped.map(x => 'Not exported: ' + x)]; }),
        btn('Export selected as STL', stl, !selection.id)),
      mk('h2', { textContent: 'Result' }), mk('pre', { className: 'log', textContent: log.length ? log.join('\n') : 'Nothing yet.' }));
  }
  bus.on('panel', n => { open = n === 'io' ? !open : false; render(); });
  bus.on('selection', render); bus.on('model-changed', render); render();
}
