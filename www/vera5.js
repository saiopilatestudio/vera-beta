/* Manual diary forms and deterministic summaries; no model execution. */
function foodReview(){
 const target=$("foodReview");if(!target)return;
  target.innerHTML = '<h3>Revisar plato</h3><div id="foodGuesses" role="status">Registro manual: introduce los datos que conozcas.</div>' +
    field("foodItem","Plato o ingrediente","","text",'placeholder="Escribe el nombre del plato o ingrediente"') +
    field("foodGrams","Cantidad consumida (g)","","number",'step="any" min=".1"') +
    field("foodKcal","Energía por 100 g, si la conoces","","number",'step="any" min="0"') +
    '<details><summary>Macronutrientes por 100 g (opcional, según etiqueta)</summary>'+
    field("foodProtein","Proteína por 100 g","","number",'step="any" min="0"')+
    field("foodCarbs","Hidratos por 100 g","","number",'step="any" min="0"')+
    field("foodFat","Grasa por 100 g","","number",'step="any" min="0"')+'</details>'+
    btn("Buscar composición","VeraCatalog.fromPhoto($('foodItem').value)")+'<div id="components12"></div>'+
    btn("Añadir ingrediente","addIngredient12()")+btn("Confirmar y guardar comida","saveMeal12()",true);
}
function savePlate(){const name=$('foodItem').value.trim(),grams=+$('foodGrams').value,kcal=$('foodKcal').value;if(!name||grams<=0)return msg('Indica plato y gramos.');s.logs.push({date:day(),kind:'Comida',note:name+' · '+grams+' g',value:kcal?Math.round(grams*Number(kcal)/100):null,source:'foto confirmada'});save();go('Alimentación');}
async function chatPlate(){if(!attached)return;const src=attached.src;attached=null;go('Plato');photoData=src;$('platePreview').innerHTML='<img alt="Plato" style="max-width:100%;max-height:180px" src="'+src+'">';await estimate();}
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
