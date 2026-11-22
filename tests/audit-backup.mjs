import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
let code=readFileSync(new URL('tests/audit-frontend-unit.mjs',base),'utf8').split('const results=[];')[0];
code=code.replace("new URL('../www/',import.meta.url)",'new URL('+JSON.stringify(new URL('www/',base).href)+')');
code+=`
// Exercise the shipped functions with a native bridge fixture, not a real picker.
let exported='';ctx.window.VeraNative.exportBackup=value=>exported=value;ctx.VeraNative=ctx.window.VeraNative;
run("sessionStorage.veraUser='https://test/bob';sessionStorage.veraToken='backup-token';stateReadError='';stateWriteError='';blockedStateKey='';s=initial();s.profile.name='Backup fixture';s.logs=[{id:'stable-id',kind:'Sueño',date:day(),value:8,minutes:480}];s.turns=[{question:'Fixture',answer:'Guardado',reports:[]}];s.memory=['Preferencia'];s.machines=[{id:'machine-1',gym:'Gym',type:'Prensa'}];s.diaryRevisions={'stable-id':{rev:4,raw:'old'}};save();photoData='data:image/jpeg;base64,PHOTO';attached={src:'data:image/jpeg;base64,ATTACHMENT'};machinePhoto='data:image/jpeg;base64,MACHINE';exportVera()");
const backup=JSON.parse(exported);assert.equal(backup.format,'vera-local-backup');assert.equal(backup.version,1);assert.equal(backup.state.profile.name,'Backup fixture');assert.equal(backup.state.logs[0].id,'stable-id');assert.ok(!exported.includes('base64,PHOTO'));assert.ok(!exported.includes('base64,ATTACHMENT'));assert.ok(!exported.includes('backup-token'));
run("s=initial();s.profile.name='Temporary'");ctx.backupInput={value:'selected.json',files:[{size:Buffer.byteLength(exported),text:async()=>exported}]};await run('importVera(backupInput)');
assert.equal(run('s.profile.name'),'Backup fixture');assert.equal(run('s.logs[0].id'),'stable-id');assert.equal(run('s.turns[0].answer'),'Guardado');assert.equal(run('s.machines[0].id'),'machine-1');assert.equal(run('Object.keys(s.diaryRevisions).length'),0);assert.equal(ctx.backupInput.value,'');assert.match(node('notice').textContent,/Datos locales restaurados/);
ctx.confirm=()=>false;run("s.profile.name='Cancel preserves'");await run('importVera(backupInput)');assert.equal(run('s.profile.name'),'Cancel preserves');ctx.confirm=()=>true;
ctx.backupInput={value:'oversize.json',files:[{size:11*1024*1024,text:async()=>exported}]};await run('importVera(backupInput)');assert.equal(run('s.profile.name'),'Cancel preserves');assert.match(node('notice').textContent,/10 MB/);
assert.match(run('profile()'),/Respaldo de mis datos/);assert.match(run('profile()'),/Exportar respaldo JSON/);assert.match(run('profile()'),/Restaurar respaldo/);assert.match(run('versionInfo()'),/Vera 2.3 beta/);assert.match(run('versionInfo()'),/Build: 230/);assert.equal(run('storageKey()'),'vera.v2.https://test/bob');
console.log(JSON.stringify({releaseChecks:'PASS',backupFormat:backup.format,backupVersion:backup.version,roundTrip:['profile','logs','turns','memory','machines'],restoredRevisions:'reset',cancelPreserves:true,maxImportBytes:10*1024*1024,photosExported:false,nativePicker:'not exercised',version:'2.3 beta',build:230},null,2));
`;
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
