// Кухарчата — власні значки: продукти й страви «фотографуються» з 3D-моделей,
// значки стану (ніж, крапля, вогник, піч) намальовані вручну.
import * as THREE from 'three';
import { ING, RECIPES } from './data.js';
import { makeIngMesh, dishMesh } from './food.js';

const SIZE = 128;
let R = null, scene, cam;
function setup() {
  if (R) return;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(SIZE, SIZE, false); R.outputColorSpace = THREE.SRGBColorSpace;
  R.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 1.5));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(1.2, 2.5, 2); scene.add(d);
  const b = new THREE.DirectionalLight(0xfff0e0, 0.5); b.position.set(-2, 1, -1); scene.add(b);
  cam = new THREE.PerspectiveCamera(28, 1, 0.01, 20);
}
const cache = new Map();
function snap(key, build, tilt = 0.75) {
  if (cache.has(key)) return cache.get(key);
  const out = document.createElement('canvas'); out.width = out.height = SIZE;
  try {
    setup();
    const obj = build();
    const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const r = Math.max(size.x, size.y * 1.1, size.z) * 0.62 || 0.3;
    const dist = r / Math.tan(cam.fov * Math.PI / 360) * 1.15;
    cam.position.set(ctr.x + dist * 0.05, ctr.y + dist * Math.sin(tilt), ctr.z + dist * Math.cos(tilt));
    cam.lookAt(ctr);
    scene.add(obj); R.render(scene, cam); scene.remove(obj);
    out.getContext('2d').drawImage(R.domElement, 0, 0);
  } catch (_) { /* без WebGL — порожній значок */ }
  cache.set(key, out);
  return out;
}
export const ingCanvas = (id) => snap('i' + id, () => makeIngMesh(id, 'r'), ING[id] && ING[id].liquid ? 0.35 : 0.75);
export const dishCanvas = (rid) => snap('d' + rid, () => dishMesh(rid), RECIPES[rid] && RECIPES[rid].drink ? 0.4 : 0.85);

/* ---------- значки стану ---------- */
function badge(g, s, x, y, r) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.lineWidth = r * 0.12; g.strokeStyle = 'rgba(0,0,0,.18)'; g.stroke();
  const k = r / 10;
  switch (s) {
    case 'c': // ніж
      g.rotate(-0.7); g.fillStyle = '#cfd8dc'; g.beginPath(); g.moveTo(-1 * k, -6 * k); g.lineTo(2.2 * k, -6 * k); g.quadraticCurveTo(3 * k, 0, 2.2 * k, 2 * k); g.lineTo(-1 * k, 2 * k); g.fill();
      g.fillStyle = '#6d4c41'; g.fillRect(-1.2 * k, 2 * k, 3.2 * k, 5 * k); break;
    case 'b': // крапля води
      g.fillStyle = '#3d9be9'; g.beginPath(); g.moveTo(0, -6.5 * k); g.bezierCurveTo(5 * k, -1 * k, 5 * k, 5.5 * k, 0, 5.5 * k); g.bezierCurveTo(-5 * k, 5.5 * k, -5 * k, -1 * k, 0, -6.5 * k); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-1.5 * k, 1.5 * k, 1.2 * k, 0, 7); g.fill(); break;
    case 'f': // вогник
      g.fillStyle = '#ff6d00'; g.beginPath(); g.moveTo(0, -7 * k); g.bezierCurveTo(6 * k, -1 * k, 5 * k, 6 * k, 0, 6 * k); g.bezierCurveTo(-5 * k, 6 * k, -5 * k, 0, -1 * k, -2 * k); g.bezierCurveTo(-1 * k, 0, 0, 1 * k, 1 * k, -1 * k); g.fill();
      g.fillStyle = '#ffd54f'; g.beginPath(); g.ellipse(0, 3 * k, 2 * k, 2.6 * k, 0, 0, 7); g.fill(); break;
    case 'k': // піч
      g.fillStyle = '#b5532f'; g.beginPath(); g.roundRect(-6 * k, -5 * k, 12 * k, 11 * k, 2.5 * k); g.fill();
      g.fillStyle = '#ffb300'; g.beginPath(); g.roundRect(-4 * k, -1 * k, 8 * k, 5 * k, 1.5 * k); g.fill();
      g.fillStyle = '#5d2e16'; g.fillRect(-4 * k, -3.6 * k, 8 * k, 1.2 * k); break;
    case 'x':
      g.strokeStyle = '#333'; g.lineWidth = 2.4 * k; g.beginPath(); g.moveTo(-4 * k, -4 * k); g.lineTo(4 * k, 4 * k); g.moveTo(4 * k, -4 * k); g.lineTo(-4 * k, 4 * k); g.stroke(); break;
  }
  g.restore();
}
const badgeCache = new Map();
function badgeCanvas(s) {
  if (badgeCache.has(s)) return badgeCache.get(s);
  const c = document.createElement('canvas'); c.width = c.height = 40; badge(c.getContext('2d'), s, 20, 20, 18);
  badgeCache.set(s, c); return c;
}
export const STATES_WITH_BADGE = new Set(['c', 'b', 'f', 'k', 'x']);

/* ---------- малювання в canvas (бульбашки, вивіски) ---------- */
export function drawIng(ctx, id, s, x, y, size, withBadge = true) {
  ctx.drawImage(ingCanvas(id), x - size / 2, y - size / 2, size, size);
  if (withBadge && STATES_WITH_BADGE.has(s)) badge(ctx, s, x + size * 0.32, y + size * 0.32, size * 0.2);
}
export function drawDish(ctx, rid, x, y, size) { ctx.drawImage(dishCanvas(rid), x - size / 2, y - size / 2, size, size); }
export function drawKnife(ctx, x, y, s) { // великий ніж для ефекту нарізання
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); const k = s / 20;
  ctx.fillStyle = '#eceff1'; ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = k * 0.8;
  ctx.beginPath(); ctx.moveTo(-3 * k, -9 * k); ctx.lineTo(4 * k, -9 * k); ctx.quadraticCurveTo(5 * k, 0, 4 * k, 3 * k); ctx.lineTo(-3 * k, 3 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.roundRect(-3 * k, 3 * k, 6 * k, 8 * k, 1.5 * k); ctx.fill();
  ctx.fillStyle = '#bcaaa4'; ctx.beginPath(); ctx.arc(0, 6 * k, 0.8 * k, 0, 7); ctx.arc(0, 9 * k, 0.8 * k, 0, 7); ctx.fill();
  ctx.restore();
}
// запасний варіант для інших значків (емодзі в оформленні)
export function drawIcon(ctx, icon, x, y, s) {
  ctx.save();
  ctx.font = `${Math.round(s * .82)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y + s * .04);
  ctx.restore();
}

/* ---------- HTML ---------- */
const urls = new Map();
const url = (k, c) => { if (!urls.has(k)) urls.set(k, c.toDataURL()); return urls.get(k); };
export function ingURL(id) { return url('i' + id, ingCanvas(id)); }
export function dishURL(rid) { return url('d' + rid, dishCanvas(rid)); }
export function ingHTML(id, s, cls = 'ic') {
  const b = STATES_WITH_BADGE.has(s) ? `<i><img src="${url('b' + s, badgeCanvas(s))}" alt=""></i>` : '';
  return `<b class="${cls}" title="${ING[id].name}"><img src="${ingURL(id)}" alt="">${b}</b>`;
}
export function recipeHTML(rid) {
  return RECIPES[rid].c.map(k => { const [id, s] = k.split(':'); return ingHTML(id, s); }).join('');
}
export function dishHTML(rid, cls = 'dimg') { return `<img class="${cls}" src="${dishURL(rid)}" alt="${RECIPES[rid].name}">`; }
