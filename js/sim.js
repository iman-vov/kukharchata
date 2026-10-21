// Кухарчата — симуляція кухні (без графіки). Працює і в браузері, і в Node для тестів.
import { ING, COOKER, COOK_OF_STATE, RECIPES, LEVELS } from './data.js';

export const PLAYER_R = 0.3;
const SPEED = 4.3, DASH_V = 12, DASH_T = 0.13, DASH_CD = 0.65;
const CHOP_T = 1.5, WASH_T = 1.8, RETURN_T = 5, CONV_T = 0.9, SPREAD_T = 8;
const CONV = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };

// Скільки «роботи» дає n кухарів (кухня тісніша, тому не лінійно)
export const TEAM = [0, 1, 1.6, 2.1, 2.55, 2.9, 3.2];

/* ---------- предмети ---------- */
export const mkIng = (id, s = 'r') => ({ t: 'i', id, s, p: 0 });
export const mkPlate = () => ({ t: 'p', c: [] });
export const mkCooker = k => ({ t: 'k', k, c: [], ct: 0, ov: 0 });
export const key = (id, s) => id + ':' + s;

export function cookerNeed(ck) { return COOKER[ck.k].per * ck.c.length; }
export function cookerState(ck) {
  if (!ck.c.length) return 'empty';
  if (ck.c.some(i => i.s === 'x')) return 'burnt';
  const out = COOKER[ck.k].out;
  if (ck.c.every(i => i.s === out)) return 'done';
  return 'cooking';
}

function ms(list) { const m = new Map(); for (const k of list) m.set(k, (m.get(k) || 0) + 1); return m; }
function isSub(a, b) { const mb = ms(b); for (const [k, n] of ms(a)) if ((mb.get(k) || 0) < n) return false; return true; }
function sameMs(a, b) { return a.length === b.length && isSub(a, b); }

// Шлях стану: як дійти від сирого до потрібного
export function pathOf(id, fs) {
  if (fs === 'r') return ['r'];
  if (fs === 'c') return ['r', 'c'];
  const pre = ING[id][COOK_OF_STATE[fs]];
  return pre === 'c' ? ['r', 'c', fs] : ['r', fs];
}
const onPath = (id, fs, s) => pathOf(id, fs).includes(s);
const nextState = (id, fs, s) => { const p = pathOf(id, fs); const i = p.indexOf(s); return i >= 0 && i < p.length - 1 ? p[i + 1] : null; };

/* ---------- розбір кухні ---------- */
export function parseLevel(lv) {
  const g = lv.grid, h = g.length, w = g[0].length;
  const tiles = [], spawns = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = g[y][x] || ' ';
    const t = { x, y, ch, type: 'counter', item: null, fire: 0 };
    if (ch === ' ') t.type = 'void';
    else if (ch === '.' || ch === '@') { t.type = 'floor'; if (ch === '@') spawns.push([x, y]); }
    else if (ch === 'C') t.type = 'board';
    else if (ch === 'S') { t.type = 'stove'; t.item = mkCooker('pot'); }
    else if (ch === 'F') { t.type = 'stove'; t.item = mkCooker('pan'); }
    else if (ch === 'O') { t.type = 'oven'; t.ck = mkCooker('oven'); }
    else if (ch === 'W') { t.type = 'sink'; t.dirty = 0; t.clean = 0; t.wp = 0; }
    else if (ch === 'P') { t.type = 'plates'; t.clean = lv.plates; t.dirty = 0; }
    else if (ch === 'D') t.type = 'serve';
    else if (ch === 'T') t.type = 'trash';
    else if (ch === 'E') { t.type = 'counter'; t.item = { t: 'x' }; }
    else if (CONV[ch]) { t.type = 'conv'; t.dir = CONV[ch]; t.ct = 0; }
    else if (ch >= '1' && ch <= '9') { t.type = 'crate'; t.ing = lv.crates[ch]; }
    tiles.push(t);
  }
  return { w, h, tiles, spawns };
}

export function levelScaling(lv, humans) {
  const n = Math.max(1, Math.min(6, humans));
  const tf = TEAM[n];
  return {
    iv: lv.iv / tf,
    maxO: Math.min(6, lv.maxO + Math.round((tf - 1) * 0.9)),
    ordT: lv.ordT,
  };
}

/* ================================================================ */
export class Sim {
  constructor(levelIndex, opts = {}) {
    this.li = levelIndex;
    this.lv = LEVELS[levelIndex];
    const P = parseLevel(this.lv);
    Object.assign(this, P);
    this.humans = opts.humans || 1;
    this.sc = levelScaling(this.lv, this.humans);
    this.rand = opts.rand || Math.random;
    this.timeLeft = this.lv.dur;
    this.elapsed = 0;
    this.score = 0; this.delivered = 0; this.failed = 0; this.streak = 0;
    this.orders = []; this.ordSeq = 1; this.nextOrder = 1.5;
    this.returns = [];
    this.players = [];
    this.events = [];
    this.spreadT = SPREAD_T;
    this.started = false; this.over = false;
    this.lastRec = [];
    this.recipeSet = this.lv.recipes.map(r => RECIPES[r].c);
    // рухливі частини кухні: перегородки, що то висуваються, то ховаються
    this.gates = (this.lv.gates || []).map(g => ({ ...g, tiles: g.at.map(([x, y]) => this.tile(x, y)) }));
    for (const g of this.gates) for (const t of g.tiles) t.gate = true;
    this.wind = this.lv.wind ? { ...this.lv.wind, t: this.lv.wind.period * 0.6, on: 0, dir: 1 } : null;
    this.windV = [0, 0];
    // групи для плит: які набори можуть бути в одній каструлі/пательні/печі
    this.groups = { pot: [], pan: [], oven: [] };
    for (const r of this.lv.recipes) for (const ck of ['pot', 'pan', 'oven']) {
      const out = COOKER[ck].out, gr = RECIPES[r].c.filter(c => c.endsWith(':' + out));
      if (gr.length) this.groups[ck].push(gr);
    }
  }
  tile(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.tiles[y * this.w + x]; }
  walk(x, y) { const t = this.tile(x, y); return !!t && t.type === 'floor' && !t.blocked; }
  emit(e) { this.events.push(e); }

  /* ---------- гравці ---------- */
  addPlayer(info) {
    const i = this.players.length;
    const sp = this.spawnPoint(i);
    const p = { id: info.id, name: info.name || 'Кухарчик', color: info.color ?? 0, hat: info.hat ?? 0,
      x: sp[0], y: sp[1], fx: 0, fy: 1, mx: 0, my: 0, held: null, using: false, act: '', dashT: 0, dashCd: 0,
      remote: !!info.remote, bot: info.bot ? { goal: null, wait: 0.6 + i * 0.25, stuck: 0, lx: 0, ly: 0, path: null, intent: null } : null };
    this.players.push(p);
    return p;
  }
  removePlayer(id) {
    const p = this.players.find(q => q.id === id); if (!p) return;
    if (p.held) this.dropAnywhere(p);
    this.players = this.players.filter(q => q !== p);
  }
  spawnPoint(i) {
    if (i < this.spawns.length) return this.spawns[i];
    // вільна клітинка підлоги поруч із точками старту
    const used = new Set(this.players.map(p => Math.round(p.x) + ',' + Math.round(p.y)));
    const floors = this.tiles.filter(t => t.type === 'floor' && !used.has(t.x + ',' + t.y));
    const c = this.spawns[i % this.spawns.length] || [floors[0].x, floors[0].y];
    floors.sort((a, b) => Math.hypot(a.x - c[0], a.y - c[1]) - Math.hypot(b.x - c[0], b.y - c[1]));
    return [floors[1 + (i % 3)]?.x ?? c[0], floors[1 + (i % 3)]?.y ?? c[1]];
  }
  dropAnywhere(p) {
    const t = this.tiles.filter(t => (t.type === 'counter') && !t.item)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (t) t.item = p.held; p.held = null;
  }

  movePlayer(p, dt) {
    let mx = p.mx, my = p.my; const m = Math.hypot(mx, my);
    if (m > 1) { mx /= m; my /= m; }
    if (m > 0.15) { const l = Math.hypot(mx, my); p.fx = mx / l; p.fy = my / l; }
    let vx = mx * SPEED, vy = my * SPEED;
    if (p.dashT > 0) { p.dashT -= dt; vx = p.fx * DASH_V; vy = p.fy * DASH_V; }
    if (p.dashCd > 0) p.dashCd -= dt;
    if (this.windV[0] || this.windV[1]) { vx += this.windV[0]; vy += this.windV[1]; }
    p.x += vx * dt; this.collide(p, 'x');
    p.y += vy * dt; this.collide(p, 'y');
    p.moving = m > 0.15 || p.dashT > 0;
  }
  collide(p) {
    const r = PLAYER_R;
    for (let iter = 0; iter < 2; iter++) {
      const cx = Math.round(p.x), cy = Math.round(p.y);
      for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
        if (this.walk(x, y)) continue;
        const nx = Math.max(x - 0.5, Math.min(p.x, x + 0.5)), ny = Math.max(y - 0.5, Math.min(p.y, y + 0.5));
        const dx = p.x - nx, dy = p.y - ny, d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 1e-6) { p.x = nx + dx / d * r; p.y = ny + dy / d * r; }
          else this.unstick(p);
        }
      }
    }
  }
  unstick(p) {
    const cx = Math.round(p.x), cy = Math.round(p.y);
    let best = null, bd = 1e9;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (this.walk(x, y)) { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = [x, y]; } }
    if (best) { p.x = best[0]; p.y = best[1]; }
  }
  dash(p) { if (p.dashCd <= 0) { p.dashT = DASH_T; p.dashCd = DASH_CD; this.emit({ e: 'dash', x: p.x, y: p.y }); } }

  // клітинка, на яку дивиться кухар
  facing(p) {
    const tx = Math.round(p.x + p.fx * 0.78), ty = Math.round(p.y + p.fy * 0.78);
    let t = this.tile(tx, ty);
    if (t && t.type !== 'floor' && t.type !== 'void') return t;
    // запасний варіант — сусід у напрямку погляду по осях
    const ax = Math.abs(p.fx) > Math.abs(p.fy);
    const cx = Math.round(p.x), cy = Math.round(p.y);
    t = ax ? this.tile(cx + Math.sign(p.fx), cy) : this.tile(cx, cy + Math.sign(p.fy));
    if (t && t.type !== 'floor' && t.type !== 'void') return t;
    return null;
  }

  /* ---------- правила поєднання ---------- */
  plateAccepts(pl, adds) {
    if (pl.t !== 'p') return false;
    const all = pl.c.map(i => key(i.id, i.s)).concat(adds.map(i => key(i.id, i.s)));
    if (all.length > 5) return false;
    return this.recipeSet.some(r => isSub(all, r));
  }
  cookerAccepts(ck, it) {
    if (ck.t !== 'k' || it.t !== 'i') return false;
    const C = COOKER[ck.k];
    if (ING[it.id][ck.k] !== it.s) return false;
    if (ck.c.length >= C.cap || cookerState(ck) === 'burnt') return false;
    const all = ck.c.map(i => key(i.id, C.out)).concat([key(it.id, C.out)]);
    return this.groups[ck.k].some(g => isSub(all, g));
  }
  // зварене можна перекласти, лише коли в каструлі/печі повний набір для страви
  cookerReady(ck) {
    if (cookerState(ck) !== 'done') return false;
    const ks = ck.c.map(i => key(i.id, i.s));
    return this.groups[ck.k].some(g => sameMs(ks, g));
  }
  cookerSoon(ck, within = 3.5) { // повний набір, ось-ось звариться
    if (cookerState(ck) !== 'cooking') return false;
    const out = COOKER[ck.k].out, ks = ck.c.map(i => key(i.id, out));
    return this.groups[ck.k].some(g => sameMs(ks, g)) && cookerNeed(ck) - ck.ct < within;
  }
  cookerToPlate(ck, pl) {
    if (!this.cookerReady(ck) || !this.plateAccepts(pl, ck.c)) return false;
    pl.c.push(...ck.c.map(i => ({ id: i.id, s: i.s }))); ck.c = []; ck.ct = 0; ck.ov = 0; return true;
  }
  matchOrder(pl) {
    if (!pl || pl.t !== 'p' || !pl.c.length) return null;
    const keys = pl.c.map(i => key(i.id, i.s));
    let best = null;
    for (const o of this.orders) if (sameMs(keys, RECIPES[o.r].c) && (!best || o.t < best.t)) best = o;
    return best;
  }
  combine(H, I) { // H у руках, I на клітинці → {held, item} або null
    if (H.t === 'i' && I.t === 'p' && this.plateAccepts(I, [H])) { I.c.push({ id: H.id, s: H.s }); return { held: null, item: I }; }
    if (H.t === 'i' && I.t === 'k' && this.cookerAccepts(I, H)) { I.c.push({ id: H.id, s: H.s }); return { held: null, item: I }; }
    if (H.t === 'p' && I.t === 'i' && this.plateAccepts(H, [I])) { H.c.push({ id: I.id, s: I.s }); return { held: H, item: null }; }
    if (H.t === 'k' && I.t === 'i' && this.cookerAccepts(H, I)) { H.c.push({ id: I.id, s: I.s }); return { held: H, item: null }; }
    if (H.t === 'p' && I.t === 'k' && this.cookerToPlate(I, H)) return { held: H, item: I };
    if (H.t === 'k' && I.t === 'p' && this.cookerToPlate(H, I)) return { held: H, item: I };
    return null;
  }
  canPlace(t, H) {
    if (t.type === 'counter' || t.type === 'conv') return true;
    if (t.type === 'board') return H.t === 'i';
    if (t.type === 'stove') return H.t === 'k' && H.k !== 'oven';
    return false;
  }

  /* ---------- дія «Взяти / Покласти» ---------- */
  grab(p) {
    const t = this.facing(p);
    if (!t) return false;
    if (t.fire > 0) { this.emit({ e: 'nope', x: t.x, y: t.y }); return false; }
    const H = p.held;
    const ok = this._grab(p, t, H);
    if (ok) this.emit({ e: H && !p.held ? 'drop' : 'pick', x: t.x, y: t.y, pid: p.id });
    return ok;
  }
  _grab(p, t, H) {
    switch (t.type) {
      case 'crate': {
        if (!H) { p.held = mkIng(t.ing); return true; }
        const it = mkIng(t.ing);
        if (H.t === 'p' && this.plateAccepts(H, [it])) { H.c.push({ id: it.id, s: 'r' }); return true; }
        if (H.t === 'k' && this.cookerAccepts(H, it)) { H.c.push({ id: it.id, s: 'r' }); return true; }
        return false;
      }
      case 'trash': {
        if (!H) return false;
        if (H.t === 'i') { p.held = null; this.emit({ e: 'trash', x: t.x, y: t.y }); return true; }
        if ((H.t === 'p' || H.t === 'k') && H.c.length) { H.c = []; if (H.t === 'k') H.ct = 0; this.emit({ e: 'trash', x: t.x, y: t.y }); return true; }
        return false;
      }
      case 'serve': {
        if (!H || H.t !== 'p') return false;
        const o = this.matchOrder(H);
        if (!o) { this.emit({ e: 'wrong', x: t.x, y: t.y }); return false; }
        this.serve(o, H, t); p.held = null; return true;
      }
      case 'sink': {
        if (!H) { if (t.clean > 0) { t.clean--; p.held = mkPlate(); return true; } return false; }
        if (H.t === 'd') { t.dirty += H.n; p.held = null; return true; }
        return false;
      }
      case 'plates': {
        if (!H) {
          if (t.clean > 0) { t.clean--; p.held = mkPlate(); return true; }
          if (t.dirty > 0) { p.held = { t: 'd', n: t.dirty }; t.dirty = 0; return true; }
          return false;
        }
        if (H.t === 'p' && !H.c.length) { t.clean++; p.held = null; return true; }
        if (H.t === 'd') { t.dirty += H.n; p.held = null; return true; }
        return false;
      }
      case 'oven': {
        const ck = t.ck;
        if (!H) { if (cookerState(ck) === 'burnt') { ck.c = []; ck.ct = 0; this.emit({ e: 'trash', x: t.x, y: t.y }); return true; } return false; }
        if (H.t === 'i' && this.cookerAccepts(ck, H)) { ck.c.push({ id: H.id, s: H.s }); p.held = null; return true; }
        if (H.t === 'p' && this.cookerToPlate(ck, H)) return true;
        return false;
      }
      default: { // counter, board, stove, conv
        const I = t.item;
        if (!H) { if (I) { p.held = I; t.item = null; if (I.t === 'i') I.p = I.p || 0; return true; } return false; }
        if (!I) { if (this.canPlace(t, H)) { t.item = H; p.held = null; return true; } return false; }
        const r = this.combine(H, I);
        if (r) { p.held = r.held; t.item = r.item; return true; }
        // поміняти місцями тарілку і каструлю не даємо; просто нічого
        return false;
      }
    }
  }

  serve(o, pl, t) {
    const n = RECIPES[o.r].c.length;
    const base = 20 + 6 * n, tip = Math.ceil(8 * o.t / o.T);
    this.streak++;
    const bonus = this.streak >= 3 ? 4 : 0;
    const pts = base + tip + bonus;
    this.score += pts; this.delivered++;
    this.orders = this.orders.filter(q => q !== o);
    this.returns.push({ t: RETURN_T, dirty: this.lv.wash });
    this.emit({ e: 'serve', x: t.x, y: t.y, pts, r: o.r });
    if (this.orders.length < 1) this.nextOrder = Math.min(this.nextOrder, 1.2);
  }

  /* ---------- «Дія»: різати, мити, гасити ---------- */
  doUse(p, dt) {
    const H = p.held;
    if (H && H.t === 'x') { // вогнегасник
      p.act = 'spray';
      const hit = new Set();
      for (const d of [0.8, 1.6, 2.4]) {
        const tx = Math.round(p.x + p.fx * d), ty = Math.round(p.y + p.fy * d);
        for (const [ox, oy] of [[0, 0], [Math.round(-p.fy), Math.round(p.fx)], [Math.round(p.fy), Math.round(-p.fx)]]) {
          if (d < 1 && (ox || oy)) continue;
          const t = this.tile(tx + ox, ty + oy); if (t && t.fire > 0 && !hit.has(t)) { hit.add(t); t.fire = Math.max(0, t.fire - dt * (ox || oy ? 0.9 : 1.6)); if (t.fire === 0) this.emit({ e: 'out', x: t.x, y: t.y }); }
        }
      }
      return;
    }
    if (H) { p.act = ''; return; }
    const t = this.facing(p);
    if (!t || t.fire > 0) { p.act = ''; return; }
    if (t.type === 'board' && t.item && t.item.t === 'i' && t.item.s === 'r' && ING[t.item.id].chop) {
      p.act = 'chop';
      t.item.p = (t.item.p || 0) + dt / CHOP_T;
      if (t.item.p >= 1) { t.item.s = 'c'; t.item.p = 0; this.emit({ e: 'chopped', x: t.x, y: t.y }); }
      return;
    }
    if (t.type === 'sink' && t.dirty > 0) {
      p.act = 'wash';
      t.wp += dt / WASH_T;
      if (t.wp >= 1) { t.wp = 0; t.dirty--; t.clean++; this.emit({ e: 'washed', x: t.x, y: t.y }); }
      return;
    }
    p.act = '';
  }

  /* ---------- крок симуляції ---------- */
  step(dt, hostSide = true) {
    if (!this.started || this.over) {
      for (const p of this.players) if (!p.remote) { if (p.bot) { p.mx = p.my = 0; } this.movePlayer(p, dt); }
      return;
    }
    this.elapsed += dt;
    if (hostSide) this.updateMovers(dt);
    for (const p of this.players) {
      if (p.bot) this.botTick(p, dt);
      if (!p.remote) this.movePlayer(p, dt);
      if (p.using) this.doUse(p, dt); else p.act = '';
    }
    if (!hostSide) return;
    // плити й печі
    for (const t of this.tiles) {
      const ck = t.type === 'oven' ? t.ck : (t.type === 'stove' && t.item && t.item.t === 'k' ? t.item : null);
      if (ck && ck.c.length && t.fire <= 0) this.cook(ck, t, dt);
      if (t.type === 'conv') this.convey(t, dt);
    }
    // вогонь шириться
    if (this.lv.fire) {
      this.spreadT -= dt;
      if (this.spreadT <= 0) {
        this.spreadT = SPREAD_T;
        const burning = this.tiles.filter(t => t.fire > 0);
        for (const b of burning) if (this.rand() < 0.45) {
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => this.tile(b.x + dx, b.y + dy))
            .filter(t => t && t.fire <= 0 && !['floor', 'void', 'crate', 'serve'].includes(t.type));
          if (nb.length) { const t = nb[Math.floor(this.rand() * nb.length)]; t.fire = 1; this.emit({ e: 'fire', x: t.x, y: t.y }); }
        }
      }
    }
    // тарілки повертаються
    for (const r of this.returns) r.t -= dt;
    for (const r of this.returns.filter(r => r.t <= 0)) {
      const pt = this.tiles.find(t => t.type === 'plates');
      if (pt) { if (r.dirty) pt.dirty++; else pt.clean++; this.emit({ e: 'plate', x: pt.x, y: pt.y }); }
    }
    this.returns = this.returns.filter(r => r.t > 0);
    // замовлення
    for (const o of this.orders) o.t -= dt;
    for (const o of this.orders.filter(o => o.t <= 0)) {
      this.failed++; this.streak = 0; this.score = Math.max(0, this.score - 5);
      this.emit({ e: 'expired', r: o.r });
    }
    this.orders = this.orders.filter(o => o.t > 0);
    this.nextOrder -= dt;
    if ((this.nextOrder <= 0 || !this.orders.length) && this.orders.length < this.sc.maxO && this.timeLeft > 12) {
      this.addOrder();
      this.nextOrder = this.sc.iv * (0.85 + this.rand() * 0.3);
    }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.over = true; this.emit({ e: 'end' }); }
  }
  updateMovers(dt) {
    for (const g of this.gates) {
      const ph = (this.elapsed + (g.offset || 0)) % g.period;
      const closed = ph >= g.period - g.closed;
      const warn = !closed && ph >= g.period - g.closed - 1.6;
      for (const t of g.tiles) {
        if (closed && !t.blocked) {
          if (!this.players.some(p => Math.round(p.x) === t.x && Math.round(p.y) === t.y && p.remote)) { t.blocked = true; this.emit({ e: 'gate', x: t.x, y: t.y }); for (const p of this.players) if (Math.round(p.x) === t.x && Math.round(p.y) === t.y) this.unstick(p); }
        } else if (!closed && t.blocked) { t.blocked = false; this.emit({ e: 'gate', x: t.x, y: t.y }); }
        t.warn = warn;
      }
    }
    const W = this.wind;
    if (W) {
      W.t -= dt;
      if (W.on > 0) { W.on -= dt; const k = Math.min(1, W.on, W.dur - W.on + 0.01); this.windV = [W.dir * W.force * k, 0]; if (W.on <= 0) { this.windV = [0, 0]; W.t = W.period; } }
      else if (W.t <= 0) { W.on = W.dur; W.dir = this.rand() < 0.5 ? -1 : 1; this.emit({ e: 'wind', dir: W.dir }); }
    }
  }
  addOrder() {
    const rs = this.lv.recipes;
    let r = rs[Math.floor(this.rand() * rs.length)];
    // не більше двох однакових підряд
    if (this.lastRec.length >= 2 && this.lastRec.every(x => x === r) && rs.length > 1) r = rs[(rs.indexOf(r) + 1) % rs.length];
    this.lastRec.push(r); if (this.lastRec.length > 2) this.lastRec.shift();
    // складніші страви чекають довше
    const T = this.sc.ordT + 6 * (RECIPES[r].c.length - 2);
    this.orders.push({ id: this.ordSeq++, r, t: T, T });
    this.emit({ e: 'order', r });
  }
  cook(ck, t, dt) {
    const C = COOKER[ck.k], st = cookerState(ck);
    if (st === 'burnt') return;
    if (st === 'cooking') {
      ck.ov = 0;
      ck.ct += dt;
      if (ck.ct >= cookerNeed(ck)) { ck.ct = cookerNeed(ck); for (const i of ck.c) i.s = C.out; this.emit({ e: 'cooked', x: t.x, y: t.y }); }
      return;
    }
    // готове: якщо не зняти, згорить
    if (!this.lv.fire) return;
    ck.ov = (ck.ov || 0) + dt;
    if (ck.ov >= C.burn) {
      for (const i of ck.c) i.s = 'x';
      t.fire = 1; this.emit({ e: 'fire', x: t.x, y: t.y }); this.emit({ e: 'burnt', x: t.x, y: t.y });
    }
  }
  convey(t, dt) {
    if (!t.item) { t.ct = 0; return; }
    t.ct += dt;
    if (t.ct < CONV_T) return;
    const n = this.tile(t.x + t.dir[0], t.y + t.dir[1]);
    if (n && (n.type === 'conv' || n.type === 'counter') && !n.item && n.fire <= 0) { n.item = t.item; t.item = null; n.ct = 0; }
    t.ct = 0;
  }

  stars() {
    const th = this.thresholds();
    return this.score >= th[2] ? 3 : this.score >= th[1] ? 2 : this.score >= th[0] ? 1 : 0;
  }
  thresholds() { return starThresholds(this.lv, this.humans); }

  /* ================== БОТ-ПОМІЧНИК ================== */
  botTick(p, dt) {
    const B = p.bot;
    p.mx = p.my = 0;
    if (B.wait > 0) { B.wait -= dt; p.using = false; return; }
    if (!B.goal) {
      B.goal = this.botDecide(p);
      B.stuck = 0;
      if (!B.goal) { B.wait = 0.35; return; }
    }
    const G = B.goal;
    if (G.check && !G.check()) { this.botDone(p, 0.1); return; }
    const tgt = this.tile(G.x, G.y);
    if (!tgt) { this.botDone(p, 0.2); return; }
    // дорога до клітинки, з якої видно ціль
    if (!B.path || B.pathFor !== G) {
      const r = this.route(p, tgt, G.stand);
      if (!r) { this.botDone(p, 0.5); return; }
      B.path = r.path; B.pathFor = G; G.sx = r.sx; G.sy = r.sy;
    }
    const sx = G.sx, sy = G.sy;
    if (B.path.length) {
      const [nx, ny] = B.path[0];
      const dx = nx - p.x, dy = ny - p.y, d = Math.hypot(dx, dy);
      if (d < 0.2 || (B.path.length > 1 && d < 0.45)) B.path.shift();
      else { p.mx = dx / d; p.my = dy / d; }
      p.using = false;
      // застрягли?
      B.stuck += dt;
      if (B.stuck > 5) { this.botDone(p, 0.4); }
      return;
    }
    const dx = sx - p.x, dy = sy - p.y;
    if (Math.hypot(dx, dy) > 0.12) { p.mx = dx * 3; p.my = dy * 3; }
    // дивимось на ціль
    const fx = G.x - sx, fy = G.y - sy, fl = Math.hypot(fx, fy) || 1;
    p.fx = fx / fl; p.fy = fy / fl;
    if (G.act === 'grab') {
      if (Math.hypot(dx, dy) > 0.2) return;
      if (G.ready && !G.ready()) { G.tw = (G.tw || 0) + dt; if (G.tw > 7) this.botDone(p, 0.2); return; }
      this.grab(p);
      this.botDone(p, 0.12);
    } else if (G.act === 'hold') {
      p.using = true;
      G.tt = (G.tt || 0) + dt;
      if ((G.until && G.until()) || G.tt > 9) { p.using = false; this.botDone(p, 0.1); }
    }
  }
  botDone(p, w) { p.bot.goal = null; p.bot.path = null; p.bot.wait = w; p.bot.intent = null; p.using = false; }

  // маршрут: BFS по підлозі до клітинки поруч із ціллю
  route(p, tgt, stand) {
    const sx = Math.round(p.x), sy = Math.round(p.y);
    const goals = new Set();
    const nbs = stand ? [stand] : [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [tgt.x + dx, tgt.y + dy]);
    for (const [x, y] of nbs) if (this.walk(x, y)) goals.add(x + ',' + y);
    if (!goals.size) return null;
    const prev = new Map([[sx + ',' + sy, null]]), q = [[sx, sy]];
    let end = null;
    while (q.length) {
      const [x, y] = q.shift(), k = x + ',' + y;
      if (goals.has(k)) { end = [x, y]; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, nk = nx + ',' + ny;
        if (!prev.has(nk) && this.walk(nx, ny)) { prev.set(nk, k); q.push([nx, ny]); }
      }
    }
    if (!end) return null;
    const path = []; let k = end[0] + ',' + end[1];
    while (k) { const [x, y] = k.split(',').map(Number); path.unshift([x, y]); k = prev.get(k); }
    path.shift();
    return { path, sx: end[0], sy: end[1] };
  }
  dist(p, t) { // довжина маршруту (Infinity, якщо не дійти)
    const r = this.route(p, t); return r ? r.path.length + Math.hypot(r.sx - p.x, r.sy - p.y) * 0.1 : Infinity;
  }
  nearest(p, list, claimKey) {
    let best = null, bd = Infinity;
    for (const t of list) {
      if (t.fire > 0) continue;
      if (claimKey && this.claimed(p, t)) continue;
      const d = this.dist(p, t); if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
  claimed(p, t) { return this.players.some(q => q !== p && q.bot && q.bot.goal && q.bot.goal.x === t.x && q.bot.goal.y === t.y); }
  G(t, act, extra = {}) { return { x: t.x, y: t.y, act, ...extra }; }

  // ---- аналіз кухні: які тарілки для яких замовлень, чого бракує ----
  analyze() {
    const orders = [...this.orders].sort((a, b) => a.t - b.t);
    const plates = [];
    for (const t of this.tiles) if (t.item && t.item.t === 'p') plates.push({ pl: t.item, where: t });
    for (const p of this.players) if (p.held && p.held.t === 'p') plates.push({ pl: p.held, where: p });
    const assign = new Map(), plateOf = new Map(), remain = new Map();
    const used = new Set();
    for (const o of orders) {
      const rc = RECIPES[o.r].c;
      let best = null, bn = -1;
      for (const P of plates) {
        if (used.has(P.pl) || !P.pl.c.length) continue;
        const ks = P.pl.c.map(i => key(i.id, i.s));
        if (isSub(ks, rc) && ks.length > bn) { best = P; bn = ks.length; }
      }
      let rem = [...rc];
      if (best) {
        used.add(best.pl); assign.set(best.pl, o); plateOf.set(o, best);
        for (const i of best.pl.c) { const k = key(i.id, i.s); rem.splice(rem.indexOf(k), 1); }
      }
      remain.set(o, rem);
    }
    const spare = plates.filter(P => P.pl.c.length && !used.has(P.pl));
    // вільні запаси (не на тарілках)
    const loose = [];
    for (const t of this.tiles) {
      const it = t.type === 'oven' ? t.ck : t.item;
      if (!it) continue;
      if (it.t === 'i') loose.push({ id: it.id, s: it.s });
      else if (it.t === 'k') for (const i of it.c) loose.push({ id: i.id, s: i.s });
    }
    for (const p of this.players) {
      const H = p.held;
      if (H && H.t === 'i') loose.push({ id: H.id, s: H.s });
      else if (H && H.t === 'k') for (const i of H.c) loose.push({ id: i.id, s: i.s });
      if (p.bot && p.bot.intent) loose.push({ id: p.bot.intent.id, s: 'r' });
    }
    const deficit = [], wants = [];
    for (const o of orders) for (const k of remain.get(o)) {
      wants.push(k);
      const [id, fs] = k.split(':');
      let j = loose.findIndex(i => i.id === id && i.s === fs);
      if (j < 0) j = loose.findIndex(i => i.id === id && onPath(id, fs, i.s));
      if (j >= 0) loose.splice(j, 1); else deficit.push(k);
    }
    const unplated = orders.filter(o => !plateOf.has(o));
    return { orders, assign, plateOf, remain, spare, deficit, wants, unplated };
  }
  purposeOf(it, A) {
    let best = null;
    for (const k of A.wants) { const [id, fs] = k.split(':'); if (id === it.id && onPath(id, fs, it.s)) { if (fs === it.s) return fs; best = best || fs; } }
    return best;
  }
  // тарілка, якій потрібні саме ці продукти (keys)
  plateWanting(A, keys) {
    const out = [];
    for (const [pl, o] of A.assign) if (isSub(keys, A.remain.get(o))) out.push(pl);
    return out;
  }
  needsNewPlate(A, keys) { return A.unplated.some(o => isSub(keys, RECIPES[o.r].c)); }
  tileOfItem(it) { return this.tiles.find(t => t.item === it); }
  surfaces(pred) { return this.tiles.filter(t => (t.type === 'counter' || t.type === 'board' || t.type === 'conv' || t.type === 'stove') && pred(t)); }
  freeCounters() { return this.tiles.filter(t => t.type === 'counter' && !t.item && t.fire <= 0); }
  cookerTiles(kind) {
    return this.tiles.filter(t => (t.type === 'oven' && (!kind || t.ck.k === kind)) || (t.item && t.item.t === 'k' && (!kind || t.item.k === kind)));
  }
  ckOf(t) { return t.type === 'oven' ? t.ck : t.item; }
  cleanPlateSources() {
    const s = this.tiles.filter(t => (t.type === 'plates' && t.clean > 0) || (t.type === 'sink' && t.clean > 0));
    return s.concat(this.surfaces(t => t.item && t.item.t === 'p' && !t.item.c.length));
  }
  trashTile(p) { return this.nearest(p, this.tiles.filter(t => t.type === 'trash')); }
  // куди взяти тарілку: чиста → порожня на стійці → звільнити зайву
  plateGoal(p, A) {
    const src = this.nearest(p, this.cleanPlateSources(), true);
    if (src) return this.G(src, 'grab', { check: () => src.type === 'plates' || src.type === 'sink' ? src.clean > 0 : (src.item && src.item.t === 'p') });
    const sp = A.spare.filter(P => P.where.type).map(P => P.where);
    const t = this.nearest(p, sp, true);
    if (t) return this.G(t, 'grab', { check: () => t.item && t.item.t === 'p' });
    return null;
  }

  botDecide(p) {
    const H = p.held, A = this.analyze();
    const fires = this.tiles.filter(t => t.fire > 0);
    const sink = this.tiles.find(t => t.type === 'sink');
    if (!H) {
      // 1. пожежа
      if (fires.length) {
        const ex = this.tiles.filter(t => t.item && t.item.t === 'x');
        const holder = this.players.some(q => q.held && q.held.t === 'x');
        const e = !holder && this.nearest(p, ex, true);
        if (e) return this.G(e, 'grab', { check: () => e.item && e.item.t === 'x' });
      }
      // 2. готова тарілка — віднести
      let t = this.nearest(p, this.surfaces(t => t.item && this.matchOrder(t.item)), true);
      if (t) return this.G(t, 'grab', { check: () => t.item && this.matchOrder(t.item) });
      // 3. зварене — під тарілку
      const doneCk = this.cookerTiles().filter(t => { const ck = this.ckOf(t); return ck && (this.cookerReady(ck) || ((t.type === 'stove' || t.type === 'oven') && this.cookerSoon(ck))); })
        .sort((a, b) => (this.ckOf(b).ov || 0) - (this.ckOf(a).ov || 0));
      for (const ct of doneCk) {
        if (this.claimed(p, ct)) continue;
        const ck = this.ckOf(ct), ks = ck.c.map(i => key(i.id, COOKER[ck.k].out));
        const pls = this.plateWanting(A, ks).map(pl => this.tileOfItem(pl)).filter(Boolean);
        const pt = this.nearest(p, pls, true);
        if (pt) return this.G(pt, 'grab', { check: () => pt.item && pt.item.t === 'p' });
        if (this.needsNewPlate(A, ks)) { const g = this.plateGoal(p, A); if (g) return g; }
        // ніхто не встигне — зняти з вогню, поки не згоріло
        if (ct.type === 'stove' && this.lv.fire && (ck.ov || 0) > COOKER[ck.k].burn * 0.45) {
          const fc = this.freeCounters().length;
          if (fc) return this.G(ct, 'grab', { check: () => ct.item === ck, takeOff: true });
        }
      }
      // 4. згоріле — викинути
      const burnt = this.tiles.filter(t => { const ck = this.ckOf(t); return ck && ck.t === 'k' && cookerState(ck) === 'burnt'; });
      t = this.nearest(p, burnt, true);
      if (t) return this.G(t, 'grab');
      // 5. нарізати те, що лежить на дошці
      const boards = this.tiles.filter(t => t.type === 'board' && t.item && t.item.t === 'i' && t.item.s === 'r' && ING[t.item.id].chop
        && !this.players.some(q => q !== p && q.act === 'chop' && this.facing(q) === t));
      t = this.nearest(p, boards, true);
      if (t) return this.G(t, 'hold', { until: () => !t.item || t.item.s !== 'r' });
      // мити, якщо зовсім немає чистих тарілок
      const cleanCount = this.cleanPlateSources().reduce((a, t) => a + (t.clean || 1), 0);
      if (sink && cleanCount === 0) {
        if (sink.dirty > 0 && !this.claimed(p, sink)) return this.G(sink, 'hold', { until: () => sink.dirty === 0 || sink.clean > 0 });
        const pt = this.tiles.find(t => t.type === 'plates' && t.dirty > 0);
        if (pt && !this.claimed(p, pt)) return this.G(pt, 'grab', { check: () => pt.dirty > 0 });
      }
      // 6. готовий продукт на стійці — на тарілку або в каструлю
      const loose = this.surfaces(t => t.item && t.item.t === 'i' && t.type !== 'stove')
        .map(t => ({ t, d: this.dist(p, t) })).sort((a, b) => a.d - b.d);
      for (const { t } of loose) {
        if (this.claimed(p, t) || t.fire > 0) continue;
        const it = t.item, fs = this.purposeOf(it, A);
        if (!fs) continue;
        if (it.s === 'r' && ING[it.id].chop && t.type === 'board') continue;
        if (fs === it.s) {
          const ks = [key(it.id, it.s)];
          if (this.plateWanting(A, ks).length) return this.G(t, 'grab', { check: () => t.item === it });
          if (this.needsNewPlate(A, ks)) { const g = this.plateGoal(p, A); if (g) return g; }
        } else {
          const ns = nextState(it.id, fs, it.s);
          if (ns === 'c' && this.tiles.some(b => b.type === 'board' && !b.item && b.fire <= 0)) return this.G(t, 'grab', { check: () => t.item === it });
          if (ns && COOK_OF_STATE[ns]) {
            const cks = this.cookerTiles(COOK_OF_STATE[ns]).filter(c => (c.type === 'stove' || c.type === 'oven') && this.cookerAccepts(this.ckOf(c), it));
            if (cks.length) return this.G(t, 'grab', { check: () => t.item === it });
          }
        }
      }
      // 6б. каструля з вареним стоїть на стійці, а плита вільна? (повернути порожню на плиту)
      const offPot = this.surfaces(t => t.type !== 'stove' && t.item && t.item.t === 'k' && !t.item.c.length);
      t = this.nearest(p, offPot, true);
      if (t && this.tiles.some(s => s.type === 'stove' && !s.item)) return this.G(t, 'grab');
      // 7. взяти продукти, яких бракує
      const pile = this.surfaces(t => t.item && t.item.t === 'i').length;
      if (pile < 6) {
        for (const k of A.deficit) {
          const [id, fs] = k.split(':');
          const ns = nextState(id, fs, 'r');
          if (ns && COOK_OF_STATE[ns]) {
            const ok = this.cookerTiles(COOK_OF_STATE[ns]).some(c => (c.type === 'stove' || c.type === 'oven') && this.cookerAccepts(this.ckOf(c), mkIng(id, ING[id][COOK_OF_STATE[ns]])));
            if (!ok) continue;
          }
          if (fs === 'r' && !this.plateWanting(A, [k]).length && !this.needsNewPlate(A, [k])) continue;
          const cr = this.nearest(p, this.tiles.filter(t => t.type === 'crate' && t.ing === id));
          if (cr) { p.bot.intent = { id }; return this.G(cr, 'grab'); }
        }
      }
      // 8. брудний посуд
      if (sink) {
        if (sink.dirty > 0 && !this.claimed(p, sink)) return this.G(sink, 'hold', { until: () => sink.dirty === 0 });
        const pt = this.tiles.find(t => t.type === 'plates' && t.dirty > 0);
        if (pt && !this.claimed(p, pt)) return this.G(pt, 'grab', { check: () => pt.dirty > 0 });
      }
      // 9. зварене, яке нікому не потрібне — у смітник
      const junk = this.cookerTiles().filter(t => { const ck = this.ckOf(t); return ck && ck.k !== 'oven' && cookerState(ck) === 'done' && !A.orders.some(o => isSub(ck.c.map(i => key(i.id, i.s)), RECIPES[o.r].c)); });
      t = this.nearest(p, junk, true);
      if (t && A.deficit.length) return this.G(t, 'grab');
      return null;
    }

    if (H.t === 'x') {
      if (fires.length) {
        const f = this.nearest(p, fires.map(t => ({ x: t.x, y: t.y, fire: 0 })));
        if (f) { const ft = this.tile(f.x, f.y); return this.G(ft, 'hold', { until: () => ft.fire <= 0 }); }
      }
      return this.placeNear(p, H, this.tiles.find(t => t.ch === 'E') || p);
    }
    if (H.t === 'd') {
      if (sink) return this.G(sink, 'grab');
      const pt = this.tiles.find(t => t.type === 'plates'); return pt ? this.G(pt, 'grab') : null;
    }
    if (H.t === 'p') {
      if (this.matchOrder(H)) { const s = this.nearest(p, this.tiles.filter(t => t.type === 'serve')); if (s) return this.G(s, 'grab'); }
      const o = A.assign.get(H);
      const rem = o ? A.remain.get(o) : null;
      if (H.c.length && !o) { // зайва тарілка — звільнити, якщо комусь потрібна
        if (A.unplated.length) { const tr = this.trashTile(p); if (tr) return this.G(tr, 'grab'); }
        return this.placeNear(p, H, this.tiles.find(t => t.type === 'serve') || p);
      }
      const fits = ks => rem ? isSub(ks, rem) : this.needsNewPlate(A, ks);
      const cks = this.cookerTiles().filter(t => { const ck = this.ckOf(t); return this.cookerReady(ck) && this.plateAccepts(H, ck.c) && fits(ck.c.map(i => key(i.id, i.s))); });
      let t = this.nearest(p, cks, true);
      if (t) return this.G(t, 'grab');
      const soon = this.cookerTiles().filter(t => { const ck = this.ckOf(t); return (t.type === 'stove' || t.type === 'oven') && this.cookerSoon(ck, 6) && fits(ck.c.map(i => key(i.id, COOKER[ck.k].out))); });
      t = this.nearest(p, soon, true);
      if (t) { const ck = this.ckOf(t); return this.G(t, 'grab', { ready: () => this.cookerReady(ck) || cookerState(ck) !== 'cooking' }); }
      const ings = this.surfaces(t => t.item && t.item.t === 'i' && this.plateAccepts(H, [t.item]) && fits([key(t.item.id, t.item.s)]));
      t = this.nearest(p, ings, true);
      if (t) return this.G(t, 'grab');
      if (!H.c.length && !A.unplated.length) { const pt = this.tiles.find(t => t.type === 'plates'); if (pt) return this.G(pt, 'grab'); }
      return this.placeNear(p, H, this.tiles.find(t => t.type === 'serve') || p);
    }
    if (H.t === 'k') {
      const st = cookerState(H), ks = H.c.map(i => key(i.id, i.s));
      if (st === 'burnt') { const tr = this.trashTile(p); if (tr) return this.G(tr, 'grab'); }
      if (st === 'done' && this.cookerReady(H)) {
        const pls = this.plateWanting(A, ks).map(pl => this.tileOfItem(pl)).filter(Boolean);
        const t = this.nearest(p, pls, true); if (t) return this.G(t, 'grab');
        if (!A.orders.some(o => isSub(ks, RECIPES[o.r].c))) { const tr = this.trashTile(p); if (tr) return this.G(tr, 'grab'); }
        return this.placeNear(p, H, p); // зняли з вогню — поставити поруч
      }
      const st2 = this.nearest(p, this.tiles.filter(t => t.type === 'stove' && !t.item));
      if (st2) return this.G(st2, 'grab');
      return this.placeNear(p, H, p);
    }
    if (H.t === 'i') {
      const fs = H.s === 'x' ? null : this.purposeOf(H, A);
      if (!fs) { const tr = this.trashTile(p); return tr ? this.G(tr, 'grab') : null; }
      if (fs === H.s) {
        const ks = [key(H.id, H.s)];
        const pls = this.plateWanting(A, ks).map(pl => this.tileOfItem(pl)).filter(Boolean);
        const t = this.nearest(p, pls, true);
        if (t) return this.G(t, 'grab', { check: () => t.item && t.item.t === 'p' });
        return this.placeNear(p, H, this.tiles.find(t => t.type === 'serve') || p);
      }
      const ns = nextState(H.id, fs, H.s);
      if (ns === 'c') {
        const b = this.nearest(p, this.tiles.filter(t => t.type === 'board' && !t.item), true);
        if (b) return this.G(b, 'grab', { check: () => !b.item });
        return this.placeNear(p, H, p);
      }
      if (ns && COOK_OF_STATE[ns]) {
        const cks = this.cookerTiles(COOK_OF_STATE[ns]).filter(t => (t.type === 'stove' || t.type === 'oven') && this.cookerAccepts(this.ckOf(t), H));
        let best = null, bs = Infinity;
        for (const t of cks) { if (this.claimed(p, t)) continue; const s = this.dist(p, t) - this.ckOf(t).c.length * 6; if (s < bs) { bs = s; best = t; } }
        if (best) return this.G(best, 'grab', { check: () => this.cookerAccepts(this.ckOf(best), H) });
        return this.placeNear(p, H, p);
      }
      return this.placeNear(p, H, p);
    }
    return null;
  }
  placeNear(p, H, anchor) {
    const fc = this.freeCounters().filter(t => !this.claimed(p, t));
    if (!fc.length) return null;
    let best = null, bd = Infinity;
    for (const t of fc) {
      const d = this.dist(p, t); if (d === Infinity) continue;
      const s = d + Math.hypot(t.x - anchor.x, t.y - anchor.y) * 0.8;
      if (s < bd) { bd = s; best = t; }
    }
    return best ? this.G(best, 'grab', { check: () => !best.item }) : null;
  }

  /* ================== мережа: знімки стану ================== */
  tileSnap(t) {
    const o = {};
    if (t.item) o.i = t.item;
    if (t.ck) o.k = t.ck;
    if (t.fire > 0) o.f = Math.round(t.fire * 100) / 100;
    if (t.type === 'sink') { o.d = t.dirty; o.c = t.clean; o.w = Math.round(t.wp * 100) / 100; }
    if (t.type === 'plates') { o.d = t.dirty; o.c = t.clean; }
    if (t.gate) { o.g = t.blocked ? 1 : 0; o.gw = t.warn ? 1 : 0; }
    return o;
  }
  snapshot(prev) { // prev: Map індекс→рядок; повертає {tiles: [[i, obj]...]}
    const out = [];
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      if ((t.type === 'floor' && !t.gate) || t.type === 'void') continue;
      const o = this.tileSnap(t), s = JSON.stringify(o);
      if (!prev || prev.get(i) !== s) { out.push([i, o]); if (prev) prev.set(i, s); }
    }
    return {
      wv: this.windV.map(v => +v.toFixed(2)), tl: Math.round(this.timeLeft * 10) / 10, sc: this.score, dv: this.delivered, fl: this.failed, ov: this.over, st: this.started,
      o: this.orders.map(o => [o.id, o.r, Math.round(o.t * 10) / 10, o.T]),
      p: this.players.map(p => [p.id, +p.x.toFixed(2), +p.y.toFixed(2), +p.fx.toFixed(2), +p.fy.toFixed(2), p.held, p.act, p.moving ? 1 : 0]),
      t: out,
    };
  }
  applySnapshot(s, myIds) {
    this.timeLeft = s.tl; this.score = s.sc; this.delivered = s.dv; this.failed = s.fl; this.over = s.ov; this.started = s.st;
    this.orders = s.o.map(([id, r, t, T]) => ({ id, r, t, T }));
    for (const [i, o] of s.t) {
      const t = this.tiles[i];
      t.item = o.i || null; if (o.k) t.ck = o.k; t.fire = o.f || 0;
      if (t.type === 'sink') { t.dirty = o.d; t.clean = o.c; t.wp = o.w; }
      if (t.type === 'plates') { t.dirty = o.d; t.clean = o.c; }
      if (t.gate) { t.blocked = !!o.g; t.warn = !!o.gw; }
    }
    if (s.wv) this.windV = s.wv;
    const seen = new Set();
    for (const [id, x, y, fx, fy, held, act, mv] of s.p) {
      seen.add(id);
      let p = this.players.find(q => q.id === id);
      if (!p) { p = this.addPlayer({ id, remote: true }); p.x = x; p.y = y; }
      p.held = held; p.act = act;
      if (!myIds.has(id)) { p.tx = x; p.ty = y; p.fx = fx; p.fy = fy; p.moving = !!mv; p.remote = true; }
    }
    this.players = this.players.filter(p => seen.has(p.id) || myIds.has(p.id));
  }
}

/* Пороги зірок: беруться з калібрування ботами (calib.js), інакше — оцінка */
import { CALIB } from './calib.js';
export function starThresholds(lv, humans) {
  const n = Math.max(1, Math.min(6, humans));
  const c = CALIB[lv.id];
  let ref;
  if (c && c[n - 1]) ref = c[n - 1];
  else ref = (lv.dur / lv.iv) * 32 * TEAM[n] * 0.6;
  // добрі пороги: діти теж мають отримувати зірки
  const r = v => Math.max(10, Math.round(v / 10) * 10);
  return [r(ref * 0.32), r(ref * 0.58), r(ref * 0.82)];
}
