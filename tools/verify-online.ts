import {WebSocket} from 'ws';
import {writeFileSync} from 'node:fs';
import {botCommand} from '../packages/bots/src';
import type {Game} from '../packages/game-core/src';
const room='qa-'+Date.now();
const clients:{socket:WebSocket;view:Game;revision:number;player:string;token:string}[]=[];
async function join(token?:string){const socket=new WebSocket('ws://127.0.0.1:8787',{origin:'http://localhost:5173'});const client:any={socket};await new Promise<void>((resolve,reject)=>{socket.on('error',reject);socket.on('open',()=>socket.send(JSON.stringify({type:'join',room,token})));socket.on('message',data=>{const m=JSON.parse(data.toString());if(m.error){reject(new Error(m.error));return;}client.view=m.view;client.revision=m.revision;client.player=m.player;if(m.token){client.token=m.token;resolve();}});});return client;}
for(let i=0;i<3;i++)clients.push(await join());
let commands=0;let failures=0;const start=performance.now();
async function command(client:typeof clients[number],cmd:Record<string,unknown>){const revision=client.revision;client.socket.send(JSON.stringify({type:'command',revision,command:{...cmd,player:client.player,id:crypto.randomUUID()}}));await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('State update timed out')),5000);const listener=(data:any)=>{const m=JSON.parse(data.toString());if(m.error){clearTimeout(timer);client.socket.off('message',listener);reject(new Error(m.error));}else if(m.revision>revision){clearTimeout(timer);client.socket.off('message',listener);resolve();}};client.socket.on('message',listener);});await new Promise(r=>setTimeout(r,125));commands++;}
while(!clients[0].view.finished){if(commands>400)throw new Error('Termination guard');const s=clients[0].view;let client=clients[0];let cmd:Record<string,unknown>;
 if(s.phase==='negotiation'){const p=s.players.find(p=>!s.ready.includes(p.id));if(p){client=clients.find(c=>c.player===p.id)!;const v={...client.view,commands:[]};cmd=botCommand(v,v.players.find(p=>p.id===client.player)!);}else cmd={type:'advance'};}
 else if(s.phase==='actions'&&s.players.some(p=>p.actions>0)){client=clients[s.active];const v={...client.view,commands:[]};cmd=botCommand(v,v.players[s.active]);}
 else cmd={type:'advance'};
 try{await command(client,cmd);}catch(e){failures++;throw e;}
}
const token=clients[1].token;clients[1].socket.close();const reconnected=await join(token);const evidence={date:new Date().toISOString(),room,players:3,commands,failures,round:reconnected.view.round,finished:reconnected.view.finished,reconnectSeat:reconnected.player,revision:reconnected.revision,durationMs:Math.round(performance.now()-start),persistence:'memory (PostgreSQL not configured; restart recovery not verified)',privateViews:clients.every(c=>!('rng' in c.view)&&!('seed' in c.view)&&!('commands' in c.view))};writeFileSync('docs/production/online-results.json',JSON.stringify(evidence,null,2));console.log(evidence);for(const c of clients)c.socket.close();reconnected.socket.close();
