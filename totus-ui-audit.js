/* Totus Central · auditoría UX V20
   Capa de presentación y ayuda. No cambia tablas, permisos ni cálculo de tiempos. */
(function(){
  const FIELD_HELP={
    'usuario':'Filtra la información por empleado. Administración puede revisar a cada usuario por separado.',
    'empleado':'Selecciona el empleado cuyos datos quieres revisar. No mezcla sus tiempos con los de otros usuarios.',
    'tienda':'Centro al que pertenece la tarea, fichaje, compra o informe.',
    'desde':'Fecha inicial incluida en el filtro o informe.',
    'hasta':'Fecha final incluida en el filtro o informe.',
    'prioridad':'Orden de atención de la tarea. Urgente debe reservarse para lo que necesita acción inmediata.',
    'categoría':'Clasifica el trabajo para poder medir después cuánto tiempo se dedica a cada tipo de actividad.',
    'responsable':'Persona que debe ejecutar la tarea y cuyo reloj quedará asociado a ella.',
    'inicio':'Momento previsto para comenzar. No sustituye al reloj real de trabajo.',
    'vencimiento':'Fecha y hora límite prevista para terminar la tarea.',
    'recordatorio':'Antelación con la que Totus avisará antes del inicio o vencimiento.',
    'tiempo estimado':'Tiempo previsto para completar la tarea. El tiempo real se registra con el reloj.',
    'motivo':'Explica por qué se realiza una corrección, parada o interrupción. Queda en el histórico cuando corresponde.',
    'recurrente':'Repite automáticamente una tarea siguiendo el intervalo configurado.',
    'buscar':'Busca dentro del histórico o listado visible sin modificar los datos.',
    'módulo':'Limita el histórico al área seleccionada: fichajes, tareas, compras, etc.',
    'estado':'Filtra registros según su situación actual.',
    'código':'Identificador corto interno. Debe ser estable y no duplicarse.',
    'zona horaria':'Zona usada para interpretar fechas y horas del centro.'
  };
  const ZONE_GUIDES={
    'tasks:mine':['Mi jornada','Empieza aquí. Arriba ves tu jornada, trabajo actual y paradas. Debajo tienes tus tareas, avisos y el resumen del día.'],
    'tasks:overview':['Resumen del equipo','Vista rápida del estado del equipo. Úsala para detectar quién está fichado, qué tarea tiene activa y qué queda pendiente.'],
    'tasks:calendar':['Calendario','Vista principal de planificación. Día, semana y mes cambian el periodo; los filtros de tienda y usuario limitan lo que ves.'],
    'tasks:tasks':['Tareas','Aquí se crea, ejecuta y revisa el trabajo. El reloj de tarea mide tiempo real; una interrupción laboral queda separada y sigue computando jornada.'],
    'tasks:schedule':['Programación','Define horarios y excepciones. La programación sirve de referencia para el cómputo de jornada; no modifica los fichajes reales.'],
    'tasks:attendance':['Fichajes','Registro de entradas, salidas y paradas personales. Los cambios administrativos deben conservar motivo e histórico.'],
    'tasks:reports':['Informes','Selecciona usuario, fechas y tienda antes de exportar. La conciliación compara jornada, tareas, interrupciones laborales y paradas personales.'],
    'purchases:purchase-overview':['Compras de empleados','Registra compras y consulta su estado. Cada operación queda asociada a empleado y tienda.'],
    'purchases:purchase-history':['Historial de compras','Filtra por usuario para revisar compras sin mezclar empleados.'],
    'logs:general-log':['Histórico general','Auditoría transversal. Puedes filtrar por usuario, módulo y fechas para reconstruir qué ocurrió y quién actuó.'],
    'library:library-home':['Tutoriales y documentos','Protocolos y material interno del equipo. Usa las consultas internas cuando la respuesta deba quedar guardada para futuras ocasiones.']
  };

  function todaySummary(uid){
    try{
      const day=dayIsoLocal(new Date()),r=workdayReconciliationLocal(uid||me().id,day,'');
      const parts=[];
      if(r.taskMin)parts.push(`Tareas ${fmtHours(r.taskMin)}`);
      if(r.workInt)parts.push(`Interrupciones laborales ${fmtHours(r.workInt)}`);
      if(r.personal)parts.push(`Personal ${fmtHours(r.personal)}`);
      if(r.unaccounted)parts.push(`Sin asignar ${fmtHours(r.unaccounted)}`);
      return {r,text:parts.length?parts.join(' · '):'Todavía no hay actividad contabilizada hoy.'};
    }catch{return {r:null,text:'Resumen diario no disponible.'}}
  }

  if(typeof window.panelNowHtml==='function'){
    window.panelNowHtml=function(){
      const att=openAttendance(),timer=openTaskTime(),intr=openTaskInterruption(),br=openPersonalBreak(),task=timer?db.tasks.find(t=>t.id===timer.task_id):intr?db.tasks.find(t=>t.id===intr.task_id):null,s=todaySummary(me().id),r=s.r;
      const workTitle=timer?'Tarea en marcha':intr?'Interrupción laboral':'Sin trabajo registrado';
      const workTime=timer?fmtDur(elapsedSec(timer.started_at)):intr?fmtDur(elapsedSec(intr.started_at)):'00:00:00';
      const workText=timer?(task?.title||'Tarea'):intr?`${interruptionName(intr.reason_code)}${task?' · '+task.title:''}`:'Inicia una tarea cuando empieces trabajo asignado';
      return `<div class="card panel-widget today-control"><div class="section-head"><div><div class="eyebrow">Ahora mismo</div><h3>Mi jornada de hoy</h3><div class="small">Lo que está contando en este momento y cómo quedará repartido al final del día.</div></div></div><div class="now-grid now-grid-audit"><div class="now-item ${att?'is-active':''}"><small>1 · Jornada</small><b>${att?fmtDur(elapsedSec(att.clock_in)):'Fuera de jornada'}</b><span>${att?locationName(att.location_id):'Pulsa Entrar para comenzar'}</span></div><div class="now-item ${timer||intr?'is-active':''} ${intr?'is-work-interruption':''}"><small>2 · Trabajo actual</small><b>${workTitle} · ${workTime}</b><span>${esc(workText)}</span>${intr?'<em>LABORAL · sigue computando jornada</em>':''}</div><div class="now-item ${br?'is-personal':''}"><small>3 · Parada personal</small><b>${br?fmtDur(elapsedSec(br.started_at)):'Sin parada'}</b><span>${br?esc(breakName(br.break_type)):'No computa cuando se inicia'}</span>${br?'<em>PERSONAL · no computa</em>':''}</div><div class="now-item today-balance ${r&&r.unaccounted>15?'needs-attention':''}"><small>4 · Reparto de hoy</small><b>${r?fmtHours(r.attendance):'—'} computable</b><span>${esc(s.text)}</span></div></div></div>`;
    };
  }

  if(typeof window.panelQuickHtml==='function'){
    window.panelQuickHtml=function(){
      const att=openAttendance(),br=openPersonalBreak(),timer=openTaskTime(),intr=openTaskInterruption();
      return `<div class="card panel-widget quick-workflow"><div class="section-head"><div><div class="eyebrow">Qué hago ahora</div><h3>Acciones de jornada</h3><div class="small">Primero registra tu estado; después navega a la zona que necesites.</div></div></div><div class="quick-work-actions">${canOperate()?`<button class="quick-action emphasis" onclick="toggleAttendance()"><b>${att?'Finalizar jornada':'Iniciar jornada'}</b><span>${att?locationName(att.location_id):'Fichar entrada y elegir tienda'}</span></button>${att?`<button class="quick-action ${br?'warn':''}" onclick="togglePersonalBreak()"><b>${br?'Terminar parada personal':'Parada personal'}</b><span>${br?breakName(br.break_type):'Cigarro, llamada personal, recado…'}</span></button>`:''}`:''}${timer||intr?`<button class="quick-action" onclick="openActiveTask()"><b>${intr?'Ver tarea suspendida':'Ver tarea activa'}</b><span>${timer?'Reloj de tarea en marcha':'Interrupción laboral activa'}</span></button>`:''}</div><div class="quick-nav-label">IR A</div><div class="quick-nav-grid"><button class="quick-action" onclick="goSub('tasks')"><b>Tareas</b><span>Trabajo asignado y relojes</span></button><button class="quick-action" onclick="goSub('calendar')"><b>Calendario</b><span>Agenda y planificación</span></button><button class="quick-action" onclick="goRoot('purchases')"><b>Compras</b><span>Registrar o consultar</span></button><button class="quick-action" onclick="goSub('reports')"><b>Informes</b><span>Horas y reparto del día</span></button><button class="quick-action" onclick="goRoot('library')"><b>Ayuda interna</b><span>Tutoriales y consultas</span></button></div></div>`;
    };
  }

  function normaliseLabel(s){return String(s||'').replace(/[·:*?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase()}
  function addFieldHelp(){
    document.querySelectorAll('#main label,.modal label').forEach(label=>{
      if(label.dataset.auditHelp==='1'||label.querySelector('.field-help'))return;
      const text=normaliseLabel(label.childNodes[0]?.textContent||label.textContent);
      const key=Object.keys(FIELD_HELP).find(k=>text.startsWith(k));
      if(!key)return;
      const b=document.createElement('button');b.type='button';b.className='field-help';b.textContent='?';b.title='Información de este campo';b.setAttribute('aria-label','Información sobre '+text);b.onclick=(e)=>{e.preventDefault();e.stopPropagation();modal(`<div class="section-head"><div><div class="eyebrow">Ayuda de campo</div><h3>${esc((label.childNodes[0]?.textContent||label.textContent).trim())}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body">${esc(FIELD_HELP[key])}</div>`)};label.appendChild(b);label.dataset.auditHelp='1';
    });
  }

  function addZoneGuide(){
    const main=document.getElementById('main');if(!main||main.classList.contains('hidden'))return;
    const key=`${state.root}:${state.sub}`,g=ZONE_GUIDES[key],head=main.querySelector(':scope > .head');
    main.querySelectorAll(':scope > .zone-guide').forEach(x=>x.remove());
    if(!g||!head)return;
    const box=document.createElement('div');box.className='zone-guide';box.innerHTML=`<div><b>${esc(g[0])}</b><span>${esc(g[1])}</span></div><button type="button" aria-label="Cerrar explicación" onclick="this.closest('.zone-guide').remove()">×</button>`;head.insertAdjacentElement('afterend',box);
  }

  function simplifyCalendar(){
    const toolbar=document.querySelector('.calendar-toolbar');if(!toolbar||toolbar.dataset.auditDone==='1')return;
    toolbar.dataset.auditDone='1';
    const sw=toolbar.querySelector('.calendar-view-switch');
    if(sw){const d=document.createElement('details');d.className='calendar-advanced';d.innerHTML='<summary>Opciones de vista</summary>';sw.parentNode.insertBefore(d,sw);d.appendChild(sw)}
    const surface=document.querySelector('.calendar-surface');if(surface&&!surface.querySelector('.calendar-primary-hint'))surface.insertAdjacentHTML('afterbegin','<div class="calendar-primary-hint"><b>Vista recomendada:</b> Mes para planificar · Semana para organizar · Día para ejecutar.</div>');
  }

  function enhanceModal(){
    const modalEl=document.querySelector('#modalHost .modal');if(!modalEl||modalEl.dataset.auditDone==='1')return;modalEl.dataset.auditDone='1';
    modalEl.setAttribute('aria-describedby','totusModalHint');
    if(!modalEl.querySelector('#totusModalHint'))modalEl.insertAdjacentHTML('afterbegin','<div id="totusModalHint" class="sr-only">Ventana emergente de Totus Central. Pulsa Escape para cerrar.</div>');
  }

  function enhance(){addFieldHelp();addZoneGuide();simplifyCalendar();enhanceModal()}
  const originalRenderTasks=window.renderTasks;if(typeof originalRenderTasks==='function')window.renderTasks=function(){const r=originalRenderTasks.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const originalPurchases=window.renderPurchasesModule;if(typeof originalPurchases==='function')window.renderPurchasesModule=function(){const r=originalPurchases.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const originalLog=window.renderGeneralLog;if(typeof originalLog==='function')window.renderGeneralLog=function(){const r=originalLog.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const originalLibrary=window.renderLibrary;if(typeof originalLibrary==='function')window.renderLibrary=function(){const r=originalLibrary.apply(this,arguments);requestAnimationFrame(enhance);return r};
  const originalModal=window.modal;if(typeof originalModal==='function')window.modal=function(inner){const r=originalModal(inner);requestAnimationFrame(enhance);return r};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#modalHost .modal-backdrop'))closeModal()});
  requestAnimationFrame(enhance);
})();
