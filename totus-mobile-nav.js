/* Totus Central · navegación coherente
   Mantiene una sola navegación en escritorio/móvil, traduce las secciones visuales
   a los identificadores reales y evita selectores de empleado duplicados para admin.
   No modifica reglas ni permisos. */
(function(){
  if(typeof window.renderLibraryModule!=='function'&&typeof window.renderLibrary==='function')window.renderLibraryModule=window.renderLibrary;

  const baseSet=window.renderSubnavSet;
  const baseRender=window.renderSubnav;
  const baseGoRoot=window.goRoot;
  const baseGoSub=window.goSub;
  if(typeof baseSet!=='function'||typeof baseRender!=='function'||typeof baseGoRoot!=='function'||typeof baseGoSub!=='function')return;

  const PURCHASE_BASE=[['purchase-overview','Resumen'],['purchase-history','Historial'],['purchase-reports','Informes']];
  const LIBRARY_TABS=[['library-home','Tutoriales y documentos'],['questions','Consultas internas']];
  const LEGACY_PURCHASE={summary:'purchase-overview',history:'purchase-history',reports:'purchase-reports',audit:'purchase-audit'};
  const LEGACY_LIBRARY={tutorials:'library-home',queries:'questions'};

  function isAdminUser(){return typeof isSystemAdmin==='function'?isSystemAdmin():(typeof isAdmin==='function'&&isAdmin())}
  function canManagePurchaseArea(){return typeof canManagePurchases==='function'?canManagePurchases():(typeof canManageTeam==='function'?canManageTeam():['admin','gerente'].includes(typeof currentRole==='function'?currentRole():''))}
  function purchaseTabs(){return canManagePurchaseArea()?[...PURCHASE_BASE,['purchase-audit','Auditoría']]:PURCHASE_BASE}
  function currentEmployee(){return state.employeeContextUserId||(typeof me==='function'?me()?.id:'')||''}
  function syncContextDefaults(){
    if(!isAdminUser())return false;
    const uid=currentEmployee();if(!uid)return false;
    let changed=false;
    for(const key of ['historyUserId','timeUserId','reportUserId','purchaseUserId','scheduleUserId','incidentUserId','documentUserId']){
      if(state[key]===null||state[key]===undefined||state[key]===''){state[key]=uid;changed=true}
    }
    return changed;
  }
  window.syncEmployeeContextDefaults=syncContextDefaults;

  function hideEmployeeField(container){
    if(!container)return;
    const candidates=[...container.querySelectorAll(':scope > div')];
    const field=candidates.find(x=>/^Empleado\b/i.test((x.querySelector('label')?.textContent||'').trim()));
    if(field)field.classList.add('hidden');
  }
  function globalContextControl(){return document.querySelector('.shell-top-actions .employee-context-select-wrap')}
  function pruneDuplicateContextControls(){
    if(!isAdminUser())return;
    const contextControl=globalContextControl();
    if(contextControl)contextControl.classList.toggle('hidden',!['tasks','purchases'].includes(state.root));
    if(state.root==='tasks'&&state.sub==='attendance')document.querySelector('.section-attendance>.ref-inline-select')?.classList.add('hidden');
    if(state.root==='tasks'&&state.sub==='incidents')hideEmployeeField(document.querySelector('.ref-incidents>.card:first-of-type .form-grid'));
    if(state.root==='tasks'&&state.sub==='documents')hideEmployeeField(document.querySelector('.ref-documents>.card:first-of-type .form-grid'));
    if(state.root==='purchases'&&['purchase-history','purchase-audit'].includes(state.sub)){
      const head=document.querySelector('#main>.head');
      if(head){const field=[...head.children].find(x=>/^Empleado\b/i.test((x.querySelector?.('label')?.textContent||'').trim()));if(field)field.classList.add('hidden')}
    }
    if(state.root==='purchases'&&state.sub==='purchase-reports'){
      const select=document.getElementById('buyRepUser');
      if(select&&[...select.options].some(o=>o.value===currentEmployee()))select.value=currentEmployee();
      const box=select?.closest('.report-core-filters')||select?.parentElement?.parentElement;
      hideEmployeeField(box);
    }
  }
  window.pruneDuplicateEmployeeControls=pruneDuplicateContextControls;

  function mobileSelect(rows,host){
    if(!host||!rows?.length)return;
    host.querySelector('.subnav-mobile-wrap')?.remove();
    host.querySelector('.subnav-mobile')?.remove();
    host.insertAdjacentHTML('afterbegin',`<label class="subnav-mobile-wrap"><span class="sr-only">Sección actual</span><select class="subnav-mobile" aria-label="Sección actual" onchange="goSub(this.value)">${rows.map(([k,n])=>`<option value="${esc(k)}" ${state.sub===k?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`);
  }

  window.renderSubnavSet=function(rows){
    const out=baseSet.call(this,rows);
    const host=document.getElementById('subnav');
    mobileSelect(rows,host);
    const wrap=document.getElementById('subnavWrap');
    if(wrap)wrap.classList.toggle('subnav-empty',!rows?.length);
    document.body.dataset.totusRoot=state.root||'';
    document.body.dataset.totusSub=state.sub||'';
    requestAnimationFrame(pruneDuplicateContextControls);
    return out;
  };

  window.renderSubnav=function(){
    if(state.root==='purchases')return renderSubnavSet(purchaseTabs());
    if(state.root==='library')return renderSubnavSet(LIBRARY_TABS);
    return baseRender.apply(this,arguments);
  };

  window.goRoot=function(root,sub=null){
    syncContextDefaults();
    if(root==='purchases'&&!sub)sub='purchase-overview';
    if(root==='library'&&!sub)sub='library-home';
    if(root==='purchases'&&sub==='purchase-audit'&&!canManagePurchaseArea())sub='purchase-history';
    const out=baseGoRoot.call(this,root,sub);requestAnimationFrame(pruneDuplicateContextControls);return out;
  };

  window.goSub=function(sub){
    syncContextDefaults();
    if(state.root==='purchases')sub=LEGACY_PURCHASE[sub]||sub;
    if(state.root==='library')sub=LEGACY_LIBRARY[sub]||sub;
    if(state.root==='purchases'&&sub==='purchase-audit'&&!canManagePurchaseArea())sub='purchase-history';
    const out=baseGoSub.call(this,sub);requestAnimationFrame(pruneDuplicateContextControls);return out;
  };

  requestAnimationFrame(()=>{syncContextDefaults();pruneDuplicateContextControls()});
})();