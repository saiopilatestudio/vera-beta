const VeraDiary = (() => {
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const dates = /\b(anteayer|ayer|hoy|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|\d{4}-\d\d-\d\d|\d{1,2}\/\d{1,2}(?:\/\d{4})?)\b/gi;
  function resolve(token, ref) {
    const d=new Date(ref), t=normalize(token);
    const weekday=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'].indexOf(t);
    const offset=['hoy','ayer','anteayer'].indexOf(t);
    if(weekday>=0)d.setDate(d.getDate()-(7+d.getDay()-weekday)%7);
    else if(offset>=0)d.setDate(d.getDate()-offset);
    else {
      const parts=t.split(/[-/]/).map(Number);
      const [y,m,q]=t.includes('-')?parts:[parts[2]||d.getFullYear(),parts[1],parts[0]];
      d.setFullYear(y,m-1,q);
      if(d.getMonth()!==m-1||d.getDate()!==q)return null;
    }
    return day(d);
  }
  function parse(text,ref=new Date()){
    if(/[¿?]/.test(text)||/\b(manana|deberia|podria|quiero hacer|quiero saber|puedo|recomienda|prepara|voy a)\b/.test(normalize(text)))return [];
    const rows=[]; let date=day(ref);
    for(let line of text.split(/\n|;|\.\s+|,?\s+y\s+(?=(?:el )?(?:anteayer|ayer|hoy|lunes|martes|miércoles|jueves|viernes|sábado|domingo))|,\s*(?=(?:anteayer|ayer|hoy))/i)){
      const found=[...line.matchAll(dates)];
      if(found.length>1){for(const [i,m] of found.entries())rows.push(...parse(line.slice(m.index,found[i+1]?.index),ref));continue;}
      if(found.length){date=resolve(found[0][0],ref);line=line.replace(dates,'');}
      if(!date||date>day(ref))continue;
      for(let part of line.split(/\s+y\s+(?=(?:hice|entrené|corrí|caminé|tomé|comí|dormí|bebí|press|remo|curl|sentadilla|prensa|jalón))/i)){
        part=part.trim().replace(/^[,.:\s]+|[,.:\s]+$/g,'');
        const t=normalize(part);
        const kind=/\b(corri|camine|cardio|cinta|eliptica|bici)\b/.test(t)?'Cardio':/\b(dormi|siesta)\b/.test(t)?'Sueño':/creatina|whey|glutamina|bcaa|multivitamin|suplemento/.test(t)?'Suplemento':/\b(agua|bebi)\b/.test(t)?'Agua':/\b(comi|cene|almorce|desayune)\b/.test(t)?'Comida':/\b(hice|entrene|press|remo|pesas|jalon|sentadilla|prensa|curl|dominadas)\b|\d\s*[x×]\s*\d/.test(t)?'Entrenamiento':null;
        if(!kind||/\bno (hice|entrene|comi|bebi|tome|corri)\b/.test(t))continue;
        const pattern=kind==='Cardio'||kind==='Sueño'?/(\d+(?:[.,]\d+)?)\s*(min|hora|h)/:kind==='Agua'?/(\d+(?:[.,]\d+)?)\s*(ml|litro|l)/:null;
        const n=pattern&&t.match(pattern);
        let value=n?Number(n[1].replace(',','.')):null;
        if(n&&kind==='Cardio'&&n[2]!=='min')value*=60;
        if(n&&kind==='Sueño'&&n[2]==='min')value/=60;
        if(n&&kind==='Agua'&&n[2]!=='ml')value*=1000;
        const row={kind,date,value,note:part},sets=t.match(/(\d+)\s*[x×]\s*(\d+)/),kg=t.match(/(\d+(?:[.,]\d+)?)\s*kg/);
        if(kind==='Entrenamiento'&&sets&&+sets[1]>0&&+sets[1]<=40&&+sets[2]>0&&+sets[2]<=150&&kg){
          row.exercise=part.slice(0,sets.index).replace(/^(el\s+)?(hice|entrené)\s+/i,'').trim()||'Ejercicio';
          row.reps=Array(+sets[1]).fill(+sets[2]);row.kg=Number(kg[1].replace(',','.'));
        }
        rows.push(row);
      }
    }
    return rows;
  }
  function recall(q,logs){
    if(!/que (hice|entrene|registre)|(?:muestrame|recuerdame) (?:mi|el) entrenamiento/.test(normalize(q)))return null;
    const rows=logs.filter(l=>['Entrenamiento','Cardio'].includes(l.kind));
    const days=[...q.matchAll(dates)].map(m=>resolve(m[0],new Date()));
    if(!days.length)days.push(rows.map(l=>l.date).sort().at(-1)||day());
    return days.map(d=>d+' · '+(rows.filter(l=>l.date===d).map(l=>l.note||l.exercise||l.kind).join('\n')||'Sin entrenamiento confirmado.')).join('\n\n');
  }
  return {parse,recall};
})();
