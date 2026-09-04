/* Totus Central · Contexto unificado de empleado
   Un único selector Admin + una única ficha reutilizable en todas las áreas de empleado. */
(function(){
  state.employeeContextUserId=state.employeeContextUserId||localStorage.getItem('totus_employee_context')||'';

  const admin=()=>typeof isSystemAdmin==='function'?isSystemAdmin():isAdmin();
  const contextUid=()=>admin()?(state.employeeContextUserId||me()?.id):me()?.id;
  window.employeeContextUserId=contextUid;
  window.employeeContextUser=()=>person(contextUid())||me();

  function assignments(uid){
    const ids=new Set((db.memberLocations||[]).filter(x=>x.active!==false&&x.user_id===uid).map(x=>x.location_id));
    return (db.locations||[]).filter(l=>ids.has(l.id)&&l.active!==false);
  }
  function attendanceFor(uid){return (db.attendance||[]).find(x=>x.user_id===uid&&!x.clock_out)}
  function taskFor(uid){const te=(db.taskTimes||[]).find(x=>x.user_id===uid&&!x.stopped_at);return te?db.tasks.find(t=>t.id===te.task_id):null}
  function initials(name='?'){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
  function avatar(u){return u?.avatarUrl?`<img src="${esc(u.avatarUrl)}" alt="Foto de ${esc(u.name)}">`:esc(initials(u?.name))}

  window.employeeContextCardHtml=function(uid=contextUid()){
    const u=person(uid)||me();if(!u)return'';
    const locs=assignments(uid),att=attendanceFor(uid),task=taskFor(uid);
    const status=att?`En jornada · ${locationName(att.location_id)}`:'Fuera de jornada';
    return `<section class="employee-context-card" data-employee-id="${esc(uid)}" aria-label="Ficha del empleado"><div class="employee-context-avatar">${avatar(u)}</div><div class="employee-context-main"><div class="employee-context-name">${esc(u.name)}</div><div class="employee-context-sub">${esc(u.jobTitle||humanRole(u.role))}</div><div class="employee-context-tags"><span>${esc(humanRole(u.role))}</span>${locs.map(l=>`<span>${esc(l.name)}</span>`).join('')}</div></div><div class="employee-context-facts"><div><small>ESTADO</small><b>${esc(status)}</b></div><div><small>TRABAJO ACTUAL</small><b>${esc(task?.title||'Sin tarea activa')}</b></div><div><small>ÁMBITO</small><b>${locs.length?esc(locs.map(x=>x.name).join(' · ')):'Sin asignación'}</b></div></div></section>`;
  };

  function shouldShowContext(){
    if(state.root==='tasks')return state.sub!=='stores';
    if(state.root==='purchases')return true;
    return false;
  }
  function injectContext(){
    const main=document.getElementById('main');if(!main||main.classList.contains('hidden')||!shouldShowContext())return;
    main.querySelector(':scope > .employee-context-card')?.remove();
    main.insertAdjacentHTML('afterbegin',employeeContextCardHtml());
  }

  function selectorHtml(){
    if(!admin())return'';const uid=contextUid();
    return `<label class="employee-context-select-wrap" for="employeeContextSelect"><span>Empleado</span><select id="employeeContextSelect" onchange="changeEmployeeContext(this.value)">${(db.people||[]).filter(p=>p.active!==false).map(p=>`<option value="${p.id}" ${p.id===uid?'selected':''}>${esc(p.name)} · ${esc(humanRole(p.role))}</option>`).join('')}</select></label>`;
  }
  function ensureSelector(){
    const host=document.querySelector('.shell-top-actions');if(!host)return;
    host.querySelector('.employee-context-select-wrap')?.remove();
    if(admin())host.insertAdjacentHTML('afterbegin',selectorHtml());
  }

  function syncLegacyFilters(uid){
    Object.assign(state,{historyUserId:uid,timeUserId:uid,reportUserId:uid,purchaseUserId:uid,scheduleUserId:uid,incidentUserId:uid,documentUserId:uid,calendarUserId:uid,logUserId:uid});
  }
  window.changeEmployeeContext=function(uid){
    if(!admin())return;const u=person(uid);if(!u)return;state.employeeContextUserId=uid;localStorage.setItem('totus_employee_context',uid);syncLegacyFilters(uid);ensureSelector();
    if(state.root==='tasks')renderTasks();else if(state.root==='purchases')renderPurchasesModule();else if(state.root==='logs')renderGeneralLog();
  };

  window.newLeaveRequestPreset=function(code){
    if(typeof newLeaveRequest!=='function')return;newLeaveRequest();requestAnimationFrame(()=>{const el=document.getElementById('reqLeaveType');if(el&&[...el.options].some(o=>o.value===code))el.value=code})
  };
  window.employeeLeaveHtml=function(){
    const uid=contextUid(),u=person(uid)||me(),self=uid===me()?.id;
    return `<div class="head"><div><div class="eyebrow">Días libres y ausencias</div><h1>${self?'Mis días libres':'Días libres · '+esc(u?.name||'Empleado')}</h1><p>Vacaciones, asuntos médicos y asuntos personales en el mismo expediente. Las solicitudes quedan pendientes hasta su aprobación.</p></div>${self&&canOperate()?`<div class="actions leave-quick-actions"><button class="primary" onclick="newLeaveRequestPreset('vacation')">Solicitar vacaciones</button><button class="secondary" onclick="newLeaveRequestPreset('medical')">Médico</button><button class="secondary" onclick="newLeaveRequestPreset('personal_management')">Asunto personal</button></div>`:''}</div>${leavePanelHtml(uid,false)}`;
  };

  const baseRenderTasks=window.renderTasks;
  if(typeof baseRenderTasks==='function')window.renderTasks=function(){
    if(state.sub==='leave'){const main=document.getElementById('main');main.innerHTML=employeeLeaveHtml();tick();requestAnimationFrame(()=>{injectContext();ensureSelector()});return}
    const r=baseRenderTasks.apply(this,arguments);requestAnimationFrame(()=>{injectContext();ensureSelector()});return r
  };
  const basePurchases=window.renderPurchasesModule;
  if(typeof basePurchases==='function')window.renderPurchasesModule=function(){const r=basePurchases.apply(this,arguments);requestAnimationFrame(()=>{injectContext();ensureSelector()});return r};
  const basePaint=window.paintUser;if(typeof basePaint==='function')window.paintUser=function(){const r=basePaint.apply(this,arguments);if(!state.employeeContextUserId||!person(state.employeeContextUserId))state.employeeContextUserId=me()?.id||'';requestAnimationFrame(()=>{ensureSelector();injectContext()});return r};

  const baseRenderSubnav=window.renderSubnav;
  window.renderSubnav=function(){
    if(state.root==='tasks'){
      const sys=admin(),mgr=typeof canManageTeam==='function'&&canManageTeam(),sup=typeof canSuperviseTeam==='function'&&canSuperviseTeam();
      const tabs=sys?[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Documentación'],['reports','Informes'],['stores','Centros y proyectos']]:mgr?[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Documentación'],['reports','Informes']]:sup?[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Horarios'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Mis documentos'],['reports','Informes']]:[['mine','Mi panel'],['calendar','Calendario'],['tasks','Mis tareas'],['schedule','Mi horario'],['leave','Días libres'],['attendance','Mis fichajes'],['incidents','Mis incidencias'],['documents','Mis documentos'],['reports','Mis informes']];
      return renderSubnavSet(tabs)
    }
    return baseRenderSubnav.apply(this,arguments)
  };

  window.toggleSidebarCollapsed=function(force){
    if(window.innerWidth<=1180)return toggleShellNav();const next=typeof force==='boolean'?force:!document.body.classList.contains('shell-sidebar-collapsed');document.body.classList.toggle('shell-sidebar-collapsed',next);localStorage.setItem('totus_sidebar_collapsed',next?'1':'0')
  };
  function ensureSidebarToggle(){const top=document.querySelector('.shell-topbar');if(!top||document.getElementById('sidebarCollapseBtn'))return;const b=document.createElement('button');b.id='sidebarCollapseBtn';b.type='button';b.className='shell-sidebar-toggle';b.title='Recoger o desplegar menú lateral';b.setAttribute('aria-label','Recoger o desplegar menú lateral');b.innerHTML='☰';b.onclick=()=>toggleSidebarCollapsed();top.insertBefore(b,top.firstChild)}
  function init(){if(localStorage.getItem('totus_sidebar_collapsed')==='1'&&window.innerWidth>1180)document.body.classList.add('shell-sidebar-collapsed');ensureSidebarToggle();ensureSelector();injectContext()}
  requestAnimationFrame(init);
})();