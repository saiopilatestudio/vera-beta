import {readFileSync} from 'node:fs';
let harness=readFileSync(new URL('./audit-frontend-unit.mjs',import.meta.url),'utf8').split('const results=[];')[0];
harness=harness.replace("new URL('../www/',import.meta.url)",'new URL('+JSON.stringify(new URL('../www/',import.meta.url).href)+')');
harness+=`
ctx.queueMicrotask=()=>{};run(readFileSync(new URL('workouts24.js',www),'utf8'));
run("s=initial();s.profile={introduced:true,goal:'Fuerza',level:'Principiante',days:3};validSession=true;googleLinked23=()=>true;healthAccess23=()=>({complete:true});VeraPrivacy6.allowed=()=>true;VeraJournal.flush=async()=>true;render=()=>{};loadWorkouts24=async()=>{};queuePlan21=()=>{};workoutAccount24();workoutLoaded24=true;");
const week=run('workoutWeek24()');
const dates=Array.from({length:7},(_,i)=>{const d=new Date(week+'T12:00:00');d.setDate(d.getDate()+i);return run('day(new Date('+JSON.stringify(d.toISOString())+'))');});
ctx.original={version:24,week,status:'ready',summary:'Semana original',adaptation:'Según perfil',coverage:{included:0,partial:false},days:dates.map((date,i)=>({date,type:i===0?'training':'rest',title:i===0?'Fuerza':'Recuperación',reason:'Fixture',exercises:i===0?[{id:'squat',name:'Sentadilla',sets:3,reps:[8,12],rir:3,restSeconds:90,cue:'Control',progression:'Técnica',previous:null}]:[]}))};
run('workoutPlan24=JSON.parse(JSON.stringify(original))');
assert.match(run('workoutPanel24()'),/Día de referencia/);assert.match(run('workoutPanel24()'),/semana completa/);
run('workoutChangeOptions24("editDate",'+JSON.stringify(dates[0])+')');
node('workoutRequest24').value='Cambiar hoy a torso y reajustar el resto de la semana';
ctx.changed=JSON.parse(JSON.stringify(ctx.original));ctx.changed.days[0].title='Torso';ctx.changed.days[1].title='Recuperación reajustada';ctx.changed.days[2]={...JSON.parse(JSON.stringify(ctx.changed.days[0])),date:dates[2],title:'Pierna reajustada'};
let sent,confirmation;ctx.confirm=message=>{confirmation=message;return true;};ctx.capture=data=>{sent=JSON.parse(JSON.stringify(data));};
run("api=async(route,data)=>{capture(data);return {plan:changed,request:data.request,cached:false,stale:false};}");
assert.equal(await run('generateWorkout24()'),true);
assert.equal(sent.week,week);assert.equal(sent.editDate,dates[0]);assert.equal(sent.request,'Cambiar hoy a torso y reajustar el resto de la semana');assert.equal(sent.trainingDays,undefined);assert.equal(sent.currentPlan,undefined,'Persisted owner-bound plan is authoritative on backend');
assert.match(confirmation,/Reajustar toda la semana/);assert.match(node('notice').textContent,/Semana reajustada/);assert.equal(run('s.logs.length'),0);
assert.equal(run('workoutPlan24.days[1].title'),'Recuperación reajustada');assert.equal(run('workoutPlan24.days[2].type'),'training');assert.equal(run('workoutPlan24.days.length'),7);
// Missing weekdays or a null result must never be represented as a complete adaptation.
const saved=run('JSON.stringify(workoutPlan24)');ctx.changed=JSON.parse(JSON.stringify(ctx.changed));ctx.changed.days.pop();
assert.equal(await run('generateWorkout24()'),false);assert.equal(run('JSON.stringify(workoutPlan24)'),saved);assert.match(node('notice').textContent,/siete días/);
ctx.changed=null;assert.equal(await run('generateWorkout24()'),false);assert.equal(run('JSON.stringify(workoutPlan24)'),saved);assert.match(node('notice').textContent,/no devolvió una tabla/);
// Rebuilding a damaged one-session week is explicit and carries the desired count.
run("workoutChangeOptions24('editDate','');workoutChangeOptions24('trainingDays','3')");node('workoutRequest24').value='Recuperar una semana de tres sesiones';ctx.changed=JSON.parse(JSON.stringify(ctx.original));
assert.equal(await run('generateWorkout24()'),false);assert.match(node('notice').textContent,/número de sesiones/);
for(const i of [2,4])ctx.changed.days[i]={...JSON.parse(JSON.stringify(ctx.changed.days[0])),date:dates[i]};
assert.equal(await run('generateWorkout24()'),true);assert.equal(sent.editDate,'');assert.equal(sent.trainingDays,3);assert.match(confirmation,/semana completa/);
assert.match(run('workoutPanel24()'),/Generar semana con mi petición/);
// Cancel keeps the local plan and never starts a request.
ctx.confirm=()=>false;sent=null;await run('generateWorkout24()');assert.equal(sent,null);ctx.confirm=()=>true;
// Empty edits and unknown dates cannot be transmitted as an ambiguous whole-week edit.
run('workoutChangeOptions24("editDate",'+JSON.stringify(dates[0])+')');node('workoutRequest24').value=' ';sent=null;await run('generateWorkout24()');assert.equal(sent,null);
run("workoutChangeOptions24('editDate','2099-01-01')");assert.equal(run('workoutOptionsValue24().editDate'),dates[0]);
// Scope and desired count are isolated between weeks and between accounts.
const other=run('workoutWeek24()===monday21()?workoutNextWeek24():monday21()');run('workoutSelectWeek24('+JSON.stringify(other)+')');assert.equal(run('workoutOptionsValue24().editDate'),'');assert.equal(run('workoutOptionsValue24().trainingDays'),'');run('workoutSelectWeek24('+JSON.stringify(week)+')');assert.equal(run('workoutOptionsValue24().editDate'),dates[0]);
run("sessionStorage.veraUser='another';workoutAccount24()");assert.equal(run('workoutOptionsValue24().editDate'),'');assert.equal(run('workoutOptionsValue24().trainingDays'),'');
// Catalog IDs and user-defined exercise declarations are explicit, account-bound drafts.
run("s=initial();s.profile={introduced:true,goal:'Fuerza',level:'Principiante',days:3};workoutAccount24();workoutPlan24=original;workoutLoaded24=true;workoutJob24=null");
node('workoutExerciseQuery245').value='press declinado';
ctx.searchResponse={source:'catalog',status:'ambiguous',results:[{id:'Decline_Barbell_Bench_Press',name:'Press declinado con barra',equipment:'barbell'},{id:'Decline_Dumbbell_Bench_Press',name:'Press declinado con mancuernas',equipment:'dumbbell'}]};
let searchPayload;ctx.captureSearch=data=>{searchPayload=JSON.parse(JSON.stringify(data));};run("api=async(route,data)=>{captureSearch(data);return searchResponse;}");
await run("workoutSearchExercises245('catalog')");assert.equal(searchPayload.source,'catalog');assert.equal(searchPayload.query,'press declinado');assert.equal(searchPayload.profile,undefined);assert.equal(searchPayload.logs,undefined);
run('workoutChooseExercise245(1)');assert.deepEqual(JSON.parse(run('JSON.stringify(workoutExercisePayload24().exerciseIds)')),['Decline_Dumbbell_Bench_Press']);assert.equal(run('s.logs.length'),0);assert.match(run('workoutExercisePanel245()'),/Mancuernas|mancuernas/);
ctx.searchResponse={source:'Wikipedia (es)',status:'references',results:[{title:'Ejercicio de prueba',url:'https://es.wikipedia.org/wiki/Ejercicio',source:'Wikipedia (es)'}]};await run("workoutSearchExercises245('web')");assert.equal(searchPayload.source,'web');assert.match(run('workoutExercisePanel245()'),/Consultar origen: Wikipedia/);
run('workoutChooseExercise245(0)');assert.equal(run('workoutExercisePayload24().customExercises'),undefined,'A web title does not silently create a custom exercise');
run('workoutAddCustom245()');assert.equal(run('workoutExercisePayload24().customExercises'),undefined);
run("workoutExerciseField245('equipment','dumbbell');workoutExerciseField245('repetitions',true);workoutAddCustom245()");assert.deepEqual(JSON.parse(run('JSON.stringify(workoutExercisePayload24().customExercises)')),[{name:'Ejercicio de prueba',equipment:'dumbbell',measurement:'repetitions'}]);assert.equal(run('s.logs.length'),0);
run("api=async(route,data)=>{capture(data);return {plan:original,request:data.request,cached:false,stale:false};}");await run("generateWorkout24('Incorporar las variantes y el ejercicio confirmado')");assert.deepEqual(sent.exerciseIds,['Decline_Dumbbell_Bench_Press']);assert.deepEqual(sent.customExercises,[{name:'Ejercicio de prueba',equipment:'dumbbell',measurement:'repetitions'}]);assert.ok(!JSON.stringify(sent).includes('wikipedia.org'));
assert.equal(run("workoutReferenceUrl245('javascript:alert(1)')"),'');assert.equal(run("workoutReferenceUrl245('https://evil.example/wiki/Test')"),'');
run("workoutRemoveExercise245('custom',0);workoutRemoveExercise245('catalog',0)");assert.equal(run('workoutExercisePayload24().customExercises.length'),0);assert.equal(run('workoutExercisePayload24().exerciseIds.length'),0);
run("api=async()=>{throw Error('Búsqueda web no disponible')}");await run("workoutSearchExercises245('web')");assert.match(run('workoutExercisePanel245()'),/entrada manual/);
let resolveSearch;ctx.pendingSearch=new Promise(resolve=>resolveSearch=resolve);run('api=async()=>await pendingSearch');const searchPending=run("workoutSearchExercises245('web')");run("sessionStorage.veraUser='third-account';workoutAccount24()");resolveSearch({results:[{title:'Wrong owner'}]});await searchPending;assert.equal(run('workoutExerciseDraft245().results.length'),0);assert.equal(run('workoutExerciseIds245().length'),0);
// Leaving a week during lookup discards its response and does not leave a permanent spinner.
run('workoutJob24=null');node('workoutExerciseQuery245').value='prueba';ctx.pendingSearch=new Promise(resolve=>resolveSearch=resolve);const oldWeekSearch=run('workoutWeek24()');const delayed=run("workoutSearchExercises245('web')");const nextSearchWeek=run('workoutWeek24()===monday21()?workoutNextWeek24():monday21()');run('workoutSelectWeek24('+JSON.stringify(nextSearchWeek)+')');resolveSearch({results:[{title:'Stale week'}]});await delayed;run('workoutSelectWeek24('+JSON.stringify(oldWeekSearch)+')');assert.equal(run('workoutExerciseDraft245().busy'),false);assert.equal(run('workoutExerciseDraft245().results.length'),0);
// A cache read must say it is reading, not generating; changed input isn't claimed as already incorporated.
run('workoutPlan24=original;workoutStale24=true;workoutJob24={readOnly:true}');const panel=run('workoutPanel24()');assert.match(panel,/Consultando la tabla guardada/);assert.match(panel,/todavía no incorpora esos cambios/);assert.ok(!panel.includes('mientras se prepara la actualización'));
console.log('PASS workouts weekly adaptations: explicit date/week/request, other days adjusted coherently, seven days required, exact requested sessions, null rejection, cancellation, date/account/week isolation, catalog variants, explicit custom confirmation, web references and truthful states');
`;
await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
