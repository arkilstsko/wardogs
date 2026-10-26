import {describe,it,expect} from 'vitest';
import {createGame,type Game} from '../../game-core/src';
import {botCommand,BOT_PERSONALITIES} from '../src';
import {partnerOrder} from '../src/political-policy';

function negotiation(count=5){
 const s=createGame(91,count,true,0,{rulesVersion:2});s.phase='negotiation';s.ready=[];
 for(const p of s.players){p.inventory={medical:2,communications:2,vehicles:2};p.investigation=0;p.reputation=3;p.contacts=2;p.relationships={};}
 s.tenders=[{id:'public',country:'DK',good:'medical',quantity:2,logistics:1,relationship:0,payout:12,deadline:2,legal:'legal',risk:0,penalty:3,prestige:2,status:'open'}];
 s.countries[0].sanctions=false;return s;
}
function changeHiddenState(s:Game,actor:string){
 const copy=structuredClone(s);copy.seed=4000000000;copy.rng=17;
 for(const p of copy.players.filter(p=>p.id!==actor)){p.inventory={medical:0,communications:6,vehicles:0};p.objective='diplomat';}
 copy.bids.push({id:'rival-secret',tender:'public',player:'p4',offer:1,sequence:0,pledges:[{player:'p4',quantity:1,logistics:0,revenue:100,liability:100}],escrow:1});
 return copy;
}
describe('political bots use public information and their own resources',()=>{
 for(const count of [2,3,4,5])it(`${count} seats receive equal first-invitation opportunities over a full rotation`,()=>{
  const s=negotiation(count);const invitations=Array(count).fill(0);
  for(let round=1;round<count;round++){s.round=round;for(const p of s.players){const order=partnerOrder(s,p);expect(new Set(order.map(p=>p.id)).size).toBe(count-1);expect(order).not.toContain(p);invitations[s.players.indexOf(order[0])]++;}}
  expect(invitations).toEqual(Array(count).fill(count-1));
 });
 for(const profile of BOT_PERSONALITIES)it(`${profile} cannot use rival cargo, objectives, sealed offers or secret RNG`,()=>{
  const s=negotiation();s.players[0].objective='legitimate';
  const changed=changeHiddenState(s,'p0');expect(botCommand(s,s.players[0],profile)).toEqual(botCommand(changed,changed.players[0],profile));
 });
 it('acceptance validates own cargo without probing other participants’ hands',()=>{
  const s=negotiation();s.agreements=[{id:'deal',proposer:'p1',tender:'public',offer:10,accepted:['p1'],status:'draft',pledges:[{player:'p1',quantity:1,logistics:1,revenue:50,liability:50},{player:'p0',quantity:1,logistics:0,revenue:50,liability:50}]}];
  const changed=changeHiddenState(s,'p0');
  expect(botCommand(s,s.players[0],'coalition').type).toBe('accept');
  expect(botCommand(changed,changed.players[0],'coalition')).toEqual(botCommand(s,s.players[0],'coalition'));
  changed.players[0].inventory.medical=0;expect(botCommand(changed,changed.players[0],'coalition').type).toBe('withdraw');
 });
});
