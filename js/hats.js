// Кухарчата — головні убори кухарчат (власні 3D-моделі)
import * as THREE from 'three';

export const HATS = [
  'Ковпак', 'Бандана', 'Кепка', 'Корона', 'Ведмежі вушка', 'Ковпак із квіткою', 'Віночок', 'Берет', 'Сомбреро', 'Ковбойський капелюх',
  'Шолом вікінга', 'Вушка зайчика', 'Капелюх чарівника', 'Кепка з пропелером', 'Тірольський капелюх', 'Циліндр', 'Піратський капелюх', 'Шапка з помпоном', 'Навушники', 'Пов’язка хачімакі', 'Тюрбан', 'Конічний капелюх', 'Папаха',
];
const MC = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o })); return MC.get(k); };
const G = {
  sph: new THREE.SphereGeometry(1, 18, 12), cyl: new THREE.CylinderGeometry(1, 1, 1, 24), cone: new THREE.ConeGeometry(1, 1, 18),
  tor: new THREE.TorusGeometry(1, 0.18, 8, 28), hemi: new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), box: new THREE.BoxGeometry(1, 1, 1), arc: new THREE.TorusGeometry(1, 0.14, 8, 20, Math.PI),
};
function m(geo, mt, sx, sy, sz, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(geo, mt); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; return o; }

// head — група голови (радіус ≈ 0.3, верх ≈ y 0.27), col — колір кухарчика
export function addHat(head, idx, col) {
  const W = mat(0xffffff), C = mat(col), GOLD = mat(0xffc93c, { metalness: 0.6, roughness: 0.3 });
  const add = o => head.add(o);
  switch (((idx % HATS.length) + HATS.length) % HATS.length) {
    case 0: add(m(G.cyl, W, 0.2, 0.16, 0.2, 0, 0.27)); for (let i = 0; i < 4; i++) add(m(G.sph, W, 0.12, 0.11, 0.12, Math.cos(i * 1.57) * 0.1, 0.39, Math.sin(i * 1.57) * 0.1)); add(m(G.sph, W, 0.13, 0.12, 0.13, 0, 0.44)); add(m(G.cyl, C, 0.205, 0.03, 0.205, 0, 0.21)); break;
    case 1: add(m(G.tor, C, 0.28, 0.28, 0.28, 0, 0.12, 0, Math.PI / 2)); add(m(G.hemi, C, 0.29, 0.16, 0.29, 0, 0.12)); for (let i = 0; i < 6; i++) add(m(G.sph, W, 0.02, 0.02, 0.01, Math.cos(i) * 0.2, 0.2 + (i % 2) * 0.04, Math.sin(i) * 0.2)); add(m(G.sph, C, 0.05, 0.05, 0.05, -0.04, 0.14, -0.29)); add(m(G.cone, C, 0.04, 0.12, 0.02, -0.08, 0.06, -0.3, 0.3, 0, 0.5)); break;
    case 2: add(m(G.hemi, C, 0.29, 0.2, 0.29, 0, 0.1)); add(m(G.cyl, C, 0.22, 0.025, 0.2, 0, 0.11, 0.2)); add(m(G.sph, W, 0.03, 0.03, 0.03, 0, 0.3)); add(m(G.cyl, W, 0.1, 0.06, 0.005, 0, 0.2, 0.27, Math.PI / 2 - 0.4)); break;
    case 3: add(m(G.cyl, GOLD, 0.17, 0.12, 0.17, 0, 0.3)); for (let i = 0; i < 5; i++) { add(m(G.cone, GOLD, 0.04, 0.09, 0.04, Math.cos(i * 1.26) * 0.15, 0.4, Math.sin(i * 1.26) * 0.15)); add(m(G.sph, mat([0xe53935, 0x1e88e5, 0x43a047][i % 3], { roughness: 0.2 }), 0.02, 0.02, 0.02, Math.cos(i * 1.26) * 0.175, 0.3, Math.sin(i * 1.26) * 0.175)); } break;
    case 4: for (const s of [-1, 1]) { add(m(G.sph, C, 0.09, 0.09, 0.06, s * 0.19, 0.24)); add(m(G.sph, mat(0xffb6c1), 0.05, 0.05, 0.03, s * 0.19, 0.24, 0.03)); } break;
    case 5: add(m(G.cyl, W, 0.18, 0.12, 0.18, 0, 0.27)); add(m(G.sph, W, 0.17, 0.12, 0.17, 0, 0.36)); for (let i = 0; i < 5; i++) add(m(G.sph, mat(0xff6fa5), 0.05, 0.03, 0.05, 0.2 + Math.cos(i * 1.26) * 0.05, 0.22, 0.12 + Math.sin(i * 1.26) * 0.05)); add(m(G.sph, mat(0xffe14d), 0.035, 0.035, 0.035, 0.2, 0.24, 0.12)); break;
    case 6: { // віночок зі стрічками
      const cols = [0xe53935, 0xffd23f, 0x2f6fd6, 0xffffff, 0x8e24aa, 0xff7043];
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(m(G.sph, mat(cols[i % cols.length]), 0.05, 0.04, 0.05, Math.cos(a) * 0.24, 0.17 + (i % 2) * 0.02, Math.sin(a) * 0.24)); add(m(G.sph, mat(0x43a047), 0.05, 0.015, 0.03, Math.cos(a + 0.25) * 0.26, 0.15, Math.sin(a + 0.25) * 0.26, 0, -a)); }
      for (let i = 0; i < 4; i++) add(m(G.box, mat(cols[i]), 0.025, 0.36, 0.005, -0.06 + i * 0.04, -0.06, -0.27, 0.15));
      break;
    }
    case 7: add(m(G.sph, mat(0x2b2b33), 0.3, 0.07, 0.3, 0.04, 0.24, 0, 0, 0, -0.2)); add(m(G.cyl, mat(0x2b2b33), 0.012, 0.05, 0.012, 0.04, 0.3, 0)); break;
    case 8: { // сомбреро
      add(m(G.cyl, mat(0xe9c46a), 0.55, 0.02, 0.55, 0, 0.2)); add(m(G.cone, mat(0xe9c46a), 0.2, 0.3, 0.2, 0, 0.35));
      add(m(G.tor, C, 0.17, 0.17, 0.17, 0, 0.24, 0, Math.PI / 2)); add(m(G.tor, mat(0xe63946), 0.5, 0.5, 0.15, 0, 0.21, 0, Math.PI / 2)); break;
    }
    case 9: { // ковбойський
      const B = mat(0x8d5a2b); add(m(G.sph, B, 0.42, 0.05, 0.36, 0, 0.2)); add(m(G.cyl, B, 0.2, 0.2, 0.18, 0, 0.32)); add(m(G.sph, B, 0.2, 0.06, 0.18, 0, 0.42));
      add(m(G.cyl, mat(0x3e2723), 0.205, 0.04, 0.185, 0, 0.25)); add(m(G.sph, GOLD, 0.025, 0.025, 0.01, 0, 0.25, 0.185)); break;
    }
    case 10: { // вікінг
      const S = mat(0x9aa6b3, { metalness: 0.7, roughness: 0.3 }); add(m(G.hemi, S, 0.3, 0.24, 0.29, 0, 0.08)); add(m(G.cyl, mat(0x8d6e63), 0.305, 0.04, 0.295, 0, 0.09));
      for (const s of [-1, 1]) add(m(G.cone, mat(0xfff8e1), 0.05, 0.22, 0.05, s * 0.32, 0.27, 0, 0, 0, -s * 0.9)); break;
    }
    case 11: for (const s of [-1, 1]) { add(m(G.sph, W, 0.06, 0.2, 0.04, s * 0.1, 0.42, 0, 0, 0, -s * 0.15)); add(m(G.sph, mat(0xffb6c1), 0.035, 0.15, 0.03, s * 0.1, 0.42, 0.015, 0, 0, -s * 0.15)); } break;
    case 12: { // чарівник
      const P = mat(0x3949ab); add(m(G.cyl, P, 0.33, 0.02, 0.33, 0, 0.19)); add(m(G.cone, P, 0.2, 0.5, 0.2, 0.03, 0.44, 0, 0, 0, -0.15));
      for (let i = 0; i < 5; i++) add(m(G.sph, mat(0xffeb3b, { emissive: 0xffd600, emissiveIntensity: 0.4 }), 0.025, 0.025, 0.025, Math.cos(i * 2) * 0.11, 0.3 + i * 0.06, Math.sin(i * 2) * 0.11 + 0.05)); break;
    }
    case 13: { // пропелер
      add(m(G.hemi, C, 0.29, 0.18, 0.29, 0, 0.1)); add(m(G.cyl, mat(0xffd23f), 0.2, 0.025, 0.18, 0, 0.11, 0.2));
      add(m(G.cyl, mat(0x555555), 0.012, 0.08, 0.012, 0, 0.32)); const pr = new THREE.Group(); pr.position.y = 0.37; pr.name = 'prop';
      pr.add(m(G.box, mat(0xe53935), 0.3, 0.008, 0.05)); pr.add(m(G.box, mat(0x1e88e5), 0.05, 0.008, 0.3)); add(pr); break;
    }
    case 14: { // тірольський
      const Gr = mat(0x33691e); add(m(G.cyl, Gr, 0.3, 0.02, 0.28, 0, 0.2)); add(m(G.cyl, Gr, 0.17, 0.16, 0.16, 0, 0.29)); add(m(G.sph, Gr, 0.17, 0.05, 0.16, 0, 0.37));
      add(m(G.cyl, mat(0xc62828), 0.175, 0.03, 0.165, 0, 0.24)); add(m(G.sph, mat(0x5d4037), 0.02, 0.18, 0.01, 0.16, 0.36, 0.05, 0, 0, -0.5)); break;
    }
    case 15: { const K = mat(0x212121); add(m(G.cyl, K, 0.3, 0.02, 0.3, 0, 0.2)); add(m(G.cyl, K, 0.17, 0.3, 0.17, 0, 0.36)); add(m(G.cyl, C, 0.175, 0.05, 0.175, 0, 0.25)); break; }
    case 16: { // пірат
      const K = mat(0x212121); add(m(G.sph, K, 0.36, 0.1, 0.24, 0, 0.27)); add(m(G.hemi, K, 0.26, 0.16, 0.24, 0, 0.18));
      add(m(G.sph, W, 0.05, 0.05, 0.01, 0, 0.3, 0.24)); add(m(G.box, W, 0.07, 0.015, 0.01, 0, 0.26, 0.24, 0, 0, 0.6)); add(m(G.box, W, 0.07, 0.015, 0.01, 0, 0.26, 0.24, 0, 0, -0.6)); break;
    }
    case 17: { add(m(G.hemi, C, 0.3, 0.24, 0.3, 0, 0.08)); add(m(G.cyl, W, 0.305, 0.07, 0.305, 0, 0.1)); add(m(G.sph, W, 0.08, 0.08, 0.08, 0, 0.35)); for (let i = 0; i < 6; i++) add(m(G.box, W, 0.012, 0.18, 0.01, Math.cos(i * 1.05) * 0.24, 0.2, Math.sin(i * 1.05) * 0.24, Math.sin(i * 1.05) * 0.5, 0, -Math.cos(i * 1.05) * 0.5)); break; }
    case 18: { add(m(G.arc, mat(0x37474f), 0.3, 0.3, 0.3, 0, 0.0, 0)); for (const s of [-1, 1]) { add(m(G.cyl, C, 0.1, 0.07, 0.1, s * 0.29, 0.0, 0, 0, 0, Math.PI / 2)); add(m(G.cyl, mat(0x263238), 0.08, 0.072, 0.08, s * 0.3, 0.0, 0, 0, 0, Math.PI / 2)); } break; }
    case 20: { // тюрбан із брошкою й пером
      const T = mat([0xff9933, 0xd63a3a, 0x7b2d8b][Math.abs(col) % 3]);
      for (let i = 0; i < 4; i++) add(m(G.tor, T, 0.27 - i * 0.03, 0.27 - i * 0.03, 0.4, 0, 0.16 + i * 0.06, 0, Math.PI / 2, 0, i * 0.4));
      add(m(G.sph, T, 0.2, 0.14, 0.2, 0, 0.3)); add(m(G.sph, GOLD, 0.04, 0.05, 0.02, 0, 0.26, 0.26)); add(m(G.sph, mat(0x2a9d8f, { roughness: 0.2 }), 0.025, 0.025, 0.02, 0, 0.26, 0.28));
      add(m(G.cone, mat(0xffffff), 0.02, 0.18, 0.01, 0, 0.38, 0.24, -0.2)); break;
    }
    case 21: { // конічний солом'яний капелюх
      add(m(G.cone, mat(0xe2c27a), 0.48, 0.24, 0.48, 0, 0.33)); for (let i = 0; i < 3; i++) add(m(G.tor, mat(0xc9a050), 0.4 - i * 0.12, 0.4 - i * 0.12, 0.15, 0, 0.25 + i * 0.06, 0, Math.PI / 2));
      add(m(G.box, C, 0.02, 0.2, 0.01, 0.2, 0.08, 0.1, 0, 0, 0.3)); add(m(G.box, C, 0.02, 0.2, 0.01, -0.2, 0.08, 0.1, 0, 0, -0.3)); break;
    }
    case 22: { // кавказька папаха з овчини
      const F = mat(0xf2ede4, { roughness: 1 });
      add(m(G.cyl, F, 0.27, 0.26, 0.27, 0, 0.3)); for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.24 + (i % 3) * 0.015; add(m(G.sph, F, 0.06, 0.06, 0.06, Math.cos(a) * r, 0.2 + (i % 5) * 0.05, Math.sin(a) * r)); }
      add(m(G.cyl, F, 0.26, 0.04, 0.26, 0, 0.44)); break;
    }
    case 19: { add(m(G.tor, W, 0.29, 0.29, 0.29, 0, 0.12, 0, Math.PI / 2)); add(m(G.sph, mat(0xd32f2f), 0.05, 0.05, 0.005, 0, 0.14, 0.29)); add(m(G.box, W, 0.03, 0.2, 0.01, 0.03, 0.04, -0.3, 0.2, 0, 0.3)); add(m(G.box, W, 0.03, 0.2, 0.01, -0.03, 0.04, -0.3, 0.2, 0, -0.3)); break; }
  }
}
