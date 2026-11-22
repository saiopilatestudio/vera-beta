/* Label recognition is exclusively performed by Gemini through the authenticated API. */
let labelTicket=0;
async function labelSearch11(input){
 const file=input.files?.[0],node=$('suppResult'),ticket=++labelTicket;if(!file||!node)return;
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
 const active=()=>sameVeraSession(owner,token,state)&&node.isConnected&&ticket===labelTicket;
 node.textContent='Preparando etiqueta para Gemini…';
 try{
  const image=new Image();image.src=await readData(file);await image.decode();
  const ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  if(!active())return;
  const remote=await api('label',{image:canvas.toDataURL('image/jpeg',.90)});if(!active())return;
  const product=typeof recognizedProduct24==='function'?recognizedProduct24(remote):{name:[remote.brand,remote.product].filter(x=>typeof x==='string').join(' '),form:remote.form,n:{},source:'Etiqueta revisada tras análisis Gemini'};
  const candidates=(Array.isArray(remote.catalogMatches)?remote.catalogMatches:[]).map(x=>productFromServer24(x));
  node.innerHTML='<h3>Revisa tu etiqueta</h3>'+field('labelQuery','Marca, producto y variante',product.name.slice(0,200))+
   '<p class="sub">'+(Object.keys(product.facts||{}).length?'Se han leído cantidades de la tabla. Comprueba la porción y cada valor antes de registrar.':'No hay una tabla nutricional legible con su porción. Fotografía también la parte posterior o introduce la etiqueta; no se inventarán sus nutrientes.')+'</p>'+
   (typeof supplementTable22==='function'?supplementTable22(product):'')+btn('Buscar esta referencia en mis fichas',"$('lookup6').value=$('labelQuery').value;VeraCatalog.search()")+
   '<button type="button" id="labelDirect">Revisar y registrar esta etiqueta</button>'+
   (candidates.length?'<h4>Referencias para comparar</h4><p>Selecciona sólo la variante exacta de tu envase.</p>'+candidates.map((x,i)=>'<button type="button" id="labelCandidate24_'+i+'">'+safe(x.name)+' · '+safe(x.variant||'variante por comprobar')+'</button>').join(''):'');
  $('labelDirect').onclick=()=>{if(!active())return;const name=$('labelQuery').value.trim();if(!name)return msg('Escribe la marca o el nombre legible.');supplementForm({...product,name});};
  candidates.forEach((x,i)=>{$('labelCandidate24_'+i).onclick=()=>{if(active())supplementForm(x);};});
  msg(product.name.trim()?'Comprueba que la foto y la variante corresponden a tu envase.':'No se ha podido leer el producto. Repite la foto o introduce los datos.');
 }catch(error){if(active())node.textContent=error.message+' Puedes reintentar o usar «Añadir desde la etiqueta» para escribir los datos manualmente.';}
}
