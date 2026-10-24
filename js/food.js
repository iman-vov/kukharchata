// Кухарчата — 3D-моделі продуктів, страв і напоїв (власні, без емодзі).
import * as THREE from 'three';
import { ING, RECIPES } from './data.js';
import { cookerState } from './sim.js';

const MC = new Map();
export function mat(col, o = {}) {
  const k = col + JSON.stringify(o);
  if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0, ...o }));
  return MC.get(k);
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 20, 14), sphLo: new THREE.SphereGeometry(1, 10, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24), cylLo: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 14),
  tor: new THREE.TorusGeometry(1, 0.3, 10, 24), torThin: new THREE.TorusGeometry(1, 0.12, 8, 24), wedge: new THREE.CylinderGeometry(1, 1, 1, 3),
  hemi: new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), disc: new THREE.CylinderGeometry(1, 1, 1, 28),
  cap: new THREE.CapsuleGeometry(0.5, 1, 6, 12), tri: new THREE.CylinderGeometry(1, 1, 1, 3), half: new THREE.CylinderGeometry(1, 1, 1, 20, 1, false, 0, Math.PI),
};
// миска: профіль обертання
const BOWL = new THREE.LatheGeometry([[0, 0], [0.14, 0], [0.2, 0.03], [0.26, 0.1], [0.28, 0.16], [0.265, 0.165], [0.245, 0.11], [0.19, 0.045], [0, 0.04]].map(p => new THREE.Vector2(p[0], p[1])), 32);
const PLATE = new THREE.LatheGeometry([[0, 0], [0.2, 0], [0.24, 0.02], [0.32, 0.045], [0.31, 0.055], [0.23, 0.035], [0, 0.03]].map(p => new THREE.Vector2(p[0], p[1])), 36);
const MUG = new THREE.LatheGeometry([[0, 0], [0.12, 0], [0.13, 0.02], [0.135, 0.27], [0.12, 0.27], [0.115, 0.03], [0, 0.03]].map(p => new THREE.Vector2(p[0], p[1])), 28);

function m(geo, mt, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, mt); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  o.castShadow = true; o.receiveShadow = true; return o;
}
const C = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
let seed = 1; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

/* ================= сирі продукти ================= */
const INNER = { walnut: 0xe9c99a, pepper: 0xe8412c, tofu: 0xfffbf0, paneer: 0xfff8e6, spinach: 0x3f9a3f, eggplant: 0xf1e6c4, zucchini: 0xe9f2c4, baguette: 0xf6e3b8, tomato: 0xf26a4f, potato: 0xf3e1a6, onion: 0xf6efe0, beet: 0xa3245e, cabbage: 0xdcefc4, cucumber: 0xc9e7a2, apple: 0xfbefc9, carrot: 0xf7983a, meat: 0xd9645f, fish: 0xf6c3a8, chicken: 0xf1d2b0, mushroom: 0xeedcc0, cheese: 0xffd34d, garlic: 0xfaf3df, lettuce: 0x8fd16a, herbs: 0x3aa346, tortilla: 0xe8c98b };

function raw(id) {
  const d = ING[id], g = new THREE.Group(), M = mat(d.col);
  seed = id.length * 77;
  switch (id) {
    case 'tomato':
      g.add(m(G.sph, M, 0.16, 0.13, 0.16, 0, 0.13));
      for (let i = 0; i < 5; i++) g.add(m(G.cone, mat(0x3c9a3c), 0.025, 0.09, 0.012, Math.cos(i * 1.26) * 0.04, 0.255, Math.sin(i * 1.26) * 0.04, Math.PI / 2, -i * 1.26, 0));
      g.add(m(G.cylLo, mat(0x2e7d32), 0.012, 0.05, 0.012, 0, 0.28)); break;
    case 'lettuce':
      for (let i = 0; i < 7; i++) { const a = i * 0.9; g.add(m(G.sph, mat(i % 2 ? 0x7ccf55 : 0x5fb33f), 0.13, 0.07, 0.17, Math.cos(a) * 0.06, 0.08 + i * 0.012, Math.sin(a) * 0.06, 0.6, a, 0)); }
      g.add(m(G.sph, mat(0xc9eea0), 0.07, 0.07, 0.07, 0, 0.12)); break;
    case 'cucumber': {
      const c = m(G.cap, M, 0.11, 0.3, 0.11, 0, 0.06, 0, 0, 0, Math.PI / 2); g.add(c);
      for (let i = 0; i < 8; i++) g.add(m(G.sphLo, mat(0x2a6e2a), 0.012, 0.012, 0.012, -0.15 + i * 0.04, 0.11, (i % 2 - 0.5) * 0.06));
      break;
    }
    case 'onion':
      g.add(m(G.sph, M, 0.14, 0.13, 0.14, 0, 0.13)); g.add(m(G.cone, M, 0.06, 0.1, 0.06, 0, 0.28));
      for (let i = 0; i < 4; i++) g.add(m(G.cylLo, mat(0xc4a27a), 0.005, 0.04, 0.005, Math.cos(i * 1.6) * 0.02, 0.0, Math.sin(i * 1.6) * 0.02));
      for (let i = 0; i < 3; i++) g.add(m(G.torThin, mat(C(d.col, 0x9a6b3a, 0.4)), 0.14, 0.14, 0.14, 0, 0.13, 0, 0, i * 1.05, Math.PI / 2));
      break;
    case 'beet':
      g.add(m(G.sph, M, 0.13, 0.13, 0.13, 0, 0.13)); g.add(m(G.cone, M, 0.04, 0.1, 0.04, 0, 0.0, 0, Math.PI));
      for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.4; g.add(m(G.cylLo, mat(0xa3245e), 0.01, 0.16, 0.01, Math.sin(a) * 0.05, 0.32, 0, 0, 0, a)); g.add(m(G.sph, mat(0x3a9a3a), 0.05, 0.08, 0.015, Math.sin(a) * 0.11, 0.42, 0, 0, 0, a)); }
      break;
    case 'cabbage':
      g.add(m(G.sph, mat(0xd6efb4), 0.15, 0.14, 0.15, 0, 0.14));
      for (let i = 0; i < 5; i++) { const a = i * 1.26; g.add(m(G.sph, mat(0x9fd27a, { side: THREE.DoubleSide }), 0.13, 0.15, 0.06, Math.cos(a) * 0.09, 0.12, Math.sin(a) * 0.09, 0.2, -a + Math.PI / 2, 0)); }
      break;
    case 'potato':
      g.add(m(G.sph, M, 0.17, 0.11, 0.13, 0, 0.11, 0, 0, 0.3, 0.1)); g.add(m(G.sph, M, 0.09, 0.08, 0.09, 0.09, 0.12, 0.03));
      for (let i = 0; i < 4; i++) g.add(m(G.sphLo, mat(0x8a6236), 0.015, 0.01, 0.015, -0.1 + i * 0.07, 0.2 - (i % 2) * 0.03, 0.05 - i * 0.03));
      break;
    case 'meat': {
      const sh = new THREE.Shape(); sh.moveTo(-0.16, -0.06); sh.bezierCurveTo(-0.2, 0.08, -0.05, 0.14, 0.06, 0.1); sh.bezierCurveTo(0.2, 0.08, 0.2, -0.08, 0.08, -0.1); sh.bezierCurveTo(0, -0.12, -0.12, -0.12, -0.16, -0.06);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
      g.add(m(geo, M, 1, 1, 1, 0, 0.02, 0, -Math.PI / 2));
      g.add(m(G.torThin, mat(0xfff0e8), 0.07, 0.05, 0.07, 0.05, 0.11, 0.01, Math.PI / 2)); break;
    }
    case 'fish':
      g.add(m(G.sph, M, 0.2, 0.09, 0.08, 0, 0.1)); g.add(m(G.sph, mat(0xeaf3f9), 0.17, 0.05, 0.07, 0, 0.07));
      g.add(m(G.cone, M, 0.09, 0.12, 0.025, -0.25, 0.1, 0, 0, 0, Math.PI / 2));
      g.add(m(G.cone, M, 0.05, 0.08, 0.015, 0, 0.19, 0, 0, 0, 0));
      g.add(m(G.sphLo, mat(0xffffff), 0.025, 0.025, 0.01, 0.13, 0.12, 0.07)); g.add(m(G.sphLo, mat(0x111111), 0.013, 0.013, 0.01, 0.135, 0.12, 0.078));
      break;
    case 'sausage':
      g.add(m(G.cap, M, 0.1, 0.28, 0.1, 0, 0.06, 0, 0, 0, Math.PI / 2 - 0.1));
      g.add(m(G.sphLo, mat(0x8a3324), 0.02, 0.02, 0.02, -0.2, 0.08)); g.add(m(G.sphLo, mat(0x8a3324), 0.02, 0.02, 0.02, 0.2, 0.04)); break;
    case 'bun':
      g.add(m(G.hemi, M, 0.18, 0.12, 0.18, 0, 0.05)); g.add(m(G.disc, mat(0xf3d29a), 0.18, 0.05, 0.18, 0, 0.025));
      for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, r = rnd() * 0.13; g.add(m(G.sphLo, mat(0xfff6dc), 0.012, 0.006, 0.02, Math.cos(a) * r, 0.05 + Math.sqrt(Math.max(0, 1 - (r / 0.18) ** 2)) * 0.12, Math.sin(a) * r, 0, a)); }
      break;
    case 'cheese': {
      const w = m(G.tri, M, 0.2, 0.13, 0.2, 0, 0.065, 0, 0, 0.3); g.add(w);
      for (let i = 0; i < 4; i++) g.add(m(G.cylLo, mat(0xd9a520), 0.025, 0.01, 0.025, -0.03 + i * 0.03, 0.131, -0.03 + (i % 2) * 0.05));
      break;
    }
    case 'mushroom':
      g.add(m(G.cylLo, mat(0xf2e8d8), 0.05, 0.14, 0.05, 0, 0.07)); g.add(m(G.hemi, mat(0x8a5a33), 0.15, 0.1, 0.15, 0, 0.13));
      g.add(m(G.disc, mat(0xe9d7b5), 0.14, 0.01, 0.14, 0, 0.13)); break;
    case 'dough':
      g.add(m(G.sph, M, 0.17, 0.09, 0.15, 0, 0.08)); g.add(m(G.sphLo, mat(0xffffff), 0.03, 0.01, 0.03, -0.05, 0.16, 0.03)); break;
    case 'rice': case 'pasta': case 'noodles': case 'beans': case 'chickpeas': case 'lentils': {
      g.add(m(G.sph, mat(0xe9dcc0), 0.15, 0.17, 0.15, 0, 0.17)); g.add(m(G.cyl, mat(0xe9dcc0), 0.07, 0.06, 0.07, 0, 0.34));
      g.add(m(G.torThin, mat(0x8a5a2b), 0.07, 0.07, 0.07, 0, 0.31, 0, Math.PI / 2));
      const lab = { rice: 0xffffff, pasta: 0xf2cf63, noodles: 0xf0d58a, beans: 0x8a3a2a, chickpeas: 0xe0b56a, lentils: 0xe5783a }[id];
      for (let i = 0; i < 6; i++) g.add(m(id === 'pasta' ? G.cylLo : G.sphLo, mat(lab), id === 'pasta' ? 0.008 : 0.02, id === 'pasta' ? 0.09 : 0.015, id === 'pasta' ? 0.008 : 0.02, Math.cos(i) * 0.03, 0.38 + (i % 2) * 0.01, Math.sin(i * 1.7) * 0.03, 0.2 * i, 0, 0.1 * i));
      g.add(m(G.disc, mat(lab), 0.08, 0.005, 0.08, 0, 0.17, 0.15, Math.PI / 2));
      break;
    }
    case 'walnut':
      for (let i = 0; i < 4; i++) { const x = (i % 2 - 0.5) * 0.13, z = (Math.floor(i / 2) - 0.5) * 0.12; g.add(m(G.sph, M, 0.075, 0.065, 0.07, x, 0.07, z)); g.add(m(G.box, mat(0x8a5a2b), 0.004, 0.13, 0.14, x, 0.07, z)); }
      break;
    case 'pepper':
      g.add(m(G.sph, M, 0.14, 0.15, 0.13, 0, 0.14)); for (let i = 0; i < 3; i++) g.add(m(G.sph, M, 0.07, 0.13, 0.07, Math.cos(i * 2.1) * 0.07, 0.12, Math.sin(i * 2.1) * 0.07));
      g.add(m(G.cylLo, mat(0x3c8a3a), 0.02, 0.07, 0.02, 0, 0.3)); g.add(m(G.sph, mat(0x3c8a3a), 0.05, 0.02, 0.05, 0, 0.27)); break;
    case 'tofu':
      for (let i = 0; i < 2; i++) g.add(m(G.box, mat(0xfaf6ea, { roughness: 0.9 }), 0.2, 0.1, 0.16, (i - 0.5) * 0.08, 0.05 + i * 0.1, (i - 0.5) * 0.03, 0, i * 0.3)); break;
    case 'tapioca':
      g.add(m(G.cyl, mat(0xe8f4fb, { transparent: true, opacity: 0.5, roughness: 0.05 }), 0.1, 0.2, 0.1, 0, 0.1));
      for (let i = 0; i < 12; i++) g.add(m(G.sphLo, mat(0x2a1a14, { roughness: 0.3 }), 0.025, 0.025, 0.025, (rnd() - 0.5) * 0.12, 0.03 + rnd() * 0.12, (rnd() - 0.5) * 0.12));
      g.add(m(G.cyl, mat(0xd63a3a), 0.105, 0.03, 0.105, 0, 0.21)); break;
    case 'paneer':
      g.add(m(G.box, mat(0xfbf3dc, { roughness: 0.9 }), 0.28, 0.14, 0.22, 0, 0.07)); g.add(m(G.box, mat(0xf3e6c4), 0.06, 0.06, 0.06, 0.1, 0.17, 0.05)); break;
    case 'spinach':
      for (let i = 0; i < 9; i++) { const a = i * 0.7; g.add(m(G.sph, mat(i % 2 ? 0x2f7d32 : 0x3f9a3f), 0.07, 0.025, 0.12, Math.cos(a) * 0.07, 0.05 + (i % 3) * 0.03, Math.sin(a) * 0.07, 0.3, a, 0)); }
      g.add(m(G.torThin, mat(0xd9a066), 0.05, 0.05, 0.05, 0, 0.05, 0, Math.PI / 2)); break;
    case 'eggplant':
      g.add(m(G.sph, M, 0.12, 0.12, 0.2, 0, 0.12, 0.02)); g.add(m(G.sph, M, 0.09, 0.09, 0.1, 0, 0.13, -0.12));
      g.add(m(G.cone, mat(0x3c8a3a), 0.07, 0.06, 0.07, 0, 0.13, -0.22, -Math.PI / 2)); g.add(m(G.cylLo, mat(0x3c8a3a), 0.015, 0.08, 0.015, 0, 0.13, -0.27, Math.PI / 2));
      g.add(m(G.sphLo, mat(0x8a5aa0), 0.05, 0.03, 0.06, 0.06, 0.2, 0.06)); break;
    case 'zucchini': {
      g.add(m(G.cap, M, 0.1, 0.32, 0.1, 0, 0.06, 0, 0, 0, Math.PI / 2));
      for (let i = 0; i < 5; i++) g.add(m(G.box, mat(0x8fc06a), 0.06, 0.004, 0.01, -0.12 + i * 0.06, 0.11, (i % 2 - 0.5) * 0.04));
      g.add(m(G.cylLo, mat(0x6b8a3a), 0.02, 0.05, 0.02, 0.24, 0.06, 0, 0, 0, Math.PI / 2)); break;
    }
    case 'baguette': {
      g.add(m(G.cap, M, 0.1, 0.42, 0.09, 0, 0.06, 0, 0, 0.3, Math.PI / 2));
      for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0xf3d29a), 0.07, 0.01, 0.025, (-0.15 + i * 0.1) * Math.cos(0.3), 0.105, -(-0.15 + i * 0.1) * Math.sin(0.3), 0, 0.3 + 0.5, 0));
      break;
    }
    case 'nori': for (let i = 0; i < 3; i++) g.add(m(G.box, M, 0.28, 0.012, 0.28, 0.01 * i, 0.01 + i * 0.015, -0.01 * i, 0, 0.1 * i)); break;
    case 'tortilla':
      for (let i = 0; i < 3; i++) g.add(m(G.disc, M, 0.22, 0.015, 0.22, 0, 0.01 + i * 0.016));
      for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rnd() * 0.18; g.add(m(G.cylLo, mat(0xb98a4a), 0.02, 0.003, 0.02, Math.cos(a) * r, 0.057, Math.sin(a) * r)); }
      break;
    case 'sourcream':
      g.add(m(G.cyl, mat(0xffffff), 0.11, 0.18, 0.11, 0, 0.09)); g.add(m(G.cyl, mat(0x4a90d9), 0.115, 0.04, 0.115, 0, 0.2));
      g.add(m(G.cyl, mat(0x4a90d9), 0.112, 0.06, 0.112, 0, 0.08)); break;
    case 'garlic':
      for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(m(G.sph, mat(0xf4ecdd), 0.06, 0.1, 0.06, Math.cos(a) * 0.05, 0.1, Math.sin(a) * 0.05, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)); }
      g.add(m(G.cone, mat(0xe8dcc6), 0.03, 0.08, 0.03, 0, 0.23)); break;
    case 'salt':
      g.add(m(G.cyl, mat(0xf5f7fa, { roughness: 0.2 }), 0.07, 0.2, 0.07, 0, 0.1)); g.add(m(G.hemi, mat(0xc0c8d0, { metalness: 0.6, roughness: 0.3 }), 0.07, 0.05, 0.07, 0, 0.2));
      for (let i = 0; i < 4; i++) g.add(m(G.sphLo, mat(0x333333), 0.008, 0.008, 0.008, Math.cos(i * 1.6) * 0.025, 0.245, Math.sin(i * 1.6) * 0.025)); break;
    case 'honey':
      g.add(m(G.sph, mat(0xf2b134, { roughness: 0.15, transparent: true, opacity: 0.9 }), 0.12, 0.12, 0.12, 0, 0.12)); g.add(m(G.cyl, mat(0xc0392b), 0.08, 0.04, 0.08, 0, 0.24));
      g.add(m(G.cyl, mat(0xffffff), 0.1, 0.03, 0.1, 0, 0.27)); g.add(m(G.cylLo, mat(0x8a5a2b), 0.01, 0.2, 0.01, 0.05, 0.3, 0, 0, 0, -0.4)); break;
    case 'curry':
      g.add(m(G.cyl, mat(0xd9822b, { roughness: 0.3 }), 0.07, 0.2, 0.07, 0, 0.1)); g.add(m(G.cyl, mat(0xd9822b), 0.03, 0.06, 0.03, 0, 0.23));
      g.add(m(G.cyl, mat(0xc0392b), 0.035, 0.03, 0.035, 0, 0.27)); g.add(m(G.cyl, mat(0xfff3d6), 0.072, 0.07, 0.072, 0, 0.1)); break;
    case 'egg': for (let i = 0; i < 2; i++) g.add(m(G.sph, M, 0.07, 0.095, 0.07, (i - 0.5) * 0.12, 0.09, i * 0.03)); break;
    case 'herbs':
      for (let i = 0; i < 7; i++) { const a = i * 0.9, x = Math.cos(a) * 0.03; g.add(m(G.cylLo, mat(0x2e7d32), 0.006, 0.22, 0.006, x, 0.11, Math.sin(a) * 0.03, 0, 0, (i - 3) * 0.08)); g.add(m(G.sph, mat(i % 2 ? 0x3aa346 : 0x56c05f), 0.04, 0.025, 0.05, x + (i - 3) * 0.02, 0.22 + (i % 3) * 0.02, Math.sin(a) * 0.03)); }
      break;
    case 'apple':
      g.add(m(G.sph, M, 0.14, 0.13, 0.14, 0, 0.13)); g.add(m(G.cylLo, mat(0x6b4226), 0.01, 0.06, 0.01, 0, 0.28));
      g.add(m(G.sph, mat(0x3a9a3a), 0.04, 0.01, 0.025, 0.035, 0.28, 0, 0, 0, 0.4)); g.add(m(G.sphLo, mat(0xff8a8a), 0.04, 0.04, 0.02, -0.06, 0.18, 0.11)); break;
    case 'carrot':
      g.add(m(G.cone, M, 0.06, 0.32, 0.06, 0, 0.06, 0, 0, 0, -Math.PI / 2));
      for (let i = 0; i < 3; i++) g.add(m(G.cone, mat(0x3a9a3a), 0.02, 0.12, 0.02, -0.2, 0.08 + (i - 1) * 0.02, (i - 1) * 0.02, 0, 0, Math.PI / 2 + (i - 1) * 0.3));
      for (let i = 0; i < 4; i++) g.add(m(G.torThin, mat(0xd9761f), 0.05 - i * 0.01, 0.05 - i * 0.01, 0.05 - i * 0.01, -0.08 + i * 0.06, 0.06, 0, 0, Math.PI / 2));
      break;
    case 'corn':
      g.add(m(G.cap, M, 0.1, 0.26, 0.1, 0, 0.07, 0, 0, 0, Math.PI / 2));
      for (let i = 0; i < 2; i++) g.add(m(G.sph, mat(0x8bc34a, { side: THREE.DoubleSide }), 0.2, 0.05, 0.07, -0.05, 0.07, (i - 0.5) * 0.12, 0, (i - 0.5) * 0.3, 0));
      break;
    case 'chicken':
      g.add(m(G.sph, M, 0.13, 0.1, 0.11, 0.05, 0.1)); g.add(m(G.cylLo, mat(0xfaf3e6), 0.025, 0.14, 0.025, -0.12, 0.09, 0, 0, 0, Math.PI / 2));
      g.add(m(G.sph, mat(0xfaf3e6), 0.03, 0.03, 0.03, -0.2, 0.11, 0.02)); g.add(m(G.sph, mat(0xfaf3e6), 0.03, 0.03, 0.03, -0.2, 0.08, -0.02)); break;
    case 'choco':
      g.add(m(G.box, mat(0xd84a3a), 0.26, 0.03, 0.18, 0, 0.015, 0.03));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.add(m(G.box, M, 0.055, 0.03, 0.065, -0.09 + i * 0.06, 0.04, -0.07 + j * 0.07));
      break;
    case 'ice': for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0xdff6ff, { transparent: true, opacity: 0.75, roughness: 0.05 }), 0.09, 0.09, 0.09, (i % 2 - 0.5) * 0.1, 0.05 + Math.floor(i / 2) * 0.08, (i % 2) * 0.03, 0.3 * i, 0.5 * i, 0)); break;
    case 'caramel':
      g.add(m(G.cyl, mat(0xc98a2a, { roughness: 0.15, transparent: true, opacity: 0.92 }), 0.08, 0.22, 0.08, 0, 0.11)); g.add(m(G.cyl, mat(0xffffff), 0.03, 0.08, 0.03, 0, 0.26));
      g.add(m(G.cyl, mat(0xffffff), 0.082, 0.07, 0.082, 0, 0.12)); break;
    default:
      if (d.liquid) { g.add(m(G.cyl, mat(0xe8f4fb, { transparent: true, opacity: 0.5, roughness: 0.05 }), 0.09, 0.24, 0.09, 0, 0.12)); g.add(m(G.cyl, mat(d.col, { roughness: 0.2 }), 0.083, 0.18, 0.083, 0, 0.1)); }
      else g.add(m(G.sph, M, 0.15, 0.15, 0.15, 0, 0.15));
  }
  return g;
}

/* ================= оброблені продукти ================= */
function processed(id, s) {
  const d = ING[id], g = new THREE.Group();
  seed = id.length * 31 + s.charCodeAt(0);
  let inner = INNER[id] ?? d.col, outer = d.col;
  const tint = c => s === 'x' ? 0x2a2522 : s === 'f' ? C(c, 0x9a5a1a, 0.45) : s === 'k' ? C(c, 0xd9902f, 0.35) : s === 'b' ? C(c, 0xffffff, 0.1) : c;
  const I = mat(tint(inner)), O = mat(tint(outer));
  // цільні приготовані форми
  if (s !== 'c') {
    switch (id) {
      case 'meat': case 'chicken': { g.add(m(G.sph, I, 0.16, 0.05, 0.12, 0, 0.05)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(tint(0x6b3a1a)), 0.2, 0.005, 0.012, 0, 0.1, -0.05 + i * 0.033, 0, 0.5)); return g; }
      case 'sausage': { g.add(m(G.cap, O, 0.1, 0.26, 0.1, 0, 0.06, 0, 0, 0, Math.PI / 2)); if (s === 'f') for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x5a2414), 0.008, 0.02, 0.1, -0.09 + i * 0.06, 0.11, 0, 0, 0, 0.3)); return g; }
      case 'dough': if (s === 'b') { for (let i = 0; i < 5; i++) g.add(m(G.half, I, 0.07, 0.03, 0.07, Math.cos(i * 1.26) * 0.09, 0.03, Math.sin(i * 1.26) * 0.09, Math.PI / 2, i * 1.26)); return g; }
        g.add(m(G.sph, I, 0.17, 0.06, 0.15, 0, 0.05)); return g;
      case 'tortilla': g.add(m(G.disc, I, 0.22, 0.02, 0.22, 0, 0.015)); return g;
      case 'egg': g.add(m(G.sph, mat(0xffffff), 0.06, 0.04, 0.08, -0.04, 0.03, 0)); g.add(m(G.sphLo, mat(0xffb300), 0.03, 0.02, 0.03, -0.04, 0.06, 0)); g.add(m(G.sph, mat(0xffffff), 0.06, 0.04, 0.08, 0.05, 0.03, 0.02)); g.add(m(G.sphLo, mat(0xffb300), 0.03, 0.02, 0.03, 0.05, 0.06, 0.02)); return g;
      case 'corn': g.add(m(G.cap, mat(tint(0xf5cf3a)), 0.1, 0.24, 0.1, 0, 0.07, 0, 0, 0, Math.PI / 2)); return g;
      case 'potato': if (s === 'f') { for (let i = 0; i < 8; i++) g.add(m(G.box, mat(0xf2c14e), 0.03, 0.03, 0.18, (rnd() - 0.5) * 0.18, 0.03 + (i % 3) * 0.02, (rnd() - 0.5) * 0.1, 0, rnd() * 3)); return g; } break;
      case 'rice': case 'pasta': case 'noodles': case 'beans': case 'chickpeas': case 'lentils': break;
    }
  }
  // шматочки / варене / смажене: великі впізнавані купки (у кожного продукту своя форма й колір)
  const T = c => mat(tint(c));
  const ring = (n, r0, f) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd() * 0.4, r = r0 * (0.6 + rnd() * 0.5); f(Math.cos(a) * r, Math.sin(a) * r, i, a); } };
  const rounds = (rim, core, n = 6, R = 0.07, seeds = null) => ring(n, 0.1, (x, z, i, a) => {
    const p = new THREE.Group(); p.add(m(G.cylLo, T(rim), R, 0.025, R)); p.add(m(G.cylLo, T(core), R * 0.82, 0.028, R * 0.82));
    if (seeds) for (let k = 0; k < 4; k++) p.add(m(G.sphLo, T(seeds), 0.008, 0.004, 0.012, Math.cos(k * 1.6) * R * 0.35, 0.016, Math.sin(k * 1.6) * R * 0.35));
    p.position.set(x, 0.03 + (i % 3) * 0.018, z); p.rotation.set(0.25 * Math.sin(a), 0, 0.25 * Math.cos(a)); g.add(p);
  });
  const cubes = (cols, n = 7, S = 0.075) => ring(n, 0.11, (x, z, i) => g.add(m(G.box, T(cols[i % cols.length]), S, S * 0.85, S, x, 0.04 + (i % 2) * 0.05, z, rnd() * 0.5, rnd() * 3, rnd() * 0.5)));
  const leaves = (c1, c2, n = 6, S = 0.12) => ring(n, 0.08, (x, z, i, a) => { g.add(m(G.sph, T(i % 2 ? c1 : c2), S * 0.75, 0.018, S, x, 0.03 + i * 0.012, z, 0.3 * Math.sin(a), a, 0)); g.add(m(G.box, T(C(c1, 0xffffff, 0.5)), 0.006, 0.02, S * 1.4, x, 0.05 + i * 0.012, z, 0, a, 0)); });
  switch (id) {
    case 'tomato': rounds(0xd8321c, 0xf26a4f, 6, 0.07, 0xffe08a); g.add(m(G.cone, T(0x3c9a3c), 0.05, 0.03, 0.05, 0, 0.12, 0)); break;
    case 'apple': rounds(0xc8242e, 0xfbefc9, 5, 0.07, 0x5a3a1a); g.add(m(G.cylLo, T(0x6b4226), 0.008, 0.05, 0.008, 0, 0.12, 0)); g.add(m(G.sph, T(0x3a9a3a), 0.035, 0.008, 0.02, 0.02, 0.14, 0)); break;
    case 'cucumber': rounds(0x2f7d2a, 0xc9e7a2, 6, 0.065, 0xeef6d0); break;
    case 'zucchini': rounds(0x4f8a2e, 0xf1f2c4, 5, 0.075, 0xd9dca0); break;
    case 'eggplant': rounds(0x4a1f5a, 0xf1e6c4, 5, 0.08, 0xb8a070); break;
    case 'carrot': rounds(0xe06d18, 0xf7a24a, 7, 0.055); { const t = new THREE.Group(); for (let k = 0; k < 3; k++) t.add(m(G.cone, T(0x3a9a3a), 0.02, 0.1, 0.02, 0, 0.05, 0, 0, 0, (k - 1) * 0.4)); t.position.set(0.12, 0.08, -0.08); g.add(t); } break;
    case 'baguette': rounds(0xb8742e, 0xf6e3b8, 5, 0.075); break;
    case 'onion': ring(6, 0.09, (x, z, i) => g.add(m(G.tor, T(i % 2 ? 0xf6efe0 : 0xe9d7c0), 0.06, 0.06, 0.05, x, 0.03 + (i % 3) * 0.02, z, Math.PI / 2 + (rnd() - 0.5) * 0.4, 0, 0))); g.add(m(G.hemi, T(0xe9c79a), 0.08, 0.06, 0.08, 0.02, 0.03, 0.02)); break;
    case 'pepper': ring(6, 0.09, (x, z, i) => g.add(m(G.tor, T(0xd63a2a), 0.06, 0.06, 0.08, x, 0.03 + (i % 3) * 0.02, z, Math.PI / 2 + (rnd() - 0.5) * 0.4, 0, 0))); g.add(m(G.cylLo, T(0x3c8a3a), 0.015, 0.05, 0.015, 0, 0.1, 0)); break;
    case 'lettuce': leaves(0x7ccf55, 0x5fb33f, 6, 0.13); break;
    case 'spinach': leaves(0x2f6d2a, 0x3f8a3a, 7, 0.12); break;
    case 'cabbage': for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.12; g.add(m(G.box, T(i % 2 ? 0xdcefc4 : 0xc4e3a0), 0.02, 0.012, 0.13, Math.cos(a) * r, 0.03 + rnd() * 0.06, Math.sin(a) * r, 0, rnd() * 3, 0)); } break;
    case 'herbs': ring(7, 0.1, (x, z, i, a) => { g.add(m(G.cylLo, T(0x2e7d32), 0.006, 0.12, 0.006, x, 0.03, z, Math.PI / 2, 0, a)); for (let k = 0; k < 3; k++) g.add(m(G.sph, T(0x3aa346), 0.025, 0.01, 0.035, x + Math.cos(a) * (k - 1) * 0.035, 0.04, z + Math.sin(a) * (k - 1) * 0.035, 0, a, 0)); }); break;
    case 'garlic': ring(4, 0.07, (x, z, i, a) => g.add(m(G.sph, T(0xf6efdf), 0.035, 0.03, 0.055, x, 0.035, z, 0, a, 0.3))); for (let i = 0; i < 10; i++) g.add(m(G.sphLo, T(0xfaf3df), 0.012, 0.01, 0.012, (rnd() - 0.5) * 0.2, 0.02, (rnd() - 0.5) * 0.2)); break;
    case 'potato': cubes([0xf3e1a6, 0xeed596, 0xc79a5b], 7, 0.08); break;
    case 'beet': cubes([0x8e1b4f, 0xa3245e], 7, 0.075); break;
    case 'paneer': cubes([0xfff8e6, 0xf6ebcc], 6, 0.085); break;
    case 'tofu': cubes([0xfffbf0, 0xf4efe0], 6, 0.09); break;
    case 'meat': ring(6, 0.1, (x, z, i) => { const c = new THREE.Group(); c.add(m(G.box, T(0xc94a4a), 0.09, 0.075, 0.09)); c.add(m(G.box, T(0xf6e3d6), 0.092, 0.015, 0.092, 0, 0.015)); c.position.set(x, 0.045 + (i % 2) * 0.05, z); c.rotation.set(rnd() * 0.4, rnd() * 3, rnd() * 0.4); g.add(c); }); break;
    case 'chicken': cubes([0xf1d2b0, 0xe7b98a], 6, 0.085); break;
    case 'fish': ring(3, 0.06, (x, z, i, a) => { g.add(m(G.box, T(0xf4a07a), 0.16, 0.04, 0.07, x, 0.03 + i * 0.03, z, 0, a + 1, 0)); for (let k = 0; k < 3; k++) g.add(m(G.box, T(0xffffff), 0.006, 0.042, 0.07, x + Math.cos(a + 1) * (k - 1) * 0.04, 0.032 + i * 0.03, z - Math.sin(a + 1) * (k - 1) * 0.04, 0, a + 1, 0)); }); break;
    case 'cheese': ring(6, 0.09, (x, z, i) => g.add(m(G.tri, T(0xf5c84a), 0.06, 0.05, 0.06, x, 0.04 + (i % 2) * 0.04, z, 0, rnd() * 3, 0))); for (let i = 0; i < 10; i++) g.add(m(G.box, T(0xffd34d), 0.012, 0.01, 0.07, (rnd() - 0.5) * 0.22, 0.02, (rnd() - 0.5) * 0.22, 0, rnd() * 3, 0)); break;
    case 'mushroom': ring(5, 0.09, (x, z, i, a) => { const p = new THREE.Group(); p.add(m(G.half, T(0xc9a27e), 0.06, 0.02, 0.06, 0, 0.03, 0, Math.PI / 2)); p.add(m(G.box, T(0xeedcc0), 0.03, 0.02, 0.05, 0, 0, -0.03)); p.position.set(x, 0.02, z); p.rotation.y = a; g.add(p); }); break;
    case 'walnut': ring(6, 0.09, (x, z, i) => { g.add(m(G.sph, T(0xc8925a), 0.04, 0.03, 0.035, x, 0.03, z)); g.add(m(G.sph, T(0xb58450), 0.035, 0.028, 0.03, x + 0.025, 0.035, z)); }); break;
    case 'tortilla': ring(6, 0.1, (x, z, i) => g.add(m(G.tri, T(0xf0c060), 0.08, 0.012, 0.08, x, 0.02 + (i % 3) * 0.015, z, rnd() * 0.4, rnd() * 3, rnd() * 0.4))); break;
    default: {
      // крупи, макарони, квасоля тощо — дрібніші, але купкою
      const shape = { chickpeas: 'bean', lentils: 'grain', rice: 'grain', pasta: 'noodle', noodles: 'noodle', beans: 'bean' }[id] || 'cube';
      const n = { grain: 34, bean: 16, noodle: 10 }[shape] || 7;
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.13, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.025 + rnd() * 0.04;
        if (shape === 'grain') g.add(m(G.sphLo, I, 0.014, 0.01, 0.024, x * 0.9, 0.03 + rnd() * 0.035, z * 0.9, 0, rnd() * 3, 0));
        else if (shape === 'bean') g.add(m(G.sphLo, I, 0.026, 0.019, 0.034, x * 0.9, y * 0.8, z * 0.9, 0, rnd() * 3, 0));
        else if (shape === 'noodle') g.add(m(G.torThin, I, 0.06 + rnd() * 0.03, 0.06, 0.06 + rnd() * 0.03, x * 0.4, 0.03 + i * 0.006, z * 0.4, Math.PI / 2 + rnd() * 0.3, 0, rnd()));
        else g.add(m(G.box, i % 3 ? I : O, 0.075, 0.06, 0.075, x, y, z, rnd(), rnd(), rnd()));
      }
    }
  }
  g.scale.setScalar(1.35);
  return g;
}
export function makeIngMesh(id, s = 'r') { return s === 'r' ? raw(id) : processed(id, s); }

/* ================= посуд ================= */
export function plateMesh(dirty = false) {
  const g = new THREE.Group();
  g.add(m(PLATE, mat(dirty ? 0xc6b596 : 0xffffff, { roughness: 0.25 })));
  g.add(m(G.torThin, mat(dirty ? 0x9a8565 : 0x6fa8dc), 0.3, 0.3, 0.3, 0, 0.05, 0, Math.PI / 2));
  if (dirty) for (let i = 0; i < 4; i++) g.add(m(G.cylLo, mat(0x8a6a3a), 0.04, 0.004, 0.03, Math.cos(i * 2) * 0.12, 0.04, Math.sin(i * 2) * 0.1));
  return g;
}
function bowl(soup, col = 0xffffff, rim = 0x2f6fd6) {
  const g = new THREE.Group();
  g.add(m(BOWL, mat(col, { roughness: 0.3, side: THREE.DoubleSide })));
  g.add(m(G.torThin, mat(rim), 0.272, 0.272, 0.272, 0, 0.162, 0, Math.PI / 2));
  if (soup !== null) g.add(m(G.disc, mat(soup, { roughness: 0.18 }), 0.24, 0.01, 0.24, 0, 0.13));
  return g;
}
const add = (g, o, x = 0, y = 0, z = 0, s = 1) => { o.position.set(x, y, z); o.scale.multiplyScalar(s); g.add(o); return o; };
function scatter(g, n, f) { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()); f(Math.cos(a) * r, Math.sin(a) * r, i); } }

/* ================= страви ================= */
const DISH = {
  salad: (g) => { const b = bowl(null, 0xffffff, 0x3cb371); g.add(b); scatter(g, 14, (x, z, i) => g.add(m(G.sph, mat(i % 2 ? 0x7ccf55 : 0x5fb33f), 0.08, 0.025, 0.06, x * 0.17, 0.13 + (i % 3) * 0.015, z * 0.17, 0.4, i))); scatter(g, 6, (x, z) => g.add(m(G.box, mat(0xe8412c), 0.05, 0.04, 0.05, x * 0.14, 0.16, z * 0.14, 0.3, 0.5))); },
  salad3: (g) => { DISH.salad(g); scatter(g, 5, (x, z) => { const p = new THREE.Group(); p.add(m(G.cylLo, mat(0x3f9b3a), 0.04, 0.015, 0.04)); p.add(m(G.cylLo, mat(0xc9e7a2), 0.033, 0.017, 0.033)); add(g, p, x * 0.13, 0.17, z * 0.13); }); },
  deruny: (g) => { g.add(plateMesh()); for (let i = 0; i < 3; i++) g.add(m(G.sph, mat(C(0xd99a3a, 0x8a5a1a, i * 0.2)), 0.13, 0.025, 0.12, (i - 1) * 0.04, 0.05 + i * 0.03, (i - 1) * 0.02)); g.add(m(G.sph, mat(0xffffff), 0.06, 0.04, 0.06, 0, 0.14, 0)); g.add(m(G.sphLo, mat(0x3aa346), 0.01, 0.01, 0.03, 0.02, 0.18, 0.01)); },
  tsoup: (g) => { g.add(bowl(0xd9432e)); g.add(m(G.sph, mat(0xffffff), 0.04, 0.012, 0.04, 0.04, 0.14, 0)); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.004, 0.012, x * 0.18, 0.14, z * 0.18))); },
  borshch: (g) => { g.add(bowl(0xa8233a, 0xffffff, 0xc8202a)); g.add(m(G.sph, mat(0xffffff), 0.06, 0.02, 0.06, 0.03, 0.14, 0.02)); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.014, 0.004, 0.014, x * 0.18, 0.14, z * 0.18))); scatter(g, 4, (x, z) => g.add(m(G.box, mat(0xf3e1a6), 0.035, 0.02, 0.035, x * 0.15, 0.135, z * 0.15))); },
  varenyky: (g) => { g.add(plateMesh()); for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(m(G.half, mat(0xf6ead2), 0.075, 0.035, 0.075, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15, Math.PI / 2, -a + Math.PI / 2)); } g.add(m(G.sph, mat(0xffffff), 0.05, 0.03, 0.05, 0, 0.06)); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0xc8902a), 0.015, 0.01, 0.015, x * 0.2, 0.08, z * 0.2))); },
  pizza: (g, mush) => {
    g.add(m(G.disc, mat(0xd9a05a), 0.3, 0.03, 0.3, 0, 0.015)); g.add(m(G.torThin, mat(0xc08040), 0.29, 0.29, 0.4, 0, 0.035, 0, Math.PI / 2));
    g.add(m(G.disc, mat(0xd2382a), 0.26, 0.01, 0.26, 0, 0.033));
    scatter(g, 9, (x, z) => g.add(m(G.sph, mat(0xfff3c9), 0.045, 0.012, 0.045, x * 0.2, 0.04, z * 0.2)));
    scatter(g, 4, (x, z) => g.add(m(G.sph, mat(0x2e8b3a), 0.03, 0.005, 0.02, x * 0.18, 0.046, z * 0.18, 0, x * 3)));
    if (mush) scatter(g, 6, (x, z) => g.add(m(G.half, mat(0xc9a27e), 0.035, 0.012, 0.035, x * 0.2, 0.045, z * 0.2, Math.PI / 2, x * 4)));
  },
  pizzam: (g) => DISH.pizza(g, true),
  pasta: (g, sauce = 0xd2382a) => { g.add(plateMesh()); for (let i = 0; i < 12; i++) g.add(m(G.torThin, mat(0xf2cf63), 0.08 + rnd() * 0.06, 0.08 + rnd() * 0.06, 0.05, (rnd() - 0.5) * 0.06, 0.05 + i * 0.008, (rnd() - 0.5) * 0.06, Math.PI / 2 + (rnd() - 0.5) * 0.6, 0, rnd() * 3)); g.add(m(G.sph, mat(sauce), 0.09, 0.03, 0.09, 0, 0.14)); g.add(m(G.sph, mat(0x2e8b3a), 0.025, 0.006, 0.015, 0.02, 0.17, 0)); },
  pastam: (g) => { DISH.pasta(g, 0xe9d7b5); scatter(g, 5, (x, z) => g.add(m(G.half, mat(0x8a5a33), 0.03, 0.012, 0.03, x * 0.1, 0.16, z * 0.1, Math.PI / 2, x * 4))); },
  sushi: (g, fill = 0xf28c6a) => {
    g.add(m(G.box, mat(0x3a2a1e), 0.5, 0.025, 0.3, 0, 0.012));
    for (let i = 0; i < 4; i++) { const x = -0.17 + i * 0.115; g.add(m(G.cyl, mat(0x1f3d2b), 0.05, 0.06, 0.05, x, 0.055)); g.add(m(G.cyl, mat(0xffffff), 0.042, 0.062, 0.042, x, 0.056)); g.add(m(G.cyl, mat(fill), 0.017, 0.064, 0.017, x, 0.057)); }
    g.add(m(G.cone, mat(0x7cb342), 0.03, 0.04, 0.03, 0.18, 0.04, 0.09)); g.add(m(G.sph, mat(0xf7c4b0), 0.035, 0.012, 0.03, 0.12, 0.035, 0.1));
  },
  sushic: (g) => DISH.sushi(g, 0x7cc35a),
  ramen: (g, extra) => {
    g.add(bowl(0xe8b46a, 0x1a1a1a, 0xd63a3a));
    for (let i = 0; i < 6; i++) g.add(m(G.torThin, mat(0xf0d58a), 0.05 + rnd() * 0.04, 0.05 + rnd() * 0.04, 0.05, (rnd() - 0.5) * 0.15, 0.135, (rnd() - 0.5) * 0.15, Math.PI / 2, 0, rnd() * 3));
    if (extra !== 'miso') for (let i = 0; i < 3; i++) g.add(m(G.sph, mat(0xc77a5a), 0.06, 0.012, 0.045, -0.08 + i * 0.05, 0.145, 0.08, 0, 0.4));
    g.add(m(G.sph, mat(0xffffff), 0.045, 0.025, 0.035, 0.09, 0.145, -0.04)); g.add(m(G.sphLo, mat(0xffa000), 0.025, 0.012, 0.02, 0.09, 0.16, -0.04));
    scatter(g, 10, (x, z) => g.add(m(G.cylLo, mat(0x6abf4b), 0.012, 0.006, 0.012, x * 0.18, 0.14, z * 0.18)));
    if (extra === 'miso') scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0xf5cf3a), 0.018, 0.012, 0.018, x * 0.12 - 0.05, 0.145, z * 0.12 + 0.05)));
    g.add(m(G.box, mat(0x1f3d2b), 0.08, 0.1, 0.005, -0.12, 0.18, -0.12, 0, 0.6, 0));
  },
  misoramen: (g) => DISH.ramen(g, 'miso'),
  taco: (g) => {
    g.add(plateMesh());
    for (const off of [-0.08, 0.08]) {
      const t = new THREE.Group(); t.position.set(0, 0.15, off);
      t.add(m(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 20, 1, true, Math.PI, Math.PI), mat(0xe8c27a, { side: THREE.DoubleSide }), 1, 1, 1, 0, 0, 0, 0, 0, Math.PI / 2));
      for (let i = 0; i < 9; i++) t.add(m(G.sphLo, mat([0x8a4a2a, 0x7ccf55, 0xe8412c, 0xfff3c9, 0x8a4a2a][i % 5]), 0.035, 0.028, 0.035, (rnd() - 0.5) * 0.2, -0.02 + rnd() * 0.03, (rnd() - 0.5) * 0.06));
      g.add(t);
    }
  },
  burrito: (g) => { g.add(plateMesh()); g.add(m(G.cap, mat(0xe8c98b), 0.13, 0.28, 0.13, 0, 0.1, 0, 0, 0.5, Math.PI / 2)); g.add(m(G.disc, mat(0x8a4a2a), 0.1, 0.01, 0.1, 0.15, 0.1, 0.08, 0, 0.5, Math.PI / 2)); g.add(m(G.box, mat(0xf2f2f2), 0.12, 0.13, 0.13, -0.08, 0.1, -0.04, 0, 0.5)); },
  burger: (g, cheese, tomato) => {
    g.add(plateMesh()); let y = 0.05;
    const lay = (geo, col, h, r = 0.15, ex = {}) => { g.add(m(geo, mat(col, ex), r, h, r, 0, y + h / 2)); y += h; };
    lay(G.disc, 0xe0a85a, 0.04);
    lay(G.disc, 0x5a3220, 0.05, 0.155);
    if (cheese) { const c = m(G.box, mat(0xffc93c), 0.26, 0.012, 0.26, 0, y + 0.006, 0, 0, Math.PI / 4); g.add(c); y += 0.012; }
    if (tomato) lay(G.disc, 0xe8412c, 0.02, 0.13);
    for (let i = 0; i < 6; i++) g.add(m(G.sph, mat(0x6cc24a), 0.07, 0.012, 0.05, Math.cos(i) * 0.1, y + 0.005, Math.sin(i) * 0.1, 0, i));
    y += 0.015;
    g.add(m(G.hemi, mat(0xe0a85a), 0.16, 0.1, 0.16, 0, y));
    for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rnd() * 0.11; g.add(m(G.sphLo, mat(0xfff6dc), 0.01, 0.005, 0.016, Math.cos(a) * r, y + 0.1 * Math.sqrt(1 - (r / 0.16) ** 2), Math.sin(a) * r, 0, a)); }
  },
  cheeseb: (g) => DISH.burger(g, true, true),
  hotdog: (g, sauce = 0xf2c400) => {
    g.add(plateMesh());
    g.add(m(G.cap, mat(0xe0a85a), 0.12, 0.26, 0.09, -0.03, 0.08, 0, 0, 0, Math.PI / 2)); g.add(m(G.cap, mat(0xe0a85a), 0.12, 0.26, 0.09, 0.03, 0.08, 0, 0, 0, Math.PI / 2));
    g.add(m(G.cap, mat(0xb5432f), 0.07, 0.34, 0.07, 0, 0.12, 0, 0, 0, Math.PI / 2));
    for (let i = 0; i < 6; i++) g.add(m(G.box, mat(sauce), 0.06, 0.012, 0.012, -0.15 + i * 0.06, 0.16, 0, 0, i % 2 ? 0.7 : -0.7));
  },
  galushky: (g) => { g.add(bowl(0xfaf5e6, 0xffffff, 0x2f6fd6)); for (let i = 0; i < 8; i++) g.add(m(G.sph, mat(0xf6ead2), 0.045, 0.035, 0.045, Math.cos(i * 0.8) * 0.12 * ((i % 2) + 0.5), 0.14, Math.sin(i * 0.8) * 0.12 * ((i % 2) + 0.5))); g.add(m(G.sph, mat(0xffffff), 0.06, 0.03, 0.06, 0, 0.16)); },
  pampushky: (g) => { g.add(plateMesh()); for (let i = 0; i < 5; i++) { const a = i * 1.26; g.add(m(G.sph, mat(0xd9903f), 0.08, 0.065, 0.08, Math.cos(a) * 0.12, 0.08, Math.sin(a) * 0.12)); } g.add(m(G.sph, mat(0xd9903f), 0.08, 0.065, 0.08, 0, 0.13)); scatter(g, 16, (x, z) => g.add(m(G.sphLo, mat(0xfaf3df), 0.01, 0.008, 0.01, x * 0.2, 0.15, z * 0.2))); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.01, 0.005, 0.01, x * 0.2, 0.15, z * 0.2))); },
  golubtsi: (g) => { g.add(plateMesh()); for (let i = 0; i < 3; i++) g.add(m(G.cap, mat(0xb9d98f), 0.1, 0.12, 0.08, (i - 1) * 0.11, 0.07, 0, Math.PI / 2, 0.3)); g.add(m(G.sph, mat(0xd2382a, { roughness: 0.2 }), 0.2, 0.01, 0.12, 0, 0.11)); g.add(m(G.sph, mat(0xffffff), 0.04, 0.02, 0.04, 0.05, 0.13, 0)); },
  brezel: (g) => {
    g.add(m(G.disc, mat(0x6b4426), 0.25, 0.02, 0.25, 0, 0.01));
    const B = mat(0x8a4a1a, { roughness: 0.4 });
    g.add(m(new THREE.TorusGeometry(0.09, 0.03, 10, 24, Math.PI * 1.6), B, 1, 1, 1, -0.07, 0.05, 0.02, -Math.PI / 2, 0, 0.9));
    g.add(m(new THREE.TorusGeometry(0.09, 0.03, 10, 24, Math.PI * 1.6), B, 1, 1, 1, 0.07, 0.05, 0.02, -Math.PI / 2, 0, -0.9 + Math.PI));
    g.add(m(new THREE.TorusGeometry(0.17, 0.035, 10, 24, Math.PI), B, 1, 1, 1, 0, 0.05, -0.0, -Math.PI / 2));
    scatter(g, 18, (x, z) => g.add(m(G.box, mat(0xffffff), 0.012, 0.012, 0.012, x * 0.17, 0.085, z * 0.12 + 0.02)));
  },
  sauerkraut: (g) => { g.add(plateMesh()); for (let i = 0; i < 18; i++) g.add(m(G.box, mat(0xeee0a0), 0.01, 0.01, 0.1, -0.08 + (rnd() - 0.5) * 0.12, 0.05 + rnd() * 0.04, (rnd() - 0.5) * 0.15, 0, rnd() * 3)); for (let i = 0; i < 2; i++) g.add(m(G.cap, mat(0x9a4a2a), 0.06, 0.2, 0.06, 0.1, 0.07, (i - 0.5) * 0.1, 0, 0.2, Math.PI / 2)); g.add(m(G.sph, mat(0xd9b100), 0.03, 0.015, 0.03, -0.12, 0.06, 0.12)); },
  lebkuchen: (g) => {
    const sh = new THREE.Shape(); sh.moveTo(0, -0.12); sh.bezierCurveTo(-0.2, 0, -0.12, 0.14, 0, 0.06); sh.bezierCurveTo(0.12, 0.14, 0.2, 0, 0, -0.12);
    g.add(m(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 }), mat(0x9a5a2a), 1.3, 1.3, 1, 0, 0.06, 0, -Math.PI / 2));
    g.add(m(new THREE.TorusGeometry(0.11, 0.008, 6, 30), mat(0xffffff), 1, 1, 1, 0, 0.12, 0, -Math.PI / 2));
    for (let i = 0; i < 3; i++) g.add(m(G.sphLo, mat([0xe53935, 0x43a047, 0xfdd835][i]), 0.02, 0.01, 0.02, (i - 1) * 0.05, 0.12, 0));
  },
  kartsalat: (g) => { g.add(bowl(null, 0xffffff, 0x2f78c8)); scatter(g, 18, (x, z, i) => g.add(m(G.box, mat(0xf3e1a6), 0.05, 0.04, 0.05, x * 0.16, 0.12 + (i % 3) * 0.02, z * 0.16, rnd(), rnd()))); scatter(g, 6, (x, z) => g.add(m(G.torThin, mat(0xf6efe0), 0.03, 0.03, 0.03, x * 0.15, 0.16, z * 0.15, Math.PI / 2))); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0x6abf4b), 0.012, 0.008, 0.012, x * 0.15, 0.17, z * 0.15))); },
  gruene: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0x7fbf4a, { roughness: 0.3 }), 0.17, 0.02, 0.17, 0, 0.04)); for (let i = 0; i < 3; i++) { const a = i * 2.1; g.add(m(G.sph, mat(0xffffff), 0.05, 0.035, 0.06, Math.cos(a) * 0.09, 0.07, Math.sin(a) * 0.09)); g.add(m(G.sphLo, mat(0xffb300), 0.025, 0.015, 0.025, Math.cos(a) * 0.09, 0.1, Math.sin(a) * 0.09)); } for (let i = 0; i < 3; i++) g.add(m(G.sph, mat(0xf3d79a), 0.05, 0.04, 0.05, -0.17 + i * 0.03, 0.06, 0.15)); },
  frankfurter: (g) => DISH.hotdog(g, 0xd9b100),
  currywurst: (g) => { g.add(m(G.box, mat(0xffffff), 0.42, 0.04, 0.24, 0, 0.02)); g.add(m(G.box, mat(0xd62f2f), 0.43, 0.02, 0.25, 0, 0.045)); for (let i = 0; i < 7; i++) g.add(m(G.cylLo, mat(0xb5432f), 0.05, 0.025, 0.05, -0.15 + i * 0.05, 0.07, (i % 2 - 0.5) * 0.04, Math.PI / 2 - 0.3, 0, 0)); g.add(m(G.sph, mat(0xd9532a, { roughness: 0.2 }), 0.18, 0.015, 0.08, 0, 0.09)); scatter(g, 12, (x, z) => g.add(m(G.sphLo, mat(0xe8a020), 0.008, 0.005, 0.008, x * 0.15, 0.1, z * 0.06))); g.add(m(G.box, mat(0xff9800), 0.01, 0.01, 0.12, 0.18, 0.1, 0, 0, 0.4)); },
  schnitzel: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0xd9a040), 0.15, 0.02, 0.11, -0.04, 0.05, -0.02, 0, 0.3)); for (let i = 0; i < 10; i++) g.add(m(G.box, mat(0xf2c14e), 0.025, 0.025, 0.14, 0.12 + (rnd() - 0.5) * 0.08, 0.06 + i * 0.006, 0.05 + (rnd() - 0.5) * 0.1, 0, rnd() * 2)); g.add(m(G.half, mat(0xfff176), 0.04, 0.02, 0.04, -0.12, 0.07, 0.1, Math.PI / 2)); },
  fischbr: (g) => { g.add(plateMesh()); g.add(m(G.cap, mat(0xe8b46a), 0.13, 0.22, 0.1, 0, 0.07, 0, 0, 0, Math.PI / 2)); g.add(m(G.box, mat(0xf6c3a8), 0.26, 0.03, 0.08, 0, 0.12)); for (let i = 0; i < 4; i++) g.add(m(G.torThin, mat(0xf3e9ff), 0.03, 0.03, 0.03, -0.09 + i * 0.06, 0.14, 0, Math.PI / 2)); g.add(m(G.sph, mat(0x6cc24a), 0.13, 0.01, 0.05, 0, 0.11, 0.04)); g.add(m(G.cap, mat(0xe8b46a), 0.12, 0.2, 0.08, 0, 0.17, -0.01, 0, 0, Math.PI / 2)); },
  strudel: (g) => { g.add(plateMesh()); g.add(m(G.cap, mat(0xe0a050), 0.13, 0.22, 0.1, 0, 0.08, 0, 0, 0.3, Math.PI / 2)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0xb9762a), 0.012, 0.11, 0.01, -0.08 + i * 0.05, 0.13, 0.05, 0, 0.3, 0)); scatter(g, 20, (x, z) => g.add(m(G.sphLo, mat(0xffffff), 0.008, 0.005, 0.008, x * 0.17, 0.15, z * 0.07))); g.add(m(G.sph, mat(0xfff8e1), 0.05, 0.03, 0.05, 0.16, 0.06, 0.1)); },
  minestrone: (g) => { g.add(bowl(0xc8552e, 0xffffff, 0x2f9e44)); scatter(g, 8, (x, z) => g.add(m(G.cylLo, mat(0xf28c28), 0.025, 0.012, 0.025, x * 0.17, 0.14, z * 0.17))); scatter(g, 8, (x, z) => g.add(m(G.torThin, mat(0xf2cf63), 0.02, 0.02, 0.02, x * 0.17, 0.14, z * 0.17, Math.PI / 2))); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.015, 0.006, 0.015, x * 0.17, 0.145, z * 0.17))); },
  bistecca: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0x7a3a20), 0.15, 0.04, 0.11, -0.04, 0.06, 0, 0, 0.2)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x3a1a0a), 0.22, 0.005, 0.012, -0.04, 0.1, -0.06 + i * 0.04, 0, 0.6)); for (let i = 0; i < 6; i++) g.add(m(G.sph, mat(i % 2 ? 0x7ccf55 : 0x5fb33f), 0.06, 0.015, 0.04, 0.15 + (rnd() - 0.5) * 0.06, 0.06, 0.1 + (rnd() - 0.5) * 0.06, 0, i)); },
  risotto: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0xf3e6c0), 0.19, 0.04, 0.19, 0, 0.05)); scatter(g, 26, (x, z) => g.add(m(G.sphLo, mat(0xfffbea), 0.012, 0.008, 0.018, x * 0.17, 0.085, z * 0.17, 0, x * 3))); scatter(g, 6, (x, z) => g.add(m(G.half, mat(0x8a5a33), 0.03, 0.012, 0.03, x * 0.14, 0.09, z * 0.14, Math.PI / 2, x * 4))); scatter(g, 10, (x, z) => g.add(m(G.box, mat(0xffd34d), 0.008, 0.005, 0.05, x * 0.12, 0.095, z * 0.12, 0, x * 5))); },
  milanese: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0xdcae55), 0.17, 0.02, 0.12, 0, 0.05)); scatter(g, 6, (x, z) => g.add(m(G.box, mat(0xe8412c), 0.04, 0.03, 0.04, 0.12 + x * 0.04, 0.08, 0.12 + z * 0.04))); g.add(m(G.half, mat(0xfff176), 0.035, 0.02, 0.035, -0.15, 0.07, 0.12, Math.PI / 2)); },
  okonomi: (g) => { g.add(plateMesh()); g.add(m(G.disc, mat(0xd9a05a), 0.2, 0.05, 0.2, 0, 0.06)); g.add(m(G.disc, mat(0x5a2a14, { roughness: 0.2 }), 0.18, 0.01, 0.18, 0, 0.09)); for (let i = 0; i < 5; i++) g.add(m(G.box, mat(0xfff8e0), 0.3, 0.006, 0.01, 0, 0.096, -0.1 + i * 0.05, 0, 0.6)); scatter(g, 14, (x, z) => g.add(m(G.box, mat(0xf2b8a0), 0.02, 0.003, 0.02, x * 0.15, 0.1, z * 0.15, 0, x * 4))); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.01, 0.005, 0.01, x * 0.15, 0.1, z * 0.15))); },
  mole: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0xffffff), 0.11, 0.04, 0.09, 0.1, 0.05, -0.04)); g.add(m(G.sph, mat(0x4a2414, { roughness: 0.2 }), 0.14, 0.02, 0.11, -0.05, 0.04, 0.03)); for (let i = 0; i < 2; i++) g.add(m(G.sph, mat(0x5a2a14), 0.08, 0.04, 0.06, -0.08 + i * 0.08, 0.07, 0.04, 0, i)); scatter(g, 12, (x, z) => g.add(m(G.sphLo, mat(0xf5ecd8), 0.008, 0.006, 0.008, -0.05 + x * 0.1, 0.1, 0.03 + z * 0.08))); },
  tlayuda: (g) => { g.add(m(G.disc, mat(0xe0b067), 0.3, 0.02, 0.3, 0, 0.01)); g.add(m(G.disc, mat(0x6b3a20), 0.26, 0.01, 0.26, 0, 0.025)); scatter(g, 14, (x, z) => g.add(m(G.box, mat(0xfff3c9), 0.06, 0.01, 0.012, x * 0.22, 0.035, z * 0.22, 0, x * 4))); scatter(g, 10, (x, z) => g.add(m(G.box, mat(0xe8412c), 0.04, 0.025, 0.04, x * 0.2, 0.04, z * 0.2))); scatter(g, 6, (x, z) => g.add(m(G.sph, mat(0x6cc24a), 0.05, 0.01, 0.03, x * 0.2, 0.045, z * 0.2, 0, x * 3))); },
  quesadilla: (g) => { g.add(plateMesh()); for (let i = 0; i < 3; i++) { const a = i * 2.1; const q = m(G.half, mat(0xd9a05a), 0.14, 0.03, 0.14, Math.cos(a) * 0.08, 0.06 + i * 0.01, Math.sin(a) * 0.08, 0, a); g.add(q); g.add(m(G.box, mat(0xffd34d), 0.12, 0.012, 0.01, Math.cos(a) * 0.08, 0.06 + i * 0.01, Math.sin(a) * 0.08, 0, a + Math.PI / 2)); } },
  nachos: (g) => { g.add(plateMesh()); for (let i = 0; i < 14; i++) g.add(m(G.tri, mat(0xf0c060), 0.07, 0.01, 0.07, (rnd() - 0.5) * 0.3, 0.05 + rnd() * 0.06, (rnd() - 0.5) * 0.3, rnd() * 0.6, rnd() * 3, rnd() * 0.6)); g.add(m(G.sph, mat(0xffc93c, { roughness: 0.2 }), 0.16, 0.03, 0.14, 0, 0.1)); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x8a3a2a), 0.02, 0.014, 0.028, x * 0.13, 0.12, z * 0.13))); g.add(m(G.cylLo, mat(0x2e7d32), 0.02, 0.01, 0.02, 0.04, 0.13, 0.03)); },
  jambalaya: (g) => { g.add(bowl(null, 0x3a2a1e, 0x8a5a2b)); g.add(m(G.sph, mat(0xe0a05a), 0.22, 0.05, 0.22, 0, 0.12)); scatter(g, 8, (x, z) => g.add(m(G.cylLo, mat(0xb5432f), 0.03, 0.015, 0.03, x * 0.16, 0.16, z * 0.16))); scatter(g, 8, (x, z) => g.add(m(G.box, mat(0xe8412c), 0.03, 0.02, 0.03, x * 0.16, 0.165, z * 0.16))); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.006, 0.012, x * 0.16, 0.17, z * 0.16))); },
  chili: (g) => { g.add(bowl(0x9a2a1a, 0xffffff, 0xcc3344)); scatter(g, 14, (x, z) => g.add(m(G.sphLo, mat(0x5a1a10), 0.022, 0.014, 0.03, x * 0.18, 0.14, z * 0.18, 0, x * 3))); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x7a3a20), 0.025, 0.02, 0.025, x * 0.18, 0.14, z * 0.18))); g.add(m(G.sph, mat(0xffffff), 0.05, 0.02, 0.05, 0.03, 0.15, 0.02)); g.add(m(G.cone, mat(0xd62f2f), 0.025, 0.12, 0.025, 0.14, 0.17, -0.1, 0, 0, Math.PI / 2.4)); },
  steakcorn: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0x7a3a20), 0.14, 0.04, 0.1, -0.06, 0.06, 0, 0, 0.3)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x3a1a0a), 0.2, 0.005, 0.012, -0.06, 0.1, -0.05 + i * 0.035, 0, 0.7)); g.add(m(G.cap, mat(0xf5cf3a), 0.07, 0.18, 0.07, 0.12, 0.07, 0.06, 0, 0.4, Math.PI / 2)); g.add(m(G.box, mat(0xfff59d), 0.04, 0.01, 0.04, 0.12, 0.11, 0.06)); },

  // Індія
  butterchk: (g) => { g.add(bowl(0xe0782a, 0xffffff, 0xff9933)); scatter(g, 7, (x, z) => g.add(m(G.box, mat(0xd9884a), 0.05, 0.04, 0.05, x * 0.13 - 0.03, 0.14, z * 0.13, 0.3, x * 3))); g.add(m(G.sph, mat(0xffffff), 0.1, 0.035, 0.08, 0.1, 0.14, -0.06)); scatter(g, 12, (x, z) => g.add(m(G.sphLo, mat(0xffffff), 0.012, 0.009, 0.02, 0.1 + x * 0.06, 0.17, -0.06 + z * 0.05))); g.add(m(G.sph, mat(0xfff8e1), 0.04, 0.012, 0.04, -0.06, 0.155, 0.04)); g.add(m(G.sphLo, mat(0x3aa346), 0.03, 0.006, 0.02, -0.02, 0.16, -0.02)); },
  naan: (g) => { g.add(plateMesh()); for (let i = 0; i < 2; i++) { g.add(m(G.sph, mat(0xe9c27a), 0.22, 0.025, 0.14, (i - 0.5) * 0.06, 0.05 + i * 0.03, (i - 0.5) * 0.04, 0, 0.4 * i)); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0x8a5a1a), 0.025, 0.01, 0.02, x * 0.15, 0.08 + i * 0.03, z * 0.09))); } scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.006, 0.012, x * 0.16, 0.12, z * 0.1))); scatter(g, 6, (x, z) => g.add(m(G.sphLo, mat(0xfaf3df), 0.012, 0.01, 0.012, x * 0.14, 0.12, z * 0.09))); },
  samosa: (g) => { g.add(plateMesh()); for (let i = 0; i < 3; i++) { const a = i * 2.1; const t = m(G.cone, mat(0xd99a3a), 0.11, 0.07, 0.11, Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1); t.geometry = new THREE.ConeGeometry(1, 1, 3); t.rotation.y = a; g.add(t); } g.add(m(G.sph, mat(0x3a8a3a), 0.05, 0.02, 0.05, 0, 0.05, 0)); },
  chana: (g) => { g.add(bowl(0xc0592a, 0xffffff, 0x138808)); scatter(g, 18, (x, z) => g.add(m(G.sphLo, mat(0xe0b56a), 0.022, 0.02, 0.022, x * 0.18, 0.14, z * 0.18))); scatter(g, 6, (x, z) => g.add(m(G.torThin, mat(0xf6efe0), 0.025, 0.025, 0.025, x * 0.15, 0.15, z * 0.15, Math.PI / 2))); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.005, 0.012, x * 0.18, 0.155, z * 0.18))); },
  palak: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0x2f6d2a), 0.16, 0.05, 0.14, -0.06, 0.06, 0)); scatter(g, 6, (x, z) => g.add(m(G.box, mat(0xf2d9a0), 0.045, 0.04, 0.045, -0.06 + x * 0.1, 0.11, z * 0.09, 0.2, x * 3))); g.add(m(G.sph, mat(0xffffff), 0.11, 0.06, 0.09, 0.14, 0.06, 0.02)); scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0xffffff), 0.012, 0.009, 0.02, 0.14 + x * 0.07, 0.11, 0.02 + z * 0.06))); },
  dal: (g) => { g.add(plateMesh()); const b = bowl(0xe5a03a, 0xffffff, 0xff9933); b.scale.setScalar(0.65); b.position.set(-0.08, 0.02, 0); g.add(b); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0xd9682a), 0.015, 0.008, 0.015, -0.08 + x * 0.1, 0.12, z * 0.1))); g.add(m(G.sph, mat(0xe9c27a), 0.12, 0.02, 0.09, 0.15, 0.05, 0.05, 0, 0.6)); scatter(g, 4, (x, z) => g.add(m(G.sphLo, mat(0x8a5a1a), 0.02, 0.008, 0.015, 0.15 + x * 0.07, 0.07, 0.05 + z * 0.05))); },
  biryani: (g) => { g.add(plateMesh()); g.add(m(G.hemi, mat(0xf2c14e), 0.22, 0.11, 0.2, 0, 0.03)); scatter(g, 30, (x, z) => g.add(m(G.sphLo, mat(rnd() < 0.5 ? 0xffffff : 0xf2a02e), 0.012, 0.009, 0.02, x * 0.17, 0.05 + (1 - Math.hypot(x, z)) * 0.08, z * 0.16))); scatter(g, 5, (x, z) => g.add(m(G.box, mat(0xb8682a), 0.05, 0.035, 0.045, x * 0.13, 0.12, z * 0.12, 0.3, x * 3))); g.add(m(G.sph, mat(0xffffff), 0.05, 0.035, 0.04, 0.06, 0.15, 0.04)); g.add(m(G.sphLo, mat(0xffa000), 0.028, 0.015, 0.024, 0.06, 0.17, 0.04)); scatter(g, 5, (x, z) => g.add(m(G.torThin, mat(0xa0582a), 0.025, 0.025, 0.025, x * 0.14, 0.13, z * 0.14, Math.PI / 2))); },
  fishcurry: (g) => { g.add(bowl(0xf0a640, 0xffffff, 0x138808)); for (let i = 0; i < 3; i++) g.add(m(G.box, mat(0xf6e3cf), 0.08, 0.04, 0.05, -0.06 + i * 0.07, 0.14, (i % 2 - 0.5) * 0.08, 0, i)); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.005, 0.012, x * 0.18, 0.15, z * 0.18))); g.add(m(G.half, mat(0xc5e86c), 0.04, 0.015, 0.04, 0.13, 0.15, -0.08, Math.PI / 2)); },
  // Франція
  nicoise: (g) => { DISH.salad(g); for (let i = 0; i < 2; i++) { g.add(m(G.sph, mat(0xffffff), 0.045, 0.03, 0.035, -0.06 + i * 0.12, 0.18, 0.06)); g.add(m(G.sphLo, mat(0xffa000), 0.024, 0.012, 0.02, -0.06 + i * 0.12, 0.2, 0.06)); } g.add(m(G.box, mat(0xb0703a), 0.12, 0.03, 0.06, 0, 0.19, -0.05, 0, 0.3)); scatter(g, 4, (x, z) => g.add(m(G.sphLo, mat(0x2a2a2a), 0.02, 0.018, 0.02, x * 0.15, 0.19, z * 0.15))); },
  ratatouille: (g) => { const b = new THREE.Group(); b.add(m(G.cyl, mat(0xc0603a), 0.3, 0.06, 0.3, 0, 0.03)); b.add(m(G.cyl, mat(0xb83a2a), 0.27, 0.01, 0.27, 0, 0.065)); g.add(b); const cols = [0x5b2a6e, 0x4f8a2e, 0xe8412c]; for (let r = 0; r < 2; r++) { const n = r ? 7 : 13, R = r ? 0.09 : 0.2; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const p = new THREE.Group(); p.add(m(G.cylLo, mat(cols[i % 3]), 0.045, 0.012, 0.045)); p.add(m(G.cylLo, mat(C(cols[i % 3], 0xf6e3b8, 0.6)), 0.036, 0.014, 0.036)); p.position.set(Math.cos(a) * R, 0.09, Math.sin(a) * R); p.rotation.set(0.9, -a + Math.PI / 2, 0); g.add(p); } } g.add(m(G.sphLo, mat(0x3aa346), 0.03, 0.008, 0.02, 0, 0.1, 0)); },
  bouill: (g) => { g.add(bowl(0xd9682a, 0xffffff, 0x0055a4)); for (let i = 0; i < 3; i++) g.add(m(G.box, mat(0xf6e3cf), 0.07, 0.035, 0.05, -0.07 + i * 0.07, 0.14, (i - 1) * 0.05, 0, i)); scatter(g, 6, (x, z) => g.add(m(G.cylLo, mat(0xf28c28), 0.025, 0.01, 0.025, x * 0.17, 0.145, z * 0.17))); g.add(m(G.sph, mat(0xd9a05a), 0.06, 0.015, 0.06, 0.12, 0.15, 0.08)); g.add(m(G.sph, mat(0xffb36b), 0.04, 0.01, 0.04, 0.12, 0.162, 0.08)); },
  onionsoup: (g) => { const b = bowl(0x9a5a2a, 0xf4f1e8, 0x8a5a3a); g.add(b); g.add(m(G.sph, mat(0xd9a05a), 0.2, 0.05, 0.2, 0, 0.15)); scatter(g, 10, (x, z) => g.add(m(G.sph, mat(0xf2c14e), 0.05, 0.015, 0.05, x * 0.15, 0.185, z * 0.15))); scatter(g, 5, (x, z) => g.add(m(G.sphLo, mat(0x9a5a1a), 0.025, 0.008, 0.025, x * 0.15, 0.19, z * 0.15))); },
  steakfr: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0x7a3a20), 0.14, 0.04, 0.1, -0.07, 0.06, 0, 0, 0.3)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x3a1a0a), 0.2, 0.005, 0.012, -0.07, 0.1, -0.05 + i * 0.035, 0, 0.7)); for (let i = 0; i < 9; i++) g.add(m(G.box, mat(0xf2c14e), 0.025, 0.025, 0.16, 0.13 + (rnd() - 0.5) * 0.08, 0.04 + (i % 3) * 0.022, (rnd() - 0.5) * 0.12, 0, rnd() * 3)); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.012, 0.006, 0.012, -0.07 + x * 0.08, 0.11, z * 0.06))); },
  quiche: (g) => { g.add(m(G.cyl, mat(0xd9a05a), 0.27, 0.07, 0.27, 0, 0.035)); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.add(m(G.sphLo, mat(0xc98a4a), 0.035, 0.03, 0.035, Math.cos(a) * 0.26, 0.075, Math.sin(a) * 0.26)); } g.add(m(G.cyl, mat(0xf6d66a), 0.24, 0.02, 0.24, 0, 0.07)); scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0xd9902f), 0.03, 0.006, 0.03, x * 0.2, 0.082, z * 0.2))); scatter(g, 6, (x, z) => g.add(m(G.half, mat(0x8a5a33), 0.03, 0.012, 0.03, x * 0.18, 0.085, z * 0.18, Math.PI / 2, x * 4))); },
  crepe: (g) => { g.add(plateMesh()); for (let i = 0; i < 2; i++) g.add(m(G.cap, mat(0xe9c27a), 0.12, 0.3, 0.08, 0, 0.06 + i * 0.03, (i - 0.5) * 0.11, 0, 0.2, Math.PI / 2)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x5a3320), 0.3, 0.008, 0.015, 0, 0.12, -0.08 + i * 0.05, 0, 0.5, 0)); scatter(g, 5, (x, z) => g.add(m(G.half, mat(0xfbefc9), 0.03, 0.012, 0.03, x * 0.2, 0.06, z * 0.2 + 0.1, Math.PI / 2, x * 4))); },
  flammek: (g) => { g.add(m(G.box, mat(0x6b4426), 0.56, 0.03, 0.4, 0, 0.015)); g.add(m(G.box, mat(0xe9c27a), 0.5, 0.025, 0.34, 0, 0.04)); g.add(m(G.box, mat(0xfff8e8), 0.46, 0.008, 0.3, 0, 0.055)); scatter(g, 10, (x, z) => g.add(m(G.torThin, mat(0xc98a4a), 0.03, 0.03, 0.03, x * 0.2, 0.065, z * 0.13, Math.PI / 2))); scatter(g, 10, (x, z) => g.add(m(G.box, mat(0xf2c14e), 0.04, 0.01, 0.02, x * 0.2, 0.065, z * 0.13, 0, x * 3, 0))); },
  coqvin: (g) => { g.add(bowl(0x6a2a2a, 0xf4f1e8, 0x0055a4)); for (let i = 0; i < 2; i++) g.add(m(G.sph, mat(0xb8682a), 0.08, 0.05, 0.06, -0.05 + i * 0.1, 0.15, (i - 0.5) * 0.06)); scatter(g, 5, (x, z) => g.add(m(G.half, mat(0x8a5a33), 0.03, 0.012, 0.03, x * 0.15, 0.15, z * 0.15, Math.PI / 2, x * 4))); scatter(g, 5, (x, z) => g.add(m(G.cylLo, mat(0xf28c28), 0.025, 0.01, 0.025, x * 0.16, 0.15, z * 0.16))); g.add(m(G.sphLo, mat(0x3aa346), 0.03, 0.006, 0.02, 0, 0.17, 0.08)); },

  // Грузія
  khachapuri: (g) => { const boat = new THREE.Group(); boat.add(m(G.sph, mat(0xd9a05a), 0.34, 0.07, 0.16, 0, 0.06)); for (const s of [-1, 1]) boat.add(m(G.cone, mat(0xc98a4a), 0.07, 0.16, 0.07, s * 0.34, 0.08, 0, 0, 0, -s * Math.PI / 2)); boat.add(m(G.sph, mat(0xfff0b0), 0.22, 0.05, 0.1, 0, 0.1)); boat.add(m(G.sph, mat(0xffffff), 0.07, 0.03, 0.06, 0, 0.14)); boat.add(m(G.sph, mat(0xffa000), 0.045, 0.035, 0.045, 0, 0.16)); boat.add(m(G.box, mat(0xfff8e1), 0.06, 0.03, 0.04, 0.12, 0.15, 0)); g.add(m(G.box, mat(0x8a5a3a), 0.6, 0.03, 0.36, 0, 0.015)); boat.position.y = 0.02; g.add(boat); },
  khinkali: (g) => { g.add(plateMesh()); for (let i = 0; i < 5; i++) { const a = i * 1.26, x = Math.cos(a) * 0.14, z = Math.sin(a) * 0.14; g.add(m(G.sph, mat(0xf3e6c8), 0.08, 0.07, 0.08, x, 0.07, z)); g.add(m(G.cone, mat(0xf3e6c8), 0.04, 0.06, 0.04, x, 0.15, z)); for (let k = 0; k < 6; k++) g.add(m(G.box, mat(0xe2d2a8), 0.004, 0.06, 0.02, x + Math.cos(k) * 0.05, 0.11, z + Math.sin(k) * 0.05, 0, k, 0.3)); } scatter(g, 12, (x, z) => g.add(m(G.sphLo, mat(0x3a2a2a), 0.008, 0.008, 0.008, x * 0.2, 0.04, z * 0.2))); },
  lobio: (g) => { const b = bowl(0x7a2a1a, 0xc0603a, 0x8a3a1a); g.add(b); scatter(g, 18, (x, z) => g.add(m(G.sphLo, mat(0x8a3a2a), 0.022, 0.016, 0.03, x * 0.18, 0.14, z * 0.18, 0, x * 3))); scatter(g, 8, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.014, 0.005, 0.014, x * 0.18, 0.15, z * 0.18))); scatter(g, 4, (x, z) => g.add(m(G.torThin, mat(0xf6efe0), 0.025, 0.025, 0.025, x * 0.14, 0.15, z * 0.14, Math.PI / 2))); },
  mtsvadi: (g) => { g.add(plateMesh()); for (let k = 0; k < 2; k++) { const z = (k - 0.5) * 0.12; g.add(m(G.cylLo, mat(0xc0c0c0, { metalness: 0.7 }), 0.008, 0.5, 0.008, 0, 0.07, z, 0, 0, Math.PI / 2)); for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0x7a3a20), 0.07, 0.06, 0.06, -0.15 + i * 0.1, 0.07, z, 0.3, i)); } scatter(g, 6, (x, z) => g.add(m(G.torThin, mat(0xf6efe0), 0.03, 0.03, 0.03, x * 0.2, 0.05, z * 0.2 + 0.03, Math.PI / 2))); g.add(m(G.half, mat(0xe8412c), 0.05, 0.02, 0.05, 0.18, 0.05, 0.12, Math.PI / 2)); },
  chakhokh: (g) => { g.add(bowl(0xc8432a, 0xffffff, 0xe8112d)); for (let i = 0; i < 2; i++) g.add(m(G.sph, mat(0xd9884a), 0.08, 0.05, 0.06, -0.05 + i * 0.1, 0.15, (i - 0.5) * 0.06)); scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0x3aa346), 0.014, 0.005, 0.014, x * 0.18, 0.155, z * 0.18))); },
  pkhali: (g) => { g.add(plateMesh()); for (let i = 0; i < 5; i++) { const a = i * 1.26; g.add(m(G.sph, mat(0x3f7a32), 0.06, 0.045, 0.06, Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14)); for (let k = 0; k < 3; k++) g.add(m(G.sphLo, mat(0xc0304a), 0.01, 0.01, 0.01, Math.cos(a) * 0.14 + (k - 1) * 0.015, 0.1, Math.sin(a) * 0.14)); } g.add(m(G.sph, mat(0x3f7a32), 0.06, 0.045, 0.06, 0, 0.06, 0)); },
  // Китай
  jiaozi: (g) => { const b = new THREE.Group(); b.add(m(G.cyl, mat(0xd9b07a), 0.3, 0.1, 0.3, 0, 0.05)); for (let i = 0; i < 8; i++) b.add(m(G.box, mat(0xb8905a), 0.6, 0.004, 0.01, 0, 0.1, -0.24 + i * 0.07)); g.add(b); for (let i = 0; i < 6; i++) { const a = i * 1.05, x = Math.cos(a) * 0.15, z = Math.sin(a) * 0.15; g.add(m(G.half, mat(0xf6efe0), 0.08, 0.04, 0.06, x, 0.13, z, Math.PI / 2, -a + Math.PI / 2)); } g.add(m(G.cyl, mat(0x2a1a14), 0.06, 0.02, 0.06, 0, 0.12, 0)); },
  friedrice: (g) => { const b = bowl(null, 0xffffff, 0xde2910); g.add(b); g.add(m(G.hemi, mat(0xf2d27a), 0.2, 0.09, 0.2, 0, 0.11)); scatter(g, 26, (x, z) => g.add(m(G.sphLo, mat(rnd() < 0.6 ? 0xfff3c0 : 0xffffff), 0.012, 0.009, 0.02, x * 0.17, 0.12 + (1 - Math.hypot(x, z)) * 0.07, z * 0.17))); scatter(g, 8, (x, z) => g.add(m(G.box, mat(0xffd23f), 0.03, 0.015, 0.03, x * 0.14, 0.19, z * 0.14))); scatter(g, 8, (x, z) => g.add(m(G.cylLo, mat(0x6abf4b), 0.012, 0.006, 0.012, x * 0.15, 0.2, z * 0.15))); },
  springroll: (g) => { g.add(plateMesh()); for (let i = 0; i < 3; i++) { const z = (i - 1) * 0.1; g.add(m(G.cap, mat(0xd99a3a), 0.08, 0.28, 0.08, 0, 0.06 + (i === 1 ? 0.05 : 0), z, 0, 0.2 * (i - 1), Math.PI / 2)); } g.add(m(G.cyl, mat(0xffffff), 0.05, 0.03, 0.05, 0.2, 0.04, 0.12)); g.add(m(G.cyl, mat(0xd63a2a), 0.04, 0.032, 0.04, 0.2, 0.045, 0.12)); },
  kungpao: (g) => { g.add(plateMesh()); g.add(m(G.sph, mat(0xffffff), 0.11, 0.06, 0.1, 0.13, 0.06, 0)); scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0xffffff), 0.012, 0.009, 0.02, 0.13 + x * 0.08, 0.11, z * 0.08))); scatter(g, 7, (x, z) => g.add(m(G.box, mat(0xb8682a), 0.045, 0.04, 0.045, -0.07 + x * 0.12, 0.07, z * 0.12, 0.3, x * 3))); scatter(g, 6, (x, z) => g.add(m(G.box, mat(0xd63a2a), 0.04, 0.012, 0.04, -0.07 + x * 0.12, 0.1, z * 0.12, 0, x * 3, 0))); scatter(g, 5, (x, z) => g.add(m(G.sphLo, mat(0xd9a05a), 0.018, 0.014, 0.02, -0.07 + x * 0.12, 0.1, z * 0.12))); },
  mapo: (g) => { g.add(bowl(0xc0301a, 0xffffff, 0x1a1a1a)); scatter(g, 9, (x, z) => g.add(m(G.box, mat(0xfff3e0), 0.05, 0.04, 0.05, x * 0.16, 0.14, z * 0.16, 0, x * 2))); scatter(g, 10, (x, z) => g.add(m(G.sphLo, mat(0x7a3a20), 0.014, 0.01, 0.014, x * 0.17, 0.15, z * 0.17))); scatter(g, 6, (x, z) => g.add(m(G.cylLo, mat(0x6abf4b), 0.012, 0.006, 0.012, x * 0.17, 0.155, z * 0.17))); },
  lomein: (g) => { g.add(bowl(0xb87a3a, 0xffffff, 0xde2910)); for (let i = 0; i < 7; i++) g.add(m(G.torThin, mat(0xe8c27a), 0.05 + rnd() * 0.04, 0.05 + rnd() * 0.04, 0.05, (rnd() - 0.5) * 0.15, 0.135, (rnd() - 0.5) * 0.15, Math.PI / 2, 0, rnd() * 3)); scatter(g, 6, (x, z) => g.add(m(G.box, mat(0xd63a2a), 0.05, 0.012, 0.015, x * 0.15, 0.15, z * 0.15, 0, x * 3, 0))); scatter(g, 6, (x, z) => g.add(m(G.cylLo, mat(0xf28c28), 0.022, 0.01, 0.022, x * 0.16, 0.15, z * 0.16))); g.add(m(G.cylLo, mat(0x6b4226), 0.008, 0.4, 0.008, 0.1, 0.25, -0.05, 0.4, 0, 0.6)); g.add(m(G.cylLo, mat(0x6b4226), 0.008, 0.4, 0.008, 0.13, 0.25, -0.03, 0.4, 0, 0.7)); },
};

/* ================= напої ================= */
const DRINK = {
  kompot: { glass: true, col: 0xb0304a, ice: true, fruit: 0xc2185b },
  uzvar: { col: 0xa8692b },
  spezi: { glass: true, col: 0x5a2a14, straw: 0xffc107, fruit: 0xff9a1a },
  schorle: { glass: true, col: 0xe8d65a, bubbles: true },
  espresso: { small: true, col: 0x3a2214, crema: 0xc98a4a },
  cappuccino: { col: 0x6b4426, foam: true },
  matcha: { col: 0x8bc34a, foam: true, leaf: true },
  icetea: { glass: true, col: 0xc8862a, ice: true, fruit: 0xfff176, straw: 0x8bc34a },
  horchata: { glass: true, col: 0xf0e6d0, ice: true, cinnamon: true },
  limonada: { glass: true, col: 0xfff27a, ice: true, fruit: 0xa5d63a, straw: 0x43a047 },
  colaice: { glass: true, col: 0x3a1f14, ice: true, straw: 0xe53935 },
  caramellatte: { glass: true, col: 0xc8a27a, caramel: true, foam: true },
  icedlatte: { glass: true, col: 0xb98a5a, ice: true, straw: 0x6d4c41 },
  lassi: { glass: true, col: 0xffc04a, straw: 0xff9933, fruit: 0xffb02e },
  masala: { col: 0xc8955a, foam: true },
  chocchaud: { col: 0x5a3320, foam: true },
  lagidze: { glass: true, col: 0x6fd64a, bubbles: true, straw: 0xffffff },
  grapeice: { glass: true, col: 0x6a2a6e, ice: true, fruit: 0x9b59d0 },
  bubble: { glass: true, col: 0xd9b38a, straw: 0xde2910, pearls: true },
  cntea: { small: true, col: 0x9ab84a, leaf: true },
  citron: { glass: true, col: 0xfff59d, ice: true, bubbles: true, fruit: 0xfff176, straw: 0x0055a4 },
};
function drinkMesh(rid) {
  const D = DRINK[rid] || { col: 0x888888 }, g = new THREE.Group();
  if (D.glass) {
    g.add(m(G.cyl, mat(0xeaf6fb, { transparent: true, opacity: 0.35, roughness: 0.05 }), 0.12, 0.32, 0.12, 0, 0.16));
    g.add(m(G.cyl, mat(D.col, { roughness: 0.15, transparent: true, opacity: 0.92 }), 0.105, 0.26, 0.105, 0, 0.14));
    if (D.ice) for (let i = 0; i < 4; i++) g.add(m(G.box, mat(0xeefbff, { transparent: true, opacity: 0.8 }), 0.06, 0.06, 0.06, (i % 2 - 0.5) * 0.07, 0.26 + (i > 1 ? 0.02 : 0), (i > 1 ? 0.03 : -0.03), 0.4 * i, 0.6 * i, 0));
    if (D.straw) g.add(m(G.cylLo, mat(D.straw), 0.012, 0.4, 0.012, 0.04, 0.3, 0, 0, 0, -0.2));
    if (D.fruit) { g.add(m(G.half, mat(D.fruit), 0.06, 0.015, 0.06, -0.1, 0.32, 0, Math.PI / 2, 0, 0.3)); }
    if (D.bubbles) for (let i = 0; i < 8; i++) g.add(m(G.sphLo, mat(0xffffff, { transparent: true, opacity: 0.7 }), 0.008, 0.008, 0.008, (rnd() - 0.5) * 0.15, 0.06 + rnd() * 0.2, (rnd() - 0.5) * 0.15));
    if (D.pearls) for (let i = 0; i < 14; i++) g.add(m(G.sphLo, mat(0x2a1a14, { roughness: 0.3 }), 0.022, 0.022, 0.022, (rnd() - 0.5) * 0.14, 0.04 + rnd() * 0.04, (rnd() - 0.5) * 0.14));
    if (D.cinnamon) g.add(m(G.cylLo, mat(0x8a5a2b), 0.012, 0.3, 0.012, -0.03, 0.3, 0.02, 0, 0, 0.25));
    if (D.caramel) { g.add(m(G.sph, mat(0xfff8e1), 0.1, 0.05, 0.1, 0, 0.29)); for (let i = 0; i < 3; i++) g.add(m(G.box, mat(0xc98a2a), 0.15, 0.01, 0.012, 0, 0.33, -0.04 + i * 0.04, 0, 0.5, 0)); }
    return g;
  }
  const s = D.small ? 0.7 : 1;
  const cup = new THREE.Group(); cup.scale.setScalar(s);
  cup.add(m(G.disc, mat(0xffffff, { roughness: 0.3 }), 0.2, 0.015, 0.2, 0, 0.008));
  cup.add(m(MUG, mat(0xffffff, { roughness: 0.25, side: THREE.DoubleSide }), 1, 0.9, 1, 0, 0.015));
  cup.add(m(G.torThin, mat(0xffffff), 0.07, 0.07, 0.07, 0.15, 0.13, 0, 0, 0, Math.PI / 2));
  cup.add(m(G.disc, mat(D.col, { roughness: 0.15 }), 0.115, 0.01, 0.115, 0, 0.22));
  if (D.crema) cup.add(m(G.disc, mat(D.crema), 0.1, 0.012, 0.1, 0, 0.222));
  if (D.foam) { cup.add(m(G.sph, mat(D.leaf ? 0xd7ecc0 : 0xfff8e8), 0.11, 0.03, 0.11, 0, 0.225)); cup.add(m(G.sph, mat(D.leaf ? 0x689f38 : 0x8a5a33), 0.05, 0.004, 0.03, 0, 0.255, 0, 0, 0.5)); }
  g.add(cup); return g;
}

/* ================= посуд з вмістом ================= */
function fullRecipe(cont) {
  const ks = cont.c.map(i => i.id + ':' + i.s).sort().join('|');
  for (const r in RECIPES) if (!!RECIPES[r].drink === (cont.t === 'c') && [...RECIPES[r].c].sort().join('|') === ks) return r;
  return null;
}
export function dishMesh(rid) {
  seed = rid.length * 13 + rid.charCodeAt(0);
  if (RECIPES[rid] && RECIPES[rid].drink) return drinkMesh(rid);
  const g = new THREE.Group();
  if (DISH[rid]) DISH[rid](g); else { g.add(plateMesh()); RECIPES[rid].c.forEach((k, i) => { const [id, s] = k.split(':'); const p = makeIngMesh(id, s); p.position.set(Math.cos(i * 2) * 0.1, 0.05, Math.sin(i * 2) * 0.1); p.scale.setScalar(0.8); g.add(p); }); }
  return g;
}
function emptyCup() {
  const g = new THREE.Group();
  g.add(m(MUG, mat(0xffffff, { roughness: 0.25, side: THREE.DoubleSide })));
  g.add(m(G.torThin, mat(0xffffff), 0.075, 0.075, 0.075, 0.15, 0.14, 0, 0, 0, Math.PI / 2));
  return g;
}
export function cookerMesh(ck) {
  const g = new THREE.Group();
  if (ck.k === 'pot') {
    const P = mat(0x9aa6b3, { metalness: 0.55, roughness: 0.3 });
    g.add(m(new THREE.CylinderGeometry(1, 1, 1, 24, 1, true), mat(0x9aa6b3, { metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide }), 0.27, 0.28, 0.27, 0, 0.14));
    g.add(m(G.disc, P, 0.27, 0.01, 0.27, 0, 0.005));
    g.add(m(G.torThin, P, 0.27, 0.27, 0.27, 0, 0.28, 0, Math.PI / 2));
    for (const s of [1, -1]) g.add(m(G.torThin, mat(0x2b2b2b), 0.06, 0.06, 0.06, s * 0.3, 0.22, 0, 0, 0, 0));
    if (ck.c.length) {
      const st = cookerState(ck);
      const cols = ck.c.map(i => new THREE.Color(ING[i.id].col));
      const avg = cols.reduce((a, c) => a.add(c), new THREE.Color(0, 0, 0)).multiplyScalar(1 / cols.length);
      if (st === 'burnt') avg.set(0x2a2522); else if (st === 'cooking') avg.lerp(new THREE.Color(0xffffff), 0.25);
      const lvl = 0.08 + 0.06 * ck.c.length;
      const soup = m(G.disc, mat(avg.getHex(), { roughness: 0.2 }), 0.25, 0.02, 0.25, 0, lvl); soup.name = 'soup'; g.add(soup);
      ck.c.forEach((c, i) => { const p = makeIngMesh(c.id, c.s === 'x' ? 'x' : 'c'); p.scale.setScalar(0.6); p.position.set(Math.cos(i * 2.1) * 0.1, lvl - 0.02, Math.sin(i * 2.1) * 0.1); g.add(p); });
    }
  } else if (ck.k === 'pan') {
    g.add(m(G.disc, mat(0x2d2d30, { metalness: 0.4, roughness: 0.4 }), 0.3, 0.04, 0.3, 0, 0.03));
    g.add(m(G.torThin, mat(0x3a3a3e, { metalness: 0.4 }), 0.29, 0.29, 0.5, 0, 0.06, 0, Math.PI / 2));
    g.add(m(G.box, mat(0x6b4226), 0.32, 0.04, 0.06, 0.45, 0.06, 0));
    if (ck.c.length) { const p = makeIngMesh(ck.c[0].id, ck.c[0].s); p.position.y = 0.05; g.add(p); }
  }
  return g;
}
export function makeItemMesh(it) {
  if (!it) return null;
  if (it.t === 'i') return makeIngMesh(it.id, it.s);
  if (it.t === 'p') {
    const full = it.c.length && fullRecipe(it);
    if (full) return dishMesh(full);
    const g = plateMesh();
    it.c.forEach((c, i) => {
      const p = makeIngMesh(c.id, c.s); const a = i / Math.max(1, it.c.length) * Math.PI * 2;
      const r = it.c.length > 1 ? 0.11 : 0;
      p.position.set(Math.cos(a) * r, 0.04 + i * 0.01, Math.sin(a) * r); p.scale.setScalar(0.75); g.add(p);
    });
    return g;
  }
  if (it.t === 'c') {
    const full = it.c.length && fullRecipe(it);
    if (full) return dishMesh(full);
    const g = emptyCup();
    const liq = it.c.filter(c => c.s === 'l');
    if (liq.length) {
      const col = liq.reduce((a, c) => a.add(new THREE.Color(ING[c.id].col)), new THREE.Color(0, 0, 0)).multiplyScalar(1 / liq.length);
      g.add(m(G.disc, mat(col.getHex(), { roughness: 0.15 }), 0.115, 0.01, 0.115, 0, 0.08 + 0.09 * liq.length));
    }
    for (const c of it.c) if (c.s !== 'l') { const p = makeIngMesh(c.id, 'r'); p.scale.setScalar(0.5); p.position.y = 0.26; g.add(p); }
    return g;
  }
  if (it.t === 'd') { const g = new THREE.Group(); for (let i = 0; i < Math.min(it.n, 6); i++) { const p = plateMesh(true); p.position.y = i * 0.05; g.add(p); } return g; }
  if (it.t === 'k') return cookerMesh(it);
  if (it.t === 'x') {
    const g = new THREE.Group();
    g.add(m(G.cyl, mat(0xd62f2f, { roughness: 0.3 }), 0.1, 0.42, 0.1, 0, 0.21));
    g.add(m(G.hemi, mat(0xd62f2f, { roughness: 0.3 }), 0.1, 0.05, 0.1, 0, 0.42));
    g.add(m(G.cylLo, mat(0x222222), 0.035, 0.08, 0.035, 0, 0.48));
    g.add(m(G.box, mat(0x222222), 0.16, 0.03, 0.03, 0.08, 0.52));
    g.add(m(G.cylLo, mat(0x222222), 0.015, 0.2, 0.015, -0.08, 0.42, 0, 0, 0, 0.6));
    g.add(m(G.box, mat(0xffffff), 0.12, 0.1, 0.005, 0, 0.25, 0.1));
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
