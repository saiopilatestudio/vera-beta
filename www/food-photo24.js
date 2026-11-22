/* Photo review survives harmless rerenders, remains account-bound, and always exits pending state. */
let foodPhotoJob24=null,foodPhotoSequence24=0;
function validateFoodPhoto24(value){
 if(!value||typeof value!=='object'||value.error)throw Error(typeof value?.error==='string'?value.error:'No se ha reconocido una comida. Prueba otra foto.');
 if(typeof value.description!=='string'||!value.description.trim()||typeof value.min!=='number'||typeof value.max!=='number'||!Number.isFinite(value.min)||!Number.isFinite(value.max)||value.min<0||value.max<value.min||value.max>90000)throw Error('La estimación ha llegado incompleta. Vuelve a intentar o registra la comida manualmente.');
 const ingredients=Array.isArray(value.ingredients)?value.ingredients.slice(0,60).map(item=>{
  if(!item||typeof item.name!=='string'||!Number.isFinite(item.grams)||item.grams<=0)throw Error('La ración de un ingrediente no es válida. Repite la foto o registra el plato manualmente.');
  const row={name:item.name.slice(0,200),grams:item.grams};for(const key of ['kcal','protein','carbs','fat']){const number=numberMetric21(item[key]);row[key]=number;}
  return row;
 }):[];
 return {...value,description:value.description.slice(0,1000),assumptions:String(value.assumptions||'').slice(0,4000),question:String(value.question||'').slice(0,1000),ingredients};
}
function foodPhotoPanel24(text,retry=true){const target=$('estimate');if(target)target.innerHTML='<p role="status">'+safe(text)+'</p>'+(retry?btn('Volver a analizar','estimate()')+btn('Registrar manualmente','foodReview()'):btn('Cancelar análisis','cancelFoodPhoto24()'));}
function cancelFoodPhoto24(){const job=foodPhotoJob24;if(!job)return;job.cancelled=true;job.controller.abort();job.reject?.(Error('Análisis cancelado. Puedes registrar la comida manualmente.'));}
estimate=function(){
 if(!photoData){msg('Selecciona una foto.');return Promise.resolve();}
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s,source=photoData,note=$('portion')?.value||'';
 if(foodPhotoJob24&&foodPhotoJob24.source===source&&foodPhotoJob24.note===note&&sameVeraSession(foodPhotoJob24.owner,foodPhotoJob24.token,foodPhotoJob24.state))return foodPhotoJob24.promise;
 if(foodPhotoJob24)cancelFoodPhoto24();
 const job={owner,token,state,source,note,controller:new AbortController(),sequence:++foodPhotoSequence24};foodPhotoJob24=job;draft=null;
 const active=()=>foodPhotoJob24===job&&sameVeraSession(owner,token,state)&&source===photoData;
 const visible=()=>active()&&!!$('estimate')?.isConnected;
 foodPhotoPanel24('Estimando ración e ingredientes… Puedes cancelar si lo prefieres.',false);msg('Estimando ración e ingredientes…');
 job.promise=(async()=>{let timeout,slow;
 try{
  const deadline=new Promise((_,reject)=>{job.reject=reject;timeout=setTimeout(()=>{job.controller.abort();reject(Error('El análisis ha tardado demasiado. Reintenta o introduce la comida manualmente.'));},90000);});
  slow=setTimeout(()=>{if(visible())foodPhotoPanel24('Gemini sigue analizando la foto. La ración es una estimación que tendrás que revisar.',false);},15000);
  const result=await Promise.race([api('photo',{image:source,note},false,{signal:job.controller.signal}),deadline]);
  if(!active()||job.cancelled)return;
  const analysis=validateFoodPhoto24(result);if(!visible())return;
  // A server sync may replace this DOM node while awaiting. Reacquire it now.
  draft=analysis;const target=$('estimate');target.innerHTML='<h3>'+safe(draft.description)+'</h3><p>'+safe(draft.min)+'–'+safe(draft.max)+' kcal</p><p>'+safe(draft.assumptions)+'</p><p>'+safe(draft.question)+'</p><small>Revisa ingredientes y cantidades. Una foto no permite conocer con exactitud el aceite, las salsas ni el peso.</small>'+field('kcal','Estimación que guardarás (kcal)',Math.round((draft.min+draft.max)/2),'number','min="0"')+ingredientEditor()+btn('Confirmar comida','confirmMeal()',true);
  if(draft.ingredients.length&&$('ing0')&&$('ingtotal')&&$('kcal'))ingredientTotal();msg('Estimación pendiente de tu confirmación.');
 }catch(error){if(active()){const text=job.cancelled?'Análisis cancelado. No se ha guardado la comida.':(error.name==='AbortError'?'El análisis se ha interrumpido. Puedes reintentar.':error.message)+' No se ha guardado la comida.';if(visible())foodPhotoPanel24(text);msg(text);}}
 finally{clearTimeout(timeout);clearTimeout(slow);if(foodPhotoJob24===job)foodPhotoJob24=null;}
 })();return job.promise;
};
