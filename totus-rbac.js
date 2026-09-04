/* Totus Central · RBAC operativo
   Define capacidades y guards. La navegación vive únicamente en totus-ui.js. */
(function(){
  const systemAdmin=()=>currentRole()==='admin';
  const manager=()=>['admin','gerente'].includes(currentRole());
  const supervisor=()=>['admin','gerente','encargado'].includes(currentRole());
  window.isSystemAdmin=systemAdmin;window.canManageTeam=manager;window.canSuperviseTeam=supervisor;window.canPlanTeam=supervisor;window.canCorrectRecords=manager;window.canManagePurchases=manager;window.canManageUsers=systemAdmin;window.canManageSystemConfig=systemAdmin;window.canManageBackups=systemAdmin;

  function asAdminGate(fn,args,ctx){const original=window.isAdmin;window.isAdmin=()=>true;try{return fn.apply(ctx,args)}finally{window.isAdmin=original}}
  function gate(name,allowed){const original=window[name];if(typeof original!=='function')return;window[name]=function(...args){if(!allowed())return original.apply(this,args);return asAdminGate(original,args,this)}}
  function renderGate(name,allowed,{suppress=[]}={}){const original=window[name];if(typeof original!=='function')return;window[name]=function(...args){if(!allowed())return original.apply(this,args);const saved={},admin=window.isAdmin;window.isAdmin=()=>true;for(const key of suppress){saved[key]=window[key];window[key]=()=>''}try{return original.apply(this,args)}finally{window.isAdmin=admin;for(const key of suppress)window[key]=saved[key]}}}

  /* Planificación: Admin, Gerente y Encargado. Catálogos/configuración siguen solo Admin. */
  renderGate('tasksHtml',supervisor,{suppress:['taskCategoryAdminHtml']});renderGate('overviewHtml',supervisor);renderGate('calendarHtml',supervisor);renderGate('teamReportsHtml',supervisor);
  gate('newTaskToday',supervisor);gate('calendarNewTaskOn',supervisor);gate('saveTask',supervisor);gate('editTask',supervisor);gate('cancelTaskAdmin',supervisor);gate('openEmployeeAttendance',supervisor);gate('openEmployeeSchedule',supervisor);

  /* Gerencia: horarios, fichajes, compras y correcciones operativas. */
  renderGate('scheduleHtml',manager,{suppress:['openingHoursAdminHtml','breakCatalogAdminHtml','taskCategoryAdminHtml','workRulesAdminHtml','holidayAdminPanelHtml']});renderGate('attendanceHtml',manager,{suppress:['adminAuditHtml']});renderGate('purchaseOverviewHtml',manager);renderGate('purchaseHistoryHtml',manager);renderGate('purchaseReportsHtml',manager);renderGate('purchaseAuditHtml',manager);
  gate('saveSchedule',manager);gate('saveMonthlyTarget',manager);gate('newScheduleException',manager);gate('adminAddAttendance',manager);gate('editAttendance',manager);gate('editTaskTime',manager);gate('editPurchase',manager);gate('setPurchaseStatus',manager);gate('cancelPurchase',manager);gate('savePurchase',manager);

  /* Histórico operativo por ámbito. Supabase RLS decide las filas realmente accesibles. */
  renderGate('generalLogRows',supervisor);renderGate('renderGeneralLog',supervisor);

  /* Encargado supervisa su ámbito pero no controla paradas personales de terceros. */
  const baseTeamStatus=window.teamStatusHtml;if(typeof baseTeamStatus==='function')window.teamStatusHtml=function(){let html=baseTeamStatus.apply(this,arguments);if(currentRole()==='encargado')html=html.replace(/<button class="ghost" onclick="openEmployeeControl\('[^']+'\)">Control<\/button>/g,'');return html.replace('Administración</div><h3>Estado del equipo','Supervisión</div><h3>Estado del equipo')};

  /* Guards de rutas críticas: la UI los oculta y el servidor vuelve a validarlos. */
  const routedRoot=window.goRoot;if(typeof routedRoot==='function')window.goRoot=function(root,sub=null){if(root==='users'&&!systemAdmin()){notifyMsg('Usuarios y permisos es exclusivo de administración.','warn');root='tasks';sub='mine'}if(root==='logs'&&sub==='maintenance'&&!systemAdmin()){notifyMsg('Backups y mantenimiento son exclusivos de administración.','warn');sub='general-log'}return routedRoot.call(this,root,sub)};
  const routedSub=window.goSub;if(typeof routedSub==='function')window.goSub=function(sub){if(state.root==='tasks'&&sub==='stores'&&!systemAdmin()){notifyMsg('Centros y proyectos se configura desde administración.','warn');sub='mine'}if(state.root==='logs'&&sub==='maintenance'&&!systemAdmin()){notifyMsg('Backups y mantenimiento son exclusivos de administración.','warn');sub='general-log'}return routedSub.call(this,sub)};

  function paintRoleVisibility(){const users=document.querySelector('.nav button[data-root="users"]');if(users)users.classList.toggle('hidden',!systemAdmin());document.body.dataset.totusRole=currentRole();renderSubnav()}
  const basePaint=window.paintUser;if(typeof basePaint==='function')window.paintUser=function(){const r=basePaint.apply(this,arguments);requestAnimationFrame(paintRoleVisibility);return r};requestAnimationFrame(paintRoleVisibility);
})();