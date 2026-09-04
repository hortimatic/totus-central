/* Totus Central · UX de producción
   Sustituye capas de auditoría visual antiguas por una sola capa compacta. */
(function(){
  const HELP={
    usuario:'Filtra la información por empleado. No mezcla datos entre usuarios.',
    empleado:'Empleado al que corresponde este registro o informe.',
    'centro / proyecto':'Lugar, negocio o proyecto al que pertenece el trabajo. Puede ser una tienda física, TotusCode, un cliente u otro proyecto futuro.',
    tienda:'Centro o proyecto al que pertenece el trabajo. En centros no físicos la dirección puede quedar vacía.',
    responsable:'Persona que debe realizar la tarea y cuyo reloj quedará asociado a ella.',
    categoría:'Clasifica el trabajo para poder medir después cuánto tiempo se dedica a cada actividad.',
    prioridad:'Indica el orden de atención. Usa Urgente solo cuando necesite intervención inmediata.',
    inicio:'Momento previsto de comienzo. El tiempo real se mide con el reloj.',
    vencimiento:'Fecha y hora límite prevista.',
    recordatorio:'Antelación con la que Totus avisará.',
    'tiempo estimado':'Tiempo previsto. El real se conserva por tramos en el histórico.',
    motivo:'Explicación que quedará registrada cuando la acción necesite trazabilidad.',
    recurrente:'Repite la tarea automáticamente según la frecuencia configurada.',
    estado:'Situación actual del registro.',
    desde:'Primer día incluido en el filtro.',
    hasta:'Último día incluido en el filtro.',
    código:'Identificador interno corto y estable. No se debe reutilizar para otro centro o proyecto.',
    'zona horaria':'Zona usada para interpretar correctamente fichajes, tareas y avisos.',
    buscar:'Filtra el listado visible. No modifica ni borra información.',
    módulo:'Limita el histórico a una zona concreta de Totus.',
    email:'Correo usado para el acceso y comunicaciones del usuario.',
    rol:'Nivel de permisos dentro de Totus.',
    'foto opcional':'La tarea puede completarse sin foto salvo que se marque expresamente que requiere evidencia.'
  };
  const PAGE_HELP={
    'tasks:mine':['Mi día','Tu estado y tus accesos principales. Los relojes de arriba son la referencia única para jornada, tarea, actividad laboral y parada personal.'],
    'tasks:overview':['Equipo','Supervisión rápida del equipo: quién está fichado, qué está haciendo y qué necesita atención.'],
    'tasks:calendar':['Calendario','Planificación por día, semana o mes. Los filtros cambian lo que ves, no los datos guardados.'],
    'tasks:tasks':['Tareas','Trabajo asignado, tiempos y evidencias. Inicia y pausa desde los relojes rápidos siempre que sea posible.'],
    'tasks:schedule':['Programación','Horarios habituales y excepciones. No sustituye los fichajes reales.'],
    'tasks:stores':['Centros y proyectos','Configuración exclusiva de administración para tiendas físicas, proyectos digitales, clientes u otros centros de trabajo.'],
    'tasks:attendance':['Fichajes','Entradas, salidas y paradas personales. Las correcciones administrativas quedan auditadas.'],
    'tasks:reports':['Informes','Filtra por persona, periodo y centro/proyecto antes de exportar o imprimir.'],
    'purchases:purchase-overview':['Compras','Registro de compras de empleados y seguimiento de su estado.'],
    'purchases:purchase-history':['Historial de compras','Consulta operaciones anteriores sin perder trazabilidad.'],
    'library:library-home':['Ayuda interna','Protocolos, tutoriales y documentos del equipo.'],
    'library:questions':['Consultas internas','Preguntas y respuestas que quedan guardadas para futuras consultas.'],
    'logs:general-log':['Histórico','Auditoría general de acciones y cambios.'],
    'logs:maintenance':['Administración y copias','Backups, restauración, rollback, mantenimiento y limpieza controlada.']
  };

  function exactText(root,from,to){
    root.querySelectorAll('label,th,h1,h2,h3,.eyebrow,.small,button,option').forEach(el=>{
      if(el.children.length)return;
      if(el.textContent.trim()===from)el.textContent=to;
    });
  }
  function normal(s){return String(s||'').replace(/[·:*?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase()}
  function helpFor(label){const t=normal(label);return Object.entries(HELP).find(([k])=>t===k||t.startsWith(k))?.[1]||''}

  function addFieldHelp(root=document){
    root.querySelectorAll('#main label,.modal label').forEach(label=>{
      if(label.querySelector('.field-info'))return;
      label.querySelectorAll('.field-help,.field-detail-help').forEach(x=>x.remove());
      const txt=(label.childNodes[0]?.textContent||label.textContent||'').trim(),help=helpFor(txt);if(!help)return;
      const b=document.createElement('button');b.type='button';b.className='field-info';b.textContent='?';b.title='Información';b.setAttribute('aria-label','Información sobre '+txt);
      b.onclick=e=>{e.preventDefault();e.stopPropagation();modal(`<div class="section-head"><div><div class="eyebrow">Ayuda</div><h3>${esc(txt)}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body" style="margin-top:10px">${esc(help)}</div>`)};
      label.appendChild(b);
    });
  }

  function markRequired(root=document){
    const explicit=new Set(['storeName','storeCode','taskTitle','questionText','libTitle','requiredReason','purgeReason']);
    root.querySelectorAll('#main input,#main select,#main textarea,.modal input,.modal select,.modal textarea').forEach(c=>{
      const label=c.closest('div')?.querySelector(':scope > label')||c.parentElement?.previousElementSibling;
      const required=c.required||c.getAttribute('aria-required')==='true'||explicit.has(c.id)||/obligatori/i.test(label?.textContent||'');
      if(!required||!label)return;
      c.setAttribute('aria-required','true');
      if(!label.querySelector('.required-mini')){const s=document.createElement('span');s.className='required-mini';s.textContent='obligatorio';label.appendChild(s)}
    });
  }

  function addPageHelp(){
    const main=document.getElementById('main');if(!main||main.classList.contains('hidden'))return;
    const h=main.querySelector(':scope > .head');if(!h||h.querySelector('.page-help'))return;
    const info=PAGE_HELP[`${state.root}:${state.sub}`];if(!info)return;
    let actions=h.querySelector(':scope > .actions');if(!actions){actions=document.createElement('div');actions.className='actions';h.appendChild(actions)}
    const b=document.createElement('button');b.type='button';b.className='ghost page-help';b.textContent='?';b.title='Cómo usar esta pantalla';b.setAttribute('aria-label','Ayuda de esta pantalla');
    b.onclick=()=>modal(`<div class="section-head"><div><div class="eyebrow">Esta pantalla</div><h3>${esc(info[0])}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body" style="margin-top:10px">${esc(info[1])}</div>`);
    actions.appendChild(b);
  }

  function relabel(){
    const main=document.getElementById('main');if(main){
      exactText(main,'Tiendas','Centros y proyectos');exactText(main,'Nueva tienda','Nuevo centro / proyecto');exactText(main,'Tienda','Centro / proyecto');exactText(main,'Tienda / centro','Centro / proyecto');exactText(main,'Tienda obligatoria','Centro / proyecto');
    }
    document.querySelectorAll('.subnav-buttons button,.subnav-mobile option,.side-subnav button').forEach(x=>{if(x.textContent.trim()==='Tiendas')x.textContent='Centros y proyectos'});
  }

  /* El panel personal no repite los botones de los relojes: arriba ya existe la barra rápida. */
  window.panelNowHtml=function(){
    const att=openAttendance(),timer=openTaskTime(),intr=!timer?openTaskInterruption():null,br=openPersonalBreak(),task=timer?db.tasks.find(t=>t.id===timer.task_id):intr?db.tasks.find(t=>t.id===intr.task_id):null;
    const work=timer?`${fmtDur(elapsedSec(timer.started_at))}`:intr?`${fmtDur(elapsedSec(intr.started_at))}`:'Sin actividad';
    const workDesc=timer?(task?.title||'Tarea'):intr?`${interruptionName(intr.reason_code)}${task?' · '+task.title:''}`:'Sin tarea o actividad laboral';
    return `<div class="card panel-widget"><div class="section-head"><div><div class="eyebrow">Ahora</div><h3>Estado de trabajo</h3></div></div><div class="compact-status-row" style="margin-top:7px"><div class="compact-status"><small>JORNADA</small><b>${att?fmtDur(elapsedSec(att.clock_in)):'Fuera'}</b><span>${att?esc(locationName(att.location_id)):'Sin fichaje'}</span></div><div class="compact-status"><small>TRABAJO ACTUAL</small><b>${esc(work)}</b><span>${esc(workDesc)}</span></div><div class="compact-status"><small>PARADA PERSONAL</small><b>${br?fmtDur(elapsedSec(br.started_at)):'Sin parada'}</b><span>${br?esc(breakName(br.break_type)):'No computa al iniciarla'}</span></div></div></div>`;
  };
  window.panelQuickHtml=function(){
    return `<div class="card panel-widget"><div class="section-head"><div><div class="eyebrow">Ir a</div><h3>Accesos</h3></div></div><div class="compact-nav" style="margin-top:7px"><button class="secondary" onclick="goSub('tasks')">Mis tareas</button><button class="secondary" onclick="goSub('calendar')">Calendario</button><button class="secondary" onclick="goRoot('purchases')">Compras</button><button class="secondary" onclick="goSub('reports')">Informes</button><button class="secondary" onclick="goRoot('library')">Ayuda</button></div></div>`;
  };

  function roleVisibility(){
    const u=isAdmin();
    document.body.classList.toggle('role-admin',u);document.body.classList.toggle('role-operator',!u);
    if(!u&&state.root==='tasks'&&state.sub==='stores'){state.sub='mine';renderSubnav();renderTasks()}
  }

  function enhance(){relabel();roleVisibility();addFieldHelp();markRequired();addPageHelp();document.body.classList.add('totus-polished')}
  let queued=false;
  const observer=new MutationObserver(ms=>{if(queued||!ms.some(m=>m.addedNodes.length))return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})});
  observer.observe(document.body,{childList:true,subtree:true});
  const baseRenderTasks=window.renderTasks;if(typeof baseRenderTasks==='function')window.renderTasks=function(){const r=baseRenderTasks.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const basePurchases=window.renderPurchasesModule;if(typeof basePurchases==='function')window.renderPurchasesModule=function(){const r=basePurchases.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const baseLog=window.renderGeneralLog;if(typeof baseLog==='function')window.renderGeneralLog=function(){const r=baseLog.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const baseLibrary=window.renderLibrary;if(typeof baseLibrary==='function')window.renderLibrary=function(){const r=baseLibrary.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const baseModal=window.modal;if(typeof baseModal==='function')window.modal=function(inner){const r=baseModal(inner);requestAnimationFrame(enhance);return r};
  requestAnimationFrame(enhance);
})();
