import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=await mkdtemp(join(tmpdir(),'vera-http-audit-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(folder,'test.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',AI_PROVIDER:'groq',GROQ_API_KEY:'',GEMINI_API_KEY:''});
const {server}=await import('../server.mjs');
const {db}=await import('../storage.mjs');
if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
const base='http://127.0.0.1:'+server.address().port;
let passed=0;
async function check(name, fn){await fn();passed++;console.log('PASS '+name);}
async function post(path,body,token){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers};}
try {
await check('health and content types',async()=>{const r=await fetch(base+'/health');assert.equal(await r.text(),'ok');assert.match(r.headers.get('content-type'),/text\/plain/);});
await check('capabilities declare V2 per-function providers without claiming inference',async()=>{const r=await fetch(base+'/capabilities');const d=await r.json();assert.equal(d.apiVersion,'2.4');assert.deepEqual(d.ai.providers,['groq','gemini']);assert.equal(d.ai.routingVersion,2);assert.equal(d.ai.routes.coach.configured,false);assert.equal(d.ai.routes.speak.configured,false);assert.equal(d.ai.localInference,false);assert.equal(d.ai.speechOutput,'remote');assert.equal(d.ai.verification,'configuration-only');});
await check('local model and inference runtime assets are not served',async()=>{for(const path of ['/coach.gguf','/food.onnx','/vision.onnx','/local.wasm'])assert.equal((await fetch(base+path)).status,404);});
await check('reject JSON null and array without JS exception leakage',async()=>{for(const data of [null,[]]){const r=await post('/register',data);assert.equal(r.status,400);assert.equal(r.data.code,'INVALID_BODY');}});
const password='Synthetic-password-only-3928';
let alice,bob;
await check('create isolated synthetic accounts',async()=>{alice=(await post('/register',{email:'alice-'+Date.now()+'@example.invalid',password,adult:true,notice:'beta-3'})).data;bob=(await post('/register',{email:'bob-'+Date.now()+'@example.invalid',password,adult:true,notice:'beta-3'})).data;assert.ok(alice.token&&bob.token);});
await check('requires bearer auth',async()=>{assert.equal((await post('/diario',{})).status,401);});
await check('atomic journal rejection via HTTP',async()=>{const r=await post('/diario',{updates:[{id:'valid-first',rev:0,record:{id:'valid-first',kind:'Agua',date:'2026-11-22',value:250}},{id:'bad-date',rev:0,record:{id:'bad-date',kind:'Sueño',date:'2026-02-30',value:8}}]},alice.token);assert.equal(r.status,422);const list=await post('/diario',{},alice.token);assert.equal(list.data.records.length,0);});
await check('persist sleep, idempotent retry and isolation',async()=>{const input={updates:[{id:'sleep-real-test',rev:0,record:{id:'sleep-real-test',kind:'Sueño',date:'2026-11-22',value:8}}]};for(let i=0;i<2;i++){const r=await post('/diario',input,alice.token);assert.equal(r.status,200);assert.equal(r.data.accepted[0].rev,1);}assert.equal((await post('/diario',{},bob.token)).data.records.length,0);});
await check('nick duplicate is explicit conflict',async()=>{assert.equal((await post('/nickname',{nick:'Audit_'+Date.now().toString().slice(-8)},alice.token)).status,200);const nick='Collision_'+Date.now().toString().slice(-8);await post('/nickname',{nick},alice.token);assert.equal((await post('/nickname',{nick:'@'+nick.toLowerCase()},bob.token)).status,409);});
await check('AI without key is unavailable, never simulated',async()=>{const r=await post('/coach',{question:'hola'},alice.token);assert.equal(r.status,503);assert.equal(r.data.code,'AI_NOT_CONFIGURED');});
await check('Spanish speech requires its own Gemini key',async()=>{const r=await post('/speak',{text:'hola'},alice.token);assert.equal(r.status,503);assert.equal(r.data.code,'AI_NOT_CONFIGURED');});
await check('headers and admin access boundaries',async()=>{const r=await post('/session',{},alice.token);assert.match(r.headers.get('content-type'),/application\/json/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal((await post('/admin/summary',{},alice.token)).status,403);});
await check('logout revokes bearer token',async()=>{await post('/logout',{},alice.token);assert.equal((await post('/session',{},alice.token)).status,401);});
console.log(JSON.stringify({passed,failed:0,scope:'live local HTTP, real SQLite, synthetic accounts, no upstream AI calls'}));

} finally { await new Promise(resolve=>server.close(resolve)); db.close(); await rm(folder,{recursive:true,force:true,maxRetries:8,retryDelay:100}).catch(e=>{if(e.code!=="EBUSY")throw e;}); }
