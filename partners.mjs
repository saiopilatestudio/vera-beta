import {randomUUID} from "node:crypto";
import {db,rows} from "./storage.mjs";

await db.batch([
  "CREATE TABLE IF NOT EXISTS nicknames(uid TEXT PRIMARY KEY,nick TEXT UNIQUE COLLATE NOCASE)",
  "CREATE TABLE IF NOT EXISTS partner_rooms(id TEXT PRIMARY KEY,host TEXT NOT NULL,guest TEXT NOT NULL,title TEXT NOT NULL,mode TEXT NOT NULL,plan TEXT NOT NULL,target INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL,host_done INTEGER DEFAULT 0,guest_done INTEGER DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS rooms_host ON partner_rooms(host,created)",
  "CREATE INDEX IF NOT EXISTS rooms_guest ON partner_rooms(guest,created)",
  "CREATE TABLE IF NOT EXISTS partner_sets(room TEXT,uid TEXT,event TEXT,exercise INTEGER,PRIMARY KEY(room,uid,event))",
  "CREATE TABLE IF NOT EXISTS partner_checkins(room TEXT,uid TEXT,day TEXT,PRIMARY KEY(room,uid,day))",
  "CREATE TABLE IF NOT EXISTS partner_cheers(room TEXT,uid TEXT,PRIMARY KEY(room,uid))",
],"write");
function fail(status,message){throw Object.assign(new Error(message),{status});}
export const partnerPaths=new Set(["/partners/list","/partners/invite","/partners/room","/partners/respond","/partners/set","/partners/finish","/partners/checkin","/partners/cheer"]);
const DAY=86400000;
const utcDay=()=>new Date().toISOString().slice(0,10);
const weekEnd=r=>Math.floor(r.created/DAY)*DAY+7*DAY;
async function me(uid){
  await rows("INSERT OR IGNORE INTO nicknames(uid,nick) VALUES(?,?)",uid,"vera_"+uid.slice(0,19));
  return (await rows("SELECT nick FROM nicknames WHERE uid=?",uid))[0].nick;
}
const roomSql="SELECT r.*,h.nick AS host_nick,g.nick AS guest_nick FROM partner_rooms r JOIN nicknames h ON r.host=h.uid JOIN nicknames g ON r.guest=g.uid";
function view(r,uid){
  return {id:r.id,title:r.title,mode:r.mode,plan:JSON.parse(r.plan),target:r.target,state:r.state,host:r.host_nick,guest:r.guest_nick,side:r.host===uid?"host":"guest",hostDone:!!r.host_done,guestDone:!!r.guest_done,created:r.created,...(r.mode==='week'?{ends:weekEnd(r),today:utcDay()}: {})};
}
async function detail(r,uid){
  const counts=await rows(r.mode==='week'?"SELECT uid,0 AS exercise,COUNT(*) n FROM partner_checkins WHERE room=? GROUP BY uid":"SELECT uid,exercise,COUNT(*) n FROM partner_sets WHERE room=? GROUP BY uid,exercise",r.id);
  const cheers=await rows("SELECT uid FROM partner_cheers WHERE room=?",r.id);
  const days=r.mode==='week'?await rows("SELECT uid,day FROM partner_checkins WHERE room=? ORDER BY day",r.id):[];
  return {...view(r,uid),counts:counts.map(c=>({side:c.uid===r.host?'host':'guest',exercise:c.exercise,n:c.n})),cheers:cheers.map(c=>c.uid===r.host?'host':'guest'),days:days.map(c=>({side:c.uid===r.host?'host':'guest',day:c.day}))};
}
export async function partnerAction(path,uid,d){
  if(!partnerPaths.has(path))fail(404,"Acción no disponible.");
  if(typeof uid!=="string"||!uid)fail(401,"Inicia sesión.");
  if(!d||typeof d!=="object"||Array.isArray(d))fail(422,"Solicitud no válida.");
  const nick=await me(uid);
  // Seven UTC calendar days, closed on the server even if no phone is open.
  await rows("UPDATE partner_rooms SET state='finished',host_done=1,guest_done=1 WHERE mode='week' AND state='active' AND created<? AND (host=? OR guest=?)",Math.floor(Date.now()/DAY)*DAY-6*DAY,uid,uid);
  await rows("UPDATE partner_rooms SET state='expired' WHERE mode='week' AND state='pending' AND created<? AND (host=? OR guest=?)",Math.floor(Date.now()/DAY)*DAY-6*DAY,uid,uid);
  if(path==="/partners/list"){
    const list=await rows(roomSql+" WHERE host=? OR guest=? ORDER BY created DESC LIMIT 50",uid,uid);
    if(!list.length)return {nick,rooms:[]};
    const ids=list.map(r=>r.id),slots=ids.map(()=>'?').join(',');
    const [counts,cheers,days]=await Promise.all([
      rows(`SELECT room,uid,exercise,COUNT(*) n FROM partner_sets WHERE room IN (${slots}) GROUP BY room,uid,exercise UNION ALL SELECT room,uid,0 AS exercise,COUNT(*) n FROM partner_checkins WHERE room IN (${slots}) GROUP BY room,uid`,...ids,...ids),
      rows(`SELECT room,uid FROM partner_cheers WHERE room IN (${slots})`,...ids),
      rows(`SELECT room,uid,day FROM partner_checkins WHERE room IN (${slots}) ORDER BY day`,...ids),
    ]);
    return {nick,rooms:list.map(r=>({...view(r,uid),counts:counts.filter(c=>c.room===r.id).map(c=>({side:c.uid===r.host?'host':'guest',exercise:c.exercise,n:c.n})),cheers:cheers.filter(c=>c.room===r.id).map(c=>c.uid===r.host?'host':'guest'),days:days.filter(c=>c.room===r.id).map(c=>({side:c.uid===r.host?'host':'guest',day:c.day}))}))};
  }
  if(path==="/partners/invite"){
    const [guest]=await rows("SELECT uid FROM nicknames WHERE nick=? COLLATE NOCASE",String(d.nick||"").trim().replace(/^@/,""));
    if(!guest||guest.uid===uid)fail(422,"Introduce el nick de otra persona registrada.");
    const title=String(d.title||"").trim(), plan=d.plan,target=d.target;
    if(!title||title.length>80||!Array.isArray(plan)||!plan.length||plan.length>10||plan.some(x=>typeof x!=="string"||!x.trim()||x.length>80)||!Number.isInteger(target)||target<1||target>8||!["challenge","together","week"].includes(d.mode))fail(422,"Revisa el nombre, los ejercicios y el objetivo de series.");
    if(d.mode==='week'&&(target>7||plan.length!==1))fail(422,"El reto semanal admite de 1 a 7 días y una sesión por día.");
    const id=randomUUID();
    const added=await rows("INSERT INTO partner_rooms(id,host,guest,title,mode,plan,target,created) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM partner_rooms WHERE host=? AND state='pending' AND created>?)<15 RETURNING id",id,uid,guest.uid,title,d.mode,JSON.stringify(plan.map(x=>x.trim())),target,Date.now(),uid,Date.now()-86400000);
    if(!added.length)fail(429,"Ya has enviado 15 invitaciones pendientes en las últimas 24 horas.");
    d={id};
  }
  const [r]=await rows(roomSql+" WHERE r.id=? AND (r.host=? OR r.guest=?)",String(d.id||""),uid,uid);
  if(!r)fail(404,"Sala no disponible.");
  if(path==="/partners/respond"){
    if(uid!==r.guest||typeof d.accept!=="boolean")fail(403,"Solo la persona invitada puede responder.");
    if(r.mode==='week'&&Date.now()>=weekEnd(r))fail(409,"Esta invitación semanal ha caducado. Cread un nuevo reto.");
    await rows("UPDATE partner_rooms SET state=? WHERE id=? AND state='pending'",d.accept?"active":"declined",r.id);
  }
  if(path==="/partners/set"){
    if(r.mode==='week')fail(422,"Este reto registra días de actividad, no series.");
    if(!Number.isInteger(d.exercise)||d.exercise<0||d.exercise>=JSON.parse(r.plan).length||!/^[a-zA-Z0-9_-]{8,80}$/.test(d.event||""))fail(422,"Serie no válida.");
    const ownDone=uid===r.host?"host_done":"guest_done";
    const inserted=await rows("INSERT OR IGNORE INTO partner_sets(room,uid,event,exercise) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM partner_rooms WHERE id=? AND state='active' AND "+ownDone+"=0) AND (SELECT COUNT(*) FROM partner_sets WHERE room=? AND uid=? AND exercise=?)<? RETURNING event",r.id,uid,d.event,d.exercise,r.id,r.id,uid,d.exercise,r.target);
    if(!inserted.length&&!(await rows("SELECT event FROM partner_sets WHERE room=? AND uid=? AND event=? AND exercise=?",r.id,uid,d.event,d.exercise)).length)fail(409,"La sesión ha terminado o ya alcanzaste el objetivo de este ejercicio.");
  }
  if(path==="/partners/checkin"){
    if(r.mode!=='week'||r.state!=='active'||Date.now()>=weekEnd(r))fail(409,"El reto semanal no está activo.");
    if(d.completed!==true)fail(422,"Confirma que has completado tu sesión de hoy.");
    await rows("INSERT OR IGNORE INTO partner_checkins(room,uid,day) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM partner_rooms WHERE id=? AND state='active')",r.id,uid,utcDay(),r.id);
  }
  if(path==="/partners/cheer"){
    if(!['active','finished'].includes(r.state))fail(409,"Acepta primero la invitación.");
    await rows("INSERT OR IGNORE INTO partner_cheers(room,uid) VALUES(?,?)",r.id,uid);
  }
  if(path==="/partners/finish"){
    if(r.mode==='week')fail(409,"El reto semanal se cierra automáticamente al terminar los siete días.");
    const mine=uid===r.host?"host_done":"guest_done",other=uid===r.host?"guest_done":"host_done";
    await rows("UPDATE partner_rooms SET "+mine+"=1,state=CASE WHEN "+other+"=1 THEN 'finished' ELSE state END WHERE id=? AND state='active'",r.id);
  }
  const [now]=await rows(roomSql+" WHERE r.id=?",r.id);
  return {nick,room:await detail(now,uid)};
}
