import './test-env.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:mkdtempSync(tmpdir()+'/vera-contract23-')+'/db',GROQ_API_KEY:'synthetic',GEMINI_API_KEY:'synthetic',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:''});
const {server}=await import('../server.mjs');
const {db}=await import('../storage.mjs');
if(!server.listening)await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
try{
 const live=await (await fetch(base+'/capabilities')).json();
 assert.equal(live.ai.routingVersion,2,'Installed APK expects protocol version 2 on unversioned GET');
 const modern=await (await fetch(base+'/capabilities',{headers:{Accept:'application/vnd.vera.routing-v3+json, application/json'}})).json();
 assert.equal(modern.ai.routingVersion,3);
 let config=live;
 const ctx=vm.createContext({sessionStorage:{veraToken:'test',veraUser:'test'},ACCOUNT_HOST:base,AbortSignal,fetch:async()=>({ok:true,json:async()=>config})});
 vm.runInContext(readFileSync(new URL('../www/privacy6.js',import.meta.url),'utf8')+";VeraPrivacy6.allowed=()=>true;",ctx);
 for(const route of ['coach','diary-import','weekly-plan','photo','machine','label','listen','speak'])await vm.runInContext(`VeraPrivacy6.ensureRemote('${route}')`,ctx);
 await vm.runInContext("VeraPrivacy6.ensureRemote('coach',{mode:'deep'})",ctx);
 config=modern;for(const route of ['photo','workouts/weekly','weekly-plan'])await vm.runInContext(`VeraPrivacy6.ensureRemote('${route}')`,ctx);
 for(const apiVersion of ['2.2','2.3','2.15.1']){config={...live,apiVersion};await vm.runInContext("VeraPrivacy6.ensureRemote('weekly-plan')",ctx);}
 for(const configBad of [{...live,apiVersion:'3.0'},{...live,features:{...live.features,weeklyTeam:false}},{...live,ai:{...live.ai,localInference:true}},{...live,ai:{...live.ai,providers:['groq','other']}}]){config=configBad;await assert.rejects(vm.runInContext("VeraPrivacy6.ensureRemote('weekly-plan')",ctx),/no está disponible/);}
 const logo=await fetch(base+'/brand22.svg');assert.equal(logo.status,200);assert.match(logo.headers.get('content-type'),/^image\/svg\+xml/);assert.equal(logo.headers.get('x-content-type-options'),'nosniff');assert.match(await logo.text(),/<svg/);
 assert.equal((await fetch(base+'/google/status')).status,401);
 assert.equal((await fetch(base+'/google/start',{method:'POST',body:'{}'})).status,401);
 const callback=await fetch(base+'/auth/google/callback?state=invalid');assert.equal(callback.status,400);assert.match(await callback.text(),/No se ha completado/);
 console.log('PASS actual server capabilities with frontend, compatible minor versions, restrictive routes, native web logo MIME, Google routes authentication');
}finally{await new Promise(r=>server.close(r));db.close();}
