import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {db,rows} from './storage.mjs';
const fail=(message,status=422)=>Object.assign(Error(message),{status});
export const nutrientKeys24=['kcal','protein','carbs','fat','fiber_g','sugar_g','sodium_mg','potassium_mg','calcium_mg','iron_mg','magnesium_mg','vitaminC_mg','vitaminD_ug','vitaminB12_ug','vitaminA_ug','vitaminE_mg','vitaminB1_mg','vitaminB2_mg','vitaminB3_mg','vitaminB5_mg','vitaminB6_mg','biotin_ug','folate_ug','zinc_mg','manganese_mg','copper_mg','iodine_ug','chromium_ug','selenium_ug'];
export const normalizeProduct24=value=>String(value??'').replace(/[µμ]\s*g/gi,' ug ').replace(/\bmcg\b/gi,'ug').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ').replace(/(\d)\s*(ug|mg|g|ml)\b/g,'$1 $2');
const text=(value,max,required=false)=>{if(value===undefined&&!required)return '';if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw fail('Revisa los datos del producto.');return value.trim();};
function barcode24(value){const code=text(value,14);if(code&&!/^\d{8}$|^\d{12,14}$/.test(code))throw fail('Código de barras no válido.');if(code){let sum=0;for(let i=code.length-2,pos=0;i>=0;i--,pos++)sum+=Number(code[i])*(pos%2===0?3:1);if((10-sum%10)%10!==Number(code.at(-1)))throw fail('El código de barras no supera la comprobación.');}return code;}
export function validateProduct24(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw fail('Ficha de producto no válida.');
 const name=text(input.name,180,true),brand=text(input.brand,100,true),variant=text(input.variant,100,true),kind=input.kind;
 if(!['food','supplement'].includes(kind))throw fail('Selecciona alimento o suplemento.');
 const units=['g','mg','ml','cápsulas','comprimidos','scoops','gotas','gominolas','raciones'];
 if(!units.includes(input.unit)||typeof input.portion!=='number'||!Number.isFinite(input.portion)||input.portion<=0||input.portion>10000)throw fail('Indica cantidad y unidad de la tabla nutricional.');
 if(!input.facts||typeof input.facts!=='object'||Array.isArray(input.facts))throw fail('La tabla nutricional no es válida.');const facts={};
 for(const [key,value]of Object.entries(input.facts)){if(!nutrientKeys24.includes(key))throw fail('Nutriente desconocido: '+key);if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>(key==='kcal'?90000:key.endsWith('_ug')?1e8:key.endsWith('_mg')?1e7:10000))throw fail('Cantidad nutricional no válida.');facts[key]=value;}
 if(['g','mg'].includes(input.unit)){const grams=input.portion/(input.unit==='mg'?1000:1);for(const key of ['protein','carbs','fat','fiber_g','sugar_g'])if(facts[key]>grams*1.05)throw fail('La tabla no coincide con su cantidad de referencia.');if(['protein','carbs','fat'].every(k=>facts[k]!==undefined)&&facts.protein+facts.carbs+facts.fat>grams*1.05)throw fail('Los macronutrientes superan la cantidad de referencia.');}
 const url=text(input.url??input.sourceUrl,1000);if(url){let u;try{u=new URL(url);}catch{throw fail('Fuente no válida.');}if(u.protocol!=='https:'||u.username||u.password)throw fail('La fuente debe ser una dirección HTTPS.');}
 if(input.aliases!==undefined&&(!Array.isArray(input.aliases)||input.aliases.length>12))throw fail('Demasiados alias.');const aliases=[...new Set((input.aliases||[]).map(a=>text(a,180,true)))];
 return {name,brand,variant,kind,form:text(input.form,40),portion:input.portion,unit:input.unit,facts,barcode:barcode24(input.barcode),aliases,url,source:text(input.source??input.sourceNote,500)||'Etiqueta confirmada por ti',...(input.active?{active:text(input.active,500)}:{})};
}
await db.batch([
 'CREATE TABLE IF NOT EXISTS products24(owner TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,search TEXT NOT NULL,barcode TEXT NOT NULL,variant TEXT NOT NULL,kind TEXT NOT NULL,revision INTEGER NOT NULL,updated INTEGER NOT NULL,seed_version TEXT,PRIMARY KEY(owner,id))',
 'CREATE INDEX IF NOT EXISTS products24_barcode ON products24(barcode,owner)',
 'CREATE INDEX IF NOT EXISTS products24_owner ON products24(owner,updated)'
],'write');
const seed=JSON.parse(await readFile(new URL('./product-seeds24.json',import.meta.url),'utf8'));
function searchable(p){return normalizeProduct24([p.name,p.brand,p.variant,...p.aliases].join(' '));}
for(const raw of seed.products){const p={...validateProduct24(raw),id:raw.id,visibility:'official',confirmed:true,identityConfirmed:true,reviewedAt:raw.reviewedAt};await rows('INSERT INTO products24(owner,id,data,search,barcode,variant,kind,revision,updated,seed_version) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET data=excluded.data,search=excluded.search,barcode=excluded.barcode,variant=excluded.variant,kind=excluded.kind,revision=products24.revision+1,updated=excluded.updated,seed_version=excluded.seed_version WHERE products24.seed_version<>excluded.seed_version','',p.id,JSON.stringify(p),searchable(p),p.barcode,normalizeProduct24(p.variant),p.kind,1,Date.now(),seed.version);}
export async function searchProducts24(uid,input={}){
 if(!uid)throw fail('Inicia sesión.',401);const query=normalizeProduct24(text(input.query,180)).replace(/\bzumun\b/g,'zumub'),barcode=barcode24(input.barcode),variant=normalizeProduct24(text(input.variant,100));
 if(input.kind!==undefined&&!['food','supplement'].includes(input.kind))throw fail('Tipo de producto no válido.');const limit=input.limit===undefined?20:input.limit;if(!Number.isInteger(limit)||limit<1||limit>50)throw fail('Límite no válido.');
 let sql='SELECT owner,data,revision FROM products24 WHERE (owner=? OR owner=?)',args=[uid,''];if(barcode){sql+=' AND barcode=?';args.push(barcode);}if(variant){sql+=' AND variant=?';args.push(variant);}if(input.kind){sql+=' AND kind=?';args.push(input.kind);}for(const term of query.split(' ').filter(Boolean)){sql+=' AND instr(search,?)>0';args.push(term);}sql+=' ORDER BY CASE WHEN owner=? THEN 0 ELSE 1 END,updated DESC,id LIMIT ?';args.push(uid,limit);
 return {products:(await rows(sql,...args)).map(row=>({...JSON.parse(row.data),revision:row.revision})),requiresVariantConfirmation:true};
}
export async function confirmProduct24(uid,input){
 if(!uid)throw fail('Inicia sesión.',401);if(input?.confirmed!==true)throw fail('Confirma que la ficha coincide con la etiqueta y variante de tu envase.');const p=validateProduct24(input.product),given=input.product.id;
 let id=given,revision=1;if(given!==undefined){if(typeof given!=='string'||!/^user_[a-f0-9-]{36}$/.test(given))throw fail('Sólo puedes modificar tus fichas privadas.');const old=(await rows('SELECT revision FROM products24 WHERE owner=? AND id=?',uid,given))[0];if(!old)throw fail('La ficha privada no existe.',404);if(input.product.revision!==old.revision)throw fail('La ficha cambió en otro dispositivo. Vuelve a cargarla.',409);revision=old.revision+1;}else{id='user_'+randomUUID();if((await rows('SELECT count(*) AS n FROM products24 WHERE owner=?',uid))[0].n>=2000)throw fail('Has alcanzado el máximo de fichas privadas.',409);}
 const product={...p,id,visibility:'private',confirmed:true,identityConfirmed:true,confirmedAt:new Date().toISOString()};
 if(given){const changed=await rows('UPDATE products24 SET data=?,search=?,barcode=?,variant=?,kind=?,revision=?,updated=? WHERE owner=? AND id=? AND revision=? RETURNING id',JSON.stringify(product),searchable(p),p.barcode,normalizeProduct24(p.variant),p.kind,revision,Date.now(),uid,id,revision-1);if(!changed.length)throw fail('La ficha cambió en otro dispositivo. Vuelve a cargarla.',409);}else await rows('INSERT INTO products24 VALUES(?,?,?,?,?,?,?,?,?,?)',uid,id,JSON.stringify(product),searchable(p),p.barcode,normalizeProduct24(p.variant),p.kind,revision,Date.now(),null);
 return {product:{...product,revision}};
}
// Suggest only exact complete identity. Never copy facts across flavours or brands.
export async function matchLabelProduct24(uid,label){if(!label||!label.brand||!label.product||!label.variant)return null;const found=await searchProducts24(uid,{query:label.brand,variant:label.variant,limit:50});const brand=normalizeProduct24(label.brand),name=normalizeProduct24(label.product);const matches=found.products.filter(p=>normalizeProduct24(p.brand)===brand&&[p.name,...p.aliases].some(n=>normalizeProduct24(n)===name||normalizeProduct24(n)===normalizeProduct24(label.brand+' '+label.product)));return matches.length===1?matches[0]:null;}

export async function labelCatalogMatches24(uid,label){
 if(label?.identityConfidence!=='high'||!label.brand||!label.product||!label.variant)return [];
 const exact=await matchLabelProduct24(uid,label);if(exact)return [exact];
 // Search suggestions remain scoped to the complete brand/product/variant text.
 const result=await searchProducts24(uid,{query:label.brand+' '+label.product,variant:label.variant,limit:8});
 return result.products.filter(p=>normalizeProduct24(p.brand)===normalizeProduct24(label.brand));
}
