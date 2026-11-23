/* V2.3 sleep: end-date attribution, explicit awake minutes, interval deduplication. */
let sleepEdit23=-1,sleepEditingContext23=null;
function sleepAccount23(){return typeof sessionStorage==='undefined'?{owner:'',token:''}:{owner:sessionStorage.veraUser,token:sessionStorage.veraToken};}
function cancelSleepEdit23(){sleepEdit23=-1;sleepEditingContext23=null;}
function editSleep23(index){
 const row=s.logs[index];if(!row||row.kind!=='Sueño'||row.source==='health'||row.source==='Health Connect')return;
 sleepEdit23=index;sleepEditingContext23={...sleepAccount23(),state:s,row,id:row.id,snapshot:JSON.stringify(row)};render();
}
function currentSleepEdit23(){
 const context=sleepEditingContext23,account=sleepAccount23();if(!context||context.state!==s||context.owner!==account.owner||context.token!==account.token)return -1;
 const index=context.id?s.logs.findIndex(row=>row.id===context.id):s.logs.indexOf(context.row),row=s.logs[index];
 return row?.kind==='Sueño'&&row.source!=='health'&&row.source!=='Health Connect'&&JSON.stringify(row)===context.snapshot&&(!context.id||s.logs.filter(item=>item.id===context.id).length===1)?index:-1;
}
function sleepUnion23(spans){
 const out=[];for(const pair of (spans||[]).filter(x=>Array.isArray(x)&&x.length===2&&x.every(Number.isFinite)&&x[1]>x[0]).map(x=>[...x]).sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&pair[0]<=last[1])last[1]=Math.max(last[1],pair[1]);else out.push(pair);}return out;
}
function sleepSubtract23(spans,cuts){
 let out=sleepUnion23(spans);for(const [a,b]of sleepUnion23(cuts)){const next=[];for(const[x,y]of out){if(b<=x||a>=y)next.push([x,y]);else{if(x<a)next.push([x,a]);if(b<y)next.push([b,y]);}}out=next;}return out;
}
const normalizeBeforeSleep23=normalizeHealth21;
normalizeHealth21=function(type,rows){
 const normalized=normalizeBeforeSleep23(type,rows);if(type!=='sleep')return normalized;
 return normalized.map(log=>{
  const spans=[];for(const row of rows){if(row.date!==log.date||!Number.isFinite(row.start)||!Number.isFinite(row.end)||row.end<=row.start||row.end-row.start>86400000||row.end>Date.now()+60000)continue;spans.push(...sleepSubtract23([[row.start,row.end]],row.awake||[]));}
  const sleepSpans=sleepUnion23(spans);return {...log,sleepSpans,value:sleepSpans.reduce((n,[a,b])=>n+b-a,0)/3600000};
 });
};
function sleepSummary23(logs,date){
 const seen=new Set(),rows=(logs||[]).filter(row=>{if(row.kind!=='Sueño'||row.date!==date||(row.id&&seen.has(row.id)))return false;if(row.id)seen.add(row.id);return true;});
 const health=rows.filter(r=>r.source==='health'||r.source==='Health Connect'),manual=rows.filter(r=>!health.includes(r));
 let minutes=0,night=0,nap=0,covered=[],legacy=0,uncertain=false;
 // Most recent manual correction wins in an overlapping interval. Older imported daily totals cannot be located in time.
 for(const row of [...manual].reverse()){
  const hasInterval=Number.isFinite(row.start)&&Number.isFinite(row.end)&&row.end>row.start&&row.end-row.start<=86400000;
  const recorded=numberMetric21(row.minutes)??(numberMetric21(row.value)===null?null:Number(row.value)*60);
  if(!hasInterval){if(recorded!==null&&recorded<=1440)legacy+=recorded;continue;}
  const duration=(row.end-row.start)/60000,awake=numberMetric21(row.awakeMinutes)??(recorded===null?0:Math.max(0,duration-recorded));
  if(awake>=duration)continue;
  const remaining=sleepSubtract23([[row.start,row.end]],covered).reduce((n,[a,b])=>n+(b-a)/60000,0);
  if(remaining<duration&&awake>0){uncertain=true;continue;} // Never invent where unlocated awake minutes occurred.
  const value=remaining-awake;minutes+=value;if(row.restType==='Siesta')nap+=value;else night+=value;covered.push([row.start,row.end]);
 }
 const healthSpans=sleepUnion23(health.flatMap(r=>Array.isArray(r.sleepSpans)?r.sleepSpans:[]));
 let imported=sleepSubtract23(healthSpans,covered).reduce((n,[a,b])=>n+(b-a)/60000,0);
 if(!healthSpans.length&&health.length){const totals=health.map(r=>numberMetric21(r.value)).filter(x=>x!==null&&x<=24);if(totals.length){if(minutes||legacy)uncertain=true;else imported=Math.max(...totals)*60;}}
 if(legacy){if(minutes||imported)uncertain=true;else minutes=legacy;}
 const total=minutes+imported;
 return {date,minutes:total,hours:total/60,night,nap,imported,hasData:total>0,uncertain,records:rows.length};
}
readiness=function(){
 const summary=sleepSummary23(s.logs,day());if(!summary.hasData)return {text:'Todavía no hay sueño registrado para hoy.'};
 const goal=Number(s.need||8),check=s.logs.filter(r=>r.date===day()&&['Sueño','Sensaciones'].includes(r.kind)&&r.group).at(-1);
 let text=summary.hours.toLocaleString('es-ES',{maximumFractionDigits:1})+' h de descanso · objetivo '+goal+' h. ';
 if(summary.nap)text+='Incluye '+Math.round(summary.nap)+' min de siesta. ';
 if(summary.uncertain)text+='Revisa registros solapados o antiguos sin horario. ';
 if(check){const sore=numberMetric21(check.sore),tired=numberMetric21(check.tired);text+=check.group+': '+(sore===null?'agujetas sin dato':'agujetas '+sore+'/10')+', '+(tired===null?'fatiga sin dato':'fatiga '+tired+'/10')+'. ';if(summary.hours<goal-1||(sore!==null&&sore>=6)||(tired!==null&&tired>=6))text+='Revisa cómo te encuentras antes de entrenar.';}
 return {hours:summary.hours,group:check?.group,text};
};
let sleepView246=[],sleepRevision246=0,sleepBusy246=false;
function sleepLabel246(row){
 const type=row.restType||((row.source==='health'||row.source==='Health Connect')?'Health Connect':'Descanso');
 const hours=numberMetric21(row.value)??(Number.isFinite(row.minutes)?row.minutes/60:null);
 const clock=n=>new Date(n).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
 const spans=Number.isFinite(row.start)&&Number.isFinite(row.end)?[[row.start,row.end]]:sleepUnion23(row.sleepSpans);
 return type+' · '+(hours===null?'Duración desconocida':metricNumber21(hours)+' h')+(spans.length?' · '+spans.map(([a,b])=>clock(a)+'–'+clock(b)).join(', '):' · Sin horario');
}
function sleepHistory246(){
 const account=sleepAccount23(),revision=++sleepRevision246;
 sleepView246=s.logs.map((row,index)=>({row,index,state:s,account,snapshot:row.kind==='Sueño'?JSON.stringify(row):''})).filter(x=>x.row.kind==='Sueño');
 return sleepView246.slice(-14).reverse().map(item=>{
  const {row,index}=item,peers=sleepView246.filter(x=>x!==item&&x.row.date===row.date);
  const keep=peers.map(x=>'<button type="button" onclick="resolveSleep246('+revision+','+index+','+x.index+')">Conservar '+safe(sleepLabel246(x.row))+'</button>').join('');
  return '<article><b>'+safe(row.date)+' · '+safe(sleepLabel246(row))+'</b><p>'+(row.awakeMinutes?safe(row.awakeMinutes)+' min despierto':'')+'</p>'+((row.source!=='health'&&row.source!=='Health Connect'&&Number.isFinite(row.start)&&Number.isFinite(row.end))?'<button onclick="editSleep23('+index+')">Corregir</button>':'')+'<details><summary>Gestionar registro</summary><button onclick="resolveSleep246('+revision+','+index+')">Eliminar de VERA</button>'+(keep?'<details><summary>Fusionar con otro descanso</summary><p>Elige el registro del mismo día que quieres conservar. Este registro se retirará del total.</p>'+keep+'</details>':'')+'</details></article>';
 }).join('');
}
async function resolveSleep246(revision,index,keepIndex){
 if(sleepBusy246)return;
 const resolve=i=>{
  const entry=sleepView246.find(x=>x.index===i),account=sleepAccount23();
  if(!entry||sleepRevision246!==revision||entry.state!==s||entry.account.owner!==account.owner||entry.account.token!==account.token)return;
  const matches=s.logs.filter(row=>entry.row.id?row.id===entry.row.id:row===entry.row);
  if(matches.length===1&&JSON.stringify(matches[0])===entry.snapshot)return matches[0];
 };
 const row=resolve(index),kept=keepIndex===undefined?null:resolve(keepIndex);
 if(!row||(keepIndex!==undefined&&(!kept||kept===row||kept.date!==row.date)))return msg('Los registros han cambiado. Revisa la lista antes de continuar.');
 const description=row.date+' · '+sleepLabel246(row);
 if(!confirm(kept?'¿Fusionar estos descansos? Se conservará '+sleepLabel246(kept)+' y se retirará '+description+' de VERA.':'¿Eliminar de VERA el descanso '+description+'?'))return;
 sleepBusy246=true;
 try{await suppressSleep246([row]);cancelSleepEdit23();render();msg(kept?'Descansos fusionados.':'Descanso eliminado de VERA.');}
 catch(error){msg(error.message||'No se pudo guardar el cambio.');}
 finally{sleepBusy246=false;}
}
sleepPage=function(){
 if(sleepEdit23>=0){const current=currentSleepEdit23();if(current<0)cancelSleepEdit23();else sleepEdit23=current;}
 const old=s.logs[sleepEdit23],editing=old?.kind==='Sueño'&&old.source!=='health',end=editing?new Date(old.end):new Date(),start=editing?new Date(old.start):new Date(+end-Number(s.need||8)*3600000),today=day(),current=sleepSummary23(s.logs,today);
 const history=[];for(let offset=6;offset>=0;offset--){const date=new Date();date.setDate(date.getDate()-offset);const row=sleepSummary23(s.logs,day(date));history.push({...row,value:row.hasData?row.hours:null});}
 const measured=history.filter(r=>r.hasData),average=measured.length?measured.reduce((n,r)=>n+r.hours,0)/measured.length:null;
 return '<section class="sleep-summary23"><span class="eyebrow21">Tu descanso también cuenta</span><h2>Sueño y recuperación</h2><div class="metric-grid21"><div class="metric-card21"><p>Hoy · noches y siestas</p><h3>'+ (current.hasData?metricNumber21(current.hours)+' h':'Sin registro')+'</h3></div><div class="metric-card21"><p>Media · últimos 7 días</p><h3>'+ (average===null?'Sin datos':metricNumber21(average)+' h')+'</h3><small>'+measured.length+' días registrados</small></div></div><p>Objetivo personal: '+safe(s.need||8)+' h · '+btn('Cambiar en Perfil',"go('Perfil')")+'</p>'+barsGraph22(history,'value','Descanso','h')+'<p class="sub">Cada noche cuenta en la fecha en la que despiertas. Se descuentan los minutos despierto; las siestas se suman. Sin registro no equivale a cero horas.</p></section>'+
 '<form onsubmit="sleepSave(event)"><section><h3>'+(editing?'Corregir descanso':'Registrar noche o siesta')+'</h3>'+field('start','Me dormí',localtime(start),'datetime-local','required')+field('end','Me desperté',localtime(end),'datetime-local','required')+field('awake','Minutos despierto dentro del intervalo',editing?old.awakeMinutes||0:0,'number','min="0" step="1" required')+selectField('restType','Tipo de descanso',['Noche','Siesta'],editing?old.restType:'Noche')+'<details><summary>Sensaciones al despertar (opcional)</summary>'+field('muscle','Grupo muscular',editing?old.group||'':'','text','maxlength="100"')+field('sore','Agujetas (0–10)',editing?old.sore??'':'','number','min="0" max="10"')+field('tired','Fatiga (0–10)',editing?old.tired??'':'','number','min="0" max="10"')+'</details><button class="primary">'+(editing?'Guardar corrección':'Guardar descanso')+'</button>'+(editing?'<button type="button" onclick="cancelSleepEdit23();render()">Cancelar</button>':'')+'</section></form><section><h3>Tus últimos descansos</h3>'+sleepHistory246()+'<p class="sub">Los intervalos manuales corrigen el mismo tramo importado sin sumarlo dos veces. Si faltan horarios, se indica que los datos requieren revisión.</p></section>';
};
sleepSave=function(event){
 event.preventDefault();const start=+new Date($('start').value),end=+new Date($('end').value),optional=id=>$(id).value.trim()===''?null:Number($(id).value),awake=Number($('awake').value);let minutes;
 try{minutes=validateSleepInput({start,end,awake,need:Number(s.need||8),sore:optional('sore'),tired:optional('tired')});}catch(error){return msg(error.message);}
 const wasEditing=sleepEdit23>=0,index=wasEditing?currentSleepEdit23():-1,old=s.logs[index];if(wasEditing&&index<0){cancelSleepEdit23();return msg('La cuenta o el registro ha cambiado. Vuelve a abrir el descanso.');}
 if(s.logs.some((r,i)=>i!==index&&r.kind==='Sueño'&&r.source!=='health'&&r.start<end&&r.end>start))return msg('Ese horario se solapa con otro descanso manual. Corrige el registro existente.');
 const row={...(old||{}),kind:'Sueño',date:day(new Date(end)),start,end,minutes,value:minutes/60,awakeMinutes:awake,restType:$('restType').value,group:$('muscle').value.trim(),sore:optional('sore'),tired:optional('tired'),note:$('restType').value+' · '+minutes+' min'};
 if(index>=0)s.logs[index]=row;else s.logs.push(row);cancelSleepEdit23();save();render();msg('Descanso enviado para guardar en tu cuenta.');
};
