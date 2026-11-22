/* Label recognition is exclusively performed by Gemini through the authenticated API. */
let labelTicket=0;
async function labelSearch11(input){
 const file=input.files?.[0],node=$('suppResult'),ticket=++labelTicket;if(!file)return;
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
 node.textContent='Preparando etiqueta para Gemini…';
 try{
  const image=new Image();image.src=await readData(file);await image.decode();
  const ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  if(!sameVeraSession(owner,token,state)||!node.isConnected||ticket!==labelTicket)return;
  const remote=await api('label',{image:canvas.toDataURL('image/jpeg',.90)});
  if(!node.isConnected||ticket!==labelTicket)return;
  const text=[remote.brand,remote.product].filter(x=>typeof x==='string').join(' '),form=typeof remote.form==='string'?remote.form:'';
  node.innerHTML=field('labelQuery','Marca y producto de la etiqueta',text.slice(0,140))+
   btn('Comparar marcas y referencias',"$('lookup6').value=$('labelQuery').value;VeraCatalog.search()")+
   '<button type="button" id="labelDirect">Usar esta etiqueta</button>';
  $('labelDirect').onclick=()=>{const name=$('labelQuery').value.trim();if(!name)return msg('Escribe la marca o el nombre legible.');supplementForm({name,form,n:{},source:'Etiqueta revisada tras análisis Gemini'});};
  msg(text.trim()?'Revisa la lectura de Gemini antes de guardar.':'No se ha podido leer la etiqueta. Corrige los datos o repite la foto.');
 }catch(error){if(node.isConnected&&ticket===labelTicket)node.textContent=error.message+' Puedes reintentar o usar «Añadir desde la etiqueta» para escribir los datos manualmente.';}
}
