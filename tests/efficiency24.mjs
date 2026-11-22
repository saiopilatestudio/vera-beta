import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'vera-efficiency24-'));process.env.VERA_DB=join(temp,'db.sqlite');delete process.env.TURSO_DATABASE_URL;delete process.env.RENDER;
const {cachedLabel24,labelCacheKey24}=await import('../efficiency24.mjs');const {db,rows}=await import('../storage.mjs');
const image='data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,0,1,2]).toString('base64'),other='data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,0,1,3]).toString('base64');let calls=0;const compute=async()=>{calls++;await new Promise(r=>setTimeout(r,20));return {brand:'Example',facts:{protein:21}};};
try{
 const first=await Promise.all(Array.from({length:8},()=>cachedLabel24('alice',image,compute)));assert.equal(calls,1);assert.equal(first.filter(r=>r.cache==='miss').length,1);assert.equal(first.filter(r=>r.cache==='shared_inflight').length,7);
 first[0].result.facts.protein=999;const hit=await cachedLabel24('alice',image,compute);assert.equal(hit.cache,'hit');assert.equal(hit.result.facts.protein,21);assert.equal(calls,1);
 await cachedLabel24('bob',image,compute);await cachedLabel24('alice',other,compute);await cachedLabel24('alice',image,compute,{version:'different-model'});await cachedLabel24('alice',image,compute,{note:'different context'});assert.equal(calls,5);
 const key=labelCacheKey24(image);await rows('UPDATE label_cache24 SET expires=0 WHERE uid=? AND cache_key=?','alice',key);await cachedLabel24('alice',image,compute);assert.equal(calls,6);
 let errors=0;const fail=async()=>{errors++;throw Error('Provider unavailable');};await assert.rejects(()=>cachedLabel24('failure',image,fail));await assert.rejects(()=>cachedLabel24('failure',image,fail));assert.equal(errors,2);assert.equal((await rows('SELECT count(*) AS n FROM label_cache24 WHERE uid=?','failure'))[0].n,0);
 await assert.rejects(()=>cachedLabel24('failure',image,async()=>({error:'provider error'})));assert.equal((await rows('SELECT count(*) AS n FROM label_cache24 WHERE uid=?','failure'))[0].n,0);
 assert.throws(()=>labelCacheKey24('data:image/png;base64,aGVsbG8='));assert.throws(()=>labelCacheKey24(image,{note:42}));
 console.log('PASS label cache: exact bytes, uid isolation, persistent hit, single-flight 8->1, cloned results, model/context keys, expiry, failed responses never cached.');
}finally{db.close();await rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
