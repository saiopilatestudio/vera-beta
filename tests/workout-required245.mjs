import './test-env.mjs';
import assert from 'node:assert/strict';
import {workoutCatalog24,validateWorkout24} from '../workouts24.mjs';
import {requiredExerciseGroups245} from '../exercise-candidates245.mjs';
const context={profile:{eq:['Peso libre','Máquinas','Poleas'],level:'Principiante',days:3},records:[],coverage:{}};
const request='El lunes quiero press declinado, aperturas en máquina y tríceps con barra.';
const candidates=workoutCatalog24(context,request),groups=requiredExerciseGroups245(candidates,request);
assert.equal(groups.length,3);assert.equal(requiredExerciseGroups245(candidates,'Ayer hice press declinado. No quiero aperturas máquina.').length,0);
const dates=Array.from({length:7},(_,i)=>'2026-11-'+(16+i));
const exercise=id=>({id,sets:2,reps:[8,12],rir:3,restSeconds:90,cue:'Control.',progression:'Técnica.'});
const raw={status:'ready',summary:'Tabla.',adaptation:'Adaptada.',days:dates.map((date,i)=>({date,type:[0,2,4].includes(i)?'training':'rest',title:'Sesión',reason:'Propuesta.',exercises:i===0?groups.map(g=>exercise(g[0])):[2,4].includes(i)?[exercise(candidates[0].id)]:[]}))};
const opts={week:dates[0],context,candidates,expectedTrainingDays:3,editDate:dates[0],requiredExerciseGroups:groups};
assert.equal(validateWorkout24(raw,opts).days[0].exercises.length,3);
const wrong=structuredClone(raw);wrong.days[2].exercises=wrong.days[0].exercises;wrong.days[0].exercises=[exercise(candidates.find(e=>!groups.flat().includes(e.id)).id)];
assert.throws(()=>validateWorkout24(wrong,opts),{code:'WORKOUT_FORMAT'},'Requested exercises on Wednesday do not satisfy Monday');
const another=groups.find(g=>g.length>1);if(another){const swapped=structuredClone(raw);swapped.days[0].exercises.find(e=>e.id===another[0]).id=another[1];assert.doesNotThrow(()=>validateWorkout24(swapped,opts));}
assert.throws(()=>validateWorkout24(raw,{...opts,expectedTrainingDays:4}),{code:'WORKOUT_FORMAT'});
console.log('PASS requested exercise groups245: three positive exercise groups on Monday, equivalent variant accepted, negative/history ignored, wrong day rejected, exact session count.');
