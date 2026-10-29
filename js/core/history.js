// Snapshot undo/redo. Call record() BEFORE each change.
export class History {
  constructor(project, bus, max = 100) { this.p = project; this.bus = bus; this.max = max; this.u = []; this.r = []; }
  record() { this.u.push(this.p.snapshot()); if (this.u.length > this.max) this.u.shift(); this.r = []; this.bus.emit('history'); }
  undo() { if (!this.u.length) return; this.r.push(this.p.snapshot()); this.p.restore(this.u.pop()); this.bus.emit('history'); }
  redo() { if (!this.r.length) return; this.u.push(this.p.snapshot()); this.p.restore(this.r.pop()); this.bus.emit('history'); }
  clear() { this.u = []; this.r = []; this.bus.emit('history'); }
}
