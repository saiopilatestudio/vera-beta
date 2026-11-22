import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const nodes={},ctx=vm.createContext({console,localProducts:{supplement:[]},s:{logs:[],profile:{}},render(){},save(){},msg(){},day:()=> '2026-11-22',$:id=>nodes[id],safe:v=>String(v),field:()=>'',selectField:()=>'',presentation10:()=> 'g'});
for(const name of ['metrics21','nutrition22'])vm.runInContext(readFileSync(new URL('../www/'+name+'.js',import.meta.url),'utf8'),ctx);
const labels=vm.runInContext('nutritionLabels22',ctx),whey=vm.runInContext('zumubProducts22[0]',ctx);
for(const [key]of labels){nodes['supFact22_'+key]={value:''};nodes['mixFact23_'+key]={value:''};}
Object.assign(nodes,{supProduct:{value:whey.name},supAmount:{value:'30'},supUnit:{value:'g'},supDate22:{value:'2026-11-22'},mixType23:{value:'Leche'},mixMl23:{value:'250'},mixName23:{value:'Mi envase'}});
nodes.supFact22_kcal.value='110';nodes.supFact22_protein.value='21.4';nodes.mixFact23_kcal.value='46';nodes.mixFact23_protein.value='3.2';nodes.mixFact23_calcium_mg.value='120';
ctx.saveSupplement(whey);assert.equal(ctx.s.logs.length,1);const row=ctx.s.logs[0];row.id='dose';
let data=ctx.metricsSummary21(ctx.s.logs,7,'2026-11-22');assert.equal(data.nutrition.kcal.total,225);assert.equal(data.nutrition.calcium_mg.total,300);assert.equal(data.nutrition.carbs.total,null);assert.equal(data.nutrition.calcium_mg.partial,true);
assert.equal(ctx.baseNutritionValue21(row,'kcal'),110,'editing dose must not include mixing kcal');
let water=()=>ctx.waterSummary22(ctx.s.logs,'2026-11-21','2026-11-22',2000);assert.equal(water().today,250);
ctx.s.logs.push({...row});assert.equal(water().today,250,'duplicate dose id');ctx.s.logs.pop();
nodes.mixMl23.value='100';ctx.beginSupplementEdit23(0);ctx.saveSupplement(whey,0);assert.equal(ctx.s.logs.length,1);assert.equal(water().today,100);assert.equal(ctx.nutritionValue21(ctx.s.logs[0],'kcal'),156);
nodes.mixType23.value='Agua';ctx.beginSupplementEdit23(0);ctx.saveSupplement(whey,0);assert.equal(ctx.nutritionValue21(ctx.s.logs[0],'kcal'),110);assert.equal(Object.keys(ctx.s.logs[0].mixingLiquid.per100ml).length,0,'milk values removed when switching to water');
nodes.mixType23.value='Sin líquido';ctx.beginSupplementEdit23(0);ctx.saveSupplement(whey,0);assert.equal(water().today,null);
nodes.mixType23.value='Leche';nodes.mixMl23.value='-1';ctx.beginSupplementEdit23(0);ctx.saveSupplement(whey,0);assert.equal(ctx.s.logs[0].mixingLiquid,undefined,'invalid volume rejected');
ctx.s.logs=[];assert.equal(water().today,null,'deletion removes liquid');
assert.equal(ctx.nutritionValue21({kind:'Suplemento',mixingLiquid:{type:'water',ml:250}},'kcal'),null,'water does not turn unknown powder energy into zero');
// Identity survives reorder; stale account/session edits cannot overwrite another dose.
nodes.mixType23.value='Agua';nodes.mixMl23.value='100';ctx.saveSupplement(whey);ctx.s.logs[0].id='dose-first';ctx.s.logs.push({...ctx.s.logs[0],id:'dose-other'});
ctx.beginSupplementEdit23(0);ctx.s.logs.reverse();nodes.mixMl23.value='150';ctx.saveSupplement(whey,0);
assert.equal(ctx.s.logs.find(r=>r.id==='dose-first').mixingLiquid.ml,150);assert.equal(ctx.s.logs.find(r=>r.id==='dose-other').mixingLiquid.ml,100);
ctx.beginSupplementEdit23(0);ctx.s={...ctx.s,logs:ctx.s.logs.map(r=>({...r}))};let unchanged=JSON.stringify(ctx.s.logs);ctx.saveSupplement(whey,0);assert.equal(JSON.stringify(ctx.s.logs),unchanged,'state replacement rejects edit');
ctx.sessionStorage={veraUser:'a',veraToken:'token-a'};ctx.beginSupplementEdit23(0);ctx.sessionStorage.veraUser='b';ctx.saveSupplement(whey,0);assert.equal(JSON.stringify(ctx.s.logs),unchanged,'account mismatch rejects edit');
ctx.sessionStorage.veraUser='a';ctx.beginSupplementEdit23(0);ctx.sessionStorage.veraToken='new-token';ctx.saveSupplement(whey,0);assert.equal(JSON.stringify(ctx.s.logs),unchanged,'token mismatch rejects edit');
ctx.beginSupplementEdit23(0);ctx.s.logs[0].note='Changed remotely';const concurrent=JSON.stringify(ctx.s.logs);ctx.saveSupplement(whey,0);assert.equal(JSON.stringify(ctx.s.logs),concurrent,'concurrent revision is not overwritten');
console.log('PASS nutrition23: label scaling, liquid nutrition/micros, unknowns, edit, type switch, invalid volume, dedup and removal.');
