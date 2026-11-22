// Server-only, fixed routing: Groq + Gemini. No automatic provider substitution.
export class ServiceError extends Error {
  constructor(message, status = 502, code = 'AI_UNAVAILABLE', retryAfter) { super(message); Object.assign(this, { status, code, retryAfter }); }
}
export function aiConfiguration(env = process.env) {
  const route = (provider, model) => ({provider, model, configured: Boolean(env[provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY']?.trim())});
  const groq = route('groq', env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b');
  const vision = route('gemini', env.GEMINI_VISION_MODEL || 'gemini-4-hydrogen');
  return {routingVersion:2, providers:['groq','gemini'], execution:'cloud-only', localInference:false, verification:'configuration-only', speechOutput:'remote', routes:{
    coach:{...groq}, coach_deep:route('gemini',env.GEMINI_DEEP_MODEL || 'gemini-4-hydrogen'), intro:{...groq},
    photo:{...vision}, machine:{...vision}, label:{...vision},
    listen:route('groq',env.GROQ_SPEECH_MODEL || 'whisper-large-v3-turbo'),
    speak:route('gemini',env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts'),
  }};
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
  const feature=options.feature || 'coach', route=requireRoute(feature);
  let value;
  if(route.provider==='groq') {
    if(Array.isArray(user))throw new ServiceError('Las imágenes requieren la ruta de visión Gemini.',400,'AI_PATH');
    const data=await provider('chat/completions',{model:route.model,messages:[{role:'system',content:system},{role:'user',content:user}],max_completion_tokens:3000,...(json?{response_format:{type:'json_object'}}:{})},false,options);
    if(data?.choices?.[0]?.finish_reason!=='stop')throw new ServiceError('La respuesta de IA está incompleta. Reintenta.',502,'AI_INCOMPLETE');
    value=data.choices[0].message?.content;
  } else {
    const parts=typeof user==='string'?[{text:user}]:user.map(part=>{
      if(part.type==='text')return {text:part.text};
      const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(part.image_url?.url||'');
      if(!match)throw new ServiceError('Imagen no válida.',400,'INVALID_IMAGE');
      return {inlineData:{mimeType:match[1],data:match[2]}};
    });
    const data=await gemini(feature,{systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{maxOutputTokens:8192,thinkingConfig:{thinkingLevel:'LOW'},...(json?{responseMimeType:'application/json'}:{})}},options);
    const candidate=data?.candidates?.[0];
    if(candidate?.finishReason!=='STOP')throw new ServiceError('La respuesta de IA está incompleta o no disponible. Reintenta.',502,'AI_INCOMPLETE');
    if(!Array.isArray(candidate.content?.parts))throw new ServiceError('La respuesta de IA no tiene el formato esperado.',502,'AI_FORMAT');
    value=candidate.content.parts.filter(part=>part && !part.thought && typeof part.text==='string').map(part=>part.text).join('');
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
