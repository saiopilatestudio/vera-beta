/* Server-owned weekly proposals. Opening an exercise never creates a diary row. */
let workoutSelectedWeek24='';
const workoutDrafts24=new Map(),workoutOptions24=new Map(),workoutExerciseDrafts24=new Map();
function workoutOptionsValue24(){return workoutOptions24.get(workoutWeek24())||{editDate:'',trainingDays:''};}
function workoutChangeOptions24(key,value){
 workoutAccount24();const options={...workoutOptionsValue24()};
 if(key==='editDate'){if(value&&!workoutPlan24?.days.some(d=>d.date===value))return;options.editDate=value;}
 else if(key==='trainingDays'){if(value!==''&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>7))return;options.trainingDays=value;}
 else return;
 workoutOptions24.set(workoutWeek24(),options);render();
}
function workoutCheckWeek24(plan,week,trainingDays){
 const dates=Array.from({length:7},(_,i)=>{const d=new Date(week+'T12:00:00');d.setDate(d.getDate()+i);return day(d);});
 if(!plan||plan.week!==week||!Array.isArray(plan.days)||plan.days.length!==7||plan.days.some((d,i)=>d.date!==dates[i]))throw Error('El servidor no devolvió los siete días de la semana solicitada. No se aplica esta respuesta en pantalla.');
 if(trainingDays!==undefined&&plan.status==='ready'&&plan.days.filter(d=>d.type==='training').length!==Number(trainingDays))throw Error('La tabla no contiene el número de sesiones solicitado. No se aplica esta respuesta en pantalla.');
}
const workoutEquipment245={'body only':'Sin material / peso corporal',dumbbell:'Mancuernas',barbell:'Barra',cable:'Polea',machine:'Máquina',kettlebells:'Pesas rusas',bands:'Bandas elásticas','medicine ball':'Balón medicinal','exercise ball':'Pelota de ejercicio','e-z curl bar':'Barra Z'};
function workoutExerciseDraft245(){
 const week=workoutWeek24();if(!workoutExerciseDrafts24.has(week))workoutExerciseDrafts24.set(week,{query:'',results:[],source:'',message:'',busy:false,ticket:0,name:'',equipment:'',repetitions:false,labels:{}});
 return workoutExerciseDrafts24.get(week);
}
function workoutExerciseField245(key,value){workoutAccount24();if(!['query','name','equipment','repetitions'].includes(key))return;const draft=workoutExerciseDraft245();draft[key]=key==='repetitions'?value===true:String(value).slice(0,100);}
function workoutExerciseIds245(){const draft=workoutExerciseDraft245();return draft.exerciseIds??workoutPlan24?.exerciseIds??[];}
function workoutCustomExercises245(){const draft=workoutExerciseDraft245();return draft.customExercises??workoutPlan24?.customExercises??[];}
function workoutExercisePayload24(){const draft=workoutExerciseDraft245();return {...(draft.exerciseIds!==undefined?{exerciseIds:[...draft.exerciseIds]}:{}),...(draft.customExercises!==undefined?{customExercises:draft.customExercises.map(e=>({name:e.name,equipment:e.equipment,measurement:'repetitions'}))}:{})};}
async function workoutSearchExercises245(source){
 workoutAccount24();if(!['catalog','web'].includes(source))return;
 const draft=workoutExerciseDraft245(),query=String($('workoutExerciseQuery245')?.value??draft.query).trim();draft.query=query;
 if(query.length<2||query.length>100)return msg('Escribe un nombre de ejercicio de entre 2 y 100 caracteres.');
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s,week=workoutWeek24(),ticket=++draft.ticket;
 const current=()=>sameVeraSession(owner,token,state)&&validSession&&workoutWeek24()===week&&workoutExerciseDrafts24.get(week)===draft&&draft.ticket===ticket;
 draft.busy=true;draft.results=[];draft.message='';render();
 try{
  const response=await api('exercises/search',{query,source,week});if(!current())return;
  if(source==='catalog'&&Array.isArray(response.availableEquipment))draft.availableEquipment=response.availableEquipment.filter(e=>Object.hasOwn(workoutEquipment245,e));
  draft.source=source;draft.resultQuery=query;draft.results=Array.isArray(response.results)?response.results.slice(0,30):[];
  draft.message=source==='web'?'Referencias informativas de Wikipedia en español. No verifican la técnica ni la idoneidad del ejercicio.':response.status==='ambiguous'?'Hay varias variantes. Elige el material y la variante exactos.':'Catálogo compatible con tu perfil y material confirmado.';
  if(!draft.results.length)draft.message+=' Sin coincidencias. Puedes describir un ejercicio propio y confirmar sus datos.';
 }catch(e){if(current())draft.message=e.message+' Puedes seguir con la entrada manual.';}
 finally{if(draft.ticket===ticket){draft.busy=false;if(current())render();}}
}
function workoutChooseExercise245(index){
 workoutAccount24();const draft=workoutExerciseDraft245(),item=draft.results[index];if(!item)return;
 if(draft.source==='web'){
  draft.name=String(item.title||'').slice(0,100);draft.equipment='';draft.repetitions=false;draft.message='Referencia elegida. Revisa el nombre y confirma material y registro por repeticiones antes de añadirlo.';render();return;
 }
 const ids=workoutExerciseIds245();if(!item.id||ids.includes(item.id))return;if(ids.length>=12)return msg('Puedes seleccionar hasta 12 ejercicios del catálogo.');
 draft.exerciseIds=[...ids,item.id];draft.labels[item.id]=item.name||item.title;render();msg('Variante seleccionada para la próxima propuesta. No se ha registrado actividad.');
}
function workoutAddCustom245(){
 workoutAccount24();const draft=workoutExerciseDraft245(),name=draft.name.trim(),equipment=draft.equipment;
 if(name.length<2||name.length>100||!Object.hasOwn(workoutEquipment245,equipment)||draft.availableEquipment&&!draft.availableEquipment.includes(equipment)||draft.repetitions!==true)return msg('Revisa el nombre, elige el material y confirma que el ejercicio se registra por repeticiones.');
 const rows=workoutCustomExercises245();if(rows.length>=12)return msg('Puedes declarar hasta 12 ejercicios propios.');
 if(rows.some(e=>e.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')&&e.equipment===equipment))return msg('Este ejercicio ya está confirmado.');
 draft.customExercises=[...rows,{name,equipment,measurement:'repetitions'}];draft.name='';draft.equipment='';draft.repetitions=false;render();msg('Ejercicio propio confirmado para la próxima propuesta. No se han guardado series ni cargas.');
}
function workoutRemoveExercise245(kind,index){workoutAccount24();const draft=workoutExerciseDraft245();if(kind==='catalog')draft.exerciseIds=workoutExerciseIds245().filter((_,i)=>i!==index);else if(kind==='custom')draft.customExercises=workoutCustomExercises245().filter((_,i)=>i!==index);render();}
function workoutReferenceUrl245(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='es.wikipedia.org'?url.href:'';}catch{return '';}}
function workoutExercisePanel245(){
 const draft=workoutExerciseDraft245(),ids=workoutExerciseIds245(),custom=workoutCustomExercises245();
 const title=id=>draft.labels[id]||(typeof VeraExerciseNames22==='object'?VeraExerciseNames22[id]:null)||exerciseRows.find(e=>e.id===id)?.name||'Ejercicio del catálogo';
 return '<details '+(draft.query||draft.name||ids.length||custom.length?'open':'')+'><summary>Elegir ejercicios o añadir uno propio</summary><p>Seleccionar ejercicios prepara una petición; no registra entrenamiento. La propuesta debe respetar el material disponible y tus restricciones.</p>'+field('workoutExerciseQuery245','Buscar nombre o variante',draft.query,'search','maxlength="100" oninput="workoutExerciseField245(\'query\',this.value)"')+btn('Buscar en mi catálogo','workoutSearchExercises245(\'catalog\')')+btn('Buscar referencia en la web','workoutSearchExercises245(\'web\')')+'<small>La búsqueda web envía sólo el nombre escrito a Wikipedia, sin tu perfil ni diario. Se inicia únicamente al pulsar el botón.</small>'+(draft.busy?'<p role="status">Buscando referencias…</p>':'')+(draft.message?'<p role="status">'+safe(draft.message)+'</p>':'')+(draft.results.length?'<p>Resultados para «'+safe(draft.resultQuery)+'»</p>':'')+draft.results.map((item,i)=>{
  const url=draft.source==='web'?workoutReferenceUrl245(item.url):'';
  return '<article><strong>'+safe(item.name||item.title)+'</strong><p>'+safe(draft.source==='web'?item.source||'Wikipedia (es)':workoutEquipment245[item.equipment]||item.equipment||'Sin material')+'</p>'+(url?'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">Consultar origen: Wikipedia</a>':'')+btn(draft.source==='web'?'Usar nombre y revisar datos':'Elegir esta variante','workoutChooseExercise245('+i+')')+'</article>';
 }).join('')+(ids.length?'<h4>Variantes seleccionadas</h4>'+ids.map((id,i)=>'<p>'+safe(title(id))+btn('Quitar variante','workoutRemoveExercise245(\'catalog\','+i+')')+'</p>').join(''):'')+'<h4>Ejercicio propio</h4>'+field('workoutCustomName245','Nombre y variante',draft.name,'text','maxlength="100" oninput="workoutExerciseField245(\'name\',this.value)"')+'<label>Material (debe estar disponible en tu perfil)<select onchange="workoutExerciseField245(\'equipment\',this.value)"><option value="">Elige el material</option>'+Object.entries(workoutEquipment245).filter(([value])=>!draft.availableEquipment||draft.availableEquipment.includes(value)).map(([value,label])=>'<option value="'+value+'" '+(draft.equipment===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label><label><input type="checkbox" '+(draft.repetitions?'checked':'')+' onchange="workoutExerciseField245(\'repetitions\',this.checked)"> Confirmo que se registra por repeticiones, no por segundos ni duración.</label>'+btn('Confirmar ejercicio propio','workoutAddCustom245()')+'<small>Esta confirmación identifica el ejercicio y su material; no certifica su técnica. Las series y repeticiones propuestas se revisan después.</small>'+custom.map((e,i)=>'<p>'+safe(e.name)+' · '+safe(workoutEquipment245[e.equipment]||e.equipment)+' · por repeticiones'+btn('Quitar ejercicio propio','workoutRemoveExercise245(\'custom\','+i+')')+'</p>').join('')+'</details>';
}
function workoutDraftInput24(value){workoutAccount24();workoutDrafts24.set(workoutWeek24(),String(value).slice(0,1500));}
function workoutDraftValue24(){return workoutDrafts24.has(workoutWeek24())?workoutDrafts24.get(workoutWeek24()):workoutRequest24;}

function workoutNextWeek24(){const d=new Date(monday21()+'T12:00:00');d.setDate(d.getDate()+7);return day(d);}
function workoutWeek24(){return workoutSelectedWeek24||(new Date().getDay()===0?workoutNextWeek24():monday21());}
function workoutSelectWeek24(value){workoutAccount24();if(![monday21(),workoutNextWeek24()].includes(value)||value===workoutWeek24())return;clearTimeout(workoutTimer24);workoutTimer24=null;workoutSelectedWeek24=value;workoutPlan24=null;workoutJob24=null;workoutLoaded24=false;workoutRequest24='';workoutStale24=false;workoutAccepted24='';workoutScheduled24='';workoutError24='';workoutRetry24=0;render();loadWorkouts24();}
let workoutOwner24='',workoutToken24='',workoutState24=null,workoutPlan24=null,workoutRequest24='',workoutStale24=false,workoutError24='',workoutJob24=null,workoutLoaded24=false,workoutTimer24=null,workoutScheduled24='',workoutAccepted24='',workoutRetry24=0;
function workoutAccount24(){const owner=sessionStorage.veraUser||'',token=sessionStorage.veraToken||'';if(owner!==workoutOwner24||token!==workoutToken24||s!==workoutState24){clearTimeout(workoutTimer24);workoutOwner24=owner;workoutToken24=token;workoutState24=s;workoutDrafts24.clear();workoutOptions24.clear();workoutExerciseDrafts24.clear();workoutSelectedWeek24='';workoutPlan24=null;workoutRequest24='';workoutStale24=false;workoutError24='';workoutJob24=null;workoutLoaded24=false;workoutScheduled24='';workoutAccepted24='';workoutRetry24=0;}}
function workoutReady24(){return validSession&&!!sessionStorage.veraToken&&(typeof accountReady22==='undefined'||accountReady22)&&typeof googleLinked23==='function'&&googleLinked23()&&typeof healthAccess23==='function'&&healthAccess23().complete===true&&s.profile?.introduced&&s.profile.goal&&s.profile.level&&Number(s.profile.days)>=1;}
function workoutSignature24(){
 const week=workoutWeek24(),since=new Date(Date.parse(week+'T12:00:00Z')-42*86400000).toISOString().slice(0,10),until=new Date(Date.parse(week+'T12:00:00Z')+6*86400000).toISOString().slice(0,10);
 const keys=['goal','criteria','likes','age','level','days','time','eq','introduced'];
 const recordKeys=['id','kind','date','exercise','kg','enteredKg','loadMode','loadSchema','mode','reps','rir','trainingNote','note','value','minutes','sore','tired','muscle'];
 const records=s.logs.filter(r=>['Entrenamiento','Sueño','Sensaciones','Cardio','Peso en ayunas','Otro pesaje'].includes(r.kind)&&r.date>=since&&r.date<=until).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.id).localeCompare(String(b.id))).map(r=>Object.fromEntries(recordKeys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])));
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
 return JSON.stringify(stable({week,profile:Object.fromEntries(keys.map(k=>[k,s.profile[k]])),gym:s.gym,machines:s.machines,need:s.need,records}));
}
async function loadWorkouts24(){workoutAccount24();if(!workoutReady24()||workoutJob24)return;return runWorkout24(true);}
async function runWorkout24(readOnly=false,request,options={}){
 workoutAccount24();if(!workoutReady24()||workoutJob24)return false;if(!readOnly&&!VeraPrivacy6.allowed('cloud')){msg('Permite el análisis remoto en Perfil para generar tu tabla.');return false;}
 if(!readOnly&&options.editDate&&(!request?.trim()||!workoutPlan24?.days.some(d=>d.date===options.editDate))){msg('Selecciona un día de la tabla actual y describe el cambio.');return false;}
 const job={readOnly,editDate:!readOnly?options.editDate||'':'',owner:workoutOwner24,token:workoutToken24,state:s,week:workoutWeek24(),signature:workoutSignature24(),privacy:VeraPrivacy6.revision};let settle;job.done=new Promise(resolve=>{settle=resolve;});workoutJob24=job;workoutError24='';
 const current=()=>sameVeraSession(job.owner,job.token,job.state)&&validSession&&workoutJob24===job;
 try{
  if(!readOnly){const confirmed=await VeraJournal.flush();if(!current())return false;if(!confirmed)throw Error('Confirma el guardado pendiente antes de generar una tabla con tus datos.');if(!VeraPrivacy6.allowed('cloud')||job.privacy!==VeraPrivacy6.revision)return false;}
  const response=await api('workouts/weekly',{week:job.week,...(readOnly?{readOnly:true}:{}),...(request!==undefined?{request}:{}),...(!readOnly&&options.editDate!==undefined?{editDate:job.editDate}:{}),...(!readOnly&&options.trainingDays!==undefined?{trainingDays:options.trainingDays}:{}),...(!readOnly&&options.exerciseIds!==undefined?{exerciseIds:options.exerciseIds}:{}),...(!readOnly&&options.customExercises!==undefined?{customExercises:options.customExercises}:{})});
  if(!current()||!readOnly&&(!VeraPrivacy6.allowed('cloud')||job.privacy!==VeraPrivacy6.revision))return false;
  if(!readOnly&&!response.plan)throw Error('El servidor no devolvió una tabla. Conservamos la anterior.');
  if(response.plan)workoutCheckWeek24(response.plan,job.week,options.trainingDays);
  if(response.plan&&response.plan.week!==job.week)throw Error('El servidor devolvió otra semana. Se conserva tu tabla.');workoutPlan24=response.plan;workoutRequest24=response.request||'';workoutStale24=!!response.stale;workoutLoaded24=true;
  if(job.signature===workoutSignature24()&&!response.stale&&(!readOnly||!VeraJournal.pending()))workoutAccepted24=job.signature;else workoutStale24=true;
  if(!readOnly)msg(response.plan?.status==='needs_review'?'Antes de entrenar, revisa la aclaración que necesita Vera.':response.cached?'Se ha recuperado la tabla guardada; no se ha generado otra.':job.editDate?'Semana reajustada tomando como referencia el '+job.editDate+'. Revisa todas las sesiones propuestas.':'Tabla semanal preparada. Abre una sesión y registra sólo las series que realices.');
  workoutRetry24=0;return true;
 }catch(error){if(current()){workoutError24=error.message;workoutRetry24=Date.now()+Math.max(60000,Math.min(86400000,(Number(error.retryAfter)||0)*1000),Number.isFinite(Date.parse(error.resetAt))?Math.min(86400000,Date.parse(error.resetAt)-Date.now()):0);workoutLoaded24=true;if(!readOnly)msg((workoutPlan24?'Sigue visible tu tabla anterior. ':'No se ha podido generar tu tabla. ')+error.message);}return false;}
 finally{settle();if(current()){workoutJob24=null;render();queuePlan21();}}
}
function generateWorkout24(request){
 workoutAccount24();const text=request===undefined?($('workoutRequest24')?.value??workoutDraftValue24()):String(request),selected=workoutOptionsValue24();
 if(text.length>1500)return msg('Describe el cambio en hasta 1500 caracteres.');
 const options={editDate:selected.editDate||'',...(selected.trainingDays!==''?{trainingDays:Number(selected.trainingDays)}:{}),...workoutExercisePayload24()};
 if(options.editDate&&(!text.trim()||!workoutPlan24?.days.some(d=>d.date===options.editDate)))return msg('Selecciona un día de la tabla actual y describe el cambio.');
 workoutDraftInput24(text);
 const notice=options.editDate?'¿Reajustar toda la semana tomando el '+options.editDate+' como referencia? Las otras sesiones propuestas también pueden cambiar. Tus entrenamientos realizados se conservarán.':'¿Preparar de nuevo la semana completa? Las sesiones propuestas pueden cambiar; tus entrenamientos realizados se conservarán.';
 if(workoutPlan24&&!confirm(notice))return;
 return runWorkout24(false,text,options);
}
function requestWorkout24(text){go('Entrenamiento');workoutOptions24.set(workoutWeek24(),{editDate:'',trainingDays:''});return generateWorkout24(text);}
queuePlan21=function(){
 if(typeof queueTeam247==="function")queueTeam247();
 workoutAccount24();if(!workoutReady24()||document.hidden||workoutJob24||!VeraPrivacy6.allowed('cloud')||Date.now()<workoutRetry24)return;
 const signature=workoutSignature24();if(workoutPlan24&&signature===workoutAccepted24&&!workoutStale24)return;if(workoutScheduled24===signature&&workoutTimer24)return;
 clearTimeout(workoutTimer24);workoutScheduled24=signature;
 // Initial profile: immediate proposal. During training, wait for a quiet period;
 // a completed session can request the update explicitly, avoiding per-set calls.
 workoutTimer24=setTimeout(()=>{workoutTimer24=null;if(sameVeraSession(workoutOwner24,workoutToken24,workoutState24)&&workoutReady24()&&!document.hidden&&!workoutJob24&&VeraPrivacy6.allowed('cloud'))runWorkout24(false);},workoutPlan24?180000:1500);
};
async function workoutSessionDone24(){
 workoutAccount24();const state=s,owner=workoutOwner24,token=workoutToken24,week=workoutWeek24();
 clearTimeout(workoutTimer24);workoutTimer24=null;
 if(workoutJob24)await workoutJob24.done;
 if(!sameVeraSession(owner,token,state)||week!==workoutWeek24())return false;
 // The server owns the confirmed diary revision and can reuse a matching week.
 return runWorkout24(false);
}
function workoutExercise24(date,id){
 workoutAccount24();const exercise=workoutPlan24?.days.find(d=>d.date===date)?.exercises.find(e=>e.id===id);if(!exercise)return msg('La tabla ha cambiado. Vuelve a abrir la sesión.');
 const previous=exercise.previous;s.setDraft={exercise:exercise.name,kg:previous?.enteredKg??'',mode:previous?.mode||'total',reps:'',rir:'',note:'',date:day(),autoRest:true};s.restSeconds13=exercise.restSeconds;
 go('Entrenamiento');msg(exercise.sets+' series propuestas · '+exercise.reps.join('–')+' repeticiones · RIR objetivo '+exercise.rir+'. Introduce lo realizado; aún no has registrado ninguna serie.');
 const form=$('setName13');form?.scrollIntoView?.({behavior:'smooth',block:'center'});form?.focus?.();
}
function workoutPanel24(){
 workoutAccount24();if(workoutReady24()&&!workoutLoaded24&&!workoutJob24&&Date.now()>=workoutRetry24)queueMicrotask(loadWorkouts24);
 const options=workoutOptionsValue24();
 const p=workoutPlan24,sessions=p?.days.filter(d=>d.type==='training').length||0,exercises=p?.days.reduce((n,d)=>n+d.exercises.length,0)||0,recovery=p?.days.filter(d=>d.type==='rest').length||0;
 return '<section class="workout24"><div class="workout-head24"><small>TU PLAN ADAPTADO</small><h2>Una semana para ti</h2><p>Sesiones propuestas con tu perfil, material y registros confirmados.</p></div>'+(workoutJob24?'<p role="status">'+(workoutJob24.readOnly?'Consultando la tabla guardada…':workoutJob24.editDate?'Reajustando tu semana desde la referencia '+safe(workoutJob24.editDate)+'…':'Preparando tu semana…')+'</p>':'')+(workoutError24?'<p role="status">'+safe(workoutError24)+(workoutDrafts24.has(workoutWeek24())?' Tu petición se conserva abajo; puedes revisarla y volver a enviarla.':'')+'</p>':'')+(workoutStale24?'<p class="workout-update24">Hay datos nuevos. La tabla visible puede necesitar una actualización; todavía no incorpora esos cambios.</p>':'')+
 '<label>Semana<select onchange="workoutSelectWeek24(this.value)">'+[[monday21(),'Esta semana'],[workoutNextWeek24(),'Próxima semana']].map(([v,t])=>'<option value="'+v+'" '+(v===workoutWeek24()?'selected':'')+'>'+t+' · '+v+'</option>').join('')+'</select></label><details class="workout-request24" '+(workoutDrafts24.has(workoutWeek24())||workoutOptions24.has(workoutWeek24())?'open':'')+'><summary>Adaptar mi tabla</summary><label>Día de referencia para reajustar la semana<select id="workoutScope24" onchange="workoutChangeOptions24(\'editDate\',this.value)"><option value="">Sin día concreto · semana completa</option>'+(p?p.days.map(d=>'<option value="'+safe(d.date)+'" '+(options.editDate===d.date?'selected':'')+'>'+safe(d.date)+' · '+safe(d.title)+'</option>').join(''):'')+'</select></label>'+(options.editDate?'<p>Tu petición se aplicará tomando este día como referencia y se reajustará toda la semana. Las otras sesiones también pueden cambiar.</p>':'')+'<label>Sesiones de entrenamiento esta semana<select id="workoutDays24" onchange="workoutChangeOptions24(\'trainingDays\',this.value)"><option value="">Según mi perfil y petición</option>'+Array.from({length:7},(_,i)=>'<option value="'+(i+1)+'" '+(Number(options.trainingDays)===i+1?'selected':'')+'>'+(i+1)+' días</option>').join('')+'</select></label><p>Preparar de nuevo la semana permite recuperar las sesiones que falten. No modifica los registros realizados.</p>'+workoutExercisePanel245()+'<label>Qué necesitas esta semana<textarea id="workoutRequest24" maxlength="1500" oninput="workoutDraftInput24(this.value)" placeholder="Ej. cambiar el lunes a torso y reajustar los demás días; recuperar tres sesiones esta semana.">'+safe(workoutDraftValue24())+'</textarea></label>'+btn(options.editDate?'Reajustar semana desde este día':'Generar semana con mi petición','generateWorkout24()',true)+'</details>'+
 (!p?'<p>Al completar y guardar tu perfil, Vera prepara tu primera tabla con el análisis remoto permitido. No hacen falta entrenamientos previos.</p>'+btn(workoutJob24?'Preparando…':'Preparar mi semana','generateWorkout24()',true):'<div class="workout-overview24"><span><strong>'+sessions+'</strong> sesiones</span><span><strong>'+exercises+'</strong> ejercicios</span><span><strong>'+recovery+'</strong> días de recuperación</span></div>'+(p.status==='needs_review'?'<p role="status">'+safe(p.summary)+'</p>':'')+'<details><summary>Por qué esta tabla</summary><p>'+safe(p.summary)+'</p><p>'+safe(p.adaptation)+'</p><small>'+safe(p.coverage?.included??0)+' registros recientes utilizados; '+(p.coverage?.partial?'historial parcial':'sin registros omitidos dentro del periodo seleccionado')+'. Las cargas anteriores son referencias, no pesos que debas levantar.</small></details>'+p.days.map(d=>'<details class="workout-day24" '+(d.date===day()?'open':'')+'><summary><span>'+safe(d.date)+' · '+safe(d.title)+'</span><small>'+ (d.type==='training'?d.exercises.length+' ejercicios':'Recuperación')+'</small></summary><p>'+safe(d.reason)+'</p>'+d.exercises.map(e=>'<article><h3>'+safe(e.name)+'</h3><div class="workout-tags24"><span>'+e.sets+' series</span><span>'+e.reps.join('–')+' rep.</span><span>RIR '+e.rir+'</span><span>'+e.restSeconds+' s</span></div><p>'+safe(e.cue)+'</p><small>'+safe(e.progression)+'</small>'+(e.previous?'<p class="workout-previous24">Último registro: '+safe(e.previous.date)+' · '+e.previous.reps+' rep. · '+e.previous.kg+' kg '+(e.previous.mode==='assistance'?'de asistencia':'totales')+'</p>':'<p class="workout-previous24">Sin carga previa. Elige una carga cómoda sin dolor y conserva repeticiones en reserva.</p>')+btn('Preparar registro de este ejercicio',"workoutExercise24('"+d.date+"','"+e.id+"')")+'</article>').join('')+'</details>').join('')+btn('He terminado: actualizar con mis registros','workoutSessionDone24()'))+'</section>';
}
const workoutAreaBefore24=areaPage;areaPage=function(){return tab==='Entrenamiento'?workoutPanel24()+workoutAreaBefore24():workoutAreaBefore24();};
// Existing roster wrapper resolves weeklyPanel21 at call time. Replacing it
// avoids the old four-provider-call plan and leaves its historical state intact.
weeklyPanel21=function(){return (typeof teamPanel247==='function'?teamPanel247():'')+workoutPanel24()+btn('Opinión sobre mi estado general','generalReview21()');};
refreshPlan21=function(){return generateWorkout24();};
setAutoPlan21=function(){queuePlan21();};
const workoutRenderBefore24=render;render=function(){workoutRenderBefore24();if(workoutReady24())queuePlan21();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){workoutAccount24();if(workoutReady24())loadWorkouts24();}});
setInterval(()=>{if(workoutReady24())queuePlan21();},30000);
