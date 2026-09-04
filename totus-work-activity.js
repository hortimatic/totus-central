/* Totus Central · Work Activity V22
   Permite registrar actividad laboral computable con o sin tarea activa. */
(function(){
  function workLoc(x){return x?.location_id||db.tasks.find(t=>t.id===x?.task_id)?.location_id||''}
  function standaloneWork(){const x=openTaskInterruption();return x&&!x.task_id?x:null}
  function workOptionHtml(){const order=['customer_attention','sales_rep_visit','order_reception','colleague_call','commercial_call','whatsapp_colleague','inventory_stock','cash_pos_issue','shipment_delivery','work_meeting','work_other'],pos=new Map(order.map((x,i)=>[x,i]));return workInterruptionTypes().slice().sort((a,b)=>(pos.get(a.code)??999)-(pos.get(b.code)??999)||Number(a.sort_order||0)-Number(b.sort_order||0)).map(x=>`<option value="${esc(x.code)}">${esc(x.label)}${x.requires_note?' · nota':''}</option>`).join('')}

  function patchQuickWork(){
    const bar=document.getElementById('quickClockBar'),group=bar?.querySelector('.qc-work');if(!group)return;
    const att=openAttendance(),timer=openTaskTime(),intr=openTaskInterruption(),br=openPersonalBreak(),stand=intr&&!intr.task_id?intr:null;
    if(stand){group.className='qc-group qc-work active';group.innerHTML=`<span class="qc-kicker">ACTIVIDAD LABORAL · COMPUTA</span><b>${esc(interruptionName(stand.reason_code))}</b><small>${esc(locationName(workLoc(stand)))} · <span id="qcWorkElapsed">${fmtDur(elapsedSec(stand.started_at))}</span></small><button class="qc-btn warning" onclick="quickStopWorkInterruption()">Finalizar</button>`;return}
    if(!att||br){return}
    if(!timer&&!intr){group.className='qc-group qc-work';group.innerHTML=`<span class="qc-kicker">ACTIVIDAD LABORAL · COMPUTA</span><label class="sr-only" for="qcWork">Motivo laboral</label><select id="qcWork">${workOptionHtml()}</select><button class="qc-btn warning" onclick="quickStartWorkInterruption()">Iniciar</button>`}
  }

  function patchStandaloneState(){
    const stand=standaloneWork();if(!stand)return;
    const bar=document.getElementById('quickClockBar');if(bar){
      const task=bar.querySelector('.qc-task');if(task){task.className='qc-group qc-task disabled';task.innerHTML='<span class="qc-kicker">TAREA</span><b>Actividad laboral en curso</b><small>Finalízala antes de iniciar una tarea.</small>'}
      const personal=bar.querySelector('.qc-personal');if(personal){personal.className='qc-group qc-personal disabled';personal.innerHTML='<span class="qc-kicker">PARADA PERSONAL</span><b>Actividad laboral en curso</b><small>Finalízala antes de iniciar una parada personal.</small>'}
    }
    const tt=document.getElementById('taskDockTitle'),ts=document.getElementById('taskDockSub');if(tt)tt.textContent=`Actividad laboral · ${interruptionName(stand.reason_code)}`;if(ts)ts.textContent=`COMPUTA · ${locationName(workLoc(stand))} · desde ${dt(stand.started_at)}`;
  }
  function refreshWorkElapsed(){const x=standaloneWork(),e=document.getElementById('qcWorkElapsed');if(x&&e)e.textContent=fmtDur(elapsedSec(x.started_at))}

  async function startWork(code,note=''){
    const bt=breakType(code);if(!bt)return notifyMsg('Motivo laboral no disponible.','warn');
    const timer=openTaskTime();let error;
    if(timer){localStorage.setItem('totus_quick_last_task',timer.task_id);({error}=await sb.rpc('task_suspend',{p_task_id:timer.task_id,p_reason_code:code,p_reason_note:note||null}))}
    else{({error}=await sb.rpc('work_interruption_start',{p_reason_code:code,p_reason_note:note||null}))}
    if(error)return notifyMsg(error.message,'bad');await reloadTeamData();tick();if(state.root==='tasks')renderTasks();notifyMsg(`${bt.label} registrada · COMPUTA como trabajo.`,'warn')
  }
  window.quickStartWorkInterruption=function(){
    if(!openAttendance())return notifyMsg('Debes estar fichado para registrar actividad laboral.','warn');
    if(openPersonalBreak())return notifyMsg('Finaliza la parada personal antes de registrar actividad laboral.','warn');
    if(openTaskInterruption())return notifyMsg('Ya hay una actividad laboral abierta.','warn');
    const code=document.getElementById('qcWork')?.value,bt=breakType(code);if(!bt)return;
    if(bt.requires_note)return requiredReasonModal({eyebrow:'Actividad laboral',title:bt.label,description:'Añade una frase corta para identificar esta actividad en el histórico.',placeholder:'Ej.: proveedor X por incidencia del pedido…',confirmLabel:'Registrar',minLength:5,onConfirm:reason=>startWork(code,reason)});
    startWork(code,'')
  };
  window.quickStopWorkInterruption=async function(){
    const x=standaloneWork();if(!x)return;const {error}=await sb.rpc('work_interruption_stop');if(error)return notifyMsg(error.message,'bad');await reloadTeamData();tick();if(state.root==='tasks')renderTasks();notifyMsg(`${interruptionName(x.reason_code)} finalizada.`)
  };

  const baseReconciliation=window.workdayReconciliationLocal;
  if(typeof baseReconciliation==='function')window.workdayReconciliationLocal=function(uid,dateStr,loc=''){
    const[a,b]=localDayBounds(dateStr),now=new Date();
    const att=db.attendance.filter(e=>e.user_id===uid&&(!loc||e.location_id===loc)&&new Date(e.clock_in)<b&&new Date(e.clock_out||now)>=a),attendance=att.reduce((sum,e)=>sum+attendanceNetMinutesBetween(e,a,b,now),0),attIds=new Set(att.map(e=>e.id));
    const personal=db.breaks.filter(x=>x.user_id===uid&&attIds.has(x.attendance_entry_id)&&!x.counts_as_work&&new Date(x.started_at)<b&&new Date(x.ended_at||now)>=a).reduce((sum,x)=>sum+Math.max(0,(Math.min(new Date(x.ended_at||now),b)-Math.max(new Date(x.started_at),a))/60000),0);
    const times=db.taskTimes.filter(x=>x.user_id===uid&&new Date(x.started_at)<b&&new Date(x.stopped_at||now)>=a&&(!loc||db.tasks.find(t=>t.id===x.task_id)?.location_id===loc)),taskMin=times.reduce((sum,x)=>sum+Math.max(0,(Math.min(new Date(x.stopped_at||now),b)-Math.max(new Date(x.started_at),a))/60000),0);
    const ints=db.interruptions.filter(x=>x.user_id===uid&&x.counts_as_work!==false&&new Date(x.started_at)<b&&new Date(x.ended_at||now)>=a&&(!loc||workLoc(x)===loc)),workInt=ints.reduce((sum,x)=>sum+Math.max(0,(Math.min(new Date(x.ended_at||now),b)-Math.max(new Date(x.started_at),a))/60000),0);
    const byCat=new Map();for(const x of times){const t=db.tasks.find(t=>t.id===x.task_id),name=taskCategoryName(t?.category_id),mins=Math.max(0,(Math.min(new Date(x.stopped_at||now),b)-Math.max(new Date(x.started_at),a))/60000);byCat.set(name,(byCat.get(name)||0)+mins)}for(const x of ints){const name=interruptionName(x.reason_code),mins=Math.max(0,(Math.min(new Date(x.ended_at||now),b)-Math.max(new Date(x.started_at),a))/60000);byCat.set(name,(byCat.get(name)||0)+mins)}
    const accounted=taskMin+workInt;return{date:dateStr,attendance,taskMin,workInt,personal,accounted,unaccounted:Math.max(0,attendance-accounted),over:Math.max(0,accounted-attendance),categories:[...byCat.entries()].sort((a,b)=>b[1]-a[1])}
  };

  const baseFiltered=window.filteredWorkData;
  if(typeof baseFiltered==='function')window.filteredWorkData=function(){const out=baseFiltered.apply(this,arguments),{f,users}=out;out.interruptions=db.interruptions.filter(x=>users.includes(x.user_id)&&intervalOverlapsReport(x.started_at,x.ended_at,f.from,f.to)&&(!f.loc||workLoc(x)===f.loc));return out};

  window.workReportPreview=function(uid,from,to,loc){const users=filteredUsers(uid),ats=db.attendance.filter(x=>users.includes(x.user_id)&&(!loc||x.location_id===loc)&&intervalOverlapsReport(x.clock_in,x.clock_out,from,to)),tts=db.taskTimes.filter(x=>users.includes(x.user_id)&&intervalOverlapsReport(x.started_at,x.stopped_at,from,to)&&(!loc||db.tasks.find(t=>t.id===x.task_id)?.location_id===loc)),tasks=db.tasks.filter(x=>users.includes(x.assigned_to)&&(!loc||x.location_id===loc)&&taskOverlapsReport(x,from,to)),ints=db.interruptions.filter(x=>users.includes(x.user_id)&&x.counts_as_work!==false&&intervalOverlapsReport(x.started_at,x.ended_at,from,to)&&(!loc||workLoc(x)===loc)),breaks=db.breaks.filter(x=>users.includes(x.user_id)&&!x.counts_as_work&&intervalOverlapsReport(x.started_at,x.ended_at,from,to)&&(!loc||db.attendance.find(e=>e.id===x.attendance_entry_id)?.location_id===loc));const [rangeStart,rangeEnd]=reportRangeBounds(from,to),worked=ats.reduce((a,e)=>a+attendanceNetMinutesBetween(e,rangeStart,rangeEnd),0),real=ats.reduce((a,e)=>a+intervalMinutesWithin(e.clock_in,e.clock_out,rangeStart,rangeEnd),0),taskMin=tts.reduce((a,x)=>a+intervalMinutesWithin(x.started_at,x.stopped_at,rangeStart,rangeEnd),0),breakMin=breaks.reduce((a,x)=>a+intervalMinutesWithin(x.started_at,x.ended_at,rangeStart,rangeEnd),0),workInt=ints.reduce((a,x)=>a+intervalMinutesWithin(x.started_at,x.ended_at,rangeStart,rangeEnd),0),phonePersonal=breaks.filter(x=>isPhoneActivityCode(x.break_type)).reduce((a,x)=>a+intervalMinutesWithin(x.started_at,x.ended_at,rangeStart,rangeEnd),0),phoneWork=ints.filter(x=>isPhoneActivityCode(x.reason_code)).reduce((a,x)=>a+intervalMinutesWithin(x.started_at,x.ended_at,rangeStart,rangeEnd),0),target=uid?monthlyTargetMinutes(uid,new Date(from+'T12:00:00')):0,ordinary=uid?Math.min(worked,target):worked,additional=uid?Math.max(0,worked-target):0,unassigned=Math.max(0,worked-taskMin-workInt);return `<div class="stats" style="margin-top:12px"><div class="stat"><small>Horas ordinarias</small><strong>${fmtHours(ordinary)}</strong></div><div class="stat"><small>Horas adicionales</small><strong>${fmtHours(additional)}</strong></div><div class="stat"><small>Presencia real</small><strong>${fmtHours(real)}</strong></div><div class="stat"><small>Paradas personales</small><strong>${fmtHours(breakMin)}</strong></div><div class="stat"><small>Teléfono/WhatsApp personal</small><strong>${fmtHours(phonePersonal)}</strong></div><div class="stat"><small>Teléfono/WhatsApp laboral</small><strong>${fmtHours(phoneWork)}</strong></div><div class="stat"><small>Tiempo en tareas</small><strong>${fmtHours(taskMin)}</strong></div><div class="stat"><small>Actividad laboral separada</small><strong>${fmtHours(workInt)}</strong></div><div class="stat"><small>Sin asignar a trabajo</small><strong>${fmtHours(unassigned)}</strong></div><div class="stat"><small>Tareas periodo</small><strong>${tasks.length}</strong></div></div>`};

  window.exportFilteredInterruptions=function(){const {interruptions,f}=filteredWorkData(),[a,b]=reportRangeBounds(f.from,f.to);downloadCsv('informe_actividad_laboral.csv',['Empleado','Actividad / tarea','Tienda','Motivo','Computa','Nota','Inicio','Fin','Minutos en rango'],interruptions.map(x=>{const t=db.tasks.find(t=>t.id===x.task_id);return[person(x.user_id)?.name||'',t?.title||'Actividad laboral independiente',locationName(workLoc(x)),interruptionName(x.reason_code),'SÍ',x.reason_note||'',x.started_at,x.ended_at||'',Math.round(intervalMinutesWithin(x.started_at,x.ended_at,a,b))]}))};

  window.exportPhoneUsageReport=function(){const {breaks,interruptions,f}=filteredWorkData(),[a,b]=reportRangeBounds(f.from,f.to),rows=[];breaks.filter(x=>isPhoneActivityCode(x.break_type)).forEach(x=>{const e=db.attendance.find(e=>e.id===x.attendance_entry_id);rows.push([person(x.user_id)?.name||'',locationName(e?.location_id),phoneChannel(x.break_type),'PERSONAL','NO',breakName(x.break_type),'',x.notes||'',x.started_at,x.ended_at||'',Math.round(intervalMinutesWithin(x.started_at,x.ended_at,a,b))])});interruptions.filter(x=>isPhoneActivityCode(x.reason_code)).forEach(x=>{const t=db.tasks.find(t=>t.id===x.task_id);rows.push([person(x.user_id)?.name||'',locationName(workLoc(x)),phoneChannel(x.reason_code),'LABORAL','SÍ',interruptionName(x.reason_code),t?.title||'Actividad laboral independiente',x.reason_note||'',x.started_at,x.ended_at||'',Math.round(intervalMinutesWithin(x.started_at,x.ended_at,a,b))])});rows.sort((a,b)=>String(a[8]).localeCompare(String(b[8])));downloadCsv('informe_telefono_whatsapp.csv',['Empleado','Tienda','Canal','Tipo','Computa','Clasificación','Tarea / actividad','Motivo / detalle','Inicio','Fin','Minutos en rango'],rows)};

  const baseTick=window.tick;
  if(typeof baseTick==='function')window.tick=function(){const r=baseTick.apply(this,arguments);patchQuickWork();patchStandaloneState();refreshWorkElapsed();return r};
  const obs=new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&((n.id==='quickClockBar')||n.querySelector?.('#quickClockBar')))))requestAnimationFrame(()=>{patchQuickWork();patchStandaloneState()})});obs.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(()=>{patchQuickWork();patchStandaloneState()});
})();
