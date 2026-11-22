import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../www');
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script);
const server=createServer(async(req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
 const filename=path.resolve(root,relative);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const content=await readFile(filename);res.setHeader('Content-Type',filename.endsWith('.html')?'text/html':filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'application/octet-stream');res.end(content);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const executablePath=process.env.VERA_CHROMIUM || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
let browser;
const passed=[];
try{
 browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(origin)||r.request().url().startsWith('data:')?r.continue():r.abort());
 await page.route(origin+'/session',r=>r.fulfill({json:{id:'alice',nick:'alice'}}));
 await page.route(origin+'/capabilities',r=>r.fulfill({status:404,json:{error:'old server fixture'}}));
 await page.addInitScript(origin=>{
  localStorage.setItem('vera.notice8','1');sessionStorage.veraToken='alice-token';sessionStorage.veraUser=origin+'/alice';
  localStorage.setItem('vera.v2.'+origin+'/alice',JSON.stringify({profile:{name:'Alice'},logs:[],turns:[],memory:[],plan:''}));
 },origin);
 await page.goto(origin);await page.waitForFunction(()=>validSession);
 for(const area of ['Hoy','Entrenamiento','Alimentación','Suplementación','Cardio','Sueño','Equipo','Progreso','Perfil','Plato','Máquinas','Chat']){
  await page.evaluate(area=>go(area),area);assert.equal(await page.evaluate(()=>tab),area);
  assert.ok(await page.locator('#view').innerText(),area);
 }
 passed.push('12 pantallas móviles renderizan sin errores');
 await page.evaluate(()=>go('Entrenamiento'));
 await page.locator('#setName13').fill('Prensa');await page.locator('#setKg13').fill('30');await page.locator('#loadMode13').selectOption('side');await page.locator('#setReps13').fill('10');await page.locator('#setRir13').fill('2');
 await page.getByRole('button',{name:'Guardar serie',exact:true}).click();
 assert.equal(await page.evaluate(()=>s.logs.at(-1).kg),60);assert.equal(await page.evaluate(()=>s.logs.at(-1).rir),2);
 assert.match(await page.locator('#notice').innerText(),/dispositivo/);
 passed.push('Serie con carga por lado, RIR y mensaje de persistencia local');
 await page.evaluate(()=>go('Sueño'));
 await page.getByRole('button',{name:'Guardar descanso',exact:true}).click();
 assert.equal(await page.evaluate(()=>s.logs.at(-1).kind),'Sueño');assert.equal(await page.evaluate(()=>s.logs.at(-1).sore),null);
 assert.equal(await page.evaluate(()=>s.logs.at(-1).minutes),480);
 passed.push('Sueño 8 horas sin exigir grupo muscular ni valoraciones');
 await page.evaluate(()=>go('Sueño'));await page.locator('#awake').fill('-30');
 const sleepCount=await page.evaluate(()=>s.logs.length);
 await page.evaluate(()=>sleepSave({preventDefault(){}}));
 assert.equal(await page.evaluate(()=>s.logs.length),sleepCount);assert.match(await page.locator('#notice').innerText(),/Comprueba/);
 passed.push('Rechaza minutos despierto negativos');
 await page.evaluate(()=>go('Hoy'));assert.match(await page.locator('#view').innerText(),/2 cambios guardados solo/);
 await page.evaluate(async()=>{VeraPrivacy6.set(true);go('Chat');await ask('Bebí 250 ml de agua');});
 assert.equal(await page.evaluate(()=>s.logs.filter(x=>x.kind==='Agua').length),0);
 assert.match(await page.locator('#notice').innerText(),/Actualiza el servidor V2.0/);
 await page.evaluate(()=>VeraPrivacy6.set(false));
 passed.push('Servidor anterior bloqueado; chat no genera respuesta ni registra localmente');
 await page.route(origin+'/capabilities',r=>r.fulfill({json:{apiVersion:'2.0',ai:{routingVersion:2,providers:['groq','gemini'],execution:'cloud-only',localInference:false,routes:Object.fromEntries(Object.entries({coach:'groq',coach_deep:'gemini',intro:'groq',photo:'gemini',machine:'gemini',label:'gemini',listen:'groq',speak:'gemini'}).map(([k,provider])=>[k,{provider,configured:true}]))}}}));
 const escaped=await page.evaluate(()=>VeraActions.markdown('<img src=x onerror=alert(1)> **hola** [x](javascript:alert(1))'));
 assert.ok(!escaped.includes('<img'));assert.ok(!escaped.includes('href="javascript'));
 passed.push('Salida de conversación escapa HTML y enlaces ejecutables');
 assert.equal(await page.evaluate(()=>VeraPrivacy6.allowed('cloud')),false);
 await page.evaluate(()=>VeraPrivacy6.set(true));assert.equal(await page.evaluate(()=>VeraPrivacy6.allowed('cloud')),true);
 await page.evaluate(()=>sessionStorage.veraUser='other/account');assert.equal(await page.evaluate(()=>VeraPrivacy6.allowed('cloud')),false);
 await page.evaluate(origin=>sessionStorage.veraUser=origin+'/alice',origin);
 passed.push('Consentimiento remoto aislado por cuenta');
 let pendingRoute;await page.route(origin+'/nickname',r=>{pendingRoute=r;});
 await page.evaluate(()=>{window.pendingResult=api('nickname',{nick:'new'}).then(()=> 'incorrectly accepted',e=>e.message);});
 while(!pendingRoute)await new Promise(r=>setTimeout(r,10));
 await page.evaluate(()=>{sessionStorage.veraUser='other/account';sessionStorage.veraToken='other-token';s=initial();validSession=true;});
 await pendingRoute.fulfill({status:401,json:{error:'expired'}});
 assert.match(await page.evaluate(()=>window.pendingResult),/sesión ha cambiado/);assert.equal(await page.evaluate(()=>validSession),true);
 assert.equal(await page.evaluate(()=>sessionStorage.veraToken),'other-token');
 passed.push('401 tardío no cierra ni contamina una cuenta diferente');
 let remoteRoute;await page.route(origin+'/coach',r=>{remoteRoute=r;});
 await page.evaluate(()=>{VeraPrivacy6.set(true);window.pendingResult=api('coach',{}).then(()=> 'incorrectly accepted',e=>e.message);});
 while(!remoteRoute)await new Promise(r=>setTimeout(r,10));
 await page.evaluate(()=>VeraPrivacy6.set(false));await remoteRoute.fulfill({json:{answer:'ignored'}});
 assert.match(await page.evaluate(()=>window.pendingResult),/revocado/);
 passed.push('Revocar consentimiento descarta respuesta IA en vuelo');
 const broken=await page.evaluate(()=>{
  const key=storageKey();localStorage.setItem(key,'{broken');s=loadVeraState(key);let threw=false;try{save();}catch{threw=true;}return {threw,raw:localStorage.getItem(key),message:stateReadError};
 });
 assert.equal(broken.threw,true);assert.equal(broken.raw,'{broken');assert.match(broken.message,/conserva intacto/);
 passed.push('Diario corrupto conservado intacto y escritura bloqueada');
 assert.equal(await page.evaluate(()=>{try{validateVeraState({profile:null,logs:[],turns:[]});return false;}catch{return true;}}),true);
 passed.push('Respaldo inválido rechazado antes de sustituir estado');
 await page.evaluate(()=>{blockedStateKey='';stateReadError='';s=initial();s.profile.name='Auditoría';s.logs=[{id:'demo',kind:'Entrenamiento',date:day(),exercise:'Prensa',reps:[10],kg:60,note:'10 rep. · 60 kg'}];save();go('Hoy');});
 const artifact=path.resolve(root,'../tests/audit-frontend-artifacts');await mkdir(artifact,{recursive:true});await page.screenshot({path:path.join(artifact,'home-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({fixture:'Browser tests with mocked session/API; no production requests',passed,consoleErrors:errors},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
