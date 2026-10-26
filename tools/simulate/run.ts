import {createGame,score,standings} from '../../packages/game-core/src';
import {runGame} from '../../packages/bots/src';
import {writeFileSync,mkdirSync} from 'node:fs';
const games=Number(process.argv[2]??'100');const start=performance.now();
const rows:{seed:number;players:number;winner:number;seat:number;firms:number[];score:number;commands:number;delivered:number;failed:number;agreements:number;unrest:number;lead:number}[]=[];
for(let i=0;i<games;i++){
 const n=2+i%4;const s=runGame(createGame(1000+i,n,true,Math.floor(i/4)%5));
 const win=standings(s)[0];rows.push({seed:s.seed,players:n,winner:win.firm,seat:s.players.indexOf(win),firms:s.players.map(p=>p.firm),score:score(win),commands:s.commands.length,delivered:s.log.filter(e=>e.kind==='delivery').length,failed:s.log.filter(e=>e.kind==='failure').length,agreements:s.log.filter(e=>e.kind==='agreement').length,unrest:s.log.filter(e=>e.kind==='unrest').length,lead:score(win)-score(standings(s)[1])});
 if(i%1000===999)process.stdout.write(`${i+1} games completed\n`);
}
const byCount=[2,3,4,5].map(n=>{const subset=rows.filter(r=>r.players===n);return {players:n,games:subset.length,wins:Array.from({length:n},(_,seat)=>({seat,wins:subset.filter(r=>r.seat===seat).length,rate:subset.filter(r=>r.seat===seat).length/subset.length})),averageCommands:subset.reduce((a,r)=>a+r.commands,0)/subset.length,averageDeliveries:subset.reduce((a,r)=>a+r.delivered,0)/subset.length,averageFailures:subset.reduce((a,r)=>a+r.failed,0)/subset.length};});

const report={date:new Date().toISOString(),games,durationMs:Math.round(performance.now()-start),bot:'heuristic-v1; rotated first-house faction; remaining seats not fully permuted; no consortium proposals or unrest policy',byCount,humanGameDuration:'not measured',downtime:'not measured',balanceGate:'NOT VALIDATED: partial seat/faction confounding; no human playtests; limited strategy coverage',rows};
mkdirSync('docs/playtests',{recursive:true});writeFileSync('docs/playtests/simulation.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined},null,2));
