// Кухарчата — головний модуль: екрани, ігровий цикл, збереження, гра разом
import * as THREE from 'three';
import { LEVELS, RECIPES, ING, COUNTRIES, SPEAKERS, COOK_COLORS, COOKER, drinksFor } from './data.js';
import { Sim, starThresholds, pathOf, levelScaling } from './sim.js';
import { KitchenView, makeCook, animateCook, THEMES } from './render.js';
import { MapView } from './map.js';
import { Input } from './input.js';
import { audioInit, sfx, music, musicRate, stopMusic, vol, setVolumes } from './audio.js';
import { Net, qrCanvas, scanQR, cameraOn, cameraOff } from './net.js';
import { ingHTML, recipeHTML, dishHTML, snapURL } from './icons.js';
import { HATS } from './hats.js';
import { makeHeadPreview } from './render.js';
import { iconSrc } from './uiicons.js';
import { initLang, tr, LANGS, LANG } from './i18n.js';

const $ = s => document.querySelector(s);
const VERSION = '1.14';
const rid = () => Math.random().toString(36).slice(2, 8);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ================= збереження ================= */
const SAVE_KEY = 'kukharchata.v1';
function defaults() {
  return { name: '', color: Math.floor(Math.random() * 6), hat: 0, stars: {}, best: {}, fails: {}, assist: {}, drinks: {}, at: 0, room: '', lastJoin: '', dev: rid(), seen: {},
    set: { music: 0.5, sfx: 0.8, padMode: 'own', shared: false, touch: true, hints: true, hall: true, drinks: false, throw: false, turn: { meteredUrl: '', turnUrl: '', turnUser: '', turnPass: '' } } };
}
const S = (() => {
  const d = defaults();
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); const o = Object.assign(d, s); o.set = Object.assign(defaults().set, s.set || {}); o.set.turn = Object.assign(defaults().set.turn, (s.set || {}).turn || {}); return o; }
  catch (_) { return d; }
})();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) { } }
/* ---------- слоти збереження: окремий прогрес і своя кімната для кожної компанії ---------- */
const PROG = ['stars', 'best', 'fails', 'assist', 'drinks', 'at', 'room', 'lastJoin'];
const MAX_SLOTS = 6;
if (!Array.isArray(S.slots) || !S.slots.length) { S.slots = [{ name: 'Моя гра' }]; S.slot = 0; }
S.slot = Math.max(0, Math.min(S.slots.length - 1, S.slot | 0));
function stashSlot() { const o = S.slots[S.slot]; for (const k of PROG) o[k] = S[k]; }
function loadSlot(i) {
  stashSlot(); S.slot = i; const o = S.slots[i], d = defaults();
  for (const k of PROG) S[k] = o[k] !== undefined ? JSON.parse(JSON.stringify(o[k])) : d[k];
  save();
}
const slotStars = o => Object.values((o === S.slots[S.slot] ? S.stars : o.stars) || {}).reduce((a, b) => a + b, 0);
const slotName = () => S.slots[S.slot].name || ('Слот ' + (S.slot + 1));
vol.music = S.set.music; vol.sfx = S.set.sfx;
const unlockedOf = stars => { for (let i = 0; i < LEVELS.length; i++) if (!stars[LEVELS[i].id]) return i; return LEVELS.length - 1; };
// скільки роботів: вибір для рівня, а соло — останній вибір гравця
const botsOf = (lv, humans) => { const v = S.assist[lv.id]; if (v !== undefined) return Math.max(0, Math.min(2, +v || 0)); return humans === 1 ? (S.set.soloBots || 0) : 0; };
const drinkOn = lv => S.drinks[lv.id] ?? S.set.drinks;
const SID = S.dev + rid().slice(0, 3); // ідентифікатор пристрою на цю сесію
const myName = () => (S.name || '').trim() || tr('Кухарчик');

/* ================= рендер ================= */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const input = new Input($('#touch'));
const net = new Net();

const app = { scene: 'title', view: null, sim: null, map: null, paused: false, modal: null, lvl: null };

/* ---------- титульна сцена: кухарчики танцюють ---------- */
const title = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(35, 1, 0.1, 50), cooks: [], t: 0 };
title.scene.background = new THREE.Color(0xffd9a8);
title.scene.add(new THREE.HemisphereLight(0xffffff, 0xb88a5a, 1.4));
{ const l = new THREE.DirectionalLight(0xffffff, 1.6); l.position.set(3, 6, 5); title.scene.add(l);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.2, 40), new THREE.MeshStandardMaterial({ color: 0xffb87a })); disk.position.y = -0.1; title.scene.add(disk); }
function buildTitleCooks() {
  for (const c of title.cooks) title.scene.remove(c.root);
  title.cooks = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const me = i === 2;
    const c = makeCook(me ? S.color : (S.color + i + 1) % 6, me ? S.hat : (i * 7 + 3) % 20, false, '');
    c.root.position.set((i - 2) * 1.05, 0, me ? 0.6 : -Math.abs(i - 2) * 0.3);
    c.root.scale.setScalar(me ? 1.35 : 1);
    title.scene.add(c.root); title.cooks.push(c);
  }
}
function titleFrame(dt) {
  title.t += dt;
  title.cooks.forEach((c, i) => {
    animateCook(c, { moving: true, held: null, act: '' }, dt * 0.6);
    c.g.rotation.y = Math.sin(title.t * 1.3 + i) * 0.5;
    c.root.position.y = Math.abs(Math.sin(title.t * 3 + i)) * 0.12;
  });
  const portrait = innerWidth < innerHeight;
  title.cam.position.set(0, 1.6, portrait ? 9 : 6.4); title.cam.lookAt(0, portrait ? 0.4 : 0.1, 0);
  renderer.render(title.scene, title.cam);
}

/* ================= загальні UI ================= */
function toast(msg, ms = 2600) {
  const d = document.createElement('div'); d.textContent = msg; $('#toast').appendChild(d);
  setTimeout(() => d.remove(), ms);
}
function openModal(html, onClose) {
  $('#mcard').innerHTML = html; $('#modal').classList.remove('hide'); app.modal = { onClose };
  $('#mcard').scrollTop = 0;
}
function closeModal() {
  if (!app.modal) return;
  const m = app.modal; app.modal = null; $('#modal').classList.add('hide'); $('#mcard').innerHTML = '';
  if (m.onClose) m.onClose();
}
function show(id, on) { $(id).classList.toggle('hide', !on); }
function dialogHTML(lines) {
  return lines.map(([who, txt]) => `<div class="dlg"><div class="face">${SPEAKERS[who].face}</div><div class="bub"><b>${SPEAKERS[who].name}</b>${esc(txt)}</div></div>`).join('');
}
const STEP_TXT = { c: 'наріж', b: 'звари', f: 'підсмаж', k: 'запечи' };
function howTo(rid) {
  if (RECIPES[rid].drink) return RECIPES[rid].c.map(k => { const [id, s] = k.split(':'); return (s === 'l' ? 'налий ' : 'додай ') + ING[id].name; }).join(' · ');
  const parts = RECIPES[rid].c.map(k => { const [id, s] = k.split(':'); return [id, s]; });
  const seen = new Set(), steps = [];
  for (const [id, s] of parts) {
    if (seen.has(id + s)) continue; seen.add(id + s);
    const p = pathOf(id, s).slice(1).map(x => STEP_TXT[x]);
    steps.push(ING[id].name + (p.length ? ': ' + p.join(' → ') : ''));
  }
  return steps.join(' · ');
}
function recipesHTML(lv, drinks) {
  return [...lv.recipes, ...(drinks ? drinksFor(lv) : [])].map(r => `<div class="rec"><span class="dish">${dishHTML(r)}</span><div><div class="nm">${RECIPES[r].name}</div><div class="how">${esc(howTo(r))}</div></div><div class="row" style="margin-left:auto;gap:2px">${recipeHTML(r)}</div></div>`).join('');
}

/* ================= титульний екран ================= */
function buildLangRow() {
  let row = $('#langRow');
  if (!row) { row = document.createElement('div'); row.id = 'langRow'; row.className = 'row'; row.style.cssText = 'position:absolute;top:calc(10px + var(--safeT));right:calc(10px + var(--safeR));gap:6px'; $('#title').appendChild(row); }
  row.innerHTML = LANGS.map(([c, f, n]) => `<button class="hatb ${c === LANG ? 'on' : ''}" data-l="${c}" title="${n}" style="width:44px"><img class="flag" src="${iconSrc(f)}" alt="${n}"></button>`).join('');
  row.onclick = e => { const b = e.target.closest('[data-l]'); if (b) setLang(b.dataset.l); };
}
function buildMe() {
  buildLangRow();
  $('#meName').value = S.name;
  $('#meName').oninput = () => { S.name = $('#meName').value.slice(0, 14); save(); };
  $('#meColors').innerHTML = COOK_COLORS.map((c, i) => `<button class="sw ${i === S.color ? 'on' : ''}" style="background:#${c.c.toString(16).padStart(6, '0')}" data-c="${i}" aria-label="${c.name}"></button>`).join('');
  if (S.hat >= HATS.length) S.hat = 0;
  $('#meHats').innerHTML = HATS.map((h, i) => `<button class="hatb hatp ${i === S.hat ? 'on' : ''}" data-h="${i}" title="${h}"><img src="${snapURL('hat' + i + '_' + S.color, () => makeHeadPreview(i, S.color), 0.3)}" alt="${h}"></button>`).join('');
  const on = $('#meHats .on'); if (on) { const bx = $('#meHats'); bx.scrollLeft = on.offsetLeft - bx.clientWidth / 2 + on.offsetWidth / 2; }
  $('#meColors').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; S.color = +b.dataset.c; save(); buildMe(); buildTitleCooks(); sfx('click'); sendLocals(); };
  $('#meHats').onclick = e => { const b = e.target.closest('[data-h]'); if (!b) return; S.hat = +b.dataset.h; save(); buildMe(); buildTitleCooks(); sfx('click'); sendLocals(); };
  $('#bSlot').textContent = `💾 ${slotName()} · ⭐ ${slotStars(S.slots[S.slot])} ▾`;
  $('#bSlot').onclick = () => { audioInit(); sfx('click'); openSlots(); };
  const total = Object.values(S.stars).reduce((a, b) => a + b, 0);
  $('#titleInfo').textContent = `⭐ ${total} з ${LEVELS.length * 3} · версія ${VERSION}`;
}
function goTitle() {
  app.scene = 'title'; show('#title', true); show('#mapUI', false); show('#hud', false); input.show(false);
  document.body.classList.remove('playing');
  buildMe(); buildTitleCooks(); music('map', 104);
}
$('#bPlay').onclick = () => { audioInit(); sfx('click'); if (!S.name.trim()) { S.name = tr('Кухарчик'); save(); } goMap(); };
$('#bCoop').onclick = () => { audioInit(); sfx('click'); openCoop(); };
$('#bSet').onclick = () => { audioInit(); sfx('click'); openSettings(); };

/* ================= карта ================= */
const mapState = { at: 0, stars: {}, unlocked: 0 };
function syncMapState() {
  if (net.role === 'guest') return;
  mapState.stars = S.stars; mapState.unlocked = unlockedOf(S.stars); mapState.at = Math.min(S.at, mapState.unlocked);
}
function goMap(thenCard) {
  app.scene = 'map'; show('#title', false); show('#mapUI', true); show('#hud', false); input.show(false);
  document.body.classList.remove('playing');
  if (!app.map) app.map = new MapView(renderer);
  syncMapState();
  app.map.setProgress(mapState.stars, mapState.unlocked);
  app.map.place(mapState.at);
  const total = Object.values(mapState.stars).reduce((a, b) => a + b, 0);
  $('#mStars').textContent = '⭐ ' + total;
  $('#mapHint').textContent = net.role === 'guest' ? `Карту веде ${hostName()} 🚚` : 'Торкнись міста на карті 🚚';
  updateNetPill();
  music('map', 104);
  resize();
  if (net.role === 'host') net.broadcast({ k: 'map', ...mapState });
  if (thenCard !== undefined) driveAndCard(thenCard);
}
function driveAndCard(i) {
  if (i > mapState.unlocked) { toast('Спершу пройди попередні міста 🔒'); sfx('nope'); return; }
  sfx('click');
  mapState.at = i; if (net.role !== 'guest') { S.at = i; save(); }
  if (net.role === 'host') net.broadcast({ k: 'drive', to: i });
  app.map.driveTo(i, () => openCard(i));
}
$('#mBack').onclick = () => { sfx('click'); goTitle(); };
$('#mSet').onclick = () => { sfx('click'); openSettings(); };
$('#netPill').onclick = () => { sfx('click'); openCoop(); };
canvas.addEventListener('pointerup', e => {
  if (app.scene !== 'map' || app.modal || !app.map || app.map.route) return;
  if (net.role === 'guest') { toast(`Карту веде ${hostName()}`); return; }
  const i = app.map.pick(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (i !== null) { audioInit(); driveAndCard(i); }
});

/* ---------- кухарі на цьому пристрої ---------- */
function localCooks() {
  const pads = input.pads();
  const list = [];
  const meMerged = S.set.padMode === 'me' && pads[0];
  if (S.set.touch || !pads.length) list.push({ lid: 't0', srcs: ['touch0', 'kb'].concat(meMerged ? ['pad' + pads[0].index] : []), label: meMerged ? '📱🎮 Я' : '📱 Я' });
  if (S.set.shared) list.push({ lid: 't1', srcs: ['touch1'], label: '👆 Другий на екрані' });
  pads.forEach((p, k) => { if (meMerged && k === 0) return; list.push({ lid: 'p' + p.index, srcs: ['pad' + p.index], label: '🎮 Геймпад ' + (p.index + 1) }); });
  if (!list.length) list.push({ lid: 't0', srcs: ['touch0', 'kb'], label: '📱 Я' });
  return list.slice(0, 6).map((c, k) => ({ ...c, name: k ? myName() + ' ' + (k + 1) : myName(), color: (S.color + k * 2) % 6, hat: k ? (S.hat + k * 3) % 20 : S.hat }));
}
function sendLocals() { if (net.role === 'guest') net.send({ k: 'locals', name: myName(), locals: localCooks().map(({ lid, name, color, hat }) => ({ lid, name, color, hat })) }); }
addEventListener('gamepadconnected', e => { toast('🎮 Геймпад підключено: ' + (e.gamepad.id || '').slice(0, 30)); sendLocals(); if (app.modal && app.modal.card !== undefined) openCard(app.modal.card); });
addEventListener('gamepaddisconnected', () => { toast('🎮 Геймпад відключено'); sendLocals(); });

/* ---------- склад гравців (хост) ---------- */
const roster = []; // [{dev, conn, name, locals:[{lid,name,color,hat}]}]
function myRosterEntry() { return { dev: SID, conn: null, name: myName(), locals: localCooks().map(({ lid, name, color, hat }) => ({ lid, name, color, hat })) }; }
function fullRoster() { return [myRosterEntry(), ...roster]; }
function buildPlayers() {
  const out = [], used = new Set();
  for (const d of fullRoster()) for (const l of d.locals) {
    if (out.length >= 6) break;
    let c = l.color; if (used.has(c)) { for (let k = 0; k < 6; k++) if (!used.has((c + k) % 6)) { c = (c + k) % 6; break; } }
    used.add(c);
    out.push({ id: d.dev + ':' + l.lid, dev: d.dev, name: l.name, color: c, hat: l.hat });
  }
  return out;
}
function countHumans() { return buildPlayers().length; }
function hostName() { return app.hostName || 'хост'; }
function rosterSummary() { return fullRoster().map(d => ({ name: d.name, n: d.locals.length })); }
function broadcastRoster() { if (net.role === 'host') net.broadcast({ k: 'roster', list: rosterSummary() }); updateNetPill(); }

/* ---------- картка рівня ---------- */
function openCard(li) {
  const lv = LEVELS[li], C = COUNTRIES[lv.country];
  const guest = net.role === 'guest';
  const humans = guest ? (app.guestHumans || 1) : countHumans();
  const nBots = guest ? 0 : botsOf(lv, humans);
  const eff = Math.min(6, humans + Math.floor(nBots / 2));
  const th = S.set.kid && !guest ? starThresholds(lv, eff, true) : starThresholds(lv, Math.min(6, eff + (nBots % 2) * 0.5));
  const best = (guest ? mapState.stars : S.stars)[lv.id] || 0;
  const fails = S.fails[lv.id] || 0;
  const cooks = localCooks();
  const drinksOn = drinkOn(lv);
  const drinkBox = !guest ? `<div class="assist" style="background:#fff4e0"><span style="font-size:30px">🥤</span><div style="flex:1">Напої<br><span class="sub" style="font-size:13px">Додатково: наливати в кухлі на автоматах${drinksFor(lv).some(r => RECIPES[r].c.some(k => !k.endsWith(':l'))) ? ', додавати лід чи карамель' : ''}</span></div><button class="toggle ${drinksOn ? 'on' : ''}" id="cDrinks"></button></div>` : '';
  const assistBox = (!guest && (humans === 1 || fails > 0 || nBots > 0)) ? `<div class="assist"><span style="font-size:30px">🤖</span><div style="flex:1">Роботи-помічники<br><span class="sub" style="font-size:13px">${S.set.kid ? 'Дитячий режим: роботи спритні й самі подають страви' : (humans === 1 ? 'Граєш сам? Візьми роботів на кухню' : 'Допоможуть пройти рівень, якщо не виходить') + '. Роботи готують, а подаєш гостям ти'}</span></div>
    <div class="row" style="gap:6px;flex-wrap:nowrap">${[0, 1, 2].map(n => `<button class="chip ${n === nBots ? 'on' : ''}" data-bots="${n}">${n ? '🤖'.repeat(n) : '0'}</button>`).join('')}</div></div>` : '';
  const sc = levelScaling(lv, eff);
  openModal(`
    <div class="sub">${C.name} · ${li + 1}/${LEVELS.length}</div>
    <h2>${lv.city}: ${lv.title}</h2>
    <div class="stars">${'★'.repeat(best)}<span style="color:#ddd">${'★'.repeat(3 - best)}</span></div>
    ${dialogHTML(lv.intro)}
    <h3>Що готуємо</h3>${recipesHTML(lv, guest ? app.guestDrinks : drinksOn)}${drinkBox}
    <h3>Кухарів: ${humans}${nBots ? " + " + "🤖".repeat(nBots) : ""}</h3>
    <div class="thr"><span>⭐ ${th[0]}</span><span>⭐⭐ ${th[1]}</span><span>⭐⭐⭐ ${th[2]}</span><span>⏱ ${Math.floor(lv.dur / 60)}:${String(lv.dur % 60).padStart(2, '0')}</span><span>🧾 до ${sc.maxO} замовлень</span></div>
    ${lv.fire ? '<p class="sub">🔥 Тут можуть бути пожежі — вогнегасник 🧯 на стійці.</p>' : ''}${lv.wash ? '<p class="sub">🧽 Тарілки повертаються брудні — мийте їх у мийці.</p>' : ''}
    <h3>На цьому пристрої</h3>
    <div class="row" style="justify-content:flex-start">${cooks.map(c => `<span class="chip on">${c.label}</span>`).join('')}
      <button class="chip" id="cShared">${S.set.shared ? '✓ ' : ''}👆👆 Двоє на екрані</button></div>
    <p class="kbd">Геймпад: підключи в налаштуваннях Bluetooth і натисни будь-яку кнопку — він стане окремим кухарчиком.</p>
    ${assistBox}
    <div class="btnrow">
      <button class="btn" id="cBack">Назад</button>
      ${guest ? `<span class="pill">⏳ Чекаємо, поки ${esc(hostName())} почне…</span>` : `<button class="btn pri big" id="cGo">Готувати! 🍳</button>`}
    </div>`);
  app.modal.card = li;
  $('#cBack').onclick = () => { sfx('click'); closeModal(); if (net.role === 'host') net.broadcast({ k: 'closecard' }); };
  $('#cShared').onclick = () => { S.set.shared = !S.set.shared; save(); sendLocals(); openCard(li); };
  if ($('#cDrinks')) $('#cDrinks').onclick = () => { S.drinks[lv.id] = !drinksOn; S.set.drinks = !drinksOn; save(); sfx('click'); openCard(li); };
  document.querySelectorAll('[data-bots]').forEach(b => b.onclick = () => { const n = +b.dataset.bots; S.assist[lv.id] = n; if (humans === 1) S.set.soloBots = n; save(); sfx('click'); openCard(li); });
  if ($('#cGo')) $('#cGo').onclick = () => { audioInit(); startLevel(li); };
  if (net.role === 'host') net.broadcast({ k: 'card', li, humans, drinks: drinksOn });
}

/* ================= рівень ================= */
function startLevel(li) {
  const lv = LEVELS[li];
  const players = buildPlayers();
  const nb = botsOf(lv, players.length);
  // роботи трохи підвищують темп замовлень: два роботи = ще один кухар
  const P = { k: 'start', li, humans: Math.min(6, players.length + Math.floor(nb / 2)), players, assist: nb, kid: !!S.set.kid, drinks: drinkOn(lv), throw: !!S.set.throw, hostName: myName() };
  for (let i = 0; i < nb; i++) P.players.push({ id: 'bot' + (i || ''), dev: 'bot', name: i ? 'Робо-2' : 'Робо', color: i, hat: 0, bot: true });
  if (net.role === 'host') net.broadcast(P);
  beginLevel(P);
}
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (_) { }
}
function beginLevel(P) {
  closeModal(); cameraOff();
  const lv = LEVELS[P.li];
  if (app.view) app.view.dispose();
  const host = net.role !== 'guest';
  const sim = new Sim(P.li, { humans: P.humans, drinks: !!P.drinks, throwOn: !!P.throw, kid: !!P.kid, assist: P.assist | 0 });
  for (const pl of P.players) {
    const mine = pl.dev === SID;
    const p = sim.addPlayer({ id: pl.id, name: pl.bot ? tr(pl.name) : pl.name, color: pl.color, hat: pl.hat, bot: host && pl.bot, remote: !mine && !(host && pl.bot) });
    p.isBot = !!pl.bot; p.dev = pl.dev;
  }
  const cooks = localCooks();
  const mine = P.players.filter(p => p.dev === SID);
  app.local = mine.map(pl => ({ pid: pl.id, srcs: (cooks.find(c => pl.id.endsWith(':' + c.lid)) || cooks[0]).srcs, lastUse: false }));
  app.myIds = new Set(mine.map(p => p.id));
  app.sim = sim; app.lvl = P; app.paused = false; app.over = false; app.prevSnap = new Map(); app.snapT = 0; app.keyT = 0; app.posT = 0;
  app.evOut = []; app.lastSec = 999; app.hurry = false; app.catTold = false;
  app.view = new KitchenView(renderer, sim, COUNTRIES[lv.country].theme, { hall: S.set.hall });
  app.view.setZoom(app.zoom || 1);
  app.scene = 'level';
  show('#title', false); show('#mapUI', false); show('#hud', true);
  document.body.classList.add('playing');
  const touchy = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  input.setMode(S.set.shared ? 'shared' : 'single', !!P.throw);
  input.show(touchy && app.local.some(l => l.srcs.includes('touch0') || l.srcs.includes('touch1')));
  $('#orders').innerHTML = ''; app.ordEls = new Map();
  $('#ping').classList.toggle('hide', net.role === 'solo');
  resize();
  music(COUNTRIES[lv.country].theme, lv.finale ? 128 : 118); musicRate(1);
  keepAwake(true);
  // відлік
  const cnt = $('#count'); let n = 3;
  cnt.classList.remove('hide', 'go'); cnt.textContent = n; sfx('tick');
  clearInterval(app.cntTimer);
  app.cntTimer = setInterval(() => {
    n--;
    if (n > 0) { cnt.textContent = n; sfx('tick'); }
    else if (n === 0) { cnt.textContent = 'Готуємо!'; cnt.classList.add('go'); sfx('go'); if (host) sim.started = true; }
    else { cnt.classList.add('hide'); clearInterval(app.cntTimer); }
  }, 800);
}

function combine(srcs, inp) {
  const o = { mx: 0, my: 0, grab: false, use: false, dash: false, throw: false };
  for (const s of srcs) { const v = inp[s]; if (!v) continue; o.mx += v.mx; o.my += v.my; o.grab ||= v.grab; o.use ||= v.use; o.dash ||= v.dash; o.throw ||= !!v.throw; }
  const m = Math.hypot(o.mx, o.my); if (m > 1) { o.mx /= m; o.my /= m; }
  return o;
}

function levelFrame(dt) {
  const sim = app.sim, view = app.view, host = net.role !== 'guest';
  const inp = input.poll();
  if (!app.paused || net.role !== 'solo') {
    for (const L of app.local) {
      const p = sim.players.find(q => q.id === L.pid); if (!p) continue;
      const c = combine(L.srcs, inp);
      const frozen = !sim.started || sim.over || (app.paused && net.role === 'solo');
      p.mx = frozen ? 0 : c.mx; p.my = frozen ? 0 : c.my;
      if (frozen) continue;
      if (host) {
        if (c.grab) { sim.grab(p); }
        p.using = c.use;
        if (c.dash) sim.dash(p);
        if (c.throw) sim.throwItem(p);
      } else {
        if (c.grab) { net.send({ k: 'act', pid: p.id, a: 'grab' }); sfx('pick'); }
        if (c.throw && p.held) net.send({ k: 'act', pid: p.id, a: 'throw' });
        if (c.use !== L.lastUse) net.send({ k: 'use', pid: p.id, on: c.use });
        if (c.dash) sim.dash(p);
      }
      L.lastUse = c.use;
    }
  }
  if (host) {
    if (!(app.paused && net.role === 'solo') && !app.hostPaused) sim.step(dt, true);
    else for (const p of sim.players) { p.moving = false; }
    for (const e of sim.events) { handleEvent(e); app.evOut.push(e); }
    sim.events.length = 0;
    if (net.role === 'host') {
      app.snapT += dt; app.keyT += dt;
      if (app.snapT > 1 / 12) {
        app.snapT = 0;
        if (app.keyT > 2) { app.keyT = 0; app.prevSnap = new Map(); }
        const s = sim.snapshot(app.prevSnap);
        net.broadcast({ k: 'snap', s, ev: app.evOut.filter(e => e.e !== 'dash').slice(-30) });
        app.evOut = [];
      }
    }
    if (sim.over && !app.over) finishLevel();
  } else {
    // гість: рухаємо тільки своїх, решту показуємо зі знімків
    for (const p of sim.players) if (app.myIds.has(p.id)) sim.movePlayer(p, dt);
    app.posT += dt;
    if (app.posT > 1 / 20) {
      app.posT = 0;
      for (const id of app.myIds) { const p = sim.players.find(q => q.id === id); if (p) net.send({ k: 'pos', pid: id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), fx: +p.fx.toFixed(2), fy: +p.fy.toFixed(2), mv: p.moving ? 1 : 0 }); }
    }
  }
  // звуки дій своїх кухарів
  for (const L of app.local) { const p = sim.players.find(q => q.id === L.pid); if (p && p.act === 'chop') sfx('chop'); if (p && p.act === 'wash') sfx('wash'); if (p && p.act === 'spray') sfx('spray'); }
  view.sync(dt, app.myIds);
  { const mine = app.sim.players.filter(p => app.myIds.has(p.id)); const n = mine.length;
    view.updateCam(dt, n ? mine.reduce((a, p) => a + p.x, 0) / n : null, n ? mine.reduce((a, p) => a + p.y, 0) / n : null); }
  view.render();
  hudFrame();
}
function handleEvent(e) {
  const v = app.view;
  if (v) v.onEvent(e);
  const S2 = { pick: 'pick', drop: 'drop', chopped: 'chopped', serve: 'serve', wrong: 'wrong', order: 'order', expired: 'expired', fire: 'fire', out: 'out', cooked: 'cooked', washed: 'washed', dash: 'dash', plate: 'plate', trash: 'trash', nope: 'nope', gate: 'gate', wind: 'wind', throw: 'throw', catch: 'pick', land: 'drop', catin: 'meow', steal: 'steal', scared: 'hiss' }[e.e];
  if (S2) {
    // підняти/покласти — лише для своїх, щоб не було какофонії
    if ((e.e === 'pick' || e.e === 'drop') && e.pid && !app.myIds.has(e.pid)) return;
    sfx(S2);
  }
  if (e.e === 'catin' && !app.catTold) { app.catTold = true; toast('🐱 Кіт Мурчало крадеться! Наздожени його ривком'); }
  if (e.e === 'catout' && e.stole) toast('🐱 Мурчало втік із продуктом!');
  if (e.e === 'wind') toast(e.dir > 0 ? '💨 Порив вітру → тримайтеся!' : '💨 ← Порив вітру, тримайтеся!');
  if (e.e === 'fire' && performance.now() - (app.fireToast || 0) > 8000) { app.fireToast = performance.now(); toast('🔥 Пожежа! Хапайте вогнегасник 🧯'); }
}

/* ---------- HUD ---------- */
function hudFrame() {
  const sim = app.sim;
  const tl = Math.ceil(sim.timeLeft);
  const tm = $('#timer');
  tm.textContent = Math.floor(tl / 60) + ':' + String(tl % 60).padStart(2, '0');
  tm.classList.toggle('low', tl <= 30 && sim.started && !sim.over);
  $('#score').textContent = '🪙 ' + sim.score;
  // годинник і поспіх
  if (sim.started && !sim.over) {
    if (tl <= 60 && !app.hurry) { app.hurry = true; sfx('hurry'); musicRate(1.22); toast('⏰ Остання хвилина!'); }
    if (tl <= 15 && tl !== app.lastSec && tl > 0) sfx(tl % 2 ? 'tick' : 'tock');
    app.lastSec = tl;
  }
  // замовлення
  const box = $('#orders'), seen = new Set();
  for (const o of sim.orders) {
    seen.add(o.id);
    let el = app.ordEls.get(o.id);
    if (!el) {
      el = document.createElement('div'); el.className = 'ord';
      el.innerHTML = `<div class="top"><span class="dish">${dishHTML(o.r)}</span><div class="parts">${recipeHTML(o.r)}</div></div><div class="tbar"><i></i></div>`;
      box.appendChild(el); app.ordEls.set(o.id, el);
    }
    const f = Math.max(0, o.t / o.T);
    const bar = el.querySelector('.tbar i'); bar.style.width = (f * 100) + '%'; bar.style.background = f > 0.5 ? '#3cb371' : f > 0.25 ? '#ffb020' : '#e5484d';
    el.classList.toggle('warn', f < 0.2);
  }
  for (const [id, el] of app.ordEls) if (!seen.has(id)) { el.remove(); app.ordEls.delete(id); }
  // пінг
  if (net.role !== 'solo') {
    const c = net.role === 'guest' ? net.hostConn : null;
    $('#ping').textContent = net.role === 'host' ? `👫 ${net.conns.length + 1} пристр.` : c ? `📶 ${Math.round(c.rtt)} ms${c.relay ? ' · через TURN' : ''}` : '📶 …';
  }
  // підказки
  const hint = $('#hint');
  const L = app.local[0], p = L && sim.players.find(q => q.id === L.pid);
  const showHint = S.set.hints && p && sim.started && !sim.over && (app.lvl.li <= 1 || (S.fails[LEVELS[app.lvl.li].id] || 0) > 0 || (app.lvl.assist > 0 && !app.lvl.kid));
  // підказка коротко зʼявляється, коли змінюється, і зникає, щоб не затуляти кухню
  if (showHint) {
    const h = hintFor(p);
    if (h !== app.hintTxt) { app.hintTxt = h; app.hintT = performance.now(); hint.textContent = h; }
    hint.classList.toggle('hide', !h || performance.now() - app.hintT > 4500);
  } else hint.classList.add('hide');
}
function hintFor(p) {
  const sim = app.sim, H = p.held;
  const touch = !input.pads().length;
  const G = touch ? '✋' : 'Ⓐ', U = touch ? '🔪' : 'Ⓧ';
  if (!H) {
    const t = sim.facing(p);
    if (t && t.type === 'board' && t.item && t.item.t === 'i' && t.item.s === 'r') return `Тримай ${U}, щоб нарізати`;
    if (t && t.type === 'crate') return `${G} — взяти ${ING[t.ing].name}`;
    if (t && t.type === 'sink' && t.dirty) return `Тримай ${U}, щоб помити тарілку`;
    if (app.lvl.assist > 0 && !app.lvl.kid && sim.tiles.some(t => t.item && t.item.t !== 'k' && sim.matchOrder(t.item))) return 'Робот приготував страву — віднеси її до віконця ▲';
    return 'Візьми продукти з ящика для замовлення ↖';
  }
  if (H.t === 'i') {
    if (H.s === 'r' && ING[H.id].chop) return `Поклади на дошку (${G}) і наріж`;
    return `Поклади на тарілку або в каструлю/пательню (${G})`;
  }
  if (H.t === 'p') { if (sim.matchOrder(H)) return 'Страва готова! Неси до віконця видачі ▲'; return 'Збери на тарілку все для страви'; }
  if (H.t === 'x') return `Направ на вогонь і тримай ${U}`;
  if (H.t === 'd') return 'Неси брудні тарілки до мийки';
  if (H.t === 'c') { if (sim.matchOrder(H)) return 'Напій готовий! Неси до віконця ▲'; return 'Постав кухоль в автомат (✋), а лід чи карамель бери з ящика, тримаючи кухоль'; }
  if (H.t === 'k') return 'Перелий у тарілку або постав назад на плиту';
  return '';
}
$('#bPause').onclick = () => { sfx('click'); openPause(); };
function openPause() {
  if (app.scene !== 'level') return;
  const host = net.role !== 'guest';
  if (net.role === 'solo') app.paused = true;
  const lv = LEVELS[app.lvl.li];
  openModal(`<h2>⏸ Пауза</h2>
    ${net.role !== 'solo' ? '<p class="sub">У грі разом час не зупиняється.</p>' : ''}
    <h3>Рецепти</h3>${recipesHTML(lv, app.lvl.drinks)}
    <p class="kbd">Керування: ✋ взяти/покласти · 🔪 тримати — різати, мити, гасити · 💨 ривок. Геймпад: Ⓐ взяти, Ⓧ дія, Ⓑ ривок. Клавіатура: WASD, пробіл, E, Shift.</p>
    <div class="btnrow">
      ${host ? '<button class="btn" id="pMap">🗺 На карту</button><button class="btn" id="pRe">↻ Заново</button>' : ''}
      <button class="btn" id="pSet">⚙️</button>
      <button class="btn pri" id="pGo">Продовжити ▶</button></div>`, () => { app.paused = false; });
  $('#pGo').onclick = () => { sfx('click'); closeModal(); };
  $('#pSet').onclick = () => { sfx('click'); closeModal(); openSettings(); };
  if ($('#pMap')) $('#pMap').onclick = () => { sfx('click'); closeModal(); endLevelCleanup(); goMap(); };
  if ($('#pRe')) $('#pRe').onclick = () => { sfx('click'); closeModal(); endLevelCleanup(); startLevel(app.lvl.li); };
}
function endLevelCleanup() { clearInterval(app.cntTimer); $('#count').classList.add('hide'); keepAwake(false); musicRate(1); app.over = true; }

/* ---------- кінець рівня ---------- */
function finishLevel() {
  app.over = true;
  const sim = app.sim, lv = LEVELS[app.lvl.li];
  const stars = sim.stars();
  const R = { k: 'result', li: app.lvl.li, score: sim.score, stars, dv: sim.delivered, fl: sim.failed, th: sim.thresholds(), assist: app.lvl.assist };
  if (stars > 0) { S.stars[lv.id] = Math.max(S.stars[lv.id] || 0, stars); S.best[lv.id] = Math.max(S.best[lv.id] || 0, sim.score); }
  else S.fails[lv.id] = (S.fails[lv.id] || 0) + 1;
  save();
  if (net.role === 'host') { syncMapState(); net.broadcast(R); net.broadcast({ k: 'map', ...mapState, silent: true }); }
  showResult(R);
}
function showResult(R) {
  endLevelCleanup();
  sfx('alarm');
  const lv = LEVELS[R.li], host = net.role !== 'guest';
  const next = R.li + 1 < LEVELS.length;
  const failedNoAssist = R.stars === 0 && !(+S.assist[lv.id] > 0) && host;
  setTimeout(() => {
    if (app.scene !== 'level') return;
    openModal(`<h2 style="text-align:center">${R.stars ? (R.stars === 3 ? 'Неймовірно! 🎉' : 'Смачно вийшло! 😋') : 'Ой, не встигли… 😅'}</h2>
      <div class="bigstars"><span>★</span><span>★</span><span>★</span></div>
      <table class="res"><tr><td>🍽 Подано страв</td><td>${R.dv}</td></tr><tr><td>⌛ Пропущено</td><td>${R.fl}</td></tr><tr><td>🪙 Очки</td><td>${R.score}</td></tr>
      <tr><td class="sub">Потрібно: ⭐${R.th[0]} · ⭐⭐${R.th[1]} · ⭐⭐⭐${R.th[2]}</td><td>${R.assist ? '🤖'.repeat(+R.assist || 1) : ''}</td></tr></table>
      ${R.stars ? dialogHTML(lv.outro) : '<p class="sub">Спробуйте ще раз! Діліть роботу: хтось ріже, хтось готує, хтось подає.</p>'}
      ${lv.finale && R.stars ? '<p style="text-align:center;font-size:40px">🎊🏆🎊</p><p style="text-align:center;font-weight:900">Ви пройшли всю подорож! Але можна зібрати ще більше зірок 😉</p>' : ''}
      ${failedNoAssist ? `<div class="assist"><span style="font-size:30px">🤖</span><div style="flex:1">Увімкнути робота-помічника? Він допомагатиме на кухні, поки рівень не пройдено.</div><button class="btn small green" id="rAssist">Увімкнути</button></div>` : ''}
      <div class="btnrow">${host ? `<button class="btn" id="rMap">🗺 Карта</button><button class="btn" id="rRe">↻ Ще раз</button>${R.stars && next ? '<button class="btn pri" id="rNext">Далі ▶</button>' : ''}` : `<span class="pill">⏳ Далі вирішує ${esc(hostName())}</span>`}</div>`);
    const sp = [...document.querySelectorAll('.bigstars span')];
    sp.forEach((s, i) => { if (i < R.stars) setTimeout(() => { s.classList.add('on'); sfx('star'); }, 350 + i * 450); });
    if ($('#rMap')) $('#rMap').onclick = () => { sfx('click'); closeModal(); goMap(); };
    if ($('#rRe')) $('#rRe').onclick = () => { sfx('click'); closeModal(); startLevel(R.li); };
    if ($('#rNext')) $('#rNext').onclick = () => { sfx('click'); closeModal(); goMap(R.li + 1); };
    if ($('#rAssist')) $('#rAssist').onclick = () => { S.assist[lv.id] = 1; save(); sfx('join'); closeModal(); startLevel(R.li); };
  }, 1400);
}

/* ================= налаштування ================= */
function openSettings() {
  const st = S.set;
  const back = app.scene === 'level' ? () => openPause() : null;
  openModal(`<h2>⚙️ Налаштування</h2>
    <div class="field"><label>🎵 Музика</label><input type="range" min="0" max="1" step="0.05" value="${st.music}" id="sMus"></div>
    <div class="field"><label>🔊 Звуки</label><input type="range" min="0" max="1" step="0.05" value="${st.sfx}" id="sSfx"></div>
    <h3>🌐 Мова</h3><div class="row" style="justify-content:flex-start">${LANGS.map(([c, f, n]) => `<button class="chip ${c === LANG ? 'on' : ''}" data-lang="${c}">${f} ${n}</button>`).join('')}</div>
    <h3>Керування</h3>
    <div class="assist" style="background:#fff"><div style="flex:1">📱 Сенсорне керування / клавіатура</div><button class="toggle ${st.touch ? 'on' : ''}" id="sTouch"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">👆👆 Двоє гравців на одному екрані<br><span class="sub" style="font-size:13px">Ліва й права половини екрана — окремі кухарі</span></div><button class="toggle ${st.shared ? 'on' : ''}" id="sShared"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">🎮 Перший геймпад керує мною<br><span class="sub" style="font-size:13px">Вимкнено: кожен геймпад — окремий кухарчик</span></div><button class="toggle ${st.padMode === 'me' ? 'on' : ''}" id="sPad"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">🍽 Зала з гостями й офіціант<br><span class="sub" style="font-size:13px">Вимкни, якщо пристрій гальмує</span></div><button class="toggle ${st.hall ? 'on' : ''}" id="sHall"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">🎯 Кидати продукти<br><span class="sub" style="font-size:13px">Як в Overcooked: кнопка 🎯, геймпад Ⓨ, клавіша Q. Можна ловити на льоту!</span></div><button class="toggle ${st.throw ? 'on' : ''}" id="sThrow"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">🧸 Дитячий режим<br><span class="sub" style="font-size:13px">Для найменших: роботи спритніші й самі подають страви, гості чекають довше, зірки легші</span></div><button class="toggle ${st.kid ? 'on' : ''}" id="sKid"></button></div>
    <div class="assist" style="background:#fff"><div style="flex:1">💡 Підказки на перших рівнях</div><button class="toggle ${st.hints ? 'on' : ''}" id="sHints"></button></div>
    <p class="kbd">Підключені геймпади: ${input.pads().map(p => esc(p.id.slice(0, 40))).join(', ') || 'немає (натисни кнопку на геймпаді, щоб браузер його побачив)'}</p>
    <h3>Прогрес</h3>
    <div class="row" style="justify-content:flex-start"><button class="btn small" id="sReset">🗑 Скинути прогрес</button></div>
    <div class="btnrow"><button class="btn pri" id="sOk">Готово</button></div>`, back);
  $('#sMus').oninput = e => { st.music = vol.music = +e.target.value; setVolumes(); save(); };
  $('#sSfx').oninput = e => { st.sfx = vol.sfx = +e.target.value; setVolumes(); sfx('pick'); save(); };
  const tog = (id, f) => { $(id).onclick = () => { f(); save(); sendLocals(); sfx('click'); $(id).classList.toggle('on'); }; };
  tog('#sTouch', () => st.touch = !st.touch);
  tog('#sShared', () => st.shared = !st.shared);
  tog('#sPad', () => st.padMode = st.padMode === 'me' ? 'own' : 'me');
  tog('#sHints', () => st.hints = !st.hints);
  tog('#sHall', () => st.hall = !st.hall);
  tog('#sThrow', () => st.throw = !st.throw);
  tog('#sKid', () => st.kid = !st.kid);
  document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
  $('#sReset').onclick = () => { if (confirm(tr('Скинути всі зірки й пройдені міста?'))) { S.stars = {}; S.best = {}; S.fails = {}; S.assist = {}; S.at = 0; save(); toast('Прогрес скинуто'); if (app.scene === 'map') goMap(); } };
  $('#sOk').onclick = () => { sfx('click'); closeModal(); };
}

function setLang(c) {
  if (c === LANG) return;
  S.set.lang = c; save();
  if (app.scene === 'level') { toast('✓'); return; } // застосується після рівня
  location.reload();
}
/* ================= гра разом ================= */
function updateNetPill() {
  const p = $('#netPill');
  if (net.role === 'solo') p.textContent = '👫 сам';
  else if (net.role === 'host') p.textContent = `👫 ${net.conns.length + 1} · ${net.code || 'офлайн'}`;
  else p.textContent = `👫 у ${hostName()}`;
  updateChatBtns();
}
function turnCfg() { const t = S.set.turn; return (t.meteredUrl || t.turnUrl) ? t : null; }
function inviteLink() {
  const u = new URL(location.href.split('?')[0].split('#')[0]);
  u.searchParams.set('join', net.code);
  const t = turnCfg(); if (t) u.searchParams.set('t', btoa(unescape(encodeURIComponent(JSON.stringify(t)))));
  return u.toString();
}
/* ---------- вибір слота збереження ---------- */
function openSlots(back) {
  stashSlot();
  const busy = net.role !== 'solo';
  const rows = S.slots.map((o, i) => `<div class="slotrow ${i === S.slot ? 'on' : ''}">
      <input data-sn="${i}" maxlength="18" value="${esc(o.name || '')}" placeholder="Слот ${i + 1}">
      <span class="sub">⭐ ${slotStars(o)}${o.room ? ' · 🏠 ' + o.room : ''}</span>
      ${i === S.slot ? '<span class="sub">✓ зараз</span>' : `<button class="btn small blue" data-sp="${i}">Грати</button>`}
      ${S.slots.length > 1 ? `<button class="btn small" data-sd="${i}" title="Видалити">🗑</button>` : ''}
    </div>`).join('');
  openModal(`<h2>💾 Збереження</h2>
    <p class="kbd">Кожен слот — свій прогрес на карті й своя постійна кімната з окремим кодом. Наприклад: «Сам», «З племінницями», «З дружиною». Назву можна змінити, просто торкнувшись її.</p>
    ${busy ? '<p class="status bad">Щоб змінити слот, спершу вийди з кімнати («Гра разом»).</p>' : ''}
    ${rows}
    <div class="btnrow">${S.slots.length < MAX_SLOTS && !busy ? '<button class="btn" id="slNew">➕ Новий слот</button>' : ''}<button class="btn pri" id="slOk">Готово</button></div>`, back);
  document.querySelectorAll('[data-sn]').forEach(inp => inp.onchange = () => { S.slots[+inp.dataset.sn].name = inp.value.trim().slice(0, 18); save(); buildMe(); });
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
    if (busy) { sfx('nope'); return; }
    loadSlot(+b.dataset.sp); sfx('join'); toast(tr('Слот: ') + slotName()); buildMe(); openSlots(back);
  });
  document.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => {
    const i = +b.dataset.sd; if (busy && i === S.slot) { sfx('nope'); return; }
    if (!confirm(tr('Видалити слот «') + (S.slots[i].name || i + 1) + tr('» разом із його прогресом?'))) return;
    if (i === S.slot) loadSlot(i === 0 ? 1 : 0);
    S.slots.splice(i, 1); if (i < S.slot) S.slot--; save(); buildMe(); openSlots(back);
  });
  if ($('#slNew')) $('#slNew').onclick = () => { S.slots.push({ name: tr('Слот ') + (S.slots.length + 1) }); loadSlot(S.slots.length - 1); sfx('join'); buildMe(); openSlots(back); };
  $('#slOk').onclick = () => { sfx('click'); closeModal(); if (app.scene === 'map') goMap(); };
}

/* ---------- чат ---------- */
const QUICK = ['Привіт! 👋', 'Граємо? 😋', 'Ще раз!', 'Неси тарілки! 🍽', 'Я ріжу 🔪', 'Помий посуд 🧽', 'Пожежа! 🔥', 'Супер! 🎉', 'Дякую! ❤', 'Па-па! 👋'];
const chat = { list: [], open: false, unread: 0 };
function chatAdd(m, mine) {
  chat.list.push({ ...m, mine }); if (chat.list.length > 80) chat.list.shift();
  if (chat.open) renderChat();
  else if (!mine) {
    chat.unread++; updateChatBtns(); sfx('msg');
    const d = document.createElement('div');
    d.innerHTML = `<b style="color:#${COOK_COLORS[(m.c | 0) % 6].c.toString(16).padStart(6, '0')}">${esc(m.n)}:</b>${esc(m.t)}`;
    d.onclick = () => openChat();
    $('#chatPop').appendChild(d); while ($('#chatPop').children.length > 3) $('#chatPop').firstChild.remove();
    setTimeout(() => d.remove(), 6000);
  }
}
function chatSys(t) { chat.list.push({ sys: true, t }); if (chat.open) renderChat(); }
function sendChat(text) {
  text = String(text || '').trim().slice(0, 200); if (!text || net.role === 'solo') return;
  const m = { k: 'chat', n: myName(), c: S.color, t: text };
  if (net.role === 'host') net.broadcast(m); else net.send(m);
  chatAdd(m, true); sfx('click');
}
function renderChat() {
  const L = $('#chList');
  L.innerHTML = chat.list.map(m => m.sys ? `<div class="cmsg sys">${esc(m.t)}</div>` : `<div class="cmsg ${m.mine ? 'me' : ''}"><b style="color:#${COOK_COLORS[(m.c | 0) % 6].c.toString(16).padStart(6, '0')}">${esc(m.n)}</b>${esc(m.t)}</div>`).join('') || `<div class="cmsg sys">${tr('Тут поки тихо. Напиши щось!')}</div>`;
  L.scrollTop = L.scrollHeight;
}
function openChat() {
  chat.open = true; chat.unread = 0; updateChatBtns(); $('#chatPop').innerHTML = '';
  $('#chat').classList.remove('hide'); renderChat();
  $('#chQuick').innerHTML = QUICK.map((q, i) => `<button data-q="${i}">${q}</button>`).join('');
}
function closeChat() { chat.open = false; $('#chat').classList.add('hide'); $('#chIn').blur(); }
function updateChatBtns() {
  const on = net.role !== 'solo';
  for (const b of document.querySelectorAll('.chatb')) {
    b.classList.toggle('hide', !on);
    const g = b.querySelector('.badge'); g.textContent = chat.unread > 9 ? '9+' : chat.unread; g.classList.toggle('hide', !chat.unread);
  }
  if (!on && chat.open) closeChat();
}
$('#mChat').onclick = $('#hChat').onclick = () => { sfx('click'); chat.open ? closeChat() : openChat(); };
$('#chClose').onclick = () => { sfx('click'); closeChat(); };
$('#chQuick').onclick = e => { const b = e.target.closest('[data-q]'); if (b) sendChat(tr(QUICK[+b.dataset.q])); };
$('#chForm').onsubmit = e => { e.preventDefault(); sendChat($('#chIn').value); $('#chIn').value = ''; };

let coopTab = 'online', coopCleanup = null;
function openCoop(tab) {
  if (tab) coopTab = tab;
  if (coopCleanup) { coopCleanup(); coopCleanup = null; }
  const r = net.role;
  const plist = (r === 'host' ? rosterSummary() : (app.guestRoster || [])).map((d, i) => `<div><span class="dot" style="background:#${COOK_COLORS[i % 6].c.toString(16).padStart(6, '0')}"></span>${esc(d.name)}${d.n > 1 ? ' ×' + d.n : ''}${i === 0 ? ' 👑' : ''}</div>`).join('');
  let body = '';
  if (coopTab === 'online') {
    if (r === 'solo') body = `
      <p>Один створює кімнату й надсилає посилання або код. Можна грати з будь-якої країни — потрібен лише інтернет.</p>
      <div class="slotrow"><span style="flex:1">💾 <b>${esc(slotName())}</b> · ⭐ ${slotStars(S.slots[S.slot])}</span><button class="btn small" id="oSlot">Змінити слот</button></div>
      <div class="btnrow" style="justify-content:flex-start"><button class="btn pri" id="oHost">🏠 Створити кімнату${S.room ? ' ' + S.room : ''}</button></div>
      <div class="field"><label>Або введи код кімнати:</label><input id="oCode" inputmode="numeric" maxlength="4" placeholder="1234" value="${esc(S.lastJoin || '')}"></div>
      <div class="btnrow" style="justify-content:flex-start"><button class="btn blue" id="oJoin">🚪 Приєднатися</button></div>
      <p class="status" id="oSt"></p>`;
    else if (r === 'host') body = `
      <p class="sub">Код твоєї кімнати:</p><div class="code">${net.code || '—'}</div>
      ${net.code ? `<div class="btnrow" style="justify-content:flex-start"><button class="btn blue" id="oShare">📤 Надіслати код</button></div><p class="kbd">Гостям достатньо ввести цей код у грі: «Гра разом» → «Приєднатися».</p>` : ''}
      <h3>Гравці (${countHumans()} з 6 кухарів)</h3><div class="plist">${plist}</div>`;
    else body = `<p>Ти в кімнаті <b>${esc(net.code || '')}</b> у ${esc(hostName())}.</p><div class="plist">${plist}</div>`;
    body += `<h3>🌍 Гра через кордон (TURN)</h3>
      <p class="kbd">Якщо зʼєднання не вдається (мобільний інтернет, суворий роутер), додай безкоштовний TURN-сервер: Metered.ca (посилання з apiKey) або ExpressTURN (адреса, логін, пароль). Хосту достатньо налаштувати тут — гості отримають це разом із запрошенням.</p>
      <div class="field"><label>Metered: посилання на credentials</label><input id="tMet" placeholder="https://назва.metered.live/api/v1/turn/credentials?apiKey=..." value="${esc(S.set.turn.meteredUrl)}"></div>
      <div class="field"><label>або TURN-адреси (через кому)</label><input id="tUrl" placeholder="turn:relay1.expressturn.com:3478, turns:relay1.expressturn.com:443?transport=tcp" value="${esc(S.set.turn.turnUrl)}"></div>
      <div class="row"><div class="field" style="flex:1"><label>Логін</label><input id="tUser" value="${esc(S.set.turn.turnUser)}"></div><div class="field" style="flex:1"><label>Пароль</label><input id="tPass" value="${esc(S.set.turn.turnPass)}"></div></div>
      <div class="row" style="justify-content:flex-start"><button class="btn small" id="tTest">🧪 Перевірити зв'язок</button><span class="status" id="tSt"></span></div>`;
  } else {
    if (r === 'guest') body = `<p>Ти вже в кімнаті у ${esc(hostName())}.</p>`;
    else body = `
      <p><b>Без інтернету</b>: усі пристрої в одній Wi‑Fi мережі (можна роутер без інтернету або точку доступу з телефона). Дані йдуть напряму між пристроями.</p>
      <div class="btnrow" style="justify-content:flex-start">
        <button class="btn pri" id="fHost">➕ Я хост: додати гравця</button>
        ${r === 'solo' ? '<button class="btn blue" id="fJoin">📷 Я гість: приєднатися</button>' : ''}
      </div>
      ${r === 'host' ? `<h3>Гравці (${countHumans()} з 6 кухарів)</h3><div class="plist">${plist}</div>` : ''}
      <div id="fArea"></div>
      <p class="kbd">Кожного гостя додаємо по черзі: хост показує QR → гість сканує й показує свій QR → хост сканує. Камера потрібна на обох.</p>`;
  }
  openModal(`<h2>👫 Гра разом</h2>
    <div class="tabs"><button class="${coopTab === 'online' ? 'on' : ''}" id="tbOn">🌐 Через інтернет</button><button class="${coopTab === 'offline' ? 'on' : ''}" id="tbOff">📶 Без інтернету</button></div>
    ${body}
    <div class="btnrow">${r !== 'solo' ? `<button class="btn" id="oLeave">${r === 'host' ? 'Закрити кімнату' : 'Вийти з кімнати'}</button>` : ''}<button class="btn pri" id="oOk">${r === 'solo' ? 'Назад' : 'Грати ▶'}</button></div>`,
    () => { if (coopCleanup) { coopCleanup(); coopCleanup = null; } cameraOff(); });
  $('#tbOn').onclick = () => openCoop('online');
  $('#tbOff').onclick = () => openCoop('offline');
  $('#oOk').onclick = () => { sfx('click'); closeModal(); if (net.role !== 'solo' && app.scene === 'title') goMap(); };
  if ($('#oLeave')) $('#oLeave').onclick = () => { leaveRoom(); openCoop(); };
  if ($('#oHost')) $('#oHost').onclick = () => hostRoom();
  if ($('#oSlot')) $('#oSlot').onclick = () => { sfx('click'); openSlots(); };
  if ($('#oJoin')) $('#oJoin').onclick = () => joinRoom($('#oCode').value);
  if ($('#oShare')) $('#oShare').onclick = async () => {
    const link = location.href.split('?')[0].split('#')[0], text = tr(`Давай готувати разом у «Кухарчатах»! 🍳 Код кімнати:`) + ` ${net.code}\n` + tr('Відкрий гру з іконки → «Гра разом» → введи код → «Приєднатися».') + `\n` + tr('Якщо гри ще немає:') + ` ${link}`;
    try { if (navigator.share) await navigator.share({ title: tr('Кухарчата'), text }); else { await navigator.clipboard.writeText(text); toast('Посилання скопійовано'); } } catch (_) { }
  };
  if ($('#tMet')) {
    const saveT = () => { Object.assign(S.set.turn, { meteredUrl: $('#tMet').value.trim(), turnUrl: $('#tUrl').value.trim(), turnUser: $('#tUser').value.trim(), turnPass: $('#tPass').value.trim() }); save(); };
    ['#tMet', '#tUrl', '#tUser', '#tPass'].forEach(id => $(id).onchange = saveT);
    $('#tTest').onclick = async () => { saveT(); $('#tSt').textContent = 'Перевіряю…'; $('#tSt').className = 'status'; const r = await testTurn(); $('#tSt').textContent = r; $('#tSt').className = 'status ' + (/(PeerJS|OpenRelay|свій TURN) ✓/.test(r) ? 'ok' : 'bad'); };
  }
  if ($('#fHost')) $('#fHost').onclick = () => offlineHostFlow();
  if ($('#fJoin')) $('#fJoin').onclick = () => offlineGuestFlow();
}
// перевіряємо кожен ретранслятор окремо: STUN (пряме), PeerJS, Open Relay, свій
async function testTurn() {
  const all = await net.iceServers(turnCfg());
  const probe = async (srv, relay) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [srv], iceTransportPolicy: relay ? 'relay' : 'all' });
      pc.createDataChannel('t');
      let got = false;
      pc.onicecandidate = e => { if (e.candidate && (relay ? / relay /.test(e.candidate.candidate) : / srflx /.test(e.candidate.candidate))) got = true; };
      await pc.setLocalDescription(await pc.createOffer());
      await new Promise(r => setTimeout(r, 5000));
      pc.close(); return got;
    } catch (_) { return false; }
  };
  const names = ['STUN', 'PeerJS', 'OpenRelay', 'свій TURN', 'свій TURN 2'];
  const [sig, ...res] = await Promise.all([net.signalTest(), ...all.map((srv, i) => probe(srv, i > 0))]);
  return `Сервер ${sig ? '✓' : '✗'} · ` + res.map((ok, i) => `${names[i] || 'TURN'} ${ok ? '✓' : '✗'}`).join(' · ');
}
function setSt(msg, bad) { const e = $('#oSt'); if (e) { e.textContent = msg; e.className = 'status ' + (bad ? 'bad' : 'ok'); } }
async function hostRoom(retry = false) {
  audioInit();
  if (!S.room || retry) { S.room = String(1000 + Math.floor(Math.random() * 9000)); save(); }
  setSt('Створюю кімнату…');
  try { await net.hostOnline(S.room, turnCfg()); sfx('join'); afterHostStart(); openCoop(); }
  catch (e) {
    if (e && e.type === 'unavailable-id' && !retry) return hostRoom(true);
    setSt(e && e.type === 'network' || e && e.type === 'server-error' ? 'Немає звʼязку із сервером. Спробуй «Без інтернету».' : 'Не вдалося створити кімнату.', true);
  }
}
function afterHostStart() { app.hostName = myName(); updateNetPill(); }
async function joinRoom(code) {
  code = String(code || '').replace(/\D/g, '');
  if (code.length !== 4) { setSt('Введи 4 цифри коду', true); return; }
  audioInit(); S.lastJoin = code; save();
  setSt('Підключаюсь…');
  try { await net.joinOnline(code, turnCfg()); afterGuestJoin(); }
  catch (e) {
    setSt(e && e.type === 'signal' ? 'Немає звʼязку із сервером-посередником (PeerJS). Перевір інтернет і спробуй ще раз за хвилину.' : e && e.type === 'peer-unavailable' ? 'Кімнату не знайдено. Перевір код і чи відкрита гра в хоста.' : e && e.type === 'timeout' ? 'Не вдалося зʼєднатися. Спробуйте додати TURN-сервер (нижче).' + (e.info ? ' [' + e.info + ']' : '') : 'Не вдалося підключитися.', true);
  }
}
function afterGuestJoin() {
  sfx('join');
  net.send({ k: 'hello', dev: SID, name: myName(), locals: localCooks().map(({ lid, name, color, hat }) => ({ lid, name, color, hat })) });
  toast('Ти в кімнаті! 👫');
  closeModal();
  if (app.scene === 'level') { endLevelCleanup(); }
  goMap();
}
function leaveRoom() {
  if (net.role === 'host') net.broadcast({ k: 'bye' });
  net.leave(); roster.length = 0; app.guestRoster = null; updateNetPill();
  if (app.scene === 'map') goMap();
}

/* ---------- без інтернету ---------- */
async function offlineHostFlow() {
  const area = $('#fArea');
  area.innerHTML = '<p class="status">Вмикаю камеру…</p>';
  try { await cameraOn(); } catch (_) { area.innerHTML = '<p class="status bad">Потрібен дозвіл на камеру.</p>'; return; }
  area.innerHTML = '<p class="status">Готую код…</p>';
  let inv;
  try { inv = await net.offlineOffer(); } catch (e) { area.innerHTML = '<p class="status bad">Не вдалося створити запрошення.</p>'; return; }
  if (net.role === 'solo') { net.role = 'host'; afterHostStart(); }
  const cv = await qrCanvas(inv.code, 340);
  area.innerHTML = `<h3>1. Гість сканує цей код</h3><div class="qrbox"></div><h3>2. Скануй відповідь гостя</h3><button class="btn blue" id="fScan">📷 Сканувати відповідь</button><video class="scan hide" id="fVid"></video><p class="status" id="fSt"></p>`;
  area.querySelector('.qrbox').appendChild(cv);
  $('#fScan').onclick = async () => {
    const v = $('#fVid'); v.classList.remove('hide'); $('#fScan').classList.add('hide');
    const stop = await scanQR(v, async code => {
      $('#fSt').textContent = 'Зʼєдную…';
      try { await inv.accept(code); $('#fSt').textContent = 'Гравець приєднався! ✓'; sfx('join'); cameraOff(); setTimeout(() => app.modal && openCoop('offline'), 900); }
      catch (_) { $('#fSt').textContent = 'Не вдалося зʼєднатися. Перевір, що ви в одній Wi‑Fi мережі.'; $('#fSt').className = 'status bad'; }
    }, 'K');
    coopCleanup = () => { stop(); inv.cancel && net.conns.length === 0 && inv.cancel(); };
  };
}
async function offlineGuestFlow() {
  const area = $('#fArea');
  area.innerHTML = `<h3>1. Наведи камеру на QR-код хоста</h3><video class="scan" id="fVid"></video><p class="status" id="fSt"></p>`;
  let stop = () => { };
  try {
    stop = await scanQR($('#fVid'), async code => {
      $('#fSt').textContent = 'Готую відповідь…';
      try {
        const ans = await net.offlineAnswer(code);
        const cv = await qrCanvas(ans.code, 340);
        area.innerHTML = `<h3>2. Покажи цей код хосту</h3><div class="qrbox"></div><p class="status" id="fSt">Чекаю, поки хост відсканує…</p>`;
        area.querySelector('.qrbox').appendChild(cv);
        await ans.opened; cameraOff();
        afterGuestJoin();
      } catch (_) { const s = $('#fSt'); if (s) { s.textContent = 'Не вдалося. Спробуйте ще раз (новий код у хоста).'; s.className = 'status bad'; } }
    }, 'K');
  } catch (_) { $('#fSt').textContent = 'Потрібен дозвіл на камеру.'; $('#fSt').className = 'status bad'; }
  coopCleanup = () => stop();
}

/* ---------- повідомлення мережі ---------- */
net.listen('join', conn => { /* чекаємо hello */ });
net.listen('leave', conn => {
  const i = roster.findIndex(d => d.conn === conn);
  if (i >= 0) {
    const d = roster[i]; roster.splice(i, 1); toast(`${d.name} відʼєднався`);
    if (app.scene === 'level' && app.sim) { for (const p of [...app.sim.players]) if (p.dev === d.dev) app.sim.removePlayer(p.id); net.broadcast({ k: 'players', list: playersMeta() }); }
    broadcastRoster();
  }
  updateNetPill();
});
net.listen('lost', () => {
  toast('Звʼязок із хостом втрачено 😢', 4000);
  app.guestRoster = null; updateNetPill();
  if (app.scene === 'level') { endLevelCleanup(); closeModal(); }
  goMap();
});
function playersMeta() { return app.sim.players.map(p => ({ id: p.id, dev: p.dev, name: p.name, color: p.color, hat: p.hat, bot: !!p.isBot })); }
net.listen('data', (conn, d) => { if (net.role === 'host') hostMsg(conn, d); else guestMsg(d); });

function hostMsg(conn, d) {
  const dev = roster.find(x => x.conn === conn);
  switch (d.k) {
    case 'hello': {
      let e = roster.find(x => x.dev === d.dev);
      if (e) e.conn = conn; else { e = { dev: d.dev, conn, name: d.name, locals: d.locals || [] }; roster.push(e); }
      e.name = d.name; e.locals = d.locals || [];
      toast(`${d.name} приєднався! 👫`); sfx('join'); chatSys(d.name + tr(' приєднався'));
      syncMapState();
      conn.send({ k: 'welcome', hostName: myName(), map: mapState, roster: rosterSummary() });
      broadcastRoster();
      if (app.scene === 'level' && app.sim && !app.over) { // приєднання посеред рівня
        const used = new Set(app.sim.players.map(p => p.color));
        for (const l of e.locals) {
          if (app.sim.players.filter(p => !p.isBot).length >= 6) break;
          const id = e.dev + ':' + l.lid; if (app.sim.players.some(p => p.id === id)) continue;
          let c = l.color; for (let k = 0; k < 6 && used.has(c); k++) c = (c + 1) % 6; used.add(c);
          const p = app.sim.addPlayer({ id, name: l.name, color: c, hat: l.hat, remote: true }); p.dev = e.dev;
        }
        conn.send({ ...app.lvl, k: 'start', players: playersMeta(), late: true });
        conn.send({ k: 'snap', s: app.sim.snapshot(null), ev: [] });
        net.broadcast({ k: 'players', list: playersMeta() }, conn);
      } else if (app.modal && app.modal.card !== undefined) conn.send({ k: 'card', li: app.modal.card, humans: countHumans() });
      if (app.modal && app.modal.card !== undefined) openCard(app.modal.card);
      if (app.modal && app.modal.card === undefined && $('#tbOn')) openCoop();
      break;
    }
    case 'locals': if (dev) { dev.locals = d.locals || []; dev.name = d.name || dev.name; broadcastRoster(); if (app.modal && app.modal.card !== undefined) openCard(app.modal.card); } break;
    case 'pos': { const p = app.sim && app.sim.players.find(q => q.id === d.pid); if (p && p.remote) { p.tx = d.x; p.ty = d.y; if (Math.hypot(p.x - d.x, p.y - d.y) > 2) { p.x = d.x; p.y = d.y; } p.fx = d.fx; p.fy = d.fy; p.moving = !!d.mv; } break; }
    case 'act': { const p = app.sim && app.sim.players.find(q => q.id === d.pid); if (p && app.sim.started && !app.sim.over) { if (d.a === 'grab') app.sim.grab(p); if (d.a === 'throw') app.sim.throwItem(p); } break; }
    case 'use': { const p = app.sim && app.sim.players.find(q => q.id === d.pid); if (p) p.using = !!d.on; break; }
    case 'chat': { const m = { k: 'chat', n: String(d.n || '').slice(0, 20), c: d.c | 0, t: String(d.t || '').slice(0, 200) }; if (!m.t) break; net.broadcast(m, conn); chatAdd(m, false); break; }
  }
}
function guestMsg(d) {
  switch (d.k) {
    case 'welcome': app.hostName = d.hostName; app.guestRoster = d.roster; Object.assign(mapState, d.map); if (app.scene === 'map') goMap(); updateNetPill(); break;
    case 'roster': app.guestRoster = d.list; app.guestHumans = d.list.reduce((a, x) => a + x.n, 0); updateNetPill(); if (app.modal && $('#tbOn')) openCoop(); break;
    case 'map': Object.assign(mapState, { at: d.at, stars: d.stars, unlocked: d.unlocked }); if (app.scene === 'map' && !d.silent) goMap(); break;
    case 'drive': if (app.scene === 'map' && app.map) { closeModal(); mapState.at = d.to; app.map.driveTo(d.to, () => { }); } break;
    case 'card': app.guestHumans = d.humans; app.guestDrinks = d.drinks; if (app.scene !== 'map') { goMap(); } if (app.map) app.map.place(d.li); openCard(d.li); break;
    case 'closecard': if (app.modal && app.modal.card !== undefined) closeModal(); break;
    case 'start': app.hostName = d.hostName || app.hostName; beginLevel(d); break;
    case 'players': if (app.sim) for (const m of d.list) { let p = app.sim.players.find(q => q.id === m.id); if (!p) { p = app.sim.addPlayer({ id: m.id, remote: true }); } Object.assign(p, { name: m.name, color: m.color, hat: m.hat, dev: m.dev, isBot: m.bot }); } break;
    case 'snap':
      if (app.scene === 'level' && app.sim) {
        const wasStarted = app.sim.started;
        app.sim.applySnapshot(d.s, app.myIds);
        if (!wasStarted && app.sim.started) { $('#count').classList.add('hide'); }
        for (const e of d.ev || []) handleEvent(e);
      }
      break;
    case 'result':
      if (d.stars) { const id = LEVELS[d.li].id; S.stars[id] = Math.max(S.stars[id] || 0, d.stars); save(); }
      if (app.scene === 'level') { app.over = true; showResult(d); }
      break;
    case 'chat': chatAdd({ n: String(d.n || '').slice(0, 20), c: d.c | 0, t: String(d.t || '').slice(0, 200) }, false); break;
    case 'bye': chatSys(tr('Кімнату закрито')); toast(`${hostName()} закрив кімнату`); net.leave(); app.guestRoster = null; updateNetPill(); if (app.scene === 'level') endLevelCleanup(); closeModal(); goMap(); break;
  }
}

/* ================= цикл ================= */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  title.cam.aspect = w / h; title.cam.updateProjectionMatrix();
  if (app.map) app.map.resize(w, h);
  if (app.view) app.view.fit(w, h, w < 700 ? 0.2 : 0.15, 0.03);
}
addEventListener('resize', resize);
function zoomBy(f) { if (app.scene !== 'level' || !app.view) return; app.zoom = app.view.setZoom((app.zoom || 1) * f); sfx('click'); }
$('#bZin').onclick = () => zoomBy(1.3);
$('#bZout').onclick = () => zoomBy(1 / 1.3);
addEventListener('wheel', e => { if (app.scene === 'level' && app.view) { app.zoom = app.view.setZoom((app.zoom || 1) * Math.exp(-e.deltaY * 0.0015)); } }, { passive: true });
addEventListener('keydown', e => { if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return; if (e.key === '+' || e.key === '=') zoomBy(1.3); else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.3); });
addEventListener('orientationchange', () => setTimeout(resize, 300));
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const nav = input.takeNav();
  if (app.scene === 'title') { titleFrame(dt); padMenu(nav); }
  else if (app.scene === 'map') {
    app.map.update(dt); app.map.render();
    if (!app.modal && net.role !== 'guest' && !app.map.route) for (const n of nav) {
      if (n === 'right' || n === 'up') driveAndCard(Math.min(mapState.unlocked, mapState.at + 1));
      else if (n === 'left' || n === 'down') driveAndCard(Math.max(0, mapState.at - 1));
      else if (n === 'a') openCard(mapState.at);
      else if (n === 'b' || n === 'start') goTitle();
    } else padMenu(nav);
  }
  else if (app.scene === 'level') {
    levelFrame(dt);
    if (nav.includes('start')) { if (app.modal) closeModal(); else openPause(); }
    else if (app.modal) padMenu(nav);
  }
}
// геймпад у меню: Ⓐ — головна кнопка, Ⓑ — назад
function padMenu(nav) {
  for (const n of nav) {
    if (n === 'a') {
      const b = app.modal ? $('#mcard .btn.pri') : app.scene === 'title' ? $('#bPlay') : null;
      if (b) { audioInit(); b.click(); }
    } else if (n === 'b' && app.modal) { const b = $('#mcard #cBack, #mcard #oOk, #mcard #sOk, #mcard #pGo'); if (b) b.click(); else closeModal(); }
  }
}
$('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal' && app.modal && app.modal.card === undefined && app.scene !== 'level') closeModal(); });

/* ---------- старт ---------- */
document.addEventListener('visibilitychange', () => { if (!document.hidden) net.wake(); if (document.hidden && app.scene === 'level' && net.role === 'solo' && !app.modal) openPause(); if (!document.hidden && app.scene === 'level') keepAwake(true); });
document.addEventListener('pointerdown', () => audioInit(), { once: true });
initLang(S.set.lang);
goTitle();
resize();
requestAnimationFrame(frame);
// запрошення за посиланням: ?join=1234&t=...
{
  const q = new URLSearchParams(location.search);
  if (q.get('t')) { try { Object.assign(S.set.turn, JSON.parse(decodeURIComponent(escape(atob(q.get('t')))))); save(); } catch (_) { } }
  if (q.get('join')) {
    S.lastJoin = q.get('join').replace(/\D/g, '').slice(0, 4); save();
    history.replaceState(null, '', location.pathname);
    setTimeout(() => { openCoop('online'); toast('Впиши своє імʼя на головному екрані, а тоді натисни «Приєднатися»', 4500); }, 400);
  }
}
window.__k = { app, S, net, startLevel, goMap, afterGuestJoin, afterHostStart }; window.__LV = LEVELS.map(l => l.id); // для налагодження
