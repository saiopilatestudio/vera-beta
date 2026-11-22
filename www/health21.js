/* Health Connect transport is OS-permission based; never an AI or Google OAuth substitute. */
let healthTicket21=null,healthDebounce21=null,healthApplying21=false,healthLastRequest21=0,healthLastOwner21='';
const healthKinds21={steps:'Pasos',sleep:'Sueño',workouts:'Entrenamiento',weight:'Otro pesaje',nutrition:'Comida',hydration:'Agua'};
function healthReady21(){return typeof googleLinked23==='function'&&googleLinked23()&&validSession&&!!sessionStorage.veraUser&&!!sessionStorage.veraToken&&!document.hidden&&!!window.VeraNative?.refreshHealth21;}
function requestHealth21(permissions=false,force=false){
 if(!healthReady21())return;
 const owner=sessionStorage.veraUser,now=Date.now();
 if(!force&&healthTicket21&&!healthTicket21.done&&sameVeraSession(healthTicket21.owner,healthTicket21.token,healthTicket21.state)&&now-healthTicket21.started<90000)return;
 if(!force&&owner===healthLastOwner21&&now-healthLastRequest21<15000)return;
 healthLastRequest21=now;healthLastOwner21=owner;
 const id='h'+now+'_'+Math.random().toString(36).slice(2);
 healthTicket21={id,owner,token:sessionStorage.veraToken,state:s,started:now,done:false,received:new Set()};
 if(permissions)window.VeraNative.health21(id);else window.VeraNative.refreshHealth21(id);
}
function refreshHealthAfterAction21(){
 if(healthApplying21||!healthReady21())return;clearTimeout(healthDebounce21);
 const owner=sessionStorage.veraUser,token=sessionStorage.veraToken,state=s;
 healthDebounce21=setTimeout(()=>{if(sameVeraSession(owner,token,state))refreshUnlockedHealth();},15000);
}
refreshUnlockedHealth=function(){
 if(!healthReady21())return;const key='vera.health21.asked.'+sessionStorage.veraUser;
 if(!localStorage.getItem(key)){localStorage.setItem(key,'yes');s.autoHealth=true;requestHealth21(true,true);return;}
 if(s.autoHealth!==false)requestHealth21();
};
syncHealth=function(){if(!healthReady21())return msg('Health Connect requiere la APK en Android 14 o posterior y una sesión iniciada.');s.autoHealth=true;localStorage.setItem('vera.health21.asked.'+sessionStorage.veraUser,'yes');save();requestHealth21(true,true);};
function normalizeHealth21(type,rows){
 if(!healthKinds21[type]||!Array.isArray(rows)||rows.length>10000)throw Error('Respuesta de salud no válida.');
 const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date&&date<=day();
 const number=(x,max=1e9)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
 const record=(r,id)=>({id,healthKey:id,healthType:type,source:'health',kind:healthKinds21[type],date:r.date,note:'Health Connect'+(r.origin?' · '+String(r.origin).slice(0,200):'')});
 if(type==='sleep'){
  const grouped={};for(const r of rows){if(!validDate(r.date)||!number(r.start,1e14)||!number(r.end,1e14)||r.end<=r.start||r.end-r.start>86400000)continue;
   let cursor=r.start;const spans=grouped[r.date]||=[];
   const awake=(Array.isArray(r.awake)?r.awake:[]).filter(x=>Array.isArray(x)&&number(x[0],1e14)&&number(x[1],1e14)&&x[1]>x[0]).sort((a,b)=>a[0]-b[0]);
   for(const[a,b]of awake){const x=Math.max(r.start,a),y=Math.min(r.end,b);if(y<=x)continue;if(x>cursor)spans.push([cursor,x]);cursor=Math.max(cursor,y);}if(cursor<r.end)spans.push([cursor,r.end]);
  }
  return Object.entries(grouped).map(([date,spans])=>{let end=0,total=0;for(const[a,b]of spans.sort((x,y)=>x[0]-y[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return {...record({date},'health_sleep_'+date),value:Math.min(24,total/3600000),note:'Health Connect · sesiones por fecha de finalización, sin vigilia ni intervalos duplicados'};});
 }
 const result=new Map();for(const r of rows){if(!r||!validDate(r.date))continue;
  const key=type==='steps'?r.date:typeof r.id==='string'?r.id.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,65):'';if(!key)continue;
  const id='health_'+type+'_'+key,l=record(r,id);
  if(type==='steps'){if(!number(r.value,1000000)||!Number.isInteger(r.value))continue;l.value=r.value;}
  if(type==='hydration'){if(!number(r.value,20000))continue;l.value=r.value;}
  if(type==='weight'){if(!number(r.value,1000)||r.value===0)continue;l.value=r.value;l.note+=' · condición de ayuno no indicada';}
  if(type==='workouts'){if(!number(r.minutes,1440))continue;l.value=null;l.minutes=r.minutes;l.note+=' · '+String(r.title||'Sesión').slice(0,250)+' · '+Math.round(r.minutes)+' min';}
  if(type==='nutrition'){l.value=number(r.value,90000)?r.value:null;l.note+=' · '+String(r.note||'Comida').slice(0,500);for(const k of ['protein','carbs','fat'])l[k]=number(r[k],10000)?r[k]:null;l.nutrients={};for(const k of ['fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug'])if(number(r.nutrients?.[k],1e7))l.nutrients[k]=r.nutrients[k];}
  result.set(id,l);
 }return [...result.values()];
}
function healthImport21(ticket,type,rows){
 const request=healthTicket21;if(!request||request.id!==ticket||Date.now()-request.started>120000||!validSession||!sameVeraSession(request.owner,request.token,request.state))return;
 if(type==='permissions'){request.expected=Array.isArray(rows)?rows.filter(x=>healthKinds21[x]):[];request.done=request.expected.length===0;return;}
 request.received.add(type);if(request.expected?.every(t=>request.received.has(t)))request.done=true;
 try{
  const imported=normalizeHealth21(type,rows),start=new Date();start.setDate(start.getDate()-27);const first=type==='steps'?day():day(start);
  // Device-only provenance: an empty local Health Connect snapshot must never
  // delete records synchronized from a different phone.
  const idsKey='vera.health21.ids.'+request.owner;let known={};try{known=JSON.parse(localStorage.getItem(idsKey)||'{}');}catch{}if(!known||typeof known!=='object'||Array.isArray(known))known={};
  const own=new Set(Array.isArray(known[type])?known[type]:[]);
  const keep=s.logs.filter(l=>!(l.source==='health'&&l.date>=first&&l.date<=day()&&((l.healthType===type&&own.has(l.id))||(!l.healthType&&!l.healthKey&&l.kind===healthKinds21[type]))));
  const incoming=new Map(imported.map(l=>[l.id,l]));const next=keep.filter(l=>!incoming.has(l.id)).concat(imported);
  const remember=()=>{known[type]=imported.map(l=>l.id);localStorage.setItem(idsKey,JSON.stringify(known));};
  // Identical snapshots do not schedule another save/sync/AI revision.
  const stable=xs=>JSON.stringify([...xs].sort((a,b)=>String(a.id).localeCompare(String(b.id))));
  if(stable(next)===stable(s.logs)){remember();return;}
  const previous=s.logs;healthApplying21=true;s.logs=next;
  try{save();}catch(e){s.logs=previous;throw e;}finally{healthApplying21=false;}
  remember();
  msg('Health Connect actualizado: '+imported.length+' registros de '+healthKinds21[type].toLowerCase()+'.');
 }catch(e){msg('No se ha actualizado salud. '+e.message);}
}
window.addEventListener?.('focus',()=>refreshUnlockedHealth());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshUnlockedHealth();});
// Detects the first successful login without a repeated OS permission prompt.
setInterval(()=>{if(healthReady21()&&(sessionStorage.veraUser!==healthLastOwner21||Date.now()-healthLastRequest21>=300000))refreshUnlockedHealth();},30000);
setTimeout(()=>refreshUnlockedHealth(),1500);
