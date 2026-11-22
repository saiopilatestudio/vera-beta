/* V2.4: reusable, explicitly reviewed product facts; no inferred micronutrients. */
function productFacts24(value){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;for(const [key]of nutritionLabels22){const n=numberMetric21(value[key]);if(n!==null&&n<=100000)out[key]=n;}return out;}
function productUnit24(value){return ({capsule:'cápsulas',capsules:'cápsulas','cápsula':'cápsulas',capsulas:'cápsulas',tablet:'comprimidos',tablets:'comprimidos',comprimido:'comprimidos',serving:'raciones',servings:'raciones',ración:'raciones'})[String(value||'').toLowerCase()]||(['g','mg','ml','cápsulas','comprimidos','scoops','gotas','gominolas','raciones'].includes(value)?value:'');}
function productFromServer24(product){return {...product,name:product.name||product.product||'',source:product.source||product.sourceNote||(product.confirmed===true?'Ficha confirmada por ti':'Introduce los valores de tu envase'),url:product.url||product.sourceUrl||'',facts:productFacts24(product.facts),unit:productUnit24(product.unit),n:product.n||{}};}
function recognizedProduct24(remote){
 const unit=productUnit24(remote.unit),portion=numberMetric21(remote.portion);
 const product={name:[remote.brand,remote.product,remote.variant].filter(x=>typeof x==='string'&&x.trim()).join(' · ').slice(0,200),brand:String(remote.brand||'').slice(0,100),variant:String(remote.variant||'').slice(0,100),form:String(remote.form||''),unit,portion:portion>0?portion:null,facts:unit&&portion>0?productFacts24(remote.facts):{},n:{},source:'Lectura de etiqueta · Gemini · pendiente de revisión',labelReview24:true};
 // No join by brand alone. A matched product is only offered for explicit selection below.
 return product;
}
function productReview24(x){
 return '<details class="product-review24"><summary>Guardar esta ficha para próximas tomas</summary><p class="sub">Revisa la marca, la variante exacta y la tabla. Se guardará sólo para tu cuenta; no añadirá otra toma. La tabla corresponde al producto seleccionado, sin los líquidos añadidos a un suplemento.</p>'+field('productBrand24','Marca',x.brand||'','text','maxlength="100"')+field('productVariant24','Variante o sabor (por ejemplo, Sin sabor)',x.variant||'','text','maxlength="100"')+'<label class="check"><input type="checkbox" id="productConfirmed24"> He comparado la identidad y los valores con mi envase.</label><button type="button" id="rememberProduct24">Guardar ficha privada</button><p id="rememberStatus24" role="status"></p></details>';
}
function productDraft24(x){
 const name=$('supProduct').value.trim(),brand=$('productBrand24').value.trim(),variant=$('productVariant24').value.trim(),portion=Number($('supAmount').value),unit=productUnit24($('supUnit').value),facts={};
 if(!$('productConfirmed24').checked)throw Error('Confirma que has comparado la ficha con tu envase.');
 if(!name||!brand||!variant||!unit||!Number.isFinite(portion)||portion<=0)throw Error('Completa marca, producto, variante y cantidad de la tabla.');
 for(const [key]of nutritionLabels22){const raw=$('supFact22_'+key).value;if(!raw.trim())continue;const value=numberMetric21(raw);if(value===null||value>100000)throw Error('Revisa las cantidades de la etiqueta.');facts[key]=value;}
 if(!Object.keys(facts).length)throw Error('Añade al menos un nutriente declarado; una ficha vacía no permite calcular tu progreso.');
 return {name,brand,variant,kind:x.kind==='food'?'food':'supplement',form:x.form||'',portion,unit,facts,url:x.url||'',source:x.source||'Etiqueta revisada por el usuario',...(x.visibility==='private'&&x.id?{id:x.id,revision:x.revision}:{})};
}
function bindProductReview24(x){
 const button=$('rememberProduct24');if(!button)return;
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
 button.onclick=async()=>{const status=$('rememberStatus24');if(!sameVeraSession(owner,token,state))return;let draft;try{draft=productDraft24(x);}catch(e){status.textContent=e.message;return;}button.disabled=true;status.textContent='Guardando ficha en tu cuenta…';
 try{const response=await api('products/confirm',{confirmed:true,product:draft});if(!sameVeraSession(owner,token,state)||!status.isConnected)return;Object.assign(x,productFromServer24(response.product));status.textContent='Ficha guardada. Ya puedes buscarla por nombre o marca sin volver a analizar la foto.';}catch(e){if(sameVeraSession(owner,token,state)&&status.isConnected)status.textContent='No se ha guardado la ficha. '+e.message;}finally{button.disabled=false;}};
}
function nutrientCoverage24(log){const declared=nutrientFields21.filter(([key])=>baseNutritionValue21(log,key)!==null);return declared.length+' de '+nutrientFields21.length+' micronutrientes con cantidad declarada';}

function completeSupplement24(){
 const context=supplementEditingContext23,account=supplementAccount23();
 if(!context||context.state!==s||context.owner!==account.owner||context.token!==account.token)return msg('Vuelve a abrir el suplemento de tu cuenta.');
 const index=context.id?s.logs.findIndex(row=>row.id===context.id):s.logs.indexOf(context.row);
 if(index<0||JSON.stringify(s.logs[index])!==context.snapshot)return msg('El registro ha cambiado. Vuelve a abrirlo.');
 VeraCatalog.selectForSupplement(index);
}
function foodProductForm24(product={}){
 const x=productFromServer24({...product,kind:'food',unit:product.unit||'g',portion:product.portion||100,facts:product.facts||supplementFacts22(product,100,'g')});
 supplementForm(x);
}
function saveFoodProduct24(x){
 const name=$('supProduct').value.trim(),amount=Number($('supAmount').value),unit=$('supUnit').value,date=$('supDate22').value,facts={};
 if(!name||!Number.isFinite(amount)||amount<=0||!['g','mg','ml','raciones'].includes(unit)||!validMetricDate21(date)||date>day())return msg('Revisa nombre, fecha y cantidad del alimento (g, mg, ml o raciones).');
 for(const [key]of nutritionLabels22){const raw=$('supFact22_'+key).value;if(!raw.trim())continue;const value=numberMetric21(raw);if(value===null)return msg('Revisa la etiqueta: cantidades positivas o cero.');facts[key]=value;}
 s.logs.push({kind:'Comida',date,productName:name,amount,unit,grams:unit==='g'?amount:unit==='mg'?amount/1000:null,value:facts.kcal??null,protein:facts.protein??null,carbs:facts.carbs??null,fat:facts.fat??null,nutrients:Object.fromEntries(nutrientFields21.filter(([key])=>facts[key]!==undefined).map(([key])=>[key,facts[key]])),note:name+' · '+amount+' '+unit,catalogId:x.id||'',reference:x.url||'',source:x.source||'Etiqueta manual',label:x.n||{}});
 save();render();msg('Alimento enviado para guardar en tu cuenta.');
}

function openSupplementFromMetrics24(id){
 const index=s.logs.findIndex(row=>row.id===id&&row.kind==='Suplemento');if(index<0)return msg('Ese suplemento ya no está en tu cuenta.');
 go('Suplementación');editSupplement(index);
}
function supplementRepairPanel24(logs,since,today){
 const rows=(logs||[]).filter(row=>row.kind==='Suplemento'&&row.date>=since&&row.date<=today&&/^[A-Za-z0-9_-]{3,100}$/.test(row.id||'')&&!nutrientFields21.some(([key])=>baseNutritionValue21(row,key)!==null));
 if(!rows.length)return '';
 return '<details><summary>Revisar '+rows.length+' suplementos sin micronutrientes declarados</summary><p class="sub">Algunas etiquetas no los incluyen. Si tu envase sí tiene una tabla, abre la toma y pulsa Completar etiqueta para elegir su referencia exacta. Se mantiene la fecha y la cantidad tomadas.</p>'+rows.slice(-20).reverse().map(row=>'<div><b>'+safe(row.productName||row.note||'Suplemento')+'</b><small> · '+safe(row.date)+'</small>'+btn('Revisar etiqueta',"openSupplementFromMetrics24('"+row.id+"')")+'</div>').join('')+'</details>';
}
