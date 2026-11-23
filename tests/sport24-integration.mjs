import {readFileSync} from 'node:fs';
let harness=readFileSync(new URL('./audit-frontend-unit.mjs',import.meta.url),'utf8').split('const results=[];')[0];harness=harness.replace("new URL('../www/',import.meta.url)",'new URL('+JSON.stringify(new URL('../www/',import.meta.url).href)+')');harness+=`
ctx.googleLinked23=()=>true;ctx.healthAccess23=()=>({complete:true});
run(readFileSync(new URL('sport24.js',www),'utf8'));
run("go('Cardio')");assert.ok(node('view').innerHTML.includes('Iniciar GPS'));assert.ok(node('view').innerHTML.includes('sportSwimMode24'));assert.ok(node('view').innerHTML.includes('Aguas abiertas'));
run("go('Entrenamiento')");assert.ok(node('view').innerHTML.includes('Ciclismo · carrera · natación'));
console.log('PASS sport24 integration: actual Cardio and training generators with swimming mode and native GPS entry');
`;await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
