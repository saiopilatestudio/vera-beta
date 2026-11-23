import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const www=new URL('../www/',import.meta.url);
const elements={lookup6:{value:''},results6:{isConnected:true,innerHTML:''},kg6:{value:'20'},set6:{value:'10,10,10'}};
const context=vm.createContext({console,setTimeout,clearTimeout,AbortController,$:id=>elements[id],btn:(text)=>'<button>'+text+'</button>',safe:String,field:()=>'',s:{logs:[]},day:()=> '2026-11-22',save(){},render(){},msg(){},compare10:xs=>xs.map(x=>x.name).join('|'),validateTraining14:d=>({exercise:d.exercise,enteredKg:Number(d.enteredKg),reps:[10,10,10]}),fetch(){throw Error('Exercise search and verified Zumub must not call external APIs');}});
const run=code=>vm.runInContext(code,context);
for(const file of ['list7.js','exercises-es22.js'])run(readFileSync(new URL(file,www),'utf8'));
run("localProducts.supplement.unshift({name:'Zumub · Whey chocolate',brand:'Zumub',id:'ZUMUB-WHEY',n:{'energy-kcal_100g':390}})");
run(readFileSync(new URL('catalog6.js',www),'utf8'));
assert.equal(run('Object.keys(VeraExerciseNames22).length'),876);
assert.equal(run('exerciseRows.filter(x=>!VeraExerciseNames22[x.id]).length'),0);
const data=JSON.parse(readFileSync(new URL('exercises.json',www),'utf8'));
assert.equal(data.length,876);assert.ok(data.every(x=>x.originalName&&x.id&&x.name));
for(const q of ['Press banca','Sentadilla','Bench Press','Peso muerto','Remo','Jalón','Mancuernas']){
  run("VeraCatalog.panel('exercise')");elements.lookup6.value=q;await run('VeraCatalog.search()');
  assert.match(elements.results6.innerHTML,/<button>/,q);
  assert.doesNotMatch(elements.results6.innerHTML,/Bench|Dumbbell|Barbell|Squat|Deadlift|Shoulder|With Bands|Powerlifting/,q);
}
run("VeraCatalog.panel('exercise')");elements.lookup6.value='Press banca';await run('VeraCatalog.search()');run('VeraCatalog.pick(0);VeraCatalog.record()');
assert.match(run('s.logs[0].exercise'),/Press de banca/);assert.ok(['Pecho','Tríceps'].includes(run('s.logs[0].group')));assert.ok(run('s.logs[0].catalogId'));
for(const [query,expected]of [['apertura máquina','Butterfly'],['tríceps polea barra recta','Triceps_Pushdown'],['press declinado barra','Decline_Barbell_Bench_Press']]){
 run("VeraCatalog.panel('exercise')");elements.lookup6.value=query;await run('VeraCatalog.search()');
 run('VeraCatalog.pick(0);VeraCatalog.record()');assert.equal(run('s.logs.at(-1).catalogId'),expected,query);
}
run("VeraCatalog.panel('supplement')");elements.lookup6.value='Zumub whey';await run('VeraCatalog.search()');assert.match(elements.results6.innerHTML,/Zumub/);
console.log('PASS · 876 Spanish names, preserved IDs/aliases, Spanish and English search, Spanish logged exercise/muscles, Zumub official match without NIH lookup.');
