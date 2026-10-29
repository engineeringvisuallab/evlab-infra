export class EventBus {
  constructor(){ this.h = new Map(); }
  on(e, f){ (this.h.get(e) || this.h.set(e, []).get(e)).push(f); }
  emit(e, d){ (this.h.get(e) || []).forEach(f => f(d)); }
}
