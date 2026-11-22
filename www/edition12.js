function togglePass12(button){
 const input=$('pass');
 if(input.dataset.saved){delete input.dataset.saved;input.value='';input.focus();}
 input.type=input.type==='password'?'text':'password';
 button.textContent=input.type==='text'?'Ocultar contraseña':'Ver contraseña';
}
function submitLogin12(action){
 if(action==='login' && $('remember12')?.checked && $('pass')?.dataset.saved && window.VeraNative?.loginBiometric)return VeraNative.loginBiometric(true,false);
 if($('pass')?.dataset.saved){delete $('pass').dataset.saved;$('pass').value='';$('pass').focus();return msg('Escribe tu contraseña.');}
 return signIn(action);
}
async function authenticated12(token){
 if(!token||!$('email')||$('email').value.trim()!==window.VeraNative.savedEmail())return;
 const emailField=$('email'),email=emailField.value.trim();
 try{
   const r=await fetch(ACCOUNT_HOST+'/session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:'{}'});
   if(!emailField.isConnected||emailField.value.trim()!==email)return;
   if(r.status===401){VeraNative.forgetLogin();render();return msg('Tu sesión ha caducado. Escribe la contraseña.');}
   if(!r.ok)throw Error('No se pudo validar la sesión.');
   const data=await r.json();if(!emailField.isConnected||emailField.value.trim()!==email)return;if(!data.id)throw Error('Actualiza también el servidor para usar el acceso recordado.');
   sessionStorage.veraToken=token;sessionStorage.veraUser=ACCOUNT_HOST+'/'+data.id;localStorage.veraRememberedUser=sessionStorage.veraUser;
   if(typeof rememberSession24==='function')rememberSession24(sessionStorage.veraUser,token,true);
   clearSessionMedia14();s=loadVeraState(storageKey());if(data.nick)s.profile.nick=data.nick;validSession=true;if(!stateReadError)save();VeraJournal.onSession();go('Hoy');
 }catch(e){msg(e.message);}
}
async function plate12(el){
 const file=el.files?.[0];if(!file)return;
 const mediaOwner=sessionStorage.veraUser,mediaToken=sessionStorage.veraToken,mediaState=s;
 const owner=$('machineResult'),gym=$('gymNow').value,im=new Image();im.src=await readData(file);await im.decode();
 if(!sameVeraSession(mediaOwner,mediaToken,mediaState)||!el.isConnected)return;
 const c=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.round(im.width*ratio);c.height=Math.round(im.height*ratio);
 const ctx=c.getContext('2d');ctx.drawImage(im,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height);
 const qr=jsQR(pixels.data,c.width,c.height)?.data?.trim().slice(0,512)||'';
 const src=c.toDataURL('image/jpeg',.92),rev=++machineRevision;machinePlate=src;
 if(!owner.isConnected||$('gymNow').value!==gym||rev!==machineRevision)return;
 const prior=qr&&(s.machines||[]).find(m=>m.gym===gym&&m.qr===qr);
 machineDraft={...(prior||machineDraft||{}),...(qr?{qr}:{}),evidence:qr?'QR leído · '+qr:'Placa adjunta, pendiente de análisis con Gemini.'};
 showMachine();
 if(prior)return msg('Encontrada en tu inventario mediante QR. Revisa la ficha.');
 if(machinePhoto)return identify();
 msg('Placa adjunta. Añade una foto de la máquina completa para analizar ambas con Gemini.');
}
function addIngredient12(){
 const row=document.createElement('fieldset');
 row.innerHTML='<label>Ingrediente<input class="componentName"></label><label>Gramos consumidos<input class="componentGrams" type="number" min="1"></label><label>kcal por 100 g, si se conocen<input class="componentEnergy" type="number" min="0"></label><details><summary>Macros por 100 g (opcional)</summary><label>Proteína<input class="componentProtein" type="number" min="0" step="any"></label><label>Hidratos<input class="componentCarbs" type="number" min="0" step="any"></label><label>Grasa<input class="componentFat" type="number" min="0" step="any"></label></details><button type="button">Quitar ingrediente</button>';
 row.querySelector('button').onclick=()=>row.remove();$('components12').append(row);
}
function mealTotals14(rows){
 const metrics=['energy','protein','carbs','fat'];
 if(rows.some(x=>!x.name.trim()||!Number.isFinite(x.grams)||x.grams<=0||metrics.some(k=>x[k]!==''&&x[k]!=null&&(!Number.isFinite(Number(x[k]))||Number(x[k])<0))))throw Error('Revisa los nombres, las cantidades y los nutrientes.');
 const ingredients=rows.map(x=>({name:x.name.trim(),confirmedGrams:x.grams,...Object.fromEntries(metrics.map(k=>[k==='energy'?'kcal':k,x[k]===''||x[k]==null?null:x.grams*Number(x[k])/100]))}));
 const totals=Object.fromEntries(['kcal','protein','carbs','fat'].map(k=>[k,ingredients.every(x=>x[k]!==null)?ingredients.reduce((sum,x)=>sum+x[k],0):null]));
 return {ingredients,value:totals.kcal===null?null:Math.round(totals.kcal),protein:totals.protein,carbs:totals.carbs,fat:totals.fat};
}
function saveMeal12(){
 const rows=[{name:$('foodItem').value,grams:+$('foodGrams').value,energy:$('foodKcal').value,protein:$('foodProtein')?.value??'',carbs:$('foodCarbs')?.value??'',fat:$('foodFat')?.value??''},...Array.from($('components12').children,row=>({name:row.querySelector('.componentName').value,grams:+row.querySelector('.componentGrams').value,energy:row.querySelector('.componentEnergy').value,protein:row.querySelector('.componentProtein')?.value??'',carbs:row.querySelector('.componentCarbs')?.value??'',fat:row.querySelector('.componentFat')?.value??''}))];
 let totals;try{totals=mealTotals14(rows);}catch(error){return msg(error.message);}
 s.logs.push({date:day(),kind:'Comida',note:rows.map(x=>x.name.trim()+' · '+x.grams+' g').join(', '),...totals,source:'foto confirmada'});save();go('Alimentación');msg('Comida guardada en este dispositivo. Los nutrientes sin referencia quedan sin dato.');
}
