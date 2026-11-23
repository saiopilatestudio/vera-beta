// Real HTTP + SQLite; Gemini transport only is simulated. No live inference.
import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'vera-products-http24-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(dir,'db.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GROQ_API_KEY:'test-groq',GEMINI_API_KEY:'test-gemini',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',GOOGLE_REDIRECT_URI:'https://vera-beta.onrender.com/auth/google/callback'});
const realFetch=globalThis.fetch;let calls=0,status=200,delay=0;let output={brand:'Zumub',product:'Multivitamin + Mineral',variant:'No aplica',form:'capsule',portion:1,unit:'cápsulas',facts:{vitaminA_ug:160,vitaminC_mg:60,vitaminD_ug:5,vitaminB12_ug:1},identityConfidence:'high',missingFields:[]};
globalThis.fetch=async(url,options)=>{assert.match(String(url),/^https:\/\/generativelanguage.googleapis.com\/v1beta\//);calls++;if(delay)await new Promise(r=>setTimeout(r,delay));if(status!==200)return new Response('private upstream error',{status,headers:{'retry-after':'1'}});return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output)}]}}]});};
const {server}=await import('../server.mjs');const {db,rows}=await import('../storage.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const image=n=>'data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,n]).toString('base64');
async function post(path,body,token){const response=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:response.status,data:await response.json()};}
const quota=async uid=>(await rows('SELECT n FROM quota WHERE uid=?',uid))[0]?.n||0;
try{
 const alice=(await post('/register',{email:'alice24@example.invalid',password:'test-only-password24',adult:true,notice:'beta-3'})).data,bob=(await post('/register',{email:'bob24@example.invalid',password:'test-only-password24',adult:true,notice:'beta-3'})).data;
 assert.equal((await post('/products/search',{query:'Zumub'})).status,401);assert.equal((await post('/products/search',{query:'Zumub'},alice.token)).status,403);
 for(const u of [alice,bob])await rows('INSERT INTO google_links23 VALUES(?,?,?,?)',u.id,u.id,'test@example.invalid',Date.now());
 const found=await post('/products/search',{query:'ZUMUN',kind:'supplement'},alice.token);assert.equal(found.status,200);assert.equal(found.data.products.length,7);assert.equal(calls,0);assert.equal(await quota(alice.id),0);
 const product={name:'Etiqueta privada',brand:'Mi marca',variant:'Vainilla',kind:'supplement',form:'powder',portion:30,unit:'g',facts:{protein:20,vitaminB12_ug:2},aliases:['Mi batido']};
 const saved=await post('/products/confirm',{confirmed:true,product},alice.token);assert.equal(saved.status,200);assert.equal((await post('/products/search',{query:'Mi batido'},alice.token)).data.products.length,1);assert.equal((await post('/products/search',{query:'Mi batido'},bob.token)).data.products.length,0);assert.equal((await post('/products/confirm',{confirmed:true,product:saved.data.product},bob.token)).status,404);
 const first=await post('/label',{image:image(1)},alice.token);assert.equal(first.status,200);assert.equal(first.data.cache,'miss');assert.equal(first.data.facts.vitaminA_ug,160);assert.equal(first.data.catalogMatches.length,1);assert.equal(calls,1);assert.equal(await quota(alice.id),1);
 const hit=await post('/label',{image:image(1)},alice.token);assert.equal(hit.data.cache,'hit');assert.equal(calls,1);assert.equal(await quota(alice.id),1);
 await post('/label',{image:image(1)},bob.token);assert.equal(calls,2);assert.equal(await quota(bob.id),1);
 delay=150;const concurrent=await Promise.all(Array.from({length:8},()=>post('/label',{image:image(2)},alice.token)));delay=0;assert.ok(concurrent.every(r=>r.status===200));assert.equal(calls,3);assert.equal(await quota(alice.id),2);
 const before=await quota(alice.id);status=429;for(let n=0;n<2;n++){const response=await post('/label',{image:image(3)},alice.token);assert.equal(response.status,429);assert.ok(!JSON.stringify(response.data).includes('private upstream'));}status=200;assert.equal(calls,4);assert.equal(await quota(alice.id),before);
 assert.equal((await post('/label',{image:'broken'},alice.token)).status,400);assert.equal(calls,4);
 await new Promise(resolve=>setTimeout(resolve,1100)); // Respect Retry-After; second failed request was served by cooldown.
 output={...output,facts:{vitaminC_mg:-1}};assert.equal((await post('/label',{image:image(4)},alice.token)).status,502);assert.equal(await quota(alice.id),before);output={...output,facts:{vitaminC_mg:60}};assert.equal((await post('/label',{image:image(4)},alice.token)).data.cache,'miss');
 const count=calls;await post('/label',{image:image(1),note:'otra variante'},alice.token);assert.equal(calls,count+1);
 console.log('PASS products/label HTTP: Google/auth gate, private catalogs, 8 official seeds, no catalog quota, miss/hit quotas, uid isolation, 8 concurrent->1, retry-after errors uncached, invalid image/label rejected, note cache isolation.');
}finally{globalThis.fetch=realFetch;await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
