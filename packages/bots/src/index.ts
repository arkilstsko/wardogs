import {politicalDecision,BOT_PERSONALITIES,nextNegotiator,type BotPersonality} from './political-policy';
export {BOT_PERSONALITIES,nextNegotiator,type BotPersonality} from './political-policy';
import {available,execute,GOODS,reserved,type Command,type Game,type Player} from '../../game-core/src';
export function botCommand(s:Game,p:Player,personality:BotPersonality=BOT_PERSONALITIES[p.firm]):Command {
 if(s.rulesVersion===2){const political=politicalDecision(s,p,personality);if(political)return political;}
 const id=`auto-${s.commands.length}-${p.id}`;const base={id,player:p.id};
 if(s.phase==='negotiation'){
 const agreement=s.agreements.find(a=>a.status==='draft'&&a.pledges.some(x=>x.player===p.id)&&!a.accepted.includes(p.id));
 if(agreement&&s.rulesVersion!==2){const command:Command={...base,type:'accept',agreement:agreement.id};try{execute(s,command);return command;}catch{/* stale pledges: decline */}}
 if(!s.ready.includes(p.id)&&p.actions>1&&p.investigation<5&&p.cash>=1){
 const tenders=s.tenders.filter(t=>t.status==='open'&&(s.rulesVersion!==2||((p.relationships[t.country]??0)>=t.relationship&&p.reputation>=(t.minReputation??0)&&p.contacts>=(t.minContacts??0)&&!s.agreements.some(a=>a.status==='draft'&&a.proposer===p.id&&a.tender===t.id)))&&available(s,p,t.good)>=t.quantity&&p.logistics-reserved(s,p.id)>=t.logistics&&!(s.bids.some(b=>b.tender===t.id&&b.player===p.id))&&!s.countries.find(c=>c.id===t.country)!.sanctions);
 const t=tenders.sort((a,b)=>(b.payout-b.quantity*s.prices[b.good])-(a.payout-a.quantity*s.prices[a.good])||a.id.localeCompare(b.id))[0];
 if(t)return {...base,type:'bid',tender:t.id,offer:Math.max(1,t.payout-((s.rulesVersion===2?s.log.length+s.round+p.firm:(s.seed??0)+s.commands.length+p.firm)%2))};
 }
 return {...base,type:'ready'};
 }
 if(s.phase==='actions'){
 const t=s.tenders.find(t=>t.status==='awarded'&&!s.countries.find(c=>c.id===t.country)!.sanctions&&s.bids.find(b=>b.id===t.winner)?.pledges.some(x=>x.player===p.id));
 if(t)return {...base,type:'transport',tender:t.id};
 if(p.investigation>0&&p.cash>=1)return {...base,type:'audit'};
 if(p.debt>=3&&p.cash>=7)return {...base,type:'refinance',repay:true};
 const cargo=GOODS.reduce((n,g)=>n+p.inventory[g],0);
 if(s.round<8&&cargo<4){
 const goods=[...GOODS].sort((a,b)=>available(s,p,a)-available(s,p,b)||s.prices[a]-s.prices[b]);const g=goods.find(g=>s.stock[g]>0&&p.cash>=s.prices[g]+1);
 if(g)return {...base,type:'acquire',good:g};
 }
 if(s.round===8){const g=GOODS.find(g=>available(s,p,g)>0&&s.prices[g]>1);if(g)return {...base,type:'sell',good:g};}
 if(p.cash>=4){const c=s.countries[(p.firm*3+s.round)%s.countries.length];if((p.relationships[c.id]??0)<3)return {...base,type:'influence',country:c.id};}
 return {...base,type:'pass'};
 }
 return {...base,type:'advance'};
}
export function nextAutoplay(s:Game,personalities?:BotPersonality[]):Command {
 if(s.phase==='negotiation'){const order=Array.from({length:s.players.length},(_,i)=>s.players[(s.first+i)%s.players.length]);const p=s.rulesVersion===2?nextNegotiator(s):order.find(p=>!s.ready.includes(p.id));if(p)return botCommand(s,p,personalities?.[s.players.indexOf(p)]);}
 if(s.phase==='actions'&&s.players.some(p=>p.actions>0))return botCommand(s,s.players[s.active],personalities?.[s.active]);
 return {type:'advance',id:`auto-${s.commands.length}`,player:s.players[s.first].id};
}
export function runGame(initial:Game,personalities?:BotPersonality[]){let s=initial;let steps=0;while(!s.finished){if(++steps>600)throw new Error('Termination guard exceeded.');s=execute(s,nextAutoplay(s,personalities));}return s;}
