/* VERA 2.1: measured nutrition and weight, never inferred missing values. */
let metricsPeriod21 = 28;
let metricWeightMode21 = "all";
const nutrientFields21 = [
 ['fiber_g','Fibra','g'],['sugar_g','Azúcares','g'],['sodium_mg','Sodio','mg'],
 ['potassium_mg','Potasio','mg'],['calcium_mg','Calcio','mg'],['iron_mg','Hierro','mg'],
 ['magnesium_mg','Magnesio','mg'],['vitaminC_mg','Vitamina C','mg'],
 ['vitaminD_ug','Vitamina D','µg'],['vitaminB12_ug','Vitamina B12','µg']
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
function nutritionValue21(row,key) {
 if(key==='kcal')return numberMetric21(row.kind==='Suplemento'?row.kcal:(row.value??row.kcal));
 if(['protein','carbs','fat'].includes(key))return numberMetric21(row[key]);
 const source=row.nutrients||row.nutrition||row.nutrientes||{};
 return numberMetric21(source[key]);
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
  return [key,{total,average:values.length?total/values.length:null,known,meals:meals.length,days:values.length,partial:known<meals.length}];
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
function renderMetrics21() {
 const data=metricsSummary21(s.logs,metricsPeriod21,metricDay21(new Date()),metricWeightMode21),format=(n,unit)=>n===null?'Sin dato':metricNumber21(n)+' <small>'+unit+'</small>';
 const macroFields=[['kcal','Energía','kcal'],['protein','Proteína','g'],['carbs','Hidratos','g'],['fat','Grasas','g']];
 return '<section class="metric21" aria-labelledby="nutrition-title21"><div class="metric-head21"><div><span class="eyebrow21">Tu evolución</span><h2 id="nutrition-title21">Nutrición y peso</h2><p class="sub">'+data.since+' — '+data.today+'</p></div><label class="period21">Periodo<select onchange="setMetricsPeriod21(this.value)">'+[7,28,90].map(n=>'<option value="'+n+'" '+(n===data.days?'selected':'')+'>'+n+' días</option>').join('')+'</select></label></div><span class="coverage21">'+data.mealDays+' de '+data.days+' días con nutrición · '+data.meals+' registros · Diario '+data.sources.manual+' / Health Connect '+data.sources.health+'</span><dl class="metric-grid21">'+macroFields.map(([key,label,unit])=>{const item=data.nutrition[key];return '<div class="metric-card21"><dt>'+label+'</dt><dd>'+format(item.average,unit)+'</dd><p>Media por día con ese dato · '+item.days+' días</p><p>'+item.known+'/'+item.meals+' registros con valor'+(item.partial?' · total parcial':'')+'</p></div>';}).join('')+'</dl><p class="sub">Sólo se suman valores registrados. Un día sin anotaciones no cuenta como cero; una comida incompleta puede reducir la media. Las estimaciones de fotos conservan su carácter estimado. Si Diario y Health Connect aportan el mismo día, se calcula la media entre sus totales disponibles por nutriente; no se suman los consumos de ambas fuentes. La media no garantiza que un día esté completo. Google Fit sólo aparece si comparte sus datos con Health Connect.</p><details><summary>Macros por día</summary><div class="table-scroll21"><table><caption>Media entre fuentes; no suma de consumos</caption><thead><tr><th scope="col">Fecha</th><th scope="col">kcal</th><th scope="col">Proteína (g)</th><th scope="col">Hidratos (g)</th><th scope="col">Grasas (g)</th></tr></thead><tbody>'+data.daily.map(row=>'<tr><th scope="row">'+row.date+' · Media</th>'+['kcal','protein','carbs','fat'].map(key=>'<td>'+metricNumber21(row[key])+'</td>').join('')+'</tr>'+[['manual','Diario',row.manualCount],['health','Health Connect',row.healthCount]].filter(([,label,count])=>count).map(([source,label])=>'<tr><th scope="row">'+label+'</th>'+['kcal','protein','carbs','fat'].map(key=>'<td>'+metricNumber21(row[source][key])+'</td>').join('')+'</tr>').join('')).join('')+'</tbody></table></div>'+(!data.daily.length?'<p class="empty21">Aún no hay comidas ni suplementos anotados en este periodo.</p>':'')+'</details><details open><summary>Fibra, vitaminas y minerales</summary><p class="sub">Cantidades anotadas en alimentos, suplementos o etiquetas confirmadas. «Sin dato» no significa ausencia del nutriente. No se deduce una carencia ni se recomienda suplementación a partir de esta tabla.</p><div class="table-scroll21"><table><caption>Promedio por día con cada dato</caption><thead><tr><th scope="col">Nutriente</th><th scope="col">Media</th><th scope="col">Cobertura</th></tr></thead><tbody>'+nutrientFields21.map(([key,label,unit])=>{const item=data.nutrition[key];return '<tr><th scope="row">'+label+'</th><td>'+format(item.average,unit)+'</td><td>'+item.known+'/'+item.meals+' registros · '+item.days+' días</td></tr>';}).join('')+'</tbody></table></div></details><h3>Progresión de peso</h3><label>Pesajes incluidos<select onchange="setMetricWeightMode21(this.value)"><option value="all" '+(metricWeightMode21==='all'?'selected':'')+'>Todos los pesajes registrados</option><option value="fasted" '+(metricWeightMode21==='fasted'?'selected':'')+'>Sólo peso en ayunas</option><option value="other" '+(metricWeightMode21==='other'?'selected':'')+'>Otros pesajes (incluye Health Connect)</option></select></label><p class="sub">Diario: '+data.weightSources.manual+' · Health Connect: '+data.weightSources.health+'. Los identificadores repetidos se cuentan una sola vez.</p><p><strong>Media del periodo: '+metricNumber21(data.weightAverage)+' kg</strong> · promedio de las medias diarias.</p><p class="trend-summary21">'+(data.weightChange===null?'Se necesitan al menos dos fechas para mostrar el cambio.':(data.weightChange>0?'+':'')+metricNumber21(data.weightChange)+' kg entre el primer y el último día registrado.')+'</p>'+weightGraph21(data.weights)+'<p class="sub">'+data.weights.length+' días medidos. Si hay varios pesajes en una fecha se muestra su media. Los pesajes importados no se etiquetan como ayunas salvo que la fuente lo indique. La línea une observaciones; no estima el peso de los días vacíos.</p>'+(data.weights.length?'<details><summary>Ver pesajes exactos</summary><table><thead><tr><th scope="col">Fecha</th><th scope="col">Peso (kg)</th><th scope="col">Pesajes</th><th scope="col">Fuente / condición</th></tr></thead><tbody>'+data.weights.map(row=>'<tr><th scope="row">'+row.date+'</th><td>'+metricNumber21(row.value,2)+'</td><td>'+row.readings+'</td><td>'+row.source+'<br>'+Object.entries(row.conditions).map(([key,value])=>key+': '+metricNumber21(value)+' kg').join(' · ')+'</td></tr>').join('')+'</tbody></table></details>':'')+'</section>';
}
