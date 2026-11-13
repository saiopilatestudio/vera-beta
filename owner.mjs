import { readFile } from "node:fs/promises";
import { scrypt, createHash, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";
const owner = JSON.parse(
  await readFile(new URL("./owner.json", import.meta.url)),
);
const derive = promisify(scrypt),
  sessions = new Map(),
  attempts = new Map(),
  digest = (x) => createHash("sha256").update(x).digest("hex");
export async function ownerLogin(d, ip) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.end < now) attempts.delete(k);
  const rec = attempts.get(ip) || { end: now + 600000, n: 0 };
  attempts.set(ip, rec);
  if (++rec.n > 15) throw Error("Demasiados intentos.");
  const pw = String(d.password || "").slice(0, 200);
  const ok = timingSafeEqual(
    await derive(pw, owner.salt, 64),
    Buffer.from(owner.hash, "hex"),
  );
  if (!ok || String(d.email || "").toLowerCase() !== owner.email)
    throw Error("Credenciales incorrectas.");
  const token = randomBytes(32).toString("hex");
  for (const [k, t] of sessions) if (t < now) sessions.delete(k);
  sessions.set(digest(token), now + 3600000);
  return { token };
}
export const ownerAccess = (header) =>
  (sessions.get(digest((header || "").replace(/^Bearer /, ""))) || 0) >
  Date.now();
export const ownerLogout = (header) =>
  sessions.delete(digest((header || "").replace(/^Bearer /, "")));
