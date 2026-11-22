import assert from 'node:assert/strict';import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(mkdtempSync(join(tmpdir(),'vera-gym-http24-')),'db'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GOOGLE_CLIENT_ID:'synthetic',GOOGLE_CLIENT_SECRET:'synthetic',GOOGLE_REDIRECT_URI:'https://synthetic.invalid/auth/google/callback'});
const realFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('GymJam must not contact AI or Spotify');};
const {server}=await import('../server.mjs');const {db,rows}=await import('../storage.mjs');if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
async function post(path,body,token){const response=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:response.status,data:await response.json()};}
try{
 assert.equal((await realFetch(base+'/capabilities').then(r=>r.json())).features.gymJam,true);
 assert.equal((await post('/gym-jam/state',{})).status,401);
 const host=(await post('/register',{email:'host-gym@example.invalid',password:'Synthetic-password',notice:'beta-3',adult:true})).data,guest=(await post('/register',{email:'guest-gym@example.invalid',password:'Synthetic-password',notice:'beta-3',adult:true})).data;
 let blocked=await post('/gym-jam/create',{acceptSharing:true},host.token);assert.equal(blocked.status,403);assert.equal(blocked.data.code,'GOOGLE_REQUIRED');
 for(const [u,sub]of [[host,'host'],[guest,'guest']])await rows('INSERT INTO google_links23 VALUES(?,?,?,?)',u.id,sub,sub+'@private.invalid',Date.now());
 const created=await post('/gym-jam/create',{acceptSharing:true,title:'Prueba HTTP',proposal:[{exercise:'Sentadilla',targetSets:2}],timeZone:'Europe/Madrid'},host.token);assert.equal(created.status,200);const room=created.data.room;
 assert.equal((await post('/gym-jam/state',{roomId:room.id},guest.token)).status,404);
 assert.equal((await post('/gym-jam/join',{code:room.code,acceptSharing:true},guest.token)).status,200);
 assert.equal((await post('/gym-jam/start',{roomId:room.id},guest.token)).status,403);
 assert.equal((await post('/gym-jam/state',{roomId:room.id,points:100},guest.token)).status,422);
 assert.equal((await post('/gym-jam/start',{roomId:room.id},host.token)).status,200);
 const publicState=(await post('/gym-jam/state',{roomId:room.id},guest.token)).data.room;assert.equal(publicState.self.points,0);assert.equal(publicState.qrValue,room.code);
 const serialized=JSON.stringify(publicState);for(const secret of [host.id,guest.id,'host-gym@example.invalid','host@private.invalid','guest@private.invalid'])assert.ok(!serialized.includes(secret));
 const ended=await post('/gym-jam/end',{roomId:room.id},host.token);assert.equal(ended.status,200);assert.equal(ended.data.room.status,'ended');assert.equal((await post('/gym-jam/leave',{roomId:room.id},guest.token)).status,200);
 assert.equal((await rows('SELECT count(*) AS n FROM quota'))[0].n,0);assert.equal((await rows('SELECT count(*) AS n FROM photo_quota24'))[0].n,0);
 console.log('PASS gym-jam-http24: capability, auth401, Google gate403, create/join/state, membership404, host403, forged points422, private fields absent, ended leave and zero AI spend.');
}finally{globalThis.fetch=realFetch;await new Promise(resolve=>server.close(resolve));db.close();}
