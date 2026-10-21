// Роботи-помічники: скільки зірок, якщо гравець нічого не робить / грає (імітація) / дитячий режим
// node tools/idletest.mjs [idle|active|kid]
import { Sim, starThresholds } from '../js/sim.js';
import { LEVELS } from '../js/data.js';
const mode = process.argv[2] || 'idle';
const tot = { 0: [0, 0, 0, 0], 1: [0, 0, 0, 0], 2: [0, 0, 0, 0] };
for (let li = 0; li < LEVELS.length; li++) {
  const row = [LEVELS[li].id.padEnd(11)];
  for (const nb of (mode === 'active' ? [0, 1, 2] : [1, 2])) {
    let sum = 0, th; const seeds = [5, 17];
    for (const seed of seeds) {
      let x = seed * 9301 + 49297; const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
      const humans = 1 + Math.floor(nb / 2), kid = mode === 'kid';
      const s = new Sim(li, { humans, rand, kid, assist: nb });
      const h = s.addPlayer({ id: 'h', bot: mode === 'active' }); if (mode === 'active') h.asHuman = true;
      for (let i = 0; i < nb; i++) s.addPlayer({ id: 'b' + i, bot: true });
      s.started = true;
      while (!s.over) { s.step(1 / 30); s.events.length = 0; }
      sum += s.score; th = s.thresholds();
    }
    const sc = Math.round(sum / seeds.length);
    const st = th.filter(t => sc >= t).length; tot[nb][st]++;
    row.push(`${nb}🤖 ${String(sc).padStart(4)} [${th.join('/')}] ${'*'.repeat(st).padEnd(3)}`);
  }
  console.log(row.join('  '));
}
console.log(mode, 'stars 0..3 →', mode === 'active' ? '0 bots:' + tot[0] : '', '1 bot:', tot[1], ' 2 bots:', tot[2]);
