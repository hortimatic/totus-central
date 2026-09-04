/* Totus Central · Quick Controls V21
   Uso diario de relojes en 1-2 acciones. No modifica RLS ni reglas de cálculo. */
(function(){
  const PERSONAL_ORDER=['smoke','snack_unpaid','personal_call','whatsapp_personal','personal_errand','personal_visit','personal_message','personal_other'];
  const WORK_ORDER=['customer_attention','sales_rep_visit','order_reception','colleague_call','commercial_call','whatsapp_colleague','inventory_stock','cash_pos_issue','shipment_delivery','work_meeting','work_other'];
  const LAST_LOC_KEY='totus_quick_last_location';
  const LAST_TASK_KEY='totus_quick_last_task';
  let lastSignature='';

  function activeRowsByOrder(rows,order){
    const pos=new Map(order.map((x,i)=>[x,i]));
    return rows.filter(x=>x.active!==false).slice().sort((a,b)=>(pos.get(a.code)??999)-(pos.get(b.code)??999)||Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.label||'').localeCompare(String(b.label||''),'es'));
  }
  function quickPersonalTypes(){return activeRowsByOrder(personalBreakTypes(),PERSONAL_ORDER)}
  function quickWorkTypes(){return activeRowsByOrder(workInterruptionTypes(),WORK_ORDER)}
  function currentTask(){const t=openTaskTime(),i=!t?openTaskInterruption():null;return t?db.tasks.find(x=>x.id===t.task_id):i?db.tasks.find(x=>x.id===i.task_id):null}
  function openOwnTasks(){return db.tasks.filter(t=>t.assigned_to===me()?.id&&!['done','cancelled'].includes(t.status)).sort((a,b)=>{
    const ar=a.due_at?new Date(a.due_at).getTime():Number.MAX_SAFE_INTEGER,br=b.due_at?new Date(b.due_at).getTime():Number.MAX_SAFE_INTEGER;
    return ar-br||String(a.title||'').localeCompare(String(b.title||''),'es');
  })}
  function scheduledLocation(){
    try{
      const now=new Date(),iso=dayIsoLocal(now),wd=weekday1(now),rows=db.schedules.filter(x=>x.user_id===me()?.id&&Number(x.weekday)===wd&&x.active&&(!x.valid_from||x.valid_from<=iso)&&(!x.valid_to||x.valid_to>=iso));
      const scored=rows.map(x=>{const [h,m]=String(x.start_time||'00:00').split(':').map(Number),at=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h||0,m||0);return{x,score:Math.abs(at-now)}}).sort((a,b)=>a.score-b.score);
      return scored[0]?.x?.location_id||'';
    }catch{return''}
  }
  function preferredLocation(){
    const open=openAttendance();if(open?.location_id)return open.location_id;
    const stored=localStorage.getItem(LAST_LOC_KEY);if(stored&&db.locations.some(x=>x.id===stored))return stored;
    const planned=scheduledLocation();if(planned)return planned;
    return db.locations[0]?.id||'';
  }
  function preferredTask(){
    const tasks=openOwnTasks(),stored=localStorage.getItem(LAST_TASK_KEY);
    return tasks.some(x=>x.id===stored)?stored:(tasks[0]?.id||'');
  }
  function optionRows(rows,selected){return rows.map(x=>`<option value="${esc(x.code)}" ${x.code===selected?'selected':''}>${esc(x.label)}${x.requires_note?' · nota':''}</option>`).join('')}
  function taskOptions(rows,selected){return rows.map(x=>`<option value="${x.id}" ${x.id===selected?'selected':''}>${esc(x.title)}${x.due_at?' · '+new Date(x.due_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}</option>`).join('')}
  function locOptions(selected){return db.locations.map(x=>`<option value="${x.id}" ${x.id===selected?'selected':''}>${esc(x.name)}</option>`).join('')}

  function stateSignature(){
    const a=openAttendance(),t=openTaskTime(),i=!t?openTaskInterruption():null,b=openPersonalBreak(),tasks=openOwnTasks();
    return [me()?.id,a?.id||'',t?.id||'',i?.id||'',b?.id||'',tasks.map(x=>`${x.id}:${x.status}:${x.updated_at||''}`).join(','),db.breakTypes.map(x=>`${x.code}:${x.active}:${x.requires_note}`).join(',')].join('|');
  }

  function quickBarHtml(){
    const a=openAttendance(),timer=openTaskTime(),intr=!timer?openTaskInterruption():null,br=openPersonalBreak(),task=currentTask(),tasks=openOwnTasks(),loc=preferredLocation(),personal=quickPersonalTypes(),work=quickWorkTypes(),selectedTask=task?.id||preferredTask();
    const attendanceBlock=a
      ? `<div class="qc-group qc-attendance active"><span class="qc-kicker">JORNADA</span><b>${esc(locationName(a.location_id))}</b><small>Fichado · ${fmtDur(elapsedSec(a.clock_in))}</small><button class="qc-btn danger-soft" onclick="quickClockOut()">Salir</button></div>`
      : `<div class="qc-group qc-attendance"><span class="qc-kicker">JORNADA</span><label class="sr-only" for="qcLocation">Tienda</label><select id="qcLocation" onchange="localStorage.setItem('${LAST_LOC_KEY}',this.value)">${locOptions(loc)}</select><button class="qc-btn primary" onclick="quickClockIn()">Entrar</button></div>`;

    let taskBlock='';
    if(!a){taskBlock=`<div class="qc-group qc-task disabled"><span class="qc-kicker">TAREA</span><b>Primero ficha entrada</b><small>Después podrás iniciar una tarea.</small></div>`}
    else if(br){taskBlock=`<div class="qc-group qc-task disabled"><span class="qc-kicker">TAREA</span><b>Pausada por parada personal</b><small>Finaliza la parada para continuar.</small></div>`}
    else if(intr){taskBlock=`<div class="qc-group qc-task warning"><span class="qc-kicker">TAREA</span><b>${esc(task?.title||'Tarea')}</b><small>${esc(interruptionName(intr.reason_code))} · laboral</small><button class="qc-btn primary" onclick="quickResumeTask('${task?.id||''}')">Reanudar</button></div>`}
    else if(timer){taskBlock=`<div class="qc-group qc-task active"><span class="qc-kicker">TAREA</span><b>${esc(task?.title||'Tarea')}</b><small>${fmtDur(elapsedSec(timer.started_at))} · reloj activo</small><div class="qc-inline"><button class="qc-btn" onclick="quickPauseTask()">Pausar</button><button class="qc-btn ghost" onclick="openActiveTask()">Abrir</button></div></div>`}
    else if(tasks.length){taskBlock=`<div class="qc-group qc-task"><span class="qc-kicker">TAREA</span><label class="sr-only" for="qcTask">Tarea pendiente</label><select id="qcTask" onchange="localStorage.setItem('${LAST_TASK_KEY}',this.value)">${taskOptions(tasks,selectedTask)}</select><button class="qc-btn primary" onclick="quickStartTask()">Iniciar</button></div>`}
    else{taskBlock=`<div class="qc-group qc-task"><span class="qc-kicker">TAREA</span><b>Sin tareas pendientes</b><small>No hay trabajo asignado abierto.</small><button class="qc-btn ghost" onclick="goSub('tasks')">Ver tareas</button></div>`}

    let personalBlock='';
    if(!a){personalBlock=`<div class="qc-group qc-personal disabled"><span class="qc-kicker">PARADA PERSONAL</span><b>Disponible al fichar</b><small>No computa como trabajo.</small></div>`}
    else if(intr){personalBlock=`<div class="qc-group qc-personal disabled"><span class="qc-kicker">PARADA PERSONAL</span><b>Interrupción laboral activa</b><small>Reanuda la tarea antes de una parada personal.</small></div>`}
    else if(br){const previous=localStorage.getItem(LAST_TASK_KEY),canResume=previous&&tasks.some(x=>x.id===previous);personalBlock=`<div class="qc-group qc-personal personal-active"><span class="qc-kicker">PARADA PERSONAL · NO COMPUTA</span><b>${esc(breakName(br.break_type))}</b><small>${fmtDur(elapsedSec(br.started_at))}</small><button class="qc-btn danger" onclick="quickStopPersonalBreak(${canResume?'true':'false'})">${canResume?'Fin + reanudar tarea':'Finalizar'}</button></div>`}
    else{personalBlock=`<div class="qc-group qc-personal"><span class="qc-kicker">PARADA PERSONAL</span><label class="sr-only" for="qcPersonal">Motivo de parada personal</label><select id="qcPersonal">${optionRows(personal,personal[0]?.code||'')}</select><button class="qc-btn danger-soft" onclick="quickStartPersonalBreak()">Iniciar</button></div>`}

    let workBlock='';
    if(!timer){workBlock=`<div class="qc-group qc-work disabled"><span class="qc-kicker">INTERRUPCIÓN LABORAL</span><b>${intr?'Ya está registrada':'Necesita tarea activa'}</b><small>${intr?'Sigue computando jornada.':'Cliente, comercial, llamada, incidencia…'}</small></div>`}
    else{workBlock=`<div class="qc-group qc-work"><span class="qc-kicker">INTERRUPCIÓN LABORAL · COMPUTA</span><label class="sr-only" for="qcWork">Motivo laboral</label><select id="qcWork">${optionRows(work,work[0]?.code||'')}</select><button class="qc-btn warning" onclick="quickStartWorkInterruption()">Marcar</button></div>`}

    return `<div class="quick-clock-bar" id="quickClockBar"><div class="quick-clock-head"><div><b>Acciones rápidas</b><span>Registra lo que haces sin salir de esta pantalla.</span></div><button type="button" class="qc-help" onclick="quickClockHelp()">?</button></div><div class="quick-clock-grid">${attendanceBlock}${taskBlock}${personalBlock}${workBlock}</div></div>`;
  }

  function renderQuickClockBar(force=false){
    const dock=document.querySelector('.status-dock');if(!dock||!me())return;
    const sig=stateSignature();if(!force&&sig===lastSignature&&document.getElementById('quickClockBar'))return;lastSignature=sig;
    document.getElementById('quickClockBar')?.remove();
    dock.insertAdjacentHTML('beforeend',quickBarHtml());
  }

  window.quickClockHelp=function(){modal(`<div class="section-head"><div><div class="eyebrow">Acciones rápidas</div><h3>Cómo usar los relojes</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="quick-help-list"><div><b>1 · Jornada</b><span>Elige tienda y pulsa Entrar. Para salir, un solo botón.</span></div><div><b>2 · Tarea</b><span>Selecciona una tarea pendiente e iníciala. Pausar conserva el tiempo registrado.</span></div><div><b>3 · Parada personal</b><span>Cigarro, comida no incluida, recado o llamada personal. NO COMPUTA y detiene la tarea.</span></div><div><b>4 · Interrupción laboral</b><span>Cliente, comercial, compañero, proveedor o incidencia. COMPUTA jornada pero separa ese tiempo de la tarea.</span></div></div><div class="note" style="margin-top:12px">Solo se pide una explicación cuando el motivo seleccionado la necesita. El objetivo es que las acciones habituales requieran 1–2 toques.</div>`)};

  window.quickClockIn=async function(){
    if(!canOperate())return notifyMsg('Tu perfil es de solo lectura.','warn');
    if(openAttendance())return;
    const loc=document.getElementById('qcLocation')?.value||preferredLocation();if(!loc)return notifyMsg('Selecciona una tienda.','warn');
    const {error}=await sb.rpc('attendance_clock_in',{p_location_id:loc});if(error)return notifyMsg(error.message,'bad');
    localStorage.setItem(LAST_LOC_KEY,loc);notifyMsg(`Entrada registrada · ${locationName(loc)}.`);await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);
  };
  window.quickClockOut=async function(){
    const a=openAttendance();if(!a)return;
    const active=openTaskTime(),intr=openTaskInterruption(),br=openPersonalBreak();if(active||intr||br)return modal(`<div class="section-head"><div><div class="eyebrow">Cerrar jornada</div><h3>Antes de salir</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="warn-note note">${br?'Tienes una parada personal abierta. ':''}${intr?'Tienes una interrupción laboral activa. ':''}${active?'Tienes una tarea contando tiempo. ':''}Finaliza esos relojes antes de fichar salida para que el día quede correctamente conciliado.</div>`);
    const {error}=await sb.rpc('attendance_clock_out');if(error)return notifyMsg(error.message,'bad');notifyMsg(`Salida registrada · ${locationName(a.location_id)}.`);await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);
  };
  window.quickStartTask=async function(){
    if(!openAttendance())return notifyMsg('Fichar entrada es obligatorio antes de iniciar una tarea.','warn');
    if(openPersonalBreak())return notifyMsg('Finaliza la parada personal antes de iniciar una tarea.','warn');
    const id=document.getElementById('qcTask')?.value||preferredTask();if(!id)return notifyMsg('No hay una tarea seleccionada.','warn');
    localStorage.setItem(LAST_TASK_KEY,id);const {error}=await sb.rpc('task_timer_start',{p_task_id:id});if(error){if(/justificar|agotado|autorizado/i.test(error.message))return justifyTaskOverrun(id,error.message);return notifyMsg(error.message,'bad')}
    await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);notifyMsg(`Tarea iniciada · ${db.tasks.find(x=>x.id===id)?.title||'Tarea'}.`);
  };
  window.quickPauseTask=async function(){
    if(!openTaskTime())return;const {error}=await sb.rpc('task_timer_stop');if(error)return notifyMsg(error.message,'bad');await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);notifyMsg('Tarea pausada.');
  };
  window.quickResumeTask=async function(id){
    if(!id)return;const {error}=await sb.rpc('task_resume',{p_task_id:id});if(error){if(/justificar|agotado|autorizado/i.test(error.message))return justifyTaskOverrun(id,error.message);return notifyMsg(error.message,'bad')}localStorage.setItem(LAST_TASK_KEY,id);await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);notifyMsg('Tarea reanudada.');
  };

  function promptReason(title,description,onSave){
    window._totusQuickReasonSave=onSave;modal(`<div class="section-head"><div><div class="eyebrow">Detalle rápido</div><h3>${esc(title)}</h3><div class="small">${esc(description)}</div></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div style="margin-top:12px"><label>Motivo / detalle · obligatorio</label><input id="quickReasonNote" maxlength="300" autocomplete="off" placeholder="Escribe una frase corta"></div><div class="actions" style="margin-top:12px"><button class="primary" onclick="submitQuickReason()">Registrar</button></div>`)
  }
  window.submitQuickReason=function(){const note=document.getElementById('quickReasonNote')?.value.trim()||'';if(note.length<5)return notifyMsg('Escribe un detalle de al menos 5 caracteres.','warn');const cb=window._totusQuickReasonSave;window._totusQuickReasonSave=null;closeModal();if(typeof cb==='function')cb(note)};

  async function startPersonalWith(code,note=''){
    const bt=breakType(code);if(!bt)return notifyMsg('Motivo no disponible.','warn');
    const active=openTaskTime();if(active)localStorage.setItem(LAST_TASK_KEY,active.task_id);
    const {error}=await sb.rpc('attendance_pause_start',{p_break_type:code,p_notes:note||null});if(error)return notifyMsg(error.message,'bad');await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);notifyMsg(`${bt.label} iniciada · NO COMPUTA.`,'warn');
  }
  window.quickStartPersonalBreak=function(){
    if(!openAttendance())return notifyMsg('Debes estar fichado para iniciar una parada personal.','warn');if(openPersonalBreak())return;
    const code=document.getElementById('qcPersonal')?.value,bt=breakType(code);if(!bt)return;
    if(bt.requires_note)return promptReason(bt.label,'Esta parada exige una explicación breve para el histórico.',note=>startPersonalWith(code,note));
    startPersonalWith(code,'');
  };
  window.quickStopPersonalBreak=async function(resume=false){
    const br=openPersonalBreak();if(!br)return;const {error}=await sb.rpc('attendance_break_stop');if(error)return notifyMsg(error.message,'bad');await reloadTeamData();
    const prev=localStorage.getItem(LAST_TASK_KEY);if(resume&&prev&&db.tasks.some(x=>x.id===prev&&x.assigned_to===me()?.id&&!['done','cancelled'].includes(x.status))){const rr=await sb.rpc('task_timer_start',{p_task_id:prev});if(rr.error)notifyMsg(`Parada finalizada. No se pudo reanudar la tarea: ${rr.error.message}`,'warn');else notifyMsg('Parada finalizada y tarea reanudada.')}else notifyMsg(`${breakName(br.break_type)} finalizada.`);
    await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);
  };

  async function startWorkWith(code,note=''){
    const timer=openTaskTime();if(!timer)return notifyMsg('Necesitas una tarea activa para registrar una interrupción laboral.','warn');const bt=breakType(code);if(!bt)return;
    localStorage.setItem(LAST_TASK_KEY,timer.task_id);const {error}=await sb.rpc('task_suspend',{p_task_id:timer.task_id,p_reason_code:code,p_reason_note:note||null});if(error)return notifyMsg(error.message,'bad');await reloadTeamData();tick();if(state.root==='tasks')renderTasks();renderQuickClockBar(true);notifyMsg(`${bt.label} registrada · COMPUTA como trabajo.`,'warn');
  }
  window.quickStartWorkInterruption=function(){
    const code=document.getElementById('qcWork')?.value,bt=breakType(code);if(!bt)return;
    if(bt.requires_note)return promptReason(bt.label,'Añade una frase corta para distinguir esta interrupción laboral.',note=>startWorkWith(code,note));
    startWorkWith(code,'');
  };

  const baseTick=window.tick;
  if(typeof baseTick==='function')window.tick=function(){const r=baseTick.apply(this,arguments);renderQuickClockBar(false);return r};
  const basePaint=window.paintUser;
  if(typeof basePaint==='function')window.paintUser=function(){const r=basePaint.apply(this,arguments);requestAnimationFrame(()=>renderQuickClockBar(true));return r};
  requestAnimationFrame(()=>renderQuickClockBar(true));
})();
