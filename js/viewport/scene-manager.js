import * as THREE from 'three';
import { CameraController } from './camera-controller.js';
import { CONFIG } from '../config.js';

THREE.Object3D.DEFAULT_UP.set(0, 0, 1); // engineering convention: Z is elevation

export class SceneManager {
  constructor(container, bus) {
    this.container = container; this.bus = bus;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x0b1220);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    this.cam = new CameraController(this.renderer.domElement);

    this.layers = {};
    for (const [id] of CONFIG.layers) { const g = new THREE.Group(); g.name = id; this.layers[id] = g; this.scene.add(g); }

    this.scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1b2438, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(60, -40, 100);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, far: 400 });
    this.scene.add(sun);

    this.setGrid(200, 200);
    this.axes = new THREE.AxesHelper(10); this.scene.add(this.axes);

    this.ground = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this.renderer.domElement.addEventListener('pointermove', e => this._cursor(e));
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => { this.cam.controls.update(); this.renderer.render(this.scene, this.cam.camera); });
  }
  setGrid(size, div) { // grid cell = 1 m (metric) or 1 ft (imperial)
    const vis = this.grid ? this.grid.visible : true;
    if (this.grid) { this.scene.remove(this.grid); this.grid.geometry.dispose(); [].concat(this.grid.material).forEach(m => m.dispose()); }
    this.grid = new THREE.GridHelper(size, div, 0x10b981, 0x26344f); this.grid.rotation.x = Math.PI / 2; this.grid.visible = vis; this.scene.add(this.grid);
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return; this.renderer.setSize(w, h); this.cam.resize(w, h);
  }
  planePoint(e, z) { this.groundPoint(e); return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), new THREE.Vector3()); }
  pickHandle(e) {
    this.groundPoint(e); const vis = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    return this.ray.intersectObjects(Object.values(this.layers), true).find(h => h.object.userData.handle !== undefined && vis(h.object));
  }
  toScreen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam.camera), r = this.renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
  groundPoint(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.cam.camera);
    return this.ray.ray.intersectPlane(this.ground, new THREE.Vector3());
  }
  pick(e) {
    this.groundPoint(e);
    const vis = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    return this.ray.intersectObjects(Object.values(this.layers), true).find(h => h.object.userData.id && vis(h.object));
  }
  _cursor(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.cam.camera);
    const p = this.ray.ray.intersectPlane(this.ground, new THREE.Vector3());
    this.bus.emit('cursor', p);
  }
  modelBox() { const b = new THREE.Box3(); Object.values(this.layers).forEach(g => g.children.length && b.expandByObject(g)); return b; }
  setShadows(on) { this.renderer.shadowMap.enabled = on; this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
}
