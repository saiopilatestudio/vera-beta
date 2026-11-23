import './test-env.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCustomExercises245,resolveExercises245,requiredExerciseGroups245} from '../exercise-candidates245.mjs';
import {createExerciseSearch245} from '../exercise-search245.mjs';
const context={profile:{eq:['Peso libre','Máquinas','Poleas'],level:'Principiante'},records:[]};
const catalog=JSON.parse(await readFile(new URL('../www/exercises.json',import.meta.url),'utf8'));
for(const item of catalog){
 const result=resolveExercises245(catalog,item.id);assert.ok(result.results.some(x=>x.id===item.id),'Exact original ID '+item.id);
 const named=resolveExercises245(catalog,item.name);assert.ok(named.results.some(x=>x.id===item.id),'Exact Spanish name '+item.id);
}
assert.equal(resolveExercises245(catalog,'press declinado').status,'ambiguous');
assert.equal(resolveExercises245(catalog,'Movimiento sintético inexistente ZQ123').status,'unknown');
const own=validateCustomExercises245([{name:'Remo personal ZQ123',equipment:'dumbbell',measurement:'repetitions'}],context);
assert.match(own[0].id,/^custom_[a-f0-9]{20}$/);assert.deepEqual(validateCustomExercises245(own,context),own);assert.deepEqual(own[0].muscles,[]);assert.ok(!('sets'in own[0]));
for(const input of [[{name:'Remo propio',equipment:'kettlebells',measurement:'repetitions'}],[{name:'Plancha personal',equipment:'body only',measurement:'repetitions'}],[{name:'Remo',equipment:'dumbbell',measurement:'seconds'}],[{name:'Remo',equipment:'dumbbell',measurement:'repetitions',kg:50}],[...own,...own]])assert.throws(()=>validateCustomExercises245(input,context));
const groups=requiredExerciseGroups245(catalog,'El lunes quiero press declinado, aperturas en máquina y tríceps con barra.');assert.equal(groups.length,3);assert.ok(groups.some(x=>x.includes('Butterfly')));
for(const text of ['No quiero press declinado','Ayer hice aperturas en máquina','Si puedo, incluye press declinado'])assert.deepEqual(requiredExerciseGroups245(catalog,text),[],text);
let calls=0;
const search=createExerciseSearch245({fetchImpl:async(url,options)=>{
 calls++;assert.equal(new URL(url).origin,'https://es.wikipedia.org');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);assert.ok(!url.includes('private'));
 return Response.json({query:{search:[{pageid:123,title:'Sentadilla',snippet:'Ejercicio de entrenamiento muscular <b>sentadilla</b>'},{pageid:3,title:'Noticia',snippet:'No relevante'},{pageid:'evil',title:'Sentadilla',snippet:'Ejercicio'}]}});
}});
const local=await search({query:'press declinado',source:'catalog'},{context,uid:'private'});assert.equal(calls,0);assert.equal(local.status,'ambiguous');
const web=await search({query:'Sentadilla',source:'web'},{context,uid:'private'});assert.deepEqual(web.results,[{title:'Sentadilla',url:'https://es.wikipedia.org/?curid=123',source:'Wikipedia (es)'}]);assert.equal(calls,1);await search({query:'Sentadilla',source:'web'},{context});assert.equal(calls,1,'Reference cache');
for(const input of [{query:'x',source:'web'},{query:'hola',source:'https://evil.invalid'},{query:'x'.repeat(101),source:'web'}])await assert.rejects(()=>search(input,{context}),{code:'EXERCISE_SEARCH_INPUT'});
for(const fetchImpl of [async()=>{throw Error('private error');},async()=>new Response('secret',{status:500}),async()=>new Response('x'.repeat(250001)),async()=>Response.json({wrong:true})])await assert.rejects(()=>createExerciseSearch245({fetchImpl})({query:'Sentadilla',source:'web'},{context}),e=>e.code==='EXERCISE_SEARCH_UNAVAILABLE'&&!e.message.includes('private'));
console.log('PASS search245: all 876 Spanish names/IDs, ambiguity, explicit custom identity, equipment/units, requests vs history, fixed Wikipedia source, bounded output, errors/cache and no personal context upstream.');
const literal='Para el lunes incluye press declinado con mancuernas, aperturas en máquina y extensión de tríceps en polea con barra';
assert.deepEqual(requiredExerciseGroups245(catalog,literal),[['Decline_Dumbbell_Bench_Press'],['Butterfly'],['Triceps_Pushdown']]);
assert.deepEqual(requiredExerciseGroups245(catalog,'Incluye tríceps en polea con barra recta'),[['Triceps_Pushdown']]);
assert.deepEqual(requiredExerciseGroups245(catalog,'Incluye tríceps en polea con barra V'),[['Triceps_Pushdown_-_V-Bar_Attachment']]);
assert.notEqual(validateCustomExercises245([{name:'肩部动作',equipment:'dumbbell',measurement:'repetitions'}],context)[0].id,validateCustomExercises245([{name:'背部动作',equipment:'dumbbell',measurement:'repetitions'}],context)[0].id,'Unicode custom names remain distinct');
assert.deepEqual(resolveExercises245(catalog,'de la'),{status:'unknown',results:[]});
