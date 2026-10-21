// Кухарчата — карта світу: острови-країни, міста, фургончик, що їде між ними
import * as THREE from 'three';
import { LEVELS, MAP, COUNTRIES } from './data.js';
import { textSprite } from './render.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
function m(geo, mt, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }

const ISLAND_COL = { ua: 0x9ed36a, it: 0xb7d67a, jp: 0xa6d98a, mx: 0xe2c27a, us: 0x9cc77c };

function flag(cols) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 64; const g = c.getContext('2d');
  if (cols.length === 2 && cols[0] === '#ffffff') { g.fillStyle = '#fff'; g.fillRect(0, 0, 96, 64); g.fillStyle = cols[1]; g.beginPath(); g.arc(48, 32, 16, 0, 7); g.fill(); }
  else if (cols.length === 2) { g.fillStyle = cols[0]; g.fillRect(0, 0, 96, 32); g.fillStyle = cols[1]; g.fillRect(0, 32, 96, 32); }
  else if (cols[0] === '#3355aa') { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#fff' : '#cc3344'; g.fillRect(0, i * 64 / 7, 96, 64 / 7 + 1); } g.fillStyle = '#3355aa'; g.fillRect(0, 0, 42, 34); }
  else { cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 32, 0, 33, 64); }); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function landmark(cc) {
  const g = new THREE.Group();
  switch (cc) {
    case 'ua': { // золоті бані
      g.add(m(new THREE.BoxGeometry(1.1, 0.9, 1.1), mat(0xf6f1e6), 0, 0.45));
      g.add(m(new THREE.SphereGeometry(0.42, 16, 10), mat(0xffc93c, { metalness: 0.7, roughness: 0.25 }), 0, 1.15));
      g.add(m(new THREE.ConeGeometry(0.12, 0.45, 8), mat(0xffc93c, { metalness: 0.7, roughness: 0.25 }), 0, 1.65));
      for (const [x, z] of [[-0.45, 0.45], [0.45, 0.45]]) { g.add(m(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), mat(0xf6f1e6), x, 0.45, z)); g.add(m(new THREE.SphereGeometry(0.18, 10, 8), mat(0x3d7be0), x, 1.0, z)); }
      break;
    }
    case 'it': { // Колізей
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 20, 1, true), mat(0xe2c39a, { side: THREE.DoubleSide }));
      ring.position.y = 0.4; g.add(ring);
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(m(new THREE.BoxGeometry(0.12, 0.3, 0.06), mat(0x8a6a48), Math.cos(a) * 0.91, 0.45, Math.sin(a) * 0.91)).rotation.y = -a; }
      break;
    }
    case 'jp': { // пагода
      for (let i = 0; i < 4; i++) { g.add(m(new THREE.BoxGeometry(0.6 - i * 0.1, 0.32, 0.6 - i * 0.1), mat(0xc0392b), 0, 0.16 + i * 0.42)); g.add(m(new THREE.ConeGeometry(0.62 - i * 0.1, 0.2, 4), mat(0x2b2b33), 0, 0.42 + i * 0.42)).rotation.y = Math.PI / 4; }
      g.add(m(new THREE.CylinderGeometry(0.02, 0.02, 0.4), mat(0xffc93c), 0, 1.9));
      break;
    }
    case 'mx': { // піраміда
      for (let i = 0; i < 4; i++) g.add(m(new THREE.BoxGeometry(1.4 - i * 0.32, 0.3, 1.4 - i * 0.32), mat(0xc9a36b), 0, 0.15 + i * 0.3));
      g.add(m(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(0x8a6a48), 0, 1.35));
      break;
    }
    case 'us': { // хмарочоси і статуя
      g.add(m(new THREE.BoxGeometry(0.4, 1.9, 0.4), mat(0x8fa3b8), -0.4, 0.95)); g.add(m(new THREE.ConeGeometry(0.08, 0.6, 6), mat(0xc7d1db), -0.4, 2.2));
      g.add(m(new THREE.BoxGeometry(0.45, 1.3, 0.45), mat(0xa3b1bf), 0.15, 0.65));
      g.add(m(new THREE.CylinderGeometry(0.1, 0.16, 0.9, 8), mat(0x7fc8a9), 0.65, 0.45)); g.add(m(new THREE.SphereGeometry(0.1, 8, 6), mat(0x7fc8a9), 0.65, 1.0)); g.add(m(new THREE.CylinderGeometry(0.03, 0.03, 0.4), mat(0x7fc8a9), 0.75, 1.2)); g.add(m(new THREE.SphereGeometry(0.07, 8, 6), mat(0xffd23f, { emissive: 0xffa000, emissiveIntensity: 0.6 }), 0.75, 1.42));
      break;
    }
  }
  return g;
}

export function truckMesh() {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  b.add(m(new THREE.BoxGeometry(1.2, 0.7, 0.7), mat(0xffffff), 0, 0.55));
  b.add(m(new THREE.BoxGeometry(0.45, 0.5, 0.68), mat(0xe5484d), 0.78, 0.45));
  b.add(m(new THREE.BoxGeometry(0.05, 0.22, 0.55), mat(0x9fd8ff, { roughness: 0.1 }), 1.01, 0.55));
  b.add(m(new THREE.BoxGeometry(1.21, 0.14, 0.71), mat(0xe5484d), 0, 0.35));
  b.add(m(new THREE.BoxGeometry(0.6, 0.3, 0.02), mat(0xffd23f), -0.05, 0.6, 0.36));
  // ковпак кухаря на даху
  b.add(m(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 14), mat(0xffffff), -0.1, 1.0));
  b.add(m(new THREE.SphereGeometry(0.27, 14, 10), mat(0xffffff), -0.1, 1.2));
  for (const [x, z] of [[0.6, 0.36], [0.6, -0.36], [-0.4, 0.36], [-0.4, -0.36]]) { const w = m(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 14), mat(0x222222), x, 0.18, z); w.rotation.x = Math.PI / 2; b.add(w); }
  g.userData.body = b;
  return g;
}

export class MapView {
  constructor(renderer) {
    this.r = renderer;
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(0x9fdcff);
    s.fog = new THREE.Fog(0x9fdcff, 40, 90);
    this.cam = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    s.add(new THREE.HemisphereLight(0xffffff, 0x5a7a9a, 1.3));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-10, 25, 15); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 24, bottom: -24, near: 1, far: 80 });
    s.add(sun);
    // океан
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 60, 60), mat(0x3fa9e6, { roughness: 0.35 }));
    sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; this.sea = sea; s.add(sea);
    // острови
    for (const [cc, I] of Object.entries(MAP.islands)) {
      const g = new THREE.Group(); g.position.set(I.x, 0, I.z);
      const sand = m(new THREE.CylinderGeometry(I.r + 0.6, I.r + 1.0, 0.5, 9), mat(0xf2dca2), 0, 0.05); sand.rotation.y = I.x; g.add(sand);
      const grass = m(new THREE.CylinderGeometry(I.r, I.r + 0.3, 0.6, 9), mat(ISLAND_COL[cc]), 0, 0.3); grass.rotation.y = I.x + 0.3; g.add(grass);
      const lm = landmark(cc); lm.position.set(-I.r * 0.35, 0.6, I.r * 0.35); g.add(lm);
      // прапор
      const pole = m(new THREE.CylinderGeometry(0.05, 0.05, 2.4), mat(0x777777), I.r * 0.55, 1.8, -I.r * 0.45); g.add(pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: flag(COUNTRIES[cc].flag), side: THREE.DoubleSide }));
      fl.position.set(I.r * 0.55 + 0.62, 2.6, -I.r * 0.45); fl.name = 'flag'; g.add(fl);
      const lab = textSprite(COUNTRIES[cc].name, '#ffffff', 0.9, 'rgba(30,60,90,.75)'); lab.position.set(0, 2.2, -I.r - 0.6); g.add(lab);
      // дерева
      for (let i = 0; i < 6; i++) { const a = i * 1.1 + I.x, rr = I.r * 0.75; g.add(m(new THREE.ConeGeometry(0.35, 0.9, 7), mat(0x3f8f4a), Math.cos(a) * rr, 1.05, Math.sin(a) * rr)); }
      s.add(g);
    }
    // міста
    this.pins = [];
    this.pts = LEVELS.map(l => new THREE.Vector3(MAP.cities[l.id][0], 0.62, MAP.cities[l.id][1]));
    LEVELS.forEach((l, i) => {
      const p = new THREE.Group(); p.position.copy(this.pts[i]);
      const base = m(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 18), mat(0xffffff), 0, 0.07); p.add(base);
      const top = m(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 18), mat(l.finale ? 0xffc93c : 0xe5484d), 0, 0.16); top.name = 'top'; p.add(top);
      const lab = textSprite(l.city, '#ffffff', 0.55, 'rgba(0,0,0,.6)'); lab.position.y = 1.0; p.add(lab);
      const st = textSprite('☆☆☆', '#ffd23f', 0.45, 'rgba(0,0,0,.5)'); st.position.y = 1.55; st.name = 'stars'; p.add(st);
      p.userData = { i, top, lab, starsSprite: st };
      this.scene.add(p); this.pins.push(p);
    });
    // доріжки між містами (крапки, через море — дугою)
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = this.pts[i], b = this.pts[i + 1], d = a.distanceTo(b);
      const n = Math.max(3, Math.round(d * 1.5));
      const sea = LEVELS[i].country !== LEVELS[i + 1].country;
      for (let k = 1; k < n; k++) {
        const t = k / n, v = a.clone().lerp(b, t);
        v.y = 0.68 + (sea ? Math.sin(t * Math.PI) * 1.4 : 0);
        const dot = m(new THREE.SphereGeometry(0.09, 8, 6), mat(sea ? 0xffffff : 0xfff3b0), v.x, v.y, v.z);
        this.scene.add(dot);
      }
    }
    this.truck = truckMesh(); this.scene.add(this.truck);
    this.at = 0; this.route = null; this.focus = this.pts[0].clone(); this.time = 0;
    this.truck.position.copy(this.pts[0]);
    this.ray = new THREE.Raycaster();
  }
  setProgress(stars, unlocked) {
    this.unlocked = unlocked;
    this.pins.forEach((p, i) => {
      const s = stars[LEVELS[i].id] || 0;
      p.remove(p.userData.starsSprite);
      const st = textSprite(i <= unlocked ? '★'.repeat(s) + '☆'.repeat(3 - s) : '🔒', '#ffd23f', 0.45, 'rgba(0,0,0,.5)');
      st.position.y = 1.55; p.add(st); p.userData.starsSprite = st;
      p.userData.top.material.color.setHex(i > unlocked ? 0x9aa3ab : LEVELS[i].finale ? 0xffc93c : s ? 0x3cb371 : 0xe5484d);
    });
  }
  place(i) { this.at = i; this.truck.position.copy(this.pts[i]); this.truck.position.x += 0.9; this.focus.copy(this.pts[i]); this.route = null; }
  driveTo(i, done) {
    if (i === this.at) { done && done(); return; }
    const pts = [];
    const step = i > this.at ? 1 : -1;
    for (let k = this.at; k !== i; k += step) {
      const a = this.pts[k], b = this.pts[k + step];
      const sea = LEVELS[k].country !== LEVELS[k + step].country;
      const n = Math.max(4, Math.round(a.distanceTo(b) * 2));
      for (let j = 0; j <= n; j++) { const t = j / n, v = a.clone().lerp(b, t); v.y = 0.62 + (sea ? Math.sin(t * Math.PI) * 1.6 : 0); pts.push(v); }
    }
    this.route = { curve: new THREE.CatmullRomCurve3(pts), t: 0, len: 0, target: i, done };
    this.route.len = this.route.curve.getLength();
  }
  update(dt) {
    this.time += dt;
    if (this.route) {
      const R = this.route;
      R.t = Math.min(1, R.t + dt * 7 / R.len);
      const p = R.curve.getPointAt(R.t), q = R.curve.getPointAt(Math.min(1, R.t + 0.01));
      this.truck.position.copy(p);
      if (q.distanceTo(p) > 1e-4) this.truck.rotation.y = Math.atan2(-(q.z - p.z), q.x - p.x);
      this.truck.userData.body.position.y = Math.abs(Math.sin(this.time * 18)) * 0.06;
      if (R.t >= 1) { this.at = R.target; this.route = null; this.truck.position.x += 0.9; R.done && R.done(); }
    } else this.truck.userData.body.position.y = 0;
    this.focus.lerp(this.truck.position, Math.min(1, dt * 3));
    const d = this.cam.aspect < 1 ? 30 : 23;
    this.cam.position.set(this.focus.x, d * 0.85, this.focus.z + d * 0.62);
    this.cam.lookAt(this.focus.x, 0, this.focus.z - 0.5);
    this.pins.forEach((p, i) => { p.userData.top.position.y = 0.16 + (i === this.at ? Math.abs(Math.sin(this.time * 3)) * 0.15 : 0); });
    // хвилі
    const pos = this.sea.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.4 + this.time) * 0.12 + Math.cos(pos.getY(i) * 0.5 + this.time * 0.8) * 0.1);
    pos.needsUpdate = true;
  }
  pick(nx, ny) { // нормалізовані координати екрана → індекс міста
    this.ray.setFromCamera(new THREE.Vector2(nx, ny), this.cam);
    let best = null, bd = 1.6;
    for (const p of this.pins) {
      const d = this.ray.ray.distanceToPoint(p.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
      if (d < bd) { bd = d; best = p.userData.i; }
    }
    return best;
  }
  resize(w, h) { this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  render() { this.r.render(this.scene, this.cam); }
}
