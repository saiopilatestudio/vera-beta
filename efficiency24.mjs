import {createHash} from 'node:crypto';
import {db,rows} from './storage.mjs';
import {validateImage} from './request-safety.mjs';
await db.batch(['CREATE TABLE IF NOT EXISTS label_cache24(uid TEXT NOT NULL,cache_key TEXT NOT NULL,result TEXT NOT NULL,expires INTEGER NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(uid,cache_key))','CREATE INDEX IF NOT EXISTS label_cache24_expiry ON label_cache24(expires)'],'write');
const flights=new Map(),clone=x=>JSON.parse(JSON.stringify(x));
export function labelCacheKey24(image,{version='label24-v1',note=''}={}){
 validateImage(image);if(typeof version!=='string'||!version||version.length>500||typeof note!=='string'||note.length>4000)throw Object.assign(Error('Contexto de etiqueta no válido.'),{status:422});
 const comma=image.indexOf(','),hash=createHash('sha256');hash.update(JSON.stringify({version,note,mime:image.slice(0,comma)}));hash.update(Buffer.from(image.slice(comma+1),'base64'));return hash.digest('hex');
}
export async function cachedLabel24(uid,image,compute,options={}){
 if(typeof uid!=='string'||!uid||uid.length>200)throw Object.assign(Error('Inicia sesión.'),{status:401});if(typeof compute!=='function')throw new TypeError('compute must be a function');
 const ttlMs=options.ttlMs??86400000;if(!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>7*86400000)throw new TypeError('TTL fuera de rango');
 const key=labelCacheKey24(image,options),flightKey=uid+'\0'+key;
 if(flights.has(flightKey)){const shared=await flights.get(flightKey);return {...clone(shared),cache:'shared_inflight'};}
 const pending=(async()=>{
  const now=Date.now(),stored=(await rows('SELECT result,expires FROM label_cache24 WHERE uid=? AND cache_key=? AND expires>?',uid,key,now))[0];
  if(stored)return {result:JSON.parse(stored.result),cache:'hit',expiresAt:stored.expires};
  // The caller performs quota consumption and provider invocation inside compute.
  const result=await compute();if(!result||typeof result!=='object'||Array.isArray(result)||result.error)throw Error('Respuesta de etiqueta no válida.');
  const serialized=JSON.stringify(result);if(Buffer.byteLength(serialized)>64000)throw Error('Respuesta de etiqueta demasiado grande.');
  const created=Date.now(),expiresAt=created+ttlMs;
  await db.batch([{sql:'DELETE FROM label_cache24 WHERE expires<=?',args:[created]},{sql:'INSERT INTO label_cache24 VALUES(?,?,?,?,?) ON CONFLICT(uid,cache_key) DO UPDATE SET result=excluded.result,expires=excluded.expires,created=excluded.created',args:[uid,key,serialized,expiresAt,created]},{sql:'DELETE FROM label_cache24 WHERE uid=? AND cache_key NOT IN (SELECT cache_key FROM label_cache24 WHERE uid=? ORDER BY created DESC,cache_key LIMIT 100)',args:[uid,uid]}],'write');
  return {result:JSON.parse(serialized),cache:'miss',expiresAt};
 })();flights.set(flightKey,pending);
 try{return clone(await pending);}finally{if(flights.get(flightKey)===pending)flights.delete(flightKey);}
}
