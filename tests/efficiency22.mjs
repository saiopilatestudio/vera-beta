import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'vera-efficiency22-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(dir,'test.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GROQ_API_KEY:'synthetic-groq',GEMINI_API_KEY:'synthetic-gemini',GOOGLE_PLACES_KEY:'synthetic-places'});
const actualFetch=globalThis.fetch,calls=[];let status=200,failures=0;
globalThis.fetch=async(url,options)=>{
 const parsed=new URL(url);assert.ok(['api.groq.com','generativelanguage.googleapis.com','places.googleapis.com'].includes(parsed.hostname));
 const payload=JSON.parse(options.body);calls.push({url:String(url),options,payload});
 if(status!==200&&failures-->0)return new Response('PRIVATE PROVIDER DIAGNOSTIC',{status,headers:{'Retry-After':'11'}});
 if(parsed.hostname==='places.googleapis.com')return Response.json({places:[{id:'gym-1',displayName:{text:'Gimnasio de prueba'},formattedAddress:'Ciudad',googleMapsUri:'https://maps.google.com/?cid=1'}]});
 const answer={answer:'Respuesta de prueba',plan:'',memory:'',entries:[]};
 if(parsed.hostname==='generativelanguage.googleapis.com')return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(answer)}]}}]});
 return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]});
};
const {server}=await import('../server.mjs'),{db,rows}=await import('../storage.mjs');
if(!server.listening)await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;let token='';
async function post(path,body,auth=true){const r=await actualFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(auth&&token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers};}
try{
 const user=(await post('/register',{email:'efficiency22@example.invalid',password:'Synthetic-test-only-pass',adult:true,notice:'beta-3'})).data;token=user.token;assert.ok(token);
 let count=calls.length;let response=await post('/coach',{question:'¿Cuánta proteína he registrado hoy?'});
 assert.equal(response.status,200);assert.equal(calls.length-count,1,'ordinary topic must use exactly one call');assert.equal(response.data.reports.length,0);assert.ok(calls.at(-1).payload.max_completion_tokens<=1400);
 count=calls.length;response=await post('/coach',{question:'Revisa mi estado general'});
 assert.equal(response.status,200);assert.equal(calls.length-count,5,'explicit general review uses four specialists plus coordinator');assert.equal(response.data.reports.length,4);
 const reports=calls.slice(count,-1);assert.ok(reports.every(c=>c.payload.max_completion_tokens<=1200&&c.payload.reasoning_effort==='low'));
 const quotaBefore=(await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n;
 count=calls.length;status=429;failures=5;response=await post('/coach',{question:'Hola'});
 assert.equal(response.status,429);assert.equal(calls.length-count,1,'429 must never retry automatically');assert.equal(response.headers.get('retry-after'),'11');assert.equal(response.data.code,'AI_RATE_LIMIT');assert.ok(!JSON.stringify(response.data).includes('PRIVATE'));assert.equal((await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n,quotaBefore);
 count=calls.length;status=503;failures=1;response=await post('/coach',{question:'Hola'});
 assert.equal(response.status,200);assert.equal(calls.length-count,2,'one transient503 retry');
 count=calls.length;status=503;failures=5;response=await post('/coach',{question:'Hola'});
 assert.equal(response.status,503);assert.equal(calls.length-count,2,'persistent503 retries at most once');
 status=200;count=calls.length;assert.equal((await post('/places',{query:'Gimnasio Madrid'},false)).status,401);assert.equal(calls.length,count,'anonymousPlaces never reaches Google');
 response=await post('/places',{query:'https://private.invalid/secrets Madrid'});assert.equal(response.status,200);assert.equal(calls.at(-1).url,'https://places.googleapis.com/v1/places:searchText');assert.equal(calls.at(-1).options.headers['X-Goog-Api-Key'],'synthetic-places');assert.equal(calls.at(-1).payload.languageCode,'es');assert.equal(calls.at(-1).payload.includedType,'gym');assert.equal(calls.at(-1).payload.strictTypeFiltering,true);assert.ok(!JSON.stringify(response.data).includes('synthetic-places'));
 count=calls.length;status=403;failures=1;response=await post('/places',{query:'Gimnasio Madrid'});assert.equal(response.status,503);assert.equal(calls.length,count+1);assert.ok(!JSON.stringify(response.data).includes('PRIVATE'));
 status=200;
 const {compactContext22}=await import('../efficiency22.mjs');
 const question='¿Cuál fue el cambio? '+ 'x'.repeat(4500),profile={restrictions:'Restricción importante íntegra',goal:'fuerza'},records=Array.from({length:120},(_,i)=>({id:'record-'+i,date:'2026-11-'+String(i%22+1).padStart(2,'0'),kind:'Comida',value:i,note:'nota '.repeat(80)}));
 const compact=compactContext22({question,profile,logs:records,confirmedContext:[records[0]],history:Array.from({length:120},()=>({text:'old '.repeat(100)})),password:'never-send'});
 assert.equal(compact.question,question);assert.deepEqual(compact.profile,profile);assert.ok(Buffer.byteLength(JSON.stringify(compact))<=8000);assert.ok(compact.logs.length<120);assert.ok(!compact.logs.some(r=>r.id==='record-0'));assert.ok(!JSON.stringify(compact).includes('never-send'));assert.equal(compact.selectionCoverage22.completeHistory,false);assert.equal(compact.selectionCoverage22.client.available,120);assert.ok(compact.selectionCoverage22.omittedFields.includes('history.older'));
 assert.throws(()=>compactContext22({question:'x'.repeat(8000),profile:{restrictions:'r'.repeat(4000)}},{maxBytes:8000}),/perfil y la consulta/);
 console.log('PASS V2.2 efficiency/security: ordinary1call, general5calls, outputcaps,429 no retry+refund,503 boundedretry,Places auth/fixedhost/privatekey/errorredaction,contextbudget/dedup/fullrestrictions/coverage.');
}finally{globalThis.fetch=actualFetch;await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100}).catch(e=>{if(e.code!=='EBUSY')throw e;});}
