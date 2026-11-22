/* Nutrition is label arithmetic, not an AI estimate. Reviewed official labels 2026-11-22. */
const zumubProducts22 = [
 {id:'ZUMUB-WHEY-CONCENTRATE-CHOC',name:'Zumub · 100% Whey Concentrada · Chocolate',url:'https://www.zumub.com/ES/proteinas/suero/100-whey-concentrate-1kg-p-10326',portion:30,unit:'g',facts:{kcal:110,protein:21.4,carbs:1.7,fat:1.8,fiber_g:0.6,sugar_g:1.2,sodium_mg:120}},
 {id:'ZUMUB-WHEY-ISOLATE-CHOC',name:'Zumub · 100% Whey Aislada · Chocolate',url:'https://www.zumub.com/ES/aislados-de-suero/100-whey-isolate-flav-1kg',portion:30,unit:'g',facts:{kcal:109,protein:24.7,carbs:1,fat:0.6,fiber_g:0.6,sugar_g:0.5,sodium_mg:120}},
 {id:'ZUMUB-OAT-CHOC',name:'Zumub · Harina de avena · Chocolate',url:'https://www.zumub.com/ES/nutricion-deportiva/avena/harina-de-avena-1kg',portion:100,unit:'g',facts:{kcal:370,protein:12,carbs:59,fat:7,fiber_g:10,sugar_g:1,sodium_mg:0}},
 {id:'ZUMUB-MULTIVITAMIN',name:'Zumub · Multivitamina + Mineral',url:'https://www.zumub.com/ES/multivitamina/zumub-multi-vitamin-mineral-100-capsulas',portion:1,unit:'cápsulas',facts:{vitaminC_mg:60,vitaminD_ug:5,vitaminB12_ug:1,calcium_mg:80,iron_mg:14,vitaminA_ug:160,vitaminE_mg:5,vitaminB1_mg:.98,vitaminB2_mg:1.4,vitaminB3_mg:16,vitaminB5_mg:5.5,vitaminB6_mg:1.15,biotin_ug:50,folate_ug:200,zinc_mg:15,manganese_mg:.89,copper_mg:.82,iodine_ug:150,chromium_ug:16,selenium_ug:23}},
 {id:'ZUMUB-CREATINE-PRO',name:'Zumub · Creatina Monohidrato Profesional · Sin sabor',url:'https://www.zumub.com/ES/creatina-creatina-monohidrato-c-213_165_74/creatine-monohydrate-professional-100g',portion:3,unit:'g',facts:{},active:'Monohidrato de creatina: 3 g por 3 g. La etiqueta no declara calorías ni macronutrientes.'}
].map(x=>({...x,brand:'Zumub',source:'Zumub · etiqueta del fabricante · 22/11/2026',form:x.unit==='g'?'powder':'capsule',n:x.unit==='g'?Object.fromEntries(Object.entries({kcal:'energy-kcal',protein:'proteins',carbs:'carbohydrates',fat:'fat'}).filter(([key])=>x.facts[key]!=null).map(([key,name])=>[name+'_100g',x.facts[key]*100/x.portion])):{}}));
if(typeof localProducts!=='undefined'){
 localProducts.supplement=localProducts.supplement.filter(x=>!/^Zumub · (Creatina monohidrato|Whey Protein|Multivitamínico)$/.test(x.name));
 localProducts.supplement.unshift(...zumubProducts22);
}
const nutritionLabels22=[['kcal','Energía','kcal'],['protein','Proteína','g'],['carbs','Hidratos','g'],['fat','Grasas','g'],...nutrientFields21];
function supplementFacts22(x,amount,unit){
 const gram=unit==='g'?amount:unit==='mg'?amount/1000:null;
 let factor=null;
 if(x.facts&&x.portion>0){if(unit===x.unit)factor=amount/x.portion;else if(['g','mg'].includes(x.unit)&&gram!==null)factor=gram/(x.unit==='mg'?x.portion/1000:x.portion);else if(unit==='raciones')factor=amount;}
 if(factor!==null)return Object.fromEntries(Object.entries(x.facts).filter(([key,n])=>nutritionLabels22.some(([known])=>known===key)&&numberMetric21(n)!==null).map(([key,n])=>[key,Number(n)*factor]));
 if(gram===null)return {};
 const n=x.n||{},out={};
 for(const [key,label,scale] of [['kcal','energy-kcal',1],['protein','proteins',1],['carbs','carbohydrates',1],['fat','fat',1],['fiber_g','fiber',1],['sugar_g','sugars',1],['sodium_mg','sodium',1000],['potassium_mg','potassium',1000],['calcium_mg','calcium',1000],['iron_mg','iron',1000],['magnesium_mg','magnesium',1000],['vitaminC_mg','vitamin-c',1000],['vitaminD_ug','vitamin-d',1000000],['vitaminB12_ug','vitamin-b12',1000000]]){
  const value=numberMetric21(n[label+'_100g']);if(value!==null)out[key]=value*scale*gram/100;
 }
 return out;
}
function supplementTable22(x){
 if(!x.facts||!(x.portion>0)||!x.unit||(!Object.keys(x.facts).some(key=>numberMetric21(x.facts[key])!==null)&&!x.active))return '';
 return '<details open class="label-table22"><summary>Tabla nutricional · '+x.portion+' '+x.unit+'</summary><p class="sub">Comprueba que coincide con el sabor y la etiqueta de tu envase. Los campos no declarados permanecen vacíos.</p><table><tbody>'+nutritionLabels22.filter(([key])=>x.facts[key]!==undefined).map(([key,name,unit])=>'<tr><th>'+name+'</th><td>'+metricNumber21(x.facts[key],2)+' '+unit+'</td></tr>').join('')+'</tbody></table>'+(x.active?'<p>'+safe(x.active)+'</p>':'')+(/^https:\/\//.test(x.url||'')?'<a href="'+safe(x.url)+'" target="_blank" rel="noopener noreferrer">Consultar fuente de la etiqueta</a>':'')+'</details>';
}
let supplementEditingContext23=null;
function supplementAccount23(){return typeof sessionStorage==='undefined'?{owner:'',token:''}:{owner:sessionStorage.veraUser,token:sessionStorage.veraToken};}
function beginSupplementEdit23(index){const row=s.logs[index];supplementEditingContext23=row?.kind==='Suplemento'?{...supplementAccount23(),state:s,row,id:row.id,snapshot:JSON.stringify(row)}:null;}
supplementForm=function(x,i=-1,replaceFacts=false){
 if(i>=0)beginSupplementEdit23(i);else supplementEditingContext23=null;
 const l=s.logs[i]||{},node=$('results6');if(!node)return;
 x=(x.facts&&x.portion>0?x:zumubProducts22.find(p=>p.id===(x.id||l.catalogId)))||x;
 const units=x.kind==='food'?['g','mg','ml','raciones']:['g','mg','ml','cápsulas','comprimidos','scoops','gotas','gominolas','raciones'];
 const guessed=l.unit||x.unit||(s.supplementUnits||{})[x.id||x.name]||presentation10(x)||'raciones';
 const amount=l.amount??l.grams??(x.portion>0?x.portion:1),initial=i>=0&&!replaceFacts?{...l,...l.nutrients,kcal:baseNutritionValue21(l,'kcal')}:supplementFacts22(x,amount,guessed);
 const input=([key,name,unit])=>field('supFact22_'+key,name+' ('+unit+')',initial[key]??'','number','min="0" step="any"');
 node.innerHTML='<h3>'+(x.kind==='food'?'Tu alimento, completo':'Tu suplemento, completo')+'</h3><p class="sub">'+safe(x.source||'Etiqueta manual')+'</p>'+field('supProduct','Marca y referencia',x.name||'')+field('supDate22','Fecha',l.date||day(),'date')+field('supAmount','Cantidad tomada',amount,'number','min="0.001" step="any"')+selectField('supUnit','Unidad',units,guessed)+supplementTable22(x)+'<details open><summary>Nutrición de la cantidad tomada</summary><p class="sub">Se sumará a tus comidas en Progreso. Puedes completar tu etiqueta; vacío significa desconocido. Cambiar la cantidad recalcula los datos de la etiqueta seleccionada.</p><div class="nutrition-inputs22">'+nutritionLabels22.slice(0,4).map(input).join('')+'</div><details><summary>Fibra, azúcares, vitaminas y minerales</summary><div class="nutrition-inputs22">'+nutritionLabels22.slice(4).map(input).join('')+'</div></details></details>'+(x.kind==='food'?'':mixingLiquidForm23(l.mixingLiquid))+(typeof productReview24==='function'?productReview24(x):'')+'<button id="saveSupp8" class="primary">'+(x.kind==='food'?'Guardar alimento':'Guardar suplemento')+'</button>'+(i>=0&&typeof completeSupplement24==='function'?btn('Completar etiqueta con una ficha exacta','completeSupplement24()'):'');
 let lastAmount=Number(amount),lastUnit=guessed;
 const recalc=()=>{const nextAmount=Number($('supAmount').value),nextUnit=$('supUnit').value,current={};
  if(!Number.isFinite(nextAmount)||nextAmount<=0)return;
  for(const [key]of nutritionLabels22){const n=numberMetric21($('supFact22_'+key).value);if(n!==null)current[key]=n;}
  const compatible=lastUnit===nextUnit||(['g','mg'].includes(lastUnit)&&['g','mg'].includes(nextUnit));
  const facts=compatible&&lastAmount>0?supplementFacts22({facts:current,portion:lastAmount,unit:lastUnit},nextAmount,nextUnit):supplementFacts22(x,nextAmount,nextUnit);
  for(const [key]of nutritionLabels22)$('supFact22_'+key).value=facts[key]===undefined?'':Number(facts[key].toFixed(4));lastAmount=nextAmount;lastUnit=nextUnit;
 };
 $('supAmount').onchange=recalc;$('supUnit').onchange=recalc;
 $('saveSupp8').onclick=()=>saveSupplement(x,i);if(typeof bindProductReview24==='function')bindProductReview24(x);node.scrollIntoView?.({block:'start'});
};
saveSupplement=function(x,i=-1){
 if(x.kind==='food'&&typeof saveFoodProduct24==='function')return saveFoodProduct24(x);
 if(i>=0){
  const context=supplementEditingContext23,account=supplementAccount23();
  if(!context||context.state!==s||context.owner!==account.owner||context.token!==account.token){supplementEditingContext23=null;return msg('La cuenta o el registro ha cambiado. Vuelve a abrir el suplemento.');}
  i=context.id?s.logs.findIndex(row=>row.id===context.id):s.logs.indexOf(context.row);
  if(i<0||s.logs[i].kind!=='Suplemento'||JSON.stringify(s.logs[i])!==context.snapshot||(context.id&&s.logs.filter(row=>row.id===context.id).length!==1)){supplementEditingContext23=null;return msg('El suplemento ya no está disponible. Vuelve a abrirlo.');}
 }
 const name=$('supProduct').value.trim(),amount=Number($('supAmount').value),unit=$('supUnit').value,date=$('supDate22').value;
 if(!name||!Number.isFinite(amount)||amount<=0||!validMetricDate21(date)||date>day())return msg('Revisa el producto, la fecha y la cantidad.');
 const facts={};for(const [key]of nutritionLabels22){const input=$('supFact22_'+key).value;if(input.trim()==='')continue;const n=numberMetric21(input);if(n===null)return msg('Revisa los valores nutricionales: deben ser números positivos o cero.');facts[key]=n;}
 let mixingLiquid;try{mixingLiquid=readMixingLiquid23();}catch(error){return msg(error.message);}
 const old=i>=0?s.logs[i]:null,l={...(old||{}),kind:'Suplemento',date,mixingLiquid,source:x.source||old?.source||'Etiqueta manual',reference:x.url||old?.reference||'',catalogId:x.id||old?.catalogId||'',productName:name,amount,unit,grams:unit==='g'?amount:unit==='mg'?amount/1000:null,label:x.n||old?.label||{},note:name+' · '+amount+' '+unit,value:null,kcal:facts.kcal??null,protein:facts.protein??null,carbs:facts.carbs??null,fat:facts.fat??null,nutrients:Object.fromEntries(nutrientFields21.filter(([key])=>facts[key]!==undefined).map(([key])=>[key,facts[key]]))};
 if(!mixingLiquid)delete l.mixingLiquid;
 s.supplementUnits||={};s.supplementUnits[x.id||l.catalogId||name]=unit;
 if(i>=0)s.logs[i]=l;else s.logs.push(l);supplementEditingContext23=null;save();render();msg('Suplemento enviado para guardar en tu cuenta.');
};
editSupplement=function(i){const l=s.logs[i];if(l?.kind==='Suplemento')supplementForm(zumubProducts22.find(p=>p.id===l.catalogId)||{name:l.productName||l.note||'',id:l.catalogId,n:l.label||{},url:l.reference,source:l.source,portion:l.amount,unit:l.unit,facts:{kcal:baseNutritionValue21(l,'kcal'),protein:l.protein,carbs:l.carbs,fat:l.fat,...l.nutrients}},i);};

// The liquid belongs to the same record: editing/deleting the dose also edits/deletes it.
function mixingLiquidForm23(liquid){
 const x=liquid||{},values=x.per100ml||{};
 return '<details open class="mixing-liquid23"><summary>¿Con qué lo tomas?</summary>'+selectField('mixType23','Líquido',['Sin líquido','Agua','Leche','Bebida vegetal'],({water:'Agua',milk:'Leche',plant:'Bebida vegetal'})[x.type]||'Sin líquido')+field('mixMl23','Cantidad de líquido (ml)',x.ml??'','number','min="1" max="5000" step="any"')+field('mixName23','Marca y tipo de leche o bebida (si corresponde)',x.name||'','text','maxlength="160"')+'<p class="sub">Agua: añade volumen sin calorías. Para leche o bebida vegetal, copia los valores de tu envase por 100 ml. No se asignan valores genéricos. No registres otra vez este mismo vaso como agua o comida.</p><details><summary>Etiqueta de la leche o bebida · por 100 ml</summary><div class="nutrition-inputs22">'+nutritionLabels22.map(([key,label,unit])=>field('mixFact23_'+key,label+' ('+unit+'/100 ml)',values[key]??'','number','min="0" step="any"')).join('')+'</div></details></details>';
}
function readMixingLiquid23(){
 const type=({'Agua':'water','Leche':'milk','Bebida vegetal':'plant'})[$('mixType23')?.value];
 if(!type)return null;
 const ml=Number($('mixMl23').value);if(!Number.isFinite(ml)||ml<1||ml>5000)throw Error('Indica una cantidad de líquido entre 1 y 5000 ml.');
 const per100ml={};
 if(type!=='water')for(const [key]of nutritionLabels22){const raw=$('mixFact23_'+key).value;if(!raw.trim())continue;const value=numberMetric21(raw);if(value===null)throw Error('Revisa la etiqueta del líquido: valores positivos o cero.');per100ml[key]=value;}
 return {type,ml,name:type==='water'?'Agua':$('mixName23').value.trim().slice(0,160),source:type==='water'?'Volumen registrado':'Etiqueta introducida por el usuario',per100ml};
}
