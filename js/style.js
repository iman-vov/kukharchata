// Кухарчата — національний стиль кухонь: підлога, стійки, світло і великі декорації довкола.
// Усе малюється кодом (canvas-текстури й прості 3D-фігури), без сторонніх файлів.
import * as THREE from 'three';

const TS = 64; // пікселів на клітинку підлоги
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function tex(c, rx = 1, ry = 1) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t; }
let seed = 1; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

/* ================= підлога ================= */
function planks(g, x, y, T, base, var1, horiz = true) {
  const n = 3, s = T / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = shade(base, 0.9 + rnd() * 0.2); if (horiz) g.fillRect(x, y + i * s, T, s - 2); else g.fillRect(x + i * s, y, s - 2, T);
    g.fillStyle = var1; for (let k = 0; k < 3; k++) { const p = rnd() * T; if (horiz) g.fillRect(x + p, y + i * s + 3 + rnd() * (s - 8), 10 + rnd() * 14, 1); else g.fillRect(x + i * s + 3 + rnd() * (s - 8), y + p, 1, 10 + rnd() * 14); }
  }
  g.fillStyle = 'rgba(0,0,0,.25)'; if (horiz) g.fillRect(x + ((x / T) % 2 ? T * 0.6 : T * 0.25), y, 2, T); else g.fillRect(x, y + T * 0.4, T, 2);
}
function floorTile(theme, g, x, y, T, i, j) {
  switch (theme) {
    case 'ua': planks(g, x, y, T, 0xe9c48a, 'rgba(120,70,30,.3)', true); break;
    case 'de': planks(g, x, y, T, 0x9a6a40, 'rgba(60,30,10,.4)', (i + j) % 2 === 0); break;
    case 'it': { // теракотова плитка
      g.fillStyle = '#e9e1d2'; g.fillRect(x, y, T, T);
      g.fillStyle = shade(0xd2774a, 0.92 + rnd() * 0.16); g.fillRect(x + 2, y + 2, T - 4, T - 4);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 6, y + 6, T * 0.4, 4);
      if ((i + j) % 3 === 0) { g.fillStyle = '#f2e6cf'; g.beginPath(); g.moveTo(x + T / 2, y + T / 2 - 10); g.lineTo(x + T / 2 + 10, y + T / 2); g.lineTo(x + T / 2, y + T / 2 + 10); g.lineTo(x + T / 2 - 10, y + T / 2); g.fill(); }
      break;
    }
    case 'jp': { // татамі: кожна клітинка — половина мата
      g.fillStyle = (i + j) % 2 ? '#cfc58a' : '#c4bb7c'; g.fillRect(x, y, T, T);
      g.strokeStyle = 'rgba(90,110,50,.25)'; g.lineWidth = 1; for (let k = 4; k < T; k += 4) { g.beginPath(); if ((i + j) % 2) { g.moveTo(x + k, y); g.lineTo(x + k, y + T); } else { g.moveTo(x, y + k); g.lineTo(x + T, y + k); } g.stroke(); }
      g.fillStyle = '#2d3a2a'; if ((i + j) % 2) { g.fillRect(x, y, T, 4); g.fillRect(x, y + T - 4, T, 4); } else { g.fillRect(x, y, 4, T); g.fillRect(x + T - 4, y, 4, T); }
      break;
    }
    case 'mx': { // талавера
      g.fillStyle = '#f7f1e3'; g.fillRect(x, y, T, T);
      const c = [(i + j) % 2 ? '#2a5db0' : '#e9b400', '#2a9d8f', '#e76f51'][(i * 3 + j) % 3];
      g.fillStyle = c; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.beginPath(); g.ellipse(x + T / 2 + Math.cos(a) * 12, y + T / 2 + Math.sin(a) * 12, 9, 5, a, 0, 7); g.fill(); }
      g.fillStyle = '#2a5db0'; g.beginPath(); g.arc(x + T / 2, y + T / 2, 6, 0, 7); g.fill();
      g.fillStyle = c; for (const [cx, cy] of [[0, 0], [T, 0], [0, T], [T, T]]) { g.beginPath(); g.arc(x + cx, y + cy, 9, 0, 7); g.fill(); }
      g.strokeStyle = '#d8cfbd'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, T - 2, T - 2);
      break;
    }
    case 'us': { // дайнер: чорно-біла шахівниця з блиском
      g.fillStyle = (i + j) % 2 ? '#f4f4f4' : '#26262c'; g.fillRect(x, y, T, T);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 4, y + 4, T * 0.5, 6);
      break;
    }
    case 'in': { // мозаїка
      g.fillStyle = '#f3e3c0'; g.fillRect(x, y, T, T);
      g.fillStyle = (i + j) % 2 ? '#2a9d8f' : '#d35e2a';
      g.beginPath(); g.moveTo(x + T / 2, y + 4); g.lineTo(x + T - 4, y + T / 2); g.lineTo(x + T / 2, y + T - 4); g.lineTo(x + 4, y + T / 2); g.fill();
      g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(x + T / 2, y + T / 2, 8, 0, 7); g.fill();
      g.fillStyle = '#7b2d8b'; for (const [cx, cy] of [[6, 6], [T - 6, 6], [6, T - 6], [T - 6, T - 6]]) { g.beginPath(); g.arc(x + cx, y + cy, 3, 0, 7); g.fill(); }
      break;
    }
    case 'fr': { // бістро: дрібна шестикутна плитка з візерунком-квіткою
      g.fillStyle = '#f2efe8'; g.fillRect(x, y, T, T);
      const r = 7;
      for (let yy = 0; yy < T + r; yy += r * 1.7) for (let xx = (Math.round(yy / (r * 1.7)) % 2) * r; xx < T + r; xx += r * 2) {
        const cx = x + xx, cy = y + yy, gx = Math.floor((x + xx) / (r * 2)), gy = Math.floor((y + yy) / (r * 1.7));
        const flower = (gx % 5 === 2 && gy % 5 === 2) || ((gx % 5 === 1 || gx % 5 === 3) && gy % 5 === 2) || (gx % 5 === 2 && (gy % 5 === 1 || gy % 5 === 3));
        g.fillStyle = flower ? '#2f3b5c' : '#f7f5ef'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1)); } g.fill();
      }
      break;
    }
    case 'ge': { // камінь-плитняк
      g.fillStyle = '#8f8778'; g.fillRect(x, y, T, T);
      const parts = [[2, 2, T * 0.55, T * 0.45], [T * 0.58, 2, T * 0.4, T * 0.6], [2, T * 0.5, T * 0.45, T * 0.48], [T * 0.5, T * 0.65, T * 0.48, T * 0.33]];
      for (const [px, py, pw, ph] of parts) { g.fillStyle = shade(0xc9bfa8, 0.85 + rnd() * 0.25); g.beginPath(); if (g.roundRect) g.roundRect(x + px, y + py, pw - 2, ph - 2, 6); else g.rect(x + px, y + py, pw - 2, ph - 2); g.fill(); }
      break;
    }
    case 'cn': { // світлий камінь із червоно-золотими візерунками
      g.fillStyle = '#d9cbb0'; g.fillRect(x, y, T, T); g.fillStyle = shade(0xefe4cc, 0.95 + rnd() * 0.08); g.fillRect(x + 2, y + 2, T - 4, T - 4);
      if ((i + j) % 4 === 0) { g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.beginPath(); g.arc(x + T / 2, y + T / 2, 16, 0, 7); g.stroke(); g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(x + T / 2, y + T / 2, 6, 0, 7); g.fill(); }
      break;
    }
    default: g.fillStyle = (i + j) % 2 ? '#f6efdc' : '#dbe7f6'; g.fillRect(x, y, T, T);
  }
}
export function floorTexture(theme, w, h) {
  seed = w * 13 + h * 7 + theme.length;
  return tex(canvas(w * TS, h * TS, (g) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) floorTile(theme, g, i * TS, j * TS, TS, i, j); }));
}

/* ================= стійки: фасад і стільниця ================= */
const BODY = {
  ua: (g, W, H) => { g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, W, H); const y0 = H * 0.3, s = 8; for (let i = 0; i < W / s; i++) for (let j = 0; j < 5; j++) { const d = Math.abs((i % 8) - 4) + Math.abs(j - 2); if (d === 2 || d === 4) { g.fillStyle = '#c8202a'; g.fillRect(i * s, y0 + j * s, s - 1, s - 1); } else if (d === 0) { g.fillStyle = '#1a1a1a'; g.fillRect(i * s, y0 + j * s, s - 1, s - 1); } } g.fillStyle = '#8a5a3a'; g.fillRect(0, H - 14, W, 14); },
  de: (g, W, H) => { g.fillStyle = '#6b4426'; g.fillRect(0, 0, W, H); g.strokeStyle = '#4a2c16'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = '#c8202a'; g.beginPath(); const cx = W / 2, cy = H / 2; g.moveTo(cx, cy + 16); g.bezierCurveTo(cx - 26, cy - 4, cx - 12, cy - 22, cx, cy - 8); g.bezierCurveTo(cx + 12, cy - 22, cx + 26, cy - 4, cx, cy + 16); g.fill(); },
  it: (g, W, H) => { g.fillStyle = '#5f8f57'; g.fillRect(0, 0, W, H); g.strokeStyle = '#4a7444'; g.lineWidth = 6; g.strokeRect(12, 12, W - 24, H - 24); g.fillStyle = '#f2e6cf'; g.fillRect(W / 2 - 14, 22, 28, 4); },
  jp: (g, W, H) => { g.fillStyle = '#3d2618'; g.fillRect(0, 0, W, H); g.fillStyle = '#f6f0e0'; for (let i = 0; i < 2; i++) g.fillRect(14 + i * (W / 2 - 6), 14, W / 2 - 22, H - 28); g.strokeStyle = '#3d2618'; g.lineWidth = 3; for (let y = 14; y < H - 14; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.beginPath(); g.moveTo(W / 4, 0); g.lineTo(W / 4, H); g.moveTo(W * 3 / 4, 0); g.lineTo(W * 3 / 4, H); g.stroke(); },
  mx: (g, W, H) => { const s = W / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = '#fdfbf3'; g.fillRect(i * s, j * s, s - 2, s - 2); g.fillStyle = ['#2a5db0', '#e9b400', '#2a9d8f', '#e76f51'][(i + j * 2) % 4]; g.beginPath(); g.arc(i * s + s / 2, j * s + s / 2, s * 0.28, 0, 7); g.fill(); g.fillStyle = '#fdfbf3'; g.beginPath(); g.arc(i * s + s / 2, j * s + s / 2, s * 0.12, 0, 7); g.fill(); } },
  us: (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#b9c2cc'); gr.addColorStop(0.5, '#eef2f5'); gr.addColorStop(1, '#aab4bf'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#d43a3a'; g.fillRect(0, H * 0.18, W, 10); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 40; y < H; y += 22) g.fillRect(0, y, W, 2); },
  in: (g, W, H) => { g.fillStyle = '#b5532f'; g.fillRect(0, 0, W, H); g.fillStyle = '#7b2d8b'; g.fillRect(0, 0, W, 14); g.fillStyle = '#ffc93c'; for (let x = 8; x < W; x += 16) { g.beginPath(); g.arc(x, 7, 3, 0, 7); g.fill(); } g.strokeStyle = '#ffc93c'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.25, H - 10); g.lineTo(W * 0.25, H * 0.45); g.quadraticCurveTo(W / 2, H * 0.12, W * 0.75, H * 0.45); g.lineTo(W * 0.75, H - 10); g.stroke(); },
  fr: (g, W, H) => { g.fillStyle = '#2f3b5c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c9a227'; g.lineWidth = 3; g.strokeRect(14, 14, W - 28, H - 28); g.fillStyle = '#c9a227'; g.fillRect(W / 2 - 16, 26, 32, 5); },
  ge: (g, W, H) => { g.fillStyle = '#9a8a72'; g.fillRect(0, 0, W, H); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { g.fillStyle = shade(0xc9b994, 0.85 + ((i * 7 + j * 3) % 5) * 0.06); g.fillRect(i * W / 3 + (j % 2) * 18 - 9, j * H / 4 + 2, W / 3 - 4, H / 4 - 4); } },
  cn: (g, W, H) => { g.fillStyle = '#b3241c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#ffc93c'; g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20); const c = W / 2, r = 22; g.beginPath(); g.moveTo(c - r, H / 2 - r); g.lineTo(c + r, H / 2 - r); g.lineTo(c + r, H / 2 + r); g.lineTo(c - r + 10, H / 2 + r); g.lineTo(c - r + 10, H / 2 - r + 10); g.lineTo(c + r - 10, H / 2 - r + 10); g.lineTo(c + r - 10, H / 2 + r - 10); g.stroke(); },
};
const TOP = {
  ua: (g, W, H) => { g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.04)'; for (let i = 0; i < W; i += 4) g.fillRect(i, 0, 1, H); for (const y of [6, H - 18]) for (let x = 0; x < W; x += 8) { const d = Math.abs((x / 8) % 6 - 3); g.fillStyle = d === 0 ? '#1a1a1a' : '#c8202a'; if (d !== 2) g.fillRect(x, y + (d === 1 ? 0 : 4), 6, 6); } },
  de: (g, W, H) => planks(g, 0, 0, W, 0xd8b48a, 'rgba(100,60,20,.3)', false),
  it: (g, W, H) => marble(g, W, H, '#f6f3ee', 'rgba(120,120,130,.35)'),
  jp: (g, W, H) => planks(g, 0, 0, W, 0xe9d3a8, 'rgba(140,100,50,.25)', true),
  mx: (g, W, H) => { g.fillStyle = '#d2774a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e9e1d2'; g.lineWidth = 3; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * W / 2, 0); g.lineTo(i * W / 2, H); g.moveTo(0, i * H / 2); g.lineTo(W, i * H / 2); g.stroke(); } },
  us: (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#dfe5ea'); gr.addColorStop(1, '#f7f9fb'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < W; i += 3) g.fillRect(i, 0, 1, H); },
  in: (g, W, H) => marble(g, W, H, '#efe6d4', 'rgba(180,120,60,.3)'),
  fr: (g, W, H) => marble(g, W, H, '#fbfaf7', 'rgba(110,110,120,.4)'),
  ge: (g, W, H) => planks(g, 0, 0, W, 0x9a6a40, 'rgba(60,30,10,.35)', true),
  cn: (g, W, H) => planks(g, 0, 0, W, 0x4a2a1a, 'rgba(0,0,0,.35)', false),
};
function marble(g, W, H, base, vein) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.strokeStyle = vein; for (let k = 0; k < 4; k++) { g.lineWidth = 1 + rnd() * 2; g.beginPath(); let x = rnd() * W, y = 0; g.moveTo(x, y); while (y < H) { x += (rnd() - 0.5) * 30; y += 10 + rnd() * 14; g.lineTo(x, y); } g.stroke(); }
}
const counterCache = {};
export function counterMats(theme) {
  if (counterCache[theme]) return counterCache[theme];
  seed = theme.length * 101;
  const body = BODY[theme], top = TOP[theme];
  const metal = theme === 'us';
  return (counterCache[theme] = {
    body: body ? new THREE.MeshStandardMaterial({ map: tex(canvas(128, 128, body)), roughness: metal ? 0.35 : 0.75, metalness: metal ? 0.45 : 0 }) : null,
    top: top ? new THREE.MeshStandardMaterial({ map: tex(canvas(128, 128, top)), roughness: metal ? 0.3 : 0.45, metalness: metal ? 0.5 : 0 }) : null,
  });
}

/* ================= світло ================= */
export const LIGHT = {
  ua: { sky: 0xfff6e0, ground: 0x8a7a55, sun: 0xfff1d6 }, de: { sky: 0xf2f6ff, ground: 0x7a6a50, sun: 0xfff6e8 },
  it: { sky: 0xfff0d6, ground: 0x9a7a5a, sun: 0xffe2b8 }, jp: { sky: 0xffeef4, ground: 0x7a6a66, sun: 0xffe6ee },
  mx: { sky: 0xffeacc, ground: 0xa0704a, sun: 0xffd6a0 }, us: { sky: 0xeef4ff, ground: 0x6a6a7a, sun: 0xf4f8ff },
  in: { sky: 0xffe8c8, ground: 0xa06a40, sun: 0xffcf8a }, fr: { sky: 0xeef0ff, ground: 0x7a7a8a, sun: 0xfff4e8 },
  ge: { sky: 0xf6f2e6, ground: 0x7a6a50, sun: 0xfff0d0 }, cn: { sky: 0xfff0e6, ground: 0x8a5a4a, sun: 0xffe0c8 },
};

/* ================= великі декорації довкола кухні ================= */
const M = new Map();
const mt = (c, o = {}) => { const k = c + JSON.stringify(o); if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o })); return M.get(k); };
const GB = new THREE.BoxGeometry(1, 1, 1), GS = new THREE.SphereGeometry(1, 16, 12), GC = new THREE.CylinderGeometry(1, 1, 1, 16), GK = new THREE.ConeGeometry(1, 1, 16), GT = new THREE.TorusGeometry(1, 0.12, 8, 24);
function q(geo, m, sx, sy, sz, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(geo, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; return o; }
function house(wallC, roofC, roofKind = 'gable', w = 2.2, d = 1.8, h = 1.4) {
  const g = new THREE.Group();
  g.add(q(GB, mt(wallC), w, h, d, 0, h / 2));
  if (roofKind === 'thatch') g.add(q(new THREE.ConeGeometry(1, 1, 4), mt(roofC), w * 0.85, 1.1, d * 0.95, 0, h + 0.5, 0, 0, Math.PI / 4));
  else if (roofKind === 'flat') g.add(q(GB, mt(roofC), w + 0.1, 0.14, d + 0.1, 0, h + 0.07));
  else { const wrap = new THREE.Group(); wrap.position.y = h + 0.42; wrap.rotation.y = Math.PI / 2; const r = q(new THREE.CylinderGeometry(1, 1, 1, 3), mt(roofC), d * 0.62, w + 0.2, 0.85, 0, 0, 0, -Math.PI / 2); wrap.add(r); g.add(wrap); }
  g.add(q(GB, mt(0x6b4226), 0.4, 0.75, 0.04, 0, 0.38, d / 2 + 0.01));
  for (const s of [-1, 1]) { g.add(q(GB, mt(0x9ed8ff, { roughness: 0.2 }), 0.36, 0.36, 0.04, s * w * 0.3, h * 0.6, d / 2 + 0.01)); g.add(q(GB, mt(0x6b4226), 0.44, 0.06, 0.06, s * w * 0.3, h * 0.6 - 0.21, d / 2 + 0.02)); }
  return g;
}
function tree(trunk, crown, h = 1.2, r = 0.7) { const g = new THREE.Group(); g.add(q(GC, mt(trunk), 0.1, h, 0.1, 0, h / 2)); g.add(q(GS, mt(crown), r, r * 0.85, r, 0, h + r * 0.55)); return g; }
function lanternString(g, x1, x2, y, z, col = 0xe53935, n = 6) { for (let i = 0; i < n; i++) { const x = x1 + (x2 - x1) * (i + 0.5) / n, yy = y - Math.sin((i + 0.5) / n * Math.PI) * 0.35; g.add(q(GS, mt(col, { emissive: col, emissiveIntensity: 0.35 }), 0.14, 0.18, 0.14, x, yy, z)); g.add(q(GC, mt(0xffc93c), 0.08, 0.04, 0.08, x, yy + 0.19, z)); } }

const HERO = {
  ua: (rnd) => { // хата під стріхою, тин, криниця
    const g = new THREE.Group();
    const h = house(0xfbf8ef, 0xc9a050, 'thatch'); h.children[0].material = mt(0xfbf8ef); g.add(h);
    g.add(q(GB, mt(0x3d7be0), 2.24, 0.12, 1.84, 0, 0.06)); // синя призьба
    for (let i = 0; i < 9; i++) { g.add(q(GC, mt(0x8a6a48), 0.04, 0.7, 0.04, -1.8 + i * 0.3, 0.35, 1.5)); }
    g.add(q(GT, mt(0xa07a50), 1.25, 0.12, 0.6, -0.6, 0.45, 1.5, Math.PI / 2, 0, 0));
    const well = new THREE.Group(); well.position.set(1.9, 0, 1.0); well.add(q(GC, mt(0x9a7a5a), 0.35, 0.5, 0.35, 0, 0.25)); well.add(q(GC, mt(0x4a3a2a), 0.04, 1.4, 0.04, 0.25, 0.7, 0)); well.add(q(GC, mt(0x4a3a2a), 0.03, 1.6, 0.03, 0.25, 1.35, 0, 0, 0, 1.1)); g.add(well);
    return g;
  },
  de: () => { // фахверковий будинок
    const g = new THREE.Group(); const h = house(0xfbf6ea, 0x9a3a2a, 'gable', 2.2, 1.8, 1.8); g.add(h);
    for (const x of [-1.05, -0.35, 0.35, 1.05]) g.add(q(GB, mt(0x4a2c16), 0.08, 1.8, 0.04, x, 0.9, 0.92));
    g.add(q(GB, mt(0x4a2c16), 2.2, 0.08, 0.04, 0, 0.95, 0.92)); g.add(q(GB, mt(0x4a2c16), 1.0, 0.06, 0.04, 0, 1.35, 0.93, 0, 0, 0.6)); g.add(q(GB, mt(0x4a2c16), 1.0, 0.06, 0.04, 0, 1.35, 0.93, 0, 0, -0.6));
    for (const x of [-0.66, 0.66]) g.add(q(GB, mt(0xe5484d), 0.4, 0.12, 0.12, x, 0.95, 1.0));
    return g;
  },
  it: () => { // кипариси й пізанська вежа
    const g = new THREE.Group();
    const tw = new THREE.Group(); tw.rotation.z = 0.12; for (let i = 0; i < 6; i++) { tw.add(q(GC, mt(0xf3eee2), 0.42, 0.42, 0.42, 0, 0.21 + i * 0.45)); tw.add(q(GC, mt(0xd9d2c2), 0.46, 0.05, 0.46, 0, 0.44 + i * 0.45)); } g.add(tw);
    for (const x of [1.4, -1.3, 2.0]) { const c = new THREE.Group(); c.position.set(x, 0, 0.4); c.add(q(GC, mt(0x5a3a2a), 0.06, 0.4, 0.06, 0, 0.2)); c.add(q(GK, mt(0x2f6b3a), 0.28, 1.9, 0.28, 0, 1.3)); g.add(c); }
    return g;
  },
  jp: () => { // торії, кам'яні ліхтарі
    const g = new THREE.Group(), red = mt(0xd63a2a);
    for (const x of [-0.9, 0.9]) g.add(q(GC, red, 0.11, 2.2, 0.11, x, 1.1));
    g.add(q(GB, mt(0x1a1a1a), 2.6, 0.16, 0.24, 0, 2.25)); g.add(q(GB, red, 2.3, 0.12, 0.18, 0, 1.85)); g.add(q(GB, red, 0.14, 0.4, 0.12, 0, 2.03));
    for (const x of [-1.8, 1.8]) { const l = new THREE.Group(); l.position.set(x, 0, 0.6); l.add(q(GC, mt(0x9a9a92), 0.12, 0.6, 0.12, 0, 0.3)); l.add(q(GB, mt(0xfff3b0, { emissive: 0xffd77a, emissiveIntensity: 0.4 }), 0.3, 0.26, 0.3, 0, 0.73)); l.add(q(new THREE.ConeGeometry(1, 1, 4), mt(0x8a8a82), 0.36, 0.22, 0.36, 0, 0.98, 0, 0, Math.PI / 4)); g.add(l); }
    return g;
  },
  mx: () => { // глиняний будиночок з арками і гірлянда папель пікадо
    const g = new THREE.Group(); const h = house(0xf2a65a, 0xd2774a, 'flat', 2.4, 1.6, 1.3); g.add(h);
    const cols = [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec, 0xfb5607];
    for (let i = 0; i < 8; i++) g.add(q(GB, mt(cols[i % 5], { side: THREE.DoubleSide }), 0.22, 0.26, 0.01, -1.2 + i * 0.34, 1.55 - Math.sin(i / 7 * Math.PI) * 0.15, 0.95));
    const cac = new THREE.Group(); cac.position.set(1.8, 0, 0.8); cac.add(q(new THREE.CapsuleGeometry(0.2, 1.2, 4, 10), mt(0x3f9b55), 1, 1, 1, 0, 0.8)); cac.add(q(new THREE.CapsuleGeometry(0.12, 0.4, 4, 8), mt(0x3f9b55), 1, 1, 1, 0.3, 1.0)); g.add(cac);
    return g;
  },
  us: () => { // жовте таксі і великий неон
    const g = new THREE.Group();
    const taxi = new THREE.Group(); taxi.add(q(GB, mt(0xffc61a), 1.6, 0.4, 0.8, 0, 0.35)); taxi.add(q(GB, mt(0xffc61a), 0.9, 0.35, 0.74, -0.1, 0.72)); taxi.add(q(GB, mt(0x9ed8ff, { roughness: 0.2 }), 0.92, 0.25, 0.76, -0.1, 0.74)); taxi.add(q(GB, mt(0x222222), 0.3, 0.1, 0.2, -0.1, 0.95));
    for (const [x, z] of [[-0.5, 0.4], [0.5, 0.4], [-0.5, -0.4], [0.5, -0.4]]) taxi.add(q(GC, mt(0x1a1a1a), 0.17, 0.12, 0.17, x, 0.17, z, Math.PI / 2));
    taxi.position.set(0.6, 0, 1.2); taxi.rotation.y = 0.3; g.add(taxi);
    g.add(q(GC, mt(0x555555), 0.06, 2.4, 0.06, -1.2, 1.2)); g.add(q(GB, mt(0x1a1a2a), 1.4, 0.6, 0.1, -1.2, 2.5));
    g.add(q(GB, mt(0xff3b6b, { emissive: 0xff3b6b, emissiveIntensity: 0.9 }), 1.2, 0.08, 0.12, -1.2, 2.7)); g.add(q(GB, mt(0x41e0ff, { emissive: 0x41e0ff, emissiveIntensity: 0.9 }), 1.2, 0.08, 0.12, -1.2, 2.3));
    return g;
  },
  in: () => { // палацовий павільйон-чхатрі і слон
    const g = new THREE.Group();
    g.add(q(GB, mt(0xf2e6cf), 2.0, 0.2, 2.0, 0, 0.1));
    for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) g.add(q(GC, mt(0xf6efe2), 0.1, 1.4, 0.1, x, 0.9, z));
    g.add(q(GB, mt(0xe9c79a), 2.0, 0.16, 2.0, 0, 1.65)); g.add(q(GS, mt(0xf6efe2), 0.8, 0.7, 0.8, 0, 1.75)); g.add(q(GK, mt(0xffc93c, { metalness: 0.5 }), 0.08, 0.4, 0.08, 0, 2.6));
    const el = new THREE.Group(); el.position.set(2.0, 0, 0.6); el.rotation.y = -0.6;
    el.add(q(GS, mt(0x9aa3ad), 0.55, 0.45, 0.75, 0, 0.8)); el.add(q(GS, mt(0x9aa3ad), 0.34, 0.32, 0.32, 0, 1.1, 0.65)); el.add(q(GC, mt(0x9aa3ad), 0.08, 0.6, 0.08, 0, 0.75, 0.9, 0.2));
    for (const [x, z] of [[-0.28, 0.35], [0.28, 0.35], [-0.28, -0.35], [0.28, -0.35]]) el.add(q(GC, mt(0x8a939d), 0.13, 0.55, 0.13, x, 0.27, z));
    el.add(q(GB, mt(0xd63a3a), 0.7, 0.05, 0.6, 0, 1.22)); el.add(q(GB, mt(0xffc93c), 0.72, 0.03, 0.12, 0, 1.2, 0.26)); g.add(el);
    return g;
  },
  fr: () => { // столики кафе з парасолькою і ліхтар
    const g = new THREE.Group();
    for (const [x, z, c] of [[-0.8, 0, 0xef4135], [0.9, 0.5, 0x0055a4]]) {
      const t = new THREE.Group(); t.position.set(x, 0, z);
      t.add(q(GC, mt(0x2a2f3a), 0.04, 0.75, 0.04, 0, 0.37)); t.add(q(GC, mt(0xf6f3ee), 0.42, 0.04, 0.42, 0, 0.76)); t.add(q(GC, mt(0x2a2f3a), 0.03, 1.6, 0.03, 0, 1.3));
      for (let i = 0; i < 8; i++) t.add(q(new THREE.ConeGeometry(1.0, 0.4, 3, 1, true), mt(i % 2 ? c : 0xffffff, { side: THREE.DoubleSide }), 1, 1, 1, 0, 2.0, 0, 0, i * Math.PI / 4));
      for (const a of [0, Math.PI]) { const ch = new THREE.Group(); ch.position.set(Math.cos(a) * 0.65, 0, Math.sin(a) * 0.65); ch.add(q(GB, mt(0xc9a227), 0.36, 0.04, 0.36, 0, 0.45)); ch.add(q(GB, mt(0xc9a227), 0.36, 0.4, 0.04, 0, 0.65, Math.sin(a) * 0.17 || -0.17)); t.add(ch); }
      g.add(t);
    }
    return g;
  },
  ge: () => { // гори, виноградна альтанка
    const g = new THREE.Group();
    for (const [x, z, s] of [[-1.5, -1.2, 1.6], [0.6, -1.6, 2.2], [2.2, -1.0, 1.4]]) { g.add(q(new THREE.ConeGeometry(1, 1, 7), mt(0x7f9a6a), s, s * 1.6, s, x, s * 0.8, z)); g.add(q(new THREE.ConeGeometry(1, 1, 7), mt(0xffffff), s * 0.35, s * 0.55, s * 0.35, x, s * 1.35, z)); }
    const p = new THREE.Group(); p.position.set(0.2, 0, 1.2);
    for (const [x, z] of [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]]) p.add(q(GC, mt(0x6b4226), 0.05, 1.6, 0.05, x, 0.8, z));
    p.add(q(GB, mt(0x3f8a3a), 2.0, 0.18, 1.2, 0, 1.65));
    for (let i = 0; i < 7; i++) { const x = -0.8 + i * 0.27; p.add(q(GS, mt(0x6a2a6e), 0.07, 0.16, 0.07, x, 1.42, (i % 2 - 0.5) * 0.6)); }
    g.add(p);
    return g;
  },
  cn: () => { // ворота-пайлоу і бамбук
    const g = new THREE.Group(), red = mt(0xc0392b);
    for (const x of [-1.1, 1.1]) g.add(q(GC, red, 0.12, 2.0, 0.12, x, 1.0));
    g.add(q(GB, mt(0x1f6f5a), 2.9, 0.16, 0.5, 0, 2.15)); g.add(q(GB, red, 2.4, 0.2, 0.2, 0, 1.85)); g.add(q(GB, mt(0xffc93c), 0.7, 0.3, 0.06, 0, 1.85, 0.12));
    lanternString(g, -1.6, 1.6, 1.6, 0.4, 0xe53935, 5);
    for (let i = 0; i < 6; i++) { const x = 2.0 + (i % 3) * 0.25, z = 0.4 + Math.floor(i / 3) * 0.3; g.add(q(GC, mt(0x7cb342), 0.05, 2.2 + (i % 2) * 0.4, 0.05, x, 1.1 + (i % 2) * 0.2, z)); g.add(q(GS, mt(0x6aa84f), 0.25, 0.08, 0.1, x + 0.15, 2.0 + (i % 3) * 0.3, z, 0, 0, 0.4)); }
    const panda = new THREE.Group(); panda.position.set(-2.0, 0, 0.8); panda.add(q(GS, mt(0xffffff), 0.4, 0.38, 0.36, 0, 0.4)); panda.add(q(GS, mt(0x222222), 0.42, 0.18, 0.38, 0, 0.42));
    panda.add(q(GS, mt(0xffffff), 0.3, 0.27, 0.28, 0, 0.92, 0.1)); for (const s of [-1, 1]) { panda.add(q(GS, mt(0x222222), 0.1, 0.1, 0.06, s * 0.2, 1.15, 0.05)); panda.add(q(GS, mt(0x222222), 0.08, 0.1, 0.04, s * 0.11, 0.95, 0.35)); } g.add(panda);
    return g;
  },
};
// ставимо великі декорації по боках кухні (видно на краях кадру)
export function heroProps(theme, sim, scene, hall) {
  const make = HERO[theme]; if (!make) return;
  seed = sim.w * 3 + theme.length;
  const spots = [[-3.2, sim.h * 0.25, 0.5], [-3.0, sim.h * 0.8, 0.3]];
  if (!hall) spots.push([sim.w + 2.2, sim.h * 0.3, -0.5], [sim.w + 2.4, sim.h * 0.85, -0.3]);
  else spots.push([sim.w + 2.4, sim.h * 0.9, -0.3]);
  spots.forEach(([x, z, ry], i) => { const o = make(rnd); o.position.set(x, 0, z); o.rotation.y = ry + (x < 0 ? Math.PI / 2 : -Math.PI / 2); o.scale.setScalar(i % 2 ? 0.85 : 1); scene.add(o); });
}

/* ================= національні головні убори гостей ================= */
// індекси з hats.js: 6 віночок, 7 берет, 8 сомбреро, 9 ковбойський, 14 тірольський, 19 хачімакі, 2 кепка, 20 тюрбан, 21 конічний, 22 папаха
export const GUEST_HATS = { ua: [6, -1], de: [14, -1], it: [7, -1, -1], jp: [19, -1], mx: [8, 8, -1], us: [9, 2, -1], in: [20, -1], fr: [7, 7, -1], ge: [22, -1], cn: [21, -1] };
