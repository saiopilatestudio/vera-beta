import './test-env.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=await mkdtemp(join(tmpdir(),'vera-workouts24-'));process.env.VERA_DB=join(folder,'test.sqlite');
const {db}=await import('../storage.mjs');
const {weeklyWorkout24,workoutContext24,workoutCatalog24,validateWorkout24}=await import('../workouts24.mjs');
const {weekDates21}=await import('../planning21.mjs');
await db.batch(['CREATE TABLE account_state(uid TEXT,field TEXT,rev INTEGER,data TEXT,PRIMARY KEY(uid,field))','CREATE TABLE diary_sync(uid TEXT,id TEXT,rev INTEGER,data TEXT,PRIMARY KEY(uid,id))'],'write');
const put=async(uid,key,value)=>db.execute({sql:'INSERT INTO account_state VALUES(?,?,1,?) ON CONFLICT(uid,field) DO UPDATE SET data=excluded.data,rev=rev+1',args:[uid,'profile.'+key,JSON.stringify(value)]});
for(const uid of ['a','b'])for(const[k,v]of Object.entries({introduced:true,goal:'Fuerza',level:'Principiante',days:3,time:45,eq:['Mancuernas']}))await put(uid,k,v);
const week='2026-11-23',dates=weekDates21(week);let calls=0,reservations=0;
function fixture(context){return {status:'ready',summary:'Tres sesiones adaptadas al material disponible.',adaptation:'Inicio conservador sin cargas inventadas.',days:dates.map((date,i)=>({date,type:i%2===0&&i<5?'training':'rest',title:i%2===0&&i<5?'Fuerza general':'Recuperación',reason:'Distribución según disponibilidad.',exercises:i%2===0&&i<5?[{id:context.catalog[0].id,sets:2,reps:[8,12],rir:3,restSeconds:90,cue:'Movimiento controlado y sin dolor.',progression:'Revisa técnica y repeticiones antes de cambiar la carga.'}]:[]}))};}
const ask=async(system,content,json,options)=>{calls++;assert.equal(json,true);assert.equal(options.feature,'coach');assert.match(system,/No inventes cargas/);return fixture(JSON.parse(content));};
const opts={db,ask,beforeGenerate:async()=>{reservations++;}};
try{
 const first=await weeklyWorkout24('a',{week},opts);assert.equal(first.plan.days.length,7);assert.equal(first.plan.days.filter(d=>d.exercises.length).length,3);assert.equal(calls,1);assert.equal(reservations,1);assert.ok(first.plan.days[0].exercises[0].name);assert.equal(first.plan.days[0].exercises[0].previous,null);assert.equal((await db.execute('SELECT * FROM diary_sync')).rows.length,0,'Plan is never logged activity');
 const cached=await weeklyWorkout24('a',{week},opts);assert.equal(cached.cached,true);assert.equal(calls,1);assert.equal(reservations,1);
 await weeklyWorkout24('a',{week,request:'Sólo ejercicios tranquilos'},opts);assert.equal(calls,2);assert.equal((await weeklyWorkout24('a',{week},opts)).cached,true,'Automatic generation retains explicit request');assert.equal(calls,2);
 const other=await weeklyWorkout24('b',{week,readOnly:true},opts);assert.equal(other.plan,null);assert.equal(calls,2);
 await put('a','time',30);assert.equal((await weeklyWorkout24('a',{week,readOnly:true},opts)).stale,true);assert.equal(calls,2);await weeklyWorkout24('a',{week},opts);assert.equal(calls,3);
 const context=await workoutContext24(db,'a',week),candidates=workoutCatalog24(context),raw=fixture({catalog:candidates}),validation={week,context,candidates};
 assert.ok(candidates.every(x=>['body only','dumbbell','sin material'].includes(x.equipment)),'Material restricted');
 assert.ok(candidates.every(x=>!/plank|isometric|hold/i.test(x.id)),'Time-based exercises cannot become repetition prescriptions');
 const staticBad=structuredClone(raw);staticBad.days[0].exercises[0]={...staticBad.days[0].exercises[0],id:'Plank',reps:[30,45]};assert.throws(()=>validateWorkout24(staticBad,validation),'Real-provider failure must remain invalid rather than convert seconds into reps');
 const free=workoutCatalog24({...context,profile:{...context.profile,eq:['Peso libre']}});assert.ok(free.some(x=>x.id==='Barbell_Squat'));assert.ok(free.some(x=>x.id==='Dumbbell_Bench_Press'),'Actual profile label enables free weights');
 for(const mutate of [x=>x.days[0].exercises[0].kg=90,x=>x.days[0].exercises[0].id='not-real',x=>x.days[0].exercises[0].rir=0,x=>x.days[0].exercises[0].reps=[12,6],x=>x.days[0].date='2026-12-01',x=>x.days[1].exercises=x.days[0].exercises,x=>x.days[0].exercises[0].sets=100]){const bad=structuredClone(raw);mutate(bad);assert.throws(()=>validateWorkout24(bad,validation));}
 const review={status:'needs_review',summary:'Aclara el dolor antes de entrenar.',adaptation:'No se prescribe rehabilitación.',days:dates.map(date=>({date,type:'rest',title:'Pendiente de aclaración',reason:'Necesitamos confirmar tus restricciones.',exercises:[]}))};assert.equal(validateWorkout24(review,validation).status,'needs_review');
 const exercise=candidates[0];await db.execute({sql:'INSERT INTO diary_sync VALUES(?,?,1,?)',args:['a','actual',JSON.stringify({id:'actual',kind:'Entrenamiento',date:week,exercise:exercise.name,kg:20,mode:'Por lado',reps:[10]})]});
 const withHistory=await weeklyWorkout24('a',{week},opts);assert.equal(withHistory.plan.days[0].exercises[0].previous.kg,40);assert.equal(withHistory.plan.days[0].exercises[0].previous.enteredKg,20);
 const staleOptions={...opts,ask:async(system,content)=>{await put('a','time',25);return fixture(JSON.parse(content));}};await assert.rejects(()=>weeklyWorkout24('a',{week,request:'Cambia la sesión'},staleOptions),e=>e.code==='WORKOUT_STALE');
 const preserved=await weeklyWorkout24('a',{week,readOnly:true},opts);assert.equal(preserved.request,'Sólo ejercicios tranquilos','Failed generation retains previous plan/request');
 let release;const deferred=new Promise(resolve=>release=resolve);const concurrent={...opts,ask:async(system,content)=>{calls++;await deferred;return fixture(JSON.parse(content));}};
 const p1=weeklyWorkout24('a',{week,request:'Más breve'},concurrent);await new Promise(r=>setTimeout(r,30));const p2=weeklyWorkout24('a',{week,request:'Más breve'},concurrent);await assert.rejects(()=>weeklyWorkout24('a',{week,request:'Otra petición'},concurrent),e=>e.code==='WORKOUT_BUSY');release();const [one,two]=await Promise.all([p1,p2]);assert.equal(one.inputSignature,two.inputSignature);
 await assert.rejects(()=>weeklyWorkout24('missing',{week},opts),/Completa/);
 console.log('PASS workouts24: useful initial plan, real DB persistence, UID isolation, request/context cache, quota-on-miss, invalid plans, historical loads, stale generation and concurrency; no ghost activity.');
}finally{db.close();await rm(folder,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
