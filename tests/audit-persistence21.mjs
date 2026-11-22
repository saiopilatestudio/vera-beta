import './test-env.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
process.env.VERA_DB=mkdtempSync(tmpdir()+'/vera-v21-persistence-')+'/db';
const {profileSync}=await import('../profile-sync.mjs');
const {journal}=await import('../journal.mjs');
const {nickname}=await import('../accounts.mjs');
const {db}=await import('../storage.mjs');
let response=await profileSync('alice',{updates:[{field:'profile.name',rev:0,value:'Ana'},{field:'profile.weight',rev:0,value:'64'}]});
assert.equal(response.accepted.length,2);
assert.equal((await profileSync('alice',{updates:[{field:'profile.weight',rev:0,value:'64'}]})).accepted[0].rev,1);
assert.equal((await profileSync('alice',{updates:[{field:'profile.weight',rev:0,value:'65'}]})).conflicts[0].value,'64');
assert.equal((await profileSync('bob')).fields.length,0);
await assert.rejects(profileSync('alice',{updates:[{field:'profile.password',rev:0,value:'private'}]}));
await assert.rejects(profileSync('alice',{updates:[{field:'weeklyPlan21',rev:0,value:{token:'private'}}]}));
await assert.rejects(profileSync('alice',{updates:[{field:'plan',rev:0,value:'safe'},{field:'plan',rev:0,value:'duplicate'}]}));
assert.ok(!(await profileSync('alice')).fields.some(r=>r.field==='plan'));
const health={id:'health_steps_2026-11-22',healthKey:'health_steps_2026-11-22',healthType:'steps',source:'health',kind:'Pasos',date:'2026-11-22',value:5000};
assert.equal((await journal('healthtest',{updates:[{id:health.id,rev:0,record:health}]})).accepted[0].rev,1);
assert.equal((await journal('healthtest',{updates:[{id:health.id,rev:0,record:health}]})).accepted[0].rev,1);
await assert.rejects(journal('healthtest',{updates:[{id:health.id,rev:1,record:{...health,healthKey:'other'}}]}));
await assert.rejects(journal('healthtest',{updates:[{id:health.id,rev:1,record:{...health,healthType:'weight'}}]}));
assert.equal((await journal('healthtest')).records.length,1);

const www=new URL('../www/',import.meta.url),html=readFileSync(new URL('index.html',www),'utf8'),map=new Map([['vera.notice8','1']]);
const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},dataset:{},isConnected:true,querySelectorAll:()=>[],setAttribute(){}});return nodes.get(id);}
const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener(){},hidden:false};
for(const id of ['topTools','nav','view','notice'])node(id);
const ctx=vm.createContext({console,document,localStorage:storage,sessionStorage:{veraUser:'https://test/client',veraToken:'token-client'},window:{VeraNative:{},setInterval(){}},location:{origin:'https://test',hostname:'test',reload(){}},crypto:{randomUUID},setTimeout:()=>0,clearTimeout(){},setInterval(){},scrollTo(){},Date,URL,Blob,AbortSignal,AbortController,TextEncoder,confirm:()=>true,fetch:()=>{throw Error('Unexpected network access');}});
const run=code=>vm.runInContext(code,ctx);
for(const file of ['state14.js','session13.js','edition12.js','vision11.js','vera5.js','partners.js','edition10.js','list7.js','catalog6.js','journal.js','privacy6.js','actions6.js'])run(readFileSync(new URL(file,www),'utf8'));
for(const [,inline] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))run(inline);
run('validSession=true');
const clone=value=>JSON.parse(JSON.stringify(value));
let networkError=false,hook=null;
ctx.api=async(path,data)=>{
 const uid=ctx.sessionStorage.veraUser.split('/').at(-1);
 if(networkError)throw Error('Sin conexión');
 if(hook)await hook(path);
 if(path==='diario')return journal(uid,clone(data));
 if(path==='profile-sync')return profileSync(uid,clone(data));
 if(path==='logout')return {};
 throw Error('Unexpected route '+path);
};
await nickname('client','ana_cliente');
run("s=initial();s.profile={name:'Cliente',weight:'70'};s.logs=[{id:'meal_one',kind:'Comida',date:day(),value:500,protein:30,carbs:50,fat:15,nutrients:{fiber_g:8,iron_mg:2}},{id:'weight_one',kind:'Peso en ayunas',date:day(),value:70}];s.weeklyPlan21={week:day(),summary:'Semana',changes:'Inicial',reports:[{role:'Entrenamiento',text:'Revisión'}],days:Array.from({length:7},(_,i)=>({date:new Date(+new Date(day()+'T00:00:00Z')+i*86400000).toISOString().slice(0,10),training:'Descanso',nutrition:'Registrar',recovery:'Dormir',done:{training:true}}))};save()");
assert.equal(await run('VeraJournal.sync({quiet:true})'),true);
assert.equal(run('VeraJournal.pending()'),0);
assert.equal(run('s.profile.nick'),'ana_cliente');
assert.equal((await journal('client')).records.length,2);
assert.equal((await profileSync('client')).fields.find(r=>r.field==='weeklyPlan21').value.days[0].done.training,true);
await assert.rejects(profileSync('client',{updates:[{field:'weeklyPlan21',rev:1,value:{week:'2026-11-22',days:null,reports:'malformed'}}]}));
assert.throws(()=>run("validateWeeklyPlanState21({week:day(),summary:'x',changes:'x',reports:[],days:[]})"),/plan semanal/);
assert.throws(()=>run("validateVeraState({...initial(),weeklyPlan21:{reports:{}}})"),/plan semanal/);
// Closing and reopening the same account preserves local data and cloud copies.
run('s=loadVeraState(storageKey())');assert.equal(run('s.logs.length'),2);assert.equal(run('s.profile.weight'),'70');
// A fresh device restores fields and logs rather than uploading empty defaults.
run('s=initial()');await run('VeraJournal.sync({quiet:true})');
assert.equal(run('s.logs.length'),2);assert.equal(run('s.profile.name'),'Cliente');assert.equal(run('s.profile.nick'),'ana_cliente');assert.equal(run('s.weeklyPlan21.days[0].done.training'),true);
// An edit during transport remains pending instead of being marked uploaded.
let entered,release;const held=new Promise(resolve=>{release=resolve;});
hook=async path=>{if(path==='diario'){hook=null;entered=true;await held;}};
run("s.logs[0].protein=31;save()");const inFlight=run('VeraJournal.sync({quiet:true})');
while(!entered)await Promise.resolve();run('s.logs[0].protein=42;save()');release();await inFlight;
assert.equal(run('s.logs[0].protein'),42);assert.ok(run('VeraJournal.pending()')>0);
await run('VeraJournal.sync({quiet:true})');assert.equal((await journal('client')).records.find(r=>r.id==='meal_one').record.protein,42);
// Offline writes survive logout/reload and are sent by a later retry.
networkError=true;run("s.profile.weight='71';s.logs[1].value=71;save()");assert.equal(await run('VeraJournal.sync({quiet:true})'),false);
run('s=loadVeraState(storageKey())');assert.equal(run('s.profile.weight'),'71');networkError=false;await run('VeraJournal.sync({quiet:true})');assert.equal(run('VeraJournal.pending()'),0);
// The old session cannot apply a response after an account change.
entered=false;let releaseOld;const oldHeld=new Promise(resolve=>{releaseOld=resolve;});hook=async path=>{if(path==='diario'){hook=null;entered=true;await oldHeld;}};
const oldTask=run('VeraJournal.sync({quiet:true})');while(!entered)await Promise.resolve();
run("sessionStorage.veraUser='https://test/second';sessionStorage.veraToken='token-second';s=initial();s.profile.name='Segunda'");releaseOld();await oldTask;
assert.equal(run('s.logs.length'),0);assert.equal(run('s.profile.name'),'Segunda');assert.equal((await journal('second')).records.length,0);
// Concurrent remote changes retain both versions until the user chooses.
run("sessionStorage.veraUser='https://test/client';sessionStorage.veraToken='token-client';s=loadVeraState(storageKey());s.profile.weight='72';save()");
const profile=(await profileSync('client')).fields.find(r=>r.field==='profile.weight');
await profileSync('client',{updates:[{field:profile.field,rev:profile.rev,value:'73'}]});await run('VeraJournal.sync({quiet:true})');
assert.equal(run('s.profile.weight'),'72');assert.equal(run('s.syncConflicts21[0].remote'),'73');
run('VeraJournal.resolve(0,true)');await run('VeraJournal.sync({quiet:true})');assert.equal(run('s.profile.weight'),'73');assert.equal(run('VeraJournal.pending()'),0);
run(readFileSync(new URL('metrics21.js',www),'utf8'));
run("s.logs=[{id:'manual_meal',kind:'Comida',date:day(),value:800,protein:50,nutrients:{fiber_g:10}},{id:'health_nutrition_meal',healthKey:'health_nutrition_meal',healthType:'nutrition',source:'health',kind:'Comida',date:day(),value:1200,protein:70,nutrients:{fiber_g:20}}]");
const coachPayload=run("buildCoachPayload14('Revisa mi nutrición')");
assert.equal(coachPayload.nutritionSummary21.nutrition.kcal.average,1000);
assert.equal(coachPayload.nutritionSummary21.nutrition.fiber_g.average,15);
assert.equal(coachPayload.nutritionSummary21.daily,undefined);
assert.equal(coachPayload.logs[1].healthType,'nutrition');assert.equal(coachPayload.logs[1].nutrients.fiber_g,20);
assert.ok(Buffer.byteLength(JSON.stringify(coachPayload))<90000);
db.close();
console.log('PASS · perfil por campo, nickname, diario/micros, plan, reentrada, dispositivo nuevo, offline, edición en vuelo, aislamiento y conflictos.');
