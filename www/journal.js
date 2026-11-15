const VeraJournal=(()=>{
 let busy=false;
 function panel(){return '<details><summary>Sincronizar mi diario</summary><p>Envía tus registros manuales a tu cuenta y recupera los del otro dispositivo. Fotos, conversaciones y lecturas de Health Connect quedan fuera.</p>'+btn('Sincronizar ahora','VeraJournal.sync()',true)+'</details>';}
 async function sync(){
  if(busy)return;busy=true;
  const state=s,account=sessionStorage.veraUser,active=()=>s===state&&validSession&&sessionStorage.veraUser===account;
  const base=s.diaryRevisions??={},signature=r=>JSON.stringify(r??null);
  try{
   markLogs();const local=new Map(s.logs.filter(r=>r.source!=='health').map(r=>[r.id,r]));
   let changes=[];
   for(const id of new Set([...local.keys(),...Object.keys(base)])){
    const record=local.get(id)||null,raw=signature(record);
    if(raw!==(base[id]?.raw??'null'))changes.push({id,rev:base[id]?.rev||0,record:JSON.parse(raw)});
   }
   const remote=new Map();let offset=0,cursor='';
   do{
    const batch=changes.slice(offset,offset+40);offset+=batch.length;
    const result=await api('diario',{updates:batch,cursor:cursor||''});if(!active())return;
    for(const a of result.accepted)base[a.id]={rev:a.rev,raw:signature(batch.find(r=>r.id===a.id).record)};
    for(const r of [...result.records,...result.conflicts])remote.set(r.id,r);
    cursor=result.next;save();
   }while(cursor||offset<changes.length);
   for(const [id,r] of remote){
    if(!active())return;if((base[id]?.rev||0)>=r.rev)continue;
    const index=s.logs.findIndex(e=>e.id===id),current=s.logs[index],raw=signature(r.record);
    if(signature(current)!==(base[id]?.raw??'null')&&signature(current)!==raw&&!confirm('Dos cambios en '+(current?.note||r.record?.note||id)+'. ¿Usar la versión de la cuenta? Cancelar conserva tu cambio local para la próxima sincronización.')){base[id]={rev:r.rev,raw};continue;}
    if(index>=0)s.logs.splice(index,1,...(r.record?[r.record]:[]));else if(r.record)s.logs.push(r.record);
    base[id]={rev:r.rev,raw};
   }
   save();render();msg('Diario sincronizado.');
  }catch(e){if(active())msg('El diario sigue en tu dispositivo. '+e.message);}finally{busy=false;}
 }
 return {panel,sync};
})();
