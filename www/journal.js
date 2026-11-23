const VeraJournal=(()=>{
 let running=null,timer=null,lastError='',sessionView=null;
 const profileKeys=['name','goal','criteria','likes','age','height','weight','level','days','time','eq','introduced','waterGoalMl'];
 const stateKeys=['plan','weeklyPlan21','autoPlan21','gym','gyms','machines','memory','expiry','supplementUnits','coachMode','need'];
 const signature=value=>JSON.stringify(value??null),clone=value=>JSON.parse(signature(value));
 function fields(){const values={};for(const key of profileKeys)if(Object.hasOwn(s.profile,key))values['profile.'+key]=s.profile[key];for(const key of stateKeys)if(Object.hasOwn(s,key)){
  if(!s.profileRevisions21?.[key]&&((key==='plan'&&s[key]==='')||(key==='memory'&&s[key]?.length===0)))continue;
  values[key]=s[key];}return values;}
 function fieldValue(key){return key.startsWith('profile.')?s.profile[key.slice(8)]:s[key];}
 function setField(key,value){if(key==='weeklyPlan21')validateWeeklyPlanState21(value);const target=key.startsWith('profile.')?s.profile:s,name=key.startsWith('profile.')?key.slice(8):key;if(value===null)delete target[name];else target[name]=clone(value);}
 function pending(){
  const records=new Map(s.logs.filter(syncable).map(r=>[r.id,r])),base=s.diaryRevisions||{},localFields=fields(),fieldBase=s.profileRevisions21||{};
  return [...new Set([...records.keys(),...Object.keys(base)])].filter(id=>signature(records.get(id))!==(base[id]?.raw??'null')).length+
   [...new Set([...Object.keys(localFields),...Object.keys(fieldBase)])].filter(key=>signature(localFields[key])!==(fieldBase[key]?.raw??'null')).length;
 }
 function body(){const count=pending(),conflicts=s.syncConflicts21||[];
  return '<h3>Guardado de tu cuenta</h3><p role=status>'+(stateWriteError?safe(stateWriteError):running?'Sincronizando registros y perfil…':count?count+' cambios pendientes de confirmar en el servidor.':s.diaryLastSync?'Guardado en tu cuenta · '+safe(new Date(s.diaryLastSync).toLocaleString('es-ES')):'Recuperando el diario y perfil de tu cuenta.')+'</p>'+(lastError?'<p>'+safe(lastError)+'</p>':'')+
   btn('Comprobar guardado','VeraJournal.sync()')+'<small>Registros, perfil y datos autorizados de Health Connect se sincronizan automáticamente con tu cuenta. Fotos y conversaciones permanecen en este dispositivo.</small>'+conflicts.map((c,i)=>'<details><summary>Revisar dos cambios: '+safe(c.kind==='record'?(c.local?.note||c.remote?.note||c.key):c.key)+'</summary><p>Hay cambios en dos dispositivos. Conservamos ambas versiones hasta que elijas.</p><p>Este dispositivo: '+safe(signature(c.local))+'</p><p>Cuenta: '+safe(signature(c.remote))+'</p>'+btn('Conservar este dispositivo','VeraJournal.resolve('+i+',false)')+btn('Usar versión de la cuenta','VeraJournal.resolve('+i+',true)')+'</details>').join('');
 }
 function status(){return '<section class=sync14 id=syncStatus21>'+body()+'</section>';}
 function panel(){return status();}
 function refresh(){const target=$('syncStatus21');if(target)target.innerHTML=body();}
 // Acknowledgements are local metadata writes, not a new user action: avoid
 // starting Health Connect or another plan request for every server reply.
 function persist(){markLogs();persistVeraState();}
 function schedule(delay=0){clearTimeout(timer);if(!validSession||!sessionStorage.veraToken)return;timer=setTimeout(()=>sync({quiet:true}),delay);}
 function conflict(kind,key,local,remote,rev){s.syncConflicts21 ||= [];const entry={kind,key,local:clone(local),remote:clone(remote),rev};const at=s.syncConflicts21.findIndex(c=>c.kind===kind&&c.key===key);if(at<0)s.syncConflicts21.push(entry);else s.syncConflicts21[at]=entry;}
 function blocked(kind,key){return (s.syncConflicts21||[]).some(c=>c.kind===kind&&c.key===key);}
 function syncable(record){return record.source!=='health'||(record.healthKey===record.id&&record.id?.startsWith('health_')&&record.healthType);}
 async function perform({quiet=false,signal}={}){
  if(!validSession||!sessionStorage.veraToken||stateReadError)return false;
  const state=s,account=sessionStorage.veraUser,token=sessionStorage.veraToken,nick=s.profile.nick,active=()=>validSession&&sameVeraSession(account,token,state);
  lastError='';
  try{
   markLogs();persist();
   const base=s.diaryRevisions??={},local=new Map(s.logs.filter(syncable).map(r=>[r.id,r]));
   const changes=[];
   for(const id of new Set([...local.keys(),...Object.keys(base)])){
    const record=clone(local.get(id));if(!blocked('record',id)&&signature(record)!==(base[id]?.raw??'null'))changes.push({id,rev:base[id]?.rev||0,record});
   }
   const remote=new Map();let offset=0,cursor='';
   do{
    const batch=changes.slice(offset,offset+40);offset+=batch.length;
    const result=await api('diario',{updates:batch,cursor:cursor||''},false,{signal});if(!active())return false;
    for(const a of result.accepted){const sent=batch.find(r=>r.id===a.id);if(sent)base[a.id]={rev:a.rev,raw:signature(sent.record)};}
    for(const row of [...result.records,...result.conflicts])remote.set(row.id,row);
    cursor=result.next;persist();
   }while(cursor||offset<changes.length);
   for(const [id,row] of remote){
    if((base[id]?.rev||0)>=row.rev)continue;
    const index=s.logs.findIndex(e=>e.id===id),current=s.logs[index],raw=signature(row.record);
    if(signature(current)!==(base[id]?.raw??'null')&&signature(current)!==raw){conflict('record',id,current,row.record,row.rev);continue;}
    if(index>=0)s.logs.splice(index,1,...(row.record?[row.record]:[]));else if(row.record)s.logs.push(row.record);
    base[id]={rev:row.rev,raw};
   }
   persist();
   const fieldBase=s.profileRevisions21??={},localFields=fields(),updates=[];
   for(const field of new Set([...Object.keys(localFields),...Object.keys(fieldBase)])){
    const value=clone(localFields[field]);if(!blocked('field',field)&&signature(value)!==(fieldBase[field]?.raw??'null'))updates.push({field,rev:fieldBase[field]?.rev||0,value});
   }
   const result=await api('profile-sync',{updates},false,{signal});if(!active())return false;
   for(const ack of result.accepted){const sent=updates.find(row=>row.field===ack.field);if(sent)fieldBase[ack.field]={rev:ack.rev,raw:signature(sent.value)};}
   for(const row of result.fields){
    if((fieldBase[row.field]?.rev||0)>=row.rev)continue;
    const current=Object.hasOwn(fields(),row.field)?fieldValue(row.field):undefined,raw=signature(row.value);
    if(signature(current)!==(fieldBase[row.field]?.raw??'null')&&signature(current)!==raw){conflict('field',row.field,current,row.value,row.rev);continue;}
    setField(row.field,row.value);fieldBase[row.field]={rev:row.rev,raw};
   }
   if(result.nick&&s.profile.nick===nick)s.profile.nick=result.nick;
   s.diaryLastSync=new Date().toISOString();persist();
   if(!pending()&&typeof clearConfirmedBanner22==='function')clearConfirmedBanner22();
   if(typeof window.exportHealth23==='function')queueMicrotask(()=>{if(active())window.exportHealth23();});
   if(!quiet)msg((s.syncConflicts21||[]).length?'Revisa los cambios simultáneos en Perfil → Guardado de tu cuenta.':'Registros y perfil sincronizados.');
   return true;
  }catch(error){if(active()){lastError='El servidor no ha confirmado el guardado. '+error.message;if(!quiet)msg(lastError);}return false;}
  finally{if(active())refresh();}
 }
 function sync(options={}){
  clearTimeout(timer);if(running)return running;
  const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
  let success=false;
  running=perform(options).then(result=>{success=result;return result;}).finally(()=>{running=null;refresh();
   if(success&&sessionView&&sameVeraSession(sessionView.owner,sessionView.token,sessionView.state)){
    sessionView=null;const editing=document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]');
    if(['Hoy','Equipo','Progreso'].includes(tab)&&!editing&&!busy&&!recording&&!VeraSpeech14.controller&&!VeraSpeech14.audio&&!attached&&!photoData&&!machinePhoto&&!machinePlate)render();
   }
   if(validSession&&(s!==state||sessionStorage.veraUser!==owner||sessionStorage.veraToken!==token))schedule(0);else if(validSession&&sessionStorage.veraToken&&pending()>(s.syncConflicts21||[]).length)schedule(success?1000:30000);});refresh();return running;
 }
 function onSession(){lastError='';sessionView={owner:sessionStorage.veraUser,token:sessionStorage.veraToken,state:s};schedule(0);}
 async function flush(){
  persist();
  if(!validSession||!sessionStorage.veraToken||stateReadError)return false;
  const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
  const signal=AbortSignal.timeout(90000);
  // A location/import/save can arrive while a previous batch is in flight.
  // Wait for its acknowledgements, then send the remaining edits for this account.
  do{
   if(signal.aborted||!sameVeraSession(owner,token,state))return false;
   const ok=await sync({quiet:true,signal});
   if(!ok||!sameVeraSession(owner,token,state))return false;
   if(!pending())return true;
   if((s.syncConflicts21||[]).length)return false;
  }while(!signal.aborted);
  return false;
 }
 function resolve(index,useRemote){const entry=s.syncConflicts21?.[index];if(!entry)return;const raw=signature(entry.remote);
  if(entry.kind==='record'){if(useRemote){const at=s.logs.findIndex(r=>r.id===entry.key);if(at>=0)s.logs.splice(at,1,...(entry.remote?[clone(entry.remote)]:[]));else if(entry.remote)s.logs.push(clone(entry.remote));}s.diaryRevisions[entry.key]={rev:entry.rev,raw};}
  else{if(useRemote)setField(entry.key,entry.remote);s.profileRevisions21[entry.key]={rev:entry.rev,raw};}
  s.syncConflicts21.splice(index,1);save();refresh();
 }
 window.addEventListener?.('online',()=>schedule(0));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(0);});
 return {panel,sync,status,schedule,onSession,flush,pending,resolve,error:()=>lastError};
})();
