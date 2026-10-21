// Кухарчата — 3D-кухня на three.js: станції, продукти, кухарчата-чубики, вогонь, підказки
import * as THREE from 'three';
import { ING, RECIPES, COOKER, COOK_COLORS } from './data.js';
import { cookerState, cookerNeed } from './sim.js';
import { drawIcon, drawIng } from './icons.js';
import { Decor } from './decor.js';

export const THEMES = {
  ua: { sky: 0xcfe8ff, ground: 0x86c45f, floorA: 0xf6efdc, floorB: 0xdbe7f6, body: 0xc89a6a, top: 0xf7f2e6, accent: 0x2f6fd6, accent2: 0xffd23f, decor: 'sunflower' },
  it: { sky: 0xffeacb, ground: 0xd8c08c, floorA: 0xe8b38a, floorB: 0xf4d6b8, body: 0x6f9e66, top: 0xf8f5ef, accent: 0xd63a3a, accent2: 0x2f9e44, decor: 'lemon' },
  jp: { sky: 0xffe3ec, ground: 0x9bcf7d, floorA: 0xdccb9e, floorB: 0xe9ddb8, body: 0x7a3b2e, top: 0xeee7d6, accent: 0xd63a3a, accent2: 0xffffff, decor: 'sakura' },
  mx: { sky: 0xffdcae, ground: 0xe9cb8c, floorA: 0xf2c38b, floorB: 0x93d5cb, body: 0x2a9d8f, top: 0xf6e7c8, accent: 0xe76f51, accent2: 0xf4a261, decor: 'cactus' },
  de: { sky: 0xd6ebff, ground: 0x7fbf5f, floorA: 0xd9b48a, floorB: 0xc79f72, body: 0x6b4426, top: 0xf3ead8, accent: 0x2f78c8, accent2: 0xffffff, decor: 'bavaria' },
  us: { sky: 0xcad8ea, ground: 0x8fa0ad, floorA: 0xf4f4f4, floorB: 0x2e2e33, body: 0xc0392b, top: 0xdde1e6, accent: 0x3355aa, accent2: 0xffffff, decor: 'city' },
};

const M = {}; // спільні матеріали
function mat(col, opts = {}) {
  const k = col + JSON.stringify(opts);
  if (!M[k]) M[k] = new THREE.MeshStandardMaterial({ color: col, roughness: 0.65, metalness: 0, ...opts });
  return M[k];
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(1, 20, 14),
  sphLo: new THREE.SphereGeometry(1, 12, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 12),
  tor: new THREE.TorusGeometry(1, 0.18, 8, 20),
  wedge: new THREE.CylinderGeometry(1, 1, 1, 3),
  plane: new THREE.PlaneGeometry(1, 1),
};
function mesh(geo, material, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const darker = (c, f) => new THREE.Color(c).multiplyScalar(f).getHex();
const TOP_Y = 0.82;

/* ---------- текстові/значкові спрайти ---------- */
function canvasSprite(w, h, draw, scale = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(scale * w / h, scale, 1); s.renderOrder = 10;
  return s;
}
function bubble(items, big) { // items: [{id,s}] або recipe-емодзі
  const n = big ? 1 : Math.max(1, items.length);
  const S = 72, W = big ? 96 : 24 + n * S, H = big ? 96 : 92;
  return canvasSprite(W, H, (g) => {
    g.fillStyle = 'rgba(255,255,255,.93)'; g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(3, 3, W - 6, H - 14, 22); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(W / 2 - 9, H - 12); g.lineTo(W / 2 + 9, H - 12); g.lineTo(W / 2, H - 1); g.fill();
    if (big) drawIcon(g, big, W / 2, (H - 10) / 2, 70);
    else items.forEach((it, i) => drawIng(g, it.id, it.s, 12 + S / 2 + i * S, (H - 10) / 2, 60));
  }, big ? 0.5 : 0.42);
}
export function textSprite(text, color = '#fff', size = 0.34, stroke = 'rgba(0,0,0,.55)') {
  const fs = 64;
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  g.font = `900 ${fs}px "Nunito","Trebuchet MS",sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + 24;
  return canvasSprite(w, fs + 24, (g, W, H) => {
    g.font = `900 ${fs}px "Nunito","Trebuchet MS",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = stroke; g.strokeText(text, W / 2, H / 2 + 2); g.fillStyle = color; g.fillText(text, W / 2, H / 2 + 2);
  }, size);
}

/* ---------- продукти ---------- */
const STATE_TINT = { r: 1, c: 1, b: 1.08, f: 0.72, k: 0.9, x: 0.18 };
export function makeIngMesh(id, s) {
  const d = ING[id], g = new THREE.Group();
  let col = d.col;
  if (s === 'x') col = 0x2a2522;
  else if (s === 'f') col = darker(d.col, 0.72) ;
  else if (s === 'k') col = new THREE.Color(d.col).lerp(new THREE.Color(0xd9902f), 0.35).getHex();
  const m = mat(col);
  if (s === 'c' || s === 'b' || s === 'f' || s === 'k' || s === 'x') {
    if (d.shape === 'disc' || d.shape === 'sheet' || d.shape === 'slab' && s !== 'c') { // цільне, але приготоване
      if (d.shape === 'slab') { g.add(mesh(G.box, m, 0.32, 0.1, 0.24, 0, 0.05)); }
      else if (d.shape === 'sheet') g.add(mesh(G.box, m, 0.3, 0.02, 0.3, 0, 0.01));
      else g.add(mesh(G.cyl, m, 0.2, 0.05, 0.2, 0, 0.03));
    } else if (d.shape === 'sack') { // зварене: купка
      for (let i = 0; i < 6; i++) g.add(mesh(G.sphLo, m, 0.07, 0.05, 0.07, Math.cos(i) * 0.09, 0.05 + (i % 2) * 0.03, Math.sin(i * 1.7) * 0.09));
    } else if (d.shape === 'stick' && s === 'f') {
      g.add(mesh(new THREE.CapsuleGeometry(0.06, 0.24, 4, 8), m, 1, 1, 1, 0, 0.07)); g.children[0].rotation.z = Math.PI / 2;
    } else { // нарізане шматочками
      for (let i = 0; i < 4; i++) {
        const a = i * 1.6, r = 0.07 + (i % 2) * 0.03;
        const pc = mesh(d.shape === 'leaf' ? G.sphLo : G.box, m, 0.08, 0.06, 0.08, Math.cos(a) * r, 0.04 + (i === 3 ? 0.05 : 0), Math.sin(a) * r);
        pc.rotation.y = a; g.add(pc);
      }
    }
    return g;
  }
  switch (d.shape) {
    case 'ball': g.add(mesh(G.sph, m, 0.15, 0.14, 0.15, 0, 0.14)); g.add(mesh(G.cone, mat(0x3c9a3c), 0.05, 0.08, 0.05, 0, 0.3)); break;
    case 'leaf': for (let i = 0; i < 3; i++) g.add(mesh(G.sph, m, 0.12, 0.1, 0.16, (i - 1) * 0.08, 0.1, (i % 2) * 0.04)); break;
    case 'stick': { const c = mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), m); c.rotation.z = Math.PI / 2; c.position.y = 0.07; g.add(c); break; }
    case 'egg': g.add(mesh(G.sph, m, 0.17, 0.12, 0.13, 0, 0.12)); break;
    case 'slab': g.add(mesh(G.box, m, 0.32, 0.12, 0.24, 0, 0.06)); g.add(mesh(G.box, mat(0xfff0e8), 0.33, 0.04, 0.05, 0, 0.1, 0.08)); break;
    case 'fish': g.add(mesh(G.sph, m, 0.2, 0.09, 0.1, 0, 0.1)); { const t = mesh(G.cone, m, 0.08, 0.12, 0.04, -0.24, 0.1); t.rotation.z = Math.PI / 2; g.add(t); } g.add(mesh(G.sphLo, mat(0x111111), 0.02, 0.02, 0.02, 0.14, 0.13, 0.08)); break;
    case 'bun': g.add(mesh(G.sph, m, 0.18, 0.11, 0.18, 0, 0.1)); g.add(mesh(G.cyl, mat(darker(d.col, 1.15)), 0.18, 0.05, 0.18, 0, 0.03)); break;
    case 'wedge': { const w = mesh(G.wedge, m, 0.2, 0.14, 0.2, 0, 0.07); w.rotation.y = 0.3; g.add(w); break; }
    case 'mush': g.add(mesh(G.cylLo, mat(0xf2e8d8), 0.05, 0.14, 0.05, 0, 0.07)); g.add(mesh(G.sph, m, 0.14, 0.08, 0.14, 0, 0.16)); break;
    case 'disc': g.add(mesh(G.cyl, m, 0.22, 0.05, 0.22, 0, 0.03)); break;
    case 'sack': g.add(mesh(G.sph, mat(0xe9dcc0), 0.15, 0.17, 0.15, 0, 0.17)); g.add(mesh(G.cyl, m, 0.1, 0.03, 0.1, 0, 0.33)); g.add(mesh(G.tor, mat(0x8a5a2b), 0.06, 0.06, 0.06, 0, 0.3)); g.children[2].rotation.x = Math.PI / 2; break;
    case 'sheet': g.add(mesh(G.box, m, 0.3, 0.02, 0.3, 0, 0.01)); g.add(mesh(G.box, m, 0.28, 0.02, 0.28, 0.01, 0.03)); break;
    case 'cube': for (let i = 0; i < 3; i++) g.add(mesh(G.box, mat(0xdff6ff, { transparent: true, opacity: 0.8, roughness: 0.1 }), 0.1, 0.1, 0.1, (i - 1) * 0.09, 0.06 + (i % 2) * 0.05, (i % 2) * 0.05)); break;
    case 'jar': g.add(mesh(G.cyl, m, 0.11, 0.2, 0.11, 0, 0.1)); g.add(mesh(G.cyl, mat(0x4a90d9), 0.12, 0.05, 0.12, 0, 0.22)); break;
    default: g.add(mesh(G.sph, m, 0.15, 0.15, 0.15, 0, 0.15));
  }
  return g;
}

function plateMesh(dirty = false) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, mat(dirty ? 0xbfae94 : 0xffffff, { roughness: 0.3 }), 0.3, 0.04, 0.3, 0, 0.02));
  g.add(mesh(G.cyl, mat(dirty ? 0xa89577 : 0xe9eef3, { roughness: 0.3 }), 0.22, 0.045, 0.22, 0, 0.03));
  return g;
}
function cookerMesh(ck) {
  const g = new THREE.Group();
  if (ck.k === 'pot') {
    g.add(mesh(G.cyl, mat(0x8a96a3, { metalness: 0.5, roughness: 0.35 }), 0.27, 0.28, 0.27, 0, 0.14));
    g.add(mesh(G.cylLo, mat(0x2b2b2b), 0.035, 0.035, 0.12, 0.32, 0.22, 0)).rotation.z = Math.PI / 2;
    g.add(mesh(G.cylLo, mat(0x2b2b2b), 0.035, 0.035, 0.12, -0.32, 0.22, 0)).rotation.z = Math.PI / 2;
    if (ck.c.length) {
      const st = cookerState(ck);
      const cols = ck.c.map(i => new THREE.Color(ING[i.id].col));
      const avg = cols.reduce((a, c) => a.add(c), new THREE.Color(0, 0, 0)).multiplyScalar(1 / cols.length);
      if (st === 'burnt') avg.set(0x2a2522); else if (st === 'cooking') avg.lerp(new THREE.Color(0xffffff), 0.25);
      const lvl = 0.08 + 0.06 * ck.c.length;
      const soup = mesh(G.cyl, mat(avg.getHex(), { roughness: 0.25 }), 0.24, 0.02, 0.24, 0, lvl);
      soup.name = 'soup'; g.add(soup);
    }
  } else if (ck.k === 'pan') {
    g.add(mesh(G.cyl, mat(0x2d2d30, { metalness: 0.4, roughness: 0.4 }), 0.3, 0.05, 0.3, 0, 0.04));
    const h = mesh(G.box, mat(0x6b4226), 0.32, 0.04, 0.06, 0.44, 0.06, 0); g.add(h);
    if (ck.c.length) { const m = makeIngMesh(ck.c[0].id, ck.c[0].s); m.position.y = 0.06; g.add(m); }
  }
  return g;
}
export function makeItemMesh(it) {
  if (!it) return null;
  if (it.t === 'i') return makeIngMesh(it.id, it.s);
  if (it.t === 'p') {
    const g = plateMesh();
    it.c.forEach((c, i) => {
      const m = makeIngMesh(c.id, c.s); const a = i / Math.max(1, it.c.length) * Math.PI * 2;
      const r = it.c.length > 1 ? 0.1 : 0;
      m.position.set(Math.cos(a) * r, 0.05 + i * 0.01, Math.sin(a) * r); m.scale.setScalar(0.85); g.add(m);
    });
    return g;
  }
  if (it.t === 'c') { // кухоль
    const g = new THREE.Group();
    g.add(mesh(G.cyl, mat(0xffffff, { roughness: 0.25, transparent: true, opacity: 0.88 }), 0.13, 0.26, 0.13, 0, 0.13));
    const h = mesh(G.tor, mat(0xffffff, { roughness: 0.25 }), 0.08, 0.08, 0.08, 0.15, 0.14); h.rotation.y = Math.PI / 2; g.add(h);
    const liq = it.c.filter(c => c.s === 'l');
    if (liq.length) {
      const col = liq.reduce((a, c) => a.add(new THREE.Color(ING[c.id].col)), new THREE.Color(0, 0, 0)).multiplyScalar(1 / liq.length);
      g.add(mesh(G.cyl, mat(col.getHex(), { roughness: 0.2 }), 0.115, 0.1 * liq.length + 0.02, 0.115, 0, 0.03 + (0.1 * liq.length) / 2));
    }
    const top = 0.06 + 0.1 * liq.length;
    for (const c of it.c) {
      if (c.id === 'ice') for (let i = 0; i < 3; i++) g.add(mesh(G.box, mat(0xe6f8ff, { transparent: true, opacity: 0.85 }), 0.06, 0.06, 0.06, (i - 1) * 0.05, top, (i % 2) * 0.04));
      if (c.id === 'caramel') g.add(mesh(G.cyl, mat(0xc98a2a, { roughness: 0.2 }), 0.1, 0.02, 0.1, 0, top + 0.03));
    }
    return g;
  }
  if (it.t === 'd') { const g = new THREE.Group(); for (let i = 0; i < Math.min(it.n, 6); i++) { const p = plateMesh(true); p.position.y = i * 0.05; g.add(p); } return g; }
  if (it.t === 'k') return cookerMesh(it);
  if (it.t === 'x') {
    const g = new THREE.Group();
    g.add(mesh(G.cyl, mat(0xd62f2f, { roughness: 0.3 }), 0.1, 0.42, 0.1, 0, 0.21));
    g.add(mesh(G.cylLo, mat(0x222222), 0.04, 0.08, 0.04, 0, 0.46));
    g.add(mesh(G.box, mat(0x222222), 0.16, 0.03, 0.03, 0.08, 0.5));
    return g;
  }
  return null;
}
export function itemKey(it) {
  if (!it) return '';
  if (it.t === 'i') return 'i' + it.id + it.s;
  if (it.t === 'p' || it.t === 'c') return it.t + it.c.map(c => c.id + c.s).join(',');
  if (it.t === 'k') return 'k' + it.k + it.c.map(c => c.id + c.s).join(',') + cookerState(it);
  if (it.t === 'd') return 'd' + it.n;
  return it.t;
}

/* ---------- кухарчата ---------- */
const SKIN = [0xffd7b5, 0xf1c27d, 0xe0ac69, 0xffdbc4, 0xc68642, 0xffe0cc];
export function makeCook(colorIdx, hat = 0, isBot = false, name = '') {
  const col = isBot ? 0x9aa6b2 : COOK_COLORS[colorIdx % COOK_COLORS.length].c;
  const skin = isBot ? 0xc9d3dc : SKIN[colorIdx % SKIN.length];
  const root = new THREE.Group(), g = new THREE.Group(); root.add(g);
  const body = mesh(G.sph, mat(col), 0.26, 0.24, 0.24, 0, 0.3); g.add(body);
  g.add(mesh(G.sph, mat(0xffffff), 0.2, 0.18, 0.08, 0, 0.27, 0.17)); // фартух
  const head = new THREE.Group(); head.position.y = 0.72; g.add(head);
  head.add(mesh(G.sph, mat(skin, { roughness: 0.55, metalness: isBot ? 0.4 : 0 }), 0.3, 0.27, 0.28));
  if (isBot) {
    head.add(mesh(G.box, mat(0x1b2b3a, { roughness: 0.2 }), 0.36, 0.12, 0.1, 0, 0.02, 0.22));
    head.add(mesh(G.sph, mat(0x41e0ff, { emissive: 0x2ab8ff, emissiveIntensity: 0.8 }), 0.04, 0.04, 0.03, -0.08, 0.02, 0.28));
    head.add(mesh(G.sph, mat(0x41e0ff, { emissive: 0x2ab8ff, emissiveIntensity: 0.8 }), 0.04, 0.04, 0.03, 0.08, 0.02, 0.28));
    head.add(mesh(G.cylLo, mat(0x555555), 0.012, 0.18, 0.012, 0, 0.36));
    head.add(mesh(G.sph, mat(0xff4040, { emissive: 0xff2020, emissiveIntensity: 0.6 }), 0.045, 0.045, 0.045, 0, 0.46));
  } else {
    const eye = mat(0x1d1d24, { roughness: 0.2 });
    head.add(mesh(G.sph, eye, 0.045, 0.06, 0.03, -0.1, 0.02, 0.26));
    head.add(mesh(G.sph, eye, 0.045, 0.06, 0.03, 0.1, 0.02, 0.26));
    head.add(mesh(G.sph, mat(0xffffff), 0.015, 0.018, 0.01, -0.09, 0.04, 0.29));
    head.add(mesh(G.sph, mat(0xffffff), 0.015, 0.018, 0.01, 0.11, 0.04, 0.29));
    head.add(mesh(G.sph, mat(0xff9aa8), 0.05, 0.03, 0.02, -0.17, -0.06, 0.22));
    head.add(mesh(G.sph, mat(0xff9aa8), 0.05, 0.03, 0.02, 0.17, -0.06, 0.22));
    head.add(mesh(G.sph, mat(0x8a3b2b), 0.04, 0.02, 0.02, 0, -0.08, 0.27));
    // капелюшки
    const white = mat(0xffffff);
    switch (hat % 6) {
      case 0: head.add(mesh(G.cyl, white, 0.2, 0.16, 0.2, 0, 0.27)); for (let i = 0; i < 4; i++) head.add(mesh(G.sph, white, 0.12, 0.11, 0.12, Math.cos(i * 1.57) * 0.1, 0.39, Math.sin(i * 1.57) * 0.1)); head.add(mesh(G.sph, white, 0.13, 0.12, 0.13, 0, 0.44)); break;
      case 1: { const b = mesh(G.tor, mat(col), 0.28, 0.28, 0.28, 0, 0.12); b.rotation.x = Math.PI / 2; head.add(b); head.add(mesh(G.sph, mat(col), 0.06, 0.06, 0.06, -0.2, 0.12, -0.24)); break; }
      case 2: head.add(mesh(G.sph, mat(col), 0.29, 0.18, 0.29, 0, 0.12)); head.add(mesh(G.cyl, mat(col), 0.22, 0.03, 0.18, 0, 0.12, 0.24)); break;
      case 3: { head.add(mesh(G.cyl, mat(0xffc93c, { metalness: 0.6, roughness: 0.3 }), 0.17, 0.12, 0.17, 0, 0.3)); for (let i = 0; i < 5; i++) head.add(mesh(G.cone, mat(0xffc93c, { metalness: 0.6, roughness: 0.3 }), 0.04, 0.09, 0.04, Math.cos(i * 1.26) * 0.15, 0.4, Math.sin(i * 1.26) * 0.15)); break; }
      case 4: head.add(mesh(G.sph, mat(col), 0.09, 0.09, 0.06, -0.19, 0.24)); head.add(mesh(G.sph, mat(col), 0.09, 0.09, 0.06, 0.19, 0.24)); head.add(mesh(G.sph, mat(0xffb6c1), 0.05, 0.05, 0.03, -0.19, 0.24, 0.03)); head.add(mesh(G.sph, mat(0xffb6c1), 0.05, 0.05, 0.03, 0.19, 0.24, 0.03)); break;
      case 5: head.add(mesh(G.cyl, white, 0.18, 0.12, 0.18, 0, 0.27)); for (let i = 0; i < 5; i++) head.add(mesh(G.sph, mat(0xff6fa5), 0.05, 0.03, 0.05, 0.2 + Math.cos(i * 1.26) * 0.05, 0.2, 0.12 + Math.sin(i * 1.26) * 0.05)); head.add(mesh(G.sph, mat(0xffe14d), 0.035, 0.035, 0.035, 0.2, 0.22, 0.12)); break;
    }
  }
  const handM = mat(isBot ? 0x6b7783 : skin);
  const hL = mesh(G.sph, handM, 0.075, 0.075, 0.075, -0.27, 0.32, 0.05), hR = mesh(G.sph, handM, 0.075, 0.075, 0.075, 0.27, 0.32, 0.05);
  g.add(hL, hR);
  const fM = mat(0x3a2e28);
  const fL = mesh(G.sph, fM, 0.09, 0.06, 0.11, -0.12, 0.05, 0.02), fR = mesh(G.sph, fM, 0.09, 0.06, 0.11, 0.12, 0.05, 0.02);
  g.add(fL, fR);
  const carry = new THREE.Group(); carry.position.set(0, 0.42, 0.36); g.add(carry);
  const knife = new THREE.Group(); knife.add(mesh(G.box, mat(0xdfe6ee, { metalness: 0.7, roughness: 0.2 }), 0.04, 0.02, 0.2, 0, 0, 0.12)); knife.add(mesh(G.box, mat(0x5a3a22), 0.05, 0.04, 0.1)); knife.visible = false; hR.add(knife); knife.scale.setScalar(1 / 0.075);
  let label = null;
  if (name) { label = textSprite(name, '#' + new THREE.Color(col).getHexString(), 0.26, 'rgba(255,255,255,.95)'); label.position.y = 1.35; root.add(label); }
  // тінь-коло, щоб краще видно
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; root.add(sh);
  return { root, g, head, hL, hR, fL, fR, carry, knife, label, t: Math.random() * 10, heldKey: '', heldObj: null };
}
export function animateCook(c, p, dt) {
  c.t += dt * (p.moving ? 12 : 3);
  const mv = p.moving ? 1 : 0;
  c.g.position.y = mv ? Math.abs(Math.sin(c.t)) * 0.06 : Math.sin(c.t) * 0.008;
  c.fL.position.z = 0.02 + Math.sin(c.t) * 0.1 * mv; c.fR.position.z = 0.02 - Math.sin(c.t) * 0.1 * mv;
  c.head.rotation.z = Math.sin(c.t * 0.5) * 0.04;
  const holding = !!p.held;
  const act = p.act;
  c.knife.visible = act === 'chop';
  if (act === 'chop') {
    const k = Math.sin(performance.now() / 55);
    c.hR.position.set(0.18, 0.5 + k * 0.12, 0.3); c.hL.position.set(-0.2, 0.36, 0.3);
  } else if (act === 'wash') {
    const k = performance.now() / 120;
    c.hR.position.set(0.15 + Math.cos(k) * 0.06, 0.38, 0.32 + Math.sin(k) * 0.05); c.hL.position.set(-0.15 - Math.cos(k) * 0.06, 0.38, 0.32 - Math.sin(k) * 0.05);
  } else if (holding) {
    c.hR.position.set(0.2, 0.42, 0.3); c.hL.position.set(-0.2, 0.42, 0.3);
  } else {
    c.hR.position.set(0.27, 0.3 + Math.sin(c.t) * 0.03 * mv, 0.05 - Math.sin(c.t) * 0.08 * mv);
    c.hL.position.set(-0.27, 0.3 - Math.sin(c.t) * 0.03 * mv, 0.05 + Math.sin(c.t) * 0.08 * mv);
  }
  // що в руках
  const k = itemKey(p.held);
  if (k !== c.heldKey) {
    c.heldKey = k;
    if (c.heldObj) c.carry.remove(c.heldObj);
    c.heldObj = makeItemMesh(p.held);
    if (c.heldObj) { c.heldObj.position.y = -0.02; c.carry.add(c.heldObj); }
  }
}

/* ---------- станції ---------- */
function stationMesh(t, th) {
  const g = new THREE.Group();
  if (t.type === 'void' || t.type === 'floor') return g;
  const bodyM = mat(th.body), topM = mat(th.top, { roughness: 0.4 });
  const counter = (topCol) => {
    g.add(mesh(G.box, bodyM, 0.98, 0.78, 0.98, 0, 0.39));
    g.add(mesh(G.box, topCol ? mat(topCol, { roughness: 0.4 }) : topM, 1.0, 0.07, 1.0, 0, TOP_Y - 0.035));
  };
  switch (t.type) {
    case 'counter': counter(); break;
    case 'board': counter(); g.add(mesh(G.box, mat(0xd9a066), 0.7, 0.05, 0.55, 0, TOP_Y + 0.02)); break;
    case 'stove': counter(0x3a3a40); { const r = mesh(G.tor, mat(0x555560, { metalness: 0.5 }), 0.24, 0.24, 0.24, 0, TOP_Y + 0.01); r.rotation.x = Math.PI / 2; g.add(r); const f = mesh(G.cylLo, mat(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 0.9 }), 0.17, 0.01, 0.17, 0, TOP_Y + 0.005); f.name = 'flame'; g.add(f); } break;
    case 'oven': {
      g.add(mesh(G.box, mat(0xb5532f), 0.98, 1.0, 0.98, 0, 0.5));
      g.add(mesh(G.sph, mat(0xc9653d), 0.48, 0.42, 0.48, 0, 1.0));
      const mouth = mesh(G.box, mat(0x2a1208, { emissive: 0xff6a00, emissiveIntensity: 0.25 }), 0.5, 0.36, 0.04, 0, 0.62, 0.48); mouth.name = 'mouth'; g.add(mouth);
      g.add(mesh(G.cylLo, mat(0x555555), 0.08, 0.35, 0.08, 0.25, 1.35, -0.2));
      break;
    }
    case 'sink': counter(); g.add(mesh(G.box, mat(0x9ec9e6, { roughness: 0.15, metalness: 0.2 }), 0.62, 0.04, 0.58, 0, TOP_Y + 0.005)); g.add(mesh(G.cylLo, mat(0xb8c2cc, { metalness: 0.7, roughness: 0.2 }), 0.03, 0.3, 0.03, 0.3, TOP_Y + 0.15, -0.3)); break;
    case 'plates': counter(); break;
    case 'mugs': counter(); for (let i = 0; i < 4; i++) { const c = makeItemMesh({ t: 'c', c: [] }); c.position.set((i % 2 - 0.5) * 0.36, TOP_Y + Math.floor(i / 2) * 0.27, (i % 2 ? 0.1 : -0.1)); g.add(c); } break;
    case 'tap': {
      counter();
      const col = ING[t.liq].col;
      g.add(mesh(G.box, mat(0xd9dee4, { metalness: 0.5, roughness: 0.3 }), 0.7, 0.75, 0.42, 0, TOP_Y + 0.375, -0.24));
      g.add(mesh(G.box, mat(col, { roughness: 0.3 }), 0.66, 0.22, 0.02, 0, TOP_Y + 0.55, -0.02));
      g.add(mesh(G.box, mat(0x555a60, { metalness: 0.6 }), 0.08, 0.14, 0.08, 0, TOP_Y + 0.38, 0.0));
      g.add(mesh(G.box, mat(0x3a3f45), 0.5, 0.03, 0.4, 0, TOP_Y + 0.015, 0.1));
      const lab = canvasSprite(96, 96, (c) => { c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(48, 48, 44, 0, 7); c.fill(); drawIcon(c, ING[t.liq].icon, 48, 48, 72); }, 0.34);
      lab.position.set(0, TOP_Y + 1.0, -0.1); lab.material.depthTest = true; g.add(lab);
      break;
    }
    case 'serve': {
      counter(th.accent);
      const belt = mesh(G.box, mat(0x2b2b2b), 0.9, 0.03, 0.8, 0, TOP_Y + 0.02); g.add(belt);
      const arrow = textSprite('▲', '#ffd23f', 0.35); arrow.position.set(0, TOP_Y + 0.6, 0); arrow.name = 'serveArrow'; g.add(arrow);
      break;
    }
    case 'trash': g.add(mesh(G.cyl, mat(0x6f7c86, { metalness: 0.4, roughness: 0.4 }), 0.36, 0.75, 0.36, 0, 0.38)); g.add(mesh(G.cyl, mat(0x4f5a62), 0.38, 0.06, 0.38, 0, 0.78)); g.add(mesh(G.cyl, mat(0x111111), 0.3, 0.02, 0.3, 0, 0.815)); break;
    case 'crate': {
      g.add(mesh(G.box, mat(0xa66a3c), 0.96, 0.76, 0.96, 0, 0.38));
      for (const z of [-0.3, 0, 0.3]) g.add(mesh(G.box, mat(0x8a5530), 1.0, 0.06, 0.08, 0, 0.6, z));
      g.add(mesh(G.box, mat(0xc98d5a), 0.98, 0.05, 0.98, 0, TOP_Y - 0.03));
      const ic = makeIngMesh(t.ing, 'r'); ic.position.y = TOP_Y; ic.scale.setScalar(1.1); g.add(ic);
      const lab = canvasSprite(96, 96, (c) => { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(48, 48, 44, 0, 7); c.fill(); drawIcon(c, ING[t.ing].icon, 48, 48, 72); }, 0.34);
      lab.position.set(0, TOP_Y + 0.55, 0); lab.material.depthTest = true; g.add(lab);
      break;
    }
    case 'conv': {
      g.add(mesh(G.box, mat(0x6d747a, { metalness: 0.3 }), 0.98, 0.78, 0.98, 0, 0.39));
      const belt = mesh(G.box, mat(0x222428), 1.0, 0.06, 0.9, 0, TOP_Y - 0.03); g.add(belt);
      const ar = canvasSprite(64, 64, (c) => { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(14, 18); c.lineTo(50, 32); c.lineTo(14, 46); c.closePath(); c.fill(); }, 0.35);
      const arrowMesh = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: ar.material.map, transparent: true, depthWrite: false }));
      arrowMesh.rotation.x = -Math.PI / 2; arrowMesh.rotation.z = -Math.atan2(t.dir[1], t.dir[0]); arrowMesh.position.y = TOP_Y + 0.006; arrowMesh.scale.setScalar(0.5);
      g.add(arrowMesh);
      break;
    }
  }
  if (t.ch === 'E') { /* вогнегасник — окремий предмет */ }
  return g;
}

function flameGroup() {
  const g = new THREE.Group();
  const cols = [0xff4d00, 0xff9a00, 0xffd23f];
  for (let i = 0; i < 5; i++) {
    const f = mesh(G.cone, new THREE.MeshBasicMaterial({ color: cols[i % 3], transparent: true, opacity: 0.9 }), 0.16 - i * 0.015, 0.5 - i * 0.05, 0.16 - i * 0.015, Math.cos(i * 2.3) * 0.18, 0.25, Math.sin(i * 2.3) * 0.18);
    f.castShadow = false; f.userData.ph = i * 1.3; g.add(f);
  }
  return g;
}
function bar() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthTest: false }));
  bg.scale.set(0.7, 0.12, 1); bg.renderOrder = 11;
  const fg = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x5ad16a, depthTest: false }));
  fg.scale.set(0.66, 0.08, 1); fg.position.z = 0.001; fg.renderOrder = 12;
  g.add(bg, fg); g.userData.fg = fg;
  return g;
}

/* ================================================================ */
export class KitchenView {
  constructor(renderer, sim, theme, opts = {}) {
    this.r = renderer; this.sim = sim; this.th = THEMES[theme] || THEMES.ua; this.themeName = THEMES[theme] ? theme : 'ua'; this.opts = opts;
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(this.th.sky);
    s.fog = new THREE.Fog(this.th.sky, 30, 60);
    this.cam = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.25));
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(sim.w / 2 - 6, 14, sim.h / 2 + 8); sun.target.position.set(sim.w / 2, 0, sim.h / 2);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; const R = Math.max(sim.w, sim.h) * 0.75 + 2; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 50;
    sun.shadow.bias = -0.0015;
    s.add(sun, sun.target);
    this.buildWorld();
    this.items = new Map(); this.fires = new Map(); this.bars = new Map(); this.bubbles = new Map(); this.warns = new Map();
    this.cooks = new Map(); this.fx = []; this.hl = new Map();
    this.time = 0;
  }
  buildWorld() {
    const { sim, th, scene } = this;
    // земля довкола
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(th.ground));
    ground.rotation.x = -Math.PI / 2; ground.position.set(sim.w / 2, -0.02, sim.h / 2); ground.receiveShadow = true; scene.add(ground);
    // підлога кухні (шахівниця)
    const fl = new THREE.Group();
    for (const t of sim.tiles) {
      if (t.type === 'void') continue;
      const q = new THREE.Mesh(G.box, mat((t.x + t.y) % 2 ? th.floorA : th.floorB, { roughness: 0.8 }));
      q.scale.set(1, 0.1, 1); q.position.set(t.x, -0.05, t.y); q.receiveShadow = true; fl.add(q);
    }
    scene.add(fl);
    // плінтус-край
    const edge = new THREE.Mesh(G.box, mat(darker(th.body, 0.8)));
    edge.scale.set(sim.w + 0.4, 0.14, sim.h + 0.4); edge.position.set((sim.w - 1) / 2, -0.12, (sim.h - 1) / 2); edge.receiveShadow = true; scene.add(edge);
    this.gateMeshes = [];
    for (const t of sim.tiles) if (t.gate) {
      const g = new THREE.Group();
      g.add(mesh(G.box, mat(0x8a5a3a), 0.96, 0.74, 0.96, 0, 0.37));
      for (const z of [-0.25, 0.25]) g.add(mesh(G.box, mat(0xffc93c), 0.98, 0.1, 0.12, 0, 0.6, z));
      const top = mesh(G.box, mat(0xffd23f, { emissive: 0xff9a00, emissiveIntensity: 0 }), 1.0, 0.06, 1.0, 0, 0.77); g.add(top); g.userData.top = top;
      g.position.set(t.x, -0.8, t.y); scene.add(g); this.gateMeshes.push({ t, g, y: -0.8 });
      // жовто-чорна смуга на підлозі
      const strip = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.55, depthWrite: false }));
      strip.rotation.x = -Math.PI / 2; strip.position.set(t.x, 0.012, t.y); strip.scale.set(0.95, 0.95, 1); scene.add(strip);
    }
    this.stations = new Map();
    for (const t of sim.tiles) {
      const m = stationMesh(t, th); m.position.set(t.x, 0, t.y); scene.add(m); this.stations.set(t, m);
    }
    this.decor();
    this.dec = new Decor(scene, sim, this.themeName, { hall: !!this.opts.hall });
    this.hallSide = this.opts.hall ? this.dec.side : null;
  }
  decor() {
    const { sim, th, scene } = this;
    let seed = sim.w * 31 + sim.h; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const spots = [];
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2, d = 2.5 + rnd() * 9;
      const x = sim.w / 2 + Math.cos(a) * (sim.w / 2 + d), z = sim.h / 2 + Math.sin(a) * (sim.h / 2 + d);
      if (z > sim.h + 1.5 && Math.abs(x - sim.w / 2) < sim.w * 0.7) continue; // не затуляти передній край
      if (z < 0.5 && z > -9 && x > -2 && x < sim.w + 1) continue; // там стіна і зала
      if (x > sim.w - 1 && x < sim.w + 8 && z > -1 && z < sim.h + 1 && this.opts.hall) continue;
      spots.push([x, z, 0.7 + rnd() * 0.6]);
    }
    for (const [x, z, s] of spots) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
      switch (th.decor) {
        case 'sunflower': g.add(mesh(G.cylLo, mat(0x3d8b37), 0.05, 1.4, 0.05, 0, 0.7)); g.add(mesh(G.cyl, mat(0xffc81a), 0.32, 0.06, 0.32, 0, 1.45)); g.children[1].rotation.x = 1.2; g.add(mesh(G.cyl, mat(0x5a3a1a), 0.15, 0.08, 0.15, 0, 1.47, 0.03)); g.children[2].rotation.x = 1.2; break;
        case 'lemon': g.add(mesh(G.cylLo, mat(0x7a5236), 0.08, 0.9, 0.08, 0, 0.45)); g.add(mesh(G.sph, mat(0x4f9a3f), 0.6, 0.5, 0.6, 0, 1.2)); for (let i = 0; i < 4; i++) g.add(mesh(G.sphLo, mat(0xffe14d), 0.09, 0.09, 0.09, Math.cos(i * 1.6) * 0.5, 1.1 + (i % 2) * 0.2, Math.sin(i * 1.6) * 0.5)); break;
        case 'sakura': g.add(mesh(G.cylLo, mat(0x5a3a2a), 0.09, 1.0, 0.09, 0, 0.5)); g.add(mesh(G.sph, mat(0xffb7cf), 0.75, 0.55, 0.75, 0, 1.35)); g.add(mesh(G.sph, mat(0xffd1e0), 0.5, 0.4, 0.5, 0.3, 1.55, 0.2)); break;
        case 'cactus': g.add(mesh(new THREE.CapsuleGeometry(0.18, 0.9, 4, 10), mat(0x3f9b55), 1, 1, 1, 0, 0.6)); g.add(mesh(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), mat(0x3f9b55), 1, 1, 1, 0.28, 0.75)); g.add(mesh(G.sphLo, mat(0xff6f91), 0.07, 0.07, 0.07, 0, 1.2)); break;
        case 'bavaria': {
          if (rnd() < 0.15) { // майське дерево
            g.add(mesh(G.cylLo, mat(0xffffff), 0.07, 4, 0.07, 0, 2)); for (let i = 0; i < 8; i++) g.add(mesh(G.cylLo, mat(0x2f78c8), 0.075, 0.18, 0.075, 0, 0.3 + i * 0.45));
            g.add(mesh(G.tor, mat(0x2e7d32), 0.35, 0.35, 0.35, 0, 3.6)).rotation.x = Math.PI / 2;
          } else { g.add(mesh(G.cylLo, mat(0x6b4a2e), 0.1, 1.1, 0.1, 0, 0.55)); g.add(mesh(G.sph, mat(0x3f8a3a), 0.7, 0.6, 0.7, 0, 1.45)); g.add(mesh(G.sph, mat(0x4f9a46), 0.45, 0.4, 0.45, 0.35, 1.75, 0.1)); }
          break;
        }
        case 'city': { const h = 1 + rnd() * 3.5; g.add(mesh(G.box, mat([0x8899aa, 0x6f7f90, 0xa3b1bf, 0xc7a27a][Math.floor(rnd() * 4)]), 1.1, h, 1.1, 0, h / 2)); for (let i = 0; i < h * 2; i++) g.add(mesh(G.box, mat(0xfff3b0, { emissive: 0xffe08a, emissiveIntensity: 0.3 }), 0.9, 0.08, 1.12, 0, 0.4 + i * 0.45)); break; }
      }
      scene.add(g);
    }
  }
  fit(w, h, hudTop = 0.16, hudBottom = 0.04) {
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    const { sim } = this;
    const cx = (sim.w - 1) / 2, cz = (sim.h - 1) / 2;
    const tilt = 0.95; // ~54°
    const fov = this.cam.fov * Math.PI / 180;
    const exN = this.hallSide === 'north' ? 2.4 : 0.9, exE = this.hallSide === 'east' ? 3 : 0;
    const needH = (sim.h + exN + 0.4) * Math.cos(Math.PI / 2 - tilt) * 1.05 + 1.6;
    const needW = sim.w + 1.0 + exE;
    const visH = 1 - hudTop - hudBottom;
    const dH = needH / (2 * Math.tan(fov / 2) * visH);
    const dW = needW / (2 * Math.tan(fov / 2) * this.cam.aspect);
    const d = Math.max(dH, dW);
    const shift = (hudTop - hudBottom) * 2 * Math.tan(fov / 2) * d * 0.5;
    const ccx = cx + exE / 2, ccz = cz - exN / 2 + 0.35;
    this.cam.position.set(ccx, Math.sin(tilt) * d, ccz + Math.cos(tilt) * d);
    this.cam.lookAt(ccx, 0.3, ccz - shift * 0.9);
  }

  sync(dt, myIds) {
    const { sim, scene } = this;
    this.time += dt;
    const camQ = this.cam.quaternion;
    sim.tiles.forEach((t, idx) => {
      if (t.type === 'floor' || t.type === 'void') return;
      // предмет на клітинці
      const it = t.type === 'oven' ? null : t.item;
      const k = itemKey(it);
      let rec = this.items.get(idx);
      if (!rec || rec.k !== k) {
        if (rec && rec.o) scene.remove(rec.o);
        const o = makeItemMesh(it);
        if (o) { o.position.set(t.x, (t.type === 'conv' ? TOP_Y : TOP_Y) + 0.01, t.y); scene.add(o); }
        rec = { k, o }; this.items.set(idx, rec);
      }
      if (rec.o && t.type === 'conv') { /* плавний рух стрічки */ }
      // бульбашка зі вмістом
      const ck = t.type === 'oven' ? t.ck : (it && it.t === 'k' ? it : null);
      let bk = '';
      let bItems = null, big = null;
      if (it && (it.t === 'p' || it.t === 'c') && it.c.length) {
        const full = this.fullRecipe(it); if (full) { big = RECIPES[full].icon; bk = 'B' + full; } else { bItems = it.c; bk = 'p' + k; }
      } else if (ck && ck.c.length) { bItems = ck.c; bk = 'k' + ck.c.map(c => c.id + c.s).join(','); }
      else if (t.type === 'plates' && (t.clean || t.dirty)) bk = 'pl' + t.clean + '/' + t.dirty;
      else if (t.type === 'sink' && (t.clean || t.dirty)) bk = 'sk' + t.clean + '/' + t.dirty;
      let b = this.bubbles.get(idx);
      if (!b || b.k !== bk) {
        if (b && b.o) scene.remove(b.o);
        let o = null;
        if (big || bItems) o = bubble(bItems, big);
        else if (bk.startsWith('pl') || bk.startsWith('sk')) o = this.stackMesh(t);
        if (o) { o.position.set(t.x, o.isSprite ? (t.type === 'oven' ? 1.75 : TOP_Y + 0.85) : TOP_Y, t.y); scene.add(o); }
        b = { k: bk, o }; this.bubbles.set(idx, b);
      }
      // смужка прогресу
      let prog = -1, col = 0x5ad16a;
      if (t.type === 'board' && it && it.t === 'i' && it.p > 0) prog = it.p;
      if (t.type === 'sink' && t.wp > 0) { prog = t.wp; col = 0x5ab4ff; }
      if (t.type === 'tap' && t.fp > 0) { prog = t.fp; col = 0x5ab4ff; }
      const cooking = ck && (t.type === 'oven' || t.type === 'stove') && ck.c.length;
      if (cooking) {
        const st = cookerState(ck);
        if (st === 'cooking') prog = Math.min(1, ck.ct / cookerNeed(ck));
        else if (st === 'done' && sim.lv.fire && ck.ov > 0) { prog = 1 - ck.ov / COOKER[ck.k].burn; col = ck.ov > COOKER[ck.k].burn * 0.5 ? 0xff5040 : 0xffb020; }
      }
      let br = this.bars.get(idx);
      if (prog >= 0) {
        if (!br) { br = bar(); scene.add(br); this.bars.set(idx, br); }
        br.visible = true;
        br.position.set(t.x, (t.type === 'oven' ? 1.5 : TOP_Y + 0.5), t.y + 0.1);
        br.quaternion.copy(camQ);
        const fg = br.userData.fg; fg.scale.x = 0.66 * Math.max(0.02, Math.min(1, prog)); fg.position.x = -0.33 + fg.scale.x / 2; fg.material.color.setHex(col);
      } else if (br) br.visible = false;
      // попередження: зараз згорить
      const warn = cooking && cookerState(ck) === 'done' && sim.lv.fire && ck.ov > COOKER[ck.k].burn * 0.45;
      let w = this.warns.get(idx);
      if (warn) {
        if (!w) { w = textSprite('!', '#ff3b30', 0.6, '#fff'); scene.add(w); this.warns.set(idx, w); }
        w.visible = Math.sin(this.time * 14) > -0.2; w.position.set(t.x + 0.3, 1.9, t.y);
      } else if (w) w.visible = false;
      // готово (галочка)
      // вогонь
      let f = this.fires.get(idx);
      if (t.fire > 0) {
        if (!f) { f = flameGroup(); f.position.set(t.x, TOP_Y, t.y); scene.add(f); this.fires.set(idx, f); }
        f.visible = true; const sc = 0.5 + t.fire * 0.7; f.scale.setScalar(sc);
        f.children.forEach(c => { c.scale.y = (0.5 - 0.05) * (0.8 + Math.sin(this.time * 18 + c.userData.ph) * 0.25); });
      } else if (f) f.visible = false;
      // анімації станцій
      const st = this.stations.get(t);
      if (t.type === 'stove') { const fl = st.getObjectByName('flame'); if (fl) fl.visible = !!(ck && ck.c.length && cookerState(ck) === 'cooking'); }
      if (t.type === 'oven') { const m = st.getObjectByName('mouth'); if (m) m.material.emissiveIntensity = cooking && cookerState(ck) === 'cooking' ? 0.8 + Math.sin(this.time * 9) * 0.2 : 0.2; }
      if (t.type === 'serve') { const a = st.getObjectByName('serveArrow'); if (a) a.position.y = TOP_Y + 0.6 + Math.sin(this.time * 4) * 0.08; }
      if (rec.o && it && it.t === 'k' && it.k === 'pot' && cookerState(it) === 'cooking') { const sp = rec.o.getObjectByName('soup'); if (sp) sp.position.y += Math.sin(this.time * 20) * 0.002; }
    });
    // перегородки
    for (const G2 of this.gateMeshes) {
      const target = G2.t.blocked ? 0 : -0.8;
      G2.y += (target - G2.y) * Math.min(1, dt * 10);
      G2.g.position.y = G2.y + (G2.t.warn && !G2.t.blocked ? Math.abs(Math.sin(this.time * 12)) * 0.08 : 0);
      G2.g.userData.top.material.emissiveIntensity = G2.t.warn ? 0.6 + Math.sin(this.time * 12) * 0.4 : 0;
    }
    // вітер
    const wv = sim.windV ? sim.windV[0] : 0;
    if (Math.abs(wv) > 0.3 && Math.random() < dt * 40) {
      const m = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      m.scale.set(0.6, 0.03, 0.03); m.position.set(wv > 0 ? -1 : sim.w, 0.6 + Math.random() * 1.2, Math.random() * sim.h);
      scene.add(m); this.fx.push({ o: m, t: 0, life: 1.2, vy: 0, vx: wv * 5 });
    }
    // кухарі
    const seen = new Set();
    for (const p of sim.players) {
      seen.add(p.id);
      let c = this.cooks.get(p.id);
      const sig = p.color + '/' + p.hat + '/' + (p.bot ? 1 : 0) + '/' + p.name;
      if (!c || c.sig !== sig) {
        if (c) scene.remove(c.root);
        c = makeCook(p.color, p.hat, !!p.bot || p.isBot, p.name); c.sig = sig; c.root.scale.setScalar(1.22); scene.add(c.root);
        c.root.position.set(p.x, 0, p.y); this.cooks.set(p.id, c);
      }
      // плавність для віддалених
      let x = p.x, y = p.y;
      if (p.remote && p.tx !== undefined && !myIds.has(p.id)) { p.x += (p.tx - p.x) * Math.min(1, dt * 14); p.y += (p.ty - p.y) * Math.min(1, dt * 14); x = p.x; y = p.y; }
      c.root.position.set(x, 0, y);
      const ang = Math.atan2(p.fx, p.fy);
      let d = ang - c.g.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      c.g.rotation.y += d * Math.min(1, dt * 16);
      animateCook(c, p, dt);
      // підсвітка цілі для своїх
      let h = this.hl.get(p.id);
      if (myIds.has(p.id)) {
        const t = sim.facing(p);
        if (!h) {
          h = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.04, 1.04), new THREE.MeshBasicMaterial({ color: COOK_COLORS[p.color % 6].c, transparent: true, opacity: 0.35, depthWrite: false }));
          scene.add(h); this.hl.set(p.id, h);
        }
        h.visible = !!t;
        if (t) h.position.set(t.x, (t.type === 'oven' ? 1.02 : TOP_Y + 0.02), t.y);
      } else if (h) h.visible = false;
    }
    for (const [id, c] of this.cooks) if (!seen.has(id)) { scene.remove(c.root); this.cooks.delete(id); const h = this.hl.get(id); if (h) { scene.remove(h); this.hl.delete(id); } }
    this.dec.update(dt);
    // ефекти
    for (const f of this.fx) { f.t += dt; f.o.position.y += dt * f.vy; if (f.vx) f.o.position.x += dt * f.vx; if (f.o.material) f.o.material.opacity = Math.max(0, 1 - f.t / f.life); if (f.spin) f.o.rotation.y += dt * 6; }
    for (const f of this.fx.filter(f => f.t >= f.life)) scene.remove(f.o);
    this.fx = this.fx.filter(f => f.t < f.life);
  }
  fullRecipe(pl) {
    const ks = pl.c.map(i => i.id + ':' + i.s).sort().join('|');
    for (const r of this.sim.recs) if (!!RECIPES[r].drink === (pl.t === 'c') && [...RECIPES[r].c].sort().join('|') === ks) return r;
    return null;
  }
  stackMesh(t) {
    const g = new THREE.Group();
    for (let i = 0; i < Math.min(t.clean, 6); i++) { const p = plateMesh(false); p.position.set(t.type === 'sink' ? 0.3 : 0, i * 0.05, t.type === 'sink' ? 0.25 : 0); g.add(p); }
    for (let i = 0; i < Math.min(t.dirty, 6); i++) { const p = plateMesh(true); p.position.set(t.type === 'sink' ? -0.05 : 0.15, (t.type === 'plates' ? t.clean * 0.05 : 0) + i * 0.05, -0.05); g.add(p); }
    return g;
  }
  floatText(x, y, text, color = '#ffd23f', h = 1.6) {
    const s = textSprite(text, color, 0.42); s.position.set(x, h, y); this.scene.add(s);
    this.fx.push({ o: s, t: 0, life: 1.3, vy: 0.9 });
  }
  puff(x, y, color = 0x888888) {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(G.sphLo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
      m.scale.setScalar(0.08 + Math.random() * 0.08); m.position.set(x + (Math.random() - 0.5) * 0.5, TOP_Y + 0.2, y + (Math.random() - 0.5) * 0.5);
      this.scene.add(m); this.fx.push({ o: m, t: 0, life: 0.8 + Math.random() * 0.5, vy: 0.6 + Math.random() });
    }
  }
  onEvent(e) {
    switch (e.e) {
      case 'serve': this.floatText(e.x, e.y, '+' + e.pts, '#ffd23f'); this.puff(e.x, e.y, 0xffe066); this.dec.onServe(e); break;
      case 'filled': this.puff(e.x, e.y, 0x9ed8ff); break;
      case 'chopped': this.puff(e.x, e.y, 0xffffff); break;
      case 'burnt': this.puff(e.x, e.y, 0x333333); break;
      case 'out': this.puff(e.x, e.y, 0xdddddd); break;
      case 'wrong': this.floatText(e.x, e.y, '✗', '#ff5a5a'); break;
      case 'cooked': this.floatText(e.x, e.y, '✓', '#5ad16a', 1.9); break;
      case 'washed': this.puff(e.x, e.y, 0x9ed8ff); break;
    }
  }
  render() { this.r.render(this.scene, this.cam); }
  dispose() {
    this.scene.traverse(o => { if (o.material && o.material.map) o.material.map.dispose(); if (o.isSprite) o.material.dispose(); });
  }
}
