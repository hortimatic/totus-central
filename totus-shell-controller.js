/* Totus Central · Shell y navegación únicos
   Un único propietario para navegación, contexto de empleado y jerarquía visual. */
(function(){
  const ADMIN=()=>typeof isSystemAdmin==='function'?isSystemAdmin():currentRole()==='admin';
  const MANAGER=()=>typeof canManageTeam==='function'?canManageTeam():['admin','gerente'].includes(currentRole());
  const SUPERVISOR=()=>typeof canSuperviseTeam==='function'?canSuperviseTeam():['admin','gerente','encargado'].includes(currentRole());
  const SIDEBAR_KEY='totus_sidebar_collapsed';
  const EMPLOYEE_KEY='totus_employee_context';

  const META={
    pricing:{title:'Precios',subtitle:'Cálculo, consultas, catálogo y márgenes.'},
    users:{title:'Usuarios',subtitle:'Equipo, accesos, roles y permisos.'},
    library:{title:'Ayuda y tutoriales',subtitle:'Documentación, protocolos y consultas internas.'},
    logs:{title:'Histórico',subtitle:'Trazabilidad, auditoría y mantenimiento.'},
    purchases:{title:'Compras',subtitle:'Registro y seguimiento de compras de empleados.'},
    'tasks:mine':{title:'Mi panel',subtitle:'Tu jornada, trabajo actual, alarmas y próximos pasos.'},
    'tasks:overview':{title:'Equipo',subtitle:'Estado operativo del equipo y carga de trabajo.'},
    'tasks:calendar':{title:'Calendario',subtitle:'Tareas, horarios, ausencias y días especiales.'},
    'tasks:tasks':{title:'Tareas',subtitle:'Trabajo pendiente, en curso y completado.'},
    'tasks:schedule':{title:'Programación',subtitle:'Horarios y planificación del equipo.'},
    'tasks:leave':{title:'Días libres',subtitle:'Vacaciones, médico, asuntos personales y otras ausencias.'},
    'tasks:attendance':{title:'Fichajes',subtitle:'Jornadas, horas y correcciones autorizadas.'},
    'tasks:incidents':{title:'Incidencias',subtitle:'Seguimiento de incidencias del expediente laboral.'},
    'tasks:documents':{title:'Documentación',subtitle:'Documentación privada del expediente de empleado.'},
    'tasks:reports':{title:'Informes',subtitle:'Horas, actividad, tareas y trazabilidad.'},
    'tasks:stores':{title:'Centros y proyectos',subtitle:'Tiendas, proyectos digitales, clientes y otros centros.'}
  };

  function defaultSub(root){
    if(root==='tasks')return'mine';
    if(root==='purchases')return'summary';
    if(root==='library')return'tutorials';
    if(root==='logs')return'general-log';
    if(root==='users')return'users-home';
    return'';
  }
  function tabs(root){
    if(root==='tasks'){
      if(ADMIN())return[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Documentación'],['reports','Informes'],['stores','Centros y proyectos']];
      if(MANAGER())return[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Documentación'],['reports','Informes']];
      if(SUPERVISOR())return[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Horarios'],['leave','Días libres'],['attendance','Fichajes'],['incidents','Incidencias'],['documents','Mis documentos'],['reports','Informes']];
      return[['mine','Mi panel'],['calendar','Calendario'],['tasks','Mis tareas'],['schedule','Mi horario'],['leave','Días libres'],['attendance','Mis fichajes'],['incidents','Mis incidencias'],['documents','Mis documentos'],['reports','Mis informes']];
    }
    if(root==='purchases')return MANAGER()?[['summary','Resumen'],['history','Historial'],['reports','Informes'],['audit','Auditoría']]:[['summary','Resumen'],['history','Historial'],['reports','Informes']];
    if(root==='library')return[['tutorials','Tutoriales y documentos'],['queries','Consultas internas']];
    if(root==='logs')return ADMIN()?[['general-log','Histórico general'],['maintenance','Backup y mantenimiento']]:[['general-log','Histórico general']];
    return[];
  }

  function setActiveRoot(root){document.querySelectorAll('.nav button[data-root]').forEach(b=>b.classList.toggle('active',b.dataset.root===root))}
  function renderSubnavButtons(rows,host,side=false){
    if(!host)return;host.innerHTML=rows.length?`<div class="subnav-buttons">${rows.map(([k,n])=>`<button type="button" class="${state.sub===k?'active':''}" onclick="goSub('${k}')">${esc(n)}</button>`).join('')}</div>`:'';
    if(side){const wrap=host.closest('.side-subnav-wrap');if(wrap)wrap.classList.toggle('shell-visible',rows.length>0)}
  }
  window.renderSubnavSet=function(rows){renderSubnavButtons(rows,document.getElementById('subnav'));renderSubnavButtons(rows,document.getElementById('sideSubnav'),true);return''};
  window.renderSubnav=function(){return renderSubnavSet(tabs(state.root))};

  function meta(){return META[`${state.root}:${state.sub}`]||META[state.root]||{title:'Totus Central',subtitle:'Gestión interna'}}
  function paintMeta(){const m=meta(),t=document.getElementById('shellTitle'),s=document.getElementById('shellSubtitle');if(t)t.textContent=m.title;if(s)s.textContent=m.subtitle}
  function paintRootVisibility(){const u=document.querySelector('.nav button[data-root="users"]');if(u)u.classList.toggle('hidden',!ADMIN());document.body.dataset.totusRole=currentRole()}

  function assignmentRows(uid){const ids=new Set((db.memberLocations||[]).filter(x=>x.active!==false&&x.user_id===uid).map(x=>x.location_id));return(db.locations||[]).filter(x=>x.active!==false&&ids.has(x.id))}
  function contextUid(){return ADMIN()?(state.employeeContextUserId||me()?.id):me()?.id}
  window.employeeContextUserId=contextUid;
  window.employeeContextUser=()=>person(contextUid())||me();
  function initials(name='?'){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
  function avatar(u){return u?.avatarUrl?`<img src="${esc(u.avatarUrl)}" alt="Foto de ${esc(u.name)}">`:esc(initials(u?.name))}
  function userAttendance(uid){return(db.attendance||[]).find(x=>x.user_id===uid&&!x.clock_out)}
  function userTask(uid){const tt=(db.taskTimes||[]).find(x=>x.user_id===uid&&!x.stopped_at);if(tt)return(db.tasks||[]).find(t=>t.id===tt.task_id);const i=(db.interruptions||[]).find(x=>x.user_id===uid&&!x.ended_at&&x.task_id);return i?(db.tasks||[]).find(t=>t.id===i.task_id):null}
  function userWork(uid){return(db.interruptions||[]).find(x=>x.user_id===uid&&!x.ended_at&&!x.task_id)}
  function userBreak(uid){return(db.breaks||[]).find(x=>x.user_id===uid&&!x.ended_at&&!x.counts_as_work)}

  window.employeeContextCardHtml=function(uid=contextUid()){
    const u=person(uid)||me();if(!u)return'';const locs=assignmentRows(uid),att=userAttendance(uid),task=userTask(uid),work=userWork(uid),br=userBreak(uid);
    const workText=task?.title||work&&interruptionName(work.reason_code)||br&&`${breakName(br.break_type)} · personal`||'Sin actividad activa';
    const status=att?`En jornada · ${locationName(att.location_id)}`:'Fuera de jornada';
    return `<section class="employee-context-card" data-employee-id="${esc(uid)}" aria-label="Ficha del empleado"><div class="employee-context-avatar">${avatar(u)}</div><div class="employee-context-main"><div class="employee-context-name">${esc(u.name)}</div><div class="employee-context-sub">${esc(u.jobTitle||humanRole(u.role))}</div><div class="employee-context-tags"><span>${esc(humanRole(u.role))}</span>${locs.map(l=>`<span>${esc(l.name)}</span>`).join('')}</div></div><div class="employee-context-facts"><div><small>ESTADO</small><b>${esc(status)}</b></div><div><small>TRABAJO ACTUAL</small><b>${esc(workText)}</b></div><div><small>ÁMBITO</small><b>${locs.length?esc(locs.map(x=>x.name).join(' · ')):'Sin asignación'}</b></div></div></section>`;
  };

  function selectorHtml(){if(!ADMIN())return'';const uid=contextUid();return `<label class="employee-context-select-wrap" for="employeeContextSelect"><span>Empleado</span><select id="employeeContextSelect" onchange="changeEmployeeContext(this.value)">${(db.people||[]).filter(p=>p.active!==false).map(p=>`<option value="${p.id}" ${p.id===uid?'selected':''}>${esc(p.name)} · ${esc(humanRole(p.role))}</option>`).join('')}</select></label>`}
  function ensureSelector(){const host=document.querySelector('.shell-top-actions');if(!host)return;host.querySelector('.employee-context-select-wrap')?.remove();if(ADMIN())host.insertAdjacentHTML('afterbegin',selectorHtml())}
  function syncFilters(uid){Object.assign(state,{historyUserId:uid,timeUserId:uid,reportUserId:uid,purchaseUserId:uid,scheduleUserId:uid,incidentUserId:uid,documentUserId:uid,calendarUserId:uid,logUserId:uid})}
  window.changeEmployeeContext=function(uid){if(!ADMIN()||!person(uid))return;state.employeeContextUserId=uid;localStorage.setItem(EMPLOYEE_KEY,uid);syncFilters(uid);renderCurrent()};

  function shouldCard(){if(state.root==='tasks')return state.sub!=='stores';return state.root==='purchases'}
  function injectCard(){const main=document.getElementById('main');if(!main||main.classList.contains('hidden')||!shouldCard())return;main.querySelector(':scope > .employee-context-card')?.remove();main.insertAdjacentHTML('afterbegin',employeeContextCardHtml())}

  window.newLeaveRequestPreset=function(code){if(typeof newLeaveRequest!=='function')return;newLeaveRequest();requestAnimationFrame(()=>{const el=document.getElementById('reqLeaveType');if(el&&[...el.options].some(o=>o.value===code))el.value=code})};
  window.employeeLeaveHtml=function(){const uid=contextUid(),u=person(uid)||me(),self=uid===me()?.id;return `<div class="head"><div><div class="eyebrow">Días libres y ausencias</div><h1>${self?'Mis días libres':'Días libres · '+esc(u?.name||'Empleado')}</h1><p>Vacaciones, médico, asuntos personales y otras ausencias en un mismo expediente. Las solicitudes quedan pendientes hasta su aprobación.</p></div>${self&&canOperate()?`<div class="actions leave-quick-actions"><button class="primary" onclick="newLeaveRequestPreset('vacation')">Vacaciones</button><button class="secondary" onclick="newLeaveRequestPreset('medical')">Médico</button><button class="secondary" onclick="newLeaveRequestPreset('personal_management')">Asunto personal</button></div>`:''}</div>${leavePanelHtml(uid,false)}`};

  function postRender(){renderSubnav();paintMeta();setActiveRoot(state.root);paintRootVisibility();ensureSelector();injectCard();document.body.classList.add('totus-shell-ready');closeShellNav()}
  function showMain(){document.getElementById('iframeShell')?.classList.add('hidden');document.getElementById('main')?.classList.remove('hidden')}
  function showFrame(){document.getElementById('main')?.classList.add('hidden');document.getElementById('iframeShell')?.classList.remove('hidden')}

  const coreRenderTasks=window.renderTasks;
  if(typeof coreRenderTasks==='function')window.renderTasks=function(){const main=document.getElementById('main');if(state.sub==='leave'&&main)main.innerHTML=employeeLeaveHtml();else coreRenderTasks.apply(this,arguments);requestAnimationFrame(postRender)};
  const coreRenderPurchases=window.renderPurchasesModule;
  if(typeof coreRenderPurchases==='function')window.renderPurchasesModule=function(){const r=coreRenderPurchases.apply(this,arguments);requestAnimationFrame(postRender);return r};

  function renderCurrent(){
    if(!state.root)state.root='tasks';if(!state.sub)state.sub=defaultSub(state.root);
    if(state.root==='pricing'){showFrame();if(typeof showPricing==='function')showPricing('home');postRender();return}
    showMain();
    if(state.root==='users'){if(!ADMIN()){state.root='tasks';state.sub='mine';return renderCurrent()}if(typeof renderNativeUsers==='function'){renderNativeUsers();if(typeof refreshNativeUsers==='function')refreshNativeUsers().then(()=>{if(state.root==='users')renderNativeUsers()})}}
    else if(state.root==='tasks')renderTasks();
    else if(state.root==='purchases')renderPurchasesModule();
    else if(state.root==='library')renderLibraryModule();
    else if(state.root==='logs')renderGeneralLog();
    postRender();
  }
  window.renderCurrentRoot=renderCurrent;
  window.goRoot=function(root,sub=null){
    if(root==='users'&&!ADMIN()){notifyMsg('Usuarios y permisos es exclusivo de administración.','warn');root='tasks';sub='mine'}
    state.root=root;state.sub=sub||defaultSub(root);renderCurrent();
  };
  window.goSub=function(sub){
    if(state.root==='tasks'&&sub==='stores'&&!ADMIN()){notifyMsg('Centros y proyectos se configura desde administración.','warn');sub='mine'}
    if(state.root==='logs'&&sub==='maintenance'&&!ADMIN()){notifyMsg('Backup y mantenimiento es exclusivo de administración.','warn');sub='general-log'}
    state.sub=sub;renderCurrent();
  };

  window.toggleShellNav=function(){document.body.classList.toggle('shell-nav-open')};
  window.closeShellNav=function(){document.body.classList.remove('shell-nav-open')};
  window.toggleSidebarCollapsed=function(force){if(window.innerWidth<=1180)return toggleShellNav();const next=typeof force==='boolean'?force:!document.body.classList.contains('shell-sidebar-collapsed');document.body.classList.toggle('shell-sidebar-collapsed',next);localStorage.setItem(SIDEBAR_KEY,next?'1':'0')};
  function ensureSidebarToggle(){const top=document.querySelector('.shell-topbar');if(!top||document.getElementById('sidebarCollapseBtn'))return;const b=document.createElement('button');b.id='sidebarCollapseBtn';b.type='button';b.className='shell-sidebar-toggle';b.title='Recoger o desplegar menú lateral';b.setAttribute('aria-label','Recoger o desplegar menú lateral');b.textContent='☰';b.onclick=()=>toggleSidebarCollapsed();top.insertBefore(b,top.firstChild)}

  function normalizeNav(){const nav=document.querySelector('.nav');if(!nav||nav.dataset.normalized)return;nav.dataset.normalized='1';const labels={pricing:'Precios',tasks:'Trabajo',purchases:'Compras',users:'Usuarios',library:'Ayuda y tutoriales',logs:'Histórico'};nav.querySelectorAll('button[data-root]').forEach(b=>{b.textContent=labels[b.dataset.root]||b.textContent});const work=document.createElement('div');work.className='nav-section-label';work.textContent='Trabajo diario';nav.insertBefore(work,nav.firstChild);const adminBtn=nav.querySelector('[data-root="users"]');if(adminBtn){const a=document.createElement('div');a.className='nav-section-label';a.textContent='Administración';nav.insertBefore(a,adminBtn)}}

  function init(){state.employeeContextUserId=state.employeeContextUserId||localStorage.getItem(EMPLOYEE_KEY)||me()?.id||'';if(!person(state.employeeContextUserId))state.employeeContextUserId=me()?.id||'';if(localStorage.getItem(SIDEBAR_KEY)==='1'&&window.innerWidth>1180)document.body.classList.add('shell-sidebar-collapsed');normalizeNav();ensureSidebarToggle();renderCurrent()}
  const basePaint=window.paintUser;if(typeof basePaint==='function')window.paintUser=function(){const r=basePaint.apply(this,arguments);requestAnimationFrame(()=>{if(me())init()});return r};
  requestAnimationFrame(()=>{if(me())init()});
})();