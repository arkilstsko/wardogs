import {available,reserved,type Command,type Game,type Player} from '../../game-core/src';
export const BOT_PERSONALITIES=['legitimate','diplomat','opportunist','coalition','financier'] as const;
export type BotPersonality=typeof BOT_PERSONALITIES[number];
/** Public clockwise house tokens; rotate the first invitation each round. Never inspect rival cargo. */
export function partnerOrder(s:Game,p:Player):Player[]{
 const ownSeat=s.players.findIndex(q=>q.id===p.id);
 if(ownSeat<0)throw new Error('Bot actor is not seated at this table.');
 const others=Array.from({length:s.players.length-1},(_,i)=>s.players[(ownSeat+1+i)%s.players.length]);
 const offset=(s.round-1)%others.length;
 return [...others.slice(offset),...others.slice(0,offset)];
}
export function politicalDecision(s:Game,p:Player,profile:BotPersonality):Command|undefined {const base={id:`auto-${s.commands.length}-${p.id}`,player:p.id};
 if(s.phase==='negotiation'){
 const pending=s.agreements.find(a=>a.status==='draft'&&a.pledges.some(x=>x.player===p.id)&&!a.accepted.includes(p.id));if(pending){const t=s.tenders.find(t=>t.id===pending.tender)!;const pledge=pending.pledges.find(x=>x.player===p.id)!;const canSign=pending.pledges.every(z=>{const q=s.players.find(q=>q.id===z.player)!;return (q.investigation<5||t.legal==='black')&&q.contacts>=(t.minContacts??0)&&q.reputation>=(t.minReputation??0)&&(q.relationships[t.country]??0)>=t.relationship;})&&!s.ready.includes(pending.proposer)&&available(s,p,t.good)>=pledge.quantity&&p.logistics-reserved(s,p.id)>=pledge.logistics&&p.contacts>=(t.minContacts??0)&&p.reputation>=(t.minReputation??0);return {...base,type:canSign?'accept':'withdraw',agreement:pending.id};}
 if((profile==='coalition'||p.objective==='consortium')&&p.actions>=2&&p.cash>=1&&!s.ready.includes(p.id)){
 const t=s.tenders.find(t=>t.status==='open'&&t.quantity===2&&(p.investigation<5||t.legal==='black')&&(p.relationships[t.country]??0)>=t.relationship&&!s.countries.find(c=>c.id===t.country)!.sanctions&&available(s,p,t.good)>=1&&p.logistics-reserved(s,p.id)>=1&&p.reputation>=(t.minReputation??0)&&p.contacts>=(t.minContacts??0)&&!s.agreements.some(a=>a.proposer===p.id&&a.tender===t.id));
 const partner=t?partnerOrder(s,p).find(q=>!s.ready.includes(q.id)&&(q.investigation<5||t.legal==='black')&&q.reputation>=(t.minReputation??0)&&q.contacts>=(t.minContacts??0)&&(q.relationships[t.country]??0)>=t.relationship):undefined;
 if(t&&partner)return {...base,type:'propose',tender:t.id,offer:t.payout,pledges:[{player:p.id,quantity:1,logistics:1,revenue:50,liability:50},{player:partner.id,quantity:1,logistics:Math.max(0,t.logistics-1),revenue:50,liability:50}]};}
 }
 if(s.phase==='actions'){
 const awarded=s.tenders.some(t=>t.status==='awarded'&&!s.countries.find(c=>c.id===t.country)!.sanctions&&s.bids.find(b=>b.id===t.winner)?.pledges.some(x=>x.player===p.id));if(awarded)return;
 if(p.investigation>0&&p.cash>=1)return {...base,type:'audit'};
 if(profile==='legitimate'&&p.reputation<2&&p.cash>=2){const c=s.countries.find(c=>c.politics&&(c.politics.pressure>0||c.politics.order<6));if(c)return {...base,type:'stabilize',country:c.id};}
 if(profile==='diplomat'&&p.cash>=2){const c=[...s.countries].filter(c=>(p.relationships[c.id]??0)<2).sort((a,b)=>(p.relationships[b.id]??0)-(p.relationships[a.id]??0)||(a.politics?.legitimacy??6)-(b.politics?.legitimacy??6))[0];if(c&&Object.values(p.relationships).filter(n=>n>=2).length<3)return {...base,type:'influence',country:c.id};}
 if(profile==='opportunist'&&s.round<7&&p.cash>=4&&p.investigation<=2){if(p.contacts<2)return {...base,type:'network',upgrade:'contact'};const c=s.countries.find(c=>c.politics&&c.politics.crisisRound!==s.round&&!c.sanctions&&c.politics.pressure>=1&&c.politics.order>=3);if(c)return {...base,type:'unrest',country:c.id};}
 if(profile==='financier'&&s.round<6){if(p.cash<=3&&p.debt<=3)return {...base,type:'refinance',repay:false};if(p.logistics<2&&p.cash>=7)return {...base,type:'network',upgrade:'logistics'};}
 if(profile==='coalition'&&p.logistics<2&&p.cash>=6&&s.round<6)return {...base,type:'network',upgrade:'logistics'};
 }
}
export function nextNegotiator(s:Game,botOnly=false){const order=Array.from({length:s.players.length},(_,i)=>s.players[(s.first+i)%s.players.length]).filter(p=>(!botOnly||p.bot)&&!s.ready.includes(p.id));return order.find(p=>s.agreements.some(a=>a.status==='draft'&&!s.ready.includes(a.proposer)&&a.pledges.some(x=>x.player===p.id)&&!a.accepted.includes(p.id)))??order[0];}
