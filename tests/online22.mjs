import './test-env.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
process.env.VERA_DB=mkdtempSync(tmpdir()+'/vera-online22-')+'/db';
const {profileSync}=await import('../profile-sync.mjs');
const {journal}=await import('../journal.mjs');
const {db}=await import('../storage.mjs');
const www=new URL('../www/',import.meta.url),html=readFileSync(new URL('index.html',www),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const tick=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
function harness(account=randomUUID()){
 const values=new Map([['vera.notice8','1']]),nodes=new Map(),listeners={},timers=[];
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},isConnected:true,querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},append(){},remove(){nodes.delete(this.id);this.isConnected=false;}});return nodes.get(id);}
 const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{(listeners[type]||=[]).push(fn);},hidden:false,createElement:()=>({...node(randomUUID())}),body:{append(el){nodes.set(el.id,el);}}};
 for(const id of ['topTools','nav','view','notice'])node(id);
 const ctx=vm.createContext({console,document,navigator:{onLine:true},localStorage:storage,sessionStorage:{veraUser:'https://test/'+account,veraToken:'token-'+account},window:{VeraNative:{},setInterval(){},addEventListener:(type,fn)=>{(listeners['window:'+type]||=[]).push(fn);}},location:{origin:'https://test',hostname:'test'},crypto:{randomUUID},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},setInterval(){},scrollTo(){},Date,URL,Blob,AbortSignal,AbortController,TextEncoder,confirm:()=>true,fetch:()=>{throw Error('Unexpected live request');}});
 const run=code=>vm.runInContext(code,ctx);
 for(const file of ['state14.js','session13.js','edition12.js','vision11.js','vera5.js','partners.js','edition10.js','list7.js','catalog6.js','journal.js','privacy6.js','actions6.js'])run(readFileSync(new URL(file,www),'utf8'));
 for(const[,inline]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))run(inline);
 for(const file of ['perf6.js','metrics21.js','health21.js','planning21.js','nutrition22.js'])run(readFileSync(new URL(file,www),'utf8'));
 run('validSession=false');
 run(readFileSync(new URL('online22.js',www),'utf8'));
 const network={fail:false,hook:null,calls:[]};
 ctx.api=async(path,data)=>{const owner=ctx.sessionStorage.veraUser.split('/').at(-1);network.calls.push({owner,path});if(network.hook)await network.hook(path,owner);if(network.fail)throw Error('Red interrumpida');if(path==='session')return {};if(path==='diario')return journal(owner,clone(data));if(path==='profile-sync')return profileSync(owner,clone(data));throw Error('Unexpected route '+path);};
 run('validSession=true;accountReady22=false;s=initial()');
 function profileInputs(overrides={}){for(const[k,v]of Object.entries({name:'Ana',goal:'Ganar fuerza',level:'Entreno habitualmente',days:'4',time:'Tarde',sleepGoal22:'8',waterGoal22:'2000',age:'32',height:'170',weight:'65',...overrides}))node(k).value=v;}
 return {run,ctx,node,nodes,listeners,timers,network,profileInputs,account};
}
const outcomes=[];
async function test(name,fn){try{await fn();outcomes.push({name,ok:true});}catch(e){outcomes.push({name,ok:false,error:e.message});}}
await test('Una cuenta en caché no abre la app antes de verificar sesión y recuperar servidor',async()=>{
 const h=harness();h.run("s.profile={name:'Ana',goal:'Ganar fuerza',level:'Avanzada',days:'4',introduced:true};render()");assert.match(h.node('view').innerHTML,/Conectando con tu cuenta/);assert.equal(h.run('accountReady22'),false);h.network.fail=true;await h.run('restoreAccount22()');assert.equal(h.run('accountReady22'),false);assert.match(h.node('view').innerHTML,/Necesitas conexión/);
});
await test('Alta obligatoria y preferencias conservadas tras recuperar una cuenta en otro dispositivo',async()=>{
 const h=harness();await h.run('restoreAccount22()');assert.match(h.node('view').innerHTML,/Hagamos Vera tuya/);h.profileInputs();await h.run('storeProfile({preventDefault(){}})');assert.equal(h.run('profileComplete22()'),true);assert.equal(h.run('VeraJournal.pending()'),0);const fields=(await profileSync(h.account)).fields;assert.equal(fields.find(x=>x.field==='profile.waterGoalMl').value,2000);assert.equal(fields.find(x=>x.field==='need').value,8);assert.equal(fields.find(x=>x.field==='profile.introduced').value,true);h.run('s=initial();accountReady22=false');await h.run('restoreAccount22()');assert.equal(h.run('s.profile.name'),'Ana');assert.equal(h.run('s.profile.waterGoalMl'),2000);assert.equal(h.run('profileComplete22()'),true);
});
await test('Perfil inválido no se modifica ni se manda al servidor',async()=>{
 const h=harness();h.run('accountReady22=true');for(const bad of [{name:''},{goal:''},{level:''},{days:'0'},{days:'2.5'},{sleepGoal22:'18'},{waterGoal22:'-20'},{age:'17'},{weight:'400'}]){h.profileInputs(bad);const before=h.run('JSON.stringify(s.profile)'),calls=h.network.calls.length;await h.run('storeProfile({preventDefault(){}})');assert.equal(h.run('JSON.stringify(s.profile)'),before);assert.equal(h.network.calls.length,calls);}
});
await test('Alta fallida no concede entrada ni afirma perfil guardado',async()=>{
 const h=harness();h.run('accountReady22=true');h.profileInputs();h.network.fail=true;await h.run('storeProfile({preventDefault(){}})');assert.equal(h.run('profileComplete22()'),false);assert.match(h.node('view').innerHTML,/Hagamos Vera tuya/);assert.ok(h.run('VeraJournal.pending()')>0);
});
await test('Sin conexión se bloquean click y submit, incluidos formularios ya abiertos',async()=>{
 const h=harness();h.run('accountReady22=true');h.ctx.navigator.onLine=false;for(const type of ['click','submit']){let prevented=false,stopped=false;for(const fn of h.listeners[type]||[])fn({preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});assert.equal(prevented,true);assert.equal(stopped,true);}assert.match(h.node('view').innerHTML,/Necesitas conexión/);
});
await test('Guardar no informa confirmación antes del ACK; error conserva datos pendientes para reintentar',async()=>{
 const h=harness();await h.run('restoreAccount22()');h.run("accountReady22=true;s.logs.push({id:'test-water',kind:'Agua',date:day(),value:250})");h.network.fail=true;await h.run('onlineSave22()');assert.match(h.node('commitStatus22').innerHTML,/No se ha confirmado/);assert.equal(h.run('networkDown22'),true);assert.match(h.node('view').innerHTML,/Necesitas conexión/);assert.equal(h.run('s.logs.at(-1).value'),250);h.network.fail=false;await h.run('retryCommit22()');assert.equal(h.run('VeraJournal.pending()'),0);assert.match(h.node('commitStatus22').textContent,/Guardado en tu cuenta/);assert.equal((await journal(h.account)).records.length,1);
});
await test('El guardado inicial de A no modifica el perfil de B tras cambiar de cuenta',async()=>{
 const h=harness();h.run('accountReady22=true');h.profileInputs();let release,entered=false;h.network.hook=async path=>{if(path==='diario'){h.network.hook=null;entered=true;await new Promise(r=>release=r);}};const task=h.run('storeProfile({preventDefault(){}})');await tick();assert.ok(entered);assert.match(h.node('view').innerHTML,/Guardando tu perfil/);h.run("sessionStorage.veraUser='https://test/second-profile';sessionStorage.veraToken='token-b';s=initial();s.profile={name:'B',goal:'Ganar fuerza',days:'3',level:'Avanzada',introduced:true}");release();await task;assert.equal(h.run('s.profile.introduced'),true);assert.equal(h.run('s.profile.name'),'B');
});
await test('B puede recuperar su cuenta mientras termina una recuperación anterior de A',async()=>{
 const h=harness();let release,entered=false;h.network.hook=async(path,owner)=>{if(path==='session'&&owner===h.account){h.network.hook=null;entered=true;await new Promise(r=>release=r);}};const old=h.run('restoreAccount22()');await tick();assert.ok(entered);h.run("sessionStorage.veraUser='https://test/second-restore';sessionStorage.veraToken='token-b';s=initial();VeraJournal.onSession()");release();await old;await tick();assert.equal(h.run('accountReady22'),true);assert.ok(h.network.calls.some(x=>x.owner==='second-restore'&&x.path==='session'));
});
await test('Un ACK tardío de A no se muestra como confirmación del guardado pendiente de B',async()=>{
 const h=harness();await h.run('restoreAccount22()');h.run("accountReady22=true;s.logs.push({id:'account-a-water',kind:'Agua',date:day(),value:250})");let release,entered=false;h.network.hook=async path=>{if(path==='diario'){h.network.hook=null;entered=true;await new Promise(r=>release=r);}};const a=h.run('onlineSave22()');await tick();assert.ok(entered);h.run("sessionStorage.veraUser='https://test/second-save';sessionStorage.veraToken='token-b';s=initial();accountReady22=true;s.logs.push({id:'account-b-water',kind:'Agua',date:day(),value:500})");const b=h.run('onlineSave22()');release();await a;await b;await tick();assert.equal((await journal('second-save')).records.length,1);assert.equal(h.run('s.logs.at(-1).value'),500);
});
db.close();
console.log(JSON.stringify({suite:'Online 2.2 · actual frontend and server persistence with synthetic accounts',passed:outcomes.filter(x=>x.ok).length,failed:outcomes.filter(x=>!x.ok).length,results:outcomes},null,2));
if(outcomes.some(x=>!x.ok))process.exitCode=1;
