import {createHash} from 'node:crypto';import {writeFileSync} from 'node:fs';
import {createGame,canonical} from '../packages/game-core/src';import {runGame} from '../packages/bots/src';
const baselineRoot='/tmp/wardogs-v1';const oldCore=await import(baselineRoot+'/packages/game-core/src/index.ts');const oldBots=await import(baselineRoot+'/packages/bots/src/index.ts');
const fixtures=[];for(const count of [2,3,4,5]){const seed=700+count;const old=oldBots.runGame(oldCore.createGame(seed,count));const current=runGame(createGame(seed,count));const before=canonical(old),after=canonical(current);if(before!==after)throw new Error(`Legacy rules changed for${count} players`);fixtures.push({seed,count,sha256:createHash('sha256').update(before).digest('hex'),commands:old.commands.length});}
writeFileSync('packages/game-core/tests/legacy-golden.json',JSON.stringify({baseline:'520a03ada667e93d9ead585e719a001f48a99449',fixtures},null,2));console.log({legacyByteIdentical:true,fixtures});
