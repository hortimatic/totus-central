/* Totus Central · UX unificada · referencia visual public(1).rar */
(function(){
  const META={
    'pricing:*':['Precios','Cálculo, catálogo, consultas y competencia.'],
    'tasks:mine':['Mi panel','Jornada, trabajo actual, avisos y accesos personales.'],
    'tasks:overview':['Equipo','Estado operativo del equipo y trabajo pendiente.'],
    'tasks:calendar':['Calendario','Planificación por día, semana y mes.'],
    'tasks:tasks':['Tareas','Trabajo asignado, tiempos, recurrencias y evidencias.'],
    'tasks:schedule':['Programación','Horarios, turnos, excepciones y objetivos.'],
    'tasks:stores':['Centros y proyectos','Tiendas, proyectos digitales, clientes y futuros centros de trabajo.'],
    'tasks:attendance':['Fichajes','Entradas, salidas, paradas y correcciones auditadas.'],
    'tasks:reports':['Informes','Horas, actividad y exportaciones por persona, periodo y proyecto.'],
    'purchases:purchase-overview':['Compras','Registro y seguimiento de compras de empleados.'],
    'purchases:purchase-history':['Historial de compras','Operaciones anteriores y trazabilidad.'],
    'purchases:purchase-reports':['Informes de compras','Análisis y exportaciones de compras.'],
    'purchases:purchase-audit':['Auditoría de compras','Cambios y acciones administrativas.'],
    'users:*':['Usuarios y permisos','Accesos, roles, perfiles y seguridad del equipo.'],
    'library:library-home':['Ayuda y tutoriales','Protocolos, documentos y material interno.'],
    'library:questions':['Consultas internas','Preguntas y respuestas guardadas para el equipo.'],
    'logs:general-log':['Histórico','Trazabilidad general de acciones y cambios.'],
    'logs:maintenance':['Administración y copias','Backup, rollback, informes y mantenimiento.']
  };
  const HELP={
    usuario:'Filtra la información por empleado sin mezclar sus datos con otros usuarios.',
    empleado:'Persona a la que corresponde el registro, tarea o informe.',
    'centro / proyecto':'Negocio, tienda, proyecto digital, cliente u otro centro al que pertenece el trabajo.',
    tienda:'Centro o proyecto al que pertenece la operación. Puede ser físico, remoto o híbrido.',
    responsable:'Persona asignada a la tarea.',categoria:'Clasifica el trabajo para poder medirlo después.',
    categoría:'Clasifica el trabajo para poder medirlo después.',prioridad:'Orden de atención de la tarea.',
    inicio:'Momento previsto de comienzo. El tiempo real lo mide el reloj.',vencimiento:'Fecha y hora límite prevista.',
    motivo:'Explicación que quedará guardada cuando la acción necesite trazabilidad.',
    desde:'Primer día incluido.',hasta:'Último día incluido.',buscar:'Filtra el listado visible sin modificar datos.',
    código:'Identificador interno corto y estable.',email:'Correo usado para acceso y comunicaciones.',rol:'Nivel de permisos del usuario.'
  };
  function taskTabs(){return isAdmin()?[['mine','Mi panel'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['stores','Centros y proyectos'],['attendance','Fichajes'],['reports','Informes']]:[['mine','Mi panel'],['calendar','Calendario'],['tasks','Mis tareas'],['schedule','Mi horario'],['attendance','Mis fichajes'],['reports','Mis informes']]}
  function purchaseTabs(){return isAdmin()?[['purchase-overview','Resumen'],['purchase-history','Historial'],['purchase-reports','Informes'],['purchase-audit','Auditoría']]:[['purchase-overview','Registrar'],['purchase-history','Mis compras'],['purchase-reports','Mis informes']]}
  function logTabs(){return isAdmin()?[['general-log','Histórico general'],['maintenance','Administración y copias']]:[['general-log','Mi histórico']]}
  function libraryTabs(){return [['library-home','Tutoriales y documentos'],['questions','Consultas internas']]}
  function rootTabs(){if(state.root==='tasks')return taskTabs();if(state.root==='purchases')return purchaseTabs();if(state.root==='logs')return logTabs();if(state.root==='library')return libraryTabs();if(state.root==='pricing')return [['home','Inicio'],['catalog','Catálogo'],['consultations','Consultas']];if(state.root==='users')return [['users-home','Usuarios y permisos']];return []}

  const baseSet=window.renderSubnavSet;
  window.renderSubnavSet=function(tabs){
    const current=tabs.some(([k])=>k===state.sub)?state.sub:tabs[0]?.[0];
    const sub=document.getElementById('subnav');if(sub)sub.innerHTML=`<select class="subnav-mobile" aria-label="Sección actual" onchange="goSub(this.value)">${tabs.map(([k,t])=>`<option value="${k}" ${current===k?'selected':''}>${t}</option>`).join('')}</select><div class="subnav-buttons">${tabs.map(([k,t])=>`<button class="${current===k?'active':''}" onclick="goSub('${k}')">${t}</button>`).join('')}</div>`;
    renderSideSubnav(tabs,current);paintTopbar();
  };
  window.renderSubnav=function(){const tabs=rootTabs();if(tabs.length)return renderSubnavSet(tabs);if(typeof baseSet==='function')return baseSet([])};

  function renderSideSubnav(tabs,current){
    const nav=document.querySelector('.nav'),wrap=document.querySelector('.side-subnav-wrap'),side=document.getElementById('sideSubnav');if(!nav||!wrap||!side)return;
    if(wrap.parentElement!==nav)nav.appendChild(wrap);
    side.innerHTML=`<div class="subnav-buttons">${tabs.map(([k,t])=>`<button class="${current===k?'active':''}" onclick="goSub('${k}');closeShellNav()">${t}</button>`).join('')}</div>`;
    wrap.classList.toggle('shell-visible',tabs.length>1);
    const active=nav.querySelector(`button[data-root="${state.root}"]`);if(active)active.insertAdjacentElement('afterend',wrap);
  }
  function meta(){return META[`${state.root}:${state.sub}`]||META[`${state.root}:*`]||['Totus Central','Trabajo, precios, compras y equipo.']}
  function paintTopbar(){const m=meta(),title=document.getElementById('shellTitle'),sub=document.getElementById('shellSubtitle'),work=document.getElementById('shellWorkspaceChip'),role=document.getElementById('shellRoleChip');if(title)title.textContent=m[0];if(sub)sub.textContent=m[1];if(role)role.innerHTML=`<strong>${esc(humanRole(currentRole()))}</strong>`;if(work){const a=typeof openAttendance==='function'?openAttendance():null;work.innerHTML=a?`<strong>${esc(locationName(a.location_id))}</strong>`:'Sin jornada abierta'}}
  function ensureShell(){
    if(!document.querySelector('.shell-topbar')){const d=document.createElement('header');d.className='shell-topbar';d.innerHTML=`<button class="shell-menu-toggle" type="button" onclick="toggleShellNav()"><span>☰</span> Menú</button><div class="shell-topbar-copy"><h1 id="shellTitle">Totus Central</h1><p id="shellSubtitle"></p></div><div class="shell-top-actions"><span class="shell-chip" id="shellWorkspaceChip"></span><span class="shell-chip shell-role-chip" id="shellRoleChip"></span></div>`;document.querySelector('.status-dock')?.before(d)}
    if(!document.querySelector('.shell-menu-backdrop')){const b=document.createElement('div');b.className='shell-menu-backdrop';b.onclick=closeShellNav;document.body.appendChild(b)}
  }
  function navGroups(){const nav=document.querySelector('.nav');if(!nav)return;nav.querySelectorAll('.nav-section-label').forEach(x=>x.remove());const first=nav.querySelector('button[data-root="pricing"]');if(first){const x=document.createElement('div');x.className='nav-section-label';x.textContent='Trabajo diario';first.before(x)}const admin=nav.querySelector('button[data-root="users"]');const lib=nav.querySelector('button[data-root="library"]');const target=isAdmin()?admin:lib;if(target){const x=document.createElement('div');x.className='nav-section-label';x.textContent=isAdmin()?'Administración':'Mi cuenta';target.before(x)}}
  function relabel(){const map={pricing:'Precios',tasks:'Trabajo',purchases:'Compras',users:'Usuarios',library:'Ayuda y tutoriales',logs:'Histórico'};document.querySelectorAll('.nav button[data-root]').forEach(b=>{if(map[b.dataset.root])b.textContent=map[b.dataset.root]});document.querySelectorAll('#main label,#main th,#main h1,#main h2,#main h3').forEach(x=>{if(x.children.length)return;const t=x.textContent.trim();if(t==='Tiendas')x.textContent='Centros y proyectos';else if(t==='Tienda')x.textContent='Centro / proyecto';else if(t==='Tienda / centro')x.textContent='Centro / proyecto'})}
  function roleVisibility(){const admin=isAdmin(),u=document.querySelector('.nav button[data-root="users"]');if(u)u.classList.toggle('hidden',!admin);if(!admin&&state.root==='users'){state.root='tasks';state.sub='mine'}if(!admin&&state.root==='tasks'&&state.sub==='stores')state.sub='mine'}

  window.toggleShellNav=function(){document.body.classList.toggle('shell-nav-open')};window.closeShellNav=function(){document.body.classList.remove('shell-nav-open')};
  function quickBar(){return document.getElementById('quickClockBar')}
  window.toggleQuickPanel=function(force){const bar=quickBar();if(!bar)return notifyMsg('Las acciones rápidas todavía se están cargando.','warn');const open=typeof force==='boolean'?force:!bar.classList.contains('shell-open');bar.classList.toggle('shell-open',open);document.body.classList.toggle('shell-quick-open',open)};
  function ensureQuickToggle(){const actions=document.querySelector('.dock-actions');if(!actions||document.getElementById('shellQuickToggle'))return;const b=document.createElement('button');b.id='shellQuickToggle';b.type='button';b.className='secondary shell-quick-toggle';b.textContent='Acciones';b.onclick=()=>toggleQuickPanel();actions.prepend(b)}

  function norm(s){return String(s||'').replace(/[·:*?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase()}
  function addFieldHelp(){document.querySelectorAll('#main label,.modal label').forEach(label=>{if(label.querySelector('.field-info'))return;const text=(label.childNodes[0]?.textContent||label.textContent||'').trim(),key=Object.keys(HELP).find(k=>norm(text)===k||norm(text).startsWith(k));if(!key)return;const b=document.createElement('button');b.type='button';b.className='field-info';b.textContent='?';b.setAttribute('aria-label','Información sobre '+text);b.onclick=e=>{e.preventDefault();e.stopPropagation();modal(`<div class="section-head"><div><div class="eyebrow">Ayuda</div><h3>${esc(text)}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body">${esc(HELP[key])}</div>`)};label.appendChild(b)})}
  function markRequired(){const explicit=new Set(['storeName','storeCode','taskTitle','questionText','libTitle','requiredReason','purgeReason']);document.querySelectorAll('#main input,#main select,#main textarea,.modal input,.modal select,.modal textarea').forEach(c=>{const label=c.closest('div')?.querySelector(':scope > label');const req=c.required||c.getAttribute('aria-required')==='true'||explicit.has(c.id)||/obligatori/i.test(label?.textContent||'');if(!req||!label)return;c.setAttribute('aria-required','true');if(!label.querySelector('.required-mini')){const s=document.createElement('span');s.className='required-mini';s.textContent='obligatorio';label.appendChild(s)}})}
  function addPageHelp(){const main=document.getElementById('main'),head=main?.querySelector(':scope > .head');if(!head||head.querySelector('.page-help'))return;const m=meta();let actions=head.querySelector(':scope > .actions');if(!actions){actions=document.createElement('div');actions.className='actions';head.appendChild(actions)}const b=document.createElement('button');b.type='button';b.className='ghost page-help';b.textContent='?';b.title='Ayuda de esta pantalla';b.onclick=()=>modal(`<div class="section-head"><div><div class="eyebrow">Esta pantalla</div><h3>${esc(m[0])}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body">${esc(m[1])}</div>`);actions.appendChild(b)}

  window.panelNowHtml=function(){const a=openAttendance(),t=openTaskTime(),i=!t?openTaskInterruption():null,b=openPersonalBreak(),task=t?db.tasks.find(x=>x.id===t.task_id):i?db.tasks.find(x=>x.id===i.task_id):null;return `<div class="card panel-widget"><div class="section-head"><div><div class="eyebrow">Ahora</div><h3>Estado de trabajo</h3></div><button class="secondary" onclick="toggleQuickPanel(true)">Acciones</button></div><div class="compact-status-row" style="margin-top:9px"><div class="compact-status"><small>JORNADA</small><b>${a?fmtDur(elapsedSec(a.clock_in)):'Fuera'}</b><span>${a?esc(locationName(a.location_id)):'Sin fichaje'}</span></div><div class="compact-status"><small>TRABAJO ACTUAL</small><b>${t?fmtDur(elapsedSec(t.started_at)):i?fmtDur(elapsedSec(i.started_at)):'Sin actividad'}</b><span>${task?esc(task.title):'Sin tarea o actividad laboral'}</span></div><div class="compact-status"><small>PARADA PERSONAL</small><b>${b?fmtDur(elapsedSec(b.started_at)):'Sin parada'}</b><span>${b?esc(breakName(b.break_type)):'No computa al iniciarla'}</span></div></div></div>`};
  window.panelQuickHtml=function(){return `<div class="card panel-widget"><div class="section-head"><div><div class="eyebrow">Ir a</div><h3>Accesos</h3></div></div><div class="compact-nav" style="margin-top:9px"><button class="secondary" onclick="goSub('tasks')">Mis tareas</button><button class="secondary" onclick="goSub('calendar')">Calendario</button><button class="secondary" onclick="goRoot('purchases')">Compras</button><button class="secondary" onclick="goSub('reports')">Informes</button><button class="secondary" onclick="goRoot('library')">Ayuda</button></div></div>`};

  function enhance(){ensureShell();roleVisibility();relabel();navGroups();ensureQuickToggle();paintTopbar();addFieldHelp();markRequired();addPageHelp();document.body.classList.add('totus-shell-ready')}
  const wrap=(name)=>{const base=window[name];if(typeof base!=='function')return;window[name]=function(){const r=base.apply(this,arguments);requestAnimationFrame(enhance);return r}};
  ['paintUser','renderTasks','renderPurchasesModule','renderGeneralLog','renderLibrary'].forEach(wrap);
  const baseGoRoot=window.goRoot;if(typeof baseGoRoot==='function')window.goRoot=function(){const r=baseGoRoot.apply(this,arguments);closeShellNav();toggleQuickPanel(false);requestAnimationFrame(enhance);return r};
  const baseGoSub=window.goSub;if(typeof baseGoSub==='function')window.goSub=function(){const r=baseGoSub.apply(this,arguments);closeShellNav();toggleQuickPanel(false);requestAnimationFrame(enhance);return r};
  const baseModal=window.modal;if(typeof baseModal==='function')window.modal=function(){const r=baseModal.apply(this,arguments);requestAnimationFrame(()=>{addFieldHelp();markRequired()});return r};
  let queued=false;new MutationObserver(ms=>{if(queued||!ms.some(m=>m.addedNodes.length))return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(quickBar()?.classList.contains('shell-open'))toggleQuickPanel(false);else if(document.body.classList.contains('shell-nav-open'))closeShellNav();else if(document.querySelector('#modalHost .modal-backdrop'))closeModal()});
  document.addEventListener('click',e=>{const bar=quickBar(),toggle=document.getElementById('shellQuickToggle');if(bar?.classList.contains('shell-open')&&!bar.contains(e.target)&&!toggle?.contains(e.target))toggleQuickPanel(false)});
  requestAnimationFrame(()=>{enhance();renderSubnav()});
})();