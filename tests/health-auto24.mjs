import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
let clock=Date.now(),timerId=0,saves=0;const timers=new Map(),requests=[],storage=new Map(),messages=[];
class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
const ctx=vm.createContext({Date:Clock,console,window:{VeraNative:{refreshHealth21:id=>requests.push({id,permissions:false}),health21:id=>requests.push({id,permissions:true})},addEventListener(){}},document:{hidden:false,addEventListener(){}},sessionStorage:{veraUser:'a',veraToken:'ta'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},validSession:true,accountReady22:true,googleLinked23:()=>true,s:{logs:[],autoHealth:false},day:d=>(d||new Clock()).toISOString().slice(0,10),save(){saves++;},msg:m=>messages.push(m),safe:String,btn:()=>'<button>Comprobar ahora</button>',setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),setInterval(){},refreshUnlockedHealth(){},syncHealth(){}});
const run=code=>vm.runInContext(code,ctx);run('function sameVeraSession(o,t,state){return o===sessionStorage.veraUser&&t===sessionStorage.veraToken&&state===s;}');run(readFileSync(new URL('../www/health21.js',import.meta.url),'utf8'));ctx.today=ctx.day();
const tick=delay=>{const timer=[...timers].find(([,t])=>t.delay===delay);assert.ok(timer,'Timer '+delay);timers.delete(timer[0]);clock+=delay;timer[1].fn();};
run('accountReady22=false;refreshUnlockedHealth()');assert.equal(requests.length,0,'Wait for restored server account');
run("accountReady22=true;localStorage.setItem('vera.health21.asked.a','yes');refreshUnlockedHealth()");assert.equal(requests.length,1);assert.equal(requests[0].permissions,false);assert.equal(ctx.s.autoHealth,true,'Legacy opt-out cannot disable mandatory auto sync');
const first=requests[0].id;ctx.first=first;run('requestHealth21(false,true);requestHealth21(false,true)');assert.equal(requests.length,1,'Resume/focus/Google triggers coalesce without losing current callbacks');
run("healthImport21(first,'nutrition',[{id:'meal',date:today,value:400}]);healthImport21(first,'nutrition',[{id:'meal',date:today,value:900}])");assert.equal(ctx.s.logs[0].value,400);assert.equal(saves,1,'Duplicate type cannot replace newer result in same snapshot');
run("healthImport21(first,'permissions',['nutrition'])");assert.equal(run('healthTicket21.done'),true,'Permissions arriving after data still completes request');tick(15000);assert.equal(requests.length,2,'One coalesced follow-up');
run("s.logs.push({id:'health_steps_'+today,healthKey:'health_steps_'+today,healthType:'steps',kind:'Pasos',source:'health',date:today,value:6500});healthImport21(healthTicket21.id,'permissions',['nutrition','steps']);healthImport21(healthTicket21.id,'nutrition',[]);healthImport21(healthTicket21.id,'error',[{type:'steps',message:'Permiso revocado'}]);healthImport21(healthTicket21.id,'steps',[])");
assert.equal(run('healthStatus21().phase'),'partial');assert.equal(ctx.s.logs.find(r=>r.kind==='Pasos').value,6500,'Read failure/late callback cannot erase steps');assert.equal(run('healthTicket21.done'),true);
run('requestHealth21(false,true)');const old=requests.at(-1).id;ctx.old=old;run("sessionStorage.veraUser='b';sessionStorage.veraToken='tb';s={logs:[]};healthImport21(old,'nutrition',[{id:'old',date:today,value:999}])");assert.equal(ctx.s.logs.length,0);assert.equal(run('healthStatus21().phase'),'waiting');
run('requestHealth21(false,true)');tick(120000);assert.equal(run('healthStatus21().phase'),'partial');assert.equal(run('healthTicket21.done'),true);run("healthImport21(healthTicket21.id,'nutrition',[{id:'late',date:today,value:999}])");assert.equal(ctx.s.logs.length,0);
run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['steps']);healthImport21(healthTicket21.id,'steps',[])");assert.equal(run('healthStatus21().phase'),'read');assert.match(run('healthSyncPanel24()'),/Sincronizar Fit con Health Connect/);
const yesterday=new Clock(clock-86400000).toISOString().slice(0,10);ctx.yesterday=yesterday;
run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['steps']);healthImport21(healthTicket21.id,'steps',[{date:yesterday,value:7200},{date:today,value:100}])");assert.equal(ctx.s.logs.length,2,'Historical daily step aggregates imported');const saved=saves;
run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['steps']);healthImport21(healthTicket21.id,'steps',[{date:yesterday,value:7200},{date:today,value:100}])");assert.equal(saves,saved,'Identical snapshot does not save/retrigger AI');
run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['steps']);healthImport21(healthTicket21.id,'steps',[{date:today,value:110}])");assert.equal(ctx.s.logs.length,1,'Deleted historical steps from this phone are reconciled across 28-day window');
run("requestHealth21(false,true);healthImport21(healthTicket21.id,'permissions',['steps']);healthImport21(healthTicket21.id,'steps',null)");assert.equal(ctx.s.logs.length,1,'Malformed callback does not erase valid history');assert.equal(run('healthStatus21().phase'),'partial');
run('requestHealth21(false,true);requestHealth21(false,true)');run("healthImport21(healthTicket21.id,'permissions',[])");const count=requests.length;run("sessionStorage.veraUser='c';sessionStorage.veraToken='tc';s={logs:[]}");tick(15000);assert.equal(requests.length,count,'Queued follow-up belongs to original account');
run('requestHealth21(false,true)');const resumedCount=requests.length;run('validSession=false;cancelHealthRead21();validSession=true;requestHealth21(false,true)');assert.equal(requests.length,resumedCount+1,'Lock/resume starts a new native snapshot immediately');
console.log('PASS automatic Health: account restore gate, legacy auto flag, coalescing, out-of-order callbacks, deduplication, errors preserve records, timeout, account isolation, historical steps and Fit bridge guidance.');

// A real permission sheet suspends the WebView. Resumed reads must never depend
// on the ticket created before Android showed the sheet.
run("s={logs:[]};accountReady22=true;validSession=true;syncHealth()");
const permissionTicket=requests.at(-1).id;assert.equal(requests.at(-1).permissions,true);
ctx.permissionTicket=permissionTicket;
run("cancelHealthRead21();requestHealth21(false,true)");
const resumed=requests.at(-1).id;ctx.resumed=resumed;
run("healthPermissionResult244(permissionTicket)");
const latest=requests.at(-1).id;assert.notEqual(latest,resumed);assert.equal(requests.at(-1).permissions,false);
ctx.newTicket=latest;
const noon=new Clock(clock);noon.setHours(9,0,0,0);
ctx.ride={id:'session-fit',date:ctx.day(noon),start:+noon,end:+noon+785000,minutes:785/60,sport:'cycling',distanceMeters:3180,origin:'com.google.android.apps.fitness',title:'Paseo en bicicleta'};
let paints=0;ctx.window.todayRefresh244=()=>paints++;
run("healthImport21(permissionTicket,'workouts',[ride]);healthImport21(resumed,'workouts',[ride]);");
assert.equal(ctx.s.logs.length,0);
run("healthImport21(newTicket,'permissions',['steps','workouts']);healthImport21(newTicket,'steps',[{date:ride.date,value:313,origins:['com.google.android.apps.fitness']}]);healthImport21(newTicket,'workouts',[ride])");
assert.equal(ctx.s.logs.length,2);assert.equal(ctx.s.logs.find(r=>r.kind==='Cardio').healthTitle,'Paseo en bicicleta');assert.equal(ctx.s.logs.find(r=>r.kind==='Cardio').distanceMeters,3180);
assert.equal(ctx.s.logs.find(r=>r.kind==='Pasos').healthOrigins[0],ctx.ride.origin);
assert.equal(paints,2,'Live Today notified after each accepted dataset');assert.match(run('healthTodayPanel244()'),/Actividad de Google Fit recibida hoy/);
run("syncHealth()");ctx.oldPermission=requests.at(-1).id;const beforeSwitch=requests.length;
run("sessionStorage.veraUser='other';sessionStorage.veraToken='new';s={logs:[]};healthPermissionResult244(oldPermission)");
assert.equal(requests.length,beforeSwitch,'A callback belonging to a signed-out owner cannot trigger import');
console.log('PASS permission-sheet lifecycle, latest ticket, immediate Today notification and real Fit exercise shape.');

const nativeDuration=run("normalizeHealth21('workouts',[{id:'ride',date:today,minutes:13.1,start:100000,end:887000,sport:'cycling',healthDurationSeconds:785,distanceMeters:3180}])[0]");
assert.equal(nativeDuration.durationSeconds,785);
assert.equal(nativeDuration.value,785/60);
assert.equal(nativeDuration.avgSpeedKmh,3180/785*3.6);
assert.equal(run("normalizeHealth21('workouts',[{id:'ride',date:today,minutes:13.1,start:100000,end:887000,sport:'cycling',healthDurationSeconds:900}])[0].durationSeconds"),787);
