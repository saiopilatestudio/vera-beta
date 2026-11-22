/* Local state is account-bound; corrupt backups are never silently overwritten. */
let stateReadError = '';
let stateWriteError = '';
let blockedStateKey = '';
let blockedSourceKey = '';
function validateWeeklyPlanState21(value){
 if(value==null)return;
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),text=(v,max)=>typeof v==='string'&&v.length<=max;
 const date=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&Number.isFinite(+new Date(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
 const invalid=()=>{throw Error('El respaldo contiene un plan semanal no válido.');};
 if(!object(value)||!date(value.week)||!text(value.summary,4000)||!text(value.changes,4000)||!Array.isArray(value.days)||value.days.length!==7||!Array.isArray(value.reports)||value.reports.length>12||value.reports.some(r=>!object(r)||!text(r.role,100)||!text(r.text,12000)))invalid();
 const start=+new Date(value.week+'T00:00:00Z');
 for(const[i,d]of value.days.entries())if(!object(d)||d.date!==new Date(start+i*86400000).toISOString().slice(0,10)||!['training','nutrition','recovery'].every(k=>text(d[k],1500))||(d.done!==undefined&&(!object(d.done)||Object.entries(d.done).some(([k,v])=>!['training','nutrition','recovery'].includes(k)||typeof v!=='boolean'))))invalid();
 if(value.generatedAt!==undefined&&(!text(value.generatedAt,40)||!Number.isFinite(Date.parse(value.generatedAt))))invalid();
 if(value.inputSignature!==undefined&&!text(value.inputSignature,96000))invalid();
}
function validateVeraState(value) {
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  if (!object(value) || !object(value.profile) || !Array.isArray(value.logs) || !Array.isArray(value.turns)) throw Error('El respaldo no contiene un diario válido.');
  if (value.logs.some(x => !object(x) || typeof x.kind !== 'string' || typeof x.date !== 'string') || value.turns.some(x => !object(x))) throw Error('Hay registros o conversaciones con formato no válido.');
  for (const key of ['memory','machines']) if (value[key] != null && !Array.isArray(value[key])) throw Error('Formato no válido: '+key+'.');
  if (value.plan != null && typeof value.plan !== 'string') throw Error('El plan debe ser texto.');
  validateWeeklyPlanState21(value.weeklyPlan21);
  // Build fresh dictionaries to avoid inherited keys from imported JSON.
  const state = {...initial(),...value,profile:{...value.profile},memory:value.memory || []};
  state.turns = value.turns.map(t => ({...t,reports:Array.isArray(t.reports)?t.reports:[]}));
  state.diaryRevisions = Object.fromEntries(Object.entries(value.diaryRevisions || {}).filter(([key,v]) => !['__proto__','constructor','prototype'].includes(key) && object(v)));
  return state;
}
function loadVeraState(key,legacyKey='') {
  stateReadError='';stateWriteError='';blockedStateKey='';blockedSourceKey=key;
  try {
    let raw=localStorage.getItem(key);
    if(!raw&&legacyKey){raw=localStorage.getItem(legacyKey);blockedSourceKey=legacyKey;}
    return raw ? validateVeraState(JSON.parse(raw)) : initial();
  } catch {
    stateReadError='No se pudo leer el diario de este dispositivo. Se conserva intacto. Exporta la copia original desde Perfil y restaura un respaldo válido antes de guardar.';
    blockedStateKey=key;
    return initial();
  }
}
function persistVeraState() {
  if(blockedStateKey===storageKey()) { msg(stateReadError);throw Error(stateReadError); }
  try { localStorage.setItem(storageKey(),JSON.stringify(s));stateWriteError=''; }
  catch { const message='No se ha guardado: el almacenamiento del dispositivo está lleno o bloqueado. Exporta tu diario antes de cerrar la app.';stateWriteError=message;msg(message);throw Error(message); }
}
function exportOriginalState() {
  const raw=localStorage.getItem(blockedSourceKey || storageKey()) || '';
  const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='vera-diario-original-'+day()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function sameVeraSession(owner,token,state) {
  return sessionStorage.veraUser===owner && sessionStorage.veraToken===token && s===state;
}
function validateSleepInput({start,end,awake,need,sore,tired},now=Date.now()) {
  const duration=(end-start)/60000;
  if (![start,end,awake,need].every(Number.isFinite) || duration<=0 || duration>1440 || end>now+60000 || awake<0 || awake>=duration || need<4 || need>14 ||
      [sore,tired].some(x=>x!==null&&(!Number.isFinite(x)||x<0||x>10))) throw Error('Comprueba las horas, el tiempo despierto y las valoraciones.');
  return Math.round(duration-awake);
}
/* Bound the actual request before transport, not only after server parsing. */
function buildCoachPayload14(question,specialty){
 const text=value=>String(value??'');
 const query=specialty?specialty+' · '+question:question;
 if(query.length>8000)throw Error('Escribe una consulta de hasta 8000 caracteres.');
 let fieldsShortened=false;
 const clean=(value,depth=0)=>{
  if(depth>4){fieldsShortened=true;return null;}
  if(typeof value==='string'){if(value.length>1000)fieldsShortened=true;return value.slice(0,1000);}
  if(Array.isArray(value)){if(value.length>50)fieldsShortened=true;return value.slice(-50).map(v=>clean(v,depth+1));}
  if(value&&typeof value==='object'){const pairs=Object.entries(value).filter(([k])=>!/^(password|token|authorization|apiKey|api_key|secret|email|uid|userId|template)$/i.test(k));if(pairs.length>30)fieldsShortened=true;return Object.fromEntries(pairs.slice(0,30).map(([k,v])=>[k,clean(v,depth+1)]));}
  return value;
 };
 const today=day(),start=new Date();start.setDate(start.getDate()-55);const windowStart=day(start);
 const recent=s.logs.filter(row=>row.date>=windowStart&&row.date<=today).sort((a,b)=>a.date.localeCompare(b.date));
 const profileKeys=['name','goal','criteria','likes','age','height','weight','level','days','time','eq','introduced'];
 const logKeys=['id','kind','date','note','value','exercise','reps','kg','enteredKg','loadMode','loadSchema','mode','trainingNote','rir','rpe','group','sore','tired','start','end','minutes','awakeMinutes','restType','protein','carbs','fat','nutrients','healthKey','healthType','healthSource','source','unit','amount','productName','gym','machine','rom','effort','pump','soreness','reference'];
 const memories=activeMem(),matchingMachines=(s.machines||[]).filter(m=>m.gym===s.gym);
 if(memories.length>20||memories.some(v=>text(v).length>500)||matchingMachines.length>10||text(s.plan).length>4000||s.turns.length>4||s.turns.slice(-4).some(t=>text(t.question).length>1200||text(t.answer).length>1800))fieldsShortened=true;
 const payload={
  question:query,
  profile:clean(Object.fromEntries(profileKeys.filter(k=>Object.hasOwn(s.profile,k)).map(k=>[k,s.profile[k]]))),
  memory:memories.slice(-20).map(v=>text(v).slice(0,500)),
  gym:text(s.gym).slice(0,500),equipment:clean((s.gyms||{})[s.gym]||[]),
  machines:clean(matchingMachines.slice(-10)),
  recovery:clean(readiness()),
  logs:recent.slice(-120).map(row=>clean(Object.fromEntries(logKeys.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]])))),
  nutritionCoverage:coverage(),currentPlan:text(s.plan).slice(0,4000),
  history:s.turns.slice(-4).map(t=>({question:text(t.question).slice(0,1200),answer:text(t.answer).slice(0,1800)})),
  today,
  contextCoverage:{total:recent.length,included:0,desde:null,hasta:null,windowStart,windowEnd:today,truncated:false,fieldsShortened:false}
 };
 if(typeof metricsSummary21==='function'){
  const summary=metricsSummary21(s.logs,28);
  payload.nutritionSummary21={method:'media entre fuentes por día; no suma',coverage:{days:summary.days,since:summary.since,today:summary.today,mealDays:summary.mealDays,meals:summary.meals,sources:summary.sources,weightSources:summary.weightSources},nutrition:summary.nutrition,weightAverage:summary.weightAverage,weightChange:summary.weightChange};
 }
 const updateCoverage=()=>Object.assign(payload.contextCoverage,{included:payload.logs.length,desde:payload.logs[0]?.date||null,hasta:payload.logs.at(-1)?.date||null,truncated:payload.logs.length<recent.length,fieldsShortened});
 const bytes=()=>new TextEncoder().encode(JSON.stringify(payload)).length;
 updateCoverage();
 // Leave headroom for envelope changes and the server's 100 KB context ceiling.
 for(const key of ['machines','history','memory','logs']){
  while(bytes()>90000&&payload[key].length){payload[key].shift();fieldsShortened=true;updateCoverage();}
 }
 if(bytes()>90000){payload.equipment=[];fieldsShortened=true;updateCoverage();}
 if(bytes()>90000)throw Error('El contexto es demasiado grande. Acorta la consulta o las preferencias y vuelve a intentarlo.');
 return payload;
}
function contextCoverage14(turn){
 const c=turn.contextCoverage;
 if(!c||!Number.isInteger(c.total)||!Number.isInteger(c.included))return '';
 return '<p class="contextCoverage14"><small>Registros de este dispositivo enviados: '+c.included+' de '+c.total+' en el período '+safe(c.windowStart)+'–'+safe(c.windowEnd)+'.'+(c.truncated?' Contexto parcial: esta respuesta no analiza todo ese historial.':'')+(c.fieldsShortened?' Algunos detalles se han acortado para esta consulta.':'')+'</small></p>';
}

function clearSessionMedia14(){
 VeraSpeech14.stop();
 if(recording?.state==='recording')recording.stop();
 photoData='';attached=null;machinePhoto='';machinePlate='';machineDraft=null;draft=null;++machineRevision;
}

/* Remote Spanish audio is explicit, cancellable, and bound to the initiating account. */
const VeraSpeech14={
 generation:0,controller:null,audio:null,url:null,
 stop(){this.generation++;this.controller?.abort();this.controller=null;if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load?.();this.audio=null;}if(this.url){URL.revokeObjectURL(this.url);this.url=null;}const target=$('speechPlayer14');if(target)target.innerHTML='';},
 async play(){if(!this.audio)return;try{await this.audio.play();}catch{msg('No se pudo iniciar la reproducción. Pulsa el control de audio y comprueba el volumen multimedia del móvil.');}},
 async speak(index){
  this.stop();const generation=this.generation,owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s,revision=VeraPrivacy6.revision;
  const text=String(s.turns[index]?.answer||'').trim();if(!text)return;
  this.controller=new AbortController();const signal=this.controller.signal;
  const current=()=>generation===this.generation&&validSession&&sameVeraSession(owner,token,state)&&revision===VeraPrivacy6.revision&&VeraPrivacy6.allowed('cloud');
  const target=$('speechPlayer14');if(!target)return;
  target.innerHTML='<p>Preparando audio en español con Gemini…</p>'+btn('Cancelar audio','VeraSpeech14.stop()');
  target.scrollIntoView?.({block:'center',behavior:'smooth'});
  try{
   const blob=await api('speak',{text:text.slice(0,3500)},true,{signal});
   if(!current())return;
   if(!['audio/wav','audio/x-wav'].includes(blob.type.split(';')[0]))throw Error('El servidor no devolvió audio WAV válido.');
   const player=$('speechPlayer14');if(!player){this.stop();return;}
   this.url=URL.createObjectURL(blob);this.audio=document.createElement('audio');this.audio.controls=true;this.audio.preload='auto';this.audio.src=this.url;
   this.audio.setAttribute('aria-label','Respuesta de Vera en español, generada por Gemini');
   this.audio.onplay=()=>{if(!current())this.stop();};
   this.audio.onerror=()=>{if(current())msg('El audio no se pudo reproducir. Vuelve a generar la voz y comprueba el volumen multimedia.');};
   player.innerHTML='<p>Audio preparado en español. Pulsa reproducir.'+(text.length>3500?' Se leen los primeros 3500 caracteres.':'')+'</p>'+btn('▶ Reproducir voz','VeraSpeech14.play()',true)+btn('Cerrar audio','VeraSpeech14.stop()');player.append(this.audio);player.scrollIntoView?.({block:'center',behavior:'smooth'});
  }catch(e){if(generation===this.generation&&!signal.aborted){this.stop();const player=$('speechPlayer14');if(player){player.innerHTML='<p role="alert">'+safe(e.message)+'</p>'+btn('Reintentar voz','VeraSpeech14.speak('+index+')');player.scrollIntoView?.({block:'center'});}msg(e.message);}}
 }
};
