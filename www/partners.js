// The server calculates scores from confirmed sets and enforces membership.
const VeraPartners=(()=>{
 let timer,generation=0,pending=false,active=null,lastKey="";
 function stop(){clearTimeout(timer);generation++;pending=false;}
 function page(){
   active=null;lastKey="";const g=generation;
   timer=setTimeout(()=>refresh(g),0);
   return '<section><h2>Entrenar en pareja</h2><p id="partnerNick"></p><form id="pairInvite" onsubmit="event.preventDefault();VeraPartners.invite()"><label>Nick de tu compañero<input name="nick" placeholder="@nombre" required></label><label>Nombre de la sesión<input name="title" maxlength="80" required></label><label>Ejercicios, uno por línea<textarea name="plan" required></textarea></label><label>Series por ejercicio<input type="number" name="target" value="3" min="1" max="8" required></label><label>Modalidad<select name="mode"><option value="together">Entrenar juntos</option><option value="challenge">Reto por series</option></select></label><button class="primary">Invitar por nick</button></form></section><section id="pairRooms"></section><section id="pairDetail" hidden></section><p role="status" id="pairStatus"></p>';
 }
 const call=(action,d)=>api('partners/'+action,d);
 function note(value){const n=$('pairStatus');if(n)n.textContent=value;}
 function button(parent,label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b;}
 function line(parent,text,tag='p'){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
 function draw(r){
   const panel=$('pairDetail');panel.hidden=false;const key=JSON.stringify(r);
   if(key===lastKey)return;lastKey=key;
   const prev=panel.querySelector('select')?.value;panel.replaceChildren();line(panel,r.title,'h2');
   const totals={host:0,guest:0};for(const c of r.counts)totals[c.side]+=c.n;
   for(const side of ['host','guest'])line(panel,'@'+r[side]+' · '+totals[side]+' de '+(r.plan.length*r.target)+' series'+(r[side+'Done']?' · Terminado':''));
   if(r.state==='pending'){
     line(panel,'Pendiente de aceptación.');
     if(r.side==='guest')for(const [label,accept] of [['Aceptar y empezar',true],['Rechazar',false]])button(panel,label,()=>act('respond',{id:r.id,accept}));
   }else if(r.state==='active'&&!r[r.side+'Done']){
     const select=document.createElement('select');select.setAttribute('aria-label','Ejercicio');panel.append(select);
     r.plan.forEach((name,i)=>select.add(new Option(name,String(i))));if(prev)select.value=prev;
     button(panel,'Registrar serie',()=>act('set',{id:r.id,exercise:Number(select.value),event:crypto.randomUUID()}));
     button(panel,'Terminar mi parte',()=>act('finish',{id:r.id}));
   }else if(r.state==='finished'&&r.mode==='challenge'){
     line(panel,totals.host===totals.guest?'Empate':'Ganador · @'+r[totals.host>totals.guest?'host':'guest']);
   }else line(panel,({declined:'Invitación rechazada',finished:'Sesión terminada',active:'Esperando al compañero'})[r.state]||r.state);
 }
 async function refresh(g=generation){
   if(g!==generation||!$('pairRooms'))return;
   try{
     const out=await call('list',{});if(g!==generation)return;
     $('partnerNick').textContent='Tu nick · @'+out.nick;
     const panel=$('pairRooms');panel.replaceChildren();line(panel,'Mis sesiones','h2');
     if(!out.rooms.length)line(panel,'Todavía no tienes invitaciones.');
     for(const r of out.rooms)button(panel,r.title+' · @'+r[r.side==='host'?'guest':'host'],()=>{active=r.id;refresh(++generation);});
     const wanted=active;if(wanted){const result=await call('room',{id:wanted});if(g===generation&&wanted===active)draw(result.room);}
   }catch(e){if(g===generation)note(e.message);}
   finally{if(g===generation){clearTimeout(timer);timer=setTimeout(()=>refresh(g),4500);}}
 }
 async function act(action,data){
   if(pending)return;pending=true;const g=++generation;clearTimeout(timer);
   try{const out=await call(action,data);if(g!==generation)return;active=out.room.id;draw(out.room);note(action==='set'?'Serie confirmada.':'');}
   catch(e){if(g===generation)note(e.message);}
   finally{if(g===generation){pending=false;refresh(g);}}
 }
 function invite(){const f=new FormData($('pairInvite'));act('invite',{nick:f.get('nick'),title:f.get('title'),plan:String(f.get('plan')).split(/\n/).map(x=>x.trim()).filter(Boolean),target:Number(f.get('target')),mode:f.get('mode')});}
 return {page,stop,invite};
})();
