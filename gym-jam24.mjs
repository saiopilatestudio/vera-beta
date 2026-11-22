import {randomBytes} from 'node:crypto';
import {db,rows} from './storage.mjs';
import './journal.mjs';
const fail=(message,status=422)=>Object.assign(Error(message),{status,code:'GYM_JAM'});
const normal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const roomId=value=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);
const epoch="CAST(ROUND((julianday('now')-2440587.5)*86400000) AS INTEGER)";
await db.batch([
 'CREATE TABLE IF NOT EXISTS gym_jam24(id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,host TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,started_at INTEGER,ended_at INTEGER,timezone TEXT NOT NULL,proposal TEXT NOT NULL,music_url TEXT NOT NULL,ranking TEXT,updated_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS gym_jam_members24(room TEXT NOT NULL,uid TEXT NOT NULL,nick TEXT NOT NULL,joined_at INTEGER NOT NULL,active INTEGER NOT NULL,PRIMARY KEY(room,uid))',
 'CREATE INDEX IF NOT EXISTS gym_jam_members24_uid ON gym_jam_members24(uid,active)',
 'CREATE TABLE IF NOT EXISTS gym_jam_active24(uid TEXT PRIMARY KEY,room TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS gym_jam_record_clock24(uid TEXT NOT NULL,id TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(uid,id))',
 `CREATE TRIGGER IF NOT EXISTS gym_jam_diary_insert24 AFTER INSERT ON diary_sync BEGIN INSERT INTO gym_jam_record_clock24(uid,id,created_at,updated_at) VALUES(NEW.uid,NEW.id,${epoch},${epoch}) ON CONFLICT(uid,id) DO UPDATE SET updated_at=excluded.updated_at; END`,
 // Historical records first edited after installation are not new workout sets.
 `CREATE TRIGGER IF NOT EXISTS gym_jam_diary_update24 AFTER UPDATE ON diary_sync BEGIN INSERT INTO gym_jam_record_clock24(uid,id,created_at,updated_at) VALUES(NEW.uid,NEW.id,0,${epoch}) ON CONFLICT(uid,id) DO UPDATE SET updated_at=excluded.updated_at; END`
],'write');
export function validateGymProposal24(value){
 if(!Array.isArray(value)||value.length>12)throw fail('Añade como máximo 12 ejercicios.');const seen=new Set();let total=0;
 const proposal=value.map(item=>{if(!item||typeof item.exercise!=='string'||item.exercise.trim().length<2||item.exercise.length>120||!Number.isInteger(item.targetSets)||item.targetSets<1||item.targetSets>6)throw fail('Cada ejercicio necesita un nombre y de 1 a 6 series.');const key=normal(item.exercise);if(seen.has(key))throw fail('No repitas el mismo ejercicio en la propuesta.');seen.add(key);total+=item.targetSets;return {exercise:item.exercise.trim(),targetSets:item.targetSets};});
 if(total>40)throw fail('La sesión admite hasta 40 series objetivo.');return proposal;
}
export function validateSpotifyJamUrl24(value){
 if(value==='')return '';if(typeof value!=='string'||value.length>1500)throw fail('Pega un enlace de Spotify válido.');let url;try{url=new URL(value);}catch{throw fail('Pega un enlace de Spotify válido.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['open.spotify.com','spotify.link','spotify.app.link'].includes(url.hostname))throw fail('El enlace debe ser HTTPS de Spotify.');return url.href;
}
function timezone24(value){const zone=value===undefined?'UTC':value;if(typeof zone!=='string'||zone.length>100)throw fail('Zona horaria no válida.');try{new Intl.DateTimeFormat('es',{timeZone:zone}).format(new Date());}catch{throw fail('Zona horaria no válida.');}return zone;}
function dateAt24(at,zone){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
async function nick24(uid){return (await rows('SELECT nick FROM nicknames WHERE uid=?',uid))[0]?.nick||'Participante';}
async function member24(room,uid){return (await rows('SELECT * FROM gym_jam_members24 WHERE room=? AND uid=? AND active=1',room,uid))[0];}
async function current24(uid){await rows("DELETE FROM gym_jam_active24 WHERE uid=? AND NOT EXISTS(SELECT 1 FROM gym_jam24 r JOIN gym_jam_members24 m ON m.room=r.id WHERE r.id=gym_jam_active24.room AND m.uid=? AND m.active=1 AND r.status IN ('lobby','active') AND r.expires_at>?)",uid,uid,Date.now());return (await rows("SELECT r.* FROM gym_jam24 r JOIN gym_jam_members24 m ON m.room=r.id WHERE m.uid=? AND m.active=1 AND r.status IN ('lobby','active') AND r.expires_at>? ORDER BY r.created_at DESC LIMIT 1",uid,Date.now()))[0];}
async function ranking24(room,end=Date.now()){
 const members=await rows('SELECT * FROM gym_jam_members24 WHERE room=? AND active=1 ORDER BY joined_at,uid',room.id),proposal=JSON.parse(room.proposal),total=proposal.reduce((n,p)=>n+p.targetSets,0),stop=Math.min(end,room.expires_at);
 const output=[];for(const member of members){const counts=new Map(proposal.map(p=>[normal(p.exercise),0]));
  if(room.started_at){const start=Math.max(room.started_at,member.joined_at),fromDate=dateAt24(start,room.timezone),toDate=dateAt24(stop,room.timezone);
   const logs=await rows('SELECT d.data FROM diary_sync d JOIN gym_jam_record_clock24 c ON c.uid=d.uid AND c.id=d.id WHERE d.uid=? AND d.data IS NOT NULL AND c.created_at>=? AND c.created_at<=? AND c.updated_at<=?',member.uid,start,stop,stop);
   for(const saved of logs){let row;try{row=JSON.parse(saved.data);}catch{continue;}if(row?.kind!=='Entrenamiento'||['health','Health Connect'].includes(row.source)||typeof row.exercise!=='string'||typeof row.date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(row.date)||!Number.isFinite(Date.parse(row.date+'T00:00:00Z'))||new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)!==row.date||row.date<fromDate||row.date>toDate||!Array.isArray(row.reps)||!row.reps.length||row.reps.some(n=>!Number.isInteger(n)||n<1||n>300))continue;
    const key=normal(row.exercise);if(counts.has(key))counts.set(key,counts.get(key)+row.reps.length);
   }
  }
  const completed=proposal.reduce((n,p)=>n+Math.min(p.targetSets,counts.get(normal(p.exercise))||0),0);
  output.push({uid:member.uid,nick:member.nick,isHost:member.uid===room.host,points:total?Math.round(100*completed/total):0,completedSets:completed,totalTargetSets:total});
 }return output.sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick));
}
async function finish24(room,at){const ranking=await ranking24(room,at);await rows("UPDATE gym_jam24 SET status='ended',ended_at=?,ranking=?,updated_at=? WHERE id=? AND status<>'ended'",at,JSON.stringify(ranking),at,room.id);await rows('DELETE FROM gym_jam_active24 WHERE room=?',room.id);return (await rows('SELECT * FROM gym_jam24 WHERE id=?',room.id))[0];}
async function fresh24(room){if(room.status!=='ended'&&room.expires_at<=Date.now())return finish24(room,room.expires_at);return room;}
async function view24(room,uid){room=await fresh24(room);const internal=room.status==='ended'&&room.ranking?JSON.parse(room.ranking):await ranking24(room);const members=internal.map(({uid:privateId,...publicFields})=>publicFields);const own=internal.find(m=>m.uid===uid);return {id:room.id,code:room.code,qrValue:room.code,title:room.title,status:room.status,host:room.host===uid,expiresAt:new Date(room.expires_at).toISOString(),startedAt:room.started_at?new Date(room.started_at).toISOString():null,endedAt:room.ended_at?new Date(room.ended_at).toISOString():null,timeZone:room.timezone,sessionDate:room.started_at?dateAt24(room.started_at,room.timezone):null,proposal:JSON.parse(room.proposal),musicUrl:room.music_url,members,self:own?{nick:own.nick,points:own.points,completedSets:own.completedSets,totalTargetSets:own.totalTargetSets}:null,updatedAt:new Date(room.updated_at).toISOString()};}
const allowed={create:['title','proposal','timeZone','acceptSharing'],join:['code','acceptSharing'],state:['roomId','code'],leave:['roomId'],propose:['roomId','proposal'],start:['roomId'],end:['roomId'],music:['roomId','url']};
export async function gymJamAction24(path,uid,input={}){
 if(typeof uid!=='string'||!uid)throw fail('Inicia sesión.',401);const action=path.replace(/^\/gym-jam\//,'');if(!allowed[action])throw fail('Acción no disponible.',404);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!allowed[action].includes(key)))throw fail('Datos de sala no admitidos.');const now=Date.now();
 if(action==='create'){
  if(input.acceptSharing!==true)throw fail('Acepta compartir únicamente tu nick y puntos con la sala.');if(await current24(uid))throw fail('Ya participas en una sala abierta.',409);
  const title=input.title===undefined?'Entrenamos juntos':input.title;if(typeof title!=='string'||!title.trim()||title.length>80)throw fail('El título debe tener entre 1 y 80 caracteres.');const proposal=validateGymProposal24(input.proposal||[]),zone=timezone24(input.timeZone),id=randomBytes(16).toString('hex'),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=[...randomBytes(8)].map(n=>alphabet[n%32]).join('');
  try{await db.batch([{sql:'INSERT INTO gym_jam_active24 VALUES(?,?)',args:[uid,id]},{sql:'INSERT INTO gym_jam24 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',args:[id,code,uid,title.trim(),'lobby',now,now+6*3600000,null,null,zone,JSON.stringify(proposal),'',null,now]},{sql:'INSERT INTO gym_jam_members24 VALUES(?,?,?,?,1)',args:[id,uid,await nick24(uid),now]}],'write');}catch(error){if(/UNIQUE|CONSTRAINT/i.test(String(error.code||error)))throw fail('Ya participas en una sala abierta. Actualiza para recuperarla.',409);throw error;}return {room:await view24((await rows('SELECT * FROM gym_jam24 WHERE id=?',id))[0],uid)};
 }
 if(action==='join'){
  if(input.acceptSharing!==true)throw fail('Acepta compartir únicamente tu nick y puntos con la sala.');const code=String(input.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{8}$/.test(code))throw fail('Revisa el código de ocho caracteres.');let room=(await rows('SELECT * FROM gym_jam24 WHERE code=?',code))[0];if(!room)throw fail('Sala no disponible.',404);room=await fresh24(room);if(room.status==='ended')throw fail('La sala ha finalizado.',410);
  const own=await current24(uid);if(own&&own.id!==room.id)throw fail('Sal de tu sala actual antes de unirte a otra.',409);if(await member24(room.id,uid))return {room:await view24(room,uid)};
  const result=await db.batch([
   {sql:"INSERT INTO gym_jam_active24(uid,room) SELECT ?,? WHERE EXISTS(SELECT 1 FROM gym_jam24 WHERE id=? AND status IN ('lobby','active') AND expires_at>?) ON CONFLICT(uid) DO NOTHING",args:[uid,room.id,room.id,now]},
   {sql:"INSERT INTO gym_jam_members24(room,uid,nick,joined_at,active) SELECT ?,?,?,?,1 WHERE EXISTS(SELECT 1 FROM gym_jam_active24 WHERE uid=? AND room=?) AND (SELECT count(*) FROM gym_jam_members24 WHERE room=? AND active=1)<20 AND EXISTS(SELECT 1 FROM gym_jam24 WHERE id=? AND status IN ('lobby','active') AND expires_at>?) ON CONFLICT(room,uid) DO UPDATE SET active=1,joined_at=excluded.joined_at,nick=excluded.nick RETURNING uid",args:[room.id,uid,await nick24(uid),now,uid,room.id,room.id,room.id,now]},
   {sql:'DELETE FROM gym_jam_active24 WHERE uid=? AND room=? AND NOT EXISTS(SELECT 1 FROM gym_jam_members24 WHERE uid=? AND room=? AND active=1)',args:[uid,room.id,uid,room.id]}
  ],'write');const inserted=result[1].rows;
  if(!inserted.length)throw fail('La sala está llena o ha finalizado.',409);await rows('UPDATE gym_jam24 SET updated_at=? WHERE id=?',now,room.id);return {room:await view24(room,uid)};
 }
 let room;
 if(input.roomId!==undefined){if(!roomId(input.roomId))throw fail('Sala no válida.');room=(await rows('SELECT * FROM gym_jam24 WHERE id=?',input.roomId))[0];}
 else if(action==='state'&&input.code){room=(await rows('SELECT * FROM gym_jam24 WHERE code=?',String(input.code).trim().toUpperCase()))[0];}
 else if(action==='state'){room=await current24(uid);if(!room)return {room:null};}
 if(!room||!await member24(room.id,uid))throw fail('Sala no disponible para tu cuenta.',404);room=await fresh24(room);
 if(action==='state')return {room:await view24(room,uid)};
 if(room.status==='ended'&&action==='leave'){await db.batch([{sql:'UPDATE gym_jam_members24 SET active=0 WHERE room=? AND uid=?',args:[room.id,uid]},{sql:'DELETE FROM gym_jam_active24 WHERE uid=? AND room=?',args:[uid,room.id]}],'write');return {room:null};}
 if(room.status==='ended'){if(action==='end'&&room.host===uid)return {room:await view24(room,uid)};throw fail('La sala ha finalizado.',410);}
 if(action==='leave'){if(room.host===uid)throw fail('Como anfitrión, finaliza la sala antes de salir.',409);await db.batch([{sql:'UPDATE gym_jam_members24 SET active=0 WHERE room=? AND uid=?',args:[room.id,uid]},{sql:'DELETE FROM gym_jam_active24 WHERE uid=? AND room=?',args:[uid,room.id]}],'write');return {room:null};}
 if(room.host!==uid)throw fail('Sólo el anfitrión puede modificar la sala.',403);
 if(action==='propose'){if(room.status!=='lobby')throw fail('La propuesta queda fijada al iniciar.',409);const proposal=validateGymProposal24(input.proposal);await rows("UPDATE gym_jam24 SET proposal=?,updated_at=? WHERE id=? AND status='lobby'",JSON.stringify(proposal),now,room.id);}
 if(action==='start'){if(room.status==='active')return {room:await view24(room,uid)};if(room.status!=='lobby'||!JSON.parse(room.proposal).length)throw fail('Añade una propuesta antes de iniciar.',409);await rows("UPDATE gym_jam24 SET status='active',started_at=?,updated_at=? WHERE id=? AND status='lobby'",now,now,room.id);}
 if(action==='end')room=await finish24(room,now);
 if(action==='music'){const url=validateSpotifyJamUrl24(input.url);await rows('UPDATE gym_jam24 SET music_url=?,updated_at=? WHERE id=?',url,now,room.id);}
 room=(await rows('SELECT * FROM gym_jam24 WHERE id=?',room.id))[0];return {room:await view24(room,uid)};
}
