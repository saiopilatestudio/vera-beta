import {rows} from './storage.mjs';
await rows('CREATE TABLE IF NOT EXISTS diary_sync(uid TEXT, id TEXT, rev INTEGER NOT NULL, data TEXT, PRIMARY KEY(uid,id))');
export async function journal(uid,{updates=[],cursor=''}) {
 if(!Array.isArray(updates)||updates.length>40||typeof cursor!=='string'||cursor.length>100)throw Error('Lote no válido.');
 const accepted=[],conflicts=[];
 for(const {id,rev,record} of updates){
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]{3,100}$/.test(id)||!Number.isSafeInteger(rev)||rev<0)throw Error('Revisión no válida.');
  const value=record==null?null:JSON.stringify(record);
  if(record!=null&&(record.id!==id||typeof record.kind!=='string'||record.source==='health'||!/^\d{4}-\d\d-\d\d$/.test(record.date)||Buffer.byteLength(value)>32000||/data:(image|audio)\//i.test(value)))throw Error('Entrada no admitida.');
  let changed=rev===0?await rows('INSERT INTO diary_sync VALUES(?,?,1,?) ON CONFLICT DO NOTHING RETURNING rev',uid,id,value):await rows('UPDATE diary_sync SET data=?,rev=rev+1 WHERE uid=? AND id=? AND rev=? RETURNING rev',value,uid,id,rev);
  if(changed.length)accepted.push({id,rev:changed[0].rev});
  else{const [r]=await rows('SELECT rev,data FROM diary_sync WHERE uid=? AND id=?',uid,id);if(r&&r.data===value)accepted.push({id,rev:r.rev});else conflicts.push({id,rev:r?.rev||0,record:JSON.parse(r?.data||'null')});}
 }
 const page=await rows('SELECT id,rev,data FROM diary_sync WHERE uid=? AND id>? ORDER BY id LIMIT 51',uid,cursor);
 return {accepted,conflicts,records:page.slice(0,50).map(r=>({id:r.id,rev:r.rev,record:JSON.parse(r.data)})),next:page.length>50?page[49].id:null};
}
