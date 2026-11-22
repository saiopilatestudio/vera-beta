import { db, rows } from "./storage.mjs";
import { scrypt, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt),
  digest = (x) => createHash("sha256").update(x).digest("hex");
const attempts = new Map();
export async function account(action, d, ip) {
  if (!["/register", "/login"].includes(action) || !d || typeof d !== "object" || Array.isArray(d))
    throw Object.assign(Error("Solicitud de cuenta no válida."), {status:422});
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  const rate = attempts.get(ip) || { n: 0, until: now + 600000 };
  attempts.set(ip, rate);
  if (++rate.n > 40)
    throw Object.assign(Error("Demasiados intentos. Prueba en diez minutos."), {status:429});
  const email = String(d.email || "")
      .trim()
      .toLowerCase(),
    pw = String(d.password || "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    pw.length < 10 ||
    pw.length > 200
  )
    throw Object.assign(Error(
      "Introduce una dirección válida y una contraseña de 10 a 200 caracteres.",
    ), {status:422});
  let u = (await rows("SELECT * FROM users WHERE email=?", email))[0];
  if (action === "/register") {
    if (d.notice !== "beta-3" || d.adult !== true)
      throw Object.assign(Error("Lee el aviso y confirma la mayoría de edad."), {status:422});
    const id = randomBytes(16).toString("hex"),
      salt = randomBytes(16).toString("hex"),
      hash = (await derive(pw, salt, 64)).toString("hex");
    try {
      await db.batch(
        [
          {
            sql: "INSERT INTO users VALUES(?,?,?,?)",
            args: [id, email, salt, hash],
          },
          {sql:"INSERT INTO nicknames VALUES(?,?)",args:[id,"vera_"+id.slice(0,19)]},
          {
            sql: "INSERT INTO notices VALUES(?,?,?)",
            args: [id, "beta-3", now],
          },
        ],
        "write",
      );
    } catch (error) {
      if (String(error.code || error).includes("CONSTRAINT"))
        throw Object.assign(Error("No se pudo crear la cuenta. Prueba a iniciar sesión."), {status:409});
      throw error;
    }
    u = { id };
  } else {
    const hash = await derive(pw, u?.salt || "missing-account", 64);
    const saved = Buffer.from(u?.hash || "", "hex");
    if (!u || saved.length !== hash.length || !timingSafeEqual(hash, saved))
      throw Object.assign(Error("Credenciales incorrectas."), {status:401});
  }
  const token = randomBytes(32).toString("hex");
  await rows("DELETE FROM sessions WHERE expires<?", now);
  await rows(
    "INSERT INTO sessions VALUES(?,?,?)",
    digest(token),
    u.id,
    now + 30 * 86400000,
  );
  return { token, id: u.id, nick:(await rows("SELECT nick FROM nicknames WHERE uid=?",u.id))[0]?.nick };
}
export async function authorize(header) {
  const token = typeof header === "string" && /^Bearer ([a-f0-9]{64})$/i.exec(header)?.[1];
  if (!token) return null;
  return (
    await rows(
      "SELECT uid FROM sessions WHERE hash=? AND expires>?",
      digest(token),
      Date.now(),
    )
  )[0]?.uid;
}
export async function logout(header) {
  const token = typeof header === "string" && /^Bearer ([a-f0-9]{64})$/i.exec(header)?.[1];
  if (!token) return;
  await rows(
    "DELETE FROM sessions WHERE hash=?",
    digest(token),
  );
}
export async function consume(uid, feature = 'general') {
  if(['photo','weeklyWorkouts'].includes(feature))return consumePhoto24(uid,feature);
  const day = new Date().toISOString().slice(0, 10);
  const limit=Number(process.env.VERA_DAILY_LIMIT||30);
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw Object.assign(Error("La cuota de IA no está configurada correctamente."), {status:503});
  const result=await rows("INSERT INTO quota(uid,day,n) SELECT ?,?,1 WHERE ?>0 ON CONFLICT(uid,day) DO UPDATE SET n=n+1 WHERE n<? RETURNING n",uid,day,limit,limit);
  if(!result.length)throw Object.assign(Error("Límite diario alcanzado."),{status:429});
  return {uid,day};
}
export async function releaseQuota(reservation){
 const {uid,day}=reservation;
 if(['photo','weeklyWorkouts'].includes(reservation.feature)){
  const quotaTable=reservation.feature==='photo'?'photo_quota24':'workout_quota24',reservationTable=reservation.feature==='photo'?'photo_reservations24':'workout_reservations24';
  if(typeof reservation.id!=='string')return;
  await db.batch([
   {sql:`UPDATE ${quotaTable} SET n=n-1 WHERE uid=? AND day=? AND n>0 AND EXISTS(SELECT 1 FROM ${reservationTable} WHERE id=? AND uid=? AND day=?)`,args:[uid,day,reservation.id,uid,day]},
   {sql:`DELETE FROM ${reservationTable} WHERE id=? AND uid=? AND day=?`,args:[reservation.id,uid,day]}
  ],'write');return;
 }
 await rows("UPDATE quota SET n=n-1 WHERE uid=? AND day=? AND n>0",uid,day);
}

export async function nickname(uid,input){
 if(typeof uid!=="string"||!uid)throw Object.assign(Error("Inicia sesión."),{status:401});
 if(typeof input!=="string")throw Object.assign(Error("Usa de 3 a 24 letras, números o guiones bajos."),{status:422});
 const nick=String(input||"").trim().replace(/^@/,"");
 if(!/^[a-zA-Z0-9_]{3,24}$/.test(nick))throw Object.assign(Error("Usa de 3 a 24 letras, números o guiones bajos."),{status:422});
 try{await rows("INSERT INTO nicknames(uid,nick) VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET nick=excluded.nick",uid,nick);}
 catch(e){if(String(e).includes("UNIQUE"))throw Object.assign(Error("Este nick ya está en uso."),{status:409});throw e;}
 return {nick};
}

// Independent meal-photo allowance: conversations and automatic plans cannot exhaust it.
await db.batch([
 'CREATE TABLE IF NOT EXISTS photo_quota24(uid TEXT NOT NULL,day TEXT NOT NULL,n INTEGER NOT NULL,PRIMARY KEY(uid,day))',
 'CREATE TABLE IF NOT EXISTS photo_reservations24(id TEXT PRIMARY KEY,uid TEXT NOT NULL,day TEXT NOT NULL)',
 'CREATE INDEX IF NOT EXISTS photo_reservations24_day ON photo_reservations24(day)',
 'CREATE TABLE IF NOT EXISTS workout_quota24(uid TEXT NOT NULL,day TEXT NOT NULL,n INTEGER NOT NULL,PRIMARY KEY(uid,day))',
 'CREATE TABLE IF NOT EXISTS workout_reservations24(id TEXT PRIMARY KEY,uid TEXT NOT NULL,day TEXT NOT NULL)'
],'write');
async function consumePhoto24(uid,feature='photo'){
 const workout=feature==='weeklyWorkouts',quotaTable=workout?'workout_quota24':'photo_quota24',reservationTable=workout?'workout_reservations24':'photo_reservations24';
 if(typeof uid!=='string'||!uid)throw Object.assign(Error('Inicia sesión.'),{status:401});
 const now=new Date(),day=now.toISOString().slice(0,10),limit=Number(workout?(process.env.VERA_WORKOUT_DAILY_LIMIT??20):(process.env.VERA_PHOTO_DAILY_LIMIT??30));
 if(!Number.isSafeInteger(limit)||limit<0)throw Object.assign(Error('La cuota de fotos no está configurada correctamente.'),{status:503});
 const reset=Date.parse(day+'T00:00:00Z')+86400000,retryAfter=Math.max(1,Math.ceil((reset-Date.now())/1000)),id=randomBytes(16).toString('hex');
 const results=await db.batch([
  {sql:`INSERT INTO ${quotaTable}(uid,day,n) SELECT ?,?,1 WHERE ?>0 ON CONFLICT(uid,day) DO UPDATE SET n=n+1 WHERE n<? RETURNING n`,args:[uid,day,limit,limit]},
  {sql:`INSERT INTO ${reservationTable}(id,uid,day) SELECT ?,?,? WHERE changes()>0 RETURNING id`,args:[id,uid,day]}
 ],'write');
 if(!results[0].rows.length)throw Object.assign(Error(workout?'Has alcanzado el límite diario de '+limit+' generaciones nuevas de entrenamientos. El plan guardado sigue disponible. La cuota se renueva a las 00:00 UTC.':'Has alcanzado el límite diario de '+limit+' análisis nuevos de comida de VERA. Las fotos ya analizadas con la misma aclaración y el registro manual siguen disponibles. La cuota se renueva a las 00:00 UTC.'),{status:429,code:workout?'QUOTA_DAILY_WORKOUT':'QUOTA_DAILY_PHOTO',retryAfter,resetAt:new Date(reset).toISOString(),limit});
 if(!results[1].rows.length)throw Object.assign(Error('No se pudo reservar el análisis. Reintenta.'),{status:503});
 return {uid,day,id,feature};
}
