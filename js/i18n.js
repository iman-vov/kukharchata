// Кухарчата — мова інтерфейсу: українська (основна), Deutsch, English.
// Переклад іде фразами: усе, що з'являється на сторінці, перекладається автоматично.
import { UI, ING_T, REC_T, COUNTRY_T, STORY } from './i18n-data.js';
import { ING, RECIPES, LEVELS, COUNTRIES } from './data.js';
import { replaceEmoji } from './uiicons.js';

export const LANGS = [['uk', '🇺🇦', 'Українська'], ['de', '🇩🇪', 'Deutsch'], ['en', '🇬🇧', 'English']];
export let LANG = 'uk';
let pairs = [];

function build() {
  const k = LANG === 'de' ? 0 : 1, map = new Map();
  if (LANG === 'uk') { pairs = []; return; }
  const add = (uk, tr) => { if (uk && tr && !map.has(uk)) map.set(uk, tr); };
  for (const r of UI) add(r[0], r[k + 1]);
  for (const id in ING_T) if (ING[id]) add(ING[id].name, ING_T[id][k]);
  for (const id in REC_T) if (RECIPES[id]) add(RECIPES[id].name, REC_T[id][k]);
  for (const cc in COUNTRY_T) if (COUNTRIES[cc]) add(COUNTRIES[cc].name, COUNTRY_T[cc][k]);
  for (const l of LEVELS) {
    const s = STORY[l.id] && STORY[l.id][LANG]; if (!s) continue;
    const uk = [l.city, l.title, ...l.intro.map(x => x[1]), ...l.outro.map(x => x[1])];
    uk.forEach((u, i) => add(u, s[i]));
  }
  add(' з ', LANG === 'de' ? ' von ' : ' of ');
  pairs = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
}
const CYR = /[Ѐ-ӿ]/;
export function tr(s) {
  if (LANG === 'uk' || !s || !CYR.test(s)) return s;
  for (const [a, b] of pairs) if (s.includes(a)) { s = s.split(a).join(b); if (!CYR.test(s)) break; }
  return s;
}
function trNode(n) {
  if (n.nodeType === 3) { const v = n.nodeValue; if (LANG !== 'uk' && CYR.test(v)) { const t = tr(v); if (t !== v) n.nodeValue = t; } replaceEmoji(n); return; }
  if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'INPUT' && n.type !== 'button') {
    if (n.nodeType === 1 && n.tagName === 'INPUT') for (const a of ['placeholder', 'title']) { const v = n.getAttribute(a); if (v && CYR.test(v)) n.setAttribute(a, tr(v)); }
    return;
  }
  for (const a of ['placeholder', 'title', 'aria-label']) { const v = n.getAttribute(a); if (v && CYR.test(v)) n.setAttribute(a, tr(v)); }
  for (const c of [...n.childNodes]) trNode(c);
}
let obs = null;
export function initLang(saved) {
  const nav = (navigator.language || 'uk').toLowerCase();
  LANG = saved || (nav.startsWith('de') ? 'de' : (nav.startsWith('uk') || nav.startsWith('ru')) ? 'uk' : nav.startsWith('en') ? 'en' : 'uk');
  build();
  document.documentElement.lang = LANG;
  document.title = tr('Кухарчата');
  if (!obs) {
    obs = new MutationObserver(ms => {
      for (const m of ms) { if (m.type === 'characterData') trNode(m.target); else m.addedNodes.forEach(trNode); }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  trNode(document.body);
  return LANG;
}
