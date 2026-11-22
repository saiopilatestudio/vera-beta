/* Deterministic journal tools. All commits share the active account's normal save path. */
const VeraActions = (() => {
  const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const num = value => Number(String(value).replace(',', '.'));
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inline(raw) {
    return raw.split(/(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^\s()]+\))/g).map(part=>{
      const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s()]+)\)$/);
      if(link)return '<a target="_blank" rel="noopener noreferrer" href="'+esc(link[2])+'">'+esc(link[1])+'</a>';
      return part.startsWith('**')&&part.endsWith('**')?'<strong>'+esc(part.slice(2,-2))+'</strong>':esc(part);
    }).join('');
  }
  function markdown(value){
    const lines=String(value??'').split(/\r?\n/), html=[];
    for(let i=0;i<lines.length;i++){
      if(/^\s*[|]/.test(lines[i])&&i+1<lines.length&&/^\s*\|?[\s|:\-]+\|\s*$/.test(lines[i+1])){
        const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>inline(c.trim()));
        html.push('<table><thead><tr>'+cells(lines[i]).map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>');i++;
        while(i+1<lines.length&&/^\s*\|/.test(lines[i+1]))html.push('<tr>'+cells(lines[++i]).map(c=>'<td>'+c+'</td>').join('')+'</tr>');
        html.push('</tbody></table>');continue;
      }
      if(/^\s*[-*] /.test(lines[i])){
        html.push('<ul>');do{html.push('<li>'+inline(lines[i].replace(/^\s*[-*] /,''))+'</li>');i++;}while(i<lines.length&&/^\s*[-*] /.test(lines[i]));i--;html.push('</ul>');continue;
      }
      html.push('<div>'+inline(lines[i])+'</div>');
    }return html.join('');
  }
  function when(text, ref=new Date()){
    const d=new Date(ref);d.setHours(12,0,0,0);
    const iso=text.match(/\b(\d{4}-\d\d-\d\d)\b/);
    if(iso){const v=new Date(iso[1]+'T12:00:00');return Number.isFinite(+v)&&day(v)===iso[1]&&v<=d?iso[1]:null;}
    const weekday=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'].findIndex(w=>new RegExp('\\b'+w+'\\b').test(text));
    if(weekday>=0)d.setDate(d.getDate()-(7+d.getDay()-weekday)%7);
    else if(/\banteayer\b/.test(text))d.setDate(d.getDate()-2);
    else if(/\bayer\b/.test(text))d.setDate(d.getDate()-1);
    return day(d);
  }
  function clock(raw){
    const m=raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);if(!m)return null;
    let h=Number(m[1]);const min=Number(m[2]||0);if(min>59||h>23||m[3]&&(h<1||h>12))return null;
    if(m[3])h=h%12+(m[3]==='pm'?12:0);
    return {mins:h*60+min,text:String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')};
  }
  function interpret(raw,ref=new Date()){
    const t=norm(raw).trim(),date=when(t,ref);
    if(!date)return {answer:'Revisa la fecha del registro.'};
    if(/\b(manana|deberia|podria|quiero hacer|voy a|no (?:he |habia )?(?:dormi|dormido|bebi|bebido|tome|tomado|hice|hecho|entrene|entrenado|realice))\b/.test(t))return null;
    if(/cuant[ao]s?.*(?:dormi|dormido|sueno)/.test(t))return {tool:'query_history',kind:'Sueño',date};
    if(/[¿?]/.test(t))return null;
    if(/(?:\bdormi\b|he dormido|he dormio|dormi una siesta|(?:registra|anota).{0,25}(?:sueno|siesta))/.test(t)){
      const match=t.match(/(\d+(?:[.,]\d+)?)\s*(?:horas?\b|h\b)/), minutes=t.match(/(\d+)\s*min(?:utos?)?\b/);
      const times=t.match(/(?:de(?:sde)?(?: las)?\s+)(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:a|hasta)(?: las)?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/);
      const start=times&&clock(times[1].trim()),end=times&&clock(times[2].trim()), span=start&&end?(end.mins-start.mins+1440)%1440:null;
      const duration=match||minutes?Math.round((match?num(match[1])*60:0)+(minutes?+minutes[1]:0)):span;
      if(!duration||duration>1440||times&&(!start||!end)||span!==null&&span!==duration)return {answer:'¿Cuánto tiempo dormiste? Revisa que la duración y el intervalo coincidan.'};
      return {tool:'log_sleep',row:{date,kind:'Sueño',value:duration/60,minutes:duration,startTime:start?.text||'',endTime:end?.text||'',note:'Sueño · '+duration+' min'+(start?' · '+start.text+'–'+end.text:'')}};
    }
    if(/\b(bebi|he bebido|tome agua|(?:registra|anota).{0,25}agua)\b/.test(t)){
      const m=t.match(/(\d+(?:[.,]\d+)?)\s*(ml|mililitros?|litros?|l)\b/);if(!m||!t.includes('agua'))return null;
      const value=num(m[1])*(m[2].startsWith('l')?1000:1);if(!value||value>20000)return {answer:'Comprueba la cantidad de agua y la unidad.'};
      return {tool:'log_water',row:{date,kind:'Agua',value,note:'Agua · '+value+' ml'}};
    }
    const sets=t.match(/\b(\d+)\s*(?:series?\s*(?:de|x)?\s*|[×x]\s*)(\d+)\b/);
    if(sets){
      const kg=t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)\b/), count=+sets[1],reps=+sets[2];
      if(count<1||count>50||reps<1||reps>300||kg&&num(kg[1])>2000)return {answer:'Comprueba las series, repeticiones y carga.'};
      const exercise=raw.slice(0,sets.index).replace(/^(?:\s*(?:hoy|ayer|anteayer|he hecho|he realizado|hice|entrené|registra|registrar|añade|el|\d{4}-\d\d-\d\d)\b[,:\s]*)+/iu,'').trim();
      if(!exercise)return {answer:'¿A qué ejercicio corresponden esas series?'};
      const progression=t.slice(sets.index+sets[0].length).match(/^(?:\s*[-–]\s*\d+)+/);
      const series=progression?[reps,...progression[0].match(/\d+/g).map(Number)]:Array(count).fill(reps);
      if(series.length!==count||series.some(n=>n<1||n>300))return {answer:'Indica una cifra de repeticiones por serie.'};
      const side=/por lado|cada lado/.test(t),total=kg?num(kg[1])*(side?2:1):null;
      return {tool:'log_workout',row:{date,kind:'Entrenamiento',exercise,value:null,reps:series,kg:total,note:exercise+' · '+series.join(' / ')+' rep.'+(kg?' · '+num(kg[1])+(side?' kg por lado':' kg'):'')}};

    }
    return null;
  }
  function eventKey(row){return JSON.stringify([row.date,row.kind,row.value,row.startTime,row.endTime,row.exercise&&norm(row.exercise),row.kg,row.reps]);}
  function commit(row){
    const key=eventKey(row);
    s.logs.push({...row,id:uid(),actionKey:key,source:'diario local'});return 'Guardado en este dispositivo';
  }
  function review(t){
    if(!t.ocrDraft||t.confirmed)return '';
    const id=s.turns.indexOf(t);
    return '<label>Revisa las líneas del entrenamiento<textarea id="review'+id+'" oninput="VeraActions.update('+id+',this.value)">'+esc(t.ocrDraft)+'</textarea></label><button onclick="VeraActions.confirm('+id+')">Confirmar entrenamiento</button>';
  }
  function update(id,text){const t=s.turns[id];if(t&&!t.confirmed){t.ocrDraft=text;save();}}
  function confirm(id){
    const t=s.turns[id];if(!t||t.confirmed)return;
    const rows=t.ocrDraft.trim().split(/\n+/).map(l=>interpret(l));
    if(!rows.length||rows.some(a=>a?.tool!=='log_workout'))return msg('Escribe una línea por ejercicio, por ejemplo «Press banca 3×10 con 60 kg».');
    rows.forEach(a=>commit({...a.row,date:t.workoutDate}));t.confirmed=true;t.answer='Entrenamiento confirmado · '+rows.map(a=>a.row.note).join('\n');delete t.ocrDraft;save();go('Chat');
  }
  return {interpret,markdown,review,update,confirm,eventKey};
})();
