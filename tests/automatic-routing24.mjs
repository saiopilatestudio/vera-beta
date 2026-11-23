import assert from 'node:assert/strict';
import {createAutomaticRouter24,aiConfiguration} from '../ai-provider.mjs';
const env={GEMINI_API_KEY:'test-gemini',GROQ_API_KEY:'test-groq',VERA_CF_WORKER_URL:'https://vera-ai.test.workers.dev',VERA_CF_WORKER_SECRET:'test-cf-secret'.repeat(3)};
const image=[{type:'image_url',image_url:{url:'data:image/png;base64,aGVsbG8='}}];
const good=host=>Response.json(host.includes('google')?{candidates:[{finishReason:'STOP',content:{parts:[{text:'{"ok":true}'}]}}]}:host.includes('groq')?{choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]}:{text:'{"ok":true}'});
async function run(feature,consent,statuses,expected){let calls=[];const router=createAutomaticRouter24({env,fetchImpl:async(url,options)=>{calls.push(url);assert(options.signal);return statuses.length?new Response('',{status:statuses.shift()}):good(url);}});try{assert.deepEqual(await router('JSON','text',true,{feature:feature==='weekly'?'coach':feature,routingTask:feature==='weekly'?'weekly':undefined,cloudFallbackConsent:consent}),{ok:true});}catch(e){assert(['AI_RATE_LIMIT','AI_CONFIG'].includes(e.code),e.message);}assert.equal(calls.length,expected);return calls;}
assert((await run('photo',false,[429],2))[1].includes('groq'));
await run('label',false,[429],1);
await run('weekly',false,[429],1);
assert((await run('label',true,[503,429],3))[2].includes('workers.dev'));
assert((await run('weekly',true,[503],2))[1].includes('google'));
await run('label','true',[429],1); // never coerce strings into consent
let calls=0;const router=createAutomaticRouter24({env,fetchImpl:async()=>{calls++;return new Response('',{status:429,headers:{'retry-after':'20'}});}});
await assert.rejects(router('s',image,true,{feature:'photo',cloudFallbackConsent:true}),{code:'AI_RATE_LIMIT'});
await assert.rejects(router('s',image,true,{feature:'photo',cloudFallbackConsent:true}),{code:'AI_RATE_LIMIT'});assert.equal(calls,3);
for(const data of [{candidates:[{finishReason:'SAFETY'}]},{candidates:[{finishReason:'STOP',content:{parts:[{text:'bad json'}]}}]}]){let n=0;const r=createAutomaticRouter24({env,fetchImpl:async()=>{n++;return Response.json(data);}});await assert.rejects(r('s',image,true,{feature:'photo',cloudFallbackConsent:true}));assert.equal(n,1);}
let n=0;const unconfigured=createAutomaticRouter24({env:{GROQ_API_KEY:'key'},fetchImpl:async(url)=>{n++;return good(url);}});await unconfigured('s',image,true,{feature:'photo'});assert.equal(n,1);
await assert.rejects(unconfigured('s',image,true,{feature:'label'}),{code:'AI_NOT_CONFIGURED'});
assert(!JSON.stringify(aiConfiguration(env)).includes('test-cf'));
console.log('Automatic routing: consent, saturation, cooldown, malformed/safety stop and missing primary passed');
for(const status of [401,503,500])assert((await run('photo',false,[status],2))[1].includes('groq'));
let attempts=0;const network=createAutomaticRouter24({env,fetchImpl:async(url)=>{attempts++;if(attempts===1)throw Error('private network detail');return good(url);}});assert.deepEqual(await network('s',image,true,{feature:'photo'}),{ok:true});assert.equal(attempts,2);
let expiredCalls=0;const expired=createAutomaticRouter24({env,fetchImpl:async()=>{expiredCalls++;}});await assert.rejects(expired('s',image,true,{feature:'photo',deadline:Date.now()-1}),{code:'AI_TIMEOUT'});assert.equal(expiredCalls,0);
const unsafeEnv={...env,VERA_CF_WORKER_URL:'http://127.0.0.1/private'};assert.equal(aiConfiguration(unsafeEnv).routes.photo.alternatives.at(-1).configured,false);
const invalidParts=createAutomaticRouter24({env,fetchImpl:async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:{bad:true}}}]})});await assert.rejects(invalidParts('s',image,true,{feature:'photo',cloudFallbackConsent:true}),{code:'AI_FORMAT'});
console.log('Availability/network/deadline and Worker endpoint validation passed');
// Weekly candidate validation runs before a provider is accepted, not after the chain ends.
for(const consent of [false,true]){
 let count=0;const chain=createAutomaticRouter24({env,fetchImpl:async(url)=>{count++;const result=count===1?{days:4}:{days:3};return Response.json(url.includes('groq')?{choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}:{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]});}});
 const options={feature:'coach',routingTask:'weekly',cloudFallbackConsent:consent,validateCandidate:r=>{if(r.days>3)throw Object.assign(Error('Too many days'),{code:'WORKOUT_FORMAT',status:502});}};
 if(consent)assert.equal((await chain('s','u',true,options)).days,3);else await assert.rejects(chain('s','u',true,options),{code:'WORKOUT_FORMAT'});
 assert.equal(count,consent?2:1);
}
let reviews=0;const review=createAutomaticRouter24({env,fetchImpl:async()=>{reviews++;return Response.json({choices:[{finish_reason:'stop',message:{content:'{"status":"needs_review"}'}}]});}});
assert.equal((await review('s','u',true,{routingTask:'weekly',cloudFallbackConsent:true,validateCandidate:r=>assert.equal(r.status,'needs_review')})).status,'needs_review');assert.equal(reviews,1);
let safetyCalls=0;const safety=createAutomaticRouter24({env,fetchImpl:async()=>{safetyCalls++;return Response.json({choices:[{finish_reason:'content_filter'}]});}});
await assert.rejects(safety('s','u',true,{routingTask:'weekly',cloudFallbackConsent:true,validateCandidate:()=>{throw Error('must not run');}}),{code:'AI_INCOMPLETE'});assert.equal(safetyCalls,1);
console.log('Weekly candidate validation: authorized failover, legacy isolation, needs_review accepted and safety stop passed');
