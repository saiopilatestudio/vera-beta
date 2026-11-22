import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{style:{},innerHTML:'',querySelector(){return null;}});return nodes.get(id);};
let health={supported:true,complete:false,missing:['x']};
const ctx=vm.createContext({console,URL,AbortSignal,queueMicrotask,setTimeout,clearTimeout,setInterval,clearInterval,navigator:{onLine:true},validSession:false,sessionStorage:{veraUser:'https://vera-beta.onrender.com/'+'a'.repeat(32),veraToken:'token'},document:{hidden:false,addEventListener(){},getElementById:get},window:{addEventListener(){},VeraNative:{healthPermissions23:()=>JSON.stringify(health)}},$:get,s:{profile:{}},VeraJournal:{onSession(){},pending(){return 0;}},storeProfile(){},save(){},msg(){},render(){},safe:x=>x,btn:(l,a)=>'<button>'+l+'</button>',prefs:()=>'<form>PROFILE_FORM</form>'});
for(const file of ['online22.js','google23.js'])vm.runInContext(await readFile(new URL('../www/'+file,import.meta.url),'utf8'),ctx);
vm.runInContext("validSession=true;accountReady22=true;googleOwner23=sessionStorage.veraUser;googleToken23=sessionStorage.veraToken;googleState23={configured:true,linked:false}",ctx);
assert.equal(ctx.onlineGate22(),true);assert.match(get('view').innerHTML,/Conecta tu cuenta de Google/);assert.doesNotMatch(get('view').innerHTML,/PROFILE_FORM/);
vm.runInContext('googleState23.linked=true',ctx);
for(const type of ['STEPS','EXERCISE','SLEEP','WEIGHT','NUTRITION','HYDRATION'])for(const mode of ['READ','WRITE']){health={supported:true,complete:false,missing:['android.permission.health.'+mode+'_'+type]};ctx.onlineGate22();assert.match(get('view').innerHTML,/Conceder permisos/);assert.doesNotMatch(get('view').innerHTML,/PROFILE_FORM/);}
health={supported:true,complete:true,missing:[]};ctx.onlineGate22();assert.match(get('view').innerHTML,/PROFILE_FORM/);
health={supported:true,complete:false,missing:['android.permission.health.WRITE_SLEEP']};ctx.onlineGate22();assert.match(get('view').innerHTML,/Conceder permisos/,'revocation blocks immediately, no cached approval');
health={supported:false,complete:false};ctx.onlineGate22();assert.match(get('view').innerHTML,/Android 14/);assert.match(get('view').innerHTML,/Cambiar de cuenta/);
console.log('PASS Google/Health onboarding: Google before profile, each of 12 permissions required, complete grants unlock profile, immediate revocation, Android14 requirement + account exit.');
