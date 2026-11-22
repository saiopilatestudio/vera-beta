/* VERA 2.2 visual layer. Only decorates the DOM; it never reads or changes health data. */
(()=>{
  'use strict';
  const paths={
    home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
    strength:'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
    food:'M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 3c-4 3-4 9 0 9V3Zm0 9v9',
    vera:'m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z',
    together:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M18 16a5 5 0 0 1 4 5',
    team:'M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21v-3a6 6 0 0 1 12 0v3M3 9a3 3 0 0 1 0 6M1 21v-2a4 4 0 0 1 3-4M21 9a3 3 0 0 0 0 6M23 21v-2a4 4 0 0 0-3-4',
    chart:'M4 3v18h17M8 16l4-5 4 2 5-7',
    moon:'M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z',
    heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    pill:'m8 3-5 5a6 6 0 0 0 8 8l5-5a6 6 0 0 0-8-8ZM6 5l8 8M15 21h7M18.5 17.5v7',
    measure:'M3 7h18v10H3V7Zm4 0v5m5-5v3m5-3v5',
    gym:'M3 21V8l9-5 9 5v13H3Zm5 0v-7h8v7M8 9h.01M12 9h.01M16 9h.01',
    drop:'M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z',
    leaf:'M20 3C9 2 3 8 5 15s13 6 15-12ZM4 21 16 9',
  };
  const names={Hoy:'home',Entrenar:'strength',Entrenamiento:'strength',Nutrición:'food',Alimentación:'food',Vera:'vera',Chat:'vera',Juntos:'together',Equipo:'team',Progreso:'chart',Suplementación:'pill',Sueño:'moon',Cardio:'heart','Hablar con Vera':'vera',Mediciones:'measure',Máquinas:'gym',Agua:'drop'};
  function icon(name){const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('viewBox','0 0 24 24');el.setAttribute('fill','none');el.setAttribute('stroke','currentColor');el.setAttribute('stroke-width','1.7');el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round');el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');el.classList.add('icon22');const p=document.createElementNS(el.namespaceURI,'path');p.setAttribute('d',paths[name]||paths.vera);el.append(p);return el;}
  function decorateButton(button){
    if(button.dataset.design22)return;
    const label=button.textContent.trim(),name=names[label];if(!name)return;
    button.dataset.design22=name;
    const text=document.createElement('span');text.className='label22';text.textContent=label;
    button.replaceChildren(icon(name),text);
  }
  function decorate(){
    const brand=document.querySelector('.brandIcon14 img');
    if(brand&&!brand.getAttribute('src')?.endsWith('brand22.svg'))brand.setAttribute('src','brand22.svg');
    document.querySelectorAll('#nav button,.tiles6 button').forEach(decorateButton);
    document.querySelectorAll('.roster>summary').forEach(summary=>{
      if(summary.dataset.design22)return;
      const title=summary.firstChild?.textContent||summary.textContent;
      const name=/nutri|alimenta/i.test(title)?'food':/sueño|recuper|descanso/i.test(title)?'moon':/suplement/i.test(title)?'pill':/entren|fuerza|biomec/i.test(title)?'strength':/cardio/i.test(title)?'heart':'leaf';
      summary.dataset.design22=name;const badge=document.createElement('span');badge.className='specialistIcon22';badge.append(icon(name));summary.prepend(badge);
    });
    const current=document.querySelector('#nav [aria-current="page"]');
    if(document.body)document.body.dataset.veraPage22=current?.dataset.design22||'other';
    const main=document.querySelector('#view');
    if(main){main.querySelectorAll('.hero6').forEach(hero=>{if(hero.dataset.design22)return;hero.dataset.design22='hero';const ornament=document.createElement('div');ornament.className='heroOrbit22';ornament.setAttribute('aria-hidden','true');ornament.innerHTML='<i></i><i></i><i></i>';hero.append(ornament);});}
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;decorate();});}
  decorate();
  const observer=new MutationObserver(schedule);
  for(const id of ['nav','view']){const node=document.getElementById(id);if(node)observer.observe(node,{childList:true,subtree:true});}
})();
