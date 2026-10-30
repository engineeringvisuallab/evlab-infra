import { CONFIG } from '../config.js';
export const newMeta = () => ({ name: 'Untitled project', appVersion: CONFIG.version, created: new Date().toISOString(),
  modified: null, crs: 'LOCAL-ENG (local engineering, metres, Z-up)', units: 'm',
  crossing: { minClearance: null, assumptions: '', checklist: {} }, geo: { originLon: null, originLat: null } });
export class Project {
  constructor(bus) { this.bus = bus; this.meta = newMeta(); this.objects = []; this.nextId = 1; }
  reset() { this.load({ meta: newMeta(), objects: [], nextId: 1 }); }
  newId() { return 'OBJ-' + String(this.nextId++).padStart(4, '0'); }
  get(id) { return this.objects.find(o => o.id === id); }
  add(o) { this.objects.push(o); this.changed(); return o; }
  remove(id) { this.objects = this.objects.filter(o => o.id !== id && o.fromId !== id && o.toId !== id); this.changed(); } // also removes pipes attached to a deleted node
  update(id, patch) { Object.assign(this.get(id), patch); this.changed(); }
  snapshot() { return JSON.stringify({ meta: this.meta, objects: this.objects, nextId: this.nextId }); }
  restore(s) { this.load(JSON.parse(s)); }
  load(d) { this.meta = d.meta; this.objects = d.objects; this.nextId = d.nextId; this.bus.emit('model-changed'); }
  changed() { this.meta.modified = new Date().toISOString(); this.bus.emit('model-changed'); }
}
