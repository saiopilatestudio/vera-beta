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
    if (process.env.VERA_INVITE && d.invite !== process.env.VERA_INVITE)
      throw Error("Invitación de beta incorrecta.");
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
  return { token, id: u.id };
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
  const r = await rows(
    "INSERT INTO quota VALUES(?,?,1) ON CONFLICT(uid,day) DO UPDATE SET n=n+1 RETURNING n",
    uid,
    day,
  );
  if (r[0].n > Number(process.env.VERA_DAILY_LIMIT || 30))
    throw Error("Límite diario alcanzado.");
}
