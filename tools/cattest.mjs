import { Sim } from '../js/sim.js';
import { LEVELS } from '../js/data.js';
const id = process.argv[2] || 'delhi', n = +(process.argv[3] || 2);
const li = LEVELS.findIndex(l => l.id === id);
let x = 7; const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
const s = new Sim(li, { humans: n, rand, botSkill: 'full' });
for (let i = 0; i < n; i++) s.addPlayer({ id: 'b' + i, bot: true });
s.started = true; const ev = {};
while (!s.over) { s.step(1 / 30); for (const e of s.events) if (['catin', 'steal', 'scared', 'catout', 'sniff'].includes(e.e)) { ev[e.e] = (ev[e.e] || 0) + 1; if (e.e === 'catout' && e.stole) ev.lost = (ev.lost || 0) + 1; } s.events.length = 0; }
console.log(id, 'score', s.score, 'dv', s.delivered, 'fl', s.failed, ev);
