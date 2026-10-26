import {describe,it,expect} from 'vitest';
import {applyRoomCommand,joinRoom,newRoom,roomView,tokenHash} from '../src/rooms';
describe('authoritative room authorization',()=>{
 it('assigns each seat once and rejects a full room',()=>{const r=newRoom('test');expect(joinRoom(r).player).toBe('p0');expect(joinRoom(r).player).toBe('p1');expect(joinRoom(r).player).toBe('p2');expect(()=>joinRoom(r)).toThrow('full');});
 it('reconnect authenticates an opaque token without storing plaintext',()=>{const r=newRoom('test');const a=joinRoom(r);expect(r.seats.p0).toBe(tokenHash(a.token));expect(r.seats.p0).not.toBe(a.token);expect(joinRoom(r,a.token).player).toBe('p0');expect(()=>joinRoom(r,'invalid')).toThrow('invalid');});
 it('rejects forged seat commands',()=>{const r=newRoom('test');expect(()=>applyRoomCommand(r,'p0',0,{id:'x',type:'advance',player:'p1'})).toThrow('another seat');expect(r.revision).toBe(0);});
 it('host-only phase advancement',()=>{const r=newRoom('test');expect(()=>applyRoomCommand(r,'p1',0,{id:'x',type:'advance',player:'p1'})).toThrow('host');});
 it('rejects stale revision and preserves authoritative state',()=>{const r=newRoom('test');expect(()=>applyRoomCommand(r,'p0',10,{id:'x',type:'advance',player:'p0'})).toThrow('Stale');expect(r.state.phase).toBe('world');});
 it('idempotent retry does not repeat an event',()=>{const r=newRoom('test');const c={id:'x',type:'advance',player:'p0'};applyRoomCommand(r,'p0',0,c);applyRoomCommand(r,'p0',0,c);expect(r.revision).toBe(1);expect(r.state.phase).toBe('income');});
 it('never sends server RNG, command history, reconnect hashes, or rival objectives',()=>{const r=newRoom('test');joinRoom(r);const v=roomView(r,'p0');expect(v.view.rng).toBeUndefined();expect(v.view.seed).toBeUndefined();expect(v.view.commands).toBeUndefined();expect(v.view.players[1].objective).toBeUndefined();expect(JSON.stringify(v)).not.toContain(r.seats.p0);});
});
