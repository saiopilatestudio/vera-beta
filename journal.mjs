import { db, rows } from './storage.mjs';

await rows('CREATE TABLE IF NOT EXISTS diary_sync(uid TEXT, id TEXT, rev INTEGER NOT NULL, data TEXT, PRIMARY KEY(uid,id))');

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
    const healthKinds={steps:'Pasos',sleep:'Sueño',workouts:'Entrenamiento',weight:'Otro pesaje',nutrition:'Comida'};
    if(!Object.hasOwn(healthKinds,record.healthType)||healthKinds[record.healthType]!==record.kind||record.healthKey!==id||!id.startsWith('health_'+record.healthType+'_'))invalid('Identidad o tipo de salud no válido.');
  }
  if (typeof record.date !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(record.date)) invalid('Fecha no válida.');
  const date = new Date(record.date + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.date) invalid('Fecha no válida.');
  const maxValue = record.kind === 'Sueño' ? 24 : Number.MAX_SAFE_INTEGER;
  if (!numeric(record.value, maxValue, record.kind === 'Pasos') ||
      !['kg', 'enteredKg', 'protein', 'carbs', 'fat', 'minutes'].every(key => numeric(record[key])) ||
      !numeric(record.rir, 10) || !numeric(record.rpe, 10)) invalid('Cantidad o unidad no válida.');
  if (record.reps !== undefined && (!Array.isArray(record.reps) || record.reps.length > 100 ||
      record.reps.some(n => !Number.isSafeInteger(n) || n < 1 || n > 300))) invalid('Repeticiones no válidas.');
  if(record.nutrients!==undefined){
    const keys=new Set(['fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug']);
    if(!object(record.nutrients)||Object.entries(record.nutrients).some(([key,value])=>!keys.has(key)||!numeric(value)))invalid('Micronutriente o cantidad no válida.');
  }
  if (record.kind === 'Sueño') {
    if (!numeric(record.minutes, 1440)) invalid('Duración de sueño no válida.');
    if (record.start !== undefined || record.end !== undefined) {
      if (!Number.isFinite(record.start) || !Number.isFinite(record.end) ||
          record.end <= record.start || record.end - record.start > 86400000 ||
          (record.value != null && Number(record.value) * 3600000 > record.end - record.start + 1))
        invalid('Intervalo de sueño no válido.');
    }
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
  // One transactional batch avoids partial commits and extra network trips. It
  // also avoids holding a local SQLite write lock across JS await boundaries.
  const statements = prepared.flatMap(({ id, rev, value }) => [
    rev === 0
      ? { sql: 'INSERT INTO diary_sync VALUES(?,?,1,?) ON CONFLICT DO NOTHING RETURNING rev', args: [uid, id, value] }
      : { sql: 'UPDATE diary_sync SET data=?,rev=rev+1 WHERE uid=? AND id=? AND rev=? RETURNING rev', args: [value, uid, id, rev] },
    { sql: 'SELECT rev,data FROM diary_sync WHERE uid=? AND id=?', args: [uid, id] }
  ]);
  statements.push({ sql: 'SELECT id,rev,data FROM diary_sync WHERE uid=? AND id>? ORDER BY id LIMIT 51', args: [uid, cursor] });
  const results = await db.batch(statements, 'write');
  const accepted = [], conflicts = [];
  for (const [i, { id, value }] of prepared.entries()) {
    const changed = results[i * 2].rows;
    const [r] = results[i * 2 + 1].rows;
    if (changed.length) accepted.push({ id, rev: changed[0].rev });
    else if (r && r.data === value) accepted.push({ id, rev: r.rev });
    else conflicts.push({ id, rev: r?.rev || 0, record: JSON.parse(r?.data || 'null') });
  }
  const page = results.at(-1).rows;
  return { accepted, conflicts,
    records: page.slice(0, 50).map(r => ({ id: r.id, rev: r.rev, record: JSON.parse(r.data) })),
    next: page.length > 50 ? page[49].id : null };
}
