import {z} from 'zod';
import {COUNTRIES,EVENTS,FIRMS,GOODS,PHASES,type Good,type Phase} from './content';
export * from './content';
import {initializePolitics,getLeader,changeGovernment,resolvePoliticalWorld,politicalTender,afterPoliticalDelivery,validatePoliticalState,track,type PoliticalState} from './politics';
export * from './politics';
export type Inventory = Record<Good,number>;
export interface Player {id:string;name:string;firm:number;cash:number;debt:number;inventory:Inventory;logistics:number;contacts:number;investigation:number;reputation:number;prestige:number;delivered:number;actions:number;relationships:Record<string,number>;objective:'legitimate'|'diplomat'|'consortium';coalitions:number;bot:boolean}
export interface Country {id:string;name:string;stability:number;demand:number;leader:number;sanctions:boolean;stance:'open'|'neutral'|'guarded';politics?:PoliticalState}
export interface Tender {id:string;country:string;good:Good;quantity:number;logistics:number;relationship:number;payout:number;deadline:number;legal:'legal'|'gray'|'black';minReputation?:number;minContacts?:number;policyLeaderId?:string;risk:number;penalty:number;prestige:number;status:'open'|'awarded'|'delivered'|'failed';winner?:string}
export interface Pledge {player:string;quantity:number;logistics:number;revenue:number;liability:number}
export interface Bid {id:string;tender:string;player:string;offer:number;sequence:number;pledges:Pledge[];escrow:number}
export interface Agreement {id:string;tender:string;proposer:string;offer:number;pledges:Pledge[];accepted:string[];status:'draft'|'signed'|'withdrawn'}
export interface LogEntry {seq:number;round:number;phase:Phase;text:string;kind:string}
export interface Game {version:1;rulesVersion?:2;initialFirmOrder?:number[];humanFirm:number;seed:number;rng:number;round:number;phase:Phase;first:number;active:number;finished:boolean;players:Player[];countries:Country[];tenders:Tender[];bids:Bid[];agreements:Agreement[];prices:Inventory;stock:Inventory;ready:string[];event:number;log:LogEntry[];commands:Command[];ids:string[]}
const goodSchema=z.enum(GOODS);
const pledgeSchema=z.object({player:z.string().max(40),quantity:z.number().int().min(0).max(8),logistics:z.number().int().min(0).max(3),revenue:z.number().int().min(0).max(100),liability:z.number().int().min(0).max(100)}).strict();
const base={id:z.string().min(1).max(100),player:z.string().min(1).max(40)};
export const CommandSchema=z.discriminatedUnion('type',[
 z.object({...base,type:z.literal('advance')}).strict(),z.object({...base,type:z.literal('ready')}).strict(),
 z.object({...base,type:z.enum(['acquire','sell']),good:goodSchema}).strict(),
 z.object({...base,type:z.enum(['influence','unrest','stabilize']),country:z.string().max(4)}).strict(),
 z.object({...base,type:z.enum(['audit','network','pass']),upgrade:z.enum(['contact','logistics']).optional()}).strict(),
 z.object({...base,type:z.literal('refinance'),repay:z.boolean()}).strict(),
 z.object({...base,type:z.literal('bid'),tender:z.string().max(50),offer:z.number().int().min(1).max(30)}).strict(),
 z.object({...base,type:z.literal('transport'),tender:z.string().max(50)}).strict(),
 z.object({...base,type:z.literal('propose'),tender:z.string().max(50),offer:z.number().int().min(1).max(30),pledges:z.array(pledgeSchema).min(2).max(5)}).strict(),
 z.object({...base,type:z.enum(['accept','withdraw']),agreement:z.string().max(100)}).strict()
]);
export type Command=z.infer<typeof CommandSchema>;
const inv=(n=0):Inventory=>({medical:n,communications:n,vehicles:n});
const clamp=(n:number,a=0,b=6)=>Math.max(a,Math.min(b,n));
export function random(s:Game,max:number){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return Math.floor(s.rng/4294967296*max);}
function log(s:Game,text:string,kind='action'){s.log.push({seq:s.log.length,round:s.round,phase:s.phase,text,kind});}
function requireRule(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
export function createGame(seed=20261025,count=3,bots=true,humanFirm=0,options?:{rulesVersion:2;firmOrder?:number[]}):Game {
 requireRule(Number.isInteger(seed)&&seed>=0&&seed<=4294967295,'Seed must be an unsigned 32-bit integer.');requireRule(Number.isInteger(count)&&count>=2&&count<=5,'Choose 2–5 houses.');
 requireRule(Number.isInteger(humanFirm)&&humanFirm>=0&&humanFirm<5,'Unknown firm.');
 const s:Game={version:1,humanFirm,seed,rng:seed,round:1,phase:'world',first:0,active:0,finished:false,players:[],countries:COUNTRIES.map(([id,name],i)=>({id,name,stability:3+i%3,demand:2+i%3,leader:0,sanctions:false,stance:i%3===0?'open':i%3===1?'neutral':'guarded'})),tenders:[],bids:[],agreements:[],prices:{medical:2,communications:3,vehicles:4},stock:inv(8),ready:[],event:0,log:[],commands:[],ids:[]};
 const seats=options?.firmOrder??[humanFirm,...[0,1,2,3,4].filter(f=>f!==humanFirm)];
 requireRule(seats.length>=count&&new Set(seats).size===seats.length&&seats.every(f=>Number.isInteger(f)&&f>=0&&f<5),'Invalid unique firm order.');
 if(options){s.rulesVersion=2;if(options.firmOrder)s.initialFirmOrder=[...options.firmOrder];initializePolitics(s,max=>random(s,max));}
 for(let i=0;i<count;i++){const f=seats[i];s.players.push({id:`p${i}`,name:FIRMS[f].name,firm:f,cash:f===2?12:10,debt:0,inventory:{...inv(),[GOODS[f%3]]:2},logistics:f===0?2:1,contacts:f===3?2:1,investigation:0,reputation:f===1?2:1,prestige:0,delivered:0,actions:3,relationships:{},objective:f%3===0?'legitimate':f%3===1?'diplomat':'consortium',coalitions:0,bot:bots&&i>0});}
 if(s.rulesVersion===2){for(const house of s.players)house.objective=(['legitimate','diplomat','consortium'] as const)[random(s,3)];}
 refreshTenders(s);s.first=random(s,count);s.active=s.first;log(s,'The table is open. Every promise has a price.','setup');return s;
}
function refreshTenders(s:Game){
 s.tenders=s.tenders.filter(t=>t.status==='awarded'||(t.status==='open'&&t.deadline>=s.round));
 const n=s.players.length+2;
 for(let i=0;i<n;i++){const c=s.countries[random(s,s.countries.length)];const good=GOODS[random(s,3)];const quantity=s.rulesVersion===2&&i===n-1?3:1+random(s,2);if(s.rulesVersion===2){s.tenders.push(politicalTender(s,c,good,quantity,`r${s.round}-t${i}`));continue;}s.tenders.push({id:`r${s.round}-t${i}`,country:c.id,good,quantity,logistics:1,relationship:0,payout:quantity*s.prices[good]+4+Math.floor(c.demand/2),deadline:Math.min(8,s.round+1),legal:c.stability<2?'gray':'legal',risk:c.stability<2?2:0,penalty:3,prestige:quantity===1?1:2,status:'open'});}
}
export function reserved(s:Game,pid:string,good?:Good):number{
 return s.bids.filter(b=>s.tenders.some(t=>t.id===b.tender&&(t.status==='open'||t.status==='awarded'))).reduce((n,b)=>n+b.pledges.filter(p=>p.player===pid).reduce((m,p)=>m+(good?(s.tenders.find(t=>t.id===b.tender)!.good===good?p.quantity:0):p.logistics),0),0);
}
export function available(s:Game,p:Player,good:Good){return p.inventory[good]-reserved(s,p.id,good);}
export function score(p:Player){return Math.floor((p.cash+p.inventory.medical+p.inventory.communications+p.inventory.vehicles-p.debt)/2)+p.prestige+Object.values(p.relationships).filter(x=>x>=2).length+(p.objective==='legitimate'&&p.investigation===0&&p.delivered>=3?4:p.objective==='diplomat'&&Object.values(p.relationships).filter(x=>x>=2).length>=3?5:p.objective==='consortium'&&p.coalitions>=2?5:0)-p.investigation*2;}
export function standings(s:Game){return [...s.players].sort((a,b)=>score(b)-score(a)||b.prestige-a.prestige||a.investigation-b.investigation||b.cash-a.cash||a.id.localeCompare(b.id));}
function pay(p:Player,n:number){requireRule(p.cash>=n,`Need ${n} money; only ${p.cash} available.`);p.cash-=n;}
function loss(p:Player,n:number){const cash=Math.min(p.cash,n);p.cash-=cash;const debt=Math.min(9-p.debt,n-cash);p.debt+=debt; p.prestige=Math.max(0,p.prestige-(n-cash-debt));}
function allocation(total:number,pledges:Pledge[],key:'revenue'|'liability'){
 const values=pledges.map(p=>Math.floor(total*p[key]/100));let remain=total-values.reduce((a,b)=>a+b,0);
 const order=pledges.map((p,i)=>({i,remainder:total*p[key]%100})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 for(const {i} of order){if(remain--<=0)break;values[i]++;}return values;
}
function validatePledges(s:Game,t:Tender,pledges:Pledge[],draftActor?:string){
 requireRule(new Set(pledges.map(x=>x.player)).size===pledges.length,'A participant may appear only once.');
 requireRule(pledges.reduce((a,p)=>a+p.revenue,0)===100&&pledges.reduce((a,p)=>a+p.liability,0)===100,'Revenue and liability shares must each total 100%.');
 requireRule(pledges.reduce((a,p)=>a+p.quantity,0)===t.quantity&&pledges.reduce((a,p)=>a+p.logistics,0)>=t.logistics,'Pledges must cover exactly the cargo and required logistics.');
 for(const pledge of pledges){const p=s.players.find(p=>p.id===pledge.player);requireRule(p,'Unknown participant.');if(!draftActor||draftActor===p.id){requireRule(available(s,p,t.good)>=pledge.quantity,'Pledged supply is unavailable or already reserved.');requireRule(p.logistics-reserved(s,p.id)>=pledge.logistics,'Pledged logistics is unavailable or already reserved.');}requireRule((p.relationships[t.country]??0)>=t.relationship,'Relationship requirement not met.');requireRule(p.investigation<5||(s.rulesVersion===2&&t.legal==='black'),'Investigation excludes this participant from tenders.');if(s.rulesVersion===2){requireRule(pledge.quantity+pledge.logistics>0,'Every consortium participant must contribute cargo or logistics.');requireRule(p.reputation>=(t.minReputation??0),'Reputation requirement not met.');requireRule(p.contacts>=(t.minContacts??0),'Contact requirement not met.');}}
}
function addBid(s:Game,p:Player,t:Tender,offer:number,pledges:Pledge[]){
 requireRule(t.status==='open','Tender is closed.');requireRule(offer<=t.payout,'Offer exceeds the tender ceiling.');requireRule(!s.bids.some(b=>b.tender===t.id&&b.player===p.id),'Already submitted a bid on this tender.');requireRule(p.actions>0,'No actions remaining.');validatePledges(s,t,pledges);pay(p,1);p.actions--;s.bids.push({id:`bid-${s.commands.length}`,player:p.id,tender:t.id,offer,sequence:s.commands.length,pledges,escrow:1});
}
function award(s:Game){
 for(const t of s.tenders.filter(t=>t.status==='open')){
 const bids=s.bids.filter(b=>b.tender===t.id).map(b=>({...b,tie:random(s,6)}));
 bids.sort((a,b)=>a.offer-b.offer||(s.players.find(p=>p.id===b.player)!.relationships[t.country]??0)-(s.players.find(p=>p.id===a.player)!.relationships[t.country]??0)||a.sequence-b.sequence||b.tie-a.tie);
 if(bids.length){const winner=bids[0];t.status='awarded';t.winner=winner.id;log(s,`${s.players.find(p=>p.id===winner.player)!.name} wins ${t.country} at ${winner.offer}.`,'award');for(const b of bids.slice(1))s.players.find(p=>p.id===b.player)!.cash+=b.escrow;s.bids=s.bids.filter(b=>b.tender!==t.id||b.id===winner.id);}
 }
 for(const a of s.agreements.filter(a=>a.status==='draft'))a.status='withdrawn';
}
function settle(s:Game,t:Tender,success:boolean){
 const b=s.bids.find(b=>b.id===t.winner)!;const prestigeShares=s.rulesVersion===2?allocation(t.prestige,b.pledges,'revenue'):undefined;const payouts=allocation(success?b.offer:t.penalty,b.pledges,success?'revenue':'liability');
 b.pledges.forEach((pledge,i)=>{const p=s.players.find(p=>p.id===pledge.player)!;if(success){p.cash+=payouts[i];p.inventory[t.good]-=pledge.quantity;p.delivered++;if(pledge.revenue>0)p.prestige+=prestigeShares?prestigeShares[i]:t.prestige;if(b.pledges.length>1)p.coalitions++;}else{loss(p,payouts[i]);p.reputation=Math.max(0,p.reputation-1);}});
 if(success){s.players.find(p=>p.id===b.player)!.cash+=b.escrow;if(s.rulesVersion===2)afterPoliticalDelivery(s,s.countries.find(c=>c.id===t.country)!,t,b.pledges.map(x=>s.players.find(p=>p.id===x.player)!));}
 t.status=success?'delivered':'failed';log(s,`${t.country} ${success?'delivery settled':'contract failed'}: ${t.id}.`,success?'delivery':'failure');
}
function advance(s:Game){
 const phase=s.phase;
 if(phase==='world'){
 s.event=random(s,EVENTS.length);const e=EVENTS[s.event];
 if(e.effect==='calm')s.countries.forEach(c=>c.stability=clamp(c.stability+1));
 if(e.effect==='price')s.prices.communications=clamp(s.prices.communications+1,1,8);
 if(e.effect==='scrutiny')s.players.filter(p=>p.investigation>=3).forEach(p=>p.reputation=Math.max(0,p.reputation-1));
 if(e.effect==='demand')s.countries.forEach(c=>c.demand=clamp(c.demand+1));
 if(e.effect==='relief'){const c=[...s.countries].sort((a,b)=>a.stability-b.stability)[0];c.stability=clamp(c.stability+2);}
 if(s.rulesVersion===2)resolvePoliticalWorld(s,e.effect,max=>random(s,max),(text,kind)=>log(s,text,kind));log(s,e.name,'event');
 }else if(phase==='income'){
 s.players.forEach(p=>{p.cash+=3;loss(p,Math.ceil(p.debt/3)+(p.logistics>1?1:0)+(EVENTS[s.event].effect==='credit'&&p.debt>0?1:0));});log(s,'Income paid. Debt and extra logistics upkeep settled.','income');
 }else if(phase==='negotiation')award(s);
 else if(phase==='delivery'){
 for(const t of s.tenders.filter(t=>t.status==='awarded'&&t.deadline<=s.round))settle(s,t,false);
 for(const p of s.players.filter(p=>p.investigation>0)){
 const roll=random(s,6)+1;if(roll<=p.investigation){const g=GOODS.find(g=>available(s,p,g)>0);if(g)p.inventory[g]--;loss(p,2);p.reputation=Math.max(0,p.reputation-1);log(s,`${p.name}: enforcement roll ${roll}, confiscation and 2 fine.`,'enforcement');}}
 }else if(phase==='scoring'){
 if(s.round===8){for(const t of s.tenders.filter(t=>t.status==='awarded'))settle(s,t,false);s.finished=true;log(s,`${standings(s)[0].name} leads the final ledger.`,'final');return;}
 s.round++;s.first=(s.first+1)%s.players.length;s.active=s.first;s.players.forEach(p=>p.actions=3);s.ready=[];
 for(const g of GOODS){s.stock[g]=Math.min(12,s.stock[g]+s.players.length);if(s.stock[g]>=8)s.prices[g]=Math.max(1,s.prices[g]-1);}
 s.countries.forEach(c=>{c.sanctions=c.stability<=1||(c.politics?.exposure??0)>=5;});refreshTenders(s);
 }
 s.phase=PHASES[(PHASES.indexOf(phase)+1)%6];s.ready=[];if(s.phase==='actions')s.active=s.first;
}
export function execute(input:Game,raw:unknown):Game {
 const cmd=CommandSchema.parse(raw);requireRule(input.version===1,'Unsupported state version.');if(input.ids.includes(cmd.id))return input;
 requireRule(!input.finished,'The game has ended.');const {log:history,commands:commandsHistory,ids:idsHistory,...current}=input;const s:Game={...structuredClone(current),log:history.slice(),commands:commandsHistory.slice(),ids:idsHistory.slice()};const p=s.players.find(p=>p.id===cmd.player);requireRule(p,'Unknown player.');
 const actionTypes=['acquire','sell','influence','network','transport','audit','unrest','stabilize','refinance','pass'];
 if(actionTypes.includes(cmd.type)){requireRule(s.phase==='actions','Wait for the Player Actions phase.');requireRule(s.players[s.active].id===p.id,'It is another house’s turn.');requireRule(p.actions>0,'No actions remaining.');}
 if(cmd.type==='advance'){
 requireRule(s.phase!=='negotiation'||s.players.every(p=>s.ready.includes(p.id)),'Every house must seal its negotiation.');requireRule(s.phase!=='actions'||s.players.every(p=>p.actions===0),'Resolve remaining player actions.');advance(s);
 }else if(cmd.type==='ready'){
 requireRule(s.phase==='negotiation','Ready is only available during negotiation.');requireRule(!s.ready.includes(p.id),'Already sealed.');s.ready.push(p.id);log(s,`${p.name} seals their offers.`,'ready');
 }else if(cmd.type==='bid'||cmd.type==='propose'){
 requireRule(s.phase==='negotiation'&&!s.ready.includes(p.id),'Negotiation is closed for this house.');const t=s.tenders.find(t=>t.id===cmd.tender);requireRule(t,'Unknown tender.');
 if(cmd.type==='bid'){addBid(s,p,t,cmd.offer,[{player:p.id,quantity:t.quantity,logistics:t.logistics,revenue:100,liability:100}]);log(s,`${p.name} submits a sealed offer.`,'bid');}
 else {requireRule(cmd.pledges.some(x=>x.player===p.id),'Proposer must participate.');requireRule(t.status==='open'&&cmd.offer<=t.payout,'Tender is closed or offer exceeds ceiling.');validatePledges(s,t,cmd.pledges,s.rulesVersion===2?p.id:undefined);requireRule(s.agreements.filter(a=>a.status==='draft').length<10,'Ten draft limit.');s.agreements.push({id:cmd.id,tender:t.id,proposer:p.id,offer:cmd.offer,pledges:cmd.pledges,accepted:[p.id],status:'draft'});log(s,`${p.name} proposes a consortium.`,'proposal');}
 }else if(cmd.type==='accept'||cmd.type==='withdraw'){
 requireRule(s.phase==='negotiation'&&!s.ready.includes(p.id),'Negotiation is closed for this house.');const a=s.agreements.find(a=>a.id===cmd.agreement);requireRule(a&&a.status==='draft','Agreement is no longer a draft.');requireRule(a.pledges.some(x=>x.player===p.id),'Only named participants may sign or withdraw.');
 if(cmd.type==='withdraw'){a.status='withdrawn';log(s,`${p.name} withdraws from an unsigned proposal.`,'withdraw');}
 else {requireRule(!a.accepted.includes(p.id),'Already signed.');if(s.rulesVersion===2)validatePledges(s,s.tenders.find(t=>t.id===a.tender)!,a.pledges,p.id);a.accepted.push(p.id);if(a.accepted.length===a.pledges.length){const proposer=s.players.find(p=>p.id===a.proposer)!;requireRule(!s.ready.includes(proposer.id),'Proposer has sealed negotiation.');addBid(s,proposer,s.tenders.find(t=>t.id===a.tender)!,a.offer,a.pledges);a.status='signed';log(s,'Consortium signed: pledged resources reserved.','agreement');}}
 }else if(cmd.type==='acquire'){
 requireRule(s.stock[cmd.good]>0,'Market stock is empty.');requireRule(GOODS.reduce((a,g)=>a+p.inventory[g],0)<(p.firm===4?8:6),'Storage is full.');pay(p,s.prices[cmd.good]);p.inventory[cmd.good]++;s.stock[cmd.good]--;s.prices[cmd.good]=Math.min(8,s.prices[cmd.good]+1);log(s,`${p.name} acquires ${cmd.good}.`);
 }else if(cmd.type==='sell'){
 requireRule(available(s,p,cmd.good)>0,'No unreserved supply to sell.');p.inventory[cmd.good]--;p.cash+=Math.max(0,s.prices[cmd.good]-1);s.stock[cmd.good]=Math.min(12,s.stock[cmd.good]+1);s.prices[cmd.good]=Math.max(1,s.prices[cmd.good]-1);log(s,`${p.name} sells ${cmd.good}.`);
 }else if(cmd.type==='influence'||cmd.type==='unrest'||cmd.type==='stabilize'){
 const c=s.countries.find(c=>c.id===cmd.country);requireRule(c,'Unknown country.');
 if(cmd.type==='influence'){requireRule((p.relationships[c.id]??0)<3,'Relationship already at 3.');pay(p,s.rulesVersion===2&&p.contacts>=2?1:2);if(c.politics){c.politics.legitimacy=track(c.politics.legitimacy+1);c.politics.pressure=track(c.politics.pressure-1);}p.relationships[c.id]=(p.relationships[c.id]??0)+1;c.stability=clamp(c.stability+1);log(s,`${p.name} builds a relationship in ${c.name}.`);}
 else if(cmd.type==='stabilize'){requireRule(s.rulesVersion===2&&c.politics,'Stabilize requires political rules2.');const pol=c.politics;requireRule(pol.pressure>0||pol.order<6||pol.legitimacy<6||pol.exposure>0||c.stability<6,'Country is already fully stabilized.');pay(p,2);pol.pressure=track(pol.pressure-2);pol.order=track(pol.order+1);pol.legitimacy=track(pol.legitimacy+1);pol.scrutiny=track(pol.scrutiny-1);pol.exposure=track(pol.exposure-1);c.stability=track(c.stability+1);p.reputation=track(p.reputation+1);if(c.stability>=3&&pol.exposure<5)c.sanctions=false;log(s,`${p.name} stabilizes ${c.name}; public order and legitimacy recover.`,'stabilize');}
 else {pay(p,3);p.investigation=clamp(p.investigation+2);p.reputation=Math.max(0,p.reputation-1);c.stability=clamp(c.stability-2);c.demand=clamp(c.demand+1);c.sanctions=c.stability<=1;if(c.politics){const pol=c.politics;pol.pressure=track(pol.pressure+2);pol.order=track(pol.order-2);pol.legitimacy=track(pol.legitimacy-1);pol.scrutiny=track(pol.scrutiny+1);pol.exposure=track(pol.exposure+1);c.sanctions=c.sanctions||pol.exposure>=5;if(pol.crisisRound!==s.round){pol.crisisRound=s.round;s.tenders.push(politicalTender(s,c,getLeader(c)!.preferredGood,2,`crisis-r${s.round}-${c.id}`));log(s,`${c.name}: crisis tender opens to every house; no exclusive country access.`,'tender');}}log(s,`Abstract political pressure destabilizes ${c.name}. Consequences apply to all houses.`,'unrest');if(c.stability===0||c.politics?.legitimacy===0){if(s.rulesVersion===2){changeGovernment(s,c,max=>random(s,max),(text,kind)=>log(s,text,kind));}else{c.leader++;c.stability=3;c.sanctions=true;for(const q of s.players)q.relationships[c.id]=Math.max(0,(q.relationships[c.id]??0)-1);log(s,`${c.name}: leadership succession; relationships decay.`,'succession');}}}
 }else if(cmd.type==='audit'){requireRule(p.investigation>0,'No investigation to audit.');pay(p,1);p.investigation=Math.max(0,p.investigation-2);log(s,`${p.name} completes an audit.`);}
 else if(cmd.type==='network'){const field=cmd.upgrade==='contact'?'contacts':'logistics';requireRule(p[field]<3,'Capacity is capped at 3.');pay(p,2);p[field]++;log(s,`${p.name} expands ${field}.`);}
 else if(cmd.type==='refinance'){if(cmd.repay){requireRule(p.debt>=3,'Need at least 3 debt.');pay(p,3);p.debt-=3;}else{requireRule(p.debt<=6,'Debt is capped at 9.');p.debt+=3;p.cash+=3;}log(s,`${p.name} ${cmd.repay?'repays':'borrows'} 3.`);}
 else if(cmd.type==='transport'){
 const t=s.tenders.find(t=>t.id===cmd.tender);requireRule(t&&t.status==='awarded','No awarded contract.');const b=s.bids.find(b=>b.id===t.winner)!;requireRule(b.pledges.some(x=>x.player===p.id),'Only a contract participant may deliver.');const c=s.countries.find(c=>c.id===t.country)!;requireRule(!c.sanctions,'Sanctions block transport until the next unsanctioned round.');
 if(t.legal==='gray'||t.legal==='black')b.pledges.forEach(x=>{const q=s.players.find(p=>p.id===x.player)!;q.investigation=clamp(q.investigation+t.risk);});if(s.rulesVersion===2&&(t.legal==='black'||(c.politics?.order??6)<=1)){const die=random(s,6)+1;log(s,`${c.name}: disruption die${die}; contract fails on1–${Math.min(3,t.risk||1)}.`,'die');settle(s,t,die>Math.min(3,t.risk||1));}else settle(s,t,true);
 }else if(cmd.type==='pass')log(s,`${p.name} passes.`);
 if(actionTypes.includes(cmd.type)){p.actions--;if(s.players.some(p=>p.actions>0)){do{s.active=(s.active+1)%s.players.length;}while(s.players[s.active].actions===0);}}
 s.commands.push(cmd);s.ids.push(cmd.id);assertInvariants(s);return s;
}
export function assertInvariants(s:Game){
 if(s.rulesVersion===2)validatePoliticalState(s);
 requireRule(s.players.length>=2&&s.players.length<=5,'Invalid player count.');requireRule(s.round>=1&&s.round<=8&&PHASES.includes(s.phase),'Invalid phase or round.');
 for(const p of s.players){for(const n of [p.cash,p.debt,p.investigation,p.actions,p.prestige,p.contacts,p.logistics,...Object.values(p.inventory)])requireRule(Number.isSafeInteger(n)&&n>=0,'Negative or noninteger resource.');requireRule(p.debt<=9&&p.investigation<=6&&p.actions<=3,'Track exceeds cap.');for(const g of GOODS)requireRule(reserved(s,p.id,g)<=p.inventory[g],'Cargo double-spent.');requireRule(reserved(s,p.id)<=p.logistics,'Logistics double-spent.');}
 for(const g of GOODS)requireRule(s.prices[g]>=1&&s.prices[g]<=8&&s.stock[g]>=0&&s.stock[g]<=12,'Market outside bounds.');
 for(const b of s.bids)requireRule(b.pledges.reduce((n,p)=>n+p.revenue,0)===100&&b.pledges.reduce((n,p)=>n+p.liability,0)===100,'Invalid shares.');
}
export function canonical(value:unknown):string {if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value!==null&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;return JSON.stringify(value);}
export function replay(seed:number,count:number,commands:Command[],bots=true,humanFirm=0,options?:{rulesVersion:2;firmOrder?:number[]}){return commands.reduce((s,c)=>execute(s,c),createGame(seed,count,bots,humanFirm,options));}
export function importGame(raw:string):Game {
 requireRule(raw.length<5_000_000,'Save exceeds 5MB.');const parsed=JSON.parse(raw);requireRule(parsed?.version===1,'Unsupported save version; migration required.');requireRule(Array.isArray(parsed.commands)&&parsed.commands.length<=2000,'Invalid command log.');const s=replay(parsed.seed,parsed.players?.length,parsed.commands,parsed.players?.[1]?.bot??true,parsed.humanFirm??0,parsed.rulesVersion===2?{rulesVersion:2,firmOrder:parsed.initialFirmOrder}:undefined);requireRule(canonical(s)===canonical(parsed),'Save does not match deterministic replay.');return s;
}
export function viewFor(s:Game,pid:string){
 const copy:any=structuredClone(s);delete copy.rng;delete copy.seed;delete copy.commands;delete copy.ids;
 copy.players=copy.players.map((p:Player)=>p.id===pid||s.finished?p:{...p,inventory:{count:GOODS.reduce((n,g)=>n+p.inventory[g],0)},objective:undefined});
 copy.agreements=copy.agreements.filter((a:Agreement)=>a.status==='signed'||a.pledges.some(p=>p.player===pid));
 if(s.phase==='negotiation'){copy.bids=copy.bids.map((b:Bid)=>b.pledges.some(p=>p.player===pid)?b:{id:b.id,player:b.player,tender:b.tender,pledges:[],sealed:true});}
 return copy;
}
export function leaderName(c:Country){const policy=getLeader(c);if(policy)return policy.name;const base=COUNTRIES.find(x=>x[0]===c.id)!;return c.leader%2===0?base[4]:`${['Alex','Noor','Robin','Samira','Emil'][COUNTRIES.findIndex(x=>x[0]===c.id)%5]} ${['Lind','Arden','Voss'][c.leader%3]}`;}
