import {randomUUID} from "node:crypto";
import {db,rows} from "./storage.mjs";

await db.batch([
  "CREATE TABLE IF NOT EXISTS nicknames(uid TEXT PRIMARY KEY,nick TEXT UNIQUE COLLATE NOCASE)",
  "CREATE TABLE IF NOT EXISTS partner_rooms(id TEXT PRIMARY KEY,host TEXT NOT NULL,guest TEXT NOT NULL,title TEXT NOT NULL,mode TEXT NOT NULL,plan TEXT NOT NULL,target INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL,host_done INTEGER DEFAULT 0,guest_done INTEGER DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS rooms_host ON partner_rooms(host,created)",
  "CREATE INDEX IF NOT EXISTS rooms_guest ON partner_rooms(guest,created)",
  "CREATE TABLE IF NOT EXISTS partner_sets(room TEXT,uid TEXT,event TEXT,exercise INTEGER,PRIMARY KEY(room,uid,event))",
],"write");
function fail(status,message){throw Object.assign(new Error(message),{status});}
export const partnerPaths=new Set(["/partners/list","/partners/invite","/partners/room","/partners/respond","/partners/set","/partners/finish"]);
async function me(uid){
  await rows("INSERT OR IGNORE INTO nicknames(uid,nick) VALUES(?,?)",uid,"vera_"+uid);
  return (await rows("SELECT nick FROM nicknames WHERE uid=?",uid))[0].nick;
}
const roomSql="SELECT r.*,h.nick AS host_nick,g.nick AS guest_nick FROM partner_rooms r JOIN nicknames h ON r.host=h.uid JOIN nicknames g ON r.guest=g.uid";
function view(r,uid){
  return {id:r.id,title:r.title,mode:r.mode,plan:JSON.parse(r.plan),target:r.target,state:r.state,host:r.host_nick,guest:r.guest_nick,side:r.host===uid?"host":"guest",hostDone:!!r.host_done,guestDone:!!r.guest_done,created:r.created};
}
export async function partnerAction(path,uid,d){
  const nick=await me(uid);
  if(path==="/partners/list"){
    const list=await rows(roomSql+" WHERE host=? OR guest=? ORDER BY created DESC LIMIT 50",uid,uid);
    return {nick,rooms:list.map(r=>view(r,uid))};
  }
  if(path==="/partners/invite"){
    const [guest]=await rows("SELECT uid FROM nicknames WHERE nick=? COLLATE NOCASE",String(d.nick||"").trim().replace(/^@/,""));
    if(!guest||guest.uid===uid)fail(422,"Introduce el nick de otra persona registrada.");
    const title=String(d.title||"").trim(), plan=d.plan,target=d.target;
    if(!title||title.length>80||!Array.isArray(plan)||!plan.length||plan.length>10||plan.some(x=>typeof x!=="string"||!x.trim()||x.length>80)||!Number.isInteger(target)||target<1||target>8||!["challenge","together"].includes(d.mode))fail(422,"Revisa el nombre, los ejercicios y el objetivo de series.");
    const id=randomUUID();
    const added=await rows("INSERT INTO partner_rooms(id,host,guest,title,mode,plan,target,created) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM partner_rooms WHERE host=? AND state='pending' AND created>?)<15 RETURNING id",id,uid,guest.uid,title,d.mode,JSON.stringify(plan.map(x=>x.trim())),target,Date.now(),uid,Date.now()-86400000);
    if(!added.length)fail(429,"Ya has enviado 15 invitaciones pendientes en las últimas 24 horas.");
    d={id};
  }
  const [r]=await rows(roomSql+" WHERE r.id=? AND (r.host=? OR r.guest=?)",String(d.id||""),uid,uid);
  if(!r)fail(404,"Sala no disponible.");
  if(path==="/partners/respond"){
    if(uid!==r.guest||typeof d.accept!=="boolean")fail(403,"Solo la persona invitada puede responder.");
    await rows("UPDATE partner_rooms SET state=? WHERE id=? AND state='pending'",d.accept?"active":"declined",r.id);
  }
  if(path==="/partners/set"){
    if(!Number.isInteger(d.exercise)||d.exercise<0||d.exercise>=JSON.parse(r.plan).length||!/^[a-zA-Z0-9_-]{8,80}$/.test(d.event||""))fail(422,"Serie no válida.");
    const ownDone=uid===r.host?"host_done":"guest_done";
    const inserted=await rows("INSERT OR IGNORE INTO partner_sets(room,uid,event,exercise) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM partner_rooms WHERE id=? AND state='active' AND "+ownDone+"=0) AND (SELECT COUNT(*) FROM partner_sets WHERE room=? AND uid=? AND exercise=?)<? RETURNING event",r.id,uid,d.event,d.exercise,r.id,r.id,uid,d.exercise,r.target);
    if(!inserted.length&&!(await rows("SELECT event FROM partner_sets WHERE room=? AND uid=? AND event=? AND exercise=?",r.id,uid,d.event,d.exercise)).length)fail(409,"La sesión ha terminado o ya alcanzaste el objetivo de este ejercicio.");
  }
  if(path==="/partners/finish"){
    const mine=uid===r.host?"host_done":"guest_done",other=uid===r.host?"guest_done":"host_done";
    await rows("UPDATE partner_rooms SET "+mine+"=1,state=CASE WHEN "+other+"=1 THEN 'finished' ELSE state END WHERE id=? AND state='active'",r.id);
  }
  const [now]=await rows(roomSql+" WHERE r.id=?",r.id);
  const counts=await rows("SELECT uid,exercise,COUNT(*) n FROM partner_sets WHERE room=? GROUP BY uid,exercise",r.id);
  return {nick,room:{...view(now,uid),counts:counts.map(c=>({side:c.uid===now.host?"host":"guest",exercise:c.exercise,n:c.n}))}};
}
