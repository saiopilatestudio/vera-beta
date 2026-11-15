function presentation10(x){
 const form=(x.form||'')+' '+(x.name||'');
 for(const [pattern,unit] of [[/capsul|softgel/i,'cápsulas'],[/tablet|pill|comprimid/i,'comprimidos'],[/gumm|gominola/i,'gominolas'],[/drop|gotas/i,'gotas'],[/liquid|drink|líquid/i,'ml'],[/powder|whey|polvo/i,'g']])if(pattern.test(form))return unit;
 return '';
}
function compare10(items){
 const rows=items.map((x,i)=>'<tr><td><b>'+safe(x.brand||x.name.split(' · ')[0])+'</b><br>'+safe(x.name.split(' · ').slice(1).join(' · ')||x.name)+'</td><td>'+safe(presentation10(x)||'Consultar etiqueta')+(x.pack?'<br><small>Envase '+safe(x.pack)+'</small>':'')+'</td><td>'+btn('Elegir','VeraCatalog.pick('+i+')')+'</td></tr>');
 return rows.length?'<table class="compare"><caption>Comparar referencias</caption><thead><tr><th>Marca y producto</th><th>Unidad / envase</th><th></th></tr></thead><tbody>'+rows.join('')+'</tbody></table>':'';
}
function nickPanel(){return '<section><h3>Tu nick</h3>'+field('nick10','Nombre para retos',s.profile.nick||'','text','maxlength="24" autocomplete="nickname"')+btn('Guardar nick','saveNick10()')+'</section>';}
async function saveNick10(){try{const d=await api('nickname',{nick:$('nick10').value.trim()});s.profile.nick=d.nick;save();render();msg('Nick guardado: @'+d.nick);}catch(e){msg(e.message);}}
