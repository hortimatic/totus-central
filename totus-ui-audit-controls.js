/* Totus Central · UX audit controls V20.2
   Claridad de relojes, históricos y obligatoriedad. No cambia datos ni RLS. */
(function(){
  function setTextIfChanged(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function currentWorkLabels(){
    const timer=openTaskTime(),intr=!timer?openTaskInterruption():null,br=openPersonalBreak(),task=timer?db.tasks.find(t=>t.id===timer.task_id):intr?db.tasks.find(t=>t.id===intr.task_id):null;
    const tt=document.getElementById('taskDockTitle'),ts=document.getElementById('taskDockSub'),bt=document.getElementById('breakDockTitle'),bs=document.getElementById('breakDockSub');
    if(intr){setTextIfChanged(tt,`Interrupción laboral · ${interruptionName(intr.reason_code)}`);setTextIfChanged(ts,`COMPUTA · ${task?.title||'Tarea'} · desde ${dt(intr.started_at)}`)}
    if(br){setTextIfChanged(bt,`Parada personal · ${breakName(br.break_type)}`);setTextIfChanged(bs,`NO COMPUTA · desde ${dt(br.started_at)}`)}
  }
  const originalTick=window.tick;
  if(typeof originalTick==='function')window.tick=function(){const r=originalTick.apply(this,arguments);currentWorkLabels();return r};

  function headerIndex(table,names){const th=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim().toLowerCase());return th.findIndex(x=>names.some(n=>x===n||x.startsWith(n)))}
  function addHistoryFilter(details){
    if(!isAdmin()||details.dataset.userFilter==='1')return;
    const table=details.querySelector('table');if(!table)return;
    const idx=headerIndex(table,['usuario','empleado']);if(idx<0)return;
    const rows=[...table.querySelectorAll('tbody tr')].filter(r=>r.children.length>idx);
    const names=[...new Set(rows.map(r=>r.children[idx]?.textContent.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    if(names.length<2)return;
    const host=details.querySelector('.audit-card')||details;
    const bar=document.createElement('div');bar.className='history-user-filter';bar.innerHTML=`<label>Filtrar histórico por usuario <button type="button" class="field-help" title="Muestra solo los movimientos del empleado elegido. No modifica ni borra registros.">?</button><select><option value="">Todos</option>${names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label><span>${rows.length} movimientos</span>`;
    const sel=bar.querySelector('select'),count=bar.querySelector('span');
    sel.onchange=()=>{let visible=0;rows.forEach(r=>{const ok=!sel.value||r.children[idx]?.textContent.trim()===sel.value;r.style.display=ok?'':'none';if(ok)visible++});count.textContent=`${visible} movimientos`};
    host.insertBefore(bar,host.firstChild);details.dataset.userFilter='1';
  }
  function addAllHistoryFilters(){document.querySelectorAll('details.audit-details').forEach(addHistoryFilter)}

  function markRequired(){
    document.querySelectorAll('#main label,.modal label').forEach(label=>{
      if(!/obligatori/i.test(label.textContent))return;
      const control=label.parentElement?.querySelector('input,select,textarea')||label.nextElementSibling;
      if(control&&/^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName)){control.setAttribute('aria-required','true');control.classList.add('required-control')}
    });
  }

  const ROLE_TEXT={
    admin:'Acceso total: usuarios, permisos, mantenimiento, configuración, equipo completo, tareas, fichajes, compras e informes.',
    gerente:'Rol operativo previsto para gestión global. En la versión actual el backend todavía no le concede la administración completa del equipo.',
    encargado:'Puede operar su propia jornada, tareas y compras. La versión actual todavía no dispone de permisos intermedios de supervisión diferenciados.',
    tendero:'Operativa propia: jornada, tareas asignadas, compras propias, biblioteca y consultas. Sin administración del equipo.',
    invitado:'Solo lectura en las zonas autorizadas; no puede iniciar operaciones.'
  };
  function addRoleHelp(){
    const pill=document.querySelector('.userpill .usertext');if(!pill||pill.querySelector('.role-help-mini'))return;
    const b=document.createElement('button');b.type='button';b.className='role-help-mini';b.textContent='Permisos';b.onclick=()=>{const role=currentRole();modal(`<div class="section-head"><div><div class="eyebrow">Permisos actuales</div><h3>${esc(humanRole(role))}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="help-body">${esc(ROLE_TEXT[role]||'Rol de usuario.')}</div>${role!=='admin'?'<div class="warn-note note" style="margin-top:12px">La auditoría ha detectado que la jerarquía Gerente / Encargado aún no está suficientemente diferenciada en servidor. Se está revisando antes de ampliar permisos.</div>':''}`)};pill.appendChild(b)
  }
  function enhanceStatic(){addAllHistoryFilters();markRequired();addRoleHelp()}
  let queued=false;
  const obs=new MutationObserver(mutations=>{
    if(!mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))return;
    if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceStatic()})
  });
  obs.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(()=>{enhanceStatic();currentWorkLabels()});
})();
