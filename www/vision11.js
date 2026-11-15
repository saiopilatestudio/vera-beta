let visionRuntime;
async function visualCandidates(src,group){
 ort.env.wasm.numThreads=1;
 ort.env.wasm.wasmPaths=new URL('./',location.href).href;
 visionRuntime??=Promise.all([ort.InferenceSession.create('vision.onnx',{executionProviders:['wasm']}),fetch('vision-labels.json').then(r=>r.json())]).catch(e=>{visionRuntime=null;throw e});
 const [model,labels]=await visionRuntime,img=new Image();img.src=src;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const g=canvas.getContext('2d'),side=Math.min(img.width,img.height);
 g.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,224,224);
 const pixels=g.getImageData(0,0,224,224).data,n=224*224,data=new Float32Array(n*3);
 for(let c=0;c<3;c++)for(let i=0;i<n;i++)data[c*n+i]=(pixels[4*i+c]/255-[.48145466,.4578275,.40821073][c])/[.26862954,.26130258,.27577711][c];
 const outputs=await model.run({pixel_values:new ort.Tensor('float32',data,[1,3,224,224])}),vector=outputs.image_embeds.data,norm=Math.hypot(...vector);
 return labels[group].map(([name,z])=>({name,score:z.reduce((sum,v,i)=>sum+v*vector[i],0)/norm})).sort((a,b)=>b.score-a.score);
}
let labelTicket=0;
async function labelSearch11(input){
 const file=input.files?.[0],node=$('suppResult'),ticket=++labelTicket;
 if(!file)return;
 node.textContent='Leyendo marca y referencia…';
 let text='',form='',src;
 try{
   const image=new Image();image.src=await readData(file);await image.decode();
   const ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
   canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);src=canvas.toDataURL('image/jpeg',.90);
   if(sessionStorage.veraToken && VeraPrivacy6.allowed('cloud') && s.preferLocal!==true){
     try{const remote=await api('label',{image:src});text=[remote.brand,remote.product].filter(x=>typeof x==='string').join(' ');form=String(remote.form||'');}catch{}
   }
   if(!text.trim())text=(await readLabel(src)).split(/\n+/).slice(0,3).join(' ');
 }catch{}
 if(!node.isConnected||ticket!==labelTicket)return;
 node.innerHTML=field('labelQuery','Marca y producto de la etiqueta',text.slice(0,140))+
   btn('Comparar marcas y referencias',"$('lookup6').value=$('labelQuery').value;VeraCatalog.search()")+
   '<button type="button" id="labelDirect">Usar esta etiqueta</button>';
 $('labelDirect').onclick=()=>{const name=$('labelQuery').value.trim();if(!name)return msg('Escribe la marca o el nombre legible.');supplementForm({name,form,n:{},source:'Etiqueta revisada'});};
 if(!text.trim())msg('La etiqueta no es legible. Puedes introducir marca y referencia o repetir la foto.');
}
