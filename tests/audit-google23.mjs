import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'vera-google23-'));process.env.VERA_DB=join(tmp,'test.sqlite');delete process.env.TURSO_DATABASE_URL;delete process.env.RENDER;
const {googleStatus23,googleStart23,googleCallback23,verifyGoogleIdentity23}=await import('../google-auth23.mjs');const {rows,db}=await import('../storage.mjs');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...publicKey.export({format:'jwk'}),kid:'test23',alg:'RS256',use:'sig'};
let claims;const token=overrides=>{const h=Buffer.from(JSON.stringify({alg:'RS256',kid:'test23'})).toString('base64url'),p=Buffer.from(JSON.stringify({...claims,...overrides})).toString('base64url');return h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url');};
let exchange=0;const fetcher=async(url,options)=>{if(url.includes('/certs'))return {ok:true,json:async()=>({keys:[jwk]})};assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(options.body.get('grant_type'),'authorization_code');assert.match(options.body.get('code_verifier'),/^[\w-]{43}$/);exchange++;return {ok:true,json:async()=>({id_token:token({}),access_token:'never-retained'})};};
try{
 assert.equal((await googleStatus23('a')).configured,false);await assert.rejects(()=>googleStart23('a'),/cliente OAuth/);
 process.env.GOOGLE_CLIENT_ID='client23';process.env.GOOGLE_CLIENT_SECRET='test-secret';process.env.GOOGLE_REDIRECT_URI='https://vera-beta.onrender.com/auth/google/callback';
 const {url}=await googleStart23('a'),params=new URL(url).searchParams;assert.equal(params.get('code_challenge_method'),'S256');assert.equal(params.get('scope'),'openid email profile');
 const [pending]=await rows('SELECT * FROM google_states23 WHERE uid=?','a');assert.notEqual(pending.state,params.get('state'));
 claims={iss:'https://accounts.google.com',aud:'client23',nonce:params.get('nonce'),sub:'subject23',email:'test@example.test',email_verified:true,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300};
 await googleCallback23(new URLSearchParams({state:params.get('state'),code:'auth-code'}),{fetcher});assert.equal(exchange,1);assert.equal((await googleStatus23('a')).linked,true);assert.equal((await googleStatus23('b')).linked,false);
 await assert.rejects(()=>googleCallback23(new URLSearchParams({state:params.get('state'),code:'auth-code'}),{fetcher}),/caducado/);assert.equal(exchange,1);
 for(const bad of [{aud:'attacker'},{nonce:'wrong'},{iss:'https://attacker.test'},{exp:0},{email_verified:false},{iat:Math.floor(Date.now()/1000)+600}])await assert.rejects(()=>verifyGoogleIdentity23(token(bad),{clientId:'client23',nonce:claims.nonce,fetcher}));
 const broken=token({}).split('.');broken[2]=Buffer.alloc(256).toString('base64url');await assert.rejects(()=>verifyGoogleIdentity23(broken.join('.'),{clientId:'client23',nonce:claims.nonce,fetcher}),/Firma/);
 const second=new URL((await googleStart23('b')).url).searchParams;claims.nonce=second.get('nonce');await assert.rejects(()=>googleCallback23(new URLSearchParams({state:second.get('state'),code:'code'}),{fetcher}),/otra cuenta/);
 console.log('PASS Google OAuth: absent config, state/PKCE, RS256, issuer/audience/nonce/time, account isolation, replay and unique Google identity.');
}finally{db.close();await rm(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
