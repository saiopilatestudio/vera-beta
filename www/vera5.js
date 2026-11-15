/* Device-only diary, specialist summaries and photo review. */
function localDay(token) {
  const d=new Date(), t=token.toLowerCase(), weekdays=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const w=weekdays.indexOf(t);
  if(w>=0)d.setDate(d.getDate()-(d.getDay()-w+7)%7);
  else if(t==='ayer'||t==='anteayer')d.setDate(d.getDate()-(t==='ayer'?1:2));
  else if(t!=='hoy'){const iso=/^\d{4}-\d\d-\d\d$/.test(t)?t:null;if(!iso)return null;const dt=new Date(iso+'T12:00:00');return !isNaN(dt)&&day(dt)===iso?iso:null;}
  return day(d);
}
function diaryQuery(question) {
 const dateWords=/\b(anteayer|ayer|hoy|lunes|martes|miércoles|jueves|viernes|sábado|domingo|\d{4}-\d\d-\d\d)\b/gi;
 const dates=[...question.matchAll(dateWords)];
 if(/(?:qué|que) (?:entrené|hice|registré)|muéstrame mi entrenamiento/i.test(question)){
   const records=s.logs.filter(l=>['Entrenamiento','Cardio'].includes(l.kind));
   const wanted=dates.length?dates.map(m=>localDay(m[0])):[records.map(l=>l.date).sort().at(-1)||day()];
   return {answer:wanted.map(d=>d+' · '+(records.filter(l=>l.date===d).map(l=>l.note||l.exercise||l.kind).join(' · ')||'Sin entrenamiento confirmado.')).join('\n')};
 }
 if(/[¿?]|\bmañana\b|debería|podría|recomienda|quiero|prepara/i.test(question))return;
 let date=day();const entries=[];
 for(let line of question.split(/;|\n|\.\s+|,?\s+y\s+(?=(?:el )?(?:ayer|anteayer|hoy|lunes|martes|miércoles|jueves|viernes|sábado|domingo))/i)){
   const token=line.match(dateWords)?.[0];if(token)date=localDay(token);
   if(!date||date>day())continue;
   for(const note of line.replace(dateWords,'').split(/\s+y\s+(?=hice|corrí|dormí|tomé|comí|bebí)/i)){
     const n=note.trim().replace(/^[:, ]+/,'');const kind=/corrí|caminé|cardio/i.test(n)?'Cardio':/dormí|siesta/i.test(n)?'Sueño':/creatina|whey|suplemento|bcaa/i.test(n)?'Suplemento':/comí|cené|desayuné/i.test(n)?'Comida':/bebí|agua/i.test(n)?'Agua':/hice|entrené|press|remo|sentadilla|\d\s*[x×]\s*\d/i.test(n)?'Entrenamiento':null;
     if(!kind||/\bno (hice|corrí|entrené|tomé)/i.test(n))continue;
     const unit=kind==='Cardio'?/([\d.,]+)\s*min/i:kind==='Sueño'?/([\d.,]+)\s*h/i:kind==='Agua'?/([\d.,]+)\s*ml/i:null;
     const v=unit&&n.match(unit);const row={kind,date,note:n,value:v?Number(v[1].replace(',','.')):null};
     const sets=n.match(/(\d+)\s*[x×]\s*(\d+)/),kg=n.match(/([\d.,]+)\s*kg/i);
     if(kind==='Entrenamiento'&&sets&&kg&&+sets[1]>0&&+sets[1]<40){Object.assign(row,{exercise:n.slice(0,sets.index).replace(/^hice /i,'').trim(),reps:Array(+sets[1]).fill(+sets[2]),kg:Number(kg[1].replace(',','.'))});}
     entries.push(row);
   }
 }
 if(entries.length)return {answer:'Revisa las fechas y confirma los registros para guardarlos.',entries};
}
// Compare visual similarities only within the same candidate set.
function mealChoices103(matches) {
  const ordered = [...matches].filter(x => x && typeof x.name === "string" && Number.isFinite(x.score)).sort((a,b) => b.score-a.score);
  const [first,second] = ordered;
  if (!second || first.score < .22 || first.score-second.score < .012) return [];
  return ordered.filter(x => first.score-x.score <= .035).slice(0,3).map(x => x.name);
}
let mealRun103 = 0;
async function foodReview(src) {
  const target = $("foodReview");
  if (!target) return;
  const run = ++mealRun103;
  target.innerHTML = '<h3>Revisar plato</h3><div id="foodGuesses" role="status">Analizando la foto…</div>' +
    field("foodItem","Plato o ingrediente","","text",'placeholder="Escribe el nombre o elige una coincidencia"') +
    field("foodGrams","Cantidad consumida (g)","","number",'step="any" min=".1"') +
    field("foodKcal","Energía por 100 g, si la conoces","","number",'step="any" min="0"') +
    btn("Buscar composición","VeraCatalog.fromPhoto($('foodItem').value)")+'<div id="components12"></div>'+
    btn("Añadir ingrediente","addIngredient12()")+btn("Confirmar y guardar comida","saveMeal12()",true);
  const status = $("foodGuesses");
  try {
    const choices = mealChoices103(await visualCandidates(src,"food"));
    if (!status.isConnected || run !== mealRun103) return;
    status.textContent = choices.length ? "Posibles coincidencias. Revisa cada ingrediente antes de guardar." : "Imagen ambigua. Describe el plato o prueba con otra foto.";
    for (const name of choices) {
      const b = document.createElement("button");
      b.textContent = name;
      b.onclick = () => {$("foodItem").value = name;};
      status.append(b);
    }
  } catch {
    if (status.isConnected && run === mealRun103) status.textContent = "El análisis local no ha terminado. Puedes escribir el plato y guardarlo.";
  }
}
function savePlate(){const name=$('foodItem').value.trim(),grams=+$('foodGrams').value,kcal=$('foodKcal').value;if(!name||grams<=0)return msg('Indica plato y gramos.');s.logs.push({date:day(),kind:'Comida',note:name+' · '+grams+' g',value:kcal?Math.round(grams*Number(kcal)/100):null,source:'foto confirmada'});save();go('Alimentación');}
async function chatPlate(){if(!attached)return;const src=attached.src;attached=null;go('Plato');photoData=src;$('platePreview').innerHTML='<img alt="Plato" style="max-width:100%;max-height:180px" src="'+src+'">';if(sessionStorage.veraToken&&VeraPrivacy6.allowed("cloud")&&s.preferLocal!==true)await estimate();else await foodReview(src);}
async function supplementLabel(input){const f=input.files?.[0];if(!f)return;const node=$('suppResult');node.textContent='Leyendo etiqueta…';try{const raw=await readLabel(await readData(f));node.innerHTML=field('suppName','Marca y producto',raw.split('\n')[0])+field('suppDose','Cantidad tomada')+'<label>Ficha nutricional<textarea id="suppFacts">'+safe(raw)+'</textarea></label>'+btn('Buscar ficha en Google','googleSupp()')+btn('Registrar toma','saveSupp()',true);}catch(e){node.textContent=e.message;}}
function googleSupp(){const q=$('suppName').value.trim();if(q)location.href='https://www.google.com/search?q='+encodeURIComponent(q+' fabricante información nutricional por ración');}
function saveSupp(){const n=$('suppName').value.trim(),dose=$('suppDose').value.trim();if(!n||!dose)return msg('Indica producto y cantidad.');s.logs.push({kind:'Suplemento',date:day(),note:n+' · '+dose+' · '+$('suppFacts').value,value:null});save();render();}
function assessment(role){
 const match={'Hipertrofia':'Entrenamiento','Nutrición deportiva':'Comida','Medicina deportiva':'Sensaciones','Endocrinología':'Peso en ayunas','Fisioterapia deportiva':'Sensaciones','Psicología deportiva':'Sensaciones','Sueño y recuperación':'Sueño','Maquinaria y biomecánica':'Entrenamiento','Posing':'Posing'};
 const k=match[role]||'Entrenamiento',l=s.logs.filter(l=>l.kind===k).sort((a,b)=>b.date.localeCompare(a.date))[0];
 return l?'Último dato · '+l.date+' · '+(l.note||l.exercise||String(l.value??'')+' '+(units[k]||'')):'Falta registrar '+k.toLowerCase()+' para revisar tu evolución.';
}

function teamOpinion(role){
 const recent=[...s.logs].reverse().filter(l=>l.date<=day()&&l.date>=day(new Date(Date.now()-6*86400000))).sort((a,b)=>b.date.localeCompare(a.date));
 const latest=k=>recent.find(l=>l.kind===k);
 const sleep=latest('Sueño'), lift=latest('Entrenamiento'), pain=recent.find(l=>Number.isFinite(l.sore)), feeling=latest('Sensaciones');
 const entry=(l,label,advice)=>l?['En seguimiento',label+' · '+l.date+'. '+(l.note||l.exercise||l.value||'')+'. '+advice]:['Datos insuficientes',advice];
 switch(role){
 case 'Sueño y recuperación': if(!sleep)return ['Sin sueño reciente','Registra la última noche para compararla con tu objetivo.'];const mins=Math.round(sleep.value*60);return [mins>=60*(s.need||8)?'Objetivo alcanzado':'Por debajo del objetivo','El '+sleep.date+' registraste '+Math.floor(mins/60)+' h '+mins%60+' min frente a tu objetivo de '+(s.need||8)+' h.'+(pain?.sore>=7?' También señalaste agujetas intensas en '+(pain.group||'el grupo evaluado')+'.':'')];
 case 'Fisioterapia deportiva':return pain?[pain.sore>=7?'Molestia elevada':'En seguimiento','El '+pain.date+' indicaste agujetas de '+pain.sore+'/10 en '+(pain.group||'el grupo evaluado')+'. Revisa cómo se siente ese grupo antes de cargarlo.']:entry(feeling,'Sensaciones','Anota zona e intensidad de las molestias para valorar su evolución.');
 case 'Hipertrofia':return entry(lift,'Última sesión',lift?'Compara repeticiones y carga con la siguiente sesión.':'Registra tu primera serie para seguir la carga semanal.');
 case 'Nutrición deportiva':return entry(latest('Comida'),'Última comida','La valoración del día depende de las comidas y cantidades registradas.');
 case 'Endocrinología':return entry(latest('Peso en ayunas'),'Peso en ayunas','Para observar una tendencia hacen falta pesajes comparables. El diario por sí solo no permite evaluar hormonas.');
 case 'Posing':return entry(latest('Posing'),'Última práctica','Registra la pose y qué parte te costó mantener.');
 case 'Psicología deportiva':return entry(feeling,'Sensaciones','Anota motivación y estrés percibidos para seguir cómo varían entre sesiones.');
 case 'Medicina deportiva':return entry(feeling,'Estado percibido','La valoración general requiere conocer tus síntomas y cómo toleras el esfuerzo.');
 default:return entry(lift,'Trabajo registrado','Anota máquina, ajustes y recorrido para comparar la ejecución.');
 }
}
