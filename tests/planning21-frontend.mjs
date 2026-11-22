import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
let code=readFileSync(new URL('tests/audit-frontend-unit.mjs',base),'utf8').split('const results=[];')[0];
code=code.replace("new URL('../www/',import.meta.url)",'new URL('+JSON.stringify(new URL('www/',base).href)+')');
code+=`
run("s=initial();s.turns=[{entries:[{kind:'Comida',date:day(),value:500,protein:30,carbs:50,fat:20,nutrients:{iron_mg:2},note:'Cena'},{kind:'Sueño',date:day(),value:8,note:'Noche'}]}]");
node('candidate21_0_0_value').value='550';node('candidate21_0_0_note').value='Cena corregida';run('acceptAll21(0)');
assert.equal(run('s.logs.length'),2);assert.equal(run('s.logs[0].value'),550);assert.equal(run('s.logs[0].protein'),30);assert.equal(run('s.logs[0].nutrients.iron_mg'),2);assert.equal(run('s.logs[0].note'),'Cena corregida');
run('acceptAll21(0)');assert.equal(run('s.logs.length'),2);
assert.equal(JSON.parse(map.get(run('storageKey()'))).logs.length,2);
const sig=run('planSignature21()');run("s.logs[0].protein=31");assert.notEqual(run('planSignature21()'),sig);
assert.ok(run('planSignature21().length')<80);
run("s.turns.push({entries:[{kind:'Agua',date:day(),value:250},{kind:'Sueño',date:'2026-02-30',value:8}]})");run('acceptAll21(1)');assert.equal(run('s.logs.length'),2);
run("go('Equipo')");assert.match(node('view').innerHTML,/Tu semana, en equipo/);assert.match(node('view').innerHTML,/Opinión sobre mi estado general/);
run("go('Progreso')");assert.match(node('view').innerHTML,/Nutrición y peso/);
console.log('PASS: historic edits, structured nutrients, atomic batch, repeated confirmation idempotent, persistent diary and integrated screens');
`;
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
