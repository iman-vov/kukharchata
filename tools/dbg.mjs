import { Sim } from '../js/sim.js';
import { LEVELS } from '../js/data.js';
const [id, n, every='20', seed='5'] = process.argv.slice(2);
const li = LEVELS.findIndex(l=>l.id===id);
let x = +seed*9301+49297; const rand=()=>((x=(x*9301+49297)%233280)/233280);
const s = new Sim(li,{humans:+n, rand}); for (let i=0;i<+n;i++) s.addPlayer({id:'b'+i,bot:true}); s.started=true;
const it = i => !i? '-' : i.t==='i'? i.id+':'+i.s : i.t==='p'? 'P['+i.c.map(c=>c.id+':'+c.s).join(',')+']' : i.t==='k'? i.k+'['+i.c.map(c=>c.id+':'+c.s).join(',')+'|'+i.ct.toFixed(1)+']' : i.t==='d'? 'dirty'+i.n : i.t;
let next=0;
while(!s.over){ s.step(1/30); for(const e of s.events) if(['serve','expired','fire','burnt','wrong'].includes(e.e)) console.log(s.elapsed.toFixed(1), e.e, e.r||'', e.x??'', e.y??''); s.events.length=0;
 if (s.elapsed>=next){ next+= +every;
  console.log('--- t='+s.elapsed.toFixed(0), 'orders', s.orders.map(o=>o.r).join(','), 'deficit', s.analyze().deficit.join(','));
  for (const p of s.players) console.log('  ',p.id, p.x.toFixed(1),p.y.toFixed(1), 'held', it(p.held), 'goal', p.bot.goal? p.bot.goal.act+'@'+p.bot.goal.x+','+p.bot.goal.y : '-', p.act);
  console.log('   tiles:', s.tiles.filter(t=>t.item||t.ck&&t.ck.c.length||t.fire>0||t.dirty||t.type==='sink').map(t=>`${t.type[0]}${t.x},${t.y}=${it(t.item||t.ck)}${t.fire>0?'🔥':''}${t.type==='sink'||t.type==='plates'?`(c${t.clean}d${t.dirty})`:''}`).join(' '));
 }}
console.log('score', s.score);
