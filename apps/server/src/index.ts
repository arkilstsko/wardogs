import {createServer} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {Pool} from 'pg';
import {z} from 'zod';
import {importGame} from '../../../packages/game-core/src';
import {applyRoomCommand,joinRoom,newRoom,roomView,type Room} from './rooms';
const port=Number(process.env.PORT??8787);const origins=(process.env.ALLOWED_ORIGINS??'http://localhost:5173,http://127.0.0.1:5173').split(',');
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,max:5}):null;
if(pool)await pool.query('CREATE TABLE IF NOT EXISTS game_rooms (id TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
const rooms=new Map<string,Room>();const sockets=new Map<WebSocket,{room:string;player:string}>();
async function persist(room:Room){if(pool)await pool.query('INSERT INTO game_rooms(id,payload) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET payload=$2,updated_at=NOW()',[room.id,JSON.stringify(room)]);}
async function getRoom(id:string){if(rooms.has(id))return rooms.get(id)!;if(rooms.size>=100)throw new Error('Room capacity reached.');let room:Room|undefined;if(pool){const r=await pool.query('SELECT payload FROM game_rooms WHERE id=$1',[id]);if(r.rows.length){room=r.rows[0].payload;room!.state=importGame(JSON.stringify(room!.state));}}room??=newRoom(id);rooms.set(id,room);return room;}
const http=createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,persistence:pool?'postgres':'memory',version:'0.1.0'}));}else{res.writeHead(404);res.end();}});
const wss=new WebSocketServer({server:http,maxPayload:16384,verifyClient:(info:{origin:string})=>origins.includes(info.origin)});
const messageSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('join'),room:z.string().regex(/^[a-zA-Z0-9-]{3,32}$/),token:z.string().max(100).optional(),name:z.string().max(60).optional()}).strict(),
 z.object({type:z.literal('command'),revision:z.number().int().min(0),command:z.unknown()}).strict(),z.object({type:z.literal('refresh')}).strict()
]);
function broadcast(room:Room){for(const [socket,identity] of sockets)if(identity.room===room.id&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(roomView(room,identity.player)));}
// One serial queue per process prevents lost updates across asynchronous DB writes.
let queue=Promise.resolve();
wss.on('connection',socket=>{
 let allowance=30;let last=Date.now();let alive=true;
 socket.on('pong',()=>alive=true);
 socket.on('message',data=>{const now=Date.now();allowance=Math.min(30,allowance+(now-last)/1000*5);last=now;if(allowance<1){socket.close(1008,'Rate limit');return;}allowance--;
 queue=queue.then(async()=>{try{const msg=messageSchema.parse(JSON.parse(data.toString()));if(msg.type==='join'){
 if(sockets.has(socket))throw new Error('Already joined.');const room=await getRoom(msg.room);const identity=joinRoom(room,msg.token);await persist(room);sockets.set(socket,{room:room.id,player:identity.player});socket.send(JSON.stringify({...roomView(room,identity.player),token:identity.token}));
 }else{const identity=sockets.get(socket);if(!identity)throw new Error('Join a room first.');const room=await getRoom(identity.room);if(msg.type==='command'){
 const previous=structuredClone(room);try{applyRoomCommand(room,identity.player,msg.revision,msg.command);await persist(room);}catch(e){rooms.set(room.id,previous);throw e;}broadcast(room);
 }else socket.send(JSON.stringify(roomView(room,identity.player)));}
 }catch(e){socket.send(JSON.stringify({type:'error',error:e instanceof Error?e.message:'Request rejected'}));}}).catch(()=>socket.close(1011,'Server error'));
 });
 const heartbeat=setInterval(()=>{if(!alive){socket.terminate();return;}alive=false;socket.ping();},30000);
 socket.on('close',()=>{clearInterval(heartbeat);sockets.delete(socket);});
});
http.listen(port,'0.0.0.0',()=>console.log(JSON.stringify({level:'info',event:'listening',port,persistence:pool?'postgres':'memory'})));
process.on('SIGTERM',()=>{wss.close();http.close();void pool?.end();});
