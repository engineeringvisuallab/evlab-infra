import { toDisplay, SYS } from '../core/units.js';
import { quantities } from './quantity-report.js';
import { collectWarnings } from '../models/registry.js';
import { findCrossings, CHECKLIST } from '../models/crossings.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const table = (h, rows) => `<table><tr>${h.map(x => `<th>${esc(x)}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
export function projectReportHtml(project) {
  const U = project.meta.units === 'ft' ? 'ft' : 'm', S = SYS[U], cl = v => toDisplay('len', v, U);
  const q = quantities(project), w = collectWarnings(project), cr = findCrossings(project), c = project.meta.crossing || { checklist: {}, assumptions: '', minClearance: null };
  const counts = {}; project.objects.forEach(o => counts[o.type] = (counts[o.type] || 0) + 1);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(project.meta.name)} — EVLab Infra report</title><style>
body{font:14px/1.5 system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#111}h1{color:#047857}h2{border-bottom:2px solid #d4a64a;padding-bottom:3px;margin-top:28px}
table{border-collapse:collapse;width:100%;font-size:12px;margin:8px 0}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#f1f5f9}.warn{background:#fff7e0;border:1px solid #d4a64a;padding:8px}
@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / save as PDF</button>
<h1>${esc(project.meta.name)}</h1><p>EVLab Infra preliminary project report · generated ${esc(new Date().toISOString())}</p>
<p class="warn"><b>Disclaimer:</b> Preliminary visualization and geometric quantities only. This is not a substitute for verified engineering design. Conceptual models are not construction-ready or structurally certified.</p>
<h2>Project</h2>${table(['Item', 'Value'], [['App version', project.meta.appVersion], ['Created', project.meta.created], ['Last modified', project.meta.modified || '—'], ['Coordinate system', project.meta.crs], ['Display units', U === 'ft' ? 'Feet' : 'Metres'], ['Objects', project.objects.length + ' (' + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') + ')']])}
<h2>Preliminary quantities</h2>${q.sections.length ? q.sections.map(s => `<h3>${esc(s.title)}</h3>${table(s.headers, s.rows)}`).join('') : '<p>No quantity-bearing objects.</p>'}
${q.notes.length ? '<h3>Notes</h3><ul>' + q.notes.map(n => `<li>${esc(n)}</li>`).join('') + '</ul>' : ''}
<h2>Validation warnings</h2>${w.length ? '<ul>' + w.map(x => `<li>${esc(x.msg)}</li>`).join('') + '</ul>' : '<p>No attribute warnings.</p>'}
<h2>Crossings (potential interactions)</h2>${cr.length ? table(['Type', 'Items', `Plan X, Y (${S.len})`, `Vertical gap (${S.len})`, 'Status'], cr.map(r => [r.kind, `${r.a} × ${r.b}`, `${cl(r.x).toFixed(2)}, ${cl(r.y).toFixed(2)}`, r.gap == null ? '—' : cl(r.gap).toFixed(2), r.status])) : '<p>None found.</p>'}
<p>Required vertical clearance entered: ${c.minClearance == null ? 'none' : cl(c.minClearance).toFixed(3) + ' ' + S.len}. These are plan-view crossings with entered levels, not confirmed physical clashes.</p>
<h2>Project assumptions</h2><p>${esc(c.assumptions || 'None recorded.').replace(/\n/g, '<br>')}</p>
<h2>Preliminary checklist</h2><ul>${CHECKLIST.map(([k, l]) => `<li>${c.checklist[k] ? '☑' : '☐'} ${esc(l)}</li>`).join('')}</ul>
<h2>Calculation assumptions and limitations</h2><ul>${q.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}<li>Geometry is not hydraulic or structural analysis.</li></ul></body></html>`;
}
