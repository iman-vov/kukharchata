import { Sim, parseLevel } from '../js/sim.js';
import { LEVELS, ING } from '../js/data.js';
// перевірка розмітки: усе важливе досяжне з точки старту
function checkLayout(li){
  const s = new Sim(li); const lv = LEVELS[li]; const errs=[];
  for (const row of lv.grid) if (row.length!==lv.grid[0].length) errs.push('row len '+row);
  const p = s.addPlayer({id:'a'});
  const need = s.tiles.filter(t=>!['floor','void','counter','conv'].includes(t.type));
  for (const t of need) if (s.dist(p,t)===Infinity) errs.push(`unreachable ${t.type}${t.ing?':'+t.ing:''} @${t.x},${t.y}`);
  for (const k in lv.crates) if (!lv.grid.join('').includes(k)) errs.push('crate missing '+k);
  for (const r of lv.recipes) for (const c of (await_rec(r))) { const id=c.split(':')[0]; if(!Object.values(lv.crates).includes(id)) errs.push('no crate for '+id); }
  if (!s.tiles.some(t=>t.ch==='E') && lv.fire) errs.push('no extinguisher');
  if (lv.wash && !s.tiles.some(t=>t.type==='sink')) errs.push('no sink');
  return errs;
}
import { RECIPES } from '../js/data.js';
function await_rec(r){ return RECIPES[r].c; }
function run(li, bots, seed=1){
  let x = seed*9301+49297; const rand=()=>((x=(x*9301+49297)%233280)/233280);
  const s = new Sim(li,{humans:bots, rand, botSkill:'full'});
  for (let i=0;i<bots;i++) s.addPlayer({id:'b'+i, bot:true});
  s.started = true; const dt=1/30;
  while(!s.over) { s.step(dt); s.events.length=0; }
  return s;
}
const only = process.argv[2];
for (let li=0; li<LEVELS.length; li++){
  if (only && LEVELS[li].id!==only) continue;
  const e = checkLayout(li);
  const res=[];
  for (const n of [1,2,4,6]) { const s=run(li,n,n+3); res.push(`${n}:${s.score}/${s.delivered}d/${s.failed}f`); }
  console.log(LEVELS[li].id.padEnd(8), e.length? 'ERR '+e.join('; ') : 'ok', res.join('  '));
}
