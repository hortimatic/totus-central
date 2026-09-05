/* Totus Central · navegación coherente
   Mantiene una sola navegación en escritorio/móvil y traduce las secciones visuales
   a los identificadores reales de cada módulo. No modifica reglas ni permisos. */
(function(){
  if(typeof window.renderLibraryModule!=='function'&&typeof window.renderLibrary==='function')window.renderLibraryModule=window.renderLibrary;

  const baseSet=window.renderSubnavSet;
  const baseRender=window.renderSubnav;
  const baseGoRoot=window.goRoot;
  const baseGoSub=window.goSub;
  if(typeof baseSet!=='function'||typeof baseRender!=='function'||typeof baseGoRoot!=='function'||typeof baseGoSub!=='function')return;

  const PURCHASE_TABS=[['purchase-overview','Resumen'],['purchase-history','Historial'],['purchase-reports','Informes'],['purchase-audit','Auditoría']];
  const LIBRARY_TABS=[['library-home','Tutoriales y documentos'],['questions','Consultas internas']];
  const LEGACY_PURCHASE={summary:'purchase-overview',history:'purchase-history',reports:'purchase-reports',audit:'purchase-audit'};
  const LEGACY_LIBRARY={tutorials:'library-home',queries:'questions'};

  function isAdminUser(){return typeof isSystemAdmin==='function'?isSystemAdmin():(typeof isAdmin==='function'&&isAdmin())}
  function currentEmployee(){return state.employeeContextUserId||(typeof me==='function'?me()?.id:'')||''}
  function syncContextDefaults(){
    if(!isAdminUser())return false;
    const uid=currentEmployee();if(!uid)return false;
    let changed=false;
    for(const key of ['historyUserId','timeUserId','reportUserId','purchaseUserId','scheduleUserId','incidentUserId','documentUserId']){
      if(state[key]===null||state[key]===undefined){state[key]=uid;changed=true}
    }
    return changed;
  }
  window.syncEmployeeContextDefaults=syncContextDefaults;

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
    return out;
  };

  window.renderSubnav=function(){
    if(state.root==='purchases')return renderSubnavSet(PURCHASE_TABS);
    if(state.root==='library')return renderSubnavSet(LIBRARY_TABS);
    return baseRender.apply(this,arguments);
  };

  window.goRoot=function(root,sub=null){
    syncContextDefaults();
    if(root==='purchases'&&!sub)sub='purchase-overview';
    if(root==='library'&&!sub)sub='library-home';
    return baseGoRoot.call(this,root,sub);
  };

  window.goSub=function(sub){
    syncContextDefaults();
    if(state.root==='purchases')sub=LEGACY_PURCHASE[sub]||sub;
    if(state.root==='library')sub=LEGACY_LIBRARY[sub]||sub;
    return baseGoSub.call(this,sub);
  };

  requestAnimationFrame(syncContextDefaults);
})();