// Кухарчата — керування: сенсорний джойстик і кнопки, клавіатура, геймпади
const DEAD = 0.22;

export class Input {
  constructor(layer) {
    this.layer = layer;
    this.mode = 'single';
    this.src = {}; // джерело → {mx,my,grab,use,dash,_g,_d}
    this.keys = new Set();
    this.padPrev = [];
    this.nav = []; // події для меню з геймпада/клавіатури
    this.lastTouch = 0; this.lastKb = 0;
    addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (!this.keys.has(e.code)) {
        const nav = { Enter: 'a', Space: 'a', Escape: 'b', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' }[e.code];
        if (nav) this.nav.push(nav);
        if (e.code === 'Escape' || e.code === 'KeyP') this.nav.push('start');
      }
      this.keys.add(e.code); this.lastKb = performance.now();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    this.build();
  }
  setMode(m) { this.mode = m; this.build(); }
  show(on) { this.layer.classList.toggle('hide', !on); }
  build() {
    this.layer.innerHTML = '';
    const zones = this.mode === 'shared' ? [0, 1] : [0];
    zones.forEach(z => {
      const zone = document.createElement('div');
      zone.className = 'tzone ' + (this.mode === 'shared' ? (z ? 'zr' : 'zl') : 'zf');
      zone.innerHTML = `<div class="joy"><div class="base"><div class="knob"></div></div></div>
        <div class="btns"><button class="tb grab" data-b="grab">✋<small>Взяти</small></button>
        <button class="tb use" data-b="use">🔪<small>Дія</small></button>
        <button class="tb dash" data-b="dash">💨</button></div>`;
      this.layer.appendChild(zone);
      const S = this.src['touch' + z] = { mx: 0, my: 0, grab: false, use: false, dash: false, _g: 0, _d: 0 };
      const joy = zone.querySelector('.joy'), base = zone.querySelector('.base'), knob = zone.querySelector('.knob');
      let pid = null, ox = 0, oy = 0;
      const R = 52;
      joy.addEventListener('pointerdown', e => {
        e.preventDefault(); pid = e.pointerId; joy.setPointerCapture(pid);
        const r = joy.getBoundingClientRect(); ox = e.clientX; oy = e.clientY;
        base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px'; base.classList.add('on');
        knob.style.transform = 'translate(-50%,-50%)'; this.lastTouch = performance.now();
      });
      joy.addEventListener('pointermove', e => {
        if (e.pointerId !== pid) return;
        let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy);
        if (d > R) { // база тягнеться за пальцем
          const k = (d - R) / d; ox += dx * k; oy += dy * k; dx = e.clientX - ox; dy = e.clientY - oy;
          const r = joy.getBoundingClientRect(); base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px';
        }
        S.mx = dx / R; S.my = dy / R;
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });
      const end = e => { if (e.pointerId !== pid) return; pid = null; S.mx = S.my = 0; base.classList.remove('on'); knob.style.transform = 'translate(-50%,-50%)'; };
      joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
      zone.querySelectorAll('.tb').forEach(b => {
        const k = b.dataset.b;
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('down'); S[k] = true; if (k === 'grab') S._g++; if (k === 'dash') S._d++; this.lastTouch = performance.now(); if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) { } });
        const up = () => { b.classList.remove('down'); S[k] = false; };
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
        b.addEventListener('contextmenu', e => e.preventDefault());
      });
    });
  }
  pads() { return [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(Boolean); }
  // викликається щокадру: повертає стан кожного джерела
  poll() {
    const out = {};
    for (const k in this.src) {
      const S = this.src[k];
      out[k] = { mx: S.mx, my: S.my, grab: S._g > 0, use: S.use, dash: S._d > 0, active: Math.hypot(S.mx, S.my) > 0.1 || S.use };
      S._g = 0; S._d = 0;
    }
    // клавіатура
    const K = this.keys, kb = { mx: 0, my: 0 };
    if (K.has('KeyA') || K.has('ArrowLeft')) kb.mx -= 1; if (K.has('KeyD') || K.has('ArrowRight')) kb.mx += 1;
    if (K.has('KeyW') || K.has('ArrowUp')) kb.my -= 1; if (K.has('KeyS') || K.has('ArrowDown')) kb.my += 1;
    const kprev = this._kprev || new Set();
    const edge = c => K.has(c) && !kprev.has(c);
    kb.grab = edge('Space') || edge('KeyJ');
    kb.use = K.has('KeyE') || K.has('KeyK') || K.has('ControlLeft');
    kb.dash = edge('ShiftLeft') || edge('ShiftRight') || edge('KeyL');
    kb.active = !!(kb.mx || kb.my || kb.use);
    this._kprev = new Set(K);
    out.kb = kb;
    // геймпади
    const pads = this.pads();
    for (const gp of pads) {
      const prev = this.padPrev[gp.index] || [];
      const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
      const e = i => b(i) && !prev[i];
      let mx = gp.axes[0] || 0, my = gp.axes[1] || 0;
      if (Math.hypot(mx, my) < DEAD) { mx = 0; my = 0; }
      if (b(14)) mx = -1; if (b(15)) mx = 1; if (b(12)) my = -1; if (b(13)) my = 1;
      out['pad' + gp.index] = { mx, my, grab: e(0), use: b(2) || b(3) || b(7), dash: e(1) || e(5) || e(4), active: !!(mx || my || b(0) || b(2)), pressedA: e(0) };
      // навігація меню
      if (e(0)) this.nav.push('a'); if (e(1)) this.nav.push('b'); if (e(9) || e(8)) this.nav.push('start');
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, pax = this._ax?.[gp.index] || [0, 0];
      if ((e(14)) || (ax < -0.6 && pax[0] >= -0.6)) this.nav.push('left');
      if ((e(15)) || (ax > 0.6 && pax[0] <= 0.6)) this.nav.push('right');
      if ((e(12)) || (ay < -0.6 && pax[1] >= -0.6)) this.nav.push('up');
      if ((e(13)) || (ay > 0.6 && pax[1] <= 0.6)) this.nav.push('down');
      this._ax = this._ax || []; this._ax[gp.index] = [ax, ay];
      this.padPrev[gp.index] = gp.buttons.map((_, i) => b(i));
    }
    return out;
  }
  takeNav() { const n = this.nav; this.nav = []; return n; }
  rumble(idx, ms = 60) {
    const gp = this.pads().find(p => p.index === idx);
    try { gp?.vibrationActuator?.playEffect('dual-rumble', { duration: ms, strongMagnitude: 0.4, weakMagnitude: 0.6 }); } catch (_) { }
  }
}
