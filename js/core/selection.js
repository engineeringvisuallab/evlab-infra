export class Selection {
  constructor(bus) { this.bus = bus; this.id = null; }
  set(id) { if (id === this.id) return; this.id = id; this.bus.emit('selection', id); }
}
