import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const www=new URL('../www/',import.meta.url),html=readFileSync(new URL('index.html',www),'utf8');
const map=new Map([['vera.notice8','1']]);
const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},dataset:{},isConnected:true,querySelectorAll:()=>[],setAttribute(){}});return nodes.get(id);}
const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener(){},hidden:false};
for(const id of ['topTools','nav','view','notice'])node(id);
const ctx=vm.createContext({console,document,localStorage:storage,sessionStorage:{veraUser:'https://test/alice',veraToken:'token-a'},window:{VeraNative:{},setInterval(){}},location:{origin:'https://test',hostname:'test'},crypto:{randomUUID},setTimeout:()=>0,clearTimeout(){},setInterval(){},scrollTo(){},Date,URL,Blob,AbortSignal,AbortController,TextEncoder,confirm:()=>true,fetch:()=>{throw Error('Unexpected network access');}});
const run=s=>vm.runInContext(s,ctx);
const files=['state14.js','session13.js','edition12.js','vision11.js','vera5.js','partners.js','edition10.js','list7.js','exercises-es22.js','catalog6.js','journal.js','privacy6.js','actions6.js'];
for(const file of files)run(readFileSync(new URL(file,www),'utf8'));
for(const [,inline] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))run(inline);
run(readFileSync(new URL('perf6.js',www),'utf8'));run(readFileSync(new URL('metrics21.js',www),'utf8'));run(readFileSync(new URL('health21.js',www),'utf8'));run(readFileSync(new URL('planning21.js',www),'utf8'));run('validSession=true');
const results=[];
for(const area of ['Hoy','Entrenamiento','Alimentación','Suplementación','Cardio','Sueño','Equipo','Progreso','Perfil','Plato','Máquinas','Chat']){run(`go(${JSON.stringify(area)})`);assert.ok(node('view').innerHTML.length>40,area);}
results.push('12 generadores de pantalla sin excepciones (DOM mínimo, no navegador)');
const setValues={setName13:'Prensa',setKg13:'30',loadMode13:'side',setReps13:'10',setRir13:'2',setNote13:'Asiento 4'};
for(const [id,value] of Object.entries(setValues))node(id).value=value;
run('commitSet13()');assert.equal(run('s.logs.at(-1).kg'),60);assert.equal(run('s.logs.at(-1).rir'),2);assert.match(node('notice').textContent,/dispositivo/);
results.push('Carga por lado y RIR se conservan, persistencia local indicada');
const end=new Date();end.setSeconds(0,0);const start=new Date(+end-8*3600000);
for(const [id,value] of Object.entries({start:start.toISOString(),end:end.toISOString(),awake:'0',need:'8',sore:'',tired:'',muscle:'',restType:'Noche'}))node(id).value=value;
run('sleepSave({preventDefault(){}})');assert.equal(run('s.logs.at(-1).minutes'),480);assert.equal(run('s.logs.at(-1).sore'),null);
const count=run('s.logs.length');node('awake').value='-30';run('sleepSave({preventDefault(){}})');assert.equal(run('s.logs.length'),count);assert.match(node('notice').textContent,/Comprueba/);
results.push('Sueño con valoraciones opcionales; rechazo de minutos despierto negativos');
assert.equal(run("VeraActions.interpret('No dormí 8 horas')"),null);assert.equal(run("VeraActions.interpret('No hice press banca 3x10 con 40 kg')"),null);
results.push('Negaciones explícitas no generan registros de sueño o entrenamiento');
const meal=run("mealTotals14([{name:'A',grams:200,energy:100,protein:10,carbs:15,fat:3},{name:'B',grams:50,energy:200,protein:20,carbs:'',fat:4}])");
assert.equal(meal.value,300);assert.equal(meal.protein,30);assert.equal(meal.carbs,null);assert.equal(meal.fat,8);assert.equal(meal.ingredients[0].protein,20);
assert.throws(()=>run("mealTotals14([{name:'A',grams:100,energy:100,protein:-1}])"),/nutrientes/);
results.push('Macros por ingrediente escalan con gramos y mantienen ausencias como null');

run("draft={ingredients:[{name:'A',grams:100,kcal:100,protein:null,carbs:20,fat:1},{name:'B',grams:100,kcal:100,protein:4,carbs:20,fat:1}]}");node('ing0').value='100';node('ing1').value='100';assert.equal(run('ingredientValues().protein'),null);assert.equal(run('ingredientValues().kcal'),200);
results.push('Nutriente desconocido permanece null, no se convierte en cero');
run("s.logs=Array.from({length:800},(_,i)=>({id:'set'+i,kind:'Entrenamiento',date:day(),note:'Press con mancuernas. '.repeat(10),kg:30,reps:[10]}));s.profile.name='Alice';s.profile.password='must-not-travel'");
const payload=run("buildCoachPayload14('Compara mis últimas ocho semanas')");
assert.equal(payload.logs.length,120);assert.equal(payload.contextCoverage.total,800);assert.equal(payload.contextCoverage.included,120);assert.equal(payload.contextCoverage.truncated,true);assert.equal(payload.logs[0].id,'set680');
assert.ok(Buffer.byteLength(JSON.stringify(payload))<90000);assert.ok(!JSON.stringify(payload).includes('must-not-travel'));
assert.match(run("contextCoverage14({contextCoverage:buildCoachPayload14('Compara').contextCoverage})"),/no analiza todo/);
results.push('800 series se acotan a las 120 recientes antes de envío, cobertura parcial explícita y <90KB');
run("s.logs.forEach(row=>row.note='🏋️'.repeat(2000));s.turns=Array.from({length:20},()=>({question:'Q'.repeat(5000),answer:'A'.repeat(20000)}));s.memory=Array.from({length:50},()=> 'M'.repeat(10000))");
const large=run("buildCoachPayload14('Compara')");assert.ok(Buffer.byteLength(JSON.stringify(large))<=90000);assert.ok(large.logs.length<120);assert.equal(large.contextCoverage.included,large.logs.length);assert.equal(large.contextCoverage.fieldsShortened,true);assert.ok(large.history.length<=4);assert.ok(large.memory.length<=20);
results.push('Presupuesto UTF8 real reduce notas multibyte e historial y conserva cobertura correcta');
run('s.logs=[];s.turns=[];s.memory=[]');

const escaped=run("VeraActions.markdown('<img src=x onerror=alert(1)> [x](javascript:alert(1))')");assert.ok(!escaped.includes('<img'));assert.ok(!escaped.includes('href="javascript'));
results.push('Markdown escapa HTML y enlaces ejecutables');
run('VeraPrivacy6.set(true)');assert.equal(run("VeraPrivacy6.allowed('cloud')"),true);run("sessionStorage.veraUser='https://test/bob'");assert.equal(run("VeraPrivacy6.allowed('cloud')"),false);run("sessionStorage.veraUser='https://test/alice'");
results.push('Consentimiento aislado por cuenta');
const groqCapabilities={apiVersion:'2.0',ai:{routingVersion:2,providers:['groq','gemini'],execution:'cloud-only',localInference:false,speechOutput:'remote',routes:Object.fromEntries(Object.entries({coach:'groq',coach_deep:'gemini',intro:'groq',photo:'gemini',machine:'gemini',label:'gemini',listen:'groq',speak:'gemini'}).map(([k,provider])=>[k,{provider,configured:true,model:'fixture'}]))}};
for(const fixture of [{ok:false},{ok:true,config:{apiVersion:'2.0',ai:{provider:'openai',configured:true}}},{ok:true,config:{...groqCapabilities,ai:{...groqCapabilities.ai,routes:{...groqCapabilities.ai.routes,coach:{provider:'groq',configured:false}}}}}]){
 let posts=0;ctx.fetch=async(url,options)=>{if(options.method==='POST'){posts++;throw Error('Data must not be sent');}return {ok:fixture.ok,json:async()=>fixture.config};};
 assert.match(await run("api('coach',{question:'private fixture'}).then(()=>'',e=>e.message)"),/Esta función no está disponible|todavía no tiene configurado/);assert.equal(posts,0);
}
results.push('Servidor antiguo404, proveedor distinto y Groq sin configurar bloquean POST IA');
let cloudPosts=0;ctx.fetch=async(url,options)=>{if(String(url).endsWith('/capabilities')){assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>groqCapabilities};}cloudPosts++;assert.equal(options.headers.Authorization,'Bearer token-a');return {ok:true,status:200,json:async()=>({answer:'Groq fixture'})};};
assert.equal((await run("api('coach',{question:'fixture'})")).answer,'Groq fixture');assert.equal(cloudPosts,1);
results.push('GroqV2 habilitado permite POST autenticado; capabilities no recibe token ni datos de usuario');
run("s.profile.name='Alice';s.preferLocal=true");node('question');const beforeCloudOnly={logs:run('s.logs.length'),turns:run('s.turns.length')};ctx.fetch=async()=>{throw Error('offline');};await run("ask('Bebí 250 ml de agua')");assert.equal(run('s.logs.length'),beforeCloudOnly.logs);assert.equal(run('s.turns.length'),beforeCloudOnly.turns);assert.match(node('notice').textContent,/comprobar el servidor/);
results.push('Chat sin conexión no responde ni registra por parser/modelo local, incluso con preferencia antigua');
let decodeResolver,mediaPosts=0;
ctx.FileReader=class{readAsDataURL(){this.result='data:image/jpeg;base64,AA==';this.onload();}};
ctx.Image=class{decode(){return new Promise(resolve=>decodeResolver=resolve);}};
ctx.fetch=async()=>{mediaPosts++;throw Error('Image must not be sent after account change');};
for(const id of ['estimate','machineResult','suppResult','gymNow'])node(id);
for(const fn of ['preparePhoto','machineFile','labelSearch11','attachChat','plate12']){
 run("sessionStorage.veraUser='https://test/alice';sessionStorage.veraToken='token-a';s=initial();validSession=true");decodeResolver=null;ctx.fixtureMediaInput={files:[{}],isConnected:true};
 const task=run(fn+'(fixtureMediaInput)');for(let i=0;i<20&&!decodeResolver;i++)await Promise.resolve();assert.ok(decodeResolver,fn);
 run("sessionStorage.veraUser='https://test/bob';sessionStorage.veraToken='token-b';s=initial();photoData='B-photo';machinePhoto='B-machine';machinePlate='B-plate';attached={src:'B-attached'}");
 decodeResolver();await task;
 assert.equal(run('photoData'),'B-photo',fn);assert.equal(run('machinePhoto'),'B-machine',fn);assert.equal(run('machinePlate'),'B-plate',fn);assert.equal(run('attached.src'),'B-attached',fn);
}
assert.equal(mediaPosts,0);results.push('Cinco flujos de imagen descartan decode tardío de otra cuenta sin mutar ni enviar datos');
let recorder,stoppedTracks=0,audioPosts=0;
ctx.navigator={mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stoppedTracks++;}}]})}};
ctx.MediaRecorder=class{constructor(){recorder=this;this.mimeType='audio/webm';this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';this.stopped=this.onstop();}};
run("sessionStorage.veraUser='https://test/alice';sessionStorage.veraToken='token-a';s=initial();validSession=true;VeraPrivacy6.set(true)");
ctx.fetch=async(url,options)=>{if(options.method==='POST')audioPosts++;return {ok:true,json:async()=>groqCapabilities};};
await run('dictate()');assert.equal(recorder.state,'recording');run("sessionStorage.veraUser='https://test/bob';sessionStorage.veraToken='token-b';s=initial()");recorder.stop();await recorder.stopped;
assert.equal(stoppedTracks,1);assert.equal(audioPosts,0);assert.match(node('notice').textContent,/descartado/);
results.push('Audio de otra sesión se descarta antes de listen y se liberan pistas del micrófono');
run("sessionStorage.veraUser='https://test/alice';sessionStorage.veraToken='token-a';s=initial();clearSessionMedia14();validSession=true;VeraPrivacy6.set(true)");


let resolveResponse;ctx.fetch=url=>String(url).endsWith('/capabilities')?Promise.resolve({ok:true,json:async()=>groqCapabilities}):new Promise(resolve=>resolveResponse=resolve);
const pending=run("api('nickname',{nick:'nuevo'}).then(()=>null,e=>e.message)");run("sessionStorage.veraUser='https://test/bob';sessionStorage.veraToken='token-b';s=initial();validSession=true;");resolveResponse({status:401,ok:false,json:async()=>({error:'expired'})});assert.match(await pending,/sesión ha cambiado/);assert.equal(run('validSession'),true);assert.equal(run('sessionStorage.veraToken'),'token-b');
results.push('Respuesta 401 de sesión antigua no altera sesión nueva');
resolveResponse=null;run('VeraPrivacy6.set(true)');const revoked=run("api('coach',{}).then(()=>null,e=>e.message)");for(let i=0;i<20&&!resolveResponse;i++)await Promise.resolve();assert.ok(resolveResponse);run('VeraPrivacy6.set(false)');resolveResponse({status:200,ok:true,json:async()=>({answer:'ignored'})});assert.match(await revoked,/revocado/);
results.push('Respuesta IA en vuelo descartada tras revocar consentimiento');
run("localStorage.setItem(storageKey(),'{broken');s=loadVeraState(storageKey())");assert.throws(()=>run('save()'),/conserva intacto/);assert.equal(run('localStorage.getItem(storageKey())'),'{broken');assert.throws(()=>run('validateVeraState({profile:null,logs:[],turns:[]})'),/válido/);
results.push('JSON corrupto se conserva y bloquea escritura; backup inválido rechazado');
run("stateReadError='';blockedStateKey='';s=initial()");const realSet=storage.setItem;storage.setItem=()=>{throw Error('quota');};assert.throws(()=>run('save()'),/No se ha guardado/);assert.match(node('notice').textContent,/lleno o bloqueado/);storage.setItem=realSet;
results.push('Almacenamiento lleno no informa de guardado exitoso');

// Regression: the old single-provider/guest grant never grants Gemini consent.
run("stateWriteError='';s=initial();sessionStorage.veraUser='https://test/new';sessionStorage.veraToken='new-token';localStorage.setItem(VeraPrivacy6.key('cloud'),'yes')");
assert.equal(run("VeraPrivacy6.allowed('cloud')"),false);assert.match(run('VeraPrivacy6.prompt()'),/Groq.*Gemini/);
run("delete sessionStorage.veraUser;delete sessionStorage.veraToken;VeraPrivacy6.set(true)");assert.equal(run("VeraPrivacy6.allowed('cloud')"),false);assert.equal(map.get('vera.permission.cloud.scope.guest'),undefined);
run("sessionStorage.veraUser='https://test/new';sessionStorage.veraToken='new-token';VeraPrivacy6.set(false)");assert.equal(run('VeraPrivacy6.prompt()'),'');
for(const [id,value] of Object.entries(setValues))node(id).value=value;run('commitSet13()');assert.equal(run('s.logs.length'),1);
let deniedPosts=0;ctx.fetch=async()=>{deniedPosts++;throw Error('unexpected');};await assert.rejects(run("api('coach',{})"),/análisis remoto/);assert.equal(deniedPosts,0);
results.push('Permiso anterior Groq y guest no autorizan Gemini; denegar permite guardar serie y bloquea IA sin red');
run('VeraPrivacy6.set(true)');let routesPosted=[];
const withoutGemini=structuredClone(groqCapabilities);for(const route of Object.values(withoutGemini.ai.routes))if(route.provider==='gemini')route.configured=false;
ctx.fetch=async(url,options)=>String(url).endsWith('/capabilities')?{ok:true,json:async()=>withoutGemini}:{ok:true,status:200,json:async()=>{routesPosted.push(String(url).split('/').at(-1));return {answer:'fixture'};}};
await run("api('coach',{mode:'standard'})");await assert.rejects(run("api('coach',{mode:'deep'})"),/Gemini/);await assert.rejects(run("api('photo',{})"),/Gemini/);assert.deepEqual(routesPosted,['coach']);
const invalidRoute=structuredClone(groqCapabilities);invalidRoute.ai.routes.photo.provider='groq';ctx.fetch=async()=>({ok:true,json:async()=>invalidRoute});await assert.rejects(run("api('photo',{})"),/no está disponible/);
results.push('Rutas separadas: Groq funciona sin Gemini; deep y fotos bloqueadas sin su proveedor; proveedor de ruta incorrecto rechazado');
let postedMode;
ctx.fetch=async(url,options)=>String(url).endsWith('/capabilities')?{ok:true,json:async()=>groqCapabilities}:{ok:true,status:200,json:async()=>{postedMode=JSON.parse(options.body).mode;return {answer:'fixture',reports:[]};}};
run("s.profile.name='Alice';s.coachMode=undefined");await run("ask('Compara mis sesiones')");assert.equal(postedMode,'standard');run("s.coachMode='deep'");await run("ask('Revisión avanzada de sesiones')");assert.equal(postedMode,'deep');
results.push('Consulta real ask usa standard por defecto y sólo envía deep tras elección explícita');
// Actual machine form must produce the same load as the quick-series form.
run("s.logs=[];kind='Entrenamiento'");for(const [id,value] of Object.entries({date:run('day()'),detail:'Asiento 4',amount:'',machine:'Prensa',rom:'Completo',mode:'Por lado',group:'Piernas',effort:'',pump:'',soreness:'',reps:'10',exercise:'Prensa',load:'30',rir:''}))node(id).value=value;
run('add({preventDefault(){}})');assert.equal(run('s.logs[0].kg'),60);assert.equal(run('s.logs[0].enteredKg'),30);assert.equal(run('s.logs[0].rir'),null);
assert.equal(run("trainingVolume14([{kg:30,mode:'Por lado',reps:[10]},{kg:60,loadMode:'side',reps:[10]},{kg:40,mode:'Asistencia',reps:[10]}])"),1200);
results.push('Máquina 30 por lado equivale a 60 total; lectura heredada no duplica cargas normalizadas; asistencia excluida del volumen');
for(const [field,value] of [['rir','11'],['reps','301'],['reps',Array(101).fill('1').join(',')]]){node(field).value=value;run('add({preventDefault(){}})');assert.equal(run('s.logs.length'),1);node('rir').value='';node('reps').value='10';}
node('rir').value='10';node('reps').value='300';run('add({preventDefault(){}})');assert.equal(run('s.logs.length'),2);assert.equal(run('s.logs[1].rir'),10);
results.push('Ruta máquina rechaza RIR11, repeticiones301 y 101series; acepta RIR10 y 300repeticiones');
run("s.logs=[{id:'correct-me',kind:'Entrenamiento',date:day(),exercise:'Prensa',kg:300,reps:[10],rir:2,note:'Prensa · 300 kg'}];s.turns=[{inputIds:['correct-me'],answer:'fixture',reports:[]}];editRecord(0)");assert.match(node('view').innerHTML,/correctKg/);
for(const [id,value] of Object.entries({correctExercise:'Prensa',correctDate:run('day()'),correctKg:'30',correctMode:'total',correctReps:'10',correctRir:'',correctTrainingNote:'Ajustado'}))node(id).value=value;
run('applyEdit(0)');assert.equal(run('s.logs[0].kg'),30);assert.equal(run('s.logs[0].id'),'correct-me');assert.equal(run('s.turns[0].stale'),true);assert.equal(run("buildCoachPayload14('Revisa').logs[0].kg"),30);assert.equal(run('trainingVolume14(s.logs)'),300);assert.ok(!run('s.logs[0].note').includes('300 kg'));
const beforeBadEdit=run('JSON.stringify(s.logs[0])');node('correctReps').value='301';run('applyEdit(0)');assert.equal(run('JSON.stringify(s.logs[0])'),beforeBadEdit);
results.push('Corrección300→30 modifica campos, volumen, payload y decisiones; conservaID y no muta ante corrección inválida');
run("const earlier14=new Date();earlier14.setDate(earlier14.getDate()-1);s.logs=[{kind:'Entrenamiento',date:day(),exercise:'Prensa',kg:50,reps:[10]},{kind:'Entrenamiento',date:day(earlier14),exercise:'Prensa',kg:40,reps:[10]}]");assert.match(run('recordFor(s.logs[0])'),/Récord de carga/);run('s.logs.reverse()');assert.match(run('recordFor(s.logs[1])'),/Récord de carga/);run('s.logs[0].date=day()');assert.match(run('recordFor(s.logs[1])'),/Sin referencia de días anteriores/);
results.push('Marcas independientes del orden de llegada; no se inventa cronología entre series del mismo día');
run("s.logs=[0,27,28,-1].map(n=>{const d=new Date();d.setDate(d.getDate()-n);return {kind:'Entrenamiento',date:day(d),exercise:'Prensa',kg:10,reps:[1]}});s.logs.push({kind:'Entrenamiento',date:'2026-02-30',kg:10,reps:[1]})");assert.equal(run('trainingRows14(28).length'),2);assert.equal(run('trainingVolume14(trainingRows14(28))'),20);
results.push('Ventana28 incluye hoy/hoy-27 y excluye hoy-28, mañana y fecha inválida');
// Remote audio starts after explicit speech request, without a second play button.
let audioPaused=0,audioCreated=0,audioPlayed=0,audioPostResolve;
document.createElement=tag=>{assert.equal(tag,'audio');audioCreated++;return {async play(){audioPlayed++;},setAttribute(){},pause(){audioPaused++;},removeAttribute(){},load(){}};};node('speechPlayer14').append=()=>{};
run("s=initial();s.turns=[{answer:'Respuesta de prueba'}];validSession=true");
ctx.fetch=async(url,options)=>String(url).endsWith('/capabilities')?{ok:true,json:async()=>groqCapabilities}:new Promise(resolve=>audioPostResolve=resolve);
let speech=run('VeraSpeech14.speak(0)');for(let i=0;i<30&&!audioPostResolve;i++)await Promise.resolve();assert.ok(audioPostResolve);run('VeraSpeech14.stop()');audioPostResolve({ok:true,status:200,blob:async()=>new Blob(['fixture'],{type:'audio/wav'})});await speech;assert.equal(audioCreated,0);
audioPostResolve=null;speech=run('VeraSpeech14.speak(0)');for(let i=0;i<30&&!audioPostResolve;i++)await Promise.resolve();run('VeraPrivacy6.set(false)');audioPostResolve({ok:true,status:200,blob:async()=>new Blob(['fixture'],{type:'audio/wav'})});await speech;assert.equal(audioCreated,0);
run('VeraPrivacy6.set(true)');audioPostResolve=null;speech=run('VeraSpeech14.speak(0)');for(let i=0;i<30&&!audioPostResolve;i++)await Promise.resolve();audioPostResolve({ok:true,status:200,blob:async()=>new Blob(['fixture'],{type:'audio/wav'})});await speech;assert.equal(audioCreated,1);assert.equal(run('VeraSpeech14.audio.controls'),false);assert.equal(audioPlayed,1);assert.equal(run('VeraSpeech14.audio.autoplay'),undefined);run('render()');assert.equal(audioPaused,1);assert.equal(run('VeraSpeech14.url'),null);
results.push('Audio remoto WAV con controles sin autoplay; cancelar/revocar descarta respuesta pendiente; navegar pausa y liberaURL');
run('VeraPrivacy6.set(true)');audioPostResolve=null;speech=run('VeraSpeech14.speak(0)');for(let i=0;i<30&&!audioPostResolve;i++)await Promise.resolve();const priorAudioCreated=audioCreated;run("sessionStorage.veraUser='https://test/other';sessionStorage.veraToken='other-token';s=initial();VeraPrivacy6.set(true)");audioPostResolve({ok:true,status:200,blob:async()=>new Blob(['fixture'],{type:'audio/wav'})});await speech;assert.equal(audioCreated,priorAudioCreated);assert.equal(run('VeraSpeech14.url'),null);
results.push('Audio pendiente de A no crea reproductor ni URL al abrir cuenta B');


for(const file of readdirSync(www).filter(x=>x.endsWith('.js')))new vm.Script(readFileSync(new URL(file,www),'utf8'),{filename:file});
results.push('Sintaxis de todos los scripts JavaScript e inline válida');
const shipped=readdirSync(www);assert.ok(!shipped.some(name=>/\.(gguf|onnx|wasm|gz)$/.test(name)));assert.ok(!shipped.some(name=>/^(local|ocr|ort|ai5|diario5|vision-labels)/.test(name)));assert.ok(shipped.includes('qr.js')&&shipped.includes('list7.js'));
const source=html+shipped.filter(name=>name.endsWith('.js')&&name!=='qr.js').map(name=>readFileSync(new URL(name,www),'utf8')).join('');assert.ok(!/Tesseract|SpeechSynthesis|speechSynthesis|VeraNative\.(say|dictate|chooseVoice)|veraGenerate|visualCandidates|localAnswer|VeraDiary|VeraActions.handle/.test(source));
assert.ok(!/IA local gratuita|Probar IA local|Escuchar respuesta/.test(html));assert.match(html,/Vera · Groq/);
results.push('Distribución sin pesos ni runtimes IA local, OCR ni reconocimiento/TTS del sistema; QR y catálogo conservados');

console.log(JSON.stringify({suite:'Frontend unit/integration with VM and minimal DOM; no browser or live APIs',passed:results.length,results},null,2));
