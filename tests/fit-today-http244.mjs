// Native transport is simulated; normalizer, save(), journal, Hoy, HTTP and SQLite are real app code.
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync,mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
Object.assign(process.env,{HOST:'127.0.0.1',PORT:'0',VERA_DB:join(mkdtempSync(join(tmpdir(),'vera-fit-today244-')),'db'),TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',RENDER:'',GOOGLE_CLIENT_ID:''});
const {server}=await import('../server.mjs'),{db,rows}=await import('../storage.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
async function post(path,data,token){const r=await fetch(base+'/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)}),body=await r.json();if(!r.ok)throw Object.assign(Error(body.error),{status:r.status});return body;}
const www=new URL('../www/',import.meta.url),read=name=>readFileSync(new URL(name,www),'utf8');
const html=read('index.html'),saveSource=html.slice(html.indexOf('    function save() {'),html.indexOf('    function msg(t) {'));
assert.ok(saveSource.includes('VeraJournal.schedule()'),'Exercise production save(), not a substitute');
const time=+new Date(2026,10,23,12);class Clock extends Date{constructor(...a){super(...(a.length?a:[time]));}static now(){return time;}}
const day=d=>{const x=d||new Clock();return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-');};
function client(account){
 const state={logs:[],profile:{},turns:[],memory:[]},storage=new Map(),timers=new Map(),native=[],errors=[];let nextTimer=0,paints=0,cardioVisits=0;
 const target={querySelectorAll:()=>[],contains:()=>false,_html:'',get innerHTML(){return this._html;},set innerHTML(value){this._html=value;paints++;}};
 const sessionStorage={veraUser:account.id,veraToken:account.token},localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 const context=vm.createContext({console,Date:Clock,AbortSignal,crypto:{randomUUID},sessionStorage,localStorage,s:state,validSession:true,accountReady22:true,googleLinked23:()=>true,tab:'Hoy',busy:false,recording:false,attached:null,photoData:null,machinePhoto:null,machinePlate:null,VeraSpeech14:{controller:null,audio:null},window:{VeraNative:{refreshHealth21:id=>native.push(id),health21:id=>native.push(id)},addEventListener(){}},document:{hidden:false,activeElement:null,addEventListener(){},getElementById:id=>id==='todayDashboard244'?target:null},$:id=>id==='todayDashboard244'?target:null,safe:x=>String(x).replaceAll('<','&lt;'),btn:(label,action)=>`<button onclick="${action}">${label}</button>`,day,storageKey:()=>account.id,initial:()=>({logs:[],profile:{},turns:[]}),msg:x=>errors.push(x),render(){throw Error('Unexpected full render/navigation; Today must refresh in place');},go(name){if(name==='Cardio')cardioVisits++;throw Error('Navigation is forbidden in this integration test');},markLogs(){for(const r of state.logs)if(!r.id)r.id=randomUUID();},sameVeraSession:(owner,token,s)=>owner===sessionStorage.veraUser&&token===sessionStorage.veraToken&&s===state,api:(path,data)=>post(path,data,sessionStorage.veraToken),setTimeout:(fn,delay=0)=>{timers.set(++nextTimer,{fn,delay});return nextTimer;},clearTimeout:id=>timers.delete(id),setInterval:()=>0,queueMicrotask,refreshUnlockedHealth(){},syncHealth(){}});
 const run=code=>vm.runInContext(code,context);
 for(const file of ['state14.js','journal.js','metrics21.js'])run(read(file));run(saveSource);run(read('health21.js'));run(read('today244.js'));
 const open=()=>{target.innerHTML=run('home()');};
 async function flushScheduled(){for(const [id,t]of [...timers])if(t.delay===0){timers.delete(id);await t.fn();}assert.equal(await run('VeraJournal.flush()'),true);}
 return {run,state,context,target,native,errors,open,flushScheduled,paints:()=>paints,cardioVisits:()=>cardioVisits};
}
try{
 const credentials={email:'fit-today244@example.invalid',password:'synthetic-only-password244'},account=await post('register',{...credentials,adult:true,notice:'beta-3'}),first=client(account);
 first.open();assert.match(first.target.innerHTML,/No hay sesiones de cardio/);const originalTarget=first.target,before=first.paints();
 const start=+new Clock(2026,10,23,9),fit={id:'fit-bicycle-today',date:day(new Clock(start)),origin:'com.google.android.apps.fitness',sport:'cycling',title:'Salida de Google Fit',start,end:start+785000,minutes:785/60,distanceMeters:3180,energyKcal:null};
 const yesterday={...fit,id:'fit-bicycle-yesterday',date:day(new Clock(start-86400000)),start:start-86400000,end:start-86400000+2400000,minutes:40,distanceMeters:99990,title:'Salida de ayer'};
 first.context.fitRows=[fit,yesterday];first.run('requestHealth21(false,true)');assert.equal(first.native.length,1);
 // Simulate exactly the Android callbacks against the ticket issued by the real JS controller.
 first.run("healthImport21(healthTicket21.id,'permissions',['workouts']);healthImport21(healthTicket21.id,'workouts',fitRows)");
 assert.equal(first.state.logs.length,2);assert.equal(first.state.logs.find(r=>r.healthRecordId===fit.id).durationSeconds,785);assert.equal(first.state.logs.find(r=>r.healthRecordId===fit.id).distanceMeters,3180);
 assert.strictEqual(first.target,originalTarget);assert.ok(first.paints()>before,'Existing Today DOM target refreshed by callback/save');assert.equal(first.cardioVisits(),0);assert.equal(first.run('tab'),'Hoy');
 assert.match(first.target.innerHTML,/3,18 km/);assert.match(first.target.innerHTML,/13 min 5 s/);assert.match(first.target.innerHTML,/Google Fit · Health Connect/);assert.ok(!first.target.innerHTML.includes('99,99 km'));assert.ok(!first.target.innerHTML.includes('Salida de ayer'));
 assert.equal(first.run('VeraToday244.summary(s.logs).activities.length'),1,'Yesterday is preserved but excluded from Today');
 await first.flushScheduled();assert.equal(first.run('VeraJournal.pending()'),0);assert.equal((await rows('SELECT count(*) n FROM diary_sync WHERE uid=? AND data IS NOT NULL',account.id))[0].n,2);
 first.run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['workouts']);healthImport21(healthTicket21.id,'workouts',fitRows)");await first.flushScheduled();assert.equal(first.state.logs.length,2);
 await post('logout',{},account.token);const login=await post('login',credentials),restored=client(login);restored.open();assert.ok(!restored.target.innerHTML.includes('3,18 km'));
 assert.equal(await restored.run('VeraJournal.flush()'),true);restored.run('window.todayRefresh244()');
 assert.equal(restored.state.logs.length,2);assert.equal(restored.state.logs.find(r=>r.healthRecordId===fit.id).durationSeconds,785);assert.equal(restored.run('VeraToday244.summary(s.logs).activities.length'),1);assert.match(restored.target.innerHTML,/3,18 km/);assert.match(restored.target.innerHTML,/13 min 5 s/);assert.ok(!restored.target.innerHTML.includes('99,99 km'));assert.ok(!restored.target.innerHTML.includes('Salida de ayer'));assert.equal(restored.native.length,0,'Restored activity came from account, not a new native read');assert.equal(restored.cardioVisits(),0);assert.deepEqual(first.errors,[]);assert.deepEqual(restored.errors,[]);
 console.log('PASS fit-today-http244: simulated native Fit callback 3180m/785s + yesterday -> real normalizer/save/journal -> real HTTP/SQLite -> already-open real Today refresh without Cardio -> clean login restores both records and displays today only. No real phone/Google read claimed.');
}finally{await new Promise(r=>server.close(r));db.close();}
