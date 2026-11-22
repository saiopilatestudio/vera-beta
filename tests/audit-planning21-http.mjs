// Real HTTP and SQLite; synthetic providers only. No production accounts.
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'vera-planning21-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(dir,'db.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GROQ_API_KEY:'fixture-groq',GEMINI_API_KEY:'fixture-gemini'});
const realFetch=globalThis.fetch,calls=[];
let output={answer:'Revisa el registro',entries:[{kind:'Comida',date:'2026-01-20',value:600,note:'Prueba',protein:30,carbs:60,fat:20,nutrients:{iron_mg:4}}]},planMode=false,invalidPlan=false;
const dates=Array.from({length:7},(_,i)=>`2026-01-${String(19+i).padStart(2,'0')}`);
globalThis.fetch=async(url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body});let data=output;
 if(planMode){const coordinator=body.messages?.[0]?.content.includes('Coordina las tres');data=coordinator?(invalidPlan?{summary:'x',changes:'',days:[]}:{summary:'Semana revisada',changes:'Datos insuficientes',days:dates.map(date=>({date,training:'Registrar sesión',nutrition:'Registrar comida',recovery:'Registrar sueño'}))}):'Revisión independiente con datos insuficientes';}
 const text=typeof data==='string'?data:JSON.stringify(data);
 return Response.json(String(url).includes('googleapis')?{candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]}:{choices:[{finish_reason:'stop',message:{content:text}}]});
};
const {server}=await import('../server.mjs');const{db,rows}=await import('../storage.mjs');
if(!server.listening)await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;let token,passed=0;
async function post(path,data){const r=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return{status:r.status,data:await r.json()};}
async function test(name,fn){await fn();passed++;console.log('PASS · '+name);}
try{
 await test('new routes require authentication before any inference',async()=>{for(const path of ['/diary-import','/weekly-plan'])assert.equal((await post(path,{})).status,401);assert.equal(calls.length,0);});
 const user=(await post('/register',{email:'planning@example.invalid',password:'Synthetic-password-for-tests',adult:true,notice:'beta-3'})).data;token=user.token;
 await test('historical extraction preserves measured nutrients and never writes without confirmation',async()=>{const r=await post('/diary-import',{text:'Comí ayer',date:'2026-01-20',today:'2026-01-21'});assert.equal(r.status,200);assert.equal(r.data.entries[0].protein,30);assert.equal(r.data.entries[0].nutrients.iron_mg,4);assert.equal((await rows('SELECT COUNT(*) AS n FROM diary_sync WHERE uid=?',user.id))[0].n,0);assert.match(calls.at(-1).url,/api.groq.com/);});
 await test('historical image uses Gemini and does not persist the source image',async()=>{const r=await post('/diary-import',{text:'Lee esta captura',date:'2026-01-20',today:'2026-01-21',image:'data:image/png;base64,iVBORw0KGgo='});assert.equal(r.status,200);assert.match(calls.at(-1).url,/googleapis.com/);assert.equal(calls.at(-1).body.contents[0].parts[1].inlineData.mimeType,'image/png');assert.equal((await rows('SELECT COUNT(*) AS n FROM diary_sync WHERE uid=?',user.id))[0].n,0);});
 await test('bad historical dates and missing text cannot call a provider',async()=>{const n=calls.length;for(const d of [{text:'x',date:'2026-02-31'},{text:'',date:'2026-01-20'}])assert.equal((await post('/diary-import',d)).status,400);assert.equal(calls.length,n);});
 await test('confirmed historical entry syncs once with idempotent record identity',async()=>{const record={id:'imported-test-entry',...output.entries[0]};const first=await post('/diario',{updates:[{id:record.id,rev:0,record}]});assert.equal(first.status,200);assert.equal(first.data.accepted.length,1);const again=await post('/diario',{updates:[{id:record.id,rev:0,record}]});assert.equal(again.data.accepted.length,1);assert.equal((await rows('SELECT COUNT(*) AS n FROM diary_sync WHERE uid=?',user.id))[0].n,1);});
 await test('three specialists and coordinator return seven dated days with no fabricated completion',async()=>{planMode=true;const count=calls.length;const r=await post('/weekly-plan',{week:dates[0],profile:{name:'Synthetic',password:'must-not-send'},logs:[{kind:'Sueño',date:'2026-01-18',value:8}]});assert.equal(r.status,200);assert.equal(calls.length,count+4);assert.equal(r.data.reports.length,3);assert.deepEqual(r.data.days.map(d=>d.date),dates);assert.ok(r.data.days.every(d=>Object.keys(d.done).length===0));assert.ok(!JSON.stringify(calls.slice(count)).includes('must-not-send'));assert.ok(calls.slice(count).every(c=>c.url.startsWith('https://api.groq.com/')));});
 await test('invalid coordinator output is rejected and quota reservation returned',async()=>{invalidPlan=true;const before=(await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n;const r=await post('/weekly-plan',{week:dates[0]});assert.equal(r.status,502);assert.equal(r.data.code,'PLAN_FORMAT');assert.equal((await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n,before);});
 console.log(`PLANNING HTTP V2.1: ${passed} grupos correctos.`);
}finally{globalThis.fetch=realFetch;await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true,maxRetries:8,retryDelay:100}).catch(e=>{if(e.code!=='EBUSY')throw e;});}
