/* Totus Central · Barra de trabajo permanente
   Relojes y acceso directo a la jornada/tarea/parada sin invadir la ficha del empleado. */
(function(){
  const LAST_TASK_KEY='totus_quick_last_task';
  let timer=null;

  function ownOpenTasks(){
    const uid=me()?.id;
    return (db.tasks||[]).filter(t=>t.assigned_to===uid&&!['done','cancelled'].includes(t.status)).slice().sort((a,b)=>{
      const ar=a.due_at?new Date(a.due_at).getTime():Number.MAX_SAFE_INTEGER;
      const br=b.due_at?new Date(b.due_at).getTime():Number.MAX_SAFE_INTEGER;
      return ar-br||String(a.title||'').localeCompare(String(b.title||''),'es');
    });
  }
  function activeTask(){
    const tt=openTaskTime?.(),intr=typeof openTaskInterruption==='function'&&!tt?openTaskInterruption():null;
    const id=tt?.task_id||intr?.task_id;
    return id?(db.tasks||[]).find(t=>t.id===id):null;
  }
  function taskMeta(t){
    if(!t)return'';
    const loc=t.location_id&&typeof locationName==='function'?locationName(t.location_id):'';
    const due=t.due_at?new Date(t.due_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
    return [loc,due&&('vence '+due)].filter(Boolean).join(' · ');
  }
  function selectedTaskId(){
    const tasks=ownOpenTasks(),stored=localStorage.getItem(LAST_TASK_KEY);
    return tasks.some(t=>t.id===stored)?stored:(tasks[0]?.id||'');
  }
  function taskOptions(selected){
    return ownOpenTasks().map(t=>`<option value="${esc(t.id)}" ${t.id===selected?'selected':''}>${esc(t.title)}</option>`).join('');
  }
  function ensureHost(){
    const top=document.querySelector('.shell-topbar');
    if(!top)return null;
    let el=document.getElementById('shellWorkbar');
    if(!el){
      el=document.createElement('section');el.id='shellWorkbar';el.className='shell-workbar';el.setAttribute('aria-label','Relojes y trabajo actual');
      const actions=top.querySelector('.shell-top-actions');top.insertBefore(el,actions||null);
    }
    return el;
  }
  function render(){
    const host=ensureHost();if(!host||!me())return;
    const attendance=openAttendance?.(),tt=openTaskTime?.(),intr=typeof openTaskInterruption==='function'&&!tt?openTaskInterruption():null,br=openPersonalBreak?.(),task=activeTask(),tasks=ownOpenTasks(),selected=task?.id||selectedTaskId();
    const taskState=tt?'En marcha':intr?'Interrupción laboral':'Sin tarea activa';
    const attTitle=attendance?(typeof locationName==='function'?locationName(attendance.location_id):'Jornada abierta'):'Sin jornada';
    const attTime=attendance?fmtDur(elapsedSec(attendance.clock_in)):'00:00:00';
    const taskTime=tt?fmtDur(elapsedSec(tt.started_at)):intr?fmtDur(elapsedSec(intr.started_at)):'00:00:00';
    const breakTime=br?fmtDur(elapsedSec(br.started_at)):'00:00:00';
    const taskControl=task
      ? `<div class="workbar-task-copy"><b title="${esc(task.title)}">${esc(task.title)}</b><small>${esc(taskMeta(task)||taskState)}</small></div><div class="workbar-task-actions"><button type="button" onclick="openActiveTask()">Abrir</button><button type="button" onclick="workbarTaskPicker()">Cambiar</button></div>`
      : tasks.length
        ? `<label class="workbar-task-select"><span class="sr-only">Tarea siguiente</span><select id="workbarTaskSelect" onchange="workbarSelectTask(this.value)">${taskOptions(selected)}</select><small>${esc(taskMeta(tasks.find(t=>t.id===selected))||'Selecciona la siguiente tarea')}</small></label><div class="workbar-task-actions"><button class="start" type="button" onclick="workbarStartSelected()" ${attendance&&!br?'':'disabled'}>Iniciar</button><button type="button" onclick="workbarTaskPicker()">Buscar</button></div>`
        : `<div class="workbar-task-copy"><b>Sin tareas pendientes</b><small>Abre Tareas para crear o revisar trabajo.</small></div><div class="workbar-task-actions"><button type="button" onclick="goRoot('tasks','tasks')">Tareas</button></div>`;
    host.innerHTML=`
      <div class="workbar-clock ${attendance?'active':''}" title="Jornada"><span>JORNADA</span><strong>${attTime}</strong><small>${esc(attTitle)}</small></div>
      <div class="workbar-task ${tt||intr?'active':''}"><div class="workbar-task-head"><span>TAREA</span><strong>${taskTime}</strong></div>${taskControl}</div>
      <div class="workbar-clock personal ${br?'active':''}" title="Parada personal"><span>PARADA</span><strong>${breakTime}</strong><small>${br?esc(breakName(br.break_type)):'Sin parada personal'}</small></div>
      <div class="workbar-actions"><button type="button" class="${attendance?'danger-soft':'primary'}" onclick="workbarAttendance()">${attendance?'Salir':'Entrar'}</button><button type="button" onclick="toggleQuickPanel(true)">Más</button></div>`;
  }

  window.workbarSelectTask=function(id){if(id)localStorage.setItem(LAST_TASK_KEY,id);render()};
  async function startById(id){
    if(!id)return notifyMsg('Selecciona una tarea.','warn');
    if(!openAttendance())return notifyMsg('Primero ficha entrada.','warn');
    if(openPersonalBreak())return notifyMsg('Finaliza la parada personal antes de iniciar una tarea.','warn');
    const current=openTaskTime?.();
    if(current&&current.task_id!==id)await quickPauseTask();
    const qc=document.getElementById('qcTask');
    if(qc){qc.value=id;qc.dispatchEvent(new Event('change',{bubbles:true}))}
    localStorage.setItem(LAST_TASK_KEY,id);
    if(typeof quickStartTask==='function')await quickStartTask();
    render();
  }
  window.workbarStartSelected=async function(){const id=document.getElementById('workbarTaskSelect')?.value||selectedTaskId();await startById(id)};
  window.workbarChooseTask=async function(id,start=true){localStorage.setItem(LAST_TASK_KEY,id);closeModal();if(start)await startById(id);else render()};
  window.workbarTaskPicker=function(){
    const rows=ownOpenTasks();
    modal(`<div class="section-head"><div><div class="eyebrow">Acceso directo</div><h3>Buscar o cambiar de tarea</h3><div class="small">Selecciona la siguiente tarea sin abandonar la pantalla actual.</div></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div style="margin-top:12px"><input id="workbarTaskSearch" placeholder="Buscar tarea…" autocomplete="off" oninput="workbarFilterTasks(this.value)"></div><div id="workbarTaskResults" class="workbar-task-results">${workbarTaskResultsHtml(rows)}</div>`);
    setTimeout(()=>document.getElementById('workbarTaskSearch')?.focus(),30);
  };
  window.workbarTaskResultsHtml=function(rows){return rows.length?rows.map(t=>`<button type="button" class="workbar-result" onclick="workbarChooseTask('${esc(t.id)}',true)"><span><b>${esc(t.title)}</b><small>${esc(taskMeta(t)||'Sin fecha límite')}</small></span><strong>Iniciar →</strong></button>`).join(''):'<div class="empty-state compact"><b>Sin coincidencias</b><span>No hay tareas abiertas con ese texto.</span></div>'};
  window.workbarFilterTasks=function(q){const s=String(q||'').trim().toLowerCase(),rows=ownOpenTasks().filter(t=>!s||`${t.title||''} ${t.description||''}`.toLowerCase().includes(s));const host=document.getElementById('workbarTaskResults');if(host)host.innerHTML=workbarTaskResultsHtml(rows)};
  window.workbarAttendance=async function(){if(openAttendance()){if(typeof quickClockOut==='function')await quickClockOut();else await toggleAttendance()}else{if(typeof quickClockIn==='function')await quickClockIn();else await toggleAttendance()}render()};

  function boot(){render();clearInterval(timer);timer=setInterval(render,1000)}
  const wrap=name=>{const base=window[name];if(typeof base!=='function')return;window[name]=function(){const r=base.apply(this,arguments);requestAnimationFrame(render);return r}};
  ['paintUser','renderTasks','renderPurchasesModule','goRoot','goSub'].forEach(wrap);
  requestAnimationFrame(boot);
})();
