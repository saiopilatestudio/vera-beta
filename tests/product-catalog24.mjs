import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'vera-catalog24-'));process.env.VERA_DB=join(temp,'db.sqlite');delete process.env.TURSO_DATABASE_URL;delete process.env.RENDER;
const {searchProducts24,confirmProduct24,matchLabelProduct24,nutrientKeys24,normalizeProduct24}=await import('../product-catalog24.mjs');const {db,rows}=await import('../storage.mjs');
try{
 assert.notEqual(normalizeProduct24('50 µg'),normalizeProduct24('50 g'));assert.equal(normalizeProduct24('50 µg'),normalizeProduct24('50ug'));
 let found=await searchProducts24('alice',{query:'ZÚMUB whey',variant:'chocolate'});assert.equal(found.products.length,2);assert.equal((await searchProducts24('alice',{query:'zumun whey',variant:'Chocolate'})).products.length,2);assert.ok(found.products.every(p=>p.variant==='Chocolate'));assert.equal((await searchProducts24('alice',{query:'zumub whey',variant:'vainilla'})).products.length,0);
 assert.equal((await searchProducts24('alice',{barcode:'5600985801514'})).products[0].facts.vitaminA_ug,160);
 const product={name:'Mi producto único',brand:'Marca prueba',variant:'Vainilla',kind:'supplement',portion:30,unit:'g',facts:Object.fromEntries(nutrientKeys24.map(k=>[k,1])),aliases:['batido favorito'],form:'powder'};
 await assert.rejects(()=>confirmProduct24('alice',{product}),/Confirma/);
 const saved=(await confirmProduct24('alice',{confirmed:true,product})).product;assert.equal(Object.keys(saved.facts).length,29);assert.equal(saved.revision,1);
 assert.equal((await searchProducts24('bob',{query:'batido favorito'})).products.length,0);assert.equal((await searchProducts24('alice',{query:'BATÍDO favorito'})).products[0].id,saved.id);
 await assert.rejects(()=>confirmProduct24('bob',{confirmed:true,product:saved}),/no existe/);
 await assert.rejects(()=>confirmProduct24('alice',{confirmed:true,product:{...saved,id:'ZUMUB-MULTIVITAMIN'}}),/privadas/);
 await assert.rejects(()=>confirmProduct24('alice',{confirmed:true,product:{...saved,revision:0}}),e=>e.status===409);
 const changed=(await confirmProduct24('alice',{confirmed:true,product:{...saved,facts:{protein:25}}})).product;assert.equal(changed.revision,2);assert.equal(changed.facts.protein,25);
 assert.equal((await searchProducts24('alice',{query:'% OR 1=1'})).products.length,0);
 for(const bad of [{portion:0},{unit:'cucharada imaginaria'},{facts:{protein:null}},{facts:{protein:-1}},{facts:{protein:NaN}},{facts:{unknown:2}},{barcode:'5600985801515'},{url:'javascript:alert(1)'},{variant:''}])await assert.rejects(()=>confirmProduct24('alice',{confirmed:true,product:{...product,...bad}}));
 assert.equal(await matchLabelProduct24('alice',{brand:'Zumub',product:'whey',variant:'Chocolate'}),null);
 assert.equal((await matchLabelProduct24('alice',{brand:'Marca prueba',product:'Mi producto único',variant:'Vainilla'})).id,saved.id);
 assert.equal((await rows('SELECT count(*) AS n FROM products24 WHERE owner=?',''))[0].n,8);
 console.log('PASS product catalog: 8 versioned official variants, private isolation, 29 nutritional fields, normalized aliases, EAN validation, CAS edits, exact identity, no flavour substitution.');
}finally{db.close();await rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
