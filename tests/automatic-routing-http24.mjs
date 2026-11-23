import assert from 'node:assert/strict';import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(mkdtempSync(join(tmpdir(),'vera-routing-http-')),'db'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GEMINI_API_KEY:'mock',GROQ_API_KEY:'mock',VERA_CF_WORKER_URL:'https://vera-ai.test.workers.dev',VERA_CF_WORKER_SECRET:'test-cf-secret'.repeat(3)});
const realFetch=globalThis.fetch,calls=[];let failGroq=false,bad=false;
const label={brand:'Test',product:'Whey',variant:'Chocolate',form:'powder',portion:30,unit:'g',facts:{kcal:120,protein:23,carbs:3,fat:2,calcium_mg:100},identityConfidence:'high',missingFields:[]};
globalThis.fetch=async(url,options)=>{calls.push(url);const body=JSON.parse(options.body);if(url.includes('googleapis'))return new Response('',{status:429});if(url.includes('groq')&&failGroq)return new Response('',{status:503});const isLabel=JSON.stringify(body).includes('Lee el envase');if(!isLabel)assert.ok(JSON.stringify(body).includes('conserva en ingredients los demás alimentos visibles'));const result=bad?{bad:true}:isLabel?label:{description:'Pan con untable pendiente',min:100,max:180,assumptions:'Subtotal del pan; excluye el untable pendiente.',question:'¿Qué untable es y cuánta cantidad?',ingredients:[{name:'Pan',grams:100,kcal:130,protein:3,carbs:28,fat:1}]};return Response.json(url.includes('workers.dev')?{text:JSON.stringify(result)}:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});};
const {server}=await import('../server.mjs'),{db,rows}=await import('../storage.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;let token;
const post=async(path,body)=>{const r=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
try{
const user=(await post('/register',{email:'routing@example.invalid',password:'only-test-password',adult:true,notice:'beta-3'})).data;token=user.token;
const body={image:'data:image/png;base64,iVBORw0KGgo='};
let r=await post('/photo',body);assert.equal(r.status,200);assert.equal(calls.length,2);assert.equal(r.data.ingredients[0].grams,100);assert.equal(r.data.ingredients.length,1);assert.match(r.data.question,/untable/);assert.match(r.data.assumptions,/excluye/);
r=await post('/photo',body);assert.equal(r.data.cache,'hit');assert.equal(calls.length,2);
r=await post('/label',body);assert.equal(r.status,429);assert.equal(calls.length,2,'legacy label cannot use Groq');
r=await post('/label',{...body,cloudFallbackConsent:true});assert.equal(r.status,200);assert.equal(r.data.facts.calcium_mg,100);
r=await post('/label',body);assert.equal(r.status,429,'legacy consent cannot retrieve new consent cache');
bad=true;r=await post('/photo',{...body,note:'invalid schema'});assert.equal(r.status,502);assert(!calls.some(x=>x.includes('workers.dev')),'invalid response is not retried elsewhere');bad=false;
failGroq=true;r=await post('/photo',{...body,note:'no third consent'});assert.equal(r.status,503);assert(!calls.some(x=>x.includes('workers.dev')));
r=await post('/photo',{...body,note:'third consent',cloudFallbackConsent:true});assert.equal(r.status,200);assert(calls.at(-1).includes('workers.dev'));assert.equal(r.data.ingredients[0].grams,100);assert.equal(r.data.ingredients.length,1);assert.match(r.data.question,/untable/);assert.match(r.data.assumptions,/excluye/);
assert.equal((await rows('SELECT n FROM photo_quota24 WHERE uid=?',user.id))[0].n,2,'errors refunded, cache free');
console.log('PASS HTTP automatic photo/label failover, cache consent isolation, validation, refunds and explicit third provider only');
}finally{globalThis.fetch=realFetch;await new Promise(r=>server.close(r));db.close();}
