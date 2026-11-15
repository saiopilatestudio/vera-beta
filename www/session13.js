function previousSet13(exercise) {
  const key = name => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  if (!key(exercise)) return '';
  const log = s.logs.filter(row => row.kind === 'Entrenamiento' && key(row.exercise) === key(exercise) &&
    Number.isFinite(row.kg) && row.reps?.length).reduce((last,row) => !last || row.date >= last.date ? row : last,null);
  return log ? 'Última serie · '+log.date+' · '+log.reps.at(-1)+' rep. · '+log.kg+' kg en total' : '';
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
  '<label>Cómo cuentas la carga<select id="loadMode13"><option value="total">Peso total</option><option value="side" '+(d.mode==='side'?'selected':'')+'>Peso por lado × 2</option></select></label></div>'+
  '<div class="loadPair13">'+field('setReps13','Repeticiones',d.reps??'','number','required min="1" max="300"')+
  field('setRir13','En reserva (RIR)',d.rir??'','number','min="0" max="10"')+'</div>'+
  field('setNote13','Nota técnica',d.note||'','text','maxlength="240"')+'<button class="primary">Guardar serie</button></form>'+
  '<div class="rest13"><h3>Descanso</h3><output id="restClock13" aria-live="off">'+restTime13()+'</output>'+
  field('restSeconds13','Segundos',s.restSeconds13||90,'number','min="5" max="1800"')+
  btn('Iniciar descanso','rest13(true)')+btn('Cancelar descanso','rest13(false)')+'</div></details>';
}
function draftSet13() {
  s.setDraft={exercise:$('setName13').value.trim(), kg:$('setKg13').value, mode:$('loadMode13')?.value==='side'?'side':'total',
    reps:$('setReps13').value,rir:$('setRir13').value,note:$('setNote13').value};
  const previous=$('setPrevious13');
  if(previous)previous.textContent=previousSet13(s.setDraft.exercise);
  save();
}
function commitSet13() {
  draftSet13();
  const d=s.setDraft,reps=Number(d.reps),kg=Number(d.kg)*(d.mode==='side'?2:1),rir=d.rir===''?null:Number(d.rir);
  if(!d.exercise||!d.reps||d.kg===''||!Number.isInteger(reps)||reps<1||reps>300||!Number.isFinite(kg)||kg<0||
     (rir!==null&&(!Number.isInteger(rir)||rir<0||rir>10)))return msg('Revisa la carga, las repeticiones y el RIR.');
  s.logs.push({id:uid(),kind:'Entrenamiento',date:day(),exercise:d.exercise,kg,enteredKg:Number(d.kg),loadMode:d.mode,
    reps:[reps],rir,note:[d.exercise,reps+' rep.',kg+' kg en total',d.mode==='side'?d.kg+' kg por lado':'',d.note].filter(Boolean).join(' · ')});
  s.setDraft={...d,reps:''};save();render();msg('Serie guardada.');
}
