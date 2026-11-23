const exerciseGroups245=[
  {terms:['press declinado','press banca declinado','press pecho declinado'],ids:['Decline_Barbell_Bench_Press','Decline_Dumbbell_Bench_Press','Leverage_Decline_Chest_Press']},
  {terms:['press inclinado','press banca inclinado','press pecho inclinado'],ids:['Barbell_Incline_Bench_Press_-_Medium_Grip','Incline_Dumbbell_Press','Leverage_Incline_Chest_Press']},
  {terms:['apertura maquina','apertura pecho maquina','pec deck','peck deck','peckdeck','pectoral contractor'],ids:['Butterfly']},
  {terms:['triceps barra','extension triceps barra','triceps polea barra','extension triceps polea barra','pressdown barra'],ids:['Triceps_Pushdown','Triceps_Pushdown_-_V-Bar_Attachment','Standing_Overhead_Barbell_Triceps_Extension']},
  {terms:['triceps cuerda','triceps polea cuerda'],ids:['Triceps_Pushdown_-_Rope_Attachment']},
  {terms:['press frances','triceps barra z'],ids:['Lying_Triceps_Press','Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head']},
 ];
// Deterministic catalogue retrieval, not a prescription or inference engine.
// Only the caller's eligible catalogue can produce a match.
import {createHash} from 'node:crypto';
import {ServiceError} from './ai-provider.mjs';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\b(aperturas|mancuernas|maquinas|poleas|barras)\b/g,x=>x.slice(0,-1)).replace(/\b(de|del|con|en|el|la|las|los|un|una)\b/g,' ').replace(/\s+/g,' ').trim();
const phrase=(text,query)=>(' '+text+' ').includes(' '+query+' ');
const requestParts245=value=>String(value||'').split(/[,;\n]|\b(?:y|and)\b/i).map(normalize).filter(Boolean);
function exactMentions245(eligible,text){
 const matches=[];
 for(const item of eligible)for(const value of [item.name,item.originalName,item.id]){
  const key=normalize(value),start=(' '+text+' ').indexOf(' '+key+' ');
  if(key.length>=5&&start>=0)matches.push({id:item.id,start,end:start+key.length});
 }
 return [...new Set(matches.filter(a=>!matches.some(b=>b.start<=a.start&&b.end>=a.end&&b.end-b.start>a.end-a.start)).map(x=>x.id))];
}
function groupIds245(group,text,eligible){
 let ids=group.ids.filter(id=>eligible.some(x=>x.id===id));
 if(group.ids.includes('Triceps_Pushdown')){
  if(/\bbarra z\b|\bez bar\b/.test(text))return [];
  if(/\bbarra v\b|\bv bar\b/.test(text))return ids.filter(id=>id==='Triceps_Pushdown_-_V-Bar_Attachment');
  if(/\bbarra recta\b|\bstraight bar\b/.test(text)||/\bpolea\b|\bcable\b/.test(text))return ids.filter(id=>id==='Triceps_Pushdown');
 }else{
  const equipment=/\bbarra z\b|\bez bar\b/.test(text)?'e-z curl bar':/\bmancuerna\b|\bdumbbell/.test(text)?'dumbbell':/\bmaquina\b|\bmachine\b/.test(text)?'machine':/\bbarra\b|\bbarbell\b/.test(text)?'barbell':null;
  if(equipment)ids=ids.filter(id=>eligible.find(x=>x.id===id)?.equipment===equipment);
 }
 return ids;
}
const fail=message=>new ServiceError(message,422,'WORKOUT_EXERCISE');
export function availableEquipment245(context){
 const eq=normalize(JSON.stringify(context.profile?.eq||[])),available=new Set(['body only']);
 if(/peso libre|pesos libres/.test(eq)){available.add('dumbbell');available.add('barbell');}
 for(const[k,re]of Object.entries({dumbbell:/mancuerna|dumbbell/,barbell:/barra|barbell/,cable:/polea|cable/,machine:/maquina|machine/,kettlebells:/kettlebell|pesa rusa/,bands:/banda|elastica/,'medicine ball':/balon medicinal/,'exercise ball':/fitball|pelota/,'e-z curl bar':/barra (?:z|ez)|e z curl bar/}))if(re.test(eq))available.add(k);
 return [...available];
}
export function eligibleExercises245(catalog,context){
 const available=new Set(availableEquipment245(context)),beginner=/princip|beginner|novato/.test(normalize(context.profile?.level));
 return catalog.filter(x=>available.has(x.equipment||'body only')&&['strength','powerlifting'].includes(x.category)&&x.force!=='static'&&!/plank|isometric|hold/i.test(x.id)&&(!beginner||x.level!=='expert'));
}
export function validateCustomExercises245(value,context){
 if(!Array.isArray(value)||value.length>12)throw fail('Confirma hasta 12 ejercicios personalizados.');
 const available=new Set(availableEquipment245(context)),ids=new Set();
 return value.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(k=>!['id','name','equipment','measurement','muscles','level','userDefined'].includes(k))||typeof item.name!=='string'||item.name.trim().length<2||item.name.length>100||/[\u0000-\u001f<>]/.test(item.name)||item.measurement!=='repetitions'||!available.has(item.equipment))throw fail('Confirma nombre, material disponible y medición por repeticiones del ejercicio. No introduzcas cargas ni dosis en la ficha.');
  if(/\b(plank|plancha|isometr|hold|estiramiento|stretch)/.test(normalize(item.name)))throw fail('La tabla admite ejercicios por repeticiones; no convierte segundos de posiciones o estiramientos en repeticiones.');
  const name=item.name.trim(),identity=name.normalize('NFKC').toLocaleLowerCase('es').replace(/\s+/g,' '),id='custom_'+createHash('sha256').update(identity+'|'+item.equipment).digest('hex').slice(0,20);
  if(item.id!=null&&item.id!==id||ids.has(id))throw fail('Revisa los ejercicios personalizados duplicados o modificados.');
  ids.add(id);return {id,name,equipment:item.equipment,muscles:[],level:'user-confirmed',userDefined:true,measurement:'repetitions'};
 });
}
const queryWords=value=>normalize(value).replace(/\bflexion biceps\b/g,'curl biceps').replace(/\bextension triceps\b/g,'triceps').replace(/\b(apertura|flyes|fly)\b/g,'apertura').replace(/\b(declinada|decline)\b/g,'declinado').replace(/\b(inclinada|incline)\b/g,'inclinado').split(' ').filter(Boolean);
export function resolveExercises245(catalog,query){
 const tokens=queryWords(query),special=new Set(requestedExercises245(catalog,query).map(x=>x.id));
 if(!tokens.length)return {status:'unknown',results:[]};
 const ranked=catalog.map(item=>{
  const aliases=[item.name,item.originalName,item.id].map(queryWords),exact=aliases.some(words=>words.join(' ')===tokens.join(' '));
  const coverage=Math.max(...aliases.map(words=>tokens.filter(word=>words.includes(word)).length));
  const score=exact?1000:coverage===tokens.length?100+tokens.length:special.has(item.id)?50:0;
  return {item,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.name.localeCompare(b.item.name,'es'));
 const matches=ranked[0]?.score===1000?ranked.filter(x=>x.score===1000):ranked;
 return {status:matches.length===1?'matched':matches.length?'ambiguous':'unknown',results:matches.slice(0,12).map(({item})=>({id:item.id,title:item.name,name:item.name,equipment:item.equipment||'body only',level:item.level,muscles:item.primaryMuscles||item.muscles||[]}))};
}
export function requestedExercises245(eligible,request){
 const found=new Map(),byId=new Map(eligible.map(x=>[x.id,x]));
 const add=(id,score)=>{const item=byId.get(id);if(item)found.set(id,{item,score:Math.max(score,found.get(id)?.score||0)});};
 // Full Spanish/English names and original IDs preserve arbitrary catalogue variants.
 for(const text of requestParts245(request)){
  for(const id of exactMentions245(eligible,text))add(id,200);
  for(const group of exerciseGroups245)if(group.terms.some(term=>phrase(text,term))){
   // Equipment is scoped to this exercise phrase, never a neighbouring exercise.
   for(const [index,id]of groupIds245(group,text,eligible).entries())add(id,80-index);
  }
 }
 return [...found.values()].sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id)).map(x=>x.item);
}

export function requiredExerciseGroups245(eligible,request){
 const groups=[],seen=new Set(),available=new Set(eligible.map(x=>x.id));
 const add=ids=>{ids=ids.filter(id=>available.has(id));const key=[...ids].sort().join('|');if(ids.length&&!seen.has(key)){groups.push(ids);seen.add(key);}};
 const raw=String(request||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 // Conservative extraction: historical/negative/conditional mentions are not obligations.
 for(const clause of raw.split(/[.;\n]|\b(?:pero|aunque)\b/)){
  if(/\b(no|sin|evita|evitar|quita|quitar|excluye|hice|hacia|ayer|antes|solia|dolor|lesion|si)\b/.test(clause))continue;
  if(!/\b(quiero|incluye|incluir|anade|anadir|pon|poner|haz|hacer|necesito|entrenar|entrenamiento)\b/.test(clause)&&!/\b(?:hoy|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(clause))continue;
  for(const text of requestParts245(clause)){
   const exact=exactMentions245(eligible,text);
   for(const group of exerciseGroups245)if(group.terms.some(term=>phrase(text,term))){const precise=group.ids.filter(id=>exact.includes(id));add(precise.length?precise:groupIds245(group,text,eligible));}
   for(const id of exact)if(!groups.some(group=>group.includes(id)))add([id]);
  }
 }
 return groups;
}
