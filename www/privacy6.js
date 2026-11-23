const VeraPrivacy6={
 revision:0, scope:'cloud-routing-v3',
 key(k){return 'vera.permission.'+k+'.'+(sessionStorage.veraUser||'guest');},
 decided(){return !!sessionStorage.veraUser&&[this.scope,'groq-gemini-v2'].includes(localStorage.getItem(this.key('cloud.scope')));},
 extendedRouting(){return this.allowed('cloud')&&localStorage.getItem(this.key('cloud.scope'))===this.scope;},
 allowed(k){return !!sessionStorage.veraUser&&this.decided()&&localStorage.getItem(this.key(k))==='yes';},
 async ensureRemote(path='coach',data={},signal){
  if(!sessionStorage.veraToken)throw Error('Inicia sesión para utilizar la IA.');
  if(!this.allowed('cloud'))throw Error('Activa el análisis remoto de esta cuenta desde Perfil → Privacidad.');
  const upgrade='Esta función no está disponible en el servidor conectado. Reintenta más tarde. No se han enviado tus datos para análisis.';
  let response,config;
  try{response=await fetch(ACCOUNT_HOST+'/capabilities',{method:'GET',credentials:'omit',headers:{Accept:'application/vnd.vera.routing-v3+json, application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(75000)]):AbortSignal.timeout(75000)});}
  catch(e){if(signal?.aborted)throw e;throw Error('No se pudo comprobar el servidor. Revisa la conexión y vuelve a intentarlo. No se han enviado datos para análisis.');}
  if(!response.ok)throw Error(upgrade);
  try{config=await response.json();}catch{throw Error('No se pudo interpretar la comprobación del servidor. Reintenta más tarde. No se han enviado datos para análisis.');}
  const expected={coach:'groq',coach_deep:'gemini',intro:'groq',photo:'gemini',machine:'gemini',label:'gemini',listen:'groq',speak:'gemini'};
  const route=path==='diary-import'?(data.image?'photo':'coach'):['weekly-plan','workouts/weekly'].includes(path)?'coach':path==='coach'&&data.mode==='deep'?'coach_deep':path,ai=config?.ai,r=ai?.routes?.[route];
  const version=/^2\.(\d+)(?:\.\d+)?$/.exec(String(config?.apiVersion||''));
  const feature=path==='diary-import'?'diaryImport':path==='weekly-plan'?'weeklyTeam':path==='workouts/weekly'?'weeklyWorkouts':null;
  // Minor server upgrades remain compatible. Explicit capabilities win; 2.1
  // predates feature flags, so retain its original compatible contract.
  const supportsFeature=!feature||config?.features?.[feature]===true||config?.features?.[feature]===undefined&&config?.apiVersion==='2.1';
  const approved=['groq','gemini','cloudflare'];
  if(!version||!supportsFeature||![2,3].includes(ai?.routingVersion)||ai.execution!=='cloud-only'||ai.localInference!==false||!Array.isArray(ai.providers)||!ai.providers.length||ai.providers.some(p=>!approved.includes(p)))throw Error(upgrade);
  const flexible=['photo','label','weekly-plan','workouts/weekly'].includes(path);
  const selected=['weekly-plan','workouts/weekly'].includes(path)?(ai.routes.weeklyWorkouts||r):r;
  const matches=path==='photo'?['groq','gemini'].includes(selected?.provider):selected?.provider===expected[route];
  if(!expected[route]||!matches||!ai.providers.includes(selected.provider))throw Error(upgrade);
  const alternatives=selected.alternatives??(selected.fallback?[selected.fallback]:[]);
  const declared=[...ai.providers,...(Array.isArray(ai.optionalProviders)?ai.optionalProviders:[])];
  if(!Array.isArray(alternatives)||alternatives.some(a=>!approved.includes(a?.provider)||!declared.includes(a.provider)))throw Error(upgrade);
  if(!selected.configured&&!(flexible&&alternatives.some(a=>a.configured&&(path==='photo'&&a.provider==='groq'||this.extendedRouting()))))throw Error('El servidor todavía no tiene configurado '+(selected.provider==='gemini'?'Gemini':'Groq')+' ni un respaldo autorizado para esta función.');
  if(!this.allowed('cloud'))throw Error('Has revocado el análisis remoto. No se enviarán datos.');
 },
 set(v){if(!sessionStorage.veraUser||!sessionStorage.veraToken)return msg('Entra en tu cuenta para elegir el permiso de análisis remoto.');this.revision++;VeraSpeech14.stop();if(!v&&recording?.state==='recording')recording.stop();localStorage.setItem(this.key('cloud'),v?'yes':'no');localStorage.setItem(this.key('cloud.scope'),this.scope);render();msg('Preferencia de esta cuenta guardada.');},
 explanation(){return '<p>Para analizar platos y etiquetas o adaptar tu semana, VERA puede pasar la misma petición a Groq, Gemini o Cloudflare Workers AI si un servicio falla. Envía la foto y tus notas al analizar comida, y tu petición, el material y los registros necesarios para preparar una tabla. La IA se ejecuta en la nube. El diario se sincroniza con tu cuenta. Puedes revocar este permiso desde Perfil.</p>';},
 choice(){return btn('Permitir análisis remoto','VeraPrivacy6.set(true)')+btn('Seguir sin IA / revocar','VeraPrivacy6.set(false)');},
 prompt(){return this.decided()&&(!this.allowed('cloud')||this.extendedRouting())?'':'<section><h2>Elige cómo usar la IA en esta cuenta</h2>'+this.explanation()+this.choice()+'</section>';},
 panel(){return '<details><summary>Privacidad</summary>'+this.explanation()+'<p>Análisis remoto '+(this.allowed('cloud')?'activado':'desactivado')+'</p>'+this.choice()+'</details>';}
};
