import {z} from 'zod';
import {writeFileSync} from 'node:fs';
import {CommandSchema,ACTION_RULES,CARD_CATALOG,PHASES} from '../packages/game-core/src';
writeFileSync('docs/game-design/command.schema.json',JSON.stringify(z.toJSONSchema(CommandSchema),null,2));
writeFileSync('docs/game-design/action-economy.json',JSON.stringify({version:1,rounds:8,actionsPerRound:3,phases:PHASES,rules:ACTION_RULES,interrupts:'No interrupt cards currently implemented; commands atomic.',catalogStatus:'Proposed metadata; not all proposed cards authored as executable effects.'},null,2));
writeFileSync('docs/game-design/proposed-card-metadata.json',JSON.stringify(CARD_CATALOG,null,2));
