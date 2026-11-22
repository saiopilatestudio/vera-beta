/* VERA 2.1: measured nutrition and weight, never inferred missing values. */
let metricsPeriod21 = 28;
let metricWeightMode21 = "all";
const nutrientFields21 = [
 ['fiber_g','Fibra','g'],['sugar_g','Azúcares','g'],['sodium_mg','Sodio','mg'],
 ['potassium_mg','Potasio','mg'],['calcium_mg','Calcio','mg'],['iron_mg','Hierro','mg'],
 ['magnesium_mg','Magnesio','mg'],['vitaminC_mg','Vitamina C','mg'],
 ['vitaminD_ug','Vitamina D','µg'],['vitaminB12_ug','Vitamina B12','µg'],
 ['vitaminA_ug','Vitamina A','µg RE'],['vitaminE_mg','Vitamina E','mg α-TE'],
 ['vitaminB1_mg','Vitamina B1','mg'],['vitaminB2_mg','Vitamina B2','mg'],
 ['vitaminB3_mg','Vitamina B3','mg NE'],['vitaminB5_mg','Vitamina B5','mg'],
 ['vitaminB6_mg','Vitamina B6','mg'],['biotin_ug','Biotina','µg'],['folate_ug','Folato','µg'],
 ['zinc_mg','Zinc','mg'],['manganese_mg','Manganeso','mg'],['copper_mg','Cobre','mg'],
 ['iodine_ug','Yodo','µg'],['chromium_ug','Cromo','µg'],['selenium_ug','Selenio','µg']
];
function numberMetric21(value) {
 if(value===null||value===undefined||typeof value==='boolean'||typeof value==='object'||String(value).trim()==='')return null;
 const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;
}
function metricDay21(date) {
 return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
function validMetricDate21(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T12:00:00');return Number.isFinite(+d)&&metricDay21(d)===value;
}
function baseNutritionValue21(row,key) {
 if(key==='kcal'){
  if(row.kind!=='Suplemento')return numberMetric21(row.value??row.kcal);
  const explicit=numberMetric21(row.kcal);if(explicit!==null)return explicit;
  // V2.1 wrote energy into `value`, also used for doses. Only a label and grams
  // establish safe legacy energy; never interpret an arbitrary dose as kcal.
  const grams=numberMetric21(row.grams),label=numberMetric21(row.label?.['energy-kcal_100g']);
  return grams!==null&&label!==null?grams*label/100:null;
 }
 if(['protein','carbs','fat'].includes(key))return numberMetric21(row[key]);
 const source=row.nutrients||row.nutrition||row.nutrientes||{};
 return numberMetric21(source[key]);
}
function mixingLiquidValue23(row,key){
 const liquid=row.kind==='Suplemento'?row.mixingLiquid:null;
 if(!liquid||!['water','milk','plant'].includes(liquid.type)||!(numberMetric21(liquid.ml)>0))return null;
 if(liquid.type==='water')return ['kcal','protein','carbs','fat'].includes(key)?0:null;
 const value=numberMetric21(liquid.per100ml?.[key]);return value===null?null:value*Number(liquid.ml)/100;
}
function nutritionValue21(row,key){
 const base=baseNutritionValue21(row,key),liquid=mixingLiquidValue23(row,key);
 if(row.mixingLiquid?.type==='water')return base;
 return base===null?liquid:liquid===null?base:base+liquid;
}
function nutritionPartial23(row,key){
 if(baseNutritionValue21(row,key)===null)return true;
 return row.kind==='Suplemento'&&['milk','plant'].includes(row.mixingLiquid?.type)&&mixingLiquidValue23(row,key)===null;
}
function metricsSummary21(logs,days=28,today=metricDay21(new Date()),weightMode='all') {
 days=[7,28,90].includes(Number(days))?Number(days):28;
 if(!validMetricDate21(today))throw Error('Fecha de métricas no válida.');
 const first=new Date(today+'T12:00:00');first.setDate(first.getDate()-days+1);
 const since=metricDay21(first),seen=new Set(),rows=(Array.isArray(logs)?logs:[]).filter(row=>{if(!row||!validMetricDate21(row.date)||row.date<since||row.date>today)return false;const id=row.id;if(id&&seen.has(id))return false;if(id)seen.add(id);return true;});
 const isHealth=row=>row.source==='health'||row.source==='Health Connect';
 const meals=rows.filter(row=>['Comida','Suplemento'].includes(row.kind)),mealDays=new Set(meals.map(row=>row.date)).size;
 const sources={manual:meals.filter(row=>!isHealth(row)).length,health:meals.filter(isHealth).length};
 const keys=['kcal','protein','carbs','fat',...nutrientFields21.map(row=>row[0])];
 const groups={};
 for(const row of meals){const group=groups[row.date]??={manual:[],health:[]};group[isHealth(row)?'health':'manual'].push(row);}
 const sum=(items,key)=>{const values=items.map(row=>nutritionValue21(row,key)).filter(value=>value!==null);return values.length?values.reduce((a,b)=>a+b,0):null;};
 const daily=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([date,group])=>{
  const manual=Object.fromEntries(keys.map(key=>[key,sum(group.manual,key)])),health=Object.fromEntries(keys.map(key=>[key,sum(group.health,key)]));
  const mean=Object.fromEntries(keys.map(key=>{const values=[manual[key],health[key]].filter(value=>value!==null);return [key,values.length?values.reduce((a,b)=>a+b,0)/values.length:null];}));
  return {date,...mean,manual,health,manualCount:group.manual.length,healthCount:group.health.length};
 });
 const nutrition=Object.fromEntries(keys.map(key=>{
  const values=daily.map(row=>row[key]).filter(value=>value!==null),known=meals.filter(row=>nutritionValue21(row,key)!==null).length;
  const total=values.length?values.reduce((a,b)=>a+b,0):null;
  return [key,{total,average:values.length?total/values.length:null,known,meals:meals.length,days:values.length,partial:known<meals.length||meals.some(row=>nutritionPartial23(row,key))}];
 }));
 const byDate={};
 const weightRows=rows.filter(row=>(weightMode==='fasted'?row.kind==='Peso en ayunas':weightMode==='other'?['Otro pesaje','Peso'].includes(row.kind):['Peso en ayunas','Otro pesaje','Peso'].includes(row.kind))&&numberMetric21(row.value)>0);
 for(const row of weightRows)(byDate[row.date]??=[]).push(row);
 const weightSources={manual:weightRows.filter(row=>!isHealth(row)).length,health:weightRows.filter(isHealth).length};
 const weights=Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,values])=>{
  const conditions={};for(const row of values)(conditions[row.kind==='Peso en ayunas'?'Ayunas':'Otros']??=[]).push(Number(row.value));
  return {date,value:values.reduce((a,b)=>a+Number(b.value),0)/values.length,readings:values.length,source:[values.some(row=>!isHealth(row))?'Diario':'',values.some(isHealth)?'Health Connect':''].filter(Boolean).join(' + '),conditions:Object.fromEntries(Object.entries(conditions).map(([key,values])=>[key,values.reduce((a,b)=>a+b,0)/values.length]))};
 });
 return {days,since,today,meals:meals.length,mealDays,nutrition,sources,weightSources,weightMode,daily,weights,weightAverage:weights.length?weights.reduce((sum,row)=>sum+row.value,0)/weights.length:null,weightChange:weights.length>1?weights.at(-1).value-weights[0].value:null};
}
function metricEscape21(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function metricNumber21(value,decimals=1){return value===null?'Sin dato':value.toLocaleString('es-ES',{maximumFractionDigits:decimals});}
function setMetricsPeriod21(value){metricsPeriod21=[7,28,90].includes(Number(value))?Number(value):28;render();}
function setMetricWeightMode21(value){metricWeightMode21=['fasted','other'].includes(value)?value:'all';render();}
function weightGraph21(weights) {
 if(!weights.length)return '<p class="empty21">Registra o importa tu peso para empezar a ver la progresión. Los días sin datos quedan vacíos.</p>';
 const low=Math.min(...weights.map(row=>row.value)),high=Math.max(...weights.map(row=>row.value));
 const first=+new Date(weights[0].date+'T12:00:00'),last=+new Date(weights.at(-1).date+'T12:00:00');
 const span=Math.max(high-low,1),base=low-(span-(high-low))/2;
 const points=weights.map(row=>({x:last===first?270:55+430*(+new Date(row.date+'T12:00:00')-first)/(last-first),y:155-115*(row.value-base)/span,...row}));
 return '<svg class="weight-chart21" viewBox="0 0 530 205" role="img" aria-label="Progresión del peso registrado. Los valores exactos se muestran en la tabla inferior."><title>Peso registrado, en kilogramos</title>'+[0,0.5,1].map(f=>'<line class="grid21" x1="55" x2="490" y1="'+(155-115*f)+'" y2="'+(155-115*f)+'"/><text x="7" y="'+(159-115*f)+'">'+metricNumber21(base+span*f)+'</text>').join('')+(points.length>1?'<polyline class="trend21" points="'+points.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')+'"/>':'')+points.map(p=>'<circle class="point21" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="5"><title>'+p.date+': '+metricNumber21(p.value)+' kg</title></circle>').join('')+'<text x="55" y="190">'+weights[0].date+'</text><text x="490" y="190" text-anchor="end">'+(weights.length>1?weights.at(-1).date:'')+'</text></svg>';
}
function waterSummary22(logs,since,today,goal){
 const seen=new Set(),dates={},waterDates={},drinkDates={};
 for(const row of Array.isArray(logs)?logs:[]){
  if(!row||!validMetricDate21(row.date)||row.date<since||row.date>today||(row.id&&seen.has(row.id)))continue;
  if(row.id)seen.add(row.id);
  const liquid=row.kind==='Suplemento'?row.mixingLiquid:null;
  const value=row.kind==='Agua'?numberMetric21(row.value):liquid&&['water','milk','plant'].includes(liquid.type)?numberMetric21(liquid.ml):null;
  if(value===null)continue;
  dates[row.date]=(dates[row.date]||0)+value;
  const target=row.kind==='Agua'||liquid?.type==='water'?waterDates:drinkDates;target[row.date]=(target[row.date]||0)+value;
 }
 const daily=Object.entries(dates).sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value,water:waterDates[date]||0,other:drinkDates[date]||0})),total=daily.reduce((sum,r)=>sum+r.value,0),target=numberMetric21(goal);
 return {daily,total,average:daily.length?total/daily.length:null,today:dates[today]??null,waterToday:waterDates[today]??null,otherToday:drinkDates[today]??null,goal:target>0?target:null,percent:target>0&&dates[today]!==undefined?dates[today]*100/target:null};
}
function barsGraph22(rows,key,label,unit,color='#4597b4'){
 const points=rows.filter(row=>numberMetric21(row[key])!==null);
 if(!points.length)return '<p class="empty21">Aún no hay datos de '+metricEscape21(label.toLowerCase())+'.</p>';
 const max=Math.max(1,...points.map(row=>Number(row[key]))),first=+new Date(points[0].date+'T12:00:00'),last=+new Date(points.at(-1).date+'T12:00:00'),days=Math.max(1,Math.round((last-first)/86400000)+1),width=Math.max(2,Math.min(25,450/days*.65));
 return '<svg class="chart22" style="width:100%;height:auto" viewBox="0 0 560 220" role="img" aria-label="'+metricEscape21(label)+' por día, '+unit+'"><title>'+metricEscape21(label)+' por día</title>'+[0,.5,1].map(f=>'<line x1="55" x2="535" y1="'+(175-140*f)+'" y2="'+(175-140*f)+'" stroke="#dce8e3"/><text x="3" y="'+(180-140*f)+'" fill="#47645a" font-size="12">'+metricNumber21(max*f,0)+'</text>').join('')+points.map(row=>{const x=days===1?290:70+(+new Date(row.date+'T12:00:00')-first)/(last-first)*445,h=Number(row[key])/max*140;return '<rect x="'+(x-width/2)+'" y="'+(175-h)+'" width="'+width+'" height="'+Math.max(h,1)+'" rx="3" fill="'+color+'"><title>'+row.date+': '+metricNumber21(Number(row[key]))+' '+unit+'</title></rect>';}).join('')+'<text x="55" y="207" fill="#47645a" font-size="12">'+points[0].date+'</text><text x="535" y="207" text-anchor="end" fill="#47645a" font-size="12">'+(points.length>1?points.at(-1).date:'')+'</text></svg>';
}
function macroPie22(nutrition){
 const fields=[['protein','Proteína',4,'#74b449'],['carbs','Hidratos',4,'#64b9db'],['fat','Grasas',9,'#b0a4df']],missing=fields.some(([key])=>nutrition[key].total===null),values=fields.map(([key,label,factor,color])=>({key,label,color,value:(nutrition[key].total??0)*factor})),total=values.reduce((n,x)=>n+x.value,0);
 if(missing||!total)return '<p class="empty21">Añade proteína, hidratos y grasas para ver el reparto energético. No se convierten campos vacíos en cero.</p>';
 let offset=0;const arcs=values.map(x=>{const pct=x.value/total*100,part='<circle cx="100" cy="100" r="70" fill="none" stroke="'+x.color+'" stroke-width="26" pathLength="100" stroke-dasharray="'+pct+' '+(100-pct)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 100 100)"><title>'+x.label+': '+metricNumber21(pct)+'%</title></circle>';offset+=pct;return part;}).join('');
 return '<svg class="macro-ring22" style="max-width:210px;width:100%" viewBox="0 0 200 200" role="img" aria-label="Reparto de energía de los macronutrientes registrados"><title>Porcentaje de energía: proteína e hidratos a 4 kcal/g, grasas a 9 kcal/g</title>'+arcs+'<text x="100" y="97" text-anchor="middle" fill="#173b2d" font-size="22" font-weight="700">Macros</text><text x="100" y="119" text-anchor="middle" fill="#47645a" font-size="12">energía registrada</text></svg><ul class="macro-legend22">'+values.map(x=>'<li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+x.color+'"></span> '+x.label+' <b>'+metricNumber21(x.value/total*100)+'%</b></li>').join('')+'</ul><p class="sub">Reparto de los datos disponibles (4/4/9 kcal por gramo). No representa un objetivo recomendado.</p>';
}
function micronutrientTable22(nutrition){
 const known=nutrientFields21.filter(([key])=>nutrition[key].days>0),unknown=nutrientFields21.filter(([key])=>!nutrition[key].days);
 const table=fields=>'<div class="table-scroll21"><table><thead><tr><th>Nutriente</th><th>Media diaria</th><th>Días</th></tr></thead><tbody>'+fields.map(([key,label,unit])=>{const item=nutrition[key];return '<tr><th>'+label+'</th><td>'+(item.average===null?'Sin dato':metricNumber21(item.average)+' '+unit)+'</td><td>'+item.days+(item.partial?' · parcial':'')+'</td></tr>';}).join('')+'</tbody></table></div>';
 return (known.length?table(known):'<p class="empty21">Añade una etiqueta o suplemento con micronutrientes para ver sus cantidades aquí.</p>')+(unknown.length?'<details><summary>'+unknown.length+' nutrientes aún sin datos</summary>'+table(unknown)+'</details>':'');
}
function renderMetrics21() {
 const data=metricsSummary21(s.logs,metricsPeriod21,metricDay21(new Date()),metricWeightMode21),water=waterSummary22(s.logs,data.since,data.today,s.profile?.waterGoalMl);
 const format=(n,unit)=>n===null?'Sin dato':metricNumber21(n)+' <small>'+unit+'</small>',fields=[['kcal','Energía','kcal'],['protein','Proteína','g'],['carbs','Hidratos','g'],['fat','Grasas','g']];
 const foodCount=(s.logs||[]).filter(r=>r.date>=data.since&&r.date<=data.today&&r.kind==='Comida').length,suppCount=(s.logs||[]).filter(r=>r.date>=data.since&&r.date<=data.today&&r.kind==='Suplemento').length;
 return `<section class="metric21" aria-labelledby="nutrition-title21">
 <div class="metric-head21"><div><span class="eyebrow21">Cada pequeño avance cuenta</span><h2 id="nutrition-title21">Nutrición y peso</h2><p class="sub">${data.since} — ${data.today}</p></div><label class="period21">Tu periodo<select onchange="setMetricsPeriod21(this.value)">${[7,28,90].map(n=>`<option value="${n}" ${n===data.days?'selected':''}>${n} días</option>`).join('')}</select></label></div>
 <p class="coverage21">${data.mealDays} días registrados · ${foodCount} comidas + ${suppCount} suplementos</p>
 <dl class="metric-grid21">${fields.map(([key,label,unit])=>{const n=data.nutrition[key];return `<div class="metric-card21"><dt>${label}</dt><dd>${format(n.average,unit)}</dd><p>Media diaria · ${n.days} días${n.partial?' · datos parciales':''}</p></div>`;}).join('')}</dl>
 <div class="charts22"><article class="chart-card22"><h3>Energía día a día</h3>${barsGraph22(data.daily,'kcal','Energía','kcal','#89ba4e')}</article><article class="chart-card22"><h3>Tu reparto de macros</h3>${macroPie22(data.nutrition)}</article></div>
 <details><summary>Ver detalle nutricional y fuentes</summary><p class="sub">Comidas, suplementos y los nutrientes declarados de sus líquidos se suman. Si Health Connect aporta el mismo día se muestra la media de ambos totales por nutriente. Google Fit entra a través de Health Connect. Los días vacíos no cuentan como cero. Un registro parcial no representa todo lo consumido.</p><div class="table-scroll21"><table><caption>Totales diarios y media entre fuentes disponibles</caption><thead><tr><th>Fecha / fuente</th>${fields.map(([,name,unit])=>`<th>${name} (${unit})</th>`).join('')}</tr></thead><tbody>${data.daily.map(row=>`<tr><th>${row.date} · Media</th>${fields.map(([key])=>`<td>${metricNumber21(row[key])}</td>`).join('')}</tr>`+[['manual','Diario',row.manualCount],['health','Health Connect',row.healthCount]].filter(([,name,count])=>count).map(([source,name])=>`<tr><th>${name}</th>${fields.map(([key])=>`<td>${metricNumber21(row[source][key])}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div></details>
 <article class="chart-card22"><h3>Fibra, vitaminas y minerales</h3><p class="sub">Incluye las cantidades declaradas en tus suplementos. Sin dato significa que falta información.</p>${micronutrientTable22(data.nutrition)}</article>
 <article class="hydration22"><span class="eyebrow21">Un hábito que suma</span><h3>Agua y líquidos de tus suplementos</h3><dl class="metric-grid21"><div class="metric-card21"><dt>Hoy</dt><dd>${format(water.today,'ml')}</dd><p>${water.goal?`Objetivo personal: ${metricNumber21(water.goal,0)} ml${water.percent!==null?' · '+metricNumber21(water.percent,0)+'%':''}`:'Establece tu objetivo de agua en Perfil.'}</p></div><div class="metric-card21"><dt>Media de días registrados</dt><dd>${format(water.average,'ml')}</dd><p>${water.daily.length} días · ${metricNumber21(water.total/1000)} litros en el periodo</p></div></dl>${barsGraph22(water.daily,'value','Líquidos registrados','ml','#64b9db')}<p class="sub">Incluye el agua registrada y el volumen de agua, leche o bebida vegetal de tus suplementos, una sola vez. Es volumen de líquidos, no una estimación de agua pura. La leche y las bebidas suman también los nutrientes de su etiqueta; los campos vacíos siguen sin dato.</p><button onclick="kind='Agua';go('Registro')">Registrar agua</button></article>
 <article class="chart-card22"><h3>Progresión de peso</h3><label>Pesajes incluidos<select onchange="setMetricWeightMode21(this.value)"><option value="all" ${metricWeightMode21==='all'?'selected':''}>Todos los pesajes</option><option value="fasted" ${metricWeightMode21==='fasted'?'selected':''}>Sólo en ayunas</option><option value="other" ${metricWeightMode21==='other'?'selected':''}>Otros pesajes / Health Connect</option></select></label><p class="trend-summary21"><b>${format(data.weightAverage,'kg')}</b> de media${data.weightChange!==null?' · '+(data.weightChange>0?'+':'')+metricNumber21(data.weightChange)+' kg de cambio':''}</p>${weightGraph21(data.weights)}<p class="sub">${data.weights.length} días medidos. Los puntos son medias diarias; la línea une registros y no estima días vacíos.</p><details><summary>Ver pesajes y condiciones</summary><div class="table-scroll21"><table><thead><tr><th>Fecha</th><th>kg</th><th>Fuente / condición</th></tr></thead><tbody>${data.weights.map(row=>`<tr><th>${row.date}</th><td>${metricNumber21(row.value,2)}</td><td>${row.source}<br>${Object.entries(row.conditions).map(([key,value])=>key+': '+metricNumber21(value)+' kg').join(' · ')}</td></tr>`).join('')}</tbody></table></div></details></article></section>`;
}
