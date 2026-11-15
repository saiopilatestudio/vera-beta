import {Wllama} from '@wllama/wllama';
let engine, running, state='Instalado';
window.veraCancel=()=>running?.abort();
window.veraAIStatus=()=>({state,loaded:!!engine});
window.veraGenerate=async function(question,context='',status=()=>{}){
 if(running)throw Error('Hay una respuesta en curso.');
 const controller=new AbortController();running=controller;
 const update=s=>{state=s;status(s)};
 try{
  if(!engine){update('Cargando el modelo incluido…');const res=await fetch(new URL('coach.gguf',location.href),{signal:controller.signal});if(!res.ok)throw Error('Modelo ausente.');const blob=await res.blob();if(blob.size!==491400032)throw Error('Modelo incompleto.');
   const ai=new Wllama({'single-thread/wllama.wasm':new URL('local.wasm',location.href).href},{suppressNativeLog:true});
   try{await ai.loadModel([blob],{n_threads:1,n_ctx:1024,n_batch:32});engine=ai;}catch(e){try{await ai.exit()}catch{}throw e}
  }
  if(controller.signal.aborted)throw Error('Cancelada');update('Generando en este dispositivo…');
  const answer=await engine.createChatCompletion([{role:'system',content:'Eres Vera, asistente de entrenamiento. Responde en español. No diagnostiques ni inventes datos. Contexto: '+String(context).slice(0,1100)},{role:'user',content:String(question).slice(0,850)}],{nPredict:128,stream:false,sampling:{temp:.35},abortSignal:controller.signal});
  if(controller.signal.aborted)throw Error('Cancelada');if(!answer?.trim())throw Error('Respuesta vacía');update('Disponible');return answer;
 }catch(e){state=controller.signal.aborted?'Cancelada':e.message;throw Error(state)}finally{running=null}
};
window.veraTestAI=async function(status){let t=performance.now();const answer=await veraGenerate('Saluda en español en tres palabras.','',status);return {answer,durationMs:Math.round(performance.now()-t)}};
