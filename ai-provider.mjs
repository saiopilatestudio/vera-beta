// Server-only routing; additional providers require explicit request consent.
export class ServiceError extends Error {
  constructor(message, status = 502, code = 'AI_UNAVAILABLE', retryAfter) { super(message); Object.assign(this, { status, code, retryAfter }); }
}
export function aiConfiguration(env = process.env) {
  const route = (provider, model) => ({provider, model, configured: Boolean(env[provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY']?.trim())});
  const groq = route('groq', env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b');
  const vision = route('gemini', env.GEMINI_VISION_MODEL || 'gemini-3.5-flash-lite');
  const cf={provider:'cloudflare',model:'@cf/qwen/qwen3.8-27b',configured:Boolean(workerUrl24(env)&&env.VERA_CF_WORKER_SECRET?.trim().length>=32),requiresCloudConsent:true};
  const imageAlt={...route('groq',env.GROQ_VISION_MODEL||'qwen/qwen3.8-27b'),requiresCloudConsent:true};
  const configuration={routingVersion:3, optionalProviders:['cloudflare'],requiredConsentField:'cloudFallbackConsent',  providers:['groq','gemini'], execution:'cloud-only', localInference:false, verification:'configuration-only', speechOutput:'remote', routes:{
    coach:{...groq}, coach_deep:route('gemini',env.GEMINI_DEEP_MODEL || 'gemini-3.5-flash-lite'), intro:{...groq},
    photo:{...vision,automatic:true,alternatives:[{...imageAlt,requiresCloudConsent:false},cf],fallback:{...route('groq',env.GROQ_VISION_MODEL||'qwen/qwen3.8-27b'),on:['AI_RATE_LIMIT','AI_BUSY','AI_TIMEOUT'],maxAttempts:1}}, machine:{...vision}, label:{...vision,automatic:true,alternatives:[imageAlt,cf]}, weeklyWorkouts:{...groq,automatic:true,alternatives:[{...vision,requiresCloudConsent:true},{...cf,model:'@cf/mistralai/mistral-small-3.1-24b-instruct'}]},
    listen:route('groq',env.GROQ_SPEECH_MODEL || 'whisper-large-v3-turbo'),
    speak:route('gemini',env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts'),
  }};
  for(const route of Object.values(configuration.routes)){route.available=route.configured||Boolean(route.alternatives?.some(x=>x.configured));}
  return configuration;
}
export function requireRoute(feature, env = process.env) {
  const route = aiConfiguration(env).routes[feature];
  if (!route) throw new ServiceError('Función de IA no admitida.',400,'AI_PATH');
  if (!route.configured) throw new ServiceError(`El servicio ${route.provider === 'groq' ? 'Groq' : 'Gemini'} para esta función todavía no está activado.`,503,'AI_NOT_CONFIGURED');
  if (!/^[a-zA-Z0-9._/-]{1,160}$/.test(route.model) || (route.provider === 'gemini' && route.model.includes('/'))) throw new ServiceError('El modelo de IA configurado no es válido.',503,'AI_CONFIG');
  return route;
}
async function requestJson(url, headers, body, {env, fetchImpl, deadline, maxBytes = 1000000, attempt = 0}) {
  const end = deadline ?? Date.now() + 75000;
  const remaining = end - Date.now();
  if (remaining < 1) throw new ServiceError('La IA ha tardado demasiado. Puedes reintentar.',504,'AI_TIMEOUT');
  const timeout = Math.min(remaining,75000,Math.max(1000,Number(env.VERA_AI_TIMEOUT_MS)||45000));
  try {
    const response = await fetchImpl(url,{method:'POST',redirect:'error',headers:{...headers,...(body instanceof FormData ? {} : {'Content-Type':'application/json'})},body:body instanceof FormData ? body : JSON.stringify(body),signal:AbortSignal.timeout(timeout)});
    if (!response.ok) {
      await response.body?.cancel();
      // Retry one explicit unavailable response within the original deadline.
      // Never repeat accepted output or quota errors.
      if (response.status === 503 && attempt === 0) {
        if (end - Date.now() > 1500) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return requestJson(url, headers, body, {env, fetchImpl, deadline:end, maxBytes, attempt:1});
        }
      }
      if (response.status === 429) { const seconds=Number(response.headers.get('retry-after')); throw new ServiceError('El proveedor ha alcanzado su límite temporal. Reintenta más tarde.',429,'AI_RATE_LIMIT',Number.isFinite(seconds)&&seconds>0?Math.min(Math.ceil(seconds),3600):30); }
      if(response.status===422)throw new ServiceError('El proveedor no pudo completar una respuesta válida.',502,'AI_INCOMPLETE');
      if ([400,401,403,404].includes(response.status)) throw new ServiceError('La configuración o el modelo de IA requiere revisión del administrador.',503,'AI_CONFIG');
      if (response.status === 503) throw new ServiceError('Gemini o Groq está temporalmente saturado. Tu registro no se ha modificado; vuelve a intentarlo en unos instantes.',503,'AI_BUSY',15);
      throw new ServiceError('El proveedor no ha podido completar la solicitud. Puedes reintentar.',502,'AI_RESPONSE');
    }
    if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new ServiceError('La respuesta de IA supera el límite permitido.',502,'AI_FORMAT'); }
    const reader = response.body?.getReader(); if (!reader) throw new ServiceError('Respuesta de IA vacía.',502,'AI_FORMAT');
    const chunks=[]; let size=0;
    try { while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>maxBytes) {await reader.cancel();throw new ServiceError('La respuesta de IA supera el límite permitido.',502,'AI_FORMAT');} chunks.push(value); } } finally { reader.releaseLock(); }
    try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new ServiceError('La IA devolvió una respuesta no válida.',502,'AI_FORMAT');}
  } catch(error) {
    if(error instanceof ServiceError)throw error;
    if(['TimeoutError','AbortError'].includes(error.name))throw new ServiceError('La IA ha tardado demasiado. Puedes reintentar.',504,'AI_TIMEOUT');
    throw new ServiceError('No se pudo conectar con la IA. Puedes reintentar.',502,'AI_NETWORK');
  }
}
export function createProvider({env=process.env,fetchImpl=fetch}={}) {
  return async function(path,body,raw=false,options={}) {
    const feature=path==='audio/transcriptions'?'listen':'coach';
    if(!['chat/completions','audio/transcriptions'].includes(path)||raw)throw new ServiceError('Operación de IA no admitida.',400,'AI_PATH');
    requireRoute(feature,env);
    return requestJson('https://api.groq.com/openai/v1/'+path,{Authorization:'Bearer '+env.GROQ_API_KEY},body,{env,fetchImpl,...options});
  };
}
export const provider=createProvider();
export function createGeminiProvider({env=process.env,fetchImpl=fetch}={}) {
  return async function(feature,body,options={}) {
    const route=requireRoute(feature,env);
    if(route.provider!=='gemini')throw new ServiceError('Ruta Gemini no admitida.',400,'AI_PATH');
    const speech=feature==='speak';
    const url='https://generativelanguage.googleapis.com/v1beta/'+(speech?'interactions':'models/'+encodeURIComponent(route.model)+':generateContent');
    return requestJson(url,{'x-goog-api-key':env.GEMINI_API_KEY},speech?{...body,model:route.model,store:false}:body,{env,fetchImpl,...options,maxBytes:speech?24000000:1000000});
  };
}
const gemini=createGeminiProvider();
export async function chat(system,user,json=false,options={}) {
  const feature=options.feature || 'coach';
  if(['photo','label'].includes(feature)||options.routingTask==='weekly')return automaticRouter24(system,user,json,options);
  const route=requireRoute(feature),deadline=options.deadline??Date.now()+75000;
  let value;
  if(route.provider==='groq') {
    if(Array.isArray(user))throw new ServiceError('Las imágenes requieren la ruta de visión Gemini.',400,'AI_PATH');
    const responseFormat=options.schema?{type:'json_schema',json_schema:{name:'vera_response',strict:true,schema:options.schema}}:{type:'json_object'};
    const data=await provider('chat/completions',{model:route.model,...(route.model.startsWith('openai/gpt-oss-')?{reasoning_effort:'low'}:{}),messages:[{role:'system',content:system},{role:'user',content:user}],max_completion_tokens:options.maxTokens||3000,...(json?{response_format:responseFormat}:{})},false,options);
    if(data?.choices?.[0]?.finish_reason!=='stop')throw new ServiceError('La respuesta de IA está incompleta. Reintenta.',502,'AI_INCOMPLETE');
    value=data.choices[0].message?.content;
  } else {
    const parts=typeof user==='string'?[{text:user}]:user.map(part=>{
      if(part.type==='text')return {text:part.text};
      const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(part.image_url?.url||'');
      if(!match)throw new ServiceError('Imagen no válida.',400,'INVALID_IMAGE');
      return {inlineData:{mimeType:match[1],data:match[2]}};
    });
    let data;
    try{data=await gemini(feature,{systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{maxOutputTokens:options.maxTokens||8192,thinkingConfig:{thinkingLevel:'LOW'},...(json?{responseMimeType:'application/json'}:{})}},{...options,deadline});}
    catch(error){
      const fallback=route.fallback;
      if(feature!=='photo'||!fallback?.configured||!fallback.on.includes(error.code)||deadline-Date.now()<1000||options.photoFallback===false)throw error;
      if(!/^[a-zA-Z0-9._/-]{1,160}$/.test(fallback.model))throw new ServiceError('El modelo de visión alternativo no es válido.',503,'AI_CONFIG');
      if(parts.filter(p=>p.inlineData).length>3)throw error;
      // One alternate inference only. Preserve the same instructions, image and
      // bounded deadline; do not retry this call even when Groq returns 503.
      const response=await provider('chat/completions',{model:fallback.model,messages:[{role:'system',content:system},{role:'user',content:user}],max_completion_tokens:Math.min(options.maxTokens||3000,4096),...(json?{response_format:{type:'json_object'}}:{})},false,{...options,deadline,attempt:1});
      if(response?.choices?.[0]?.finish_reason!=='stop')throw new ServiceError('La respuesta de visión alternativa está incompleta. Reintenta.',502,'AI_INCOMPLETE');
      value=response.choices[0].message?.content;
    }
    if(data!==undefined){
    const candidate=data?.candidates?.[0];
    if(candidate?.finishReason!=='STOP')throw new ServiceError('La respuesta de IA está incompleta o no disponible. Reintenta.',502,'AI_INCOMPLETE');
    if(!Array.isArray(candidate.content?.parts))throw new ServiceError('La respuesta de IA no tiene el formato esperado.',502,'AI_FORMAT');
    value=candidate.content.parts.filter(part=>part && !part.thought && typeof part.text==='string').map(part=>part.text).join('');
    }
  }
  if(typeof value!=='string'||!value.trim()||value.length>100000)throw new ServiceError('La respuesta de IA está vacía o incompleta. Reintenta.',502,'AI_INCOMPLETE');
  if(!json)return value;
  try {const result=JSON.parse(value);if(!result||Array.isArray(result)||typeof result!=='object')throw Error();return result;} catch {throw new ServiceError('La respuesta de IA no tiene el formato esperado.',502,'AI_FORMAT');}
}
export function speechText(value) {
  if(typeof value!=='string'||!value.trim()||value.length>3500)throw new ServiceError('Selecciona un texto de entre 1 y 3500 caracteres para leer.',400,'INVALID_SPEECH');
  return value.trim();
}
export function validateWav(data) {
  const invalid=()=>{throw new ServiceError('La voz recibida no es un audio WAV válido.',502,'AI_AUDIO');};
  if(!Buffer.isBuffer(data)||data.length<46||data.length>16000000||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WAVE'||data.readUInt32LE(4)!==data.length-8)invalid();
  let offset=12,format=false,audio=false;
  while(offset+8<=data.length){const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),start=offset+8;if(start+size>data.length)invalid();
    if(kind==='fmt '){if(format||size<16||data.readUInt16LE(start)!==1||data.readUInt16LE(start+2)!==1||data.readUInt32LE(start+4)!==24000||data.readUInt32LE(start+8)!==48000||data.readUInt16LE(start+12)!==2||data.readUInt16LE(start+14)!==16)invalid();format=true;}
    if(kind==='data'){if(audio||size<2||size%2)invalid();audio=true;}
    offset=start+size+(size%2);
  }
  if(offset!==data.length||!format||!audio)invalid();return data;
}
export async function synthesize(text,options={}) {
  text=speechText(text);
  const result=await gemini('speak',{store:false,input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:'Lee exactamente este texto en español de España, con voz clara y natural. No añadas palabras.'}]}]}],response_format:{type:'audio',mime_type:'audio/wav'},generation_config:{speech_config:[{voice:process.env.GEMINI_TTS_VOICE||'Kore'}]}},options);
  const part=(Array.isArray(result?.steps)?result.steps:[]).filter(step=>step?.type==='model_output').flatMap(step=>Array.isArray(step.content)?step.content:[]).filter(item=>item?.type==='audio').at(-1);
  if(result?.status!=='completed'||part?.mime_type!=='audio/wav'||typeof part?.data!=='string'||part.data.length>21333336||!part.data.length||!/^[A-Za-z0-9+/]+={0,2}$/.test(part.data))throw new ServiceError('La voz recibida está incompleta o no es válida.',502,'AI_AUDIO');
  const bytes=Buffer.from(part.data,'base64');if(bytes.toString('base64')!==part.data)throw new ServiceError('La voz recibida no es válida.',502,'AI_AUDIO');
  return validateWav(bytes);
}
// Availability state contains only provider/model identifiers and expiry timestamps.
// Never store prompts, pictures, credentials or user identities here.
export function routingCandidates24(feature,options={},env=process.env){
  const route=aiConfiguration(env).routes[feature];
  if(!route)throw new ServiceError('Función de IA no admitida.',400,'AI_PATH');
  return [route,...(feature==='photo'&&options.photoFallback===false?[]:route.alternatives||[])].filter(x=>x.configured&&(!x.requiresCloudConsent||options.cloudFallbackConsent===true));
}
export function requireAutomaticRoute24(feature,options={},env=process.env){
  if(!routingCandidates24(feature,options,env).length)throw new ServiceError('No hay un proveedor autorizado y configurado para esta función.',503,'AI_NOT_CONFIGURED');
}
export function createAutomaticRouter24({env=process.env,fetchImpl=fetch,now=()=>Date.now()}={}){
  const cooldown=new Map();
  return async function(system,user,json=false,options={}){
    const feature=options.routingTask==='weekly'?'weeklyWorkouts':options.feature;
    // Server-owned schema accompanies EVERY candidate, including JSON-only Workers.
    if(json&&options.schema)system+='\nCONTRATO JSON OBLIGATORIO: devuelve todos los campos requeridos, sólo los permitidos y los enums exactos. No copies este esquema como respuesta.\n'+JSON.stringify(options.schema);
    const candidates=routingCandidates24(feature,options,env);
    requireAutomaticRoute24(feature,options,env);
    const parts=typeof user==='string'?[{text:user}]:Array.isArray(user)?user.map(part=>{
      if(part.type==='text'&&typeof part.text==='string')return {text:part.text};
      const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(part.image_url?.url||'');
      if(!match||match[2].length>14000000)throw new ServiceError('Imagen no válida.',400,'INVALID_IMAGE');
      return {inlineData:{mimeType:match[1],data:match[2]}};
    }):null;
    if(!parts)throw new ServiceError('Entrada de IA no válida.',400,'AI_PATH');
    const deadline=Math.min(options.deadline||now()+75000,now()+75000);
    let last,earliest=Infinity;
    for(const route of candidates){
      const key=route.provider+':'+route.model,until=cooldown.get(key)||0;
      if(until>now()){earliest=Math.min(earliest,until);continue;}
      if(deadline-now()<1000)break;
      if(!/^[a-zA-Z0-9@._/-]{1,160}$/.test(route.model)||(route.provider==='gemini'&&route.model.includes('/')))continue;
      const images=parts.filter(p=>p.inlineData);
      if(route.provider==='cloudflare'&&images.length>1)continue;
      // Give the last Worker the remaining time for visual recognition or planning.
      const finalWorker=route.provider==='cloudflare'||(feature==='weeklyWorkouts'&&route===candidates.at(-1));
      const callOptions={env:{...env,VERA_AI_TIMEOUT_MS:finalWorker?Math.min(65000,deadline-now()):Math.min(25000,Number(env.VERA_AI_TIMEOUT_MS)||25000)},fetchImpl,deadline,attempt:1};
      try{
        let value;
        if(route.provider==='gemini'){
          const data=await requestJson('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(route.model)+':generateContent',{'x-goog-api-key':env.GEMINI_API_KEY},{systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{maxOutputTokens:options.maxTokens||5000,thinkingConfig:{thinkingLevel:'LOW'},...(json?{responseMimeType:'application/json',...(options.schema?{responseJsonSchema:options.schema}:{})}:{})}},callOptions);
          const candidate=data?.candidates?.[0];
          if(candidate?.finishReason!=='STOP')throw new ServiceError('La respuesta de IA está incompleta o no disponible.',502,'AI_INCOMPLETE');
          if(!Array.isArray(candidate.content?.parts))throw new ServiceError('Formato de respuesta no válido.',502,'AI_FORMAT');
          value=candidate.content.parts.filter(p=>p&&!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
        }else if(route.provider==='groq'){
          const responseFormat=options.schema?{type:'json_schema',json_schema:{name:'vera_response',strict:true,schema:options.schema}}:{type:'json_object'};
          const data=await requestJson('https://api.groq.com/openai/v1/chat/completions',{Authorization:'Bearer '+env.GROQ_API_KEY},{model:route.model,...(route.model.startsWith('openai/gpt-oss-')?{reasoning_effort:'low'}:{}),messages:[{role:'system',content:system},{role:'user',content:user}],max_completion_tokens:options.maxTokens||5000,...(json?{response_format:responseFormat}:{})},callOptions);
          if(data?.choices?.[0]?.finish_reason!=='stop')throw new ServiceError('La respuesta de IA está incompleta.',502,'AI_INCOMPLETE');
          value=data.choices[0].message?.content;
        }else{
          const data=await requestJson(workerUrl24(env)+(feature==='weeklyWorkouts'?'/v1/text':'/v1/food-photo'),{Authorization:'Bearer '+env.VERA_CF_WORKER_SECRET},options.cloudflareRequest?{system:options.cloudflareRequest.system,user:options.cloudflareRequest.user??user,json:true,maxTokens:options.cloudflareRequest.maxTokens}:{system,user,json,maxTokens:Math.min(options.maxTokens||5000,5000)},callOptions);
          value=data.text;
        }
        if(typeof value!=='string'||!value.trim()||value.length>100000)throw new ServiceError('Respuesta de IA vacía o incompleta.',502,'AI_INCOMPLETE');
        cooldown.delete(key);
        if(!json)return value;
        let result;try{result=JSON.parse(value);if(!result||Array.isArray(result)||typeof result!=='object')throw Error();}catch{throw new ServiceError('La respuesta de IA no tiene el formato esperado.',502,'AI_FORMAT');}
        if(route.provider==='cloudflare'&&typeof options.cloudflareRequest?.decode==='function')result=options.cloudflareRequest.decode(result);
        if(typeof options.validateCandidate==='function')options.validateCandidate(result);
        return result;
      }catch(error){
        // Only weekly domain/JSON failures may try a different authorized model.
        // Safety/truncation never use this path; needs_review is accepted when valid.
        if(feature==='weeklyWorkouts'&&typeof options.validateCandidate==='function'&&['WORKOUT_FORMAT','AI_FORMAT'].includes(error.code)){last=error;continue;}
        if(!['AI_RATE_LIMIT','AI_BUSY','AI_TIMEOUT','AI_NETWORK','AI_RESPONSE','AI_CONFIG'].includes(error.code))throw error;
        last=error;const seconds=Math.min(3600,Math.max(1,error.retryAfter||(error.code==='AI_CONFIG'?60:15)));
        cooldown.set(key,now()+seconds*1000);earliest=Math.min(earliest,now()+seconds*1000);
      }
    }
    if(last)throw last;
    if(deadline-now()<1000)throw new ServiceError('La IA ha tardado demasiado. Puedes reintentar.',504,'AI_TIMEOUT');
    if(earliest<Infinity)throw new ServiceError('Los proveedores autorizados están temporalmente ocupados. No se ha modificado tu registro.',429,'AI_RATE_LIMIT',Math.max(1,Math.ceil((earliest-now())/1000)));
    throw new ServiceError('No hay un proveedor autorizado disponible para completar esta solicitud.',503,'AI_NOT_CONFIGURED');
  };
}
const automaticRouter24=createAutomaticRouter24();

function workerUrl24(env){
  try{const url=new URL(env.VERA_CF_WORKER_URL||'');if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev')||url.username||url.password||url.port||url.search||url.hash||!['','/'].includes(url.pathname))return '';return url.origin;}catch{return '';}
}
