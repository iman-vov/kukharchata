// Кухарчата — звуки й весела музика, синтезовані Web Audio (без файлів)
let ctx = null, master, sfxBus, musBus, noiseBuf;
export const vol = { music: 0.5, sfx: 0.8 };

export function audioInit() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  musBus = ctx.createGain(); musBus.connect(master);
  setVolumes();
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function setVolumes() { if (!ctx) return; sfxBus.gain.value = vol.sfx * 0.6; musBus.gain.value = vol.music * 0.22; }

function tone(f, t0, dur, type = 'sine', g = 0.3, bus = sfxBus, f2 = null) {
  const o = ctx.createOscillator(), a = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(g, t0 + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(a); a.connect(bus); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(t0, dur, g = 0.2, freq = 2000, q = 1, type = 'bandpass') {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const a = ctx.createGain(); a.gain.setValueAtTime(g, t0); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(a); a.connect(sfxBus); s.start(t0); s.stop(t0 + dur + 0.02);
}
let lastChop = 0;
export function sfx(name) {
  if (!ctx) return;
  const t = ctx.currentTime;
  switch (name) {
    case 'pick': tone(520, t, 0.08, 'triangle', 0.25, sfxBus, 780); break;
    case 'drop': tone(420, t, 0.09, 'triangle', 0.22, sfxBus, 260); break;
    case 'chop': if (t - lastChop > 0.11) { lastChop = t; noise(t, 0.05, 0.35, 3200, 2); tone(180, t, 0.05, 'square', 0.06); } break;
    case 'chopped': tone(880, t, 0.08, 'sine', 0.2); tone(1320, t + 0.06, 0.1, 'sine', 0.18); break;
    case 'serve': [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.18, 'triangle', 0.22)); break;
    case 'wrong': tone(180, t, 0.25, 'sawtooth', 0.12, sfxBus, 120); break;
    case 'order': tone(1046, t, 0.15, 'sine', 0.2); tone(1318, t + 0.1, 0.25, 'sine', 0.18); break;
    case 'expired': tone(392, t, 0.2, 'triangle', 0.2, sfxBus, 330); tone(311, t + 0.18, 0.35, 'triangle', 0.2, sfxBus, 262); break;
    case 'fire': noise(t, 0.6, 0.3, 600, 0.6); tone(880, t, 0.12, 'square', 0.08); tone(660, t + 0.14, 0.12, 'square', 0.08); break;
    case 'out': noise(t, 0.4, 0.25, 5000, 0.4, 'highpass'); break;
    case 'spray': noise(t, 0.15, 0.12, 6000, 0.3, 'highpass'); break;
    case 'cooked': tone(1568, t, 0.12, 'sine', 0.15); tone(2093, t + 0.08, 0.18, 'sine', 0.13); break;
    case 'washed': for (let i = 0; i < 3; i++) tone(600 + Math.random() * 700, t + i * 0.05, 0.08, 'sine', 0.12, sfxBus, 1500); break;
    case 'wash': if (t - lastChop > 0.18) { lastChop = t; tone(500 + Math.random() * 500, t, 0.07, 'sine', 0.08, sfxBus, 1200); } break;
    case 'dash': noise(t, 0.18, 0.18, 900, 0.5, 'lowpass'); break;
    case 'plate': tone(1800, t, 0.06, 'triangle', 0.1); break;
    case 'tick': noise(t, 0.03, 0.4, 4200, 6); tone(2100, t, 0.03, 'square', 0.05); break;
    case 'tock': noise(t, 0.03, 0.35, 2600, 6); tone(1500, t, 0.03, 'square', 0.05); break;
    case 'alarm': for (let i = 0; i < 18; i++) { tone(i % 2 ? 1760 : 2093, t + i * 0.07, 0.07, 'square', 0.13); } noise(t, 1.3, 0.08, 3500, 3); break;
    case 'hurry': tone(880, t, 0.12, 'triangle', 0.2); tone(1175, t + 0.13, 0.12, 'triangle', 0.2); tone(880, t + 0.26, 0.12, 'triangle', 0.2); tone(1175, t + 0.39, 0.2, 'triangle', 0.2); break;
    case 'go': tone(523, t, 0.15, 'triangle', 0.25); tone(659, t + 0.12, 0.15, 'triangle', 0.25); tone(784, t + 0.24, 0.3, 'triangle', 0.25); break;
    case 'star': tone(1318, t, 0.25, 'triangle', 0.22); tone(1976, t + 0.05, 0.35, 'sine', 0.15); break;
    case 'end': [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.12, 0.3, 'triangle', 0.22)); break;
    case 'meow': tone(620, t, 0.18, 'sine', 0.16, sfxBus, 900); tone(900, t + 0.16, 0.28, 'sine', 0.14, sfxBus, 520); break;
    case 'steal': tone(1200, t, 0.06, 'triangle', 0.12); tone(700, t + 0.06, 0.1, 'triangle', 0.12); break;
    case 'hiss': noise(t, 0.35, 0.25, 5200, 1.2, 'highpass'); tone(300, t, 0.15, 'sawtooth', 0.06, sfxBus, 180); break;
    case 'msg': tone(988, t, 0.1, 'sine', 0.18); tone(1319, t + 0.09, 0.16, 'sine', 0.16); break;
    case 'click': tone(700, t, 0.05, 'triangle', 0.15); break;
    case 'join': tone(660, t, 0.12, 'sine', 0.2); tone(990, t + 0.1, 0.2, 'sine', 0.2); break;
    case 'nope': tone(220, t, 0.1, 'square', 0.08); break;
    case 'throw': noise(t, 0.2, 0.2, 1800, 0.7); tone(500, t, 0.15, 'sine', 0.1, sfxBus, 900); break;
    case 'gate': tone(140, t, 0.18, 'square', 0.1, sfxBus, 90); noise(t, 0.15, 0.15, 500, 1); break;
    case 'wind': noise(t, 1.4, 0.25, 700, 0.4, 'lowpass'); break;
    case 'trash': noise(t, 0.2, 0.2, 400, 1); break;
  }
}

/* ---------- музика: короткі весели мелодії на кожну країну ---------- */
const SCALES = {
  ge: [0, 2, 3, 5, 7, 8, 10], cn: [0, 2, 4, 7, 9], in: [0, 1, 4, 5, 7, 8, 11], fr: [0, 2, 4, 6, 7, 9, 11], ua: [0, 2, 3, 5, 7, 8, 10], it: [0, 2, 4, 5, 7, 9, 11], jp: [0, 2, 3, 7, 8], mx: [0, 2, 4, 5, 7, 9, 10], us: [0, 3, 5, 6, 7, 10], map: [0, 2, 4, 7, 9],
};
const ROOT = { ge: 60, cn: 64, in: 62, fr: 65, ua: 57, it: 60, jp: 62, mx: 59, us: 55, map: 60 };
let mus = null;
export function music(theme, tempo = 116) {
  if (!ctx) return;
  if (mus && mus.theme === theme) return;
  stopMusic();
  let seed = [...theme].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const sc = SCALES[theme] || SCALES.map, root = ROOT[theme] || 60;
  const mel = [], bass = [];
  for (let i = 0; i < 32; i++) mel.push(rnd() < 0.72 ? sc[Math.floor(rnd() * sc.length)] + (rnd() < 0.25 ? 12 : 0) : null);
  for (let i = 0; i < 8; i++) bass.push([0, 0, 5, 7, 0, 3, 5, 7][i] % 12);
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const spb = 60 / tempo / 2;
  mus = { theme, step: 0, next: ctx.currentTime + 0.1, rate: 1 };
  mus.timer = setInterval(() => {
    while (mus && mus.next < ctx.currentTime + 0.25) {
      const s = mus.step, t = mus.next;
      const n = mel[s % 32];
      if (n !== null && n !== undefined) tone(midi(root + 12 + n), t, spb * 1.6 / mus.rate, theme === 'jp' ? 'sine' : 'triangle', 0.16, musBus);
      if (s % 4 === 0) tone(midi(root - 12 + bass[(s >> 2) % 8]), t, spb * 3, 'sine', 0.3, musBus);
      if (s % 2 === 1) { const src = ctx.createBufferSource(); src.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const a = ctx.createGain(); a.gain.setValueAtTime(0.05, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); src.connect(f); f.connect(a); a.connect(musBus); src.start(t); src.stop(t + 0.05); }
      mus.step++; mus.next += spb / mus.rate;
    }
  }, 60);
}
// остання хвилина — музика швидшає
export function musicRate(r) { if (mus) mus.rate = r; }
export function stopMusic() { if (mus) { clearInterval(mus.timer); mus = null; } }
