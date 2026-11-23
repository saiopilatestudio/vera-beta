/* Explicit historical capture and an auditable, account-bound weekly team. */
function capturePanel21(){return '<section class="capture21"><h3>Del mensaje al diario</h3><p>Escribe lo que hiciste o adjunta una captura de entrenamiento, comida, suplemento o sueño. Puedes recuperar días anteriores. Revisa los registros antes de guardarlos.</p><label>Fecha de referencia<input id="captureDate21" type="date" value="'+day()+'" max="'+day()+'"></label>'+btn('Preparar registros del mensaje y la foto','importCurrentChat21()',true)+'</section>';}
async function importCurrentChat21(){
 if(busy)return;const text=$('question')?.value?.trim();if(!text)return msg('Describe qué datos quieres guardar y de qué día son.');
 const date=$('captureDate21')?.value||day(),image=attached?.src;
 busy=true;msg('Vera está preparando registros con fecha para revisar…');
 try{const d=await api('diary-import',{text,date,today:day(),...(image?{image}:{})});s.turns.push({...d,date:day(),question:text+(image?' · Imagen adjunta':''),reports:[{role:'Registro del diario',text:d.answer}],inputIds:[]});attached=null;save();go('Chat');msg('Revisa fechas y cantidades. Pulsa Guardar para incorporarlos al diario.');}catch(e){msg(e.message);}finally{busy=false;}
}
function readCandidate21(i,j){
 const e=s.turns[i]?.entries?.[j];if(!e||e.saved)return null;const prefix='candidate21_'+i+'_'+j+'_';
 const date=$(prefix+'date')?.value||e.date,raw=$(prefix+'value')?.value??e.value;
 if(!trainingDate14(date))throw Error('Selecciona una fecha real, no futura.');
 const value=raw===''||raw==null?null:Number(raw);if(value!=null&&(!Number.isFinite(value)||value<0||(e.kind==='Sueño'&&value>24)))throw Error('Revisa la cantidad.');
 const l={...e,date,value,note:$(prefix+'note')?.value??e.note,id:e.recordId||uid(),source:'Vera · confirmado'};
 delete l.saved;delete l.recordId;
 return l;
}
acceptEntry=function(i,j){try{const l=readCandidate21(i,j);if(!l)return;s.logs.push(l);s.turns[i].entries[j].saved=true;s.turns[i].entries[j].recordId=l.id;save();render();msg('Registro guardado en el diario; sincronización automática cuando haya conexión.');}catch(e){msg(e.message);}};
function acceptAll21(i){try{const pending=(s.turns[i].entries||[]).map((e,j)=>[j,readCandidate21(i,j)]).filter(([,l])=>l);for(const[j,l]of pending){s.logs.push(l);s.turns[i].entries[j].saved=true;s.turns[i].entries[j].recordId=l.id;}save();render();msg(pending.length+' registros guardados en el diario.');}catch(e){msg(e.message);}}
proposals=function(t){const i=s.turns.indexOf(t),entries=t.entries||[];if(!entries.length)return '';return '<details open class="candidates21"><summary>Revisar '+entries.length+' registros para el diario</summary>'+entries.map((e,j)=>{if(e.saved)return '<p>✓ '+safe(e.kind)+' · '+safe(e.date)+' · Guardado</p>';const id='candidate21_'+i+'_'+j+'_';return '<fieldset><legend>'+safe(e.kind)+'</legend><label>Fecha<input id="'+id+'date" type="date" max="'+day()+'" value="'+safe(e.date)+'"></label><label>Cantidad ('+safe(units[e.kind]||'opcional')+')<input id="'+id+'value" type="number" min="0" step="any" value="'+safe(e.value??'')+'"></label><label>Detalle<textarea id="'+id+'note">'+safe(e.note||'')+'</textarea></label>'+((e.protein!=null||e.carbs!=null||e.fat!=null)?'<p>Proteínas '+safe(e.protein??'—')+' g · Hidratos '+safe(e.carbs??'—')+' g · Grasas '+safe(e.fat??'—')+' g</p>':'')+(e.exercise?'<p>'+safe(e.exercise)+' · '+safe(e.reps?.join(' / ')||'series sin indicar')+' · '+safe(e.kg??'carga sin indicar')+'</p>':'')+btn('Guardar este registro','acceptEntry('+i+','+j+')')+'</fieldset>';}).join('')+btn('Guardar todos los pendientes','acceptAll21('+i+')',true)+'</details>';};
function planSignature21(){const text=JSON.stringify({logs:s.logs,profile:s.profile,gym:s.gym,machines:s.machines});let a=2166136261,b=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}return text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
function generalReview21(){ask('Revisión de mi estado general: actividad y pasos, tendencia de peso y cintura, nutrición con proteínas e hidratos, suplementación registrada, sueño y recuperación. Que cada especialista dé su opinión: qué se observa, qué cambiaría y por qué, qué mantener y qué información falta. Considera mis objetivos, restricciones y cobertura de los datos. No conviertas esta revisión en consumos realizados ni cambies mi diario.');}
let planTimer21=null,planBusy21=false;
function queuePlan21(){clearTimeout(planTimer21);if(!s.autoPlan21||!s.profile.introduced||s.logs.length<3||!validSession||!VeraPrivacy6.allowed('cloud')||s.weeklyPlan21?.inputSignature===planSignature21()||Date.now()-Date.parse(s.weeklyPlan21?.generatedAt||'1970-01-01')<86400000||Date.now()-(window.lastAutoPlan22||0)<3600000)return;const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;planTimer21=setTimeout(()=>{if(sameVeraSession(owner,token,state)&&s.autoPlan21&&validSession&&VeraPrivacy6.allowed('cloud')&&!document.hidden&&!busy&&!planBusy21){window.lastAutoPlan22=Date.now();refreshPlan21(true);}},30000);}
function setAutoPlan21(value){s.autoPlan21=value;save();if(value)refreshPlan21();}
function monday21(){const date=new Date(),n=(date.getDay()+6)%7;date.setDate(date.getDate()-n);return day(date);}
async function refreshPlan21(automatic=false){
 if(planBusy21||busy)return;const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s,signature=planSignature21();
 planBusy21=true;msg('Tres especialistas revisan tus datos y Vera coordina el plan…');
 try{const payload=buildCoachPayload14('Actualizar mi plan semanal'),week=s.weeklyPlan21?.week===monday21()?s.weeklyPlan21.week:monday21();
 const result=await api('weekly-plan',{...payload,week});if(!sameVeraSession(owner,token,state))return;
 if(signature!==planSignature21()){msg('Hay datos nuevos; se conserva el plan anterior. Vuelve a revisar la semana.');return;}
 const old=s.weeklyPlan21;s.planHistory21=[...(s.planHistory21||[]),...(old?[old]:[])].slice(-4);
 result.days=result.days.map(d=>{const prior=old?.days?.find(x=>x.date===d.date);return {...d,done:Object.fromEntries(['training','nutrition','recovery'].map(k=>[k,!!prior?.done?.[k]&&prior[k]===d[k]]))};});s.weeklyPlan21={...result,inputSignature:signature};
 s.plan=result.summary+'\n\n'+result.days.map(d=>d.date+'\nEntrenamiento: '+d.training+'\nNutrición: '+d.nutrition+'\nRecuperación: '+d.recovery).join('\n\n');
 save();if(!automatic)render();msg('Plan semanal actualizado. Puedes revisar las opiniones y los cambios en Equipo.');
 }catch(e){if(sameVeraSession(owner,token,state))msg('Se conserva tu plan anterior. '+e.message);}finally{planBusy21=false;}
}
// The training table and specialist review have independent generation jobs.
const reviewTeam247=refreshPlan21;
let teamSchedule247={};
function queueTeam247(){
 if(!s.autoPlan21||!s.profile?.introduced||!s.logs?.length||!validSession||document.hidden||!VeraPrivacy6.allowed('cloud')||planBusy21)return;
 const signature=planSignature21(),state=s,owner=sessionStorage.veraUser,token=sessionStorage.veraToken;
 if(s.weeklyPlan21?.week===monday21()&&s.weeklyPlan21?.inputSignature===signature)return;
 if(teamSchedule247.state===state&&teamSchedule247.signature===signature&&(teamSchedule247.timer||Date.now()<teamSchedule247.next))return;
 clearTimeout(teamSchedule247.timer);
 const job=teamSchedule247={state,signature,next:0};
 job.timer=setTimeout(async()=>{
  job.timer=null;
  if(!sameVeraSession(owner,token,state)||!s.autoPlan21||document.hidden||busy||planBusy21||!VeraPrivacy6.allowed('cloud')||signature!==planSignature21())return;
  job.next=Date.now()+300000;
  if(typeof VeraJournal!=='undefined'&&!await VeraJournal.flush())return;
  if(!sameVeraSession(owner,token,state)||signature!==planSignature21()||planBusy21)return;
  await reviewTeam247(true);
  if(sameVeraSession(owner,token,state)&&tab==='Equipo')render();
 },tab==='Equipo'?1500:90000);
}
function teamPanel247(){
 const p=s.weeklyPlan21,changed=p&&(p.inputSignature!==planSignature21()||p.week!==monday21());
 return '<section class="weekly21"><h2>Qué te recomienda tu equipo</h2>'+(p?'<p>'+safe(p.summary)+'</p><small>'+safe(changed?'Revisión anterior · hay datos nuevos':'Revisión de tus registros')+'</small>'+p.reports.map(r=>'<details><summary>'+safe(r.role)+'</summary><p>'+safe(r.text)+'</p></details>').join(''):'<p>Tu equipo revisa las series, el cardio, la alimentación y el descanso que registras.</p>')+btn('Revisar mis registros','reviewTeam247()')+'</section>';
}
function markPlan21(index,key,done){const d=s.weeklyPlan21?.days[index];if(!d||!['training','nutrition','recovery'].includes(key))return;(d.done||={})[key]=done;save();}
function weeklyPanel21(){const p=s.weeklyPlan21;return '<section class="weekly21"><h2>Tu semana, en equipo</h2><p>Un plan compartido para entrenar, alimentarte y descansar. Consulta las opiniones del equipo y los cambios de tu semana.</p>'+btn('Opinión sobre mi estado general','generalReview21()')+btn(planBusy21?'Revisando…':'Revisar y actualizar semana','refreshPlan21()',true)+'<label class="check"><input type="checkbox" '+(s.autoPlan21?'checked':'')+' onchange="setAutoPlan21(this.checked)">Revisión automática diaria con nuevos datos</label>'+(p?'<p class="pre">'+safe(p.summary)+'</p><details><summary>Qué ha cambiado y por qué</summary><p>'+safe(p.changes)+'</p>'+p.reports.map(r=>'<h4>'+safe(r.role)+'</h4><p>'+safe(r.text)+'</p>').join('')+'</details>'+p.days.map((d,i)=>'<article><h3>'+safe(d.date)+'</h3>'+[['training','Entrenamiento'],['nutrition','Nutrición'],['recovery','Recuperación']].map(([k,title])=>'<label class="check"><input type="checkbox" '+(d.done?.[k]?'checked':'')+' onchange="markPlan21('+i+',\''+k+'\',this.checked)">'+title+'</label><p>'+safe(d[k])+'</p>').join('')+'</article>').join(''):'<p>Aún no has generado una semana. Completa tus preferencias y registra tus datos para una propuesta mejor informada.</p>')+'</section>';}
const convoBefore21=convo;convo=()=>convoBefore21()+capturePanel21();
const rosterBefore21=roster;roster=()=>weeklyPanel21()+rosterBefore21();
const homeBefore21=home;home=()=>homeBefore21()+'<section><h3>Plan semanal coordinado</h3><p>'+safe(s.weeklyPlan21?.summary||'Reúne a tus especialistas para revisar los próximos siete días.')+'</p>'+btn('Ver semana y especialistas',"go('Equipo')")+'</section>';
const progressBefore21=progressBody;progressBody=()=>renderMetrics21()+progressBefore21();
render();
