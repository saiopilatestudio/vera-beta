import { db, rows } from './storage.mjs';

await rows('CREATE TABLE IF NOT EXISTS account_state(uid TEXT, field TEXT, rev INTEGER NOT NULL, data TEXT, PRIMARY KEY(uid,field))');
const profileFields = new Set(['name','goal','criteria','likes','age','height','weight','level','days','time','eq','introduced']);
const stateFields = new Set(['plan','weeklyPlan21','autoPlan21','gym','gyms','machines','memory','expiry','supplementUnits','coachMode']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = message => {throw Object.assign(Error(message),{status:422});};
function weeklyPlan(value){
 const text=(v,max)=>typeof v==='string'&&v.length<=max;
 const date=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&Number.isFinite(+new Date(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
 if(!object(value)||!date(value.week)||!text(value.summary,4000)||!text(value.changes,4000)||!Array.isArray(value.days)||value.days.length!==7||!Array.isArray(value.reports)||value.reports.length>12||value.reports.some(r=>!object(r)||!text(r.role,100)||!text(r.text,12000)))invalid('Plan semanal no válido.');
 const start=+new Date(value.week+'T00:00:00Z');
 for(const [i,day] of value.days.entries())if(!object(day)||day.date!==new Date(start+i*86400000).toISOString().slice(0,10)||!['training','nutrition','recovery'].every(k=>text(day[k],1500))||(day.done!==undefined&&(!object(day.done)||Object.entries(day.done).some(([key,done])=>!['training','nutrition','recovery'].includes(key)||typeof done!=='boolean'))))invalid('Día del plan semanal no válido.');
 if(value.generatedAt!==undefined&&(!text(value.generatedAt,40)||!Number.isFinite(Date.parse(value.generatedAt))))invalid('Fecha del plan no válida.');
 if(value.inputSignature!==undefined&&!text(value.inputSignature,96000))invalid('Referencia del plan no válida.');
}
function validate(field, value) {
  if (typeof field !== 'string' || !(field.startsWith('profile.') ? profileFields.has(field.slice(8)) : stateFields.has(field))) invalid('Campo de perfil no admitido.');
  if (value === undefined) invalid('Valor de perfil ausente.');
  const raw = JSON.stringify(value);
  if (Buffer.byteLength(raw) > 96000 || /data:(image|audio)\//i.test(raw)) invalid('El perfil supera el límite o contiene multimedia.');
  function safe(value, depth = 0) {
    if (depth > 10) invalid('Perfil demasiado anidado.');
    if (typeof value === 'number' && !Number.isFinite(value)) invalid('Número de perfil no válido.');
    if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
      if (/^(?:__proto__|constructor|prototype|password|token|authorization|apiKey|api_key|secret)$/i.test(key)) invalid('El perfil contiene un campo privado o no admitido.');
      safe(item, depth + 1);
    }
  }
  safe(value);
  if (value !== null) {
    if(field==='weeklyPlan21')weeklyPlan(value);
    if (['plan','gym','coachMode'].includes(field) && typeof value !== 'string') invalid('Texto de perfil no válido.');
    if (['memory','machines','profile.eq'].includes(field) && !Array.isArray(value)) invalid('Lista de perfil no válida.');
    if (['weeklyPlan21','gyms','expiry','supplementUnits'].includes(field) && !object(value)) invalid('Objeto de perfil no válido.');
    if (['autoPlan21','profile.introduced'].includes(field) && typeof value !== 'boolean') invalid('Preferencia no válida.');
    if (field.startsWith('profile.') && !['profile.eq','profile.introduced'].includes(field) && !['string','number'].includes(typeof value)) invalid('Dato de perfil no válido.');
  }
  return raw;
}

// Each field has its own revision: changing weight on one device does not erase
// a name or weekly plan changed on another. Replays are idempotent.
export async function profileSync(uid, input = {}) {
  if (typeof uid !== 'string' || !uid) throw Object.assign(Error('Inicia sesión.'),{status:401});
  if (!object(input) || !Array.isArray(input.updates || []) || (input.updates || []).length > 40) invalid('Lote de perfil no válido.');
  const seen = new Set();
  const updates = (input.updates || []).map(update => {
    if (!object(update) || seen.has(update.field) || !Number.isSafeInteger(update.rev) || update.rev < 0 || update.rev >= Number.MAX_SAFE_INTEGER) invalid('Revisión de perfil no válida.');
    seen.add(update.field);
    return {...update, raw:validate(update.field, update.value)};
  });
  const statements = updates.flatMap(({field,rev,raw}) => [
    rev === 0 ? {sql:'INSERT INTO account_state VALUES(?,?,1,?) ON CONFLICT DO NOTHING RETURNING rev',args:[uid,field,raw]} :
      {sql:'UPDATE account_state SET data=?,rev=rev+1 WHERE uid=? AND field=? AND rev=? RETURNING rev',args:[raw,uid,field,rev]},
    {sql:'SELECT rev,data FROM account_state WHERE uid=? AND field=?',args:[uid,field]}
  ]);
  statements.push({sql:'SELECT field,rev,data FROM account_state WHERE uid=? ORDER BY field',args:[uid]});
  statements.push({sql:'SELECT nick FROM nicknames WHERE uid=?',args:[uid]});
  const result = await db.batch(statements,'write'), accepted=[], conflicts=[];
  updates.forEach(({field,raw},i) => {
    const changed=result[2*i].rows, row=result[2*i+1].rows[0];
    if(changed.length || row?.data===raw) accepted.push({field,rev:changed[0]?.rev || row.rev});
    else conflicts.push({field,rev:row?.rev || 0,value:JSON.parse(row?.data || 'null')});
  });
  return {accepted,conflicts,fields:result.at(-2).rows.map(row=>({field:row.field,rev:row.rev,value:JSON.parse(row.data)})),nick:result.at(-1).rows[0]?.nick || ''};
}
