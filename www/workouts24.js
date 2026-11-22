/* Server-owned weekly proposals. Opening an exercise never creates a diary row. */
let workoutSelectedWeek24='';
function workoutNextWeek24(){const d=new Date(monday21()+'T12:00:00');d.setDate(d.getDate()+7);return day(d);}
function workoutWeek24(){return workoutSelectedWeek24||(new Date().getDay()===0?workoutNextWeek24():monday21());}
function workoutSelectWeek24(value){workoutAccount24();if(![monday21(),workoutNextWeek24()].includes(value)||value===workoutWeek24())return;clearTimeout(workoutTimer24);workoutTimer24=null;workoutSelectedWeek24=value;workoutPlan24=null;workoutJob24=null;workoutLoaded24=false;workoutRequest24='';workoutStale24=false;workoutAccepted24='';workoutScheduled24='';workoutError24='';workoutRetry24=0;render();loadWorkouts24();}
let workoutOwner24='',workoutToken24='',workoutState24=null,workoutPlan24=null,workoutRequest24='',workoutStale24=false,workoutError24='',workoutJob24=null,workoutLoaded24=false,workoutTimer24=null,workoutScheduled24='',workoutAccepted24='',workoutRetry24=0;
function workoutAccount24(){const owner=sessionStorage.veraUser||'',token=sessionStorage.veraToken||'';if(owner!==workoutOwner24||token!==workoutToken24||s!==workoutState24){clearTimeout(workoutTimer24);workoutOwner24=owner;workoutToken24=token;workoutState24=s;workoutSelectedWeek24='';workoutPlan24=null;workoutRequest24='';workoutStale24=false;workoutError24='';workoutJob24=null;workoutLoaded24=false;workoutScheduled24='';workoutAccepted24='';workoutRetry24=0;}}
function workoutReady24(){return validSession&&!!sessionStorage.veraToken&&(typeof accountReady22==='undefined'||accountReady22)&&typeof googleLinked23==='function'&&googleLinked23()&&typeof healthAccess23==='function'&&healthAccess23().complete===true&&s.profile?.introduced&&s.profile.goal&&s.profile.level&&Number(s.profile.days)>=1;}
function workoutSignature24(){
 const week=workoutWeek24(),since=new Date(Date.parse(week+'T12:00:00Z')-42*86400000).toISOString().slice(0,10),until=new Date(Date.parse(week+'T12:00:00Z')+6*86400000).toISOString().slice(0,10);
 const keys=['goal','criteria','likes','age','level','days','time','eq','introduced'];
 const recordKeys=['id','kind','date','exercise','kg','enteredKg','loadMode','loadSchema','mode','reps','rir','trainingNote','note','value','minutes','sore','tired','muscle'];
 const records=s.logs.filter(r=>['Entrenamiento','Sueño','Sensaciones','Cardio','Peso en ayunas','Otro pesaje'].includes(r.kind)&&r.date>=since&&r.date<=until).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.id).localeCompare(String(b.id))).slice(0,80).map(r=>Object.fromEntries(recordKeys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])));
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
 return JSON.stringify(stable({week,profile:Object.fromEntries(keys.map(k=>[k,s.profile[k]])),gym:s.gym,machines:s.machines,need:s.need,records}));
}
async function loadWorkouts24(){workoutAccount24();if(!workoutReady24()||workoutJob24)return;return runWorkout24(true);}
async function runWorkout24(readOnly=false,request){
 workoutAccount24();if(!workoutReady24()||workoutJob24)return false;if(!readOnly&&!VeraPrivacy6.allowed('cloud')){msg('Permite el análisis remoto en Perfil para generar tu tabla.');return false;}
 const job={owner:workoutOwner24,token:workoutToken24,state:s,week:workoutWeek24(),signature:workoutSignature24(),privacy:VeraPrivacy6.revision};workoutJob24=job;workoutError24='';
 const current=()=>sameVeraSession(job.owner,job.token,job.state)&&validSession&&workoutJob24===job;
 try{
  if(!readOnly){const confirmed=await VeraJournal.flush();if(!current())return false;if(!confirmed)throw Error('Confirma el guardado pendiente antes de generar una tabla con tus datos.');if(!VeraPrivacy6.allowed('cloud')||job.privacy!==VeraPrivacy6.revision)return false;}
  const response=await api('workouts/weekly',{week:workoutWeek24(),...(readOnly?{readOnly:true}:{}),...(request!==undefined?{request}:{})});
  if(!current()||!readOnly&&(!VeraPrivacy6.allowed('cloud')||job.privacy!==VeraPrivacy6.revision))return false;
  if(response.plan&&response.plan.week!==job.week)throw Error('El servidor devolvió otra semana. Se conserva tu tabla.');workoutPlan24=response.plan;workoutRequest24=response.request||'';workoutStale24=!!response.stale;workoutLoaded24=true;
  if(job.signature===workoutSignature24()&&!response.stale)workoutAccepted24=job.signature;else workoutStale24=true;
  if(!readOnly)msg(response.plan?.status==='needs_review'?'Antes de entrenar, revisa la aclaración que necesita Vera.':'Tabla semanal preparada. Abre una sesión y registra sólo las series que realices.');
  workoutRetry24=0;return true;
 }catch(error){if(current()){workoutError24=error.message;workoutRetry24=Date.now()+Math.max(60000,Math.min(86400000,(Number(error.retryAfter)||0)*1000),Number.isFinite(Date.parse(error.resetAt))?Math.min(86400000,Date.parse(error.resetAt)-Date.now()):0);workoutLoaded24=true;if(!readOnly)msg('Conservamos tu tabla anterior. '+error.message);}return false;}
 finally{if(current()){workoutJob24=null;render();queuePlan21();}}
}
function generateWorkout24(request){workoutAccount24();const text=request===undefined?($('workoutRequest24')?.value??workoutRequest24):String(request);if(text.length>1500)return msg('Describe el cambio en hasta 1500 caracteres.');if(workoutPlan24&&!confirm('¿Preparar una nueva tabla semanal con esta petición? Se conservarán todos tus entrenamientos realizados.'))return;return runWorkout24(false,text);}
function requestWorkout24(text){go('Entrenamiento');return generateWorkout24(text);}
queuePlan21=function(){
 workoutAccount24();if(!workoutReady24()||document.hidden||workoutJob24||!VeraPrivacy6.allowed('cloud')||Date.now()<workoutRetry24)return;
 const signature=workoutSignature24();if(workoutPlan24&&signature===workoutAccepted24&&!workoutStale24)return;if(workoutScheduled24===signature&&workoutTimer24)return;
 clearTimeout(workoutTimer24);workoutScheduled24=signature;
 // Initial profile: immediate proposal. During training, wait for a quiet period;
 // a completed session can request the update explicitly, avoiding per-set calls.
 workoutTimer24=setTimeout(()=>{workoutTimer24=null;if(sameVeraSession(workoutOwner24,workoutToken24,workoutState24)&&workoutReady24()&&!document.hidden&&!workoutJob24&&VeraPrivacy6.allowed('cloud'))runWorkout24(false);},workoutPlan24?180000:1500);
};
function workoutSessionDone24(){clearTimeout(workoutTimer24);workoutTimer24=null;if(!workoutPlan24)return runWorkout24(false);if(workoutSignature24()===workoutAccepted24)return msg('La tabla ya tiene en cuenta los últimos registros.');return runWorkout24(false);}
function workoutExercise24(date,id){
 workoutAccount24();const exercise=workoutPlan24?.days.find(d=>d.date===date)?.exercises.find(e=>e.id===id);if(!exercise)return msg('La tabla ha cambiado. Vuelve a abrir la sesión.');
 const previous=exercise.previous;s.setDraft={exercise:exercise.name,kg:previous?.enteredKg??'',mode:previous?.mode||'total',reps:'',rir:'',note:'',date:day(),autoRest:true};s.restSeconds13=exercise.restSeconds;
 go('Entrenamiento');msg(exercise.sets+' series propuestas · '+exercise.reps.join('–')+' repeticiones · RIR objetivo '+exercise.rir+'. Introduce lo realizado; aún no has registrado ninguna serie.');
 const form=$('setName13');form?.scrollIntoView?.({behavior:'smooth',block:'center'});form?.focus?.();
}
function workoutPanel24(){
 workoutAccount24();if(workoutReady24()&&!workoutLoaded24&&!workoutJob24&&Date.now()>=workoutRetry24)queueMicrotask(loadWorkouts24);
 const p=workoutPlan24,sessions=p?.days.filter(d=>d.type==='training').length||0,exercises=p?.days.reduce((n,d)=>n+d.exercises.length,0)||0,recovery=p?.days.filter(d=>d.type==='rest').length||0;
 return '<section class="workout24"><div class="workout-head24"><small>TU PLAN ADAPTADO</small><h2>Una semana para ti</h2><p>Sesiones propuestas con tu perfil, material y registros confirmados.</p></div>'+(workoutJob24?'<p role="status">Preparando tu semana…</p>':'')+(workoutError24?'<p role="status">'+safe(workoutError24)+'</p>':'')+(workoutStale24?'<p class="workout-update24">Hay datos nuevos. La tabla anterior sigue visible mientras se prepara la actualización.</p>':'')+
 '<label>Semana<select onchange="workoutSelectWeek24(this.value)">'+[[monday21(),'Esta semana'],[workoutNextWeek24(),'Próxima semana']].map(([v,t])=>'<option value="'+v+'" '+(v===workoutWeek24()?'selected':'')+'>'+t+' · '+v+'</option>').join('')+'</select></label><details class="workout-request24"><summary>Adaptar mi tabla</summary><label>Qué necesitas esta semana<textarea id="workoutRequest24" maxlength="1500" placeholder="Ej. sesiones más cortas, priorizar piernas o entrenar sólo dos días">'+safe(workoutRequest24)+'</textarea></label>'+btn('Generar con mi petición','generateWorkout24()',true)+'</details>'+
 (!p?'<p>Al completar y guardar tu perfil, Vera prepara tu primera tabla con el análisis remoto permitido. No hacen falta entrenamientos previos.</p>'+btn(workoutJob24?'Preparando…':'Preparar mi semana','generateWorkout24()',true):'<div class="workout-overview24"><span><strong>'+sessions+'</strong> sesiones</span><span><strong>'+exercises+'</strong> ejercicios</span><span><strong>'+recovery+'</strong> días de recuperación</span></div>'+(p.status==='needs_review'?'<p role="status">'+safe(p.summary)+'</p>':'')+'<details><summary>Por qué esta tabla</summary><p>'+safe(p.summary)+'</p><p>'+safe(p.adaptation)+'</p><small>'+safe(p.coverage?.included??0)+' registros recientes utilizados; '+(p.coverage?.partial?'historial parcial':'sin registros omitidos dentro del periodo seleccionado')+'. Las cargas anteriores son referencias, no pesos que debas levantar.</small></details>'+p.days.map(d=>'<details class="workout-day24" '+(d.date===day()?'open':'')+'><summary><span>'+safe(d.date)+' · '+safe(d.title)+'</span><small>'+ (d.type==='training'?d.exercises.length+' ejercicios':'Recuperación')+'</small></summary><p>'+safe(d.reason)+'</p>'+d.exercises.map(e=>'<article><h3>'+safe(e.name)+'</h3><div class="workout-tags24"><span>'+e.sets+' series</span><span>'+e.reps.join('–')+' rep.</span><span>RIR '+e.rir+'</span><span>'+e.restSeconds+' s</span></div><p>'+safe(e.cue)+'</p><small>'+safe(e.progression)+'</small>'+(e.previous?'<p class="workout-previous24">Último registro: '+safe(e.previous.date)+' · '+e.previous.reps+' rep. · '+e.previous.kg+' kg '+(e.previous.mode==='assistance'?'de asistencia':'totales')+'</p>':'<p class="workout-previous24">Sin carga previa. Elige una carga cómoda sin dolor y conserva repeticiones en reserva.</p>')+btn('Preparar registro de este ejercicio',"workoutExercise24('"+d.date+"','"+e.id+"')")+'</article>').join('')+'</details>').join('')+btn('He terminado: actualizar con mis registros','workoutSessionDone24()'))+'</section>';
}
const workoutAreaBefore24=areaPage;areaPage=function(){return tab==='Entrenamiento'?workoutPanel24()+workoutAreaBefore24():workoutAreaBefore24();};
// Existing roster wrapper resolves weeklyPanel21 at call time. Replacing it
// avoids the old four-provider-call plan and leaves its historical state intact.
weeklyPanel21=function(){return workoutPanel24()+btn('Opinión sobre mi estado general','generalReview21()');};
refreshPlan21=function(){return generateWorkout24();};
setAutoPlan21=function(){queuePlan21();};
const workoutRenderBefore24=render;render=function(){workoutRenderBefore24();if(workoutReady24())queuePlan21();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){workoutAccount24();if(workoutReady24())loadWorkouts24();}});
setInterval(()=>{if(workoutReady24())queuePlan21();},30000);
