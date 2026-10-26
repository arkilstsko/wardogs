import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createGame,execute,viewFor,type Game} from '../../../packages/game-core/src';
export interface Room {id:string;state:Game;revision:number;seats:Record<string,string>;updatedAt:number}
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export function newRoom(id:string):Room {return {id,state:createGame(randomBytes(4).readUInt32BE(),3,false),revision:0,seats:{},updatedAt:Date.now()};}
export function joinRoom(room:Room,token?:string){
 if(token){const hash=tokenHash(token);const seat=Object.entries(room.seats).find(([_p,h])=>timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(hash,'hex')))?.[0];if(!seat)throw new Error('Reconnect credential is invalid.');return {player:seat,token};}
 const seat=room.state.players.find(p=>!room.seats[p.id]);if(!seat)throw new Error('Room is full. Reconnect with your existing credential.');
 const nextToken=randomBytes(32).toString('base64url');room.seats[seat.id]=tokenHash(nextToken);return {player:seat.id,token:nextToken};
}
export function applyRoomCommand(room:Room,player:string,revision:number,raw:unknown){
 if(!raw||typeof raw!=='object')throw new Error('Invalid command.');const command=raw as Record<string,unknown>;
 if(command.player!==player)throw new Error('Cannot command another seat.');
 if(command.type==='advance'&&player!=='p0')throw new Error('Only the host advances shared phases.');
 if(typeof command.id==='string'&&room.state.ids.includes(command.id))return;
 if(revision!==room.revision)throw new Error('Stale revision. Refresh your view before retrying.');
 room.state=execute(room.state,raw);room.revision++;room.updatedAt=Date.now();
}
export function roomView(room:Room,player:string){return {type:'state',view:viewFor(room.state,player),player,revision:room.revision};}
