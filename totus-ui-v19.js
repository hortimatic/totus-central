/* Totus Central · UI V19.1
   Capa de interfaz únicamente: duplica las subsecciones en el lateral de escritorio.
   No altera datos, permisos ni reglas operativas. */
(function(){
  const original=window.renderSubnavSet;
  if(typeof original!=='function')return;
  window.renderSubnavSet=function(tabs){
    original(tabs);
    const side=document.getElementById('sideSubnav');
    if(!side)return;
    const current=tabs.some(([k])=>k===state.sub)?state.sub:tabs[0]?.[0];
    side.innerHTML=`<div class="subnav-buttons">${tabs.map(([k,t])=>`<button class="${current===k?'active':''}" onclick="goSub('${k}')">${t}</button>`).join('')}</div>`;
  };
})();
