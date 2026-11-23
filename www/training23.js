/* Training uses the existing validated journal schema. Suggestions never create logs. */
async function confirmTrainingWrite247(row,label){
 const state=s,owner=sessionStorage.veraUser,token=sessionStorage.veraToken,id=row.id,raw=JSON.stringify(row);
 msg(label+' pendiente de confirmar en tu cuenta…');
 let confirmed=false;
 try{confirmed=await VeraJournal.flush();}catch{}
 if(!sameVeraSession(owner,token,state))return false;
 const current=s.logs.find(r=>r.id===id);
 if(JSON.stringify(current)!==raw)return false;
 const revision=s.diaryRevisions?.[id];
 if(!confirmed||!revision?.rev||revision.raw!==raw){msg(label+' pendiente de confirmar. Revisa el guardado de la cuenta y reintenta.');return false;}
 msg(label+' guardada en tu cuenta.');
 if(typeof queuePlan21==='function')queuePlan21();
 return true;
}
function trainingKey23(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function trainingRecent23(){
 const seen=new Set();return s.logs.map((row,index)=>({row,index})).filter(x=>x.row.kind==='Entrenamiento'&&trainingDate14(x.row.date)&&x.row.exercise&&x.row.reps?.length)
 .sort((a,b)=>b.row.date.localeCompare(a.row.date)||b.index-a.index).filter(x=>{const key=trainingKey23(x.row.exercise);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
}
function trainingSummary23(date){
 const rows=s.logs.filter(x=>x.kind==='Entrenamiento'&&x.date===date&&trainingDate14(x.date));
 return {rows,sets:rows.reduce((n,r)=>n+(Array.isArray(r.reps)?r.reps.filter(v=>Number.isInteger(Number(v))&&Number(v)>0&&Number(v)<=300).length:0),0),exercises:new Set(rows.map(r=>trainingKey23(r.exercise)).filter(Boolean)).size,volume:trainingVolume14(rows)};
}
function trainingChoose23(index){
 const row=s.logs[index];if(!row||row.kind!=='Entrenamiento'||!trainingDate14(row.date)||!row.reps?.length)return;
 const load=trainingLoad14(row);s.setDraft={exercise:row.exercise,kg:load.enteredKg,mode:load.mode,reps:row.reps.at(-1),rir:row.rir??'',note:'',date:s.setDraft?.date||day(),autoRest:s.setDraft?.autoRest!==false};render();
}
function trainingDateChange23(){draftSet13();render();}
function trainingRowHtml23(row){
 if(row.source==='health'||!Array.isArray(row.reps))return '<div><span><strong>Actividad sincronizada</strong><small>'+safe(row.note||'Health Connect')+'</small><small>Se actualiza desde su origen; no contiene series ni cargas.</small></span></div>';
 const load=trainingLoad14(row);return '<div><span><strong>'+safe(row.exercise)+'</strong><small>'+safe(row.reps.join(' / '))+' rep. · '+load.kg+' kg '+(load.mode==='assistance'?'de asistencia':'totales')+(row.rir!=null?' · RIR '+safe(row.rir):'')+'</small></span>'+btn('Corregir','editTraining14('+s.logs.indexOf(row)+')')+'</div>';
}
function trainingRestPreset23(seconds){if($('restSeconds13'))$('restSeconds13').value=seconds;s.restSeconds13=seconds;}
draftSet13=function(){
 if(!$('setName13'))return;
 s.setDraft={exercise:$('setName13').value.trim(),kg:$('setKg13').value,mode:['side','assistance'].includes($('loadMode13')?.value)?$('loadMode13').value:'total',reps:$('setReps13').value,rir:$('setRir13').value,note:$('setNote13').value,date:$('setDate23')?.value||day(),autoRest:$('autoRest23')?.checked!==false};
 const previous=$('setPrevious13');if(previous)previous.textContent=previousSet13(s.setDraft.exercise);
 // A draft is not an action: do not trigger server synchronization on each keystroke.
};
commitSet13=function(){
 draftSet13();const d=s.setDraft;let record;
 try{record=validateTraining14({exercise:d.exercise,date:d.date,enteredKg:d.kg,mode:d.mode,reps:d.reps,rir:d.rir,note:d.note});}catch(e){return msg(e.message);}
 const rest=Number($('restSeconds13')?.value??s.restSeconds13??90);
 if(d.autoRest&&d.date===day()&&(!Number.isInteger(rest)||rest<5||rest>1800))return msg('El descanso debe durar entre 5 y 1800 segundos.');
 const row={id:uid(),kind:'Entrenamiento',...record};s.logs.push(row);
 s.setDraft={...d,reps:''};
 if(d.autoRest&&d.date===day()){s.restSeconds13=rest;s.restEnds13=Date.now()+rest*1000;}
 save();render();return confirmTrainingWrite247(row,'Serie');
};
setPanel13=function(){
 const d=s.setDraft||{},date=d.date||day(),summary=trainingSummary23(date),recent=trainingRecent23();
 return '<section class="training23"><div class="training-head23"><div><small>TU ENTRENAMIENTO</small><h2>'+ (date===day()?'Cada serie cuenta':'Registro de otro día')+'</h2></div>'+field('setDate23','Fecha',date,'date','max="'+day()+'" onchange="trainingDateChange23()"')+'</div>'+
 '<div class="training-stats23"><div><strong>'+summary.sets+'</strong><span>series registradas</span></div><div><strong>'+summary.exercises+'</strong><span>ejercicios</span></div><div><strong>'+Math.round(summary.volume).toLocaleString('es-ES')+' <small>kg</small></strong><span>volumen externo</span></div></div>'+
 (recent.length?'<div class="training-recent23"><p>Continuar con un ejercicio reciente</p>'+recent.map(x=>btn(safe(x.row.exercise),'trainingChoose23('+x.index+')')).join('')+'<small>Rellena la última carga y repeticiones; revisa y guarda sólo lo que hayas hecho.</small></div>':'<p>Empieza con el ejercicio que has realizado. También puedes encontrarlo en el catálogo de abajo.</p>')+
 '<form class="training-form23" oninput="draftSet13()" onsubmit="event.preventDefault();commitSet13()"><h3>Añadir una serie</h3>'+field('setName13','Ejercicio',d.exercise||'','text','required maxlength="100" placeholder="Ej. Press de banca"')+'<small id="setPrevious13">'+safe(previousSet13(d.exercise))+'</small>'+
 '<div class="training-pair23">'+field('setKg13','Carga (kg)',d.kg??'','number','required min="0" max="2000" step="any" inputmode="decimal"')+field('setReps13','Repeticiones',d.reps??'','number','required min="1" max="300" step="1" inputmode="numeric"')+'</div>'+
 '<details class="training-options23" '+(d.mode&&d.mode!=='total'?'open':'')+'><summary>Tipo de carga, esfuerzo y notas · '+safe({side:'por lado',assistance:'asistencia'}[d.mode]||'peso total')+'</summary><label>Cómo cuentas la carga<select id="loadMode13">'+[['total','Peso total'],['side','Por lado × 2'],['assistance','Asistencia (no suma volumen)']].map(([v,t])=>'<option value="'+v+'" '+(d.mode===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'+field('setRir13','Repeticiones en reserva (opcional)',d.rir??'','number','min="0" max="10" step="1"')+'<small>'+rirHelp14+'</small>'+field('setNote13','Nota técnica (opcional)',d.note||'','text','maxlength="240"')+'</details><button class="primary training-submit23">✓ Registrar serie realizada</button></form>'+
 '<div class="training-rest23"><div><h3>Tu descanso</h3><output id="restClock13" aria-live="off">'+restTime13()+'</output></div><label class="training-check23"><input type="checkbox" id="autoRest23" '+(d.autoRest!==false?'checked':'')+' onchange="draftSet13()"> Iniciar al registrar una serie de hoy</label><div class="training-pair23">'+field('restSeconds13','Segundos',s.restSeconds13||90,'number','min="5" max="1800" step="1"')+'<div class="training-presets23">'+[60,90,120].map(n=>btn(n+' s','trainingRestPreset23('+n+')')).join('')+'</div></div>'+btn('Iniciar','rest13(true)')+btn('Terminar descanso','rest13(false)')+'</div>'+
 '<details class="training-log23" '+(summary.rows.length?'open':'')+'><summary>Registros de este día · '+summary.sets+' series</summary>'+(summary.rows.length?summary.rows.map(trainingRowHtml23).join(''):'<p>Aún no hay series registradas para esta fecha.</p>')+'</details></section>';
};
const trainingAreaPrevious23=areaPage;
areaPage=function(){return tab==='Entrenamiento'?setPanel13()+'<details class="training-catalog23"><summary>Explorar ejercicios en español</summary>'+VeraCatalog.panel('exercise')+'</details>'+btn('Mi gimnasio y material',"go('Máquinas')"):trainingAreaPrevious23();};
