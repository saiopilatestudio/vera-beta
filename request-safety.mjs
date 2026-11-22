import { ServiceError } from './ai-provider.mjs';
export function readObject(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw new ServiceError('El cuerpo de la solicitud no es JSON válido.', 400, 'INVALID_JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ServiceError('La solicitud debe ser un objeto JSON.', 400, 'INVALID_BODY');
  return value;
}
export function validateImage(value) {
  if (typeof value !== 'string' || value.length > 9e6 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new ServiceError('Selecciona una foto JPG, PNG o WebP válida (máximo 6 MB).', 400, 'INVALID_IMAGE');
  const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  const mime = value.slice(5, value.indexOf(';'));
  const valid = mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid || bytes.length > 6e6) throw new ServiceError('La imagen no coincide con su formato o supera 6 MB.', 400, 'INVALID_IMAGE');
}
export function validateAudio(d) {
  if (typeof d.data !== 'string' || d.data.length > 10e6 || !/^[A-Za-z0-9+/]+={0,2}$/.test(d.data) || !/^audio\/(webm|mp4|ogg|wav|mpeg)(;.*)?$/.test(d.mime || '')) throw new ServiceError('Selecciona una grabación válida (máximo 7,5 MB).', 400, 'INVALID_AUDIO');
}
// The client may supply relevant context, but never arbitrary envelope fields or credentials.
export function cleanContext(value, depth = 0) {
  const blocked = /^(password|token|authorization|apiKey|api_key|secret|email|uid|userId)$/i;
  if (depth > 6) return null;
  if (typeof value === 'string') return value.slice(0, 4000);
  if (Array.isArray(value)) return value.slice(-120).map(x => cleanContext(x, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.test(key)).slice(0,80).map(([key,v]) => [key,cleanContext(v,depth+1)]));
  return value;
}
export function coachInput(d) {
  if (typeof d.question !== 'string' || !d.question.trim() || d.question.length > 8000) throw new ServiceError('Escribe una consulta de hasta 8000 caracteres.', 400, 'INVALID_QUESTION');
  if (d.mode != null && !["standard", "deep"].includes(d.mode)) throw new ServiceError("Selecciona el modo estándar o profundo.", 400, "INVALID_MODE");
  const result = { question: d.question, mode: d.mode || "standard" };
  for (const key of ['profile','memory','logs','gyms','gym','equipment','machines','recovery','nutritionCoverage','nutritionSummary21','contextCoverage','currentPlan','history','plan','turns','date','today','timezone','context']) if (Object.hasOwn(d,key)) result[key] = cleanContext(d[key]);
  if (Buffer.byteLength(JSON.stringify(result)) > 100000) throw new ServiceError('El contexto es demasiado grande. Reduce los registros seleccionados.', 413, 'CONTEXT_TOO_LARGE');
  return result;
}
export function validateCoachResult(result) {
  if (!result || typeof result !== 'object' || typeof result.answer !== 'string' || !result.answer.trim() || result.answer.length > 30000) throw new ServiceError('Respuesta incompleta del equipo.', 502, 'AI_FORMAT');
  for (const field of ['plan','memory']) if (result[field] != null && typeof result[field] !== 'string') throw new ServiceError('Respuesta de IA no válida.', 502, 'AI_FORMAT');
  if (result.entries != null && (!Array.isArray(result.entries) || result.entries.length > 40 || result.entries.some(x => !x || typeof x !== 'object' || typeof x.kind !== 'string' || typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || (x.value != null && (!Number.isFinite(x.value) || x.value < 0)) || (x.note != null && typeof x.note !== 'string')))) throw new ServiceError('La IA ha propuesto registros no válidos. Revisa la consulta.', 502, 'AI_ENTRIES');
  const kinds = new Set(['Entrenamiento','Comida','Bebida','Agua','Suplemento','Peso en ayunas','Otro pesaje','Cintura','Sueño','Pasos','Cardio','Posing','Sensaciones']);
  for (const entry of result.entries || []) {
    const date = new Date(entry.date + 'T00:00:00Z');
    if (!kinds.has(entry.kind) || !Number.isFinite(+date) || date.toISOString().slice(0,10) !== entry.date || +date > Date.now() + 86400000 || (entry.kind === 'Sueño' && entry.value > 24) || (entry.kind === 'Pasos' && entry.value != null && !Number.isSafeInteger(entry.value)) || (entry.note?.length || 0) > 8000) throw new ServiceError('La IA ha propuesto registros no válidos. Revisa la consulta.', 502, 'AI_ENTRIES');
  }
  const entries=(result.entries||[]).map(e=>{
    const out={kind:e.kind,date:e.date,value:e.value??null,note:e.note||''};
    const numeric=(key,max,target=out,source=e)=>{if(source[key]!=null){if(!Number.isFinite(source[key])||source[key]<0||source[key]>max)throw new ServiceError('Valor extraído fuera de rango. Revisa los datos.',502,'AI_ENTRIES');target[key]=source[key];}};
    for(const key of ['protein','carbs','fat'])numeric(key,3000);
    if(e.nutrients!=null){if(typeof e.nutrients!=='object'||Array.isArray(e.nutrients))throw new ServiceError('Nutrientes no válidos.',502,'AI_ENTRIES');out.nutrients={};for(const key of ['fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug'])numeric(key,100000,out.nutrients,e.nutrients);}
    if(e.kind==='Entrenamiento'&&e.exercise!=null){
      if(typeof e.exercise!=='string'||!e.exercise.trim()||e.exercise.length>100)throw new ServiceError('Ejercicio no válido.',502,'AI_ENTRIES');out.exercise=e.exercise;
      if(e.reps!=null){if(!Array.isArray(e.reps)||!e.reps.length||e.reps.length>100||e.reps.some(r=>!Number.isInteger(r)||r<1||r>300))throw new ServiceError('Series no válidas.',502,'AI_ENTRIES');out.reps=e.reps;}
      numeric('kg',2000);numeric('rir',10);out.loadMode='total';out.loadSchema=2;if(out.kg!=null)out.enteredKg=out.kg;
    }
    return out;
  });
  return { answer: result.answer, plan: result.plan || '', memory: result.memory || '', entries };
}
export function validatePhotoResult(result) {
  const invalid = () => { throw new ServiceError('No se ha podido estimar el plato de forma válida. Añade otra foto o indica la ración.', 502, 'AI_PHOTO'); };
  if (!result || typeof result !== 'object' || !Number.isFinite(result.min) || !Number.isFinite(result.max) || result.min < 0 || result.max < result.min || result.max > 30000) invalid();
  const output = { min: result.min, max: result.max };
  for (const key of ['description','assumptions','question']) {
    if (result[key] != null && (typeof result[key] !== 'string' || result[key].length > 8000)) invalid();
    output[key] = result[key] || '';
  }
  if (result.ingredients != null && (!Array.isArray(result.ingredients) || result.ingredients.length > 40)) invalid();
  output.ingredients = (result.ingredients || []).map(item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 250 || !Number.isFinite(item.grams) || item.grams <= 0 || item.grams > 10000) invalid();
    const ingredient = { name: item.name, grams: item.grams };
    for (const key of ['kcal','protein','carbs','fat']) {
      const value = item[key];
      if (value != null && (!Number.isFinite(value) || value < 0 || value > (key === 'kcal' ? 90000 : item.grams))) invalid();
      ingredient[key] = value ?? null;
    }
    if (['protein','carbs','fat'].every(key=>ingredient[key]!=null) && ingredient.protein + ingredient.carbs + ingredient.fat > item.grams * 1.05) invalid();
    return ingredient;
  });
  return output;
}
export function validateTranscript(result) {
  if (!result || typeof result.text !== 'string' || !result.text.trim() || result.text.length > 20000) throw new ServiceError('No se ha podido transcribir la grabación. Inténtalo de nuevo.', 502, 'AI_TRANSCRIPT');
  return { text: result.text.trim() };
}
export function introInput(d) {
  const text = d.text ?? d.message;
  if (typeof text !== 'string' || !text.trim() || text.length > 8000) throw new ServiceError('Escribe una presentación de hasta 8000 caracteres.', 400, 'INVALID_INTRO');
  return { text, profile: cleanContext(d.profile || {}) };
}
export function validateIntroResult(result) {
  if (!result || typeof result.reply !== 'string' || !result.reply.trim() || !result.profile || typeof result.profile !== 'object' || Array.isArray(result.profile)) throw new ServiceError('La presentación de IA está incompleta.', 502, 'AI_FORMAT');
  const profile = {};
  for (const key of ['name','goal','criteria','likes','age','height','weight']) {
    const value = result.profile[key];
    if (value != null && typeof value !== 'string' && !(Number.isFinite(value) && ['age','height','weight'].includes(key))) throw new ServiceError('La presentación de IA no tiene un formato válido.', 502, 'AI_FORMAT');
    profile[key] = typeof value === 'string' ? value.slice(0,2000) : value ?? '';
  }
  return { reply: result.reply.slice(0,8000), profile };
}
