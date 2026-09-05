/* Totus Central · Vistas de trabajo
   Composición única inspirada en la base visual: contexto estable, tarjetas equivalentes,
   dos columnas de trabajo y operaciones secundarias en ventanas emergentes. */
(function(){
  const systemAdmin=()=>typeof isSystemAdmin==='function'?isSystemAdmin():isAdmin();
  const manager=()=>typeof canManageTeam==='function'?canManageTeam():['admin','gerente'].includes(currentRole());
  const supervisor=()=>typeof canSuperviseTeam==='function'?canSuperviseTeam():['admin','gerente','encargado'].includes(currentRole());
  const planner=()=>typeof canPlanTeam==='function'?canPlanTeam():supervisor();
  const purchaseManager=()=>typeof canManagePurchases==='function'?canManagePurchases():manager();
  const contextUid=()=>typeof employeeContextUserId==='function'?employeeContextUserId():me()?.id;

  function pageHead(kicker,title,description,actions=''){
    return `<div class="ref-page-head"><div class="ref-page-copy">${kicker?`<div class="ref-kicker">${esc(kicker)}</div>`:''}<h1>${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:''}</div>${actions?`<div class="ref-page-actions">${actions}</div>`:''}</div>`;
  }
  function card(title,body,{hint='',actions='',className=''}={}){
    return `<section class="card ref-card ${className}"><div class="ref-card-head"><div><h3>${title}</h3>${hint?`<div class="small">${hint}</div>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>${body}</section>`;
  }
  function modalHead(kicker,title,description=''){
    return `<div class="section-head ref-modal-head"><div>${kicker?`<div class="ref-kicker">${esc(kicker)}</div>`:''}<h3>${esc(title)}</h3>${description?`<div class="small">${esc(description)}</div>`:''}</div><button class="ghost" onclick="closeModal()">Cerrar</button></div>`;
  }

  /* Panel: elimina duplicidad de relojes/accesos y usa los widgets como tarjetas homogéneas. */
  window.personalPanelHtml=function(uid){
    const widgets=[];
    if(panelHas('alarms'))widgets.push(`<div class="ref-slot">${panelAlarmsHtml(uid)}</div>`);
    if(panelHas('tasks'))widgets.push(`<div class="ref-slot">${panelTasksHtml(uid)}</div>`);
    if(panelHas('month'))widgets.push(`<div class="ref-slot">${hoursCountdownHtml(uid)}</div>`);
    if(panelHas('miniCalendar'))widgets.push(`<div class="ref-slot">${panelMiniCalendarHtml(uid)}</div>`);
    if(panelHas('leave'))widgets.push(`<div class="ref-slot">${leavePanelHtml(uid,true)}</div>`);
    if(panelHas('notifications'))widgets.push(`<div class="ref-slot ref-span-2">${notificationsPanelHtml(uid)}</div>`);
    if(panelHas('stats'))widgets.push(`<div class="ref-slot ref-span-2">${panelStatsHtml(uid)}</div>`);
    if(panelHas('recent'))widgets.push(`<div class="ref-slot ref-span-2">${panelRecentHtml(uid)}</div>`);
    if(panelHas('now')&&!widgets.length)widgets.push(`<div class="ref-slot">${panelNowHtml()}</div>`);
    return `${pageHead('Panel de trabajo','Mi panel','Tareas, avisos, calendario y horas sin repetir los controles permanentes de la cabecera.',`<button class="secondary" onclick="customizePanel()">Configurar panel</button>`)}<div class="ref-dashboard-grid">${widgets.join('')||`<div class="empty-state big ref-span-2"><b>Tu panel está vacío</b><span>Activa solo los bloques que quieras consultar.</span><button class="primary" onclick="customizePanel()">Elegir bloques</button></div>`}</div>`;
  };

  /* Alta/edición de tarea siempre en modal. */
  function setNewTaskDraft(){
    const loc=db.locations.find(x=>x.active!==false)?.id||null,cat=db.taskCategories.find(c=>c.active!==false)?.id||null,now=new Date();
    state.editTaskId=null;state.taskEditorContext='modal';state.taskDraft={title:'',category_id:cat,description:'',starts_at:inputDT(now),due_at:inputDT(new Date(now.getTime()+3600000)),assigned_to:db.people.find(p=>p.role!=='invitado'&&p.id!==me().id)?.id||me().id,location_id:loc,priority:'normal',is_private:true,estimated_minutes:30,reminder_minutes:Number(db.settings.task_rules?.default_reminder_minutes||15),requires_evidence:false,recurrence:{enabled:false,frequency:'weekly',interval:1,weekdays:[weekday1(now)],until:null,count:0,occurrence:1}};
  }
  window.newTaskToday=function(){if(!planner())return notifyMsg('Tu rol no permite crear tareas.','warn');setNewTaskDraft();modal(taskEditorHtml())};
  window.editTask=function(id){if(!planner())return openTaskCard(id);const t=db.tasks.find(x=>x.id===id);if(!t)return;state.editTaskId=id;state.taskEditorContext='modal';state.taskDraft={...t,starts_at:inputDT(t.starts_at),due_at:inputDT(t.due_at),recurrence:{enabled:false,frequency:'weekly',interval:1,weekdays:[],until:null,count:0,occurrence:1,...(t.recurrence||{})}};modal(taskEditorHtml())};
  window.cancelTaskEdit=function(){state.editTaskId=null;state.taskDraft=null;state.taskEditorContext=null;closeModal();if(state.root==='tasks'&&state.sub==='tasks')renderTasks()};

  /* Tarjeta de tarea: información esencial y una sola acción principal. */
  window.taskCard=function(t){
    const p=person(t.assigned_to),mine=t.assigned_to===me().id,running=openTaskTime()?.task_id===t.id,suspended=openTaskInterruption(t.id,t.assigned_to),worked=taskWorkedSeconds(t.id,t.assigned_to),closed=['done','cancelled'].includes(t.status),ev=taskEvidence(t.id),canAct=mine&&canOperate()&&!closed;
    const action=canAct?(running?`<button class="primary" onclick="stopTaskTimer()">Pausar</button>`:suspended?`<button class="primary" onclick="resumeTask('${t.id}')">Reanudar</button>`:`<button class="primary" onclick="startTaskTimer('${t.id}')">Iniciar</button>`):'';
    return `<article class="task-card ref-task ${running?'running':''} ${suspended?'suspended':''}"><div class="ref-task-main"><div class="ref-task-title"><b>${esc(t.title)}</b><span>${esc(taskCategoryName(t.category_id))} · ${esc(locationName(t.location_id))}${p?' · '+esc(p.name):''}</span></div><div class="ref-task-badges"><span class="badge ${badgeStatus(t.status)}">${taskStatusName(t.status)}</span><span class="badge ${t.priority==='urgent'?'badb':t.priority==='high'?'warnb':'info'}">${priorityName(t.priority)}</span>${t.requires_evidence?`<span class="badge ${ev.length?'ok':'warnb'}">${ev.length?'Evidencia':'Foto requerida'}</span>`:''}</div></div><div class="ref-task-meta"><span>${t.due_at?'Vence '+dt(t.due_at):'Sin vencimiento'}</span><strong>${fmtDur(worked)}</strong></div>${t.description?`<div class="ref-task-desc">${esc(t.description)}</div>`:''}<div class="task-actions-compact">${action}<button class="ghost task-more-button" onclick="openTaskActions('${t.id}')">Más opciones</button></div></article>`;
  };
  window.openTaskActions=function(taskId){
    const t=db.tasks.find(x=>x.id===taskId);if(!t)return;const mine=t.assigned_to===me().id,running=openTaskTime()?.task_id===t.id,suspended=openTaskInterruption(t.id,t.assigned_to),closed=['done','cancelled'].includes(t.status),ev=taskEvidence(t.id),rows=[];
    if(mine&&!closed&&canOperate()&&running){rows.push(`<button class="task-action-option" onclick="closeModal();resetTaskTimer()"><b>Reiniciar tramo</b><span>Nuevo tramo en la misma tarea.</span></button>`);rows.push(`<button class="task-action-option" onclick="closeModal();suspendTask('${t.id}')"><b>Actividad laboral</b><span>Llamada, cliente, proveedor, reunión o incidencia.</span></button>`)}
    if(mine&&!closed&&canOperate()&&suspended)rows.push(`<button class="task-action-option primary-option" onclick="closeModal();resumeTask('${t.id}')"><b>Reanudar tarea</b><span>Finaliza la actividad laboral y vuelve a esta tarea.</span></button>`);
    if((mine||planner())&&canOperate())rows.push(`<button class="task-action-option" onclick="closeModal();openEvidenceUploader('${t.id}')"><b>Añadir evidencia</b><span>Foto o archivo asociado a la tarea.</span></button>`);
    if(ev.length)rows.push(`<button class="task-action-option" onclick="closeModal();openTaskEvidence('${t.id}')"><b>Ver evidencias</b><span>${ev.length} archivo${ev.length===1?'':'s'}.</span></button>`);
    if(mine&&!closed&&canOperate())rows.push(`<button class="task-action-option" onclick="closeModal();completeTask('${t.id}')"><b>Completar</b><span>Cierra la tarea conservando sus tiempos.</span></button>`);
    if(planner())rows.push(`<button class="task-action-option" onclick="closeModal();editTask('${t.id}')"><b>Editar planificación</b><span>Responsable, fechas, prioridad y recurrencia.</span></button>`);
    modal(`${modalHead('Tarea',t.title,`${locationName(t.location_id)} · ${taskStatusName(t.status)} · ${fmtDur(taskWorkedSeconds(t.id,t.assigned_to))}`)}<div class="task-action-menu-grid">${rows.join('')||'<div class="empty-state compact"><b>Sin acciones disponibles</b></div>'}</div>`)
  };
  window.openTaskCategoryDialog=function(){if(!systemAdmin())return;modal(`${modalHead('Configuración','Categorías de tareas','Catálogo disponible para nuevas tareas.')}${taskCategoryAdminHtml()}`)};
  window.openTaskLogDialog=function(){modal(`${modalHead('Histórico','Trazabilidad de tareas','Cambios y operaciones conservados.')}${taskLocalLogHtml()}`)};
  window.tasksHtml=function(){
    const all=supervisor()?db.tasks:db.tasks.filter(t=>t.assigned_to===me().id),qv=(state.taskSearch||'').trim().toLowerCase(),filter=state.taskStatusFilter||'open',match=t=>!qv||[t.title,t.description,locationName(t.location_id),taskCategoryName(t.category_id),person(t.assigned_to)?.name].join(' ').toLowerCase().includes(qv),visible=all.filter(match),open=visible.filter(t=>!['done','cancelled'].includes(t.status)).sort((a,b)=>(a.due_at?new Date(a.due_at):Infinity)-(b.due_at?new Date(b.due_at):Infinity)),done=visible.filter(t=>t.status==='done'),cancelled=visible.filter(t=>t.status==='cancelled'),rows=filter==='done'?done:filter==='cancelled'?cancelled:filter==='all'?visible:open;
    const actions=`${planner()?'<button class="primary" onclick="newTaskToday()">+ Nueva tarea</button>':''}${systemAdmin()?'<button class="secondary" onclick="openTaskCategoryDialog()">Categorías</button>':''}<button class="secondary" onclick="openTaskLogDialog()">Histórico</button>`;
    return `${pageHead('Trabajo','Tareas','Busca, ejecuta y revisa tareas sin mezclar la planificación con la operativa.',actions)}<section class="card ref-filter-card"><div class="ref-filter-grid"><label><span>Buscar</span><input value="${esc(state.taskSearch||'')}" placeholder="Título, centro, categoría o persona" oninput="state.taskSearch=this.value;renderTasks()"></label><label><span>Estado</span><select onchange="state.taskStatusFilter=this.value;renderTasks()"><option value="open" ${filter==='open'?'selected':''}>Abiertas</option><option value="done" ${filter==='done'?'selected':''}>Completadas</option><option value="cancelled" ${filter==='cancelled'?'selected':''}>Canceladas</option><option value="all" ${filter==='all'?'selected':''}>Todas</option></select></label><div class="ref-result-count"><span>Resultado</span><b>${rows.length}</b></div></div></section><div class="ref-task-grid">${rows.slice(0,200).map(taskCard).join('')||'<div class="empty-state big ref-span-2"><b>Sin resultados</b><span>No hay tareas que coincidan con el filtro.</span></div>'}</div>`;
  };

  /* Programación: editor principal visible, configuración secundaria fuera de la página. */
  window.openScheduleSettings=function(kind){if(!systemAdmin())return;const map={opening:()=>openingHoursAdminHtml(),breaks:()=>breakCatalogAdminHtml(),categories:()=>taskCategoryAdminHtml(),rules:()=>workRulesAdminHtml(),holidays:()=>holidayAdminPanelHtml()};const fn=map[kind];if(fn)modal(`${modalHead('Configuración','Ajustes de programación','Cambios globales reservados a administración.')}${fn()}`)};
  window.scheduleHtml=function(){
    const uid=contextUid()||state.scheduleUserId||me().id,u=person(uid)||me(),can=manager(),hs=monthlyHourState(uid);state.scheduleUserId=uid;ensureScheduleSelection(uid);const period=schedulePeriods(uid).find(x=>(x.valid_from||'')===state.scheduleFrom&&(x.location_id||'')===(state.scheduleLocationId||'')),periodSummary=period?`${period.season_name||'Base'} · ${locationName(period.location_id)} · ${period.valid_from||''} → ${period.valid_to||'sin fin'}`:'Sin temporada guardada';
    const cfg=systemAdmin()?`<button class="secondary" onclick="openScheduleSettings('opening')">Apertura</button><button class="secondary" onclick="openScheduleSettings('breaks')">Paradas</button><button class="secondary" onclick="openScheduleSettings('holidays')">Festivos</button><button class="ghost" onclick="openScheduleSettings('rules')">Más ajustes</button>`:'';
    const weekly=`${scheduleSeasonControls(uid,can)}<div class="ref-weekly-editor">${scheduleEditor(uid,can)}</div>${can?'<div class="actions"><button class="primary" onclick="saveSchedule()">Guardar horario</button><button class="secondary" onclick="newScheduleException(\''+uid+'\')">+ Excepción</button></div>':''}`;
    const objective=`<div class="ref-objective-row"><div><span>Objetivo</span><b>${fmtHours(hs.target)}</b></div><div><span>Realizado</span><b>${fmtHours(hs.worked)}</b></div></div><div class="form-grid ref-form-2"><label><span>Mes</span><input id="targetMonth" type="month" value="${monthKey(new Date()).slice(0,7)}"></label><label><span>Objetivo mensual · horas</span><input id="targetHours" type="number" min="0" step="0.25" value="${targetValueHours(uid)}" ${can?'':'disabled'}></label></div>${can?'<div class="actions"><button class="secondary" onclick="saveMonthlyTarget()">Guardar objetivo</button></div>':''}`;
    return `${pageHead('Planificación','Programación',`${u.name} · ${periodSummary}`,cfg)}<div class="ref-work-grid">${card('Horario semanal',weekly,{hint:'Temporada, turnos y jornada partida.',className:'ref-span-2'})}${card('Objetivo mensual',objective,{hint:'Seguimiento del mes sin alterar el registro real.'})}${card('Excepciones puntuales',`<div class="list ref-exception-list">${scheduleExceptionList(uid)}</div>`,{hint:'Cambios de un día, incidencias o ajustes temporales.'})}</div>`;
  };

  /* Compras: resumen limpio; el alta vive en modal. */
  window.openPurchaseCreate=function(uid){if(!canRegisterPurchase())return;const rules=db.settings.employee_purchase_rules||{vat_pct:21,re_pct:5.2,store_discount_pct:10};modal(`${modalHead('Compras','Registrar compra','Completa únicamente los datos de esta operación.')}${purchaseForm(uid||me().id,rules)}`);requestAnimationFrame(()=>calcPurchasePreview())};
  window.purchaseOverviewHtml=function(){
    const uid=purchaseManager()?(state.purchaseUserId||''):me().id,rows=db.purchases.filter(x=>!uid||x.user_id===uid),total=rows.filter(x=>x.status!=='cancelled').reduce((a,x)=>a+Number(x.total||0),0),rules=db.settings.employee_purchase_rules||{vat_pct:21,re_pct:5.2,store_discount_pct:10},latest=[...rows].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6),target=uid||me().id;
    const stats=`<div class="ref-stat-strip"><div><span>Registros</span><b>${rows.length}</b></div><div><span>Pendientes</span><b>${rows.filter(x=>x.status==='pending').length}</b></div><div><span>Canceladas</span><b>${rows.filter(x=>x.status==='cancelled').length}</b></div><div><span>Importe activo</span><b>${money(total)}</b></div></div>`;
    const recent=`<div class="ref-compact-list">${latest.map(p=>`<div><span><b>${esc(p.item_name)}</b><small>${esc(person(p.user_id)?.name||'')} · ${esc(locationName(p.location_id))} · ${esc(p.purchase_date||'')}</small></span><strong>${money(p.total)}</strong></div>`).join('')||'<div class="empty-state compact"><b>Sin compras registradas</b></div>'}</div>`;
    const rule=`<div class="ref-rule-lines"><div><span>Compra de stock</span><b>PVP − ${Number(rules.store_discount_pct||10).toLocaleString('es-ES')}%</b></div><div><span>Pedido a proveedor</span><b>Coste + IVA + RE</b></div></div><div class="note">Los registros no se eliminan: cancelaciones y correcciones permanecen auditadas.</div>`;
    return `${pageHead('Equipo','Compras','Registro y seguimiento sin mezclarlo con Pricing.',canRegisterPurchase()?`<button class="primary" onclick="openPurchaseCreate('${target}')">+ Registrar compra</button>`:'')}${stats}<div class="ref-work-grid">${card('Últimas compras',recent,{hint:'Movimientos recientes del ámbito seleccionado.'})}${card('Reglas de compra',rule,{hint:'Cálculo aplicado a compras de empleados.'})}<div class="ref-span-2">${purchaseAlerts(rows)}</div></div>`;
  };
})();
