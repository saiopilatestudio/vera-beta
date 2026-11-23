import { db, rows } from './storage.mjs';

await rows('CREATE TABLE IF NOT EXISTS diary_sync(uid TEXT, id TEXT, rev INTEGER NOT NULL, data TEXT, PRIMARY KEY(uid,id))');

await rows('CREATE TABLE IF NOT EXISTS sleep_exclusions246(uid TEXT,id TEXT,cuts TEXT NOT NULL,PRIMARY KEY(uid,id))');

function projectSleep(record,cuts){
 if(!record||!cuts.length)return record;
 if(record.kind!=='Sueño'||record.source!=='health')return null;
 if(!record.sleepSpans?.length)return cuts.some(c=>c.value===record.value)?null:record;
 let spans=record.sleepSpans;
 for(const cut of cuts)for(const [a,b] of cut.spans||[]){
  spans=spans.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[[x,Math.min(y,a)],[Math.max(x,b),y]].filter(([i,j])=>i<j));
 }
 return spans.length?{...record,sleepSpans:spans,value:spans.reduce((n,[a,b])=>n+b-a,0)/3600000}:null;
}

const kinds = new Set(['Entrenamiento', 'Comida', 'Bebida', 'Agua', 'Suplemento',
  'Peso en ayunas', 'Otro pesaje', 'Cintura', 'Sueño', 'Pasos', 'Cardio', 'Posing', 'Sensaciones']);
const invalid = message => { throw Object.assign(new Error(message), { status: 422 }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function numeric(value, max = Number.MAX_SAFE_INTEGER, integer = false) {
  // Older clients store HTML input values as strings. Preserve that contract.
  if (value === null || value === undefined || value === '') return true;
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max && (!integer || Number.isSafeInteger(n));
}

export function validateRecord(id, record) {
  if (record === null) return null;
  if (!object(record) || record.id !== id || !kinds.has(record.kind))
    invalid('Entrada no admitida.');
  if(record.source==='health'){
    const healthKinds={steps:'Pasos',sleep:'Sueño',workouts:'Entrenamiento',weight:'Otro pesaje',nutrition:'Comida',hydration:'Agua'};
    const cardio=record.healthType==='workouts'&&record.kind==='Cardio'&&['cycling','running','walking','swimming'].includes(record.sport);
    if(!Object.hasOwn(healthKinds,record.healthType)||(!cardio&&healthKinds[record.healthType]!==record.kind)||record.healthKey!==id||!id.startsWith('health_'+record.healthType+'_'))invalid('Identidad o tipo de salud no válido.');
  }
  if (typeof record.date !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(record.date)) invalid('Fecha no válida.');
  const date = new Date(record.date + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.date) invalid('Fecha no válida.');
  const maxValue = record.kind === 'Sueño' ? 24 : Number.MAX_SAFE_INTEGER;
  if (!numeric(record.value, maxValue, record.kind === 'Pasos') ||
      !['kg', 'enteredKg', 'protein', 'carbs', 'fat', 'minutes'].every(key => numeric(record[key])) ||
      !numeric(record.rir, 10) || !numeric(record.rpe, 10)) invalid('Cantidad o unidad no válida.');
  if (record.kind === 'Cardio') {
    const metrics = ['durationSeconds','distanceMeters','avgSpeedKmh','energyKcal','paceSecondsPer100m','paceSecondsPerKm'];
    if (metrics.some(key => !numeric(record[key]))) invalid('Métrica deportiva no válida.');
    if (record.laps !== undefined && (!Array.isArray(record.laps) || record.laps.length > 300 ||
        record.laps.some(lap => !object(lap) || !Number.isFinite(lap.distanceMeters) || lap.distanceMeters < 0 ||
          !Number.isFinite(lap.durationSeconds) || lap.durationSeconds <= 0))) invalid('Parciales deportivos no válidos.');
  }
  if (record.reps !== undefined && (!Array.isArray(record.reps) || record.reps.length > 100 ||
      record.reps.some(n => !Number.isSafeInteger(n) || n < 1 || n > 300))) invalid('Repeticiones no válidas.');
  if(record.nutrients!==undefined){
    const keys=new Set(['fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug']);
    if(!object(record.nutrients)||Object.entries(record.nutrients).some(([key,value])=>!keys.has(key)||!numeric(value)))invalid('Micronutriente o cantidad no válida.');
  }
  if (record.kind === 'Sueño') {
    if(record.sleepSpans!==undefined){
      let previous=-Infinity;
      if(!Array.isArray(record.sleepSpans)||record.sleepSpans.length>1000||record.sleepSpans.some(pair=>{
        if(!Array.isArray(pair)||pair.length!==2||!pair.every(Number.isFinite)||pair[0]<0||pair[1]<=pair[0]||pair[1]-pair[0]>86400000||pair[0]<previous)return true;
        previous=pair[1];return false;
      }))invalid('Intervalos de sueño no válidos.');
      if(record.sleepSpans.reduce((sum,[a,b])=>sum+b-a,0)>86400000)invalid('Duración de sueño no válida.');
    }
    if (!numeric(record.minutes, 1440)) invalid('Duración de sueño no válida.');
    if (record.start !== undefined || record.end !== undefined) {
      if (!Number.isFinite(record.start) || !Number.isFinite(record.end) ||
          record.end <= record.start || record.end - record.start > 86400000 ||
          (record.value != null && Number(record.value) * 3600000 > record.end - record.start + 1))
        invalid('Intervalo de sueño no válido.');
    }
  }
  if(record.mixingLiquid!==undefined){
    const liquid=record.mixingLiquid;
    const fields=new Set(['kcal','protein','carbs','fat','fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug']);
    if(record.kind!=='Suplemento'||!object(liquid)||!['water','milk','plant'].includes(liquid.type)||typeof liquid.ml!=='number'||!Number.isFinite(liquid.ml)||liquid.ml<=0||liquid.ml>10000||typeof liquid.name!=='string'||liquid.name.length>200||typeof liquid.source!=='string'||liquid.source.length>300||!object(liquid.per100ml)||Object.entries(liquid.per100ml).some(([k,v])=>!fields.has(k)||typeof v!=='number'||!Number.isFinite(v)||v<0||v>100000))invalid('Líquido del suplemento no válido.');
  }
  const value = JSON.stringify(record);
  if (Buffer.byteLength(value) > 32000 || /data:(image|audio)\//i.test(value)) invalid('Entrada demasiado grande o con contenido multimedia.');
  return value;
}

export async function journal(uid, input = {}) {
  if (typeof uid !== 'string' || !uid) throw Object.assign(new Error('Inicia sesión.'), { status: 401 });
  if (!object(input)) invalid('Lote no válido.');
  const { updates = [], cursor = '' } = input;
  if (!Array.isArray(updates) || updates.length > 40 || typeof cursor !== 'string' ||
      (cursor !== '' && !/^[A-Za-z0-9_-]{3,100}$/.test(cursor))) invalid('Lote no válido.');
  const seen = new Set();
  // Validate the entire request before any write, including duplicate IDs.
  const prepared = updates.map(update => {
    if (!object(update)) invalid('Revisión no válida.');
    const { id, rev, record } = update;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{3,100}$/.test(id) || seen.has(id) ||
        !Number.isSafeInteger(rev) || rev < 0 || rev >= Number.MAX_SAFE_INTEGER) invalid('Revisión no válida.');
    seen.add(id);
    return { id, rev, value: validateRecord(id, record) };
  });
  if(input.suppressSleep){
    const {id,rev}=input.suppressSleep;
    if(updates.length||typeof id!=='string'||id.length>100||!Number.isSafeInteger(rev)||rev<1)invalid('Descanso no válido.');
    const [row]=await rows('SELECT rev,data FROM diary_sync WHERE uid=? AND id=?',uid,id);
    const record=JSON.parse(row?.data||'null');
    if(row?.rev!==rev||record?.kind!=='Sueño')throw Object.assign(new Error('El descanso cambió. Actualiza y vuelve a elegirlo.'),{status:409});
    const cut=JSON.stringify({value:record.value,spans:record.sleepSpans||[]});
    const result=await db.batch([
      {sql:"INSERT INTO sleep_exclusions246 SELECT uid,id,json_array(json(?)) FROM diary_sync WHERE uid=? AND id=? AND rev=? ON CONFLICT(uid,id) DO UPDATE SET cuts=json_insert(cuts,'$[#]',json(?))",args:[cut,uid,id,rev,cut]},
      {sql:'UPDATE diary_sync SET data=NULL,rev=rev+1 WHERE uid=? AND id=? AND rev=? RETURNING rev',args:[uid,id,rev]},
      {sql:'SELECT cuts FROM sleep_exclusions246 WHERE uid=? AND id=?',args:[uid,id]}
    ],'write');
    if(!result[1].rows.length)throw Object.assign(new Error('El descanso cambió.'),{status:409});
    return {rev:rev+1,cuts:JSON.parse(result[2].rows[0].cuts)};
  }
  if(prepared.length){
    const marked=await rows('SELECT id,cuts FROM sleep_exclusions246 WHERE uid=? AND id IN ('+prepared.map(()=>'?').join(',')+')',uid,...prepared.map(x=>x.id));
    for(const m of marked){const item=prepared.find(x=>x.id===m.id);const projected=projectSleep(JSON.parse(item.value),JSON.parse(m.cuts));if(JSON.stringify(projected)!==JSON.stringify(JSON.parse(item.value)))item.filtered=true;item.value=projected?JSON.stringify(projected):null;}
  }
  // One transactional batch avoids partial commits and extra network trips. It
  // also avoids holding a local SQLite write lock across JS await boundaries.
  const statements = prepared.flatMap(({ id, rev, value }) => [
    rev === 0
      ? { sql: 'INSERT INTO diary_sync VALUES(?,?,1,?) ON CONFLICT DO NOTHING RETURNING rev', args: [uid, id, value] }
      : { sql: 'UPDATE diary_sync SET data=?,rev=rev+1 WHERE uid=? AND id=? AND rev=? RETURNING rev', args: [value, uid, id, rev] },
    { sql: 'SELECT rev,data FROM diary_sync WHERE uid=? AND id=?', args: [uid, id] }
  ]);
  statements.push({ sql: 'SELECT d.id,d.rev,d.data,e.cuts FROM diary_sync d LEFT JOIN sleep_exclusions246 e USING(uid,id) WHERE d.uid=? AND d.id>? ORDER BY d.id LIMIT 51', args: [uid, cursor] });
  const results = await db.batch(statements, 'write');
  const accepted = [], conflicts = [];
  for (const [i, { id, value }] of prepared.entries()) {
    const changed = results[i * 2].rows;
    const [r] = results[i * 2 + 1].rows;
    if(prepared[i].filtered)conflicts.push({id,rev:r.rev,record:JSON.parse(r.data)});
    else if (changed.length) accepted.push({ id, rev: changed[0].rev });
    else if (r && r.data === value) accepted.push({ id, rev: r.rev });
    else conflicts.push({ id, rev: r?.rev || 0, record: JSON.parse(r?.data || 'null') });
  }
  const page = results.at(-1).rows;
  return { accepted, conflicts,
    records: page.slice(0, 50).map(r => ({ id: r.id, rev: r.rev, record: JSON.parse(r.data),...(r.cuts?{sleepCuts:JSON.parse(r.cuts)}:{}) })),
    next: page.length > 50 ? page[49].id : null };
}
