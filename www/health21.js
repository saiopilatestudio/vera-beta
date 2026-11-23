/* Health Connect transport is OS-permission based; never an AI or Google OAuth substitute. */
let healthTicket21=null,healthDebounce21=null,healthApplying21=false,healthLastRequest21=0,healthLastOwner21='',healthTimeout21=null,healthQueued21=null,healthFollowup21=null,healthReadStatus21=null;
let healthPermissionOwner244=null;
const healthKinds21={steps:'Pasos',sleep:'Sueño',workouts:'Entrenamiento',weight:'Otro pesaje',nutrition:'Comida',hydration:'Agua'};
function healthReady21(){return typeof googleLinked23==='function'&&googleLinked23()&&validSession&&(typeof accountReady22==='undefined'||accountReady22)&&!!sessionStorage.veraUser&&!!sessionStorage.veraToken&&!document.hidden&&!!window.VeraNative?.refreshHealth21;}
function healthStatus21(){return healthReadStatus21&&sameVeraSession(healthReadStatus21.owner,healthReadStatus21.token,healthReadStatus21.state)?{phase:healthReadStatus21.phase,started:healthReadStatus21.started,completed:healthReadStatus21.completed||null,counts:{...healthReadStatus21.counts},errors:{...healthReadStatus21.errors}}:{phase:'waiting',counts:{},errors:{}};}
function paintHealthStatus21(){
 const target=document.getElementById?.('healthSync24');
 if(target&&!target.contains?.(document.activeElement)&&!target.querySelector?.('details[open]'))target.outerHTML=healthTodayPanel244('healthSync24');
 const card=document.getElementById?.('todayHealth244');
 if(card&&!card.contains?.(document.activeElement)&&!card.querySelector?.('details[open]'))card.outerHTML=healthTodayPanel244();
 if(typeof healthPanelStatusUpdate244==='function')healthPanelStatusUpdate244();
}
function healthPermissionResult244(ticket){
 const requested=healthPermissionOwner244;
 if(!requested||requested.id!==ticket)return;
 healthPermissionOwner244=null;
 if(!validSession||!sameVeraSession(requested.owner,requested.token,requested.state))return;
 // The permission sheet may have hidden the WebView and invalidated its original read.
 cancelHealthRead21();healthLastRequest21=0;
 if(typeof render==='function')render();
 if(healthReady21())requestHealth21(false,true);
}
function cancelHealthRead21(){clearTimeout(healthTimeout21);clearTimeout(healthDebounce21);clearTimeout(healthFollowup21);healthTimeout21=null;healthFollowup21=null;healthQueued21=null;if(healthTicket21&&!healthTicket21.done){healthTicket21.done=true;if(healthReadStatus21?.phase==='reading')healthReadStatus21.phase='paused';}}
function finishHealth21(request){
 if(healthTicket21!==request||!sameVeraSession(request.owner,request.token,request.state))return;
 request.done=true;clearTimeout(healthTimeout21);healthTimeout21=null;
 const status=healthReadStatus21;if(status&&status.started===request.started){status.completed=Date.now();status.phase=Object.keys(status.errors).length?'partial':'read';}
 paintHealthStatus21();
 const queued=healthQueued21;healthQueued21=null;
 if(queued&&sameVeraSession(queued.owner,queued.token,queued.state)){clearTimeout(healthFollowup21);healthFollowup21=setTimeout(()=>{healthFollowup21=null;if(sameVeraSession(queued.owner,queued.token,queued.state))requestHealth21(queued.permissions,true);},15000);}
}
function healthTypeFinished21(request,type,error,count){
 request.received.add(type);if(healthReadStatus21?.started===request.started){if(error)healthReadStatus21.errors[type]=error;else healthReadStatus21.counts[type]=count;}
 if(request.expected?.every(t=>request.received.has(t)))finishHealth21(request);
}
function requestHealth21(permissions=false,force=false){
 if(!healthReady21())return;
 const owner=sessionStorage.veraUser,now=Date.now();
 if(permissions){
  if(healthPermissionOwner244&&healthPermissionOwner244.id===healthTicket21?.id&&!healthTicket21.done&&now-healthTicket21.started<120000&&sameVeraSession(healthPermissionOwner244.owner,healthPermissionOwner244.token,healthPermissionOwner244.state))return;
  cancelHealthRead21();
 }
 if(healthTicket21&&!healthTicket21.done&&sameVeraSession(healthTicket21.owner,healthTicket21.token,healthTicket21.state)&&now-healthTicket21.started<120000){if(force)healthQueued21={owner,token:sessionStorage.veraToken,state:s,permissions:permissions||healthQueued21?.permissions===true};return;}
 if(!force&&owner===healthLastOwner21&&now-healthLastRequest21<15000)return;
 clearTimeout(healthTimeout21);clearTimeout(healthFollowup21);healthFollowup21=null;healthQueued21=null;
 healthLastRequest21=now;healthLastOwner21=owner;
 const id='h'+now+'_'+Math.random().toString(36).slice(2);
 healthTicket21={id,owner,token:sessionStorage.veraToken,state:s,started:now,done:false,received:new Set()};
 const request=healthTicket21;if(permissions)healthPermissionOwner244=request;healthReadStatus21={owner,token:request.token,state:s,phase:'reading',started:now,counts:{},errors:{}};
 paintHealthStatus21();
 healthTimeout21=setTimeout(()=>{if(healthTicket21===request&&!request.done&&sameVeraSession(request.owner,request.token,request.state)){healthReadStatus21.errors.timeout='Health Connect no terminó la lectura. Se conservan los datos anteriores.';finishHealth21(request);msg(healthReadStatus21.errors.timeout);}},120000);
 try{if(permissions)window.VeraNative.health21(id);else window.VeraNative.refreshHealth21(id);}catch{healthReadStatus21.errors.bridge='No se pudo iniciar la lectura de Health Connect.';finishHealth21(request);msg(healthReadStatus21.errors.bridge);}
}
function refreshHealthAfterAction21(){
 if(healthApplying21||!healthReady21())return;clearTimeout(healthDebounce21);
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
 healthDebounce21=setTimeout(()=>{if(sameVeraSession(owner,token,state))refreshUnlockedHealth();},15000);
}
refreshUnlockedHealth=function(){
 if(!healthReady21())return;const key='vera.health21.asked.'+sessionStorage.veraUser;
 if(!localStorage.getItem(key)){localStorage.setItem(key,'yes');s.autoHealth=true;const granted=typeof healthAccess23==='function'&&healthAccess23().complete;requestHealth21(!granted,true);return;}
 // Old installations could retain autoHealth=false. Automatic synchronization
 // is now part of the mandatory integration, not an optional legacy switch.
 s.autoHealth=true;requestHealth21();
};
syncHealth=function(){if(!healthReady21())return msg('Health Connect requiere la APK en Android 14 o posterior y una sesión iniciada.');s.autoHealth=true;localStorage.setItem('vera.health21.asked.'+sessionStorage.veraUser,'yes');requestHealth21(true,true);};
function normalizeHealth21(type,rows){
 if(!healthKinds21[type]||!Array.isArray(rows)||rows.length>10000)throw Error('Respuesta de salud no válida.');
 const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date&&date<=day();
 const number=(x,max=1e9)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
 const record=(r,id)=>({id,healthKey:id,healthType:type,source:'health',kind:healthKinds21[type],date:r.date,note:'Health Connect'+(r.origin?' · '+String(r.origin).slice(0,200):'')});
 if(type==='sleep'){
  const grouped={};for(const r of rows){if(!validDate(r.date)||!number(r.start,1e14)||!number(r.end,1e14)||r.end<=r.start||r.end-r.start>86400000)continue;
   let cursor=r.start;const spans=grouped[r.date]||=[];
   const awake=(Array.isArray(r.awake)?r.awake:[]).filter(x=>Array.isArray(x)&&number(x[0],1e14)&&number(x[1],1e14)&&x[1]>x[0]).sort((a,b)=>a[0]-b[0]);
   for(const[a,b]of awake){const x=Math.max(r.start,a),y=Math.min(r.end,b);if(y<=x)continue;if(x>cursor)spans.push([cursor,x]);cursor=Math.max(cursor,y);}if(cursor<r.end)spans.push([cursor,r.end]);
  }
  return Object.entries(grouped).map(([date,spans])=>{let end=0,total=0;for(const[a,b]of spans.sort((x,y)=>x[0]-y[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return {...record({date},'health_sleep_'+date),value:Math.min(24,total/3600000),note:'Health Connect · sesiones por fecha de finalización, sin vigilia ni intervalos duplicados'};});
 }
 const result=new Map();for(const r of rows){if(!r||!validDate(r.date))continue;
  const key=type==='steps'?r.date:typeof r.id==='string'?r.id.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,65):'';if(!key)continue;
  const id='health_'+type+'_'+key,l=record(r,id);
  if(typeof r.origin==='string'&&r.origin)l.healthOrigin=r.origin.slice(0,200);
  if(Array.isArray(r.origins))l.healthOrigins=[...new Set(r.origins.filter(x=>typeof x==='string'&&x.length<=200))].sort();
  if(type==='workouts'&&typeof r.title==='string')l.healthTitle=r.title.slice(0,250);
  if(type==='steps'){if(!number(r.value,1000000)||!Number.isInteger(r.value))continue;l.value=r.value;}
  if(type==='hydration'){if(!number(r.value,20000))continue;l.value=r.value;}
  if(type==='weight'){if(!number(r.value,1000)||r.value===0)continue;l.value=r.value;l.note+=' · condición de ayuno no indicada';}
  if(type==='workouts'){
   if(!number(r.minutes,1440))continue;l.value=null;l.minutes=r.minutes;l.note+=' · '+String(r.title||'Sesión').slice(0,250)+' · '+Math.round(r.minutes)+' min';
   l.healthOrigin=String(r.origin||'').slice(0,200);l.healthRecordId=String(r.id||'').slice(0,200);
   if(number(r.start,1e14)&&number(r.end,1e14)&&r.end>r.start&&r.end-r.start<=86400000){l.start=r.start;l.end=r.end;const elapsed=(r.end-r.start)/1000;
    l.durationSeconds=number(r.healthDurationSeconds,elapsed)&&r.healthDurationSeconds>0?r.healthDurationSeconds:elapsed;
    l.minutes=l.durationSeconds/60;}
   if(['cycling','swimming','running','walking'].includes(r.sport)&&l.durationSeconds){l.kind='Cardio';l.sport=r.sport;if(l.sport==='swimming'&&['pool','open_water'].includes(r.swimmingMode))l.swimmingMode=r.swimmingMode;l.value=l.minutes;l.distanceMeters=number(r.distanceMeters,1000000)?r.distanceMeters:null;l.energyKcal=number(r.energyKcal,100000)?r.energyKcal:null;l.avgSpeedKmh=l.distanceMeters===null?null:l.distanceMeters/l.durationSeconds*3.6;l.paceSecondsPer100m=l.sport==='swimming'&&l.distanceMeters>0?100*l.durationSeconds/l.distanceMeters:null;l.metricProvenance='Health Connect · misma aplicación de origen e intervalo de sesión';}
   if(Array.isArray(r.metricWarnings))l.healthMetricWarnings=r.metricWarnings.filter(x=>typeof x==='string').map(x=>x.slice(0,200)).slice(0,4);
  }
  if(type==='nutrition'){l.value=number(r.value,90000)?r.value:null;l.note+=' · '+String(r.note||'Comida').slice(0,500);for(const k of ['protein','carbs','fat'])l[k]=number(r[k],10000)?r[k]:null;l.nutrients={};for(const k of ['fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug'])if(number(r.nutrients?.[k],1e7))l.nutrients[k]=r.nutrients[k];}
  result.set(id,l);
 }if(type==='workouts'){const sessions=new Map();for(const l of [...result.values()].sort((a,b)=>a.id.localeCompare(b.id))){const key=l.start&&l.end&&l.healthOrigin?[l.healthOrigin,l.start,l.end,l.sport||l.kind].join('|'):l.id;if(!sessions.has(key))sessions.set(key,l);}return [...sessions.values()];}return [...result.values()];
}
function healthImport21(ticket,type,rows){
 const request=healthTicket21;if(!request||request.id!==ticket||request.done||Date.now()-request.started>120000||!validSession||!sameVeraSession(request.owner,request.token,request.state))return;
 if(type==='permissions'){if(request.expected)return;request.expected=Array.isArray(rows)?[...new Set(rows.filter(x=>healthKinds21[x]))]:[];if(!request.expected.length)healthReadStatus21.errors.permissions='Autoriza la lectura de datos en Health Connect.';if(request.expected.every(t=>request.received.has(t)))finishHealth21(request);return;}
 if(type==='error'){
  for(const error of Array.isArray(rows)?rows:[]){const failed=error?.type,message=typeof error?.message==='string'?error.message.slice(0,300):'No se pudo completar la lectura.';if(failed==='all'){healthReadStatus21.errors.all=message;finishHealth21(request);msg('No se ha actualizado salud. '+message);return;}if(healthKinds21[failed]&&!request.received.has(failed)){healthTypeFinished21(request,failed,message);msg('Se conservan los registros anteriores de '+healthKinds21[failed].toLowerCase()+'. '+message);}}
  return;
 }
 if(!healthKinds21[type]||request.received.has(type)||request.expected&&!request.expected.includes(type))return;
 try{
  const imported=normalizeHealth21(type,rows),start=new Date();start.setDate(start.getDate()-27);const first=day(start);
  // Device-only provenance: an empty local Health Connect snapshot must never
  // delete records synchronized from a different phone.
  const idsKey='vera.health21.ids.'+request.owner;let known={};try{known=JSON.parse(localStorage.getItem(idsKey)||'{}');}catch{}if(!known||typeof known!=='object'||Array.isArray(known))known={};
  const own=new Set(Array.isArray(known[type])?known[type]:[]);
  const keep=s.logs.filter(l=>!(l.source==='health'&&l.date>=first&&l.date<=day()&&((l.healthType===type&&own.has(l.id))||(!l.healthType&&!l.healthKey&&l.kind===healthKinds21[type]))));
  const incoming=new Map(imported.map(l=>[l.id,l]));const next=keep.filter(l=>!incoming.has(l.id)).concat(imported);
  const remember=()=>{known[type]=imported.map(l=>l.id);localStorage.setItem(idsKey,JSON.stringify(known));};
  // Identical snapshots do not schedule another save/sync/AI revision.
  const stable=xs=>JSON.stringify([...xs].sort((a,b)=>String(a.id).localeCompare(String(b.id))));
  if(stable(next)===stable(s.logs)){remember();healthTypeFinished21(request,type,null,imported.length);return;}
  const previous=s.logs;healthApplying21=true;s.logs=next;
  try{save();}catch(e){s.logs=previous;throw e;}finally{healthApplying21=false;}
  remember();
  window.todayRefresh244?.();
  healthTypeFinished21(request,type,null,imported.length);

 }catch(e){healthTypeFinished21(request,type,e.message);msg('No se ha actualizado salud. '+e.message);}
}
let healthPanelActionState244=null;
function healthPanelData244(){
 const number=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&['number','string'].includes(typeof v)&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const now=new Date(),today=day(),midnight=+new Date(now.getFullYear(),now.getMonth(),now.getDate()),raw=s.logs.filter(r=>r.source==='health'&&r.healthType==='workouts');
 let activities;
 if(typeof VeraToday244!=='undefined')activities=VeraToday244.summary(raw,now).activities;
 else{const seen=new Set();activities=raw.flatMap(r=>{if(typeof r.date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(r.date))return [];const start=number(r.start),end=number(r.end);let row=r;if(start!==null&&end!==null){if(end<=start||end>+now||start>+now||![day(new Date(start)),day(new Date(end))].includes(r.date))return [];const a=Math.max(start,midnight);if(end<=a)return [];row={...r,todayStart:a,...(a!==start?{todayClipped:true,durationSeconds:(end-a)/1000,distanceMeters:null,energyKcal:null,avgSpeedKmh:null}:{})};}else if(r.date!==today)return [];const key=start!==null&&end!==null?[start,end,r.sport||r.kind].join('|'):r.id;if(key&&seen.has(key))return [];if(key)seen.add(key);return [row];});}
 activities=activities.slice().sort((a,b)=>(number(b.todayStart??b.start)||0)-(number(a.todayStart??a.start)||0));
 const labels={cycling:'Ciclismo',running:'Carrera',walking:'Caminata',swimming:'Natación'};
 const activityHtml=activities.length?'<p><strong>Sesiones de hoy disponibles en Vera</strong></p><ul class="today244-activities">'+activities.map(r=>{const start=number(r.todayStart??r.start),duration=number(r.durationSeconds)??(number(r.minutes??r.value)!==null?number(r.minutes??r.value)*60:null),distance=number(r.distanceMeters),speed=number(r.avgSpeedKmh)??(distance!==null&&duration>0?distance/duration*3.6:null),energy=number(r.energyKcal),hour=start===null?'':new Date(start).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+' · ',seconds=duration===null?null:Math.round(duration),time=seconds===null?'Tiempo sin dato':Math.floor(seconds/60)+' min'+(seconds%60?' '+seconds%60+' s':''),metrics=hour+time+(distance!==null?' · '+(distance/1000).toLocaleString('es-ES',{maximumFractionDigits:2})+' km':labels[r.sport]?' · Distancia sin dato':'')+(speed!==null&&Number.isFinite(speed)?' · '+speed.toLocaleString('es-ES',{maximumFractionDigits:1})+' km/h':'')+(energy!==null?' · '+energy.toLocaleString('es-ES',{maximumFractionDigits:0})+' kcal':'');return '<li><strong>'+safe(labels[r.sport]||r.healthTitle||r.exercise||'Sesión de ejercicio')+'</strong><small>'+safe(metrics)+'</small><small>'+safe(r.healthOrigin==='com.google.android.apps.fitness'?'Google Fit · Health Connect':'Health Connect')+(r.todayClipped?' · Sólo el tramo de hoy; distancia y energía no separables':'')+'</small></li>';}).join('')+'</ul>':'<p>No hay sesiones de ejercicio de hoy disponibles en Vera.'+(s.logs.some(r=>r.source==='health'&&r.kind==='Pasos'&&r.date===today)?' Sí hay pasos de hoy; los pasos no son una sesión de entrenamiento.':'')+'</p>';
 const status=healthStatus21(),permissions=typeof healthAccess23==='function'?healthAccess23():null,missing=Array.isArray(permissions?.readableTypes)&&!permissions.readableTypes.includes('workouts');let title,detail='';
 if(missing){title='Falta permiso para leer ejercicio';detail='En los permisos de VERA, permite leer las sesiones de ejercicio.';}
 else if(status.phase==='partial'){title='Lectura de salud incompleta';detail=Object.values(status.errors).join(' ');}
 else if(status.phase==='reading')title='Consultando Salud conectada…';
 else if(status.phase!=='read')title='Pendiente de consultar Salud conectada';
 else if(activities.some(r=>r.healthOrigin==='com.google.android.apps.fitness'))title='Actividad de Google Fit recibida hoy';
 else if(activities.length)title='Actividad de hoy recibida vía Health Connect';
 else{title='Sin sesiones de ejercicio compartidas para hoy';detail='Si la sesión aparece en Google Fit, comprueba en Salud conectada que Fit comparte sesiones de ejercicio, además de pasos.';}
 const time=status.completed?new Date(status.completed).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'';
 return {title,detail,activityHtml,time,status};
}
function healthPanelMessage244(text){if(healthPanelActionState244)healthPanelActionState244.message=text;for(const id of ['todayHealth244','healthSync24']){const el=document.getElementById?.(id)?.querySelector?.('[data-health-message244]');if(el)el.textContent=text;}}
function healthPanelStatusUpdate244(){const data=healthPanelData244();for(const id of ['todayHealth244','healthSync24']){const card=document.getElementById?.(id);if(!card)continue;for(const [selector,text]of [['[data-health-reading244]',data.title],['[data-health-detail244]',data.detail],['[data-health-time244]',data.time?'Última lectura · '+data.time:'']]){const el=card.querySelector?.(selector);if(el)el.textContent=text;}const list=card.querySelector?.('[data-health-activities244]');if(list&&list.innerHTML!==data.activityHtml)list.innerHTML=data.activityHtml;}if(healthPanelActionState244?.target==='refresh'&&sameVeraSession(healthPanelActionState244.owner,healthPanelActionState244.token,healthPanelActionState244.state)&&['read','partial'].includes(data.status.phase)){healthPanelMessage244(data.status.phase==='read'?'Lectura terminada. El detalle de las sesiones recibidas aparece en esta tarjeta.':'La lectura terminó con incidencias. Revisa el aviso de esta tarjeta.');}}
function healthPanelAction244(action){
 if(!['fit','permissions','refresh'].includes(action))return;
 const previous=healthPanelActionState244;if(action==='refresh'&&previous?.target==='refresh'&&Date.now()-previous.started<600&&sameVeraSession(previous.owner,previous.token,previous.state))return;
 healthPanelActionState244={target:action,owner:sessionStorage.veraUser,token:sessionStorage.veraToken,state:s,started:Date.now()};
 try{
  if(action==='refresh'){
   if(!healthReady21()){healthPanelMessage244(!validSession||!sessionStorage.veraToken?'Entra en tu cuenta para actualizar Salud conectada.':!window.VeraNative?.refreshHealth21?'Esta lectura necesita la APK Android de Vera actualizada.':typeof googleLinked23==='function'&&!googleLinked23()?'Conecta tu cuenta de Google desde Perfil antes de actualizar.':'Espera a que termine de abrirse tu cuenta y mantén Vera visible.');return;}
   cancelHealthRead21();healthLastRequest21=0;requestHealth21(false,true);healthPanelStatusUpdate244();if(healthStatus21().phase==='reading')healthPanelMessage244('Lectura manual iniciada. Espera a que aparezcan aquí las sesiones o el aviso de lectura.');return;
  }
  const method=action==='fit'?'openGoogleFit244':'openHealthSettings244';
  if(typeof window.VeraNative?.[method]!=='function'){healthPanelMessage244('La APK instalada no dispone de este acceso. Instala la versión actualizada de Vera.');return;}
  healthPanelMessage244(action==='fit'?'Solicitando abrir Google Fit…':'Solicitando abrir los permisos de Salud conectada…');window.VeraNative[method]();
 }catch(error){healthPanelMessage244('No se pudo completar la acción. '+String(error?.message||'Reintenta desde esta tarjeta.'));}
}
window.healthNavigationResult244=function(result){const request=healthPanelActionState244;if(!request||request.target!==result?.target||!sameVeraSession(request.owner,request.token,request.state))return;healthPanelMessage244(String(result.message|| (result.stage==='returned'?'Has vuelto a Vera. Pulsa Actualizar lectura para consultar las sesiones.':result.stage==='error'?'Android no pudo abrir esa pantalla.':'Android recibió la solicitud de apertura.')));};
document.addEventListener('click',event=>{const button=event.target?.closest?.('[data-health-action244]');if(!button)return;event.preventDefault();healthPanelAction244(button.getAttribute('data-health-action244'));},true);
function healthTodayPanel244(id='todayHealth244'){
 const data=healthPanelData244(),button=(label,action)=>'<button type="button" data-health-action244="'+action+'">'+label+'</button>';
 return '<section id="'+safe(id)+'" class="health-sync24"><h3>Google Fit y Health Connect</h3><p role="status" data-health-reading244>'+safe(data.title)+'</p><small data-health-time244>'+(data.time?'Última lectura · '+safe(data.time):'')+'</small><p data-health-detail244>'+safe(data.detail)+'</p><div data-health-activities244>'+data.activityHtml+'</div><p role="status" aria-live="polite" data-health-message244>'+safe(healthPanelActionState244&&sameVeraSession(healthPanelActionState244.owner,healthPanelActionState244.token,healthPanelActionState244.state)?healthPanelActionState244.message||'':'')+'</p><div class="health-actions244" style="display:flex;flex-wrap:wrap;gap:8px">'+button('Abrir Google Fit','fit')+button('Permisos de VERA','permissions')+button('Actualizar lectura','refresh')+'</div><details><summary>Si falta una salida o su distancia</summary><p>En Google Fit: Perfil → Ajustes → Sincronizar Fit con Health Connect. Fit debe compartir sesiones de ejercicio con Salud conectada. Compartir pasos por sí solo no envía el entrenamiento. «Distancia sin dato» significa que no hemos recibido una distancia atribuible; no equivale a cero kilómetros.</p></details></section>';
}
function healthSyncPanel24(){
 return healthTodayPanel244('healthSync24')+
  '<p>La distancia y la energía se muestran cuando el origen las comparte para esa actividad.</p>'+
  btn('Revisar permisos de distancia y energía','requestHealth21(true,true)');
}
const healthPrefsBefore24=typeof prefs==='function'?prefs:null;if(healthPrefsBefore24)prefs=function(){return healthPrefsBefore24()+healthSyncPanel24();};
window.addEventListener?.('focus',()=>refreshUnlockedHealth());
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelHealthRead21();else refreshUnlockedHealth();});
// Detects the first successful login without a repeated OS permission prompt.
setInterval(()=>{if(!validSession){cancelHealthRead21();return;}if(healthReady21()&&(sessionStorage.veraUser!==healthLastOwner21||Date.now()-healthLastRequest21>=60000))refreshUnlockedHealth();},5000);
setTimeout(()=>refreshUnlockedHealth(),1500);
