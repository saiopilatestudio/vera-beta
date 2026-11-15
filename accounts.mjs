import { db, rows } from "./storage.mjs";
import { scrypt, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt),
  digest = (x) => createHash("sha256").update(x).digest("hex");
const attempts = new Map();
export async function account(action, d, ip) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  const rate = attempts.get(ip) || { n: 0, until: now + 600000 };
  attempts.set(ip, rate);
  if (++rate.n > 40)
    throw Error("Demasiados intentos. Prueba en diez minutos.");
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
    throw Error(
      "Introduce una dirección válida y una contraseña de 10 a 200 caracteres.",
    );
  let u = (await rows("SELECT * FROM users WHERE email=?", email))[0];
  if (action === "/register") {
    if (d.notice !== "beta-3" || d.adult !== true)
      throw Error("Lee el aviso y confirma la mayoría de edad.");
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
    } catch {
      throw Error("No se pudo crear la cuenta. Prueba a iniciar sesión.");
    }
    u = { id };
  } else {
    const hash = await derive(pw, u?.salt || "missing-account", 64);
    if (!u || !timingSafeEqual(hash, Buffer.from(u.hash, "hex")))
      throw Error("Credenciales incorrectas.");
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
  if (!header) return null;
  return (
    await rows(
      "SELECT uid FROM sessions WHERE hash=? AND expires>?",
      digest(header.replace(/^Bearer /, "")),
      Date.now(),
    )
  )[0]?.uid;
}
export async function logout(header) {
  await rows(
    "DELETE FROM sessions WHERE hash=?",
    digest(header.replace(/^Bearer /, "")),
  );
}
export async function consume(uid) {
  const day = new Date().toISOString().slice(0, 10);
  const limit=Number(process.env.VERA_DAILY_LIMIT||30);
  const result=await rows("INSERT INTO quota(uid,day,n) SELECT ?,?,1 WHERE ?>0 ON CONFLICT(uid,day) DO UPDATE SET n=n+1 WHERE n<? RETURNING n",uid,day,limit,limit);
  if(!result.length)throw Object.assign(Error("Límite diario alcanzado."),{status:429});
  return {uid,day};
}
export async function releaseQuota({uid,day}){
 await rows("UPDATE quota SET n=n-1 WHERE uid=? AND day=? AND n>0",uid,day);
}

export async function nickname(uid,input){
 const nick=String(input||"").trim().replace(/^@/,"");
 if(!/^[a-zA-Z0-9_]{3,24}$/.test(nick))throw Error("Usa de 3 a 24 letras, números o guiones bajos.");
 try{await rows("INSERT INTO nicknames(uid,nick) VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET nick=excluded.nick",uid,nick);}
 catch(e){if(String(e).includes("UNIQUE"))throw Error("Este nick ya está en uso.");throw e;}
 return {nick};
}
