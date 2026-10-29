import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

export class CameraController {
  constructor(dom) {
    this.dom = dom; this.aspect = 1; this.orthoHalf = 60;
    this.persp = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -100000, 100000);
    this.mode = 'perspective'; this.camera = this.persp;
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.screenSpacePanning = true;
    this.fit(null);
  }
  resize(w, h) {
    this.aspect = w / h; this.persp.aspect = this.aspect; this.persp.updateProjectionMatrix(); this._frustum();
  }
  _frustum() {
    const o = this.ortho, h = this.orthoHalf;
    o.left = -h * this.aspect; o.right = h * this.aspect; o.top = h; o.bottom = -h; o.updateProjectionMatrix();
  }
  setMode(mode) {
    if (mode === this.mode) return;
    const t = this.controls.target.clone(), from = this.camera;
    const dir = from.position.clone().sub(t).normalize();
    const tan = Math.tan(THREE.MathUtils.degToRad(this.persp.fov / 2));
    let dist;
    if (mode === 'orthographic') { dist = from.position.distanceTo(t); this.orthoHalf = dist * tan; this.ortho.zoom = 1; }
    else { dist = (this.orthoHalf / this.ortho.zoom) / tan; }
    const next = mode === 'orthographic' ? this.ortho : this.persp;
    next.position.copy(t).addScaledVector(dir, dist);
    this.mode = mode; this.camera = next; this.controls.object = next;
    this._frustum(); next.lookAt(t); this.controls.update();
  }
  fit(box) {
    const b = box && !box.isEmpty() ? box : new THREE.Box3(
      new THREE.Vector3(-CONFIG.defaultExtent, -CONFIG.defaultExtent, 0),
      new THREE.Vector3(CONFIG.defaultExtent, CONFIG.defaultExtent, 10));
    const c = b.getCenter(new THREE.Vector3()), r = Math.max(b.getSize(new THREE.Vector3()).length() / 2, 1);
    const dir = new THREE.Vector3(1, -1, 0.8).normalize();
    const dist = (r * 1.15) / Math.sin(THREE.MathUtils.degToRad(this.persp.fov / 2));
    this.orthoHalf = r * 1.15; this.ortho.zoom = 1; this._frustum();
    this.camera.position.copy(c).addScaledVector(dir, this.mode === 'perspective' ? dist : r * 4);
    this.controls.target.copy(c); this.camera.lookAt(c); this.controls.update();
  }
}
