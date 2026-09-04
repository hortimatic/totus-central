/* Totus Central · navegación móvil compacta
   El lateral manda en escritorio; en tablet/móvil hay un único selector útil, nunca una franja vacía. */
(function(){
  const base=window.renderSubnavSet;
  if(typeof base!=='function')return;
  window.renderSubnavSet=function(rows){
    const out=base.call(this,rows);
    const host=document.getElementById('subnav');
    if(host&&rows?.length){
      host.querySelector('.subnav-mobile')?.remove();
      host.insertAdjacentHTML('afterbegin',`<label class="subnav-mobile-wrap"><span class="sr-only">Sección actual</span><select class="subnav-mobile" aria-label="Sección actual" onchange="goSub(this.value)">${rows.map(([k,n])=>`<option value="${esc(k)}" ${state.sub===k?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`);
    }
    const wrap=document.getElementById('subnavWrap');
    if(wrap)wrap.classList.toggle('subnav-empty',!rows?.length);
    return out;
  };
})();
