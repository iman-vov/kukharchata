import { Sim } from '../js/sim.js';
import { LEVELS } from '../js/data.js';
import { writeFileSync } from 'fs';
const out = {};
for (let li=0; li<LEVELS.length; li++){
  const row=[];
  for (let n=1;n<=6;n++){
    let sum=0; const seeds=[11,23,37];
    for (const seed of seeds){ let x=seed*9301+49297; const rand=()=>((x=(x*9301+49297)%233280)/233280);
      const s=new Sim(li,{humans:n,rand}); for(let i=0;i<n;i++) s.addPlayer({id:'b'+i,bot:true}); s.started=true;
      while(!s.over){ s.step(1/30); s.events.length=0; } sum+=s.score; }
    row.push(Math.round(sum/seeds.length));
  }
  // монотонно: більше кухарів — більше очок
  for (let i=1;i<6;i++) row[i]=Math.max(row[i], Math.round(row[i-1]*1.06));
  out[LEVELS[li].id]=row; console.log(LEVELS[li].id, row.join(' '));
}
writeFileSync(new URL('../js/calib.js', import.meta.url), '// Згенеровано tools/calibrate.mjs: середні очки ботів для 1–6 кухарів\nexport const CALIB = ' + JSON.stringify(out) + ';\n');
