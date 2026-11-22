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
export async function consume(uid) {
  const day = new Date().toISOString().slice(0, 10);
  const limit=Number(process.env.VERA_DAILY_LIMIT||30);
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw Object.assign(Error("La cuota de IA no está configurada correctamente."), {status:503});
  const result=await rows("INSERT INTO quota(uid,day,n) SELECT ?,?,1 WHERE ?>0 ON CONFLICT(uid,day) DO UPDATE SET n=n+1 WHERE n<? RETURNING n",uid,day,limit,limit);
  if(!result.length)throw Object.assign(Error("Límite diario alcanzado."),{status:429});
  return {uid,day};
}
export async function releaseQuota({uid,day}){
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
