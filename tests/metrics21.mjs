import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../www/metrics21.js',import.meta.url),'utf8');
const ctx=vm.createContext({console,s:{logs:[]},render(){}});vm.runInContext(code,ctx);
const summary=(logs,days=7)=>ctx.metricsSummary21(logs,days,'2026-11-22','fasted');
const rows=[
 {kind:'Comida',date:'2026-11-16',value:100,protein:0,carbs:'',fat:null,nutrients:{sodium_mg:0,iron_mg:2}},
 {kind:'Comida',date:'2026-11-16',value:'200',protein:20,carbs:30,nutrients:{iron_mg:3}},
 {kind:'Comida',date:'2026-11-22',value:300,protein:null,carbs:50},
 {kind:'Comida',date:'2026-11-15',value:999,protein:999},
 {kind:'Comida',date:'2026-11-23',value:999,protein:999},
 {kind:'Comida',date:'2026-02-30',value:999},
 {kind:'Peso en ayunas',date:'2026-11-22',value:72},
 {kind:'Peso en ayunas',date:'2026-11-16',value:70},
 {kind:'Peso en ayunas',date:'2026-11-22',value:74},
 {kind:'Otro pesaje',date:'2026-11-22',value:99},
 {kind:'Peso en ayunas',date:'2026-11-21',value:0}
];
let data=summary(rows);
assert.equal(data.since,'2026-11-16');assert.equal(data.meals,3);assert.equal(data.mealDays,2);
assert.equal(data.nutrition.protein.total,20);assert.equal(data.nutrition.protein.known,2);assert.equal(data.nutrition.protein.days,1);assert.equal(data.nutrition.protein.average,20);assert.equal(data.nutrition.protein.partial,true);
assert.equal(data.nutrition.kcal.average,300);assert.equal(data.nutrition.fat.total,null);
assert.equal(data.nutrition.sodium_mg.average,0);assert.equal(data.nutrition.sodium_mg.known,1);assert.equal(data.nutrition.iron_mg.total,5);assert.equal(data.nutrition.vitaminD_ug.total,null);
assert.equal(data.weights.length,2);assert.equal(data.weights[0].value,70);assert.equal(data.weights[1].value,73);assert.equal(data.weightChange,3);
assert.equal(summary([...rows].reverse()).weightChange,3);
assert.equal(summary([]).nutrition.kcal.average,null);assert.equal(summary([]).weightChange,null);
for(const v of ['',null,undefined,' ',false,{},Infinity,-1,'abc'])assert.equal(ctx.numberMetric21(v),null);
assert.equal(ctx.numberMetric21('0'),0);
assert.ok(!ctx.weightGraph21(data.weights).includes('NaN'));assert.ok(ctx.weightGraph21([]).includes('empieza')||ctx.weightGraph21([]).includes('empezar'));
ctx.s.logs=rows;const html=ctx.renderMetrics21();assert.ok(html.includes('Nutrición y peso'));assert.ok(html.includes('Sin dato'));assert.ok(!html.includes('NaN'));
console.log('PASS métricas V2.1: límites de fecha, desconocidos/cero, cobertura, totales, micronutrientes, peso medio y orden cronológico.');

const mixed=[
 {id:'m1',kind:'Comida',date:'2026-11-22',value:100,protein:20},
 {id:'h1',source:'health',kind:'Comida',date:'2026-11-22',value:300,protein:40,nutrients:{iron_mg:8}},
 {id:'h1',source:'health',kind:'Comida',date:'2026-11-22',value:300,protein:40,nutrients:{iron_mg:8}},
 {id:'w1',source:'health',kind:'Otro pesaje',date:'2026-11-21',value:70},
 {id:'w2',source:'health',kind:'Otro pesaje',date:'2026-11-22',value:72},
 {id:'w3',kind:'Peso en ayunas',date:'2026-11-22',value:74}
];
const m=ctx.metricsSummary21(mixed,7,'2026-11-22','all');
assert.equal(m.nutrition.kcal.average,200);assert.equal(m.nutrition.protein.average,30);assert.equal(m.nutrition.iron_mg.average,8);assert.equal(m.meals,2);
assert.equal(m.daily[0].manual.kcal,100);assert.equal(m.daily[0].health.kcal,300);assert.equal(m.weightAverage,71.5);
assert.equal(m.weights[1].conditions.Ayunas,74);assert.equal(m.weights[1].conditions.Otros,72);
assert.equal(ctx.metricsSummary21(mixed,7,'2026-11-22','fasted').weightAverage,74);
assert.equal(ctx.metricsSummary21(mixed,7,'2026-11-22','other').weightAverage,71);
console.log('PASS Health Connect: medias entre fuentes, datos desconocidos, ID duplicados, media diaria de peso y condiciones separadas.');

const supplementation=summary([{id:'s1',kind:'Suplemento',date:'2026-11-22',value:1000,nutrients:{iron_mg:14,vitaminD_ug:10}},{id:'s2',kind:'Suplemento',date:'2026-11-22',value:30,kcal:120,protein:24},{id:'f1',kind:'Comida',date:'2026-11-22',value:500,nutrients:{iron_mg:4}}]);
assert.equal(supplementation.nutrition.kcal.total,620);assert.equal(supplementation.nutrition.iron_mg.total,18);assert.equal(supplementation.nutrition.vitaminD_ug.total,10);assert.equal(supplementation.nutrition.protein.total,24);
console.log('PASS suplementos: nutrientes confirmados sumados; dosis nunca tratada como calorías.');
