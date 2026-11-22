import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProvider, createGeminiProvider, aiConfiguration, requireRoute, validateWav, speechText } from '../ai-provider.mjs';
import { readObject, validateImage, validateAudio, coachInput, validateCoachResult, validatePhotoResult, validateTranscript, cleanContext } from '../request-safety.mjs';

test('Groq selection sends credentials only to fixed Groq endpoint', async () => {
  let calls = 0;
  const request = createProvider({ env: { AI_PROVIDER:'groq', GROQ_API_KEY:'fixture-not-a-secret' }, fetchImpl: async (url,opts) => {
    calls++; assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(opts.headers.Authorization,'Bearer fixture-not-a-secret');
    assert.equal(opts.redirect,'error'); return Response.json({ok:true});
  }});
  assert.deepEqual(await request('chat/completions',{}),{ok:true}); assert.equal(calls,1);
});
test('capabilities are explicit per route, keys private and providers fixed', () => {
  const cfg=aiConfiguration({GROQ_API_KEY:'private',OPENAI_API_KEY:'ignored'});
  assert.deepEqual(cfg.providers,['groq','gemini']);assert.equal(cfg.routingVersion,2);
  assert.equal(cfg.routes.coach.model,'openai/gpt-oss-120b');assert.equal(cfg.routes.coach.configured,true);
  assert.equal(cfg.routes.photo.provider,'gemini');assert.equal(cfg.routes.photo.configured,false);
  assert.equal(cfg.routes.coach_deep.model,'gemini-4-hydrogen');assert.equal(cfg.routes.speak.model,'gemini-3.8-flash-lite-tts');
  assert.equal(cfg.localInference,false);assert.equal(cfg.execution,'cloud-only');assert.equal(cfg.verification,'configuration-only');assert.ok(!JSON.stringify(cfg).includes('private'));
});
test('missing route key never substitutes another configured vendor', async () => {
  assert.throws(()=>requireRoute('photo',{GROQ_API_KEY:'only'}),{status:503,code:'AI_NOT_CONFIGURED'});
  assert.throws(()=>requireRoute('coach',{GEMINI_API_KEY:'only',OPENAI_API_KEY:'legacy'}),{status:503,code:'AI_NOT_CONFIGURED'});
  const request=createProvider({env:{OPENAI_API_KEY:'legacy'},fetchImpl:()=>assert.fail('network')});
  await assert.rejects(request('chat/completions',{}),{status:503,code:'AI_NOT_CONFIGURED'});
  await assert.rejects(request('audio/speech',{}),{code:'AI_PATH'});
});
test('Gemini uses fixed endpoint/header and forces nonpersistent TTS',async()=>{
  const request=createGeminiProvider({env:{GEMINI_API_KEY:'gemini-test'},fetchImpl:async(url,opts)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/interactions');assert.equal(opts.headers['x-goog-api-key'],'gemini-test');assert.equal(opts.headers.Authorization,undefined);assert.equal(JSON.parse(opts.body).store,false);assert.equal(opts.redirect,'error');return Response.json({ok:true});
  }});assert.deepEqual(await request('speak',{store:true}),{ok:true});
});
test('bounded upstream body rejects declared and streamed oversized responses',async()=>{
  for(const headers of [{},{'content-length':'1000001'}]){
    const request=createProvider({env:{GROQ_API_KEY:'test'},fetchImpl:async()=>new Response('x'.repeat(1000001),{headers})});
    await assert.rejects(request('chat/completions',{}),{code:'AI_FORMAT'});
  }
});
test('mode and speech input have strict bounds',()=>{
  assert.equal(coachInput({question:'hola'}).mode,'standard');assert.equal(coachInput({question:'hola',mode:'deep'}).mode,'deep');
  for(const mode of ['gemini','auto',{},true])assert.throws(()=>coachInput({question:'hola',mode}),{code:'INVALID_MODE'});
  for(const text of ['',null,'x'.repeat(3501)])assert.throws(()=>speechText(text),{code:'INVALID_SPEECH'});
  assert.throws(()=>validateWav(Buffer.from('not audio')),{code:'AI_AUDIO'});
});
test('429 preserves retry-after without exposing upstream data or automatically repeating paid request', async () => {
  let calls=0;
  const request = createProvider({env:{AI_PROVIDER:'groq',GROQ_API_KEY:'fixture'},fetchImpl:async()=>{calls++;return new Response('private submitted data',{status:429,headers:{'retry-after':'12'}});}});
  await assert.rejects(request('chat/completions',{}),e=>e.status===429&&e.retryAfter===12&&!e.message.includes('private'));
  assert.equal(calls,1);
});
test('temporary service saturation retries exactly once and retains the fixed provider', async () => {
  let calls=0;
  const request=createGeminiProvider({env:{GEMINI_API_KEY:'test'},fetchImpl:async(url)=>{
    assert.match(url,/generativelanguage.googleapis.com\/v1beta\/models\/gemini-4-hydrogen:generateContent$/);
    calls++;return calls===1?new Response('private',{status:503}):Response.json({ok:true});
  }});
  assert.deepEqual(await request('photo',{}),{ok:true});assert.equal(calls,2);
  calls=0;
  const busy=createGeminiProvider({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>{calls++;return new Response('private',{status:503});}});
  await assert.rejects(busy('photo',{}),{status:503,code:'AI_BUSY'});assert.equal(calls,2);
});
test('saturation cannot extend the deadline or retry quota failures',async()=>{
  let calls=0;
  const request=createGeminiProvider({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>{calls++;return new Response('',{status:503});}});
  await assert.rejects(request('photo',{}, {deadline:Date.now()+500}),{code:'AI_BUSY'});assert.equal(calls,1);
});
test('timeout and malformed upstream JSON produce actionable errors', async () => {
  const env={GROQ_API_KEY:'fixture',AI_PROVIDER:'groq'};
  await assert.rejects(createProvider({env,fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError');}})('chat/completions',{}),{status:504});
  await assert.rejects(createProvider({env,fetchImpl:async()=>new Response('invalid json')})('chat/completions',{}),{code:'AI_FORMAT'});
});
test('JSON boundary rejects null, arrays and malformed data', () => {
  for(const body of ['null','[]','true','{']) assert.throws(()=>readObject(body),e=>e.status===400);
  assert.deepEqual(readObject('{"question":"hola"}'),{question:'hola'});
});
test('image and audio validation rejects remote URLs and mismatched payloads', () => {
  for(const data of ['https://127.0.0.1/admin','data:image/jpeg;base64,aGVsbG8=','data:image/svg+xml;base64,AAAA']) assert.throws(()=>validateImage(data));
  validateImage('data:image/png;base64,iVBORw0KGgo='); // signature-only fixture; decoding is provider responsibility
  assert.throws(()=>validateAudio({data:'AAAA',mime:'text/html'}));
  validateAudio({data:'AAAA',mime:'audio/webm;codecs=opus'});
});
test('AI context strips credentials and arbitrary envelope fields, preserves useful domain data', () => {
  const context=coachInput({question:'hola',uid:'other',password:'private',profile:{email:'private',goal:'fuerza'},history:[{question:'previa',answer:'x'}],machines:[{model:'A'}]});
  assert.ok(!JSON.stringify(context).includes('private')); assert.ok(!context.uid); assert.equal(context.machines[0].model,'A');
  assert.throws(()=>coachInput({question:' '}));
});
test('malformed AI entries and plan cannot reach UI as trusted results', () => {
  assert.throws(()=>validateCoachResult({answer:'ok',plan:{}}));
  assert.throws(()=>validateCoachResult({answer:'ok',entries:[{kind:'Agua',date:'2026-11-22',value:-1}]}));
  assert.deepEqual(validateCoachResult({answer:'ok'}),{answer:'ok',plan:'',memory:'',entries:[]});
});
test('peer review: real calendar, known kinds, sleep bounds and clean candidate DTO', () => {
  for (const entry of [{kind:'Agua',date:'2026-02-31',value:1},{kind:'Sueño',date:'2099-01-01',value:500},{kind:'Inventado',date:'2026-01-01',value:1}]) assert.throws(()=>validateCoachResult({answer:'ok',entries:[entry]}));
  assert.throws(()=>validateCoachResult(null),{code:'AI_FORMAT'});
  const result=validateCoachResult({answer:'ok',entries:[{kind:'Entrenamiento',date:'2026-01-01',value:null,reps:{bad:true},saved:true,id:'foreign'}]});
  assert.deepEqual(result.entries[0],{kind:'Entrenamiento',date:'2026-01-01',value:null,note:''});
});
test('peer review: malformed photo ingredients cannot enter nutrition totals', () => {
  const result={min:100,max:200,ingredients:[{name:'Alimento',grams:100,protein:10,carbs:null,fat:5}]};
  assert.equal(validatePhotoResult(result).ingredients[0].carbs,null);
  for (const ingredients of [{},[{name:'A',grams:0}],[{name:'A',grams:100,protein:-1}],[{name:'A',grams:100,protein:80,carbs:80,fat:20}]]) assert.throws(()=>validatePhotoResult({...result,ingredients}),{code:'AI_PHOTO'});
});
test('peer review: transcription must contain real nonempty text', () => {
  for(const value of [null,{}, {text:''},{text:12}]) assert.throws(()=>validateTranscript(value),{code:'AI_TRANSCRIPT'});
  assert.deepEqual(validateTranscript({text:'  hola  ',extra:'ignored'}),{text:'hola'});
});
test('peer review: stored context is sanitized and request deadline shared', async () => {
  assert.deepEqual(cleanContext({id:'x',token:'private',nested:{password:'private',note:'serie'}}),{id:'x',nested:{note:'serie'}});
  const request=createProvider({env:{AI_PROVIDER:'groq',GROQ_API_KEY:'fixture'},fetchImpl:()=>assert.fail('expired deadline must not call provider')});
  await assert.rejects(request('chat/completions',{},false,{deadline:Date.now()-1}),{status:504});
});
import {readFile} from 'node:fs/promises';
test('backend source keeps Spanish UTF-8 without mojibake markers',async()=>{
  for(const file of ['ai-provider.mjs','server.mjs','request-safety.mjs','business.mjs','admin.html']){
    const bytes=await readFile(new URL('../'+file,import.meta.url));
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    assert.ok(!/[\u00c3\u00c2]/.test(text),file+' contains encoding corruption');
  }
});
