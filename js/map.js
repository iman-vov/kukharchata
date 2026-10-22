// Кухарчата — карта світу: острови-країни, міста, фургончик, що їде між ними
import * as THREE from 'three';
import { LEVELS, MAP, COUNTRIES } from './data.js';
import { textSprite } from './render.js';
import { tr } from './i18n.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
function m(geo, mt, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }

const ISLAND_COL = { ua: 0x9ed36a, de: 0x8fcf73, it: 0xb7d67a, jp: 0xa6d98a, mx: 0xe2c27a, us: 0x9cc77c, in: 0xd6c47a, fr: 0xa9d58a };

// міста розкладаємо дугою по острову країни
export function cityPositions() {
  const by = {};
  LEVELS.forEach((l, i) => { if (!l.finale) (by[l.country] = by[l.country] || []).push(i); });
  const pos = [];
  for (const [cc, idx] of Object.entries(by)) {
    const I = MAP.islands[cc], n = idx.length;
    idx.forEach((li, k) => { const a = Math.PI * (0.75 + 1.5 * k / Math.max(1, n - 1)); pos[li] = [I.x + Math.cos(a) * I.r * 0.66, I.z + Math.sin(a) * I.r * 0.62]; });
  }
  LEVELS.forEach((l, i) => { if (l.finale) { const I = MAP.islands[l.country]; pos[i] = [I.x + I.r * 0.15, I.z + I.r * 0.05]; } });
  return pos;
}

function flag(cols, horiz) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 64; const g = c.getContext('2d');
  if (horiz) { cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 64 / cols.length, 96, 64 / cols.length + 1); }); }
  else if (cols.length === 2 && cols[0] === '#ffffff') { g.fillStyle = '#fff'; g.fillRect(0, 0, 96, 64); g.fillStyle = cols[1]; g.beginPath(); g.arc(48, 32, 16, 0, 7); g.fill(); }
  else if (cols.length === 2) { g.fillStyle = cols[0]; g.fillRect(0, 0, 96, 32); g.fillStyle = cols[1]; g.fillRect(0, 32, 96, 32); }
  else if (cols[0] === '#ff9933') { cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 64 / 3, 96, 64 / 3 + 1); }); g.strokeStyle = '#000080'; g.lineWidth = 2; g.beginPath(); g.arc(48, 32, 8, 0, 7); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(48, 32); g.lineTo(48 + Math.cos(a) * 8, 32 + Math.sin(a) * 8); g.stroke(); } }
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
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; { const _o = m(new THREE.BoxGeometry(0.12, 0.3, 0.06), mat(0x8a6a48), Math.cos(a) * 0.91, 0.45, Math.sin(a) * 0.91); _o.rotation.y = -a; g.add(_o); } }
      break;
    }
    case 'jp': { // пагода
      for (let i = 0; i < 4; i++) { g.add(m(new THREE.BoxGeometry(0.6 - i * 0.1, 0.32, 0.6 - i * 0.1), mat(0xc0392b), 0, 0.16 + i * 0.42)); { const _o = m(new THREE.ConeGeometry(0.62 - i * 0.1, 0.2, 4), mat(0x2b2b33), 0, 0.42 + i * 0.42); _o.rotation.y = Math.PI / 4; g.add(_o); } }
      g.add(m(new THREE.CylinderGeometry(0.02, 0.02, 0.4), mat(0xffc93c), 0, 1.9));
      break;
    }
    case 'mx': { // піраміда
      for (let i = 0; i < 4; i++) g.add(m(new THREE.BoxGeometry(1.4 - i * 0.32, 0.3, 1.4 - i * 0.32), mat(0xc9a36b), 0, 0.15 + i * 0.3));
      g.add(m(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(0x8a6a48), 0, 1.35));
      break;
    }
    case 'de': { // Бранденбурзька брама
      for (let i = 0; i < 4; i++) g.add(m(new THREE.BoxGeometry(0.16, 1.0, 0.3), mat(0xe8dcc0), -0.6 + i * 0.4, 0.5));
      g.add(m(new THREE.BoxGeometry(1.5, 0.25, 0.4), mat(0xe8dcc0), 0, 1.12));
      g.add(m(new THREE.BoxGeometry(0.5, 0.18, 0.3), mat(0x5a8a6a), 0, 1.33));
      break;
    }
    case 'in': { // Тадж-Махал
      g.add(m(new THREE.BoxGeometry(1.5, 0.12, 1.5), mat(0xf2ede4), 0, 0.06));
      g.add(m(new THREE.BoxGeometry(0.9, 0.6, 0.9), mat(0xfbf8f2), 0, 0.42));
      g.add(m(new THREE.SphereGeometry(0.38, 16, 12), mat(0xfbf8f2), 0, 0.95)); g.add(m(new THREE.ConeGeometry(0.06, 0.3, 8), mat(0xffc93c, { metalness: 0.6 }), 0, 1.42));
      for (const [x, z] of [[-0.68, -0.68], [0.68, -0.68], [-0.68, 0.68], [0.68, 0.68]]) { g.add(m(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 8), mat(0xfbf8f2), x, 0.6, z)); g.add(m(new THREE.SphereGeometry(0.08, 8, 6), mat(0xfbf8f2), x, 1.2, z)); }
      break;
    }
    case 'fr': { // Ейфелева вежа
      const iron = mat(0x8a6a4a, { metalness: 0.4 });
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = m(new THREE.CylinderGeometry(0.04, 0.07, 1.0, 6), iron, x * 0.32, 0.45, z * 0.32); l.rotation.set(z * 0.45, 0, -x * 0.45); g.add(l); }
      g.add(m(new THREE.BoxGeometry(0.55, 0.06, 0.55), iron, 0, 0.88));
      g.add(m(new THREE.CylinderGeometry(0.06, 0.2, 1.0, 4), iron, 0, 1.4));
      g.add(m(new THREE.BoxGeometry(0.22, 0.04, 0.22), iron, 0, 1.92)); g.add(m(new THREE.CylinderGeometry(0.015, 0.05, 0.5, 4), iron, 0, 2.2));
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
  // профіль кузова збоку: довгий фургон із похилим лобовим склом і капотом
  const sh = new THREE.Shape();
  sh.moveTo(-0.75, 0.22); sh.lineTo(0.95, 0.22); sh.lineTo(0.98, 0.52); sh.quadraticCurveTo(0.98, 0.6, 0.86, 0.62);
  sh.lineTo(0.62, 0.64); sh.lineTo(0.44, 1.0); sh.quadraticCurveTo(0.4, 1.06, 0.3, 1.06); sh.lineTo(-0.66, 1.06);
  sh.quadraticCurveTo(-0.75, 1.06, -0.75, 0.97); sh.lineTo(-0.75, 0.22);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.66, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 }), mat(0xfff8ee, { roughness: 0.45 }));
  body.position.z = -0.33; body.castShadow = true; b.add(body);
  // червона смуга і нижня частина
  b.add(m(new THREE.BoxGeometry(1.76, 0.16, 0.78), mat(0xe5484d), 0.1, 0.32));
  b.add(m(new THREE.BoxGeometry(1.7, 0.05, 0.79), mat(0xffc93c), 0.1, 0.42));
  // лобове і бічні вікна кабіни
  const glass = mat(0x8fd3ff, { roughness: 0.08, metalness: 0.2 });
  const ws = m(new THREE.BoxGeometry(0.03, 0.3, 0.58), glass, 0.55, 0.82); ws.rotation.z = -0.55; b.add(ws);
  for (const z of [0.385, -0.385]) b.add(m(new THREE.BoxGeometry(0.26, 0.24, 0.02), glass, 0.3, 0.82, z));
  // віконце видачі з навісом (з боку глядача)
  b.add(m(new THREE.BoxGeometry(0.7, 0.3, 0.02), mat(0x2b2b33), -0.25, 0.75, 0.385));
  for (let i = 0; i < 5; i++) { const aw = m(new THREE.BoxGeometry(0.14, 0.03, 0.26), mat(i % 2 ? 0xffffff : 0xe5484d), -0.53 + i * 0.14, 0.95, 0.5); aw.rotation.x = 0.35; b.add(aw); }
  b.add(m(new THREE.BoxGeometry(0.72, 0.04, 0.1), mat(0xb0b8c0, { metalness: 0.6 }), -0.25, 0.6, 0.43));
  // фари, бампер
  for (const z of [0.24, -0.24]) b.add(m(new THREE.SphereGeometry(0.06, 10, 8), mat(0xfff6c0, { emissive: 0xffe680, emissiveIntensity: 0.7 }), 1.0, 0.45, z));
  b.add(m(new THREE.BoxGeometry(0.08, 0.1, 0.74), mat(0xb0b8c0, { metalness: 0.7, roughness: 0.25 }), 1.02, 0.27));
  // вивіска на даху: великий ковпак кухаря
  b.add(m(new THREE.CylinderGeometry(0.2, 0.22, 0.18, 16), mat(0xffffff), -0.2, 1.2));
  for (let i = 0; i < 4; i++) b.add(m(new THREE.SphereGeometry(0.14, 12, 10), mat(0xffffff), -0.2 + Math.cos(i * 1.57) * 0.11, 1.38, Math.sin(i * 1.57) * 0.11));
  b.add(m(new THREE.SphereGeometry(0.16, 12, 10), mat(0xffffff), -0.2, 1.45));
  // колеса з дисками
  for (const [x, z] of [[0.62, 0.38], [0.62, -0.38], [-0.45, 0.38], [-0.45, -0.38]]) {
    const w = new THREE.Group(); w.position.set(x, 0.2, z);
    const tire = m(new THREE.TorusGeometry(0.13, 0.065, 10, 18), mat(0x222222)); w.add(tire);
    { const _o = m(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), mat(0xd9dee4, { metalness: 0.7, roughness: 0.25 })); _o.rotation.x = Math.PI / 2; w.add(_o); }
    b.add(w);
  }
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
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 30, bottom: -30, near: 1, far: 80 });
    s.add(sun);
    // океан
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 60, 60), mat(0x3fa9e6, { roughness: 0.35 }));
    sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; this.sea = sea; s.add(sea);
    // острови
    for (const [cc, I] of Object.entries(MAP.islands)) {
      const g = new THREE.Group(); g.position.set(I.x, 0, I.z);
      const sand = m(new THREE.CylinderGeometry(I.r + 0.6, I.r + 1.0, 0.5, 9), mat(0xf2dca2), 0, 0.05); sand.rotation.y = I.x; g.add(sand);
      const grass = m(new THREE.CylinderGeometry(I.r, I.r + 0.3, 0.6, 9), mat(ISLAND_COL[cc]), 0, 0.3); grass.rotation.y = I.x + 0.3; g.add(grass);
      const lm = landmark(cc); lm.position.set(-I.r * 0.12, 0.6, -I.r * 0.05); g.add(lm);
      // прапор
      const pole = m(new THREE.CylinderGeometry(0.05, 0.05, 2.4), mat(0x777777), I.r * 0.55, 1.8, -I.r * 0.45); g.add(pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: flag(COUNTRIES[cc].flag, COUNTRIES[cc].hflag), side: THREE.DoubleSide }));
      fl.position.set(I.r * 0.55 + 0.62, 2.6, -I.r * 0.45); fl.name = 'flag'; g.add(fl);
      const lab = textSprite(tr(COUNTRIES[cc].name), '#ffffff', 0.9, 'rgba(30,60,90,.75)'); lab.position.set(0, 2.2, -I.r - 0.6); g.add(lab);
      // дерева
      for (let i = 0; i < 6; i++) { const a = i * 1.1 + I.x + 0.5, rr = I.r * 0.9; g.add(m(new THREE.ConeGeometry(0.35, 0.9, 7), mat(0x3f8f4a), Math.cos(a) * rr, 1.05, Math.sin(a) * rr)); }
      s.add(g);
    }
    // міста
    this.pins = [];
    const CP = cityPositions();
    this.pts = LEVELS.map((l, i) => new THREE.Vector3(CP[i][0], 0.62, CP[i][1]));
    LEVELS.forEach((l, i) => {
      const p = new THREE.Group(); p.position.copy(this.pts[i]);
      const base = m(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 18), mat(0xffffff), 0, 0.07); p.add(base);
      const top = m(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 18), mat(l.finale ? 0xffc93c : 0xe5484d), 0, 0.16); top.name = 'top'; p.add(top);
      const lab = textSprite(tr(l.finale ? '🎉 Бенкет' : l.city), '#ffffff', 0.55, 'rgba(0,0,0,.6)'); lab.position.y = 1.0; p.add(lab);
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
