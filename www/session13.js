/* Schema 2 stores external loads as total kg; assistance stays a separate measure.
   Legacy machine entries used per-side kg, while quick series already stored totals. */
function trainingDate14(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
 const date=new Date(value+'T12:00:00');return Number.isFinite(+date)&&day(date)===value&&value<=day();
}
function trainingLoad14(row){
 const mode=row.loadMode==='side'||row.mode==='Por lado'?'side':row.loadMode==='assistance'||row.mode==='Asistencia'?'assistance':'total';
 const stored=Number(row.kg),kg=mode==='side'&&row.loadSchema!==2&&row.loadMode!=='side'?stored*2:stored;
 return {mode,kg,enteredKg:row.enteredKg!=null?Number(row.enteredKg):mode==='side'?kg/2:kg,externalKg:mode==='assistance'?0:kg};
}
function validateTraining14(input){
 const exercise=String(input.exercise||'').trim(),date=input.date||day(),mode=['side','Por lado'].includes(input.mode)?'side':['assistance','Asistencia'].includes(input.mode)?'assistance':'total';
 const enteredKg=Number(input.enteredKg),kg=enteredKg*(mode==='side'?2:1),reps=Array.isArray(input.reps)?input.reps.map(Number):String(input.reps||'').trim().split(/[, ]+/).map(Number),rir=input.rir==null||input.rir===''?null:Number(input.rir);
 if(!exercise||exercise.length>100||!trainingDate14(date)||input.enteredKg==null||String(input.enteredKg).trim()===''||!Number.isFinite(kg)||kg<0||kg>2000||!reps.length||reps.length>100||reps.some(x=>!Number.isInteger(x)||x<1||x>300)||(rir!==null&&(!Number.isInteger(rir)||rir<0||rir>10)))throw Error('Revisa el ejercicio, la fecha, la carga (0–2000 kg totales), las series (1–100), las repeticiones (1–300) y el RIR opcional (0–10).');
 const trainingNote=String(input.note||'').trim().slice(0,1000);
 return {exercise,date,kg,enteredKg,loadMode:mode,loadSchema:2,mode:{side:'Por lado',total:'Carga externa',assistance:'Asistencia'}[mode],reps,rir,trainingNote,note:[exercise,reps.join(' / ')+' rep.',mode==='assistance'?kg+' kg de asistencia':kg+' kg en total',mode==='side'?enteredKg+' kg por lado':'',rir!==null?'RIR '+rir:'',trainingNote].filter(Boolean).join(' · ')};
}
function trainingRows14(days){const start=new Date();start.setDate(start.getDate()-days+1);return s.logs.filter(x=>x.kind==='Entrenamiento'&&trainingDate14(x.date)&&x.date>=day(start));}
function trainingVolume14(rows){return rows.reduce((sum,x)=>{const kg=trainingLoad14(x).externalKg;return sum+(Number.isFinite(kg)&&kg>=0?kg:0)*(Array.isArray(x.reps)?x.reps.reduce((n,r)=>n+(Number.isInteger(Number(r))&&r>0&&r<=300?Number(r):0),0):0);},0);}
const rirHelp14='RIR: repeticiones que crees que podrías hacer todavía con una técnica similar. Es una estimación; déjalo vacío si no lo sabes. No necesitas llegar al fallo para registrarlo.';
function previousSet13(exercise) {
  const key = name => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  if (!key(exercise)) return '';
  const log = s.logs.filter(row => row.kind === 'Entrenamiento' && key(row.exercise) === key(exercise) &&
    trainingDate14(row.date) && Number.isFinite(trainingLoad14(row).kg) && row.reps?.length).reduce((last,row) => !last || row.date >= last.date ? row : last,null);
  return log ? 'Última serie · '+log.date+' · '+log.reps.at(-1)+' rep. · '+trainingLoad14(log).kg+(trainingLoad14(log).mode==='assistance'?' kg de asistencia':' kg en total') : '';
}
function restTime13() {
  const seconds = Math.max(0,Math.ceil(((s.restEnds13 || 0)-Date.now())/1000));
  return seconds ? Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0') : (s.restEnds13 ? 'Descanso terminado' : 'Listo');
}
function rest13(start) {
  const duration = Number($('restSeconds13').value);
  if(start && (!Number.isInteger(duration)||duration<5||duration>1800))return msg('Elige entre 5 y 1800 segundos.');
  if(start)s.restSeconds13=duration;
  s.restEnds13=start ? Date.now()+duration*1000 : 0;
  save(); $('restClock13').textContent=restTime13();
}
if(typeof window!=='undefined') window.setInterval(()=>{
  const target=$('restClock13');
  if(target && target.textContent!==restTime13())target.textContent=restTime13();
},500);
function setPanel13() {
  const d=s.setDraft||{};
  return '<details open class="series13"><summary>Registrar una serie</summary><form oninput="draftSet13()" onsubmit="event.preventDefault();commitSet13()">'+
  field('setName13','Ejercicio',d.exercise||'','text','required maxlength="100"')+
  '<small id="setPrevious13">'+safe(previousSet13(d.exercise))+'</small>'+
  '<div class="loadPair13">'+field('setKg13','Carga (kg)',d.kg??'','number','required min="0" step="any"')+
  '<label>Cómo cuentas la carga<select id="loadMode13"><option value="total">Peso total</option><option value="side" '+(d.mode==='side'?'selected':'')+'>Peso por lado × 2</option><option value="assistance" '+(d.mode==='assistance'?'selected':'')+'>Asistencia</option></select></label></div>'+
  '<div class="loadPair13">'+field('setReps13','Repeticiones',d.reps??'','number','required min="1" max="300"')+
  field('setRir13','En reserva (RIR)',d.rir??'','number','min="0" max="10"')+'</div><p><small>'+rirHelp14+'</small></p>'+
  field('setNote13','Nota técnica',d.note||'','text','maxlength="240"')+'<button class="primary">Guardar serie</button></form>'+
  '<div class="rest13"><h3>Descanso</h3><output id="restClock13" aria-live="off">'+restTime13()+'</output>'+
  field('restSeconds13','Segundos',s.restSeconds13||90,'number','min="5" max="1800"')+
  btn('Iniciar descanso','rest13(true)')+btn('Cancelar descanso','rest13(false)')+'</div></details>';
}
function draftSet13() {
  s.setDraft={exercise:$('setName13').value.trim(), kg:$('setKg13').value, mode:['side','assistance'].includes($('loadMode13')?.value)?$('loadMode13').value:'total',
    reps:$('setReps13').value,rir:$('setRir13').value,note:$('setNote13').value};
  const previous=$('setPrevious13');
  if(previous)previous.textContent=previousSet13(s.setDraft.exercise);
  save();
}
function commitSet13() {
  draftSet13();
  const d=s.setDraft;let record;
  try{record=validateTraining14({exercise:d.exercise,date:day(),enteredKg:d.kg,mode:d.mode,reps:d.reps,rir:d.rir,note:d.note});}catch(e){return msg(e.message);}
  s.logs.push({id:uid(),kind:'Entrenamiento',...record});
  s.setDraft={...d,reps:''};save();render();msg('Serie guardada en este dispositivo. Pendiente de sincronizar.');
}

let trainingEditContext14=null;
function editTraining14(i){
 trainingEditContext14=null;
 const row=s.logs[i];
 if(!validSession||!row||row.kind!=='Entrenamiento'||row.source==='health')return msg('Abre un entrenamiento manual de tu cuenta para corregirlo.');
 if(!row.id)row.id=uid();
 const load=trainingLoad14(row);
 trainingEditContext14={owner:sessionStorage.veraUser,token:sessionStorage.veraToken,state:s,id:row.id,snapshot:JSON.stringify(row)};
 $('view').innerHTML='<h1>Corregir entrenamiento</h1><section>'+field('correctExercise','Ejercicio',row.exercise||'','text','required maxlength="100"')+field('correctDate','Fecha',row.date,'date','required max="'+day()+'"')+field('correctKg','Carga introducida (kg)',load.enteredKg,'number','required min="0" step="any"')+'<label>Medida de la carga<select id="correctMode">'+[['total','Peso total'],['side','Por lado × 2'],['assistance','Asistencia']].map(([v,t])=>'<option value="'+v+'" '+(load.mode===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'+field('correctReps','Repeticiones por serie',(row.reps||[]).join(', '))+field('correctRir','RIR opcional',row.rir??'','number','min="0" max="10"')+'<p><small>'+rirHelp14+'</small></p>'+field('correctTrainingNote','Nota técnica',row.trainingNote||'')+'<p>Registro anterior: '+safe(row.note)+'</p><p>'+effects(row).length+' decisiones consultaron este registro.</p>'+btn('Guardar corrección','applyTraining14()',true)+'</section>';
}
function applyTraining14(i){
 const context=trainingEditContext14;
 if(!context||!validSession||!sameVeraSession(context.owner,context.token,context.state)){trainingEditContext14=null;return msg('La cuenta ha cambiado. Vuelve a abrir el entrenamiento para corregirlo.');}
 const matches=s.logs.filter(row=>row.id===context.id),row=matches[0];
 if(matches.length!==1||row.kind!=='Entrenamiento'||row.source==='health'||JSON.stringify(row)!==context.snapshot){trainingEditContext14=null;return msg('El entrenamiento ha cambiado o ya no existe. Revisa la versión actual antes de corregirlo.');}
 let changes;
 try{changes=validateTraining14({exercise:$('correctExercise').value,date:$('correctDate').value,enteredKg:$('correctKg').value,mode:$('correctMode').value,reps:$('correctReps').value,rir:$('correctRir').value,note:$('correctTrainingNote').value});}catch(e){return msg(e.message);}
 if(row.trainingNote==null&&!row.legacyNote)row.legacyNote=row.note;
 Object.assign(row,changes);trainingEditContext14=null;markAffected(row);save();go('Entrenamiento');return confirmTrainingWrite247(row,'Corrección');
}
