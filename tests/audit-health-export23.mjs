import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const owner='https://vera-beta.onrender.com/'+'a'.repeat(32),calls=[];const context=vm.createContext({console,Date,Map,Set,JSON,URL,AbortSignal,queueMicrotask,setTimeout,clearTimeout,setInterval,clearInterval,validSession:true,sessionStorage:{veraUser:owner,veraToken:'token'},document:{hidden:false,addEventListener(){}},window:{VeraNative:{healthPermissions23:()=>JSON.stringify({supported:true,complete:true})}},s:{logs:[],diaryRevisions:{}}});
for(const file of ['metrics21.js','google23.js'])vm.runInContext(await readFile(new URL('../www/'+file,import.meta.url),'utf8'),context);
const make=(extra={})=>({id:'supp1',date:'2026-01-01',kind:'Suplemento',kcal:100,protein:20,mixingLiquid:{type:'milk',ml:200,per100ml:{kcal:50,protein:3}},...extra});
const set=(rows,rev=1)=>{context.s.logs=rows;context.s.diaryRevisions=Object.fromEntries(rows.map(row=>[row.id,{rev,raw:JSON.stringify(row)}]));};
let row=make();set([row]);let exported=vm.runInContext('healthRecords23(s.logs,s.diaryRevisions,sessionStorage.veraUser)',context);assert.equal(exported.length,2);assert.equal(exported[0].owner,'a'.repeat(32),'native owner is canonical uid, not account URL');assert.equal(exported.find(x=>x.type==='NUTRITION').value,200);assert.equal(exported.find(x=>x.type==='NUTRITION').protein,26);assert.equal(exported.find(x=>x.type==='HYDRATION').value,200);
context.s.logs[0].protein=30;assert.equal(vm.runInContext('healthRecords23(s.logs,s.diaryRevisions,sessionStorage.veraUser).length',context),0);
set([make({source:'health'})]);assert.equal(vm.runInContext('healthRecords23(s.logs,s.diaryRevisions,sessionStorage.veraUser).length',context),0);
const native=context.window.VeraNative;for(const [method,kind]of [['writeHealth23','write'],['deleteHealth23','delete']])native[method]=(ticket,json)=>{calls.push({kind,rows:JSON.parse(json)});queueMicrotask(()=>context.healthWritten23(ticket,true));};
vm.runInContext("googleOwner23=sessionStorage.veraUser;googleToken23=sessionStorage.veraToken;googleState23={linked:true}",context);
set([make()]);assert.equal(await context.exportHealth23(),true);assert.ok(calls.some(c=>c.kind==='write'));const n=calls.length;await context.exportHealth23();assert.equal(calls.length,n,'unchanged server revisions are not written twice');
set([make({mixingLiquid:undefined})],2);await context.exportHealth23();assert.ok(calls.slice(n).some(c=>c.kind==='delete'&&c.rows.some(r=>r.type==='HYDRATION'&&r.id==='supp1')),'removing mixing liquid deletes only its hydration');
context.s.logs=[];context.s.diaryRevisions={supp1:{rev:3,raw:'null'}};const before=calls.length;await context.exportHealth23();assert.equal(calls.slice(before).filter(c=>c.kind==='write').length,0);assert.equal(calls.slice(before).flatMap(c=>c.rows).length,6,'confirmed tombstone removes all own typed records');
console.log('PASS Health export: combined liquid nutrition, hydration once, ack guard, no health reexport, idempotent versions, liquid removal, confirmed tombstones.');

const nutrientKeys=vm.runInContext('nutrientFields21.map(row=>row[0])',context),allMicros=Object.fromEntries(nutrientKeys.map(key=>[key,10]));
set([make({mixingLiquid:undefined,nutrients:allMicros})],4);
const microExport=vm.runInContext('healthRecords23(s.logs,s.diaryRevisions,sessionStorage.veraUser)',context).find(r=>r.type==='NUTRITION');
assert.equal(Object.keys(microExport.nutrients).length,25);
const writer=await readFile(new URL('../beta-android/HealthWriter23.java',import.meta.url),'utf8'),reader=await readFile(new URL('../beta-android/HealthReader.java',import.meta.url),'utf8');
for(const key of nutrientKeys){assert.ok(writer.includes('micro.has("'+key+'")'),'native writer supports '+key);assert.ok(reader.includes('mass(n,"'+key+'",'),'native reader supports '+key);if(key.endsWith('_ug')||key.endsWith('_mg')){const divisor=key.endsWith('_ug')?1000000:1000;assert.ok(writer.includes('number(micro,"'+key+'",1e7)/'+divisor),'native mass conversion '+key);}}
console.log('PASS: all 25 nutrition fields cross JS/native read/write contract; mg/µg conversions preserved.');
