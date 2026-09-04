/* Totus Central · Navigation V21
   Reduce ruido y adapta la navegación al trabajo real de cada rol. */
(function(){
  function taskTabs(){
    if(isAdmin())return [['mine','Mi día'],['overview','Equipo'],['calendar','Calendario'],['tasks','Tareas'],['schedule','Programación'],['stores','Tiendas'],['attendance','Fichajes'],['reports','Informes']];
    return [['mine','Mi día'],['calendar','Calendario'],['tasks','Mis tareas'],['schedule','Mi horario'],['attendance','Mis fichajes'],['reports','Mis informes']];
  }
  function purchaseTabs(){return isAdmin()?[['purchase-overview','Resumen'],['purchase-history','Historial'],['purchase-reports','Informes'],['purchase-audit','Auditoría']]:[['purchase-overview','Registrar'],['purchase-history','Mis compras'],['purchase-reports','Mis informes']]}
  const base=window.renderSubnav;
  window.renderSubnav=function(){
    if(state.root==='tasks')return renderSubnavSet(taskTabs());
    if(state.root==='purchases')return renderSubnavSet(purchaseTabs());
    if(state.root==='logs')return renderSubnavSet(isAdmin()?[['general-log','Histórico general'],['maintenance','Administración y copias']]:[['general-log','Mi histórico']]);
    return typeof base==='function'?base.apply(this,arguments):undefined;
  };
  function relabelMainNav(){
    const map={pricing:'Precios',tasks:'Trabajo',purchases:'Compras',users:'Usuarios',library:'Ayuda y tutoriales',logs:'Histórico'};
    document.querySelectorAll('.nav button[data-root]').forEach(b=>{const t=map[b.dataset.root];if(t&&b.textContent!==t)b.textContent=t});
    const sideTitle=document.querySelector('.side-subnav-title');if(sideTitle)sideTitle.textContent='DENTRO DE ESTA ZONA';
  }
  const basePaint=window.paintUser;
  if(typeof basePaint==='function')window.paintUser=function(){const r=basePaint.apply(this,arguments);relabelMainNav();return r};
  requestAnimationFrame(relabelMainNav);
})();
