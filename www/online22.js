/* Online-only UI. The account cache is recovery protection for interrupted sends,
   never an alternative diary or an acknowledgement from the server. */
let accountReady22=false,networkDown22=navigator.onLine===false,commitPending22=false;
let commitPromise22=null,loadingAccount22=false,onboardingSaving22=false;
let restoreJob22=null,commitJob22=null,onboardingJob22=null;
const activeJob22=job=>!!job&&validSession&&sameVeraSession(job.owner,job.token,job.state);
const newJob22=()=>({owner:sessionStorage.veraUser,token:sessionStorage.veraToken,state:s});
function profileComplete22(){const p=s.profile;return !!(p.introduced&&String(p.name||'').trim()&&p.goal&&p.goal!=='Seleccionar'&&p.level&&p.level!=='Seleccionar'&&Number(p.days)>=1&&Number(p.days)<=7);}
function onlineGate22(){
 if(!validSession)return false;
 if(onboardingSaving22){$('topTools').style.display='none';$('nav').style.display='none';$('view').innerHTML='<section><h1>Guardando tu perfil</h1><p>Estamos confirmando tus preferencias en el servidor…</p></section>';return true;}
 if(networkDown22||!accountReady22){
  $('topTools').style.display='none';$('nav').style.display='none';
  $('view').innerHTML='<section class="online22"><span class="eyebrow22">TU CUENTA EN LA NUBE</span><h1>'+(networkDown22?'Necesitas conexión':'Conectando con tu cuenta')+'</h1><p>'+(networkDown22?'Activa los datos móviles o el wifi. Tus registros confirmados están en tu cuenta.':'Estamos recuperando tu perfil y tus registros antes de abrir Vera.')+'</p>'+btn(loadingAccount22?'Conectando…':'Volver a conectar','restoreAccount22()',true)+'</section>';
  return true;
 }
 if(typeof googleGate23==='function'){const gate=googleGate23();if(gate){$('topTools').style.display='none';$('nav').style.display='none';$('view').innerHTML=gate;return true;}}
 if(!profileComplete22()){
  $('topTools').style.display='none';$('nav').style.display='none';
  $('view').innerHTML='<section class="onboarding22"><span class="eyebrow22">BIENVENIDO A TU NUEVO COMIENZO</span><h1>Hagamos Vera tuya</h1><p>Cuéntanos tu objetivo y cómo quieres entrenar. Guardaremos tu perfil en tu cuenta antes de empezar. Podrás cambiarlo después.</p></section>'+prefs();
  const details=$('view').querySelector('details');if(details)details.open=true;
  return true;
 }
 return false;
}
function restoreAccount22(){
 if(!validSession)return Promise.resolve(false);
 if(activeJob22(restoreJob22))return restoreJob22.promise;
 const previous=restoreJob22,job=newJob22();restoreJob22=job;
 loadingAccount22=true;networkDown22=navigator.onLine===false;accountReady22=false;render();
 job.promise=(async()=>{
  try{
   // Journal has one transport queue. Let an old account finish before starting
   // this account, while keeping its response unable to unlock the new session.
   if(previous?.promise)await previous.promise;
   if(commitJob22&&!activeJob22(commitJob22))await commitJob22.promise;
   if(!activeJob22(job))return false;
   await api('session',{});if(!activeJob22(job))return false;
   const ok=await VeraJournal.sync({quiet:true});if(!activeJob22(job))return false;
   if(!ok)throw Error('No se pudo recuperar o confirmar toda la cuenta. Reintenta la conexión.');
   accountReady22=true;networkDown22=false;return true;
  }catch(e){if(activeJob22(job)){networkDown22=true;msg(e.message);}return false;}
  finally{if(restoreJob22===job){restoreJob22=null;loadingAccount22=false;}if(activeJob22(job))render();}
 })();return job.promise;
}
function clearConfirmedBanner22(){
 const status=document.getElementById('commitStatus22');
 if(status?.dataset?.pending==='yes')status.remove();
}
function onlineSave22(){
 if(!validSession||!accountReady22||!sessionStorage.veraToken||!VeraJournal.pending())return Promise.resolve(false);
 if(activeJob22(commitJob22))return commitJob22.promise;
 const previous=commitJob22,job=newJob22();commitJob22=job;commitPending22=true;
 document.getElementById('commitStatus22')?.remove();
 const status=document.createElement('aside');status.id='commitStatus22';status.setAttribute('role','status');document.body.append(status);
 status.textContent='Guardando en tu cuenta…';
 job.promise=(async()=>{
  try{
   if(previous?.promise)await previous.promise;
   if(!activeJob22(job))return false;
   const ok=await VeraJournal.flush();if(!activeJob22(job))return false;
   if(ok){const reconnect=networkDown22;networkDown22=false;status.textContent='✓ Guardado en tu cuenta';setTimeout(()=>status.remove(),2200);if(reconnect)render();}
   else{
    status.dataset.pending='yes';
    const detail=s.syncConflicts21?.length?'Hay cambios simultáneos. Revísalos en Perfil → Guardado de tu cuenta.':VeraJournal.error?.()||'El envío sigue pendiente.';
    status.innerHTML='No se ha confirmado el guardado. '+safe(detail)+' '+btn('Reintentar','retryCommit22()');
    msg('Envío pendiente: revisa tu conexión. No cierres ni desinstales hasta confirmar el guardado.');
    // navigator.onLine only detects a network adapter, not server reachability.
    // A conflict or validation error should not be confused with lost network.
    try{await api('session',{});}catch{if(activeJob22(job)){networkDown22=true;render();}}
   }
   return ok;
  }catch(e){if(activeJob22(job)){status.textContent='No se ha confirmado el guardado. '+e.message;msg(status.textContent);}return false;}
  finally{if(!activeJob22(job))status.remove();if(commitJob22===job){commitJob22=null;commitPromise22=null;commitPending22=false;}}
 })();commitPromise22=job.promise;return job.promise;
}
function retryCommit22(){if(!VeraJournal.pending()){clearConfirmedBanner22();return Promise.resolve(true);}if(navigator.onLine===false)return msg('Activa tu conexión para guardar.');return onlineSave22();}
const sessionBefore22=VeraJournal.onSession;VeraJournal.onSession=function(){accountReady22=false;onboardingSaving22=false;document.getElementById('commitStatus22')?.remove();sessionBefore22();return restoreAccount22();};
const storeProfileBefore22=storeProfile;
storeProfile=async function(e){
 e.preventDefault();const name=$('name').value.trim(),goal=$('goal').value,level=$('level').value,days=Number($('days').value),need=Number($('sleepGoal22').value),water=$('waterGoal22').value;
 if(!name||name.length>100||!goal||!level||goal==='Seleccionar'||level==='Seleccionar'||!Number.isInteger(days)||days<1||days>7||!Number.isFinite(need)||need<4||need>14||water!==''&&(!Number.isFinite(+water)||+water<100||+water>10000))return msg('Completa nombre, objetivo, experiencia, días de entrenamiento y un objetivo de sueño válido.');
 for(const[k,min,max]of [['age',18,110],['height',80,250],['weight',25,350]])if($(k).value!==''&&(!Number.isFinite(+$(k).value)||+$(k).value<min||+$(k).value>max))return msg('Revisa edad, altura y peso.');
 const job=newJob22(),first=!profileComplete22();onboardingJob22=job;onboardingSaving22=first;
 try{
  storeProfileBefore22(e);
  if(first){const ok=await VeraJournal.flush();if(!activeJob22(job))return;
   if(!ok){s.profile.introduced=false;persistVeraState();msg('No se ha confirmado el perfil. Reintenta Guardar preferencias.');}
  }
 }catch(error){if(activeJob22(job)){if(first)s.profile.introduced=false;msg(error.message);}}
 finally{if(onboardingJob22===job){onboardingJob22=null;onboardingSaving22=false;}if(activeJob22(job))render();}
};
window.addEventListener('offline',()=>{networkDown22=true;VeraSpeech14.stop();render();});
window.addEventListener('online',()=>{networkDown22=false;restoreAccount22();});
// Block mouse, keyboard and form submissions while disconnected, including an
// already-open form; network transitions cannot create a second offline diary.
for(const type of ['click','submit'])document.addEventListener(type,event=>{
 if(validSession&&navigator.onLine===false){event.preventDefault();event.stopImmediatePropagation();networkDown22=true;render();}
},true);
const msgBefore22=msg;msg=function(text){
 if(/guardad[oa]|incorporad[oa]|corregid[oa]/i.test(String(text))&&validSession&&VeraJournal.pending()>0)text='Enviando los cambios a tu cuenta…';
 return msgBefore22(text);
};
if(validSession)restoreAccount22();else render();
