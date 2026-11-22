import './test-env.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'vera-nutrition23-'));process.env.VERA_DB=join(directory,'data.sqlite');
const {searchProducts24,confirmProduct24}=await import('../product-catalog24.mjs');
const {journal}=await import('../journal.mjs');const {profileSync}=await import('../profile-sync.mjs');const {db}=await import('../storage.mjs');
const www=new URL('../www/',import.meta.url);
let harness=readFileSync(new URL('audit-frontend-unit.mjs',import.meta.url),'utf8').split('const results=[];')[0];
harness=harness.replace("new URL('../www/',import.meta.url)",`new URL(${JSON.stringify(www.href)})`)+ '\nexport {run,node,ctx};';
const {run,node,ctx}=await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
for(const name of ['nutrition22','nutrition24','sleep23'])run(readFileSync(new URL(name+'.js',www),'utf8'));
ctx.backend=async(route,payload)=>route==='diario'?journal('nutrition23-user',JSON.parse(JSON.stringify(payload))):route==='products/confirm'?confirmProduct24('nutrition23-user',JSON.parse(JSON.stringify(payload))):route==='products/search'?searchProducts24('nutrition23-user',JSON.parse(JSON.stringify(payload))):route==='profile-sync'?profileSync('nutrition23-user',JSON.parse(JSON.stringify(payload))):Promise.reject(Error('Unexpected '+route));
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
// V2.4 official multivitamin -> reviewed private reusable label -> dose -> real diary -> metrics.
const multiResult=await searchProducts24('nutrition23-user',{query:'Zumub Multivitamina',kind:'supplement'});assert.equal(multiResult.products.length,1);ctx.multi24=multiResult.products[0];
for(const [key]of labels)node('supFact22_'+key).value='';
values({supProduct:'Mi multivitamínico confirmado',supAmount:1,supUnit:'cápsulas',supDate22:'2026-11-20',mixType23:'Sin líquido',productBrand24:'Zumub',productVariant24:'No aplica'});node('productConfirmed24').checked=true;
for(const [key,value]of Object.entries(ctx.multi24.facts))node('supFact22_'+key).value=String(value);
node('rememberProduct24');node('rememberStatus24');run('bindProductReview24(multi24)');await node('rememberProduct24').onclick();assert.match(node('rememberStatus24').textContent,/Ficha guardada/);ctx.private24=ctx.multi24;assert.ok(ctx.private24.id.startsWith('user_'));
assert.equal((await searchProducts24('different-user',{query:'Mi multivitamínico confirmado'})).products.length,0,'private labels never leak');
const cached=await searchProducts24('nutrition23-user',{query:'Mi multivitamínico confirmado'});assert.equal(cached.products.length,1);assert.equal(cached.products[0].facts.vitaminC_mg,60);assert.equal(cached.products[0].facts.magnesium_mg,undefined);
ctx.private24=cached.products[0];run('saveSupplement(productFromServer24(private24))');await sync();run('s=initial()');await sync();
let nutrient=run("metricsSummary21(s.logs,7,'2026-11-22').nutrition");assert.equal(nutrient.vitaminC_mg.total,60);assert.equal(nutrient.vitaminD_ug.total,5);assert.equal(nutrient.zinc_mg.total,15);assert.equal(nutrient.magnesium_mg.total,null);
// A second confirmed capsule scales linearly from the stored label, not generic estimates.
ctx.secondFacts=run("supplementFacts22(productFromServer24(private24),2,'cápsulas')");assert.equal(ctx.secondFacts.vitaminC_mg,120);
values({supAmount:2});for(const [key,value]of Object.entries(ctx.secondFacts))node('supFact22_'+key).value=String(value);
run("beginSupplementEdit23(s.logs.findIndex(r=>r.kind==='Suplemento'));saveSupplement(productFromServer24(private24),s.logs.findIndex(r=>r.kind==='Suplemento'))");await sync();run('s=initial()');await sync();assert.equal(run("metricsSummary21(s.logs,7,'2026-11-22').nutrition.vitaminC_mg.total"),120);
// Private label revisions enforce refresh rather than overwriting a concurrent update.
const update=run('productDraft24(private24)');const updated=await confirmProduct24('nutrition23-user',{confirmed:true,product:JSON.parse(JSON.stringify(update))});assert.equal(updated.product.revision,2);
await assert.rejects(confirmProduct24('nutrition23-user',{confirmed:true,product:JSON.parse(JSON.stringify(update))}),/cambió/);
// Complete an OLD record only after selecting an exact product; preserve chronology/dose/liquid/id.
node('results6');node('lookup6');node('saveSupp8');
run("s.logs.push({id:'legacy-multi24',kind:'Suplemento',date:'2026-11-19',amount:2,unit:'cápsulas',productName:'Mi antiguo multivitamínico',nutrients:{},mixingLiquid:{type:'water',ml:250,name:'Agua',source:'Volumen registrado',per100ml:{}}});save()");await sync();
run("editSupplement(s.logs.findIndex(r=>r.id==='legacy-multi24'));completeSupplement24()");node('lookup6').value='Zumub Multivitamina';await run('VeraCatalog.search()');run('VeraCatalog.pick(0)');
assert.match(node('results6').innerHTML,/id="supFact22_vitaminC_mg"[^>]*value="120"/,'chosen exact label prepopulates old dose');
function fillRenderedInputs(){for(const match of node('results6').innerHTML.matchAll(/<input id="([^"]+)"[^>]*value="([^"]*)"/g))node(match[1]).value=match[2].replaceAll('&amp;','&');}
fillRenderedInputs();values({supUnit:'cápsulas',mixType23:'Agua'});node('saveSupp8').onclick();await sync();run('s=initial()');await sync();
const repaired=run("s.logs.find(r=>r.id==='legacy-multi24')");assert.equal(repaired.date,'2026-11-19');assert.equal(repaired.amount,2);assert.equal(repaired.unit,'cápsulas');assert.equal(repaired.mixingLiquid.ml,250);assert.equal(repaired.nutrients.vitaminC_mg,120);assert.equal(run("s.logs.filter(r=>r.id==='legacy-multi24').length"),1);
// Food labels use the same reviewed table, private catalog and persistence, with food kind.
ctx.food24={kind:'food',name:'Marca Yogur natural',brand:'Marca',variant:'Natural',portion:100,unit:'g',facts:{kcal:62,protein:4,calcium_mg:120},source:'Etiqueta de mi envase'};
run('foodProductForm24(food24)');fillRenderedInputs();values({supDate22:'2026-11-20',supUnit:'g'});node('productConfirmed24').checked=true;await node('rememberProduct24').onclick();assert.match(node('rememberStatus24').textContent,/Ficha guardada/);
node('saveSupp8').onclick();await sync();run('s=initial()');await sync();const meal=run("s.logs.find(r=>r.kind==='Comida'&&r.productName==='Marca Yogur natural')");assert.equal(meal.value,62);assert.equal(meal.nutrients.calcium_mg,120);assert.equal(meal.mixingLiquid,undefined);
const foods=await searchProducts24('nutrition23-user',{query:'Marca Yogur',kind:'food'});assert.equal(foods.products.length,1);assert.equal(foods.products[0].facts.calcium_mg,120);assert.equal((await searchProducts24('different-user',{query:'Marca Yogur',kind:'food'})).products.length,0);
run("VeraCatalog.panel('food')");node('lookup6').value='Marca Yogur';await run('VeraCatalog.search()');run('VeraCatalog.pick(0)');assert.match(node('results6').innerHTML,/Tu alimento, completo/);assert.match(node('results6').innerHTML,/id="supFact22_calcium_mg"[^>]*value="120"/);
db.close(); // libSQL may retain a Windows file handle until process exit; isolated temporary DB.
console.log('PASS nutrition24 persistence (official multi, reusable private label, revision, capsule scaling, 20 micros, unknown magnesium) + nutrition23: real UI save -> VeraJournal -> SQLite backend -> fresh reload, milk edit/remove/delete, sleep interval corrections/HC spans, profile goal and account isolation.');
