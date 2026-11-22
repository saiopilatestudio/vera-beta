import {readFileSync} from 'node:fs';
let harness=readFileSync(new URL('./audit-frontend-unit.mjs',import.meta.url),'utf8').split('const results=[];')[0];
harness=harness.replace("new URL('../www/',import.meta.url)",'new URL('+JSON.stringify(new URL('../www/',import.meta.url).href)+')');
harness+=`
run("VeraPrivacy6.set(true);VeraPrivacy6.ensureRemote=async()=>{};");
let calls=0,mode='quota';
ctx.fetch=async()=>{calls++;return mode==='ok'?{ok:true,status:200,json:async()=>({cached:true})}:{ok:false,status:429,headers:{get:()=> '7200'},json:async()=>({error:'Quota',code:mode==='quota'?'QUOTA_DAILY_PHOTO':'AI_RATE_LIMIT',limit:30,resetAt:'2026-11-23T00:00:00Z'})};};
let error=await run("api('photo',{}).catch(e=>e)");assert.equal(error.code,'QUOTA_DAILY_PHOTO');assert.equal(error.retryAfter,7200);assert.equal(error.status,429);assert.equal(error.limit,30);assert.equal(error.resetAt,'2026-11-23T00:00:00Z');
mode='ok';assert.equal((await run("api('photo',{})")).cached,true);assert.equal(calls,2,'photo reaches cache during cooldown');
mode='provider';error=await run("api('coach',{}).catch(e=>e)");assert.equal(error.code,'AI_RATE_LIMIT');error=await run("api('coach',{}).catch(e=>e)");assert.equal(error.code,'AI_COOLDOWN');assert.equal(calls,3,'other route still throttled');
console.log('PASS photo API: error metadata and 2h retry preserved, cache bypasses cooldown, coach remains throttled');
`;
await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
