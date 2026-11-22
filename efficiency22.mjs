import {ServiceError} from './ai-provider.mjs';
import {cleanContext} from './request-safety.mjs';

// Deterministic context selection only: no model, no invented summaries.
// Caller must first validate with coachInput and scope confirmed rows by UID.
export function compactContext22(input,{maxBytes=8000,maxRecords=24}={}){
 const src={...cleanContext(input),question:input.question},out={question:src.question,mode:src.mode||'standard'};
 const bytes=x=>Buffer.byteLength(JSON.stringify(x));
 if(!Number.isInteger(maxBytes)||maxBytes<4000||maxBytes>50000)throw new TypeError('Context budget out of range');
 for(const key of ['profile','date','today','timezone','contextNotice'])if(src[key]!==undefined)out[key]=src[key];
 const coverage={selection:'most_recent_within_budget',completeHistory:false,omittedFields:[],confirmed:{available:0,included:0},client:{available:0,included:0,duplicatesRemoved:0}};
 out.selectionCoverage22=coverage;
 if(bytes(out)>maxBytes-800)throw new ServiceError('El perfil y la consulta superan el contexto disponible. Acorta la consulta o los textos del perfil sin eliminar tus restricciones.',413,'CONTEXT_TOO_LARGE');
 // Priority: explicit memory and active setting; entire profile above is preserved.
 function add(key,value,budget){
  if(value===undefined)return;
  if(bytes(value)>budget||bytes({...out,[key]:value})>maxBytes-800){coverage.omittedFields.push(key);return;}
  out[key]=value;
 }
 for(const [key,limit]of [['memory',1600],['gym',800],['equipment',1000],['machines',1000],['recovery',1000],['nutritionSummary21',1600],['nutritionCoverage',600],['currentPlan',2400],['plan',2400]])add(key,src[key],limit);
 const sort=rows=>(Array.isArray(rows)?rows:[]).filter(r=>r&&typeof r==='object').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const confirmed=sort(src.confirmedContext),client=sort(src.logs),serverIds=new Set(confirmed.map(r=>r.id).filter(Boolean));
 coverage.confirmed.available=confirmed.length;coverage.client.available=client.length;
 function addRows(key,rows,stats,skip){
  out[key]=[];const seen=new Set();
  for(const row of rows){
   if(row.id&&(seen.has(row.id)||skip?.has(row.id))){if('duplicatesRemoved'in stats)stats.duplicatesRemoved++;continue;}
   if(row.id)seen.add(row.id);
   if(out[key].length>=maxRecords)continue;
   // Omit oversized rows intact; never silently cut a symptom or restriction.
   if(bytes({...out,[key]:[...out[key],row]})>maxBytes-600)continue;
   out[key].push(row);
  }
  stats.included=out[key].length;
  stats.since=out[key].length?out[key].at(-1).date||null:null;
  stats.until=out[key].length?out[key][0].date||null:null;
 }
 addRows('confirmedContext',confirmed,coverage.confirmed);
 addRows('logs',client,coverage.client,serverIds);
 for(const key of ['history','turns']){
  if(Array.isArray(src[key])){const recent=src[key].slice(-4);add(key,recent,1800);if(src[key].length>recent.length)coverage.omittedFields.push(key+'.older');}
  else add(key,src[key],1200);
 }
 for(const key of ['context','contextCoverage','confirmedContextCoverage'])add(key,src[key],1000);
 for(const key of Object.keys(src))if(!(key in out)&&!coverage.omittedFields.includes(key))coverage.omittedFields.push(key);
 if(bytes(out)>maxBytes)throw new ServiceError('El contexto seleccionado supera el límite.',413,'CONTEXT_TOO_LARGE');
 return out;
}
