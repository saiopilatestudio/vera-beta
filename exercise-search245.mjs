import {readFile} from 'node:fs/promises';
import {ServiceError} from './ai-provider.mjs';
import {availableEquipment245,eligibleExercises245,resolveExercises245} from './exercise-candidates245.mjs';
const catalog=JSON.parse(await readFile(new URL('./www/exercises.json',import.meta.url),'utf8'));
const invalid=()=>new ServiceError('Escribe el nombre de un ejercicio (2 a 100 caracteres).',422,'EXERCISE_SEARCH_INPUT');
export function validateExerciseSearch245(input){
 if(!input||typeof input.query!=='string'||input.query.trim().length<2||input.query.length>100||/[\u0000-\u001f<>]/.test(input.query)||!['catalog','web'].includes(input.source))throw invalid();
 return input.query.trim();
}
export function createExerciseSearch245({fetchImpl=fetch}={}){
 const cache=new Map(),attempts=new Map();
 return async function(input,{context,uid='test'}={}){
  const query=validateExerciseSearch245(input),availableEquipment=availableEquipment245(context);
  if(input.source==='catalog')return {source:'catalog',...resolveExercises245(eligibleExercises245(catalog,context),query),availableEquipment};
  const now=Date.now(),key=query.toLocaleLowerCase('es'),cached=cache.get(key);
  if(cached&&now-cached.at<600000)return {...cached.value,availableEquipment};
  for(const[id,value]of attempts)if(now-value.at>60000)attempts.delete(id);
  const attempt=attempts.get(uid)||{at:now,n:0};
  if(attempt.n>=12||attempts.size>=2000&&!attempts.has(uid))throw new ServiceError('Demasiadas búsquedas. Espera un minuto; puedes añadir el ejercicio manualmente.',429,'EXERCISE_SEARCH_LIMIT',60);
  attempt.n++;attempts.set(uid,attempt);
  // Only the explicit exercise-name query leaves the server, never profile or diary.
  const url=new URL('https://es.wikipedia.org/w/api.php');
  url.search=new URLSearchParams({action:'query',list:'search',srsearch:query+' ejercicio',srnamespace:'0',srlimit:'10',srprop:'snippet',format:'json',formatversion:'2'}).toString();
  try{
   const response=await fetchImpl(url.href,{headers:{Accept:'application/json','User-Agent':'VERA/2.4 (exercise reference lookup)'},redirect:'error',signal:AbortSignal.timeout(8000)});
   if(!response.ok){await response.body?.cancel();throw Error('upstream');}
   if(Number(response.headers.get('content-length'))>250000){await response.body?.cancel();throw Error('size');}
   const reader=response.body?.getReader();if(!reader)throw Error('body');let size=0;const chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>250000){await reader.cancel();throw Error('size');}chunks.push(value);}}finally{reader.releaseLock();}
   const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!Array.isArray(data?.query?.search))throw Error('shape');
   const plain=text=>String(text||'').replace(/<[^>]*>/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   const terms=plain(query).split(/[^a-z0-9]+/).filter(x=>x.length>=3&&!['con','del','para','los','las'].includes(x));
   const results=data.query.search.filter(x=>Number.isSafeInteger(x.pageid)&&x.pageid>0&&typeof x.title==='string'&&x.title.length<=200).filter(x=>{const text=plain(x.title+' '+String(x.snippet||'').slice(0,4000));return terms.some(t=>text.includes(t))&&/ejercicio|muscul|entrenamiento|gimnas|halterofilia|levantamiento|culturismo|calistenia|sentadilla|press de banca/.test(text);}).slice(0,5).map(x=>({title:x.title,url:'https://es.wikipedia.org/?curid='+x.pageid,source:'Wikipedia (es)'}));
   const value={source:'Wikipedia (es)',status:results.length?'references':'unknown',results};
   if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(key,{at:now,value});return {...value,availableEquipment};
  }catch{throw new ServiceError('La búsqueda web no está disponible. Puedes consultar el catálogo o confirmar el ejercicio manualmente.',503,'EXERCISE_SEARCH_UNAVAILABLE');}
 };
}
export const searchExercises245=createExerciseSearch245();
