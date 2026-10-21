// Кухарчата — оформлення кухонь по країнах: стіна з візерунком, речі на стіні, гірлянди,
// зала з гостями й офіціант, що відносить страви.
import * as THREE from 'three';
import { RECIPES } from './data.js';
import { dishCanvas } from './icons.js';

const matC = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!matC.has(k)) matC.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o })); return matC.get(k); };
const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 16, 12), CYL = new THREE.CylinderGeometry(1, 1, 1, 18), CONE = new THREE.ConeGeometry(1, 1, 16), TOR = new THREE.TorusGeometry(1, 0.15, 8, 24), PLANE = new THREE.PlaneGeometry(1, 1);
function m(geo, mt, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, mt); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }
function canvasTex(w, h, draw, rx = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = rx; t.anisotropy = 4; return t;
}

/* ---------- візерунки стін ---------- */
function wallPattern(theme) {
  return (g, W, H) => {
    switch (theme) {
      case 'ua': { // біла хата з вишиваним поясом
        g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#8a5a3a'; g.fillRect(0, H * 0.84, W, H * 0.16);
        const y0 = H * 0.36, s = 8;
        for (let i = 0; i < W / s; i++) for (let j = 0; j < 5; j++) {
          const d = Math.abs(((i % 10) - 5)) + Math.abs(j - 2);
          if (d === 3 || d === 5) { g.fillStyle = '#c8202a'; g.fillRect(i * s, y0 + j * s, s - 1, s - 1); }
          else if (d === 1) { g.fillStyle = '#1a1a1a'; g.fillRect(i * s, y0 + j * s, s - 1, s - 1); }
        }
        g.fillStyle = '#c8202a'; g.fillRect(0, y0 - 6, W, 3); g.fillRect(0, y0 + 5 * s + 3, W, 3);
        break;
      }
      case 'de': { // дерев'яні панелі й баварські ромби
        for (let i = 0; i < W; i += 32) { g.fillStyle = i % 64 ? '#7a4f2e' : '#6b4426'; g.fillRect(i, 0, 32, H); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(i, 0, 2, H); }
        const s = 22;
        for (let i = 0; i < W / s + 1; i++) for (let j = 0; j < 2; j++) {
          g.fillStyle = (i + j) % 2 ? '#2f78c8' : '#ffffff';
          g.beginPath(); const cx = i * s + (j ? s / 2 : 0), cy = 14 + j * s / 2;
          g.moveTo(cx, cy - s / 2); g.lineTo(cx + s / 2, cy); g.lineTo(cx, cy + s / 2); g.lineTo(cx - s / 2, cy); g.fill();
        }
        break;
      }
      case 'it': {
        g.fillStyle = '#eab48a'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(Math.random() * W, Math.random() * H, 20, 8); }
        g.fillStyle = '#b8b1a4'; g.fillRect(0, H * 0.78, W, H * 0.22);
        for (let i = 0; i < W; i += 40) { g.strokeStyle = '#9b9488'; g.strokeRect(i, H * 0.78, 40, H * 0.11); g.strokeRect(i + 20, H * 0.89, 40, H * 0.11); }
        ['#2f9e44', '#ffffff', '#d63a3a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, 8 + i * 6, W, 6); });
        break;
      }
      case 'jp': {
        g.fillStyle = '#f6f0e0'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#5a3a24'; g.lineWidth = 5;
        for (let x = 0; x <= W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
        for (let y = 0; y <= H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        g.fillStyle = '#3d2618'; g.fillRect(0, H - 14, W, 14); g.fillRect(0, 0, W, 10);
        break;
      }
      case 'mx': {
        g.fillStyle = '#ff9d4d'; g.fillRect(0, 0, W, H);
        const s = 24, y0 = H * 0.62;
        for (let i = 0; i < W / s; i++) for (let j = 0; j < 2; j++) {
          g.fillStyle = '#fdfbf3'; g.fillRect(i * s, y0 + j * s, s - 2, s - 2);
          g.fillStyle = (i + j) % 2 ? '#2a5db0' : '#e9b400';
          g.beginPath(); g.arc(i * s + s / 2 - 1, y0 + j * s + s / 2 - 1, 6, 0, 7); g.fill();
        }
        g.fillStyle = '#2a9d8f'; g.fillRect(0, 0, W, 10);
        break;
      }
      case 'us': {
        g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, W, H);
        const s = 16;
        for (let i = 0; i < W / s; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#d43a3a' : '#ffffff'; g.fillRect(i * s, H * 0.6 + j * s, s, s); }
        g.fillStyle = '#c9d2db'; g.fillRect(0, H * 0.56, W, 6); g.fillRect(0, H - 6, W, 6);
        g.fillStyle = '#3355aa'; g.fillRect(0, 0, W, 12);
        break;
      }
    }
  };
}
const GARLAND = { ua: ['#2f6fd6', '#ffd23f'], de: ['#2f78c8', '#ffffff'], it: ['#2f9e44', '#ffffff', '#d63a3a'], mx: ['#e63946', '#ffb703', '#2a9d8f', '#8338ec', '#fb5607'], us: ['#d43a3a', '#ffffff', '#3355aa'] };
const HALL = {
  ua: { floor: 0xc9a27a, cloth: 0xffffff, cloth2: 0xc8202a },
  de: { floor: 0xa87b52, cloth: 0x2f78c8, cloth2: 0xffffff },
  it: { floor: 0xe3c7a0, cloth: 0xd63a3a, cloth2: 0xffffff },
  jp: { floor: 0xd8c597, cloth: 0x6b3b24, cloth2: 0x6b3b24 },
  mx: { floor: 0xe7b277, cloth: 0x2a9d8f, cloth2: 0xffb703 },
  us: { floor: 0xeeeeee, cloth: 0xd43a3a, cloth2: 0xd43a3a },
};

/* ---------- речі на стіні ---------- */
function plateArt(g, W, H) { // петриківка
  g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, 7); g.fill();
  g.strokeStyle = '#2f6fd6'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 8, 0, 7); g.stroke();
  const cols = ['#c8202a', '#f2a900', '#2e8b3a'];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2; g.fillStyle = cols[i % 3];
    g.beginPath(); g.ellipse(W / 2 + Math.cos(a) * 26, H / 2 + Math.sin(a) * 26, 14, 7, a, 0, 7); g.fill();
  }
  g.fillStyle = '#c8202a'; g.beginPath(); g.arc(W / 2, H / 2, 12, 0, 7); g.fill();
}
function rushnyk(g, W, H) {
  g.fillStyle = '#fbfbf5'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 40) for (let x = 0; x < W; x += 8) { const d = Math.abs(((x / 8) % 8) - 4) + Math.abs(((y / 8) % 5) - 2); if (d === 2 || d === 4) { g.fillStyle = '#c8202a'; g.fillRect(x, y + 10 + ((x / 8) % 2) * 6, 7, 7); } }
  g.fillStyle = '#c8202a'; for (let x = 0; x < W; x += 6) g.fillRect(x, H - 10, 3, 10);
}
function wallProps(theme, x, wallZ, rnd) {
  const g = new THREE.Group(); g.position.set(x, 0, wallZ + 0.12);
  const y = 1.25;
  switch (theme) {
    case 'ua': {
      const k = Math.floor(rnd() * 3);
      if (k === 0) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, plateArt), roughness: 0.4 })); p.position.y = y; g.add(p); }
      else if (k === 1) { const r = new THREE.Mesh(PLANE, new THREE.MeshStandardMaterial({ map: canvasTex(64, 256, rushnyk), side: THREE.DoubleSide })); r.scale.set(0.32, 1.0, 1); r.position.y = y - 0.05; g.add(r); g.add(m(CYL, mat(0x6b4226), 0.03, 0.6, 0.03, 0, y + 0.47)).rotation.z = Math.PI / 2; }
      else { // поличка з Кобзарем і глечиком
        g.add(m(BOX, mat(0x8a5a3a), 0.8, 0.05, 0.2, 0, y - 0.2, 0.05));
        g.add(m(BOX, mat(0x5a2a1a), 0.22, 0.3, 0.12, -0.18, y - 0.02, 0.05));
        const lab = new THREE.Mesh(PLANE, new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (c) => { c.fillStyle = '#5a2a1a'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#ffd23f'; c.font = 'bold 22px serif'; c.textAlign = 'center'; c.fillText('КОБЗАР', 64, 40); }) }));
        lab.scale.set(0.2, 0.1, 1); lab.position.set(-0.18, y + 0.02, 0.115); g.add(lab);
        g.add(m(SPH, mat(0xb5532f), 0.12, 0.13, 0.12, 0.18, y - 0.04, 0.05)); g.add(m(CYL, mat(0xb5532f), 0.05, 0.1, 0.05, 0.18, y + 0.1, 0.05));
        g.add(m(TOR, mat(0xffd23f), 0.08, 0.08, 0.08, 0.18, y + 0.02, 0.15));
      }
      break;
    }
    case 'de': {
      if (rnd() < 0.5) { // годинник із зозулею
        g.add(m(BOX, mat(0x5a3418), 0.36, 0.4, 0.12, 0, y));
        const roof = m(CONE, mat(0x3a2210), 0.32, 0.18, 0.1, 0, y + 0.28); roof.rotation.y = Math.PI / 4; g.add(roof);
        g.add(m(CYL, mat(0xfff7e6), 0.11, 0.02, 0.11, 0, y + 0.02, 0.07)).rotation.x = Math.PI / 2;
        g.add(m(CYL, mat(0xc9a227, { metalness: 0.6 }), 0.02, 0.4, 0.02, -0.06, y - 0.4)); g.add(m(CYL, mat(0xc9a227, { metalness: 0.6 }), 0.02, 0.32, 0.02, 0.06, y - 0.36));
      } else { // брецель-вивіска
        const b = new THREE.Group(); b.position.y = y;
        for (const [px, r] of [[-0.1, 0.12], [0.1, 0.12]]) b.add(m(TOR, mat(0xa0582a), r, r, r * 1.6, px, 0.02));
        b.add(m(TOR, mat(0xa0582a), 0.2, 0.15, 0.3, 0, -0.04));
        g.add(b);
      }
      break;
    }
    case 'it': {
      if (rnd() < 0.5) { for (let i = 0; i < 5; i++) g.add(m(SPH, mat(i % 2 ? 0xffffff : 0xd63a3a), 0.06, 0.08, 0.06, 0, y + 0.3 - i * 0.14)); g.add(m(CYL, mat(0x8a6a48), 0.01, 0.75, 0.01, 0, y)); }
      else { g.add(m(BOX, mat(0x8a5a3a), 0.8, 0.05, 0.2, 0, y - 0.2, 0.05)); for (let i = 0; i < 3; i++) { g.add(m(CYL, mat(0xdfeef5, { transparent: true, opacity: 0.6 }), 0.08, 0.28, 0.08, -0.24 + i * 0.24, y - 0.03, 0.05)); g.add(m(CYL, mat([0xf2cf63, 0xd63a3a, 0x2f9e44][i]), 0.065, 0.2, 0.065, -0.24 + i * 0.24, y - 0.06, 0.05)); } }
      break;
    }
    case 'jp': { // паперовий ліхтарик
      g.add(m(SPH, mat(0xe53935, { emissive: 0xff6a3a, emissiveIntensity: 0.35 }), 0.17, 0.24, 0.17, 0, y + 0.2, 0.15));
      g.add(m(CYL, mat(0x222222), 0.1, 0.04, 0.1, 0, y + 0.45, 0.15)); g.add(m(CYL, mat(0x222222), 0.1, 0.04, 0.1, 0, y - 0.04, 0.15));
      break;
    }
    case 'mx': {
      if (rnd() < 0.55) { // сомбреро
        const s = new THREE.Group(); s.position.set(0, y + 0.05, 0.08); s.rotation.x = Math.PI / 2 - 0.35;
        const c = [0xe63946, 0xffb703, 0x2a9d8f][Math.floor(rnd() * 3)];
        s.add(m(CYL, mat(0xe9c46a), 0.42, 0.03, 0.42)); s.add(m(CONE, mat(0xe9c46a), 0.17, 0.32, 0.17, 0, 0.16)); s.add(m(TOR, mat(c), 0.3, 0.3, 0.3, 0, 0.03)).rotation.x = Math.PI / 2;
        g.add(s);
      } else { // гітара
        const gt = new THREE.Group(); gt.position.set(0, y, 0.05); gt.rotation.z = 0.3;
        gt.add(m(CYL, mat(0xc77d3a), 0.17, 0.05, 0.17, 0, -0.15)).rotation.x = Math.PI / 2; gt.add(m(CYL, mat(0xc77d3a), 0.13, 0.05, 0.13, 0, 0.07)).rotation.x = Math.PI / 2;
        gt.add(m(CYL, mat(0x222222), 0.05, 0.06, 0.05, 0, -0.1, 0.01)).rotation.x = Math.PI / 2;
        gt.add(m(BOX, mat(0x5a3418), 0.05, 0.42, 0.03, 0, 0.35)); g.add(gt);
      }
      break;
    }
    case 'us': {
      const txt = ['DINER', 'OPEN', 'BURGERS', '★ USA ★'][Math.floor(rnd() * 4)];
      const n = new THREE.Mesh(PLANE, new THREE.MeshBasicMaterial({ map: canvasTex(256, 96, (c) => { c.fillStyle = '#1a1a2a'; c.fillRect(0, 0, 256, 96); c.shadowColor = '#ff3b6b'; c.shadowBlur = 14; c.strokeStyle = '#ff6b9b'; c.lineWidth = 4; c.strokeRect(8, 8, 240, 80); c.fillStyle = '#fff0f6'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText(txt, 128, 62); }) }));
      n.scale.set(0.8, 0.3, 1); n.position.y = y + 0.05; g.add(n);
      break;
    }
  }
  return g;
}

/* ---------- гості й офіціант (простіші моделі) ---------- */
const GUEST_COLS = [0xe5484d, 0x3d7be0, 0x3cb371, 0xf2b829, 0x9b59d0, 0xf07c2a, 0x2a9d8f, 0xff8fab];
const SKIN = [0xffd7b5, 0xf1c27d, 0xe0ac69, 0xffdbc4, 0xc68642];
function guest(i, rnd) {
  const g = new THREE.Group();
  g.add(m(SPH, mat(GUEST_COLS[Math.floor(rnd() * GUEST_COLS.length)]), 0.24, 0.24, 0.22, 0, 0.32));
  const head = m(SPH, mat(SKIN[Math.floor(rnd() * SKIN.length)]), 0.25, 0.23, 0.24, 0, 0.72); g.add(head);
  g.add(m(SPH, mat(0x1d1d24), 0.04, 0.05, 0.03, -0.08, 0.74, 0.21)); g.add(m(SPH, mat(0x1d1d24), 0.04, 0.05, 0.03, 0.08, 0.74, 0.21));
  g.add(m(SPH, mat(0xff9aa8), 0.04, 0.025, 0.02, -0.14, 0.66, 0.18)); g.add(m(SPH, mat(0xff9aa8), 0.04, 0.025, 0.02, 0.14, 0.66, 0.18));
  const hair = rnd();
  if (hair < 0.4) g.add(m(SPH, mat([0x3a2618, 0x8a5a2a, 0xe8c46a, 0x1a1a1a][Math.floor(rnd() * 4)]), 0.26, 0.15, 0.25, 0, 0.84, -0.03));
  else if (hair < 0.6) { g.add(m(CYL, mat(0x2a2a2a), 0.17, 0.12, 0.17, 0, 0.95)); g.add(m(CYL, mat(0x2a2a2a), 0.26, 0.02, 0.26, 0, 0.9)); }
  g.userData.ph = rnd() * 6;
  return g;
}
function waiterMesh() {
  const g = new THREE.Group();
  g.add(m(SPH, mat(0x222831), 0.25, 0.24, 0.23, 0, 0.3));
  g.add(m(SPH, mat(0xffffff), 0.17, 0.17, 0.08, 0, 0.32, 0.17));
  g.add(m(BOX, mat(0xd62f2f), 0.14, 0.05, 0.04, 0, 0.52, 0.22)); // метелик
  g.add(m(SPH, mat(0xffd7b5), 0.27, 0.25, 0.26, 0, 0.75));
  g.add(m(SPH, mat(0x1d1d24), 0.04, 0.055, 0.03, -0.09, 0.77, 0.23)); g.add(m(SPH, mat(0x1d1d24), 0.04, 0.055, 0.03, 0.09, 0.77, 0.23));
  g.add(m(SPH, mat(0x3a2618), 0.28, 0.14, 0.27, 0, 0.88, -0.03));
  const tray = new THREE.Group(); tray.position.set(0.22, 0.62, 0.22); tray.add(m(CYL, mat(0xc9d2db, { metalness: 0.6, roughness: 0.3 }), 0.2, 0.02, 0.2)); g.add(tray);
  g.userData.tray = tray;
  return g;
}
function dishSprite(icon) {
  const t = canvasTex(96, 96, (c) => { if (RECIPES[icon]) c.drawImage(dishCanvas(icon), 0, 0, 96, 96); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); s.scale.set(0.42, 0.42, 1); return s;
}

/* ================================================================ */
export class Decor {
  constructor(scene, sim, themeName, opts = {}) {
    this.scene = scene; this.sim = sim; this.theme = themeName;
    this.guests = []; this.tables = []; this.waiters = []; this.queue = []; this.dishes = []; this.t = 0;
    let seed = sim.w * 7 + sim.h * 13 + themeName.length; this.rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    // з якого боку видача
    const serves = sim.tiles.filter(t => t.type === 'serve');
    this.side = serves.length && serves.every(t => t.x === sim.w - 1) ? 'east' : serves.every(t => t.x === 0) && serves.length ? 'west' : 'north';
    this.serves = serves;
    this.buildWall();
    this.buildGarland();
    if (opts.hall) this.buildHall();
  }
  // перетворення: u — уздовж стіни, v — углиб зали (від кухні)
  toWorld(u, v, side = this.side) {
    const { sim } = this;
    if (side === 'north') return [u, -0.5 - v];
    if (side === 'east') return [sim.w - 0.5 + v, u];
    return [-0.5 - v, u];
  }
  get span() { return this.side === 'north' ? this.sim.w : this.sim.h; }
  buildWall() { this.buildWallSide('north'); if (this.side !== 'north') this.buildWallSide(this.side); }
  buildWallSide(side) {
    const { sim, scene } = this;
    const tex = canvasTex(256, 128, wallPattern(this.theme), 1);
    const wm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const H = 1.55, serveSet = new Set(this.serves.filter(t => side === 'north' ? t.y === 0 : side === 'east' ? t.x === sim.w - 1 : t.x === 0).map(t => side === 'north' ? t.x : t.y));
    const along = side === 'north' ? sim.w : sim.h;
    const rnd = this.rnd;
    for (let u = 0; u < along; u++) {
      const [x, z] = this.toWorld(u, 0.12, side);
      if (serveSet.has(u)) { // віконце видачі
        const lintel = new THREE.Mesh(BOX, wm); lintel.scale.set(1, 0.35, 0.24); lintel.position.set(x, H - 0.17, z);
        if (side !== 'north') lintel.rotation.y = Math.PI / 2;
        scene.add(lintel); continue;
      }
      const w = new THREE.Mesh(BOX, wm); w.scale.set(1.001, H, 0.24); w.position.set(x, H / 2, z);
      if (side !== 'north') w.rotation.y = Math.PI / 2;
      w.receiveShadow = true; scene.add(w);
      if (u % 3 === 1 && side === 'north') { const p = wallProps(this.theme, x, z, rnd); scene.add(p); }
    }
  }
  buildGarland() {
    const { sim, scene } = this;
    const cols = GARLAND[this.theme];
    const n = Math.round(sim.w * 2.2), y0 = 2.15, z = -0.25;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -0.5 + u * sim.w, y = y0 - Math.sin(u * Math.PI * 3) ** 2 * 0.35;
      if (this.theme === 'jp') { if (i % 3) continue; const l = m(SPH, mat(0xff5a4a, { emissive: 0xff4a2a, emissiveIntensity: 0.4 }), 0.1, 0.14, 0.1, x, y - 0.15, z); scene.add(l); continue; }
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 3), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
      f.rotation.x = Math.PI; f.position.set(x, y - 0.13, z); scene.add(f);
    }
  }
  buildHall() {
    const { scene } = this, H = HALL[this.theme] || HALL.ua, rnd = this.rnd;
    const span = this.span, depth = 6.5;
    // підлога зали
    const [fx, fz] = this.toWorld(span / 2 - 0.5, depth / 2 + 0.25);
    const fl = new THREE.Mesh(BOX, mat(H.floor, { roughness: 0.8 }));
    if (this.side === 'north') fl.scale.set(span + 2, 0.1, depth); else fl.scale.set(depth, 0.1, span + 2);
    fl.position.set(fx, -0.05, fz); fl.receiveShadow = true; scene.add(fl);
    // столики
    for (let row = 0; row < 2; row++) for (let u = 1.2 + (row ? 1.4 : 0); u < span - 1; u += 3.0) {
      const v = 1.8 + row * 2.4;
      const [x, z] = this.toWorld(u, v);
      const tbl = new THREE.Group(); tbl.position.set(x, 0, z);
      tbl.add(m(CYL, mat(0x6b4226), 0.06, 0.55, 0.06, 0, 0.28));
      tbl.add(m(CYL, mat(H.cloth), 0.55, 0.06, 0.55, 0, 0.58));
      tbl.add(m(CYL, mat(H.cloth2), 0.57, 0.02, 0.57, 0, 0.55));
      scene.add(tbl);
      const T = { x, z, guests: [] };
      const n = 2 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + rnd();
        const gst = guest(k, rnd); gst.scale.setScalar(0.85);
        gst.position.set(x + Math.cos(a) * 0.8, 0.02, z + Math.sin(a) * 0.8);
        gst.rotation.y = Math.atan2(x - gst.position.x, z - gst.position.z);
        scene.add(gst); T.guests.push(gst); this.guests.push(gst);
        scene.add(m(BOX, mat(0x8a5a3a), 0.32, 0.25, 0.32, gst.position.x, 0.12, gst.position.z));
      }
      this.tables.push(T);
    }
    // офіціанти
    const nW = this.span > 15 ? 2 : 1;
    for (let i = 0; i < nW; i++) {
      const s = this.serves[i % this.serves.length];
      const [x, z] = this.toWorld(this.side === 'north' ? s.x : s.y, 0.75);
      const w = waiterMesh(); w.position.set(x, 0, z); scene.add(w);
      this.waiters.push({ m: w, home: [x, z], state: 'idle', target: null, dish: null, t: rnd() * 5 });
    }
  }
  onServe(e) {
    if (!this.waiters.length || !this.tables.length) return;
    this.queue.push(e.r);
  }
  update(dt) {
    this.t += dt;
    for (const g of this.guests) { g.position.y = 0.02 + Math.max(0, Math.sin(this.t * 2 + g.userData.ph)) * 0.02 + (g.userData.jump > 0 ? Math.sin(g.userData.jump * 9) ** 2 * 0.25 : 0); if (g.userData.jump > 0) g.userData.jump -= dt; }
    for (const W of this.waiters) {
      W.t += dt;
      if (W.state === 'idle' && this.queue.length) {
        const r = this.queue.shift();
        W.dish = dishSprite(r); W.dish.position.y = 0.2; W.m.userData.tray.add(W.dish);
        W.table = this.tables[Math.floor(this.rnd() * this.tables.length)];
        W.target = [W.table.x + 0.6, W.table.z + 0.6]; W.state = 'go';
      }
      if (W.state === 'go' || W.state === 'back') {
        const [tx, tz] = W.state === 'go' ? W.target : W.home;
        const dx = tx - W.m.position.x, dz = tz - W.m.position.z, d = Math.hypot(dx, dz);
        if (d < 0.08) {
          if (W.state === 'go') {
            W.m.userData.tray.remove(W.dish);
            W.dish.position.set(W.table.x, 0.85, W.table.z); this.scene.add(W.dish); this.dishes.push({ s: W.dish, t: 9 });
            for (const g of W.table.guests) g.userData.jump = 0.9;
            W.dish = null; W.state = 'back';
          } else W.state = 'idle';
        } else {
          const sp = 3.2 * dt; W.m.position.x += dx / d * Math.min(sp, d); W.m.position.z += dz / d * Math.min(sp, d);
          W.m.rotation.y = Math.atan2(dx, dz);
          W.m.position.y = Math.abs(Math.sin(W.t * 12)) * 0.05;
        }
      } else { W.m.position.y = 0; W.m.rotation.y += (Math.atan2(this.side === 'north' ? 0 : this.side === 'east' ? -1 : 1, this.side === 'north' ? 1 : 0) - W.m.rotation.y) * Math.min(1, dt * 4); }
    }
    for (const d of this.dishes) { d.t -= dt; if (d.t <= 0) this.scene.remove(d.s); }
    this.dishes = this.dishes.filter(d => d.t > 0);
  }
}
