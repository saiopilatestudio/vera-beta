/* Account identity is verified by the server; OS permissions are queried afresh. */
let googleState23=null,googleOwner23='',googleToken23='',googleChecking23=false,googleError23='',googlePoll23=null;
let googleRenderStamp24='';
function googleActive23(owner,token){return validSession&&sessionStorage.veraUser===owner&&sessionStorage.veraToken===token;}
function googleLinked23(){return validSession&&googleOwner23===sessionStorage.veraUser&&googleToken23===sessionStorage.veraToken&&googleState23?.configured===true&&googleState23?.linked===true;}
function healthAccess23(){try{return JSON.parse(window.VeraNative.healthPermissions23());}catch{return {supported:false,complete:false};}}
async function googleRequest23(path,method='GET'){
 const response=await fetch(ACCOUNT_HOST+path,{method,credentials:'omit',headers:{Authorization:'Bearer '+sessionStorage.veraToken,Accept:'application/json',...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(30000)});let data;try{data=await response.json();}catch{throw Error('No se pudo comprobar la conexión con Google.');}if(!response.ok)throw Error(data.error||'No se pudo conectar con Google.');return data;
}
async function refreshGoogle23(){
 if(!validSession||googleChecking23)return;const owner=sessionStorage.veraUser,token=sessionStorage.veraToken;googleChecking23=true;
 try{const result=await googleRequest23('/google/status');if(!googleActive23(owner,token))return;googleState23=result;googleOwner23=owner;googleToken23=token;googleError23='';}
 catch(error){if(googleActive23(owner,token)){googleState23=null;googleOwner23=owner;googleToken23=token;googleError23=error.message;}}
 finally{googleChecking23=false;if(validSession){const current=googleActive23(owner,token),stamp=JSON.stringify([googleOwner23,googleToken23,googleState23,googleError23,healthAccess23()]);if(!current||stamp!==googleRenderStamp24){googleRenderStamp24=stamp;render();}if(current&&googleState23?.linked){exportHealth23();if(typeof requestHealth21==='function')requestHealth21(false,true);}}}
}
async function connectGoogle23(){
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken;
 try{const result=await googleRequest23('/google/start','POST');if(!googleActive23(owner,token))return;
 const url=new URL(result.url);if(url.protocol!=='https:'||url.host!=='accounts.google.com'||url.pathname!=='/o/oauth2/v2/auth')throw Error('Dirección de Google no válida.');
 if(window.VeraNative?.openGoogle23)window.VeraNative.openGoogle23(url.href);else window.open(url.href,'_blank','noopener,noreferrer');
 clearInterval(googlePoll23);let attempts=0;googlePoll23=setInterval(()=>{if(!googleActive23(owner,token)||googleState23?.linked||++attempts>120){clearInterval(googlePoll23);return;}if(!document.hidden)refreshGoogle23();},5000);
 }catch(error){if(googleActive23(owner,token))msg(error.message);}
}
function googleGateBody23(){
 if(!validSession)return '';const same=googleOwner23===sessionStorage.veraUser&&googleToken23===sessionStorage.veraToken;
 if(!same||(!googleState23&&!googleError23)){if(!googleChecking23)queueMicrotask(refreshGoogle23);return '<section class="card"><h2>Preparando tu cuenta</h2><p>Comprobando la conexión con Google…</p></section>';}
 if(!googleState23)return '<section class="card"><h2>No se pudo comprobar Google</h2><p>'+safe(googleError23)+'</p>'+btn('Reintentar','refreshGoogle23()')+'</section>';
 if(!googleState23.configured)return '<section class="card"><h2>Conexión con Google pendiente</h2><p>El servidor aún necesita activar el acceso con Google. Tus datos se conservan. El administrador debe configurar esta conexión para completar el acceso obligatorio.</p>'+btn('Comprobar de nuevo','refreshGoogle23()')+'</section>';
 if(!googleState23.linked)return '<section class="card"><h2>Conecta tu cuenta de Google</h2><p>Es un paso obligatorio para usar Vera. Se abrirá Google en tu navegador para que elijas tu cuenta.</p>'+btn('Conectar con Google','connectGoogle23()')+btn('Ya he conectado','refreshGoogle23()')+'</section>';
 const health=healthAccess23();if(!health.supported)return '<section class="card"><h2>Health Connect es necesario</h2><p>Esta versión requiere la APK en Android 14 o posterior para compartir tus registros de salud. La conexión de Google está guardada.</p></section>';
 if(!health.complete)return '<section class="card"><h2>Conecta tus datos de salud</h2><p>Autoriza en Android la lectura y escritura de pasos, entrenamientos, sueño, peso, nutrición e hidratación. Puedes revocar los permisos desde Health Connect; Vera los necesita para continuar.</p>'+btn('Conceder permisos','syncHealth()')+btn('Comprobar permisos','render()')+'</section>';
 return '';
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&validSession)refreshGoogle23();});
// Export only server-acknowledged VERA entries. Stable client IDs + server revisions
// make retries idempotent; Health Connect imports never enter this channel.
function healthAccount23(owner){const id=String(owner||'').split('/').pop();return /^[a-f0-9]{32}$/.test(id)?id:null;}
function healthRecords23(logs,revisions,owner){
 owner=healthAccount23(owner);if(!owner)return [];
 const output=[],now=Date.now();
 for(const row of logs||[]){const ack=revisions?.[row.id];if(!ack||ack.raw!==JSON.stringify(row)||!Number.isSafeInteger(ack.rev)||ack.rev<1||row.source==='health'||row.source==='Health Connect'||String(row.id).startsWith('health_'))continue;
 const noon=Date.parse(row.date+'T12:00:00'),start=Number.isFinite(row.start)?row.start:Math.min(noon,now-1000);if(!Number.isFinite(start))continue;
 const base={id:row.id,owner,source:'vera',version:ack.rev,start,end:start+1};
 const push=(type,extra)=>output.push({...base,type,...extra});
 if(['Peso en ayunas','Otro pesaje'].includes(row.kind)&&numberMetric21(row.value)>0)push('WEIGHT',{value:Number(row.value)});
 if(['Comida','Suplemento'].includes(row.kind)){
  const item={nutrients:{}};for(const [from,to]of [['kcal','value'],['protein','protein'],['carbs','carbs'],['fat','fat']]){const n=nutritionValue21(row,from);if(n!==null)item[to]=n;}
  for(const [key]of nutrientFields21){const n=nutritionValue21(row,key);if(n!==null)item.nutrients[key]=n;}if(Object.keys(item).length>1||Object.keys(item.nutrients).length)push('NUTRITION',item);
 }
 const water=row.kind==='Agua'?numberMetric21(row.value):row.kind==='Suplemento'?numberMetric21(row.mixingLiquid?.ml):null;if(water>0)push('HYDRATION',{value:water});
 // Duration-only historical entries cannot provide reliable interval timestamps.
 if(Number.isFinite(row.start)&&Number.isFinite(row.end)&&row.end>row.start&&row.end<=now){
  if(row.kind==='Sueño'&&!Number(row.awakeMinutes))push('SLEEP',{end:row.end});
  if(['Entrenamiento','Cardio'].includes(row.kind))push('EXERCISE',{end:row.end,cycling:/bici|ciclismo/i.test(row.note||''),title:String(row.note||'Entrenamiento Vera').slice(0,200)});
  if(row.kind==='Pasos'&&Number.isInteger(row.value))push('STEPS',{end:row.end,value:row.value});
 }
 }return output;
}
function healthDeletions23(logs,revisions,owner,desired){
 owner=healthAccount23(owner);if(!owner)return [];
 const wanted=new Set(desired.map(r=>r.type+'_'+r.id)),current=new Map((logs||[]).map(r=>[r.id,r])),result=[];
 for(const [id,ack]of Object.entries(revisions||{})){if(id.startsWith('health_')||!Number.isSafeInteger(ack.rev)||ack.rev<1)continue;const row=current.get(id);if(ack.raw!==JSON.stringify(row??null)||row?.source==='health'||row?.source==='Health Connect')continue;
  for(const type of ['STEPS','EXERCISE','SLEEP','WEIGHT','NUTRITION','HYDRATION'])if(!wanted.has(type+'_'+id))result.push({id,owner,source:'vera',type,version:ack.rev,deleted:true});
 }return result;
}
let healthWriting23=null;const healthSent23=new Map();
async function performHealthExport23(){
 if(healthWriting23||!validSession||!healthAccess23().complete||!window.VeraNative?.writeHealth23)return false;
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;if(googleOwner23!==owner||googleToken23!==token||!googleState23?.linked)return false;
 const desired=healthRecords23(s.logs,s.diaryRevisions,owner),rows=[...healthDeletions23(s.logs,s.diaryRevisions,owner,desired),...desired].filter(r=>healthSent23.get(owner+'_'+r.type+'_'+r.id)!==r.version+(r.deleted?'D':'W')); 
 const batches=[];for(const deleting of [true,false]){const group=rows.filter(r=>!!r.deleted===deleting);for(let i=0;i<group.length;i+=100)batches.push(group.slice(i,i+100));}
 for(const batch of batches){if(!googleActive23(owner,token)||s!==state)return false;const ticket='w'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const ok=await new Promise(resolve=>{const timer=setTimeout(()=>{if(healthWriting23?.ticket===ticket)healthWriting23=null;resolve(false);},30000);healthWriting23={ticket,owner,token,state,resolve:ok=>{clearTimeout(timer);resolve(ok);}};try{const execute=()=>{const deleting=batch[0]?.deleted;if(!batch.every(r=>!!r.deleted===!!deleting))throw Error('Lote mixto');window.VeraNative[deleting?'deleteHealth23':'writeHealth23'](ticket,JSON.stringify(batch));};execute();}catch{clearTimeout(timer);healthWriting23=null;resolve(false);}});
  if(!ok||!googleActive23(owner,token)||s!==state)return false;for(const row of batch)healthSent23.set(owner+'_'+row.type+'_'+row.id,row.version+(row.deleted?'D':'W'));
 }return true;
}
function healthWritten23(ticket,ok){const request=healthWriting23;if(!request||request.ticket!==ticket)return;healthWriting23=null;request.resolve(ok===true&&googleActive23(request.owner,request.token)&&s===request.state);}

function googleGate23(){const content=googleGateBody23();return content?content+'<div class="google-account23">'+btn('Cambiar de cuenta','signOut()')+'</div>':'';}

let healthExportJob23=null,healthExportAgain23=false;
function exportHealth23(){if(healthExportJob23){healthExportAgain23=true;return healthExportJob23;}healthExportJob23=performHealthExport23().finally(()=>{healthExportJob23=null;if(healthExportAgain23){healthExportAgain23=false;queueMicrotask(exportHealth23);}});return healthExportJob23;}
