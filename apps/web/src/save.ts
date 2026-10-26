import {openDB} from 'idb';
import {importGame,type Game} from '../../../packages/game-core/src';
const db=()=>openDB('merchants-table',1,{upgrade(db){db.createObjectStore('saves');}});
export async function saveGame(s:Game){const d=await db();await d.put('saves',JSON.stringify(s),'table');}
export async function loadGame(){const d=await db();const raw=await d.get('saves','table');if(!raw)throw new Error('No saved table. Start a game or import a JSON save.');return importGame(raw);}
