import {randomBytes,createHash,createPublicKey,verify} from 'node:crypto';
import {db,rows} from './storage.mjs';
await db.batch([
 'CREATE TABLE IF NOT EXISTS google_links23(uid TEXT PRIMARY KEY,subject TEXT UNIQUE NOT NULL,email TEXT,linked INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS google_states23(state TEXT PRIMARY KEY,uid TEXT NOT NULL,verifier TEXT NOT NULL,nonce TEXT NOT NULL,expires INTEGER NOT NULL)'
], 'write');
const random=()=>randomBytes(32).toString('base64url');
const hash=x=>createHash('sha256').update(x).digest('base64url');
const fail=(message,status=400)=>Object.assign(Error(message),{status});
function config(){const clientId=process.env.GOOGLE_CLIENT_ID,secret=process.env.GOOGLE_CLIENT_SECRET,redirect=process.env.GOOGLE_REDIRECT_URI;return clientId&&secret&&redirect&&/^https:\/\/[^?#]+\/auth\/google\/callback$/.test(redirect)?{clientId,secret,redirect}:null;}
export async function googleStatus23(uid){const link=(await rows('SELECT email,linked FROM google_links23 WHERE uid=?',uid))[0];return {configured:!!config(),linked:!!link,email:link?.email||null,linkedAt:link?.linked||null};}
export async function googleStart23(uid){const c=config();if(!c)throw fail('La conexión con Google requiere configurar el cliente OAuth del servidor.',503);const state=random(),verifier=random(),nonce=random();await rows('DELETE FROM google_states23 WHERE expires<? OR uid=?',Date.now(),uid);await rows('INSERT INTO google_states23 VALUES(?,?,?,?,?)',hash(state),uid,verifier,nonce,Date.now()+600000);const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.redirect,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:hash(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();return {url:url.href,expiresIn:600};}
let cachedKeys=null,keyExpiry=0;
export async function verifyGoogleIdentity23(jwt,{clientId,nonce,fetcher=fetch,now=Date.now()}={}){
 if(typeof jwt!=='string'||jwt.length>16000)throw fail('Identidad de Google no válida.');
 const parts=jwt.split('.');if(parts.length!==3)throw fail('Identidad de Google no válida.');
 let h,p;try{h=JSON.parse(Buffer.from(parts[0],'base64url'));p=JSON.parse(Buffer.from(parts[1],'base64url'));}catch{throw fail('Identidad de Google no válida.');}
 if(h.alg!=='RS256'||typeof h.kid!=='string')throw fail('Firma de Google no válida.');
 let keys=cachedKeys;
 if(!keys||now>=keyExpiry||!keys.some(k=>k.kid===h.kid)){const response=await fetcher('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw fail('No se pudo verificar Google.',502);keys=(await response.json()).keys;if(!Array.isArray(keys))throw fail('No se pudo verificar Google.',502);cachedKeys=keys;keyExpiry=now+300000;}
 const key=keys.find(k=>k.kid===h.kid&&k.kty==='RSA');
 if(!key||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw fail('Firma de Google no válida.');
 if(!['https://accounts.google.com','accounts.google.com'].includes(p.iss)||p.aud!==clientId||(p.azp&&p.azp!==clientId)||p.nonce!==nonce||typeof p.exp!=='number'||p.exp*1000<=now||typeof p.iat!=='number'||p.iat*1000>now+60000||typeof p.sub!=='string'||!p.sub||p.email_verified!==true||typeof p.email!=='string')throw fail('La identidad de Google no coincide o ha caducado.');
 return {subject:p.sub,email:p.email};
}
export async function googleCallback23(params,{fetcher=fetch}={}){
 const c=config();if(!c)throw fail('Google aún no está configurado.',503);
 const state=params.get('state');if(!state||!/^[A-Za-z0-9_-]{43}$/.test(state))throw fail('Solicitud de Google no válida.');
 // Atomic consumption: replayed callbacks can never attach an identity twice.
 const saved=(await rows('DELETE FROM google_states23 WHERE state=? RETURNING *',hash(state)))[0];if(!saved||saved.expires<Date.now())throw fail('La conexión ha caducado. Vuelve a intentarlo desde Vera.');
 if(params.has('error'))throw fail('No se ha autorizado la conexión con Google.');
 const code=params.get('code');if(!code||code.length>4096)throw fail('Código de Google no válido.');
 const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:c.clientId,client_secret:c.secret,redirect_uri:c.redirect,grant_type:'authorization_code',code_verifier:saved.verifier}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw fail('Google no pudo completar la conexión. Vuelve a intentarlo.',502);
 const token=await response.json(),identity=await verifyGoogleIdentity23(token.id_token,{clientId:c.clientId,nonce:saved.nonce,fetcher});
 // Never retain Google access/refresh tokens: Health Connect has separate Android permissions.
 try{await rows('INSERT INTO google_links23 VALUES(?,?,?,?) ON CONFLICT(uid) DO UPDATE SET subject=excluded.subject,email=excluded.email,linked=excluded.linked',saved.uid,identity.subject,identity.email,Date.now());}catch(error){if(String(error.code||error).includes('CONSTRAINT'))throw fail('Esta cuenta de Google ya está vinculada a otra cuenta de Vera.',409);throw error;}
 return {linked:true};
}
