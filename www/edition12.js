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
 try{
   const r=await fetch(ACCOUNT_HOST+'/session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:'{}'});
   if(r.status===401){VeraNative.forgetLogin();render();return msg('Tu sesión ha caducado. Escribe la contraseña.');}
   if(!r.ok)throw Error('No se pudo validar la sesión.');
   const data=await r.json();if(!data.id)throw Error('Actualiza también el servidor para usar el acceso recordado.');
   sessionStorage.veraToken=token;sessionStorage.veraUser=ACCOUNT_HOST+'/'+data.id;localStorage.veraRememberedUser=sessionStorage.veraUser;
   s=JSON.parse(localStorage.getItem(storageKey())||'null')||initial();validSession=true;go('Hoy');
 }catch(e){msg(e.message);}
}
async function plate12(el){
 const file=el.files?.[0];if(!file)return;
 const owner=$('machineResult'),gym=$('gymNow').value,im=new Image();im.src=await readData(file);await im.decode();
 const c=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.round(im.width*ratio);c.height=Math.round(im.height*ratio);
 const ctx=c.getContext('2d');ctx.drawImage(im,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height);
 const qr=jsQR(pixels.data,c.width,c.height)?.data?.trim().slice(0,512)||'';
 const src=c.toDataURL('image/jpeg',.92),rev=++machineRevision;machinePlate=src;
 const label=await readLabel(src).catch(()=>'');
 if(!owner.isConnected||$('gymNow').value!==gym||rev!==machineRevision)return;
 const d={...machineDraft};for(const k of ['type','brand','model','fit','muscles','operation'])if($('m_'+k))d[k]=$('m_'+k).value;
 const joined=label.replace(/\s+/g,' ');
 if(/life\s*fitness/i.test(joined))d.brand='Life Fitness';else if(/hammer\s*strength/i.test(joined))d.brand='Hammer Strength';
 const model=label.match(/(?:model(?:o)?|product code)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{2,25})\b/i);if(model)d.model=model[1];
 const prior=qr&&(s.machines||[]).find(m=>m.gym===gym&&m.qr===qr);
 if(prior){Object.assign(d,prior);}
 if(qr)d.qr=qr;
 d.evidence=[label.trim().slice(0,250),qr?'QR leído · '+qr:''].filter(Boolean).join(' · ')||'Placa ilegible. Prueba de frente, con luz y sin reflejos.';
 machineDraft=d;showMachine();if(!prior&&machinePhoto&&sessionStorage.veraToken&&s.preferLocal!==true&&VeraPrivacy6.allowed('cloud'))return identify();msg(prior?'Encontrada en tu inventario.':'Revisa la identificación antes de guardarla.');
}
function addIngredient12(){
 const row=document.createElement('fieldset');
 row.innerHTML='<label>Ingrediente<input class="componentName"></label><label>Gramos consumidos<input class="componentGrams" type="number" min="1"></label><label>kcal por 100 g, si se conocen<input class="componentEnergy" type="number" min="0"></label><button type="button">Quitar ingrediente</button>';
 row.querySelector('button').onclick=()=>row.remove();$('components12').append(row);
}
function saveMeal12(){
 const rows=[{name:$('foodItem').value,grams:+$('foodGrams').value,energy:$('foodKcal').value},...Array.from($('components12').children,row=>({name:row.querySelector('.componentName').value,grams:+row.querySelector('.componentGrams').value,energy:row.querySelector('.componentEnergy').value}))];
 if(rows.some(x=>!x.name.trim()||!Number.isFinite(x.grams)||x.grams<=0||(x.energy!==''&&(!Number.isFinite(+x.energy)||+x.energy<0))))return msg('Revisa los nombres, las cantidades y la energía.');
 const allKnown=rows.every(x=>x.energy!=='');
 s.logs.push({date:day(),kind:'Comida',note:rows.map(x=>x.name.trim()+' · '+x.grams+' g').join(', '),ingredients:rows.map(x=>({name:x.name.trim(),confirmedGrams:x.grams,kcal:x.energy===''?null:x.grams*Number(x.energy)/100})),value:allKnown?Math.round(rows.reduce((sum,x)=>sum+x.grams*Number(x.energy)/100,0)):null,source:'foto confirmada'});save();go('Alimentación');
}
