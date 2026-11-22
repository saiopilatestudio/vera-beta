import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtemp,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import vm from 'node:vm';
const tmp=await mkdtemp(join(tmpdir(),'vera-google-http23-')),port=23000+Math.floor(Math.random()*8000),host='http://127.0.0.1:'+port;
const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,VERA_DB:join(tmp,'test.sqlite'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',HOST:'127.0.0.1',PORT:String(port),GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',GOOGLE_REDIRECT_URI:'https://vera-beta.onrender.com/auth/google/callback'},stdio:'ignore'});
try{
 for(let i=0;i<100;i++){try{if((await fetch(host+'/capabilities')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const registration=await fetch(host+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'http23@example.test',password:'correct-test-password23',adult:true,notice:'beta-3'})});assert.equal(registration.status,200);const account=await registration.json();
 const context=vm.createContext({console,fetch,URL,AbortSignal,queueMicrotask,setTimeout,clearTimeout,setInterval,clearInterval,ACCOUNT_HOST:host,validSession:true,sessionStorage:{veraUser:account.id,veraToken:account.token},document:{hidden:false,addEventListener(){}},window:{},render(){},msg(){},btn:(label,action)=>'<button data-action="'+action+'">'+label+'</button>',safe:x=>x});
 vm.runInContext(await readFile(new URL('../www/google23.js',import.meta.url),'utf8'),context);
 const start=await vm.runInContext("googleRequest23('/google/start','POST')",context);assert.equal(new URL(start.url).hostname,'accounts.google.com');
 const status=await vm.runInContext("googleRequest23('/google/status')",context);assert.equal(status.configured,true);assert.equal(status.linked,false);
 const post=path=>fetch(host+path,{method:'POST',headers:{Authorization:'Bearer '+account.token,'Content-Type':'application/json'},body:'{}'});
 assert.equal((await post('/session')).status,200);const blocked=await post('/coach');assert.equal(blocked.status,403);assert.equal((await blocked.json()).code,'GOOGLE_REQUIRED');
 assert.equal((await fetch(host+'/google/status')).status,401);
 const bad=await fetch(host+'/auth/google/callback?state=wrong&error=denied');assert.equal(bad.status,400);assert.match(bad.headers.get('content-security-policy'),/default-src 'none'/);
 // A response for the previous session must schedule rendering of the current account.
 let resolveOld,rendered=0;context.fetch=()=>new Promise(r=>resolveOld=r);context.render=()=>rendered++;
 const pending=vm.runInContext('refreshGoogle23()',context);context.sessionStorage={veraUser:'next',veraToken:'next-token'};resolveOld({ok:true,json:async()=>({configured:true,linked:true})});await pending;assert.equal(rendered,1);assert.equal(vm.runInContext('googleState23',context),null);
 // Every blocking panel offers a way to change account.
 assert.match(vm.runInContext('googleGate23()',context),/Cambiar de cuenta/);
 console.log('PASS Google HTTP/frontend: actual POST JSON body, authenticated status/start, safe callback error, stale-account refresh, exit from gates.');
}finally{child.kill();await new Promise(r=>child.once('exit',r));await rm(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
