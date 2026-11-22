home=function(){const rows=trainingRows14(7);const volume=trainingVolume14(rows);return '<article class="hero6"><small>'+safe(new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}))+'</small><h2>'+(['Buenas noches','Buenos días','Buenas tardes','Buenas noches'][Math.floor(new Date().getHours()/6)])+'</h2><div class="metrics6"><div>Volumen externo · 7 días<b>'+Math.round(volume).toLocaleString('es')+' kg</b></div><div>Días de fuerza<b>'+new Set(rows.map(x=>x.date)).size+'</b></div></div>'+((Number(s.profile.days)>0)?'<label>Objetivo semanal · '+new Set(rows.map(x=>x.date)).size+' de '+Number(s.profile.days)+' días<progress value="'+new Set(rows.map(x=>x.date)).size+'" max="'+Number(s.profile.days)+'"></progress></label>':'')+btn('Empezar entrenamiento',"go('Entrenamiento')",true)+'</article><div class="tiles6">'+['Alimentación','Suplementación','Sueño','Cardio','Chat','Mediciones','Máquinas','Equipo'].map(x=>btn(x==='Chat'?'Hablar con Vera':x,"go('"+x+"')")).join('')+'</div>';};render();

function searchSupplementWeb(){
 const q=$('lookup6').value.trim();if(!q)return msg('Introduce una marca o suplemento.');
 location.href='https://www.google.com/search?q='+encodeURIComponent(q+' suplemento marca fabricante etiqueta');
}
function editSupplement(i){const l=s.logs[i];if(l?.kind==='Suplemento')supplementForm({name:l.productName||l.note?.replace(/ · [\d.,]+ g$/,'')||'',n:l.label||{}},i);}
function supplementForm(x,i=-1){
 const l=s.logs[i]||{},node=$('results6'),units=['g','mg','ml','cápsulas','comprimidos','scoops','gotas','gominolas','raciones'];
 const remembered=(s.supplementUnits||{})[x.id||x.name],guessed=remembered||presentation10(x)||'raciones';
 node.innerHTML=field('supProduct','Marca y referencia',x.name||'')+field('supAmount','Cantidad tomada',l.amount??l.grams??1,'number','min="0.001" step="any"')+selectField('supUnit','Unidad',units,l.unit||(l.grams?'g':guessed))+'<button id="saveSupp8" class="primary">Guardar</button>';
 $('saveSupp8').onclick=()=>saveSupplement(x,i);node.scrollIntoView({block:'center'});
}
function saveSupplement(x,i=-1){
 const name=$('supProduct').value.trim(),amount=+$('supAmount').value,unit=$('supUnit').value;
 if(!name||!(amount>0&&Number.isFinite(amount)))return msg('Revisa la referencia y la cantidad.');
 const l=i>=0?s.logs[i]:{kind:'Suplemento',date:day(),source:x.source||'Etiqueta manual',reference:x.url||'',catalogId:x.id||''};
 s.supplementUnits ||= {};s.supplementUnits[x.id||l.catalogId||name]=unit;
 Object.assign(l,{productName:name,amount,unit,grams:unit==='g'?amount:unit==='mg'?amount/1000:null,label:x.n||{},note:name+' · '+amount+' '+unit});
 for(const [key,fact] of Object.entries({value:'energy-kcal',protein:'proteins',carbs:'carbohydrates',fat:'fat'})){const n=l.label[fact+'_100g'];l[key]=l.grams!=null&&n!=null?l.grams*n/100:null;}
 if(i<0)s.logs.push(l);save();render();msg('Suplemento guardado en este dispositivo. Pendiente de sincronizar.');
}
const oldHome8=home;
home=()=>oldHome8()+VeraJournal.status()+'<section><h3>Estado del cuerpo hoy</h3><p>'+safe(readiness().text)+'</p>'+btn('Registrar descanso',"go(\'Sueño\')")+'</section>';
window.lockDiary=()=>{validSession=false;if(recording?.state==='recording')recording.stop();render();};
window.openDiary=()=>{validSession=false;render();msg('Inicia sesión con conexión para abrir tu cuenta.');};
if(!localStorage.getItem('vera.notice8')){
 const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Tus datos en Vera</h2><p>'+safe(noticeText)+'</p><p>Después de entrar, cada cuenta elige si permite análisis remoto con Groq y Gemini. Puedes usar el diario sin IA.</p><button id="continue8">Continuar</button>';document.body.append(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());dialog.showModal();
 $('continue8').onclick=()=>{localStorage.setItem('vera.notice8','1');dialog.remove();};
}
render();

function refreshUnlockedHealth(){if(validSession&&s.autoHealth&&!document.hidden)window.VeraNative?.refreshHealth?.();}
const unlock11=window.openDiary;window.openDiary=()=>{unlock11();refreshUnlockedHealth();};
document.addEventListener("visibilitychange",refreshUnlockedHealth);setInterval(refreshUnlockedHealth,300000);

window.addEventListener?.("pagehide",()=>VeraSpeech14.stop());
