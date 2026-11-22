import { createHash, timingSafeEqual, randomBytes, scrypt } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
// Legacy credential files are disabled by default. A historical repository may
// have exposed their password hashes; environment credentials take precedence.
const oldOwner=process.env.VERA_ALLOW_LEGACY_OWNER_FILE==="true"
 ? await readFile(new URL("./owner.json",import.meta.url),"utf8").then(JSON.parse).catch(e=>{if(e.code==="ENOENT")return null;throw e;})
 : null;
const hash=x=>createHash("sha256").update(x).digest(), sessions=new Map(), attempts=new Map();
export async function ownerLogin(d,ip){
 if(!d||typeof d!=="object"||Array.isArray(d))throw Object.assign(Error("Credenciales incorrectas."),{status:401});
 const now=Date.now();
 for(const [key,a] of attempts)if(a.until<=now)attempts.delete(key);
 for(const [key,s] of sessions)if(s.until<=now)sessions.delete(key);
 const counter=attempts.get(ip)||{n:0,until:now+600000};attempts.set(ip,counter);
 if(++counter.n>15)throw Object.assign(Error("Demasiados intentos."),{status:429});
 const email=String(d.email||"").trim().toLowerCase(), password=String(d.password||"");
 if(email.length>254||password.length>200)throw Object.assign(Error("Credenciales incorrectas."),{status:401});
 let role=null;
 for(const [prefix,name] of [["OWNER","propietario"],["EDITOR","editor"],["ANALYST","analista"]]){
   const user=process.env["VERA_"+prefix+"_EMAIL"],key=process.env["VERA_"+prefix+"_PASSWORD"];
   if(key?.length>=16&&user?.toLowerCase()===email&&timingSafeEqual(hash(key),hash(password)))role=name;
 }
 if(!role&&oldOwner&&oldOwner.email===email&&/^[a-f0-9]{128}$/i.test(oldOwner.hash||"")&&typeof oldOwner.salt==="string"&&timingSafeEqual(await promisify(scrypt)(password,oldOwner.salt,64),Buffer.from(oldOwner.hash,"hex")))role="propietario";
 if(!role)throw Object.assign(Error("Credenciales incorrectas."),{status:401});
 const token=randomBytes(32).toString("hex"),csrf=randomBytes(24).toString("hex");
 sessions.set(hash(token).toString("hex"),{role,csrf,until:now+1800000,actor:email});
 return {token,role,csrf};
}
export function ownerSession(req){
 const key=/^Bearer (\w+)$/i.exec(req.headers.authorization||"")?.[1], cookie=/(?:^|; *)vera_admin=(\w+)/.exec(req.headers.cookie||"")?.[1];
 const id=hash(key||cookie||"").toString("hex"),s=sessions.get(id);
 if(!s||s.until<=Date.now()||(!key&&req.headers["x-vera-csrf"]!==s.csrf))return null;
 return {...s,id};
}
export function ownerCookie(req,token){return "vera_admin="+token+"; HttpOnly; SameSite=Strict; Path=/admin; Max-Age="+(token?1800:0)+(!process.env.RENDER&&/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||"")?"":"; Secure");}
export function ownerLogout(session){sessions.delete(session?.id);}
export function allowed(role,path){return role==="propietario"||(["analista","editor"].includes(role)&&["/admin/summary","/admin/end"].includes(path))||(role==="editor"&&path==="/admin/catalog");}
