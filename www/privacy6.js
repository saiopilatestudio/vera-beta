const VeraPrivacy6={
 revision:0, scope:'groq-gemini-v2',
 key(k){return 'vera.permission.'+k+'.'+(sessionStorage.veraUser||'guest');},
 decided(){return !!sessionStorage.veraUser&&localStorage.getItem(this.key('cloud.scope'))===this.scope;},
 allowed(k){return !!sessionStorage.veraUser&&this.decided()&&localStorage.getItem(this.key(k))==='yes';},
 async ensureRemote(path='coach',data={},signal){
  if(!sessionStorage.veraToken)throw Error('Inicia sesión para utilizar la IA.');
  if(!this.allowed('cloud'))throw Error('Activa el análisis remoto de esta cuenta desde Perfil → Privacidad.');
  const upgrade='Esta función no está disponible en el servidor conectado. Reintenta más tarde. No se han enviado tus datos para análisis.';
  let response,config;
  try{response=await fetch(ACCOUNT_HOST+'/capabilities',{method:'GET',credentials:'omit',headers:{Accept:'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(75000)]):AbortSignal.timeout(75000)});}
  catch(e){if(signal?.aborted)throw e;throw Error('No se pudo comprobar el servidor. Revisa la conexión y vuelve a intentarlo. No se han enviado datos para análisis.');}
  if(!response.ok)throw Error(upgrade);
  try{config=await response.json();}catch{throw Error('No se pudo interpretar la comprobación del servidor. Reintenta más tarde. No se han enviado datos para análisis.');}
  const expected={coach:'groq',coach_deep:'gemini',intro:'groq',photo:'gemini',machine:'gemini',label:'gemini',listen:'groq',speak:'gemini'};
  const route=path==='diary-import'?(data.image?'photo':'coach'):['weekly-plan','workouts/weekly'].includes(path)?'coach':path==='coach'&&data.mode==='deep'?'coach_deep':path,ai=config?.ai,r=ai?.routes?.[route];
  const version=/^2\.(\d+)(?:\.\d+)?$/.exec(String(config?.apiVersion||''));
  const feature=path==='diary-import'?'diaryImport':path==='weekly-plan'?'weeklyTeam':path==='workouts/weekly'?'weeklyWorkouts':null;
  // Minor server upgrades remain compatible. Explicit capabilities win; 2.1
  // predates feature flags, so retain its original compatible contract.
  const photoRoute=path==='photo',providerMatches=photoRoute?['groq','gemini'].includes(r?.provider):r?.provider===expected[route];
  const fallbackAllowed=!photoRoute||!r?.fallback||['groq','gemini'].includes(r.fallback.provider)&&ai?.providers?.includes(r.fallback.provider);
  const supportsFeature=!feature||config?.features?.[feature]===true||config?.features?.[feature]===undefined&&config?.apiVersion==='2.1';
  if(!version||!supportsFeature||ai?.routingVersion!==2||ai?.execution!=='cloud-only'||ai?.localInference!==false||!Array.isArray(ai.providers)||!ai.providers.length||ai.providers.some(p=>!['groq','gemini'].includes(p))||!expected[route]||!providerMatches||!fallbackAllowed||!ai.providers.includes(r.provider))throw Error(upgrade);
  if(r.configured!==true)throw Error('El servidor todavía no tiene configurado '+(r.provider==='groq'?'Groq':'Gemini')+' para esta función. Puedes seguir usando el diario manual.');
  if(!this.allowed('cloud'))throw Error('Has revocado el análisis remoto. No se enviarán datos.');
 },
 set(v){if(!sessionStorage.veraUser||!sessionStorage.veraToken)return msg('Entra en tu cuenta para elegir el permiso de análisis remoto.');this.revision++;VeraSpeech14.stop();if(!v&&recording?.state==='recording')recording.stop();localStorage.setItem(this.key('cloud'),v?'yes':'no');localStorage.setItem(this.key('cloud.scope'),this.scope);render();msg('Preferencia de esta cuenta guardada.');},
 explanation(){return '<p>Tu diario, perfil y datos autorizados de Health Connect se guardan en el dispositivo y se sincronizan automáticamente con tu cuenta. Con el análisis remoto permitido, las revisiones automáticas del plan también envían el contexto necesario a Groq. Al pedir análisis remoto, el servidor envía tu consulta y el contexto seleccionado a Groq para conversación y a Gemini para revisión avanzada. Las fotos de comida se analizan con Gemini y, si el servidor lo tiene configurado, pueden usar Groq como alternativa ante un límite temporal. El resto de imágenes se analiza con Gemini; el audio que dictas se transcribe con Groq. Si pides escuchar una respuesta, su texto se envía a Gemini para crear audio en español. No hay IA ni reconocimiento de voz local. Puedes seguir registrando sin IA. El permiso es independiente para cada cuenta y dispositivo; revocarlo detiene el audio y bloquea nuevas consultas, pero no retira datos ya enviados.</p>';},
 choice(){return btn('Permitir análisis remoto','VeraPrivacy6.set(true)')+btn('Seguir sin IA / revocar','VeraPrivacy6.set(false)');},
 prompt(){return this.decided()?'':'<section><h2>Elige cómo usar la IA en esta cuenta</h2>'+this.explanation()+this.choice()+'</section>';},
 panel(){return '<details><summary>Privacidad</summary>'+this.explanation()+'<p>Análisis remoto '+(this.allowed('cloud')?'activado':'desactivado')+'</p>'+this.choice()+'</details>';}
};
