// Rebuild a week from its approved sessions when remote planning is unavailable.
export function backupWorkout245(error, validation, request, dates) {
  const {preservedPlan, candidates, expectedTrainingDays, editDate, completedDates = [], requestedExerciseIds = [], requiredExerciseGroups = [], context} = validation;
  const temporary = ['AI_CONFIG','AI_RATE_LIMIT','AI_TIMEOUT','AI_NETWORK','AI_BUSY','AI_INCOMPLETE','AI_FORMAT','WORKOUT_FORMAT','AI_NOT_CONFIGURED','AI_RESPONSE'];
  const text = JSON.stringify([request, context.profile.criteria, context.need, context.records.map(r=>r.trainingNote||r.note||'')]).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (!temporary.includes(error.code) || preservedPlan?.status !== 'ready' || !editDate || completedDates.includes(editDate) || /dolor|lesion|cirug|rehabilit|mareo|pecho oprimido|embaraz|fractura|evitar|no puedo|contraindica|prohibid/.test(text)) throw error;
  const byId = new Map(candidates.map(x=>[x.id,x]));
  const focusIds = [...new Set([...requestedExerciseIds, ...requiredExerciseGroups.map(group=>group.find(id=>byId.has(id)))])];
  if (!focusIds.length || focusIds.length>5 || focusIds.some(id=>!byId.has(id))) throw error;
  const sessions = new Set([...completedDates,editDate]);
  const preferred = Array.from({length:expectedTrainingDays},(_,i)=>dates[Math.floor(i*7/expectedTrainingDays)]);
  for (const date of [...preferred,...dates]) if(sessions.size<expectedTrainingDays)sessions.add(date);
  if(sessions.size!==expectedTrainingDays) throw error;
  const seen = new Map(), lastDay = new Map();
  function record(id,index){seen.set(id,(seen.get(id)||0)+1);for(const m of byId.get(id)?.muscles||[])lastDay.set(m,index);}
  const example = id=>preservedPlan.days.flatMap(d=>d.exercises).find(e=>e.id===id);
  const exercise = id=>{const prev=example(id);return {id,sets:Math.min(prev?.sets||2,4),reps:prev?.reps||[8,12],rir:prev?.rir||3,restSeconds:prev?.restSeconds||90,cue:'Movimiento controlado.',progression:'Revisa la técnica y anota las repeticiones realizadas.'};};
  const days=dates.map((date,i)=>{
    if(completedDates.includes(date)){const kept=preservedPlan.days[i];for(const e of kept.exercises)record(e.id,i);return kept;}
    if(!sessions.has(date))return {date,type:'rest',title:'Recuperación',reason:'Día sin sesión de fuerza programada.',exercises:[]};
    let ids=focusIds;
    if(date!==editDate){
      const score=e=>(seen.get(e.id)||0)*5+(e.muscles||[]).reduce((s,m)=>s+(lastDay.get(m)===i-1?4:0),0)+(focusIds.includes(e.id)?2:0);
      const choices=candidates.filter(e=>!e.userDefined).sort((a,b)=>score(a)-score(b));
      ids=[];const muscles=new Set();
      for(const e of choices){const m=e.muscles?.[0];if(muscles.has(m))continue;muscles.add(m);ids.push(e.id);if(ids.length===3)break;}
      if(!ids.length)throw error;
    }
    for(const id of ids)record(id,i);
    return {date,type:'training',title:date===editDate?'Sesión solicitada':'Fuerza general',reason:date===editDate?'Incluye los ejercicios pedidos para este día.':'Alterna grupos musculares con las sesiones anteriores.',exercises:ids.map(exercise)};
  });
  return {status:'ready',summary:'Semana reorganizada con tu catálogo y la tabla guardada.',adaptation:'Los servicios de IA estaban ocupados. VERA ha usado sus reglas de distribución para situar los ejercicios pedidos y recalcular los días pendientes. Revisa las series y repeticiones propuestas.',days};
}
