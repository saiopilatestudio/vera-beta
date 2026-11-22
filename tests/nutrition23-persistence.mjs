import './test-env.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'vera-nutrition23-'));process.env.VERA_DB=join(directory,'data.sqlite');
const {journal}=await import('../journal.mjs');const {profileSync}=await import('../profile-sync.mjs');const {db}=await import('../storage.mjs');
const www=new URL('../www/',import.meta.url);
let harness=readFileSync(new URL('audit-frontend-unit.mjs',import.meta.url),'utf8').split('const results=[];')[0];
harness=harness.replace("new URL('../www/',import.meta.url)",`new URL(${JSON.stringify(www.href)})`)+ '\nexport {run,node,ctx};';
const {run,node,ctx}=await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
for(const name of ['nutrition22','sleep23'])run(readFileSync(new URL(name+'.js',www),'utf8'));
ctx.backend=async(route,payload)=>route==='diario'?journal('nutrition23-user',JSON.parse(JSON.stringify(payload))):route==='profile-sync'?profileSync('nutrition23-user',JSON.parse(JSON.stringify(payload))):Promise.reject(Error('Unexpected '+route));
run('api=(route,payload)=>backend(route,payload);s=initial();s.profile.name="Prueba";s.need=9;s.profile.waterGoalMl=2300;validSession=true');
const sync=async()=>assert.equal(await run('VeraJournal.sync({quiet:true})'),true,node('notice').textContent);
const values=data=>{for(const [id,value]of Object.entries(data))node(id).value=String(value);};
const labels=run('nutritionLabels22');for(const [key]of labels){node('supFact22_'+key).value='';node('mixFact23_'+key).value='';}
values({supProduct:'Etiqueta de prueba',supAmount:30,supUnit:'g',supDate22:'2026-11-20',mixType23:'Leche',mixMl23:250,mixName23:'Leche del envase',supFact22_kcal:110,supFact22_protein:21.4,mixFact23_kcal:46,mixFact23_protein:3.2,mixFact23_calcium_mg:120});
run('saveSupplement(zumubProducts22[0])');await sync();
let remote=await journal('nutrition23-user',{});assert.equal(remote.records.length,1);assert.equal(remote.records[0].record.mixingLiquid.ml,250);assert.equal(remote.records[0].record.mixingLiquid.source,'Etiqueta introducida por el usuario');
const id=remote.records[0].id;
run('s=initial()');await sync();assert.equal(run('s.need'),9,'sleep goal restored from real profile backend');assert.equal(run('s.profile.waterGoalMl'),2300);
assert.equal(run("metricsSummary21(s.logs,7,'2026-11-22').nutrition.kcal.total"),225);
assert.equal(run("waterSummary22(s.logs,'2026-11-20','2026-11-22',2300).total"),250);
// Edit from restored state, no duplicate record or mixing calorie added to powder.
values({mixMl23:100});run('beginSupplementEdit23(0);saveSupplement(zumubProducts22[0],0)');await sync();remote=await journal('nutrition23-user',{});assert.equal(remote.records.length,1);assert.equal(remote.records[0].id,id);assert.equal(remote.records[0].record.kcal,110);assert.equal(remote.records[0].record.mixingLiquid.ml,100);
values({mixType23:'Sin líquido'});run('beginSupplementEdit23(0);saveSupplement(zumubProducts22[0],0)');await sync();assert.equal((await journal('nutrition23-user',{})).records[0].record.mixingLiquid,undefined,'removing mix passes real validator');
// Add manual overnight sleep using its real save handler.
values({start:'2026-11-19T23:00',end:'2026-11-20T07:00',awake:30,restType:'Noche',muscle:'',sore:'',tired:''});run('sleepSave({preventDefault(){}})');await sync();
assert.equal(run('s.logs.find(r=>r.kind==="Sueño").minutes'),450);
run('editSleep23(s.logs.findIndex(r=>r.kind==="Sueño"))');values({awake:60});run('sleepSave({preventDefault(){}})');await sync();
const date='2026-11-20',start=+new Date('2026-11-19T23:00'),end=+new Date('2026-11-20T07:00');
ctx.healthRows=[{date,start,end,awake:[[start,start+1800000]]}];run("s.logs.push(...normalizeHealth21('sleep',healthRows));save()");await sync();
remote=await journal('nutrition23-user',{});const imported=remote.records.find(r=>r.record?.source==='health').record;assert.ok(imported.sleepSpans.length);assert.equal(imported.sleepSpans[0][0],start+1800000);
run('s=initial()');await sync();assert.equal(run("sleepSummary23(s.logs,'2026-11-20').hours"),7,'manual sleep correction survives reload without imported duplicate');assert.equal(run('s.need'),9);
assert.ok(run('sleepPage()').includes('9 h'),'sleep screen uses saved profile goal');
run('s.logs=s.logs.filter(r=>r.kind!=="Suplemento");save()');await sync();
assert.equal((await journal('nutrition23-user',{})).records.find(r=>r.id===id).record,null,'server deletion tombstone');
run('s=initial()');await sync();assert.equal(run("waterSummary22(s.logs,'2026-11-20','2026-11-22',2300).total"),0);assert.equal(run('s.logs.some(r=>r.kind==="Suplemento")'),false);
// External Health Connect hydration survives reload and stable IDs do not double count snapshots.
ctx.hydrationRows=[{id:'external-water',date:'2026-11-20',value:400,origin:'external.app'},{id:'external-water',date:'2026-11-20',value:400,origin:'external.app'}];
run("s.logs.push(...normalizeHealth21('hydration',hydrationRows));save()");await sync();run('s=initial()');await sync();
assert.equal(run("waterSummary22(s.logs,'2026-11-20','2026-11-22',2300).total"),400);
assert.equal(run("s.logs.filter(r=>r.healthType==='hydration').length"),1);
assert.equal((await journal('different-user',{})).records.length,0);
db.close(); // libSQL may retain a Windows file handle until process exit; isolated temporary DB.
console.log('PASS nutrition23 persistence: real UI save -> VeraJournal -> SQLite backend -> fresh reload, milk edit/remove/delete, sleep interval corrections/HC spans, profile goal and account isolation.');
