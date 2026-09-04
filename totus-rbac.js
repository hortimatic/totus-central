/* Totus Central · Permisos operativos
   Capacidades por rol. Navegación y presentación pertenecen al shell; Supabase/RLS valida el servidor. */
(function(){
  const systemAdmin=()=>currentRole()==='admin';
  const manager=()=>['admin','gerente'].includes(currentRole());
  const supervisor=()=>['admin','gerente','encargado'].includes(currentRole());
  window.isSystemAdmin=systemAdmin;
  window.canManageTeam=manager;
  window.canSuperviseTeam=supervisor;
  window.canPlanTeam=supervisor;
  window.canCorrectRecords=manager;
  window.canManagePurchases=manager;
  window.canManageUsers=systemAdmin;
  window.canManageSystemConfig=systemAdmin;
  window.canManageBackups=systemAdmin;

  function asAdminGate(fn,args,ctx){const original=window.isAdmin;window.isAdmin=()=>true;try{return fn.apply(ctx,args)}finally{window.isAdmin=original}}
  function gate(name,allowed){const original=window[name];if(typeof original!=='function'||original.__totusRbac)return;const wrapped=function(...args){if(!allowed())return original.apply(this,args);return asAdminGate(original,args,this)};wrapped.__totusRbac=true;window[name]=wrapped}
  function renderGate(name,allowed,{suppress=[]}={}){const original=window[name];if(typeof original!=='function'||original.__totusRbac)return;const wrapped=function(...args){if(!allowed())return original.apply(this,args);const saved={},admin=window.isAdmin;window.isAdmin=()=>true;for(const key of suppress){saved[key]=window[key];window[key]=()=>''}try{return original.apply(this,args)}finally{window.isAdmin=admin;for(const key of suppress)window[key]=saved[key]}};wrapped.__totusRbac=true;window[name]=wrapped}

  renderGate('tasksHtml',supervisor,{suppress:['taskCategoryAdminHtml']});
  renderGate('overviewHtml',supervisor);
  renderGate('calendarHtml',supervisor);
  renderGate('teamReportsHtml',supervisor);
  gate('newTaskToday',supervisor);gate('calendarNewTaskOn',supervisor);gate('saveTask',supervisor);gate('editTask',supervisor);gate('cancelTaskAdmin',supervisor);gate('openEmployeeAttendance',supervisor);gate('openEmployeeSchedule',supervisor);

  renderGate('scheduleHtml',manager,{suppress:['openingHoursAdminHtml','breakCatalogAdminHtml','taskCategoryAdminHtml','workRulesAdminHtml','holidayAdminPanelHtml']});
  renderGate('attendanceHtml',manager,{suppress:['adminAuditHtml']});
  renderGate('purchaseOverviewHtml',manager);renderGate('purchaseHistoryHtml',manager);renderGate('purchaseReportsHtml',manager);renderGate('purchaseAuditHtml',manager);
  gate('saveSchedule',manager);gate('saveMonthlyTarget',manager);gate('newScheduleException',manager);gate('adminAddAttendance',manager);gate('editAttendance',manager);gate('editTaskTime',manager);gate('editPurchase',manager);gate('setPurchaseStatus',manager);gate('cancelPurchase',manager);gate('savePurchase',manager);

  renderGate('generalLogRows',supervisor);renderGate('renderGeneralLog',supervisor);
  const baseTeamStatus=window.teamStatusHtml;if(typeof baseTeamStatus==='function')window.teamStatusHtml=function(){let html=baseTeamStatus.apply(this,arguments);if(currentRole()==='encargado')html=html.replace(/<button class="ghost" onclick="openEmployeeControl\('[^']+'\)">Control<\/button>/g,'');return html.replace('Administración</div><h3>Estado del equipo','Supervisión</div><h3>Estado del equipo')};
})();