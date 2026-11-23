import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const folder=await mkdtemp(join(tmpdir(),'vera-exercise-search245-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(folder,'db.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:''});
const realFetch=globalThis.fetch;let calls=0,fail=false;
globalThis.fetch=async(url,options)=>{calls++;assert.equal(new URL(url).origin,'https://es.wikipedia.org');assert.equal(options.headers.Authorization,undefined);if(fail)throw Error('private upstream');return Response.json({query:{search:[{pageid:42,title:'Sentadilla',snippet:'Sentadilla ejercicio de entrenamiento muscular'}]}});};
const {server}=await import('../server.mjs'),{db,rows}=await import('../storage.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const post=async(path,data,token)=>{const r=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
try{
 const user=(await post('/register',{email:'exercise-test@example.invalid',password:'Synthetic-password245',adult:true,notice:'beta-3'})).data;
 const input={query:'press declinado',source:'catalog',week:'2026-11-23'};
 assert.equal((await post('/exercises/search',input)).status,401);
 assert.equal((await post('/profile-sync',{updates:[{field:'profile.eq',rev:0,value:['Mancuernas']},{field:'profile.level',rev:0,value:'Principiante'}]},user.token)).status,200);
 const local=await post('/exercises/search',input,user.token);assert.equal(local.status,200);assert.ok(local.data.results.some(x=>x.id==='Decline_Dumbbell_Bench_Press'));assert.ok(local.data.results.every(x=>['dumbbell','body only'].includes(x.equipment)));assert.equal(calls,0);
 const online=await post('/exercises/search',{...input,source:'web',query:'Sentadilla'},user.token);assert.equal(online.status,200);assert.equal(online.data.results[0].url,'https://es.wikipedia.org/?curid=42');assert.equal(calls,1);
 assert.equal((await post('/exercises/search',{...input,query:'x'},user.token)).status,422);
 fail=true;const offline=await post('/exercises/search',{...input,source:'web',query:'Otra sentadilla'},user.token);assert.equal(offline.status,503);assert.equal(offline.data.code,'EXERCISE_SEARCH_UNAVAILABLE');assert.ok(!JSON.stringify(offline).includes('private'));
 assert.equal((await post('/exercises/search',input,user.token)).status,200,'Local search remains available after web failure');
 assert.equal((await rows('SELECT count(*) AS n FROM quota WHERE uid=?',user.id))[0].n,0,'Search never consumes AI quota');
 console.log('PASS HTTP search245: real auth/profile/material filter, Wikipedia references, web failure/manual continuation, no AI quota.');
}finally{globalThis.fetch=realFetch;await new Promise(r=>server.close(r));db.close();await rm(folder,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
