// Значки інгредієнтів і страв (canvas): емодзі або власні малюнки
import { ING, RECIPES } from './data.js';

export const STATE_BADGE = { c: '🔪', b: '💧', f: '🔥', k: '♨️', x: '💀' };

function custom(ctx, name, x, y, s) {
  const r = s / 2;
  ctx.save(); ctx.translate(x, y);
  const circ = (cx, cy, rr, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill(); };
  switch (name) {
    case 'beet':
      ctx.fillStyle = '#3a9a3a'; ctx.beginPath(); ctx.ellipse(-r * .2, -r * .55, r * .18, r * .38, -.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * .22, -r * .55, r * .18, r * .38, .4, 0, 7); ctx.fill();
      circ(0, r * .12, r * .62, '#8e1b4f'); circ(-r * .2, -r * .05, r * .16, '#b8457a');
      ctx.fillStyle = '#8e1b4f'; ctx.beginPath(); ctx.moveTo(-r * .12, r * .65); ctx.lineTo(r * .12, r * .65); ctx.lineTo(0, r * .98); ctx.fill();
      break;
    case 'cabbage':
      circ(0, 0, r * .8, '#9fd27a'); circ(0, 0, r * .58, '#c9eaa8');
      ctx.strokeStyle = '#7fb85a'; ctx.lineWidth = s * .04;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0, 0, r * (.2 + i * .12), i, i + 2.2); ctx.stroke(); }
      break;
    case 'sausage':
      ctx.rotate(-.5); ctx.fillStyle = '#c8553d'; ctx.beginPath(); ctx.roundRect(-r * .85, -r * .28, r * 1.7, r * .56, r * .28); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.roundRect(-r * .6, -r * .2, r * 1.1, r * .12, r * .06); ctx.fill();
      break;
    case 'dough':
      ctx.fillStyle = '#f3e6c8'; ctx.beginPath(); ctx.ellipse(0, r * .1, r * .85, r * .6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e6d2a6'; ctx.beginPath(); ctx.ellipse(r * .1, r * .25, r * .5, r * .25, 0, 0, 7); ctx.fill();
      circ(-r * .3, -r * .05, r * .08, '#fff');
      break;
    case 'pasta':
      ctx.strokeStyle = '#e8b93a'; ctx.lineWidth = s * .07; ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * r * .14 - r * .3, -r * .8); ctx.lineTo(i * r * .14 + r * .3, r * .8); ctx.stroke(); }
      ctx.fillStyle = '#c0392b'; ctx.fillRect(-r * .55, -r * .12, r * 1.1, r * .24);
      break;
    case 'noodles':
      ctx.strokeStyle = '#e9c46a'; ctx.lineWidth = s * .06; ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); for (let k = 0; k <= 12; k++) { const xx = -r * .8 + k * r * .135, yy = i * r * .28 + Math.sin(k * 1.4) * r * .1; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
      break;
    case 'nori':
      ctx.fillStyle = '#1f3d2b'; ctx.beginPath(); ctx.roundRect(-r * .75, -r * .75, r * 1.5, r * 1.5, r * .12); ctx.fill();
      ctx.strokeStyle = '#2f5a3e'; ctx.lineWidth = s * .03;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-r * .7, i * r * .25); ctx.lineTo(r * .7, i * r * .25); ctx.stroke(); }
      break;
    case 'cream':
      ctx.fillStyle = '#fbfbf5'; ctx.beginPath(); ctx.roundRect(-r * .55, -r * .45, r * 1.1, r * 1.25, r * .2); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = s * .03; ctx.stroke();
      ctx.fillStyle = '#4a90d9'; ctx.beginPath(); ctx.roundRect(-r * .62, -r * .75, r * 1.24, r * .38, r * .1); ctx.fill();
      ctx.fillStyle = '#4a90d9'; ctx.font = `bold ${s * .28}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('С', 0, r * .45);
      break;
  }
  ctx.restore();
}

export function drawIcon(ctx, icon, x, y, s) {
  if (icon[0] === '@') { custom(ctx, icon.slice(1), x, y, s); return; }
  ctx.save();
  ctx.font = `${Math.round(s * .82)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y + s * .04);
  ctx.restore();
}

export function drawIng(ctx, id, s, x, y, size, badge = true) {
  drawIcon(ctx, ING[id].icon, x, y, size);
  if (badge && STATE_BADGE[s] && s !== 'r') {
    const b = size * .42;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(x + size * .32, y + size * .32, b * .55, 0, 7); ctx.fill();
    ctx.font = `${Math.round(b * .8)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(STATE_BADGE[s], x + size * .32, y + size * .34);
    ctx.restore();
  }
}

// HTML: <img> для власних значків (кеш), текст для емодзі
const urlCache = new Map();
export function iconURL(icon, size = 64) {
  const k = icon + size;
  if (urlCache.has(k)) return urlCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = size;
  drawIcon(c.getContext('2d'), icon, size / 2, size / 2, size * .9);
  const u = c.toDataURL(); urlCache.set(k, u); return u;
}
export function ingHTML(id, s, cls = 'ic') {
  const ic = ING[id].icon;
  const main = ic[0] === '@' ? `<img src="${iconURL(ic)}" alt="">` : `<span>${ic}</span>`;
  const b = s && s !== 'r' && STATE_BADGE[s] ? `<i>${STATE_BADGE[s]}</i>` : '';
  return `<b class="${cls}" title="${ING[id].name}">${main}${b}</b>`;
}
export function recipeHTML(rid) {
  return RECIPES[rid].c.map(k => { const [id, s] = k.split(':'); return ingHTML(id, s); }).join('');
}
