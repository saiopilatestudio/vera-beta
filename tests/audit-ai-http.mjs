// Real HTTP + SQLite; only upstream AI transport is controlled. No real inference is claimed.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = await mkdtemp(join(tmpdir(),'vera-ai-http-'));
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(directory,'db.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',AI_PROVIDER:'groq',GROQ_API_KEY:'synthetic-test-key',GEMINI_API_KEY:'synthetic-gemini-key'});
const realFetch=globalThis.fetch, calls=[];
let geminiEnvelope=null;
let nextResult={answer:'Propuesta de prueba',plan:'',memory:'',entries:[]}, upstreamStatus=200, delay=0;
globalThis.fetch=async (url,options)=>{
  assert.ok(String(url).startsWith('https://api.groq.com/openai/v1/')||String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/'),'Unexpected upstream');
  assert.equal(options.headers[String(url).includes('googleapis')?'x-goog-api-key':'Authorization'],String(url).includes('googleapis')?'synthetic-gemini-key':'Bearer synthetic-test-key');
  const payload=options.body instanceof FormData ? {audioModel:options.body.get('model')} : JSON.parse(options.body);
  calls.push({url,payload});
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  if(upstreamStatus!==200)return new Response('private upstream body',{status:upstreamStatus,headers:{'retry-after':'7'}});
  if(String(url).includes('googleapis')) return Response.json(String(url).endsWith('/interactions')?nextResult:geminiEnvelope||{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(nextResult)}]}}]});
  return Response.json(String(url).endsWith('transcriptions')?nextResult:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(nextResult)}}]});
};
const {server}=await import('../server.mjs');
const {db,rows}=await import('../storage.mjs');
if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
const base='http://127.0.0.1:'+server.address().port;
let token,passed=0;
async function post(path,body){const r=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:r.headers.get('content-type')?.startsWith('audio/')?Buffer.from(await r.arrayBuffer()):await r.json(),headers:r.headers};}
async function test(name,fn){await fn();passed++;console.log('PASS · '+name);}
try{
  const user=(await post('/register',{email:'ai@example.invalid',password:'Synthetic-only-password',adult:true,notice:'beta-3'})).data;token=user.token;
  await test('coach reads only sanitized authenticated journal context',async()=>{
    await post('/diario',{updates:[{id:'own-record',rev:0,record:{id:'own-record',date:'2026-01-01',kind:'Agua',value:250,password:'never-send'}}]});
    await rows('INSERT INTO diary_sync VALUES(?,?,?,?)','different-user','other-record',1,JSON.stringify({id:'other-record',date:'2026-01-01',kind:'Agua',value:999}));
    const result=await post('/coach',{question:'Hola',token:'never-send',profile:{email:'never-send',goal:'fuerza'}});
    assert.equal(result.status,200);const body=calls.at(-1).payload;
    assert.equal(body.model,'openai/gpt-oss-120b');assert.ok(!JSON.stringify(body).includes('never-send'));assert.ok(!JSON.stringify(body).includes('other-record'));assert.ok(JSON.stringify(body).includes('own-record'));
  });
  await test('photo uses vision model and preserves unknown macros',async()=>{
    nextResult={description:'Prueba',min:100,max:200,ingredients:[{name:'A',grams:100,protein:10}]};
    const response=await post('/photo',{image:'data:image/png;base64,iVBORw0KGgo='});
    assert.equal(response.status,200);assert.equal(response.data.ingredients[0].carbs,null);assert.match(calls.at(-1).url,/models\/gemini-4-hydrogen:generateContent$/);assert.equal(calls.at(-1).payload.contents[0].parts[1].inlineData.mimeType,'image/png');
  });
  await test('malformed ingredients fail cleanly rather than reaching UI',async()=>{
    nextResult={min:100,max:200,ingredients:{bad:true}};
    const response=await post('/photo',{image:'data:image/png;base64,iVBORw0KGgo='});assert.equal(response.status,502);assert.equal(response.data.code,'AI_PHOTO');
  });
  await test('machine and label use Gemini exclusively with bounded multimodal input',async()=>{
    for(const path of ['/machine','/label']){
      nextResult=path==='/machine'?{type:'Prensa',brand:'',model:'',evidence:'visible',operation:'',fit:'',muscles:'',uncertainty:'No certifica técnica'}:{brand:'',product:'',form:''};
      assert.equal((await post(path,{image:'data:image/png;base64,iVBORw0KGgo='})).status,200);
      assert.match(calls.at(-1).url,/gemini-4-hydrogen:generateContent$/);assert.equal(calls.at(-1).payload.generationConfig.thinkingConfig.thinkingLevel,'low');
    }
  });
  await test('Gemini rejects blocked, partial and malformed candidates with no fallback',async()=>{
    for(const envelope of [{},{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]},{candidates:[{finishReason:'STOP',content:{parts:{bad:true}}}]}]){
      geminiEnvelope=envelope;const count=calls.length;const r=await post('/photo',{image:'data:image/png;base64,iVBORw0KGgo='});assert.equal(r.status,502);assert.equal(calls.length,count+1);
    }
    geminiEnvelope=null;
    upstreamStatus=401;const r=await post('/photo',{image:'data:image/png;base64,iVBORw0KGgo='});upstreamStatus=200;assert.equal(r.status,503);assert.equal(r.data.code,'AI_CONFIG');assert.ok(!JSON.stringify(r.data).includes('private'));
  });
  await test('audio uses Whisper and validates text',async()=>{
    nextResult={text:' He dormido ocho horas '};
    const result=await post('/listen',{mime:'audio/webm',data:'AAAA'});assert.equal(result.status,200);assert.equal(result.data.text,'He dormido ocho horas');assert.equal(calls.at(-1).payload.audioModel,'whisper-large-v3-turbo');
    nextResult={text:null};assert.equal((await post('/listen',{mime:'audio/webm',data:'AAAA'})).status,502);
  });
  await test('429 retains Retry-After and returns reserved user quota',async()=>{
    const before=(await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n;
    upstreamStatus=429;const r=await post('/coach',{question:'Hola'});upstreamStatus=200;
    assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'7');assert.ok(!JSON.stringify(r.data).includes('private'));
    assert.equal((await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n,before);
  });
  await test('one simultaneous AI request per account',async()=>{
    nextResult={answer:'Test',entries:[]};delay=100;
    const responses=await Promise.all([post('/coach',{question:'Hola'}),post('/coach',{question:'Hola'})]);delay=0;
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,429]);
  });
  await test('invalid image rejected before calling upstream',async()=>{
    const count=calls.length;assert.equal((await post('/photo',{image:'https://private.invalid'})).status,400);assert.equal(calls.length,count);
  });
  await test('explicit deep uses Gemini, ordinary words never change routing',async()=>{
    nextResult={answer:'Test',entries:[]};let before=calls.length;
    assert.equal((await post('/coach',{question:'Hola',mode:'deep'})).status,200);
    assert.ok(calls.slice(before).every(call=>String(call.url).includes('gemini-4-argon:generateContent')));
    before=calls.length;assert.equal((await post('/coach',{question:'Quiero análisis profundo Gemini'})).status,200);
    assert.ok(calls.slice(before).every(call=>String(call.url).startsWith('https://api.groq.com/')));
    before=calls.length;assert.equal((await post('/coach',{question:'Hola',mode:'auto'})).status,400);assert.equal(calls.length,before);
  });
  await test('Gemini speech returns real validated WAV, no local voice and no saved interaction',async()=>{
    const wav=Buffer.alloc(48);wav.write('RIFF');wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4,40);
    nextResult={status:'completed',steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:wav.toString('base64')}]}]};
    const result=await post('/speak',{text:'Hola, prueba en español.'});assert.equal(result.status,200);assert.deepEqual(result.data,wav);assert.equal(result.headers.get('content-type'),'audio/wav');
    const payload=calls.at(-1).payload;assert.equal(payload.store,false);assert.equal(payload.model,'gemini-3.8-flash-lite-tts');assert.equal(payload.response_format.mime_type,'audio/wav');assert.equal(payload.input[0].content[0].text,'Hola, prueba en español.');assert.ok(!('previous_interaction_id' in payload));
    const quotaBefore=(await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n;
    nextResult.status='incomplete';assert.equal((await post('/speak',{text:'hola'})).data.code,'AI_AUDIO');
    nextResult.status='completed';nextResult.steps[0].content[0].data=Buffer.from('malformed').toString('base64');assert.equal((await post('/speak',{text:'hola'})).status,502);
    assert.equal((await rows('SELECT n FROM quota WHERE uid=?',user.id))[0].n,quotaBefore);
    nextResult.steps={bad:true};assert.equal((await post('/speak',{text:'hola'})).status,502);
    const count=calls.length;assert.equal((await post('/speak',{text:'x'.repeat(3501)})).status,400);assert.equal(calls.length,count);
  });
  await test('a missing vendor disables only its routes and never falls back',async()=>{
    nextResult={answer:'Test',entries:[]};delete process.env.GEMINI_API_KEY;
    const count=calls.length;assert.equal((await post('/coach',{question:'Hola',mode:'deep'})).status,503);assert.equal(calls.length,count);
    assert.equal((await post('/coach',{question:'Hola'})).status,200);
    process.env.GEMINI_API_KEY='synthetic-gemini-key';delete process.env.GROQ_API_KEY;
    assert.equal((await post('/coach',{question:'Hola'})).status,503);assert.equal((await post('/coach',{question:'Hola',mode:'deep'})).status,200);
    process.env.GROQ_API_KEY='synthetic-test-key';
  });
  await test('intro validates input, removes credentials and allows only declared profile fields',async()=>{
    assert.equal((await post('/intro',{})).status,400);
    nextResult={reply:'Hola',profile:{name:'Sintético',email:'discard',token:'discard',age:30}};
    const r=await post('/intro',{text:'Hola',password:'never-send',profile:{email:'never-send',goal:'fuerza'}});
    assert.equal(r.status,200);assert.equal(r.data.profile.name,'Sintético');assert.ok(!('email' in r.data.profile));assert.ok(!JSON.stringify(calls.at(-1).payload).includes('never-send'));
  });
  console.log(`AI HTTP AUDIT: ${passed} grupos superados; proveedor simulado, HTTP y SQLite reales.`);
} finally {
  globalThis.fetch=realFetch;
  await new Promise(resolve=>server.close(resolve));db.close();
  await rm(directory,{recursive:true,force:true,maxRetries:8,retryDelay:100}).catch(e=>{if(e.code!=='EBUSY')throw e;});
}
