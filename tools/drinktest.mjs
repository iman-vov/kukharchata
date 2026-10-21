import { Sim } from '../js/sim.js';
import { LEVELS } from '../js/data.js';
for (const id of process.argv.slice(2)) {
  const li = LEVELS.findIndex(l => l.id === id);
  for (const n of [1, 3]) {
    let x = 7; const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    const s = new Sim(li, { humans: n, rand, drinks: true });
    for (let i = 0; i < n; i++) s.addPlayer({ id: 'b' + i, bot: true });
    s.started = true; const served = {};
    while (!s.over) { s.step(1 / 30); for (const e of s.events) if (e.e === 'serve') served[e.r] = (served[e.r] || 0) + 1; s.events.length = 0; }
    console.log(id, n, s.score, s.failed + 'f', JSON.stringify(served), s.tiles.filter(t => t.drink).map(t => t.type + (t.liq || t.ing || '')).join(','));
  }
}
