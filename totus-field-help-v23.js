/* Totus Central · Field Help V23
   Ayuda contextual y obligatoriedad visible para formularios de uso real. */
(function(){
  const F={
    taskTitle:['Título de la tarea','Nombre corto y reconocible. Debe permitir saber qué hay que hacer sin abrir la ficha. Ejemplo: “Dar de alta pedido recibido de Oxva”.',1],
    taskCategory:['Categoría','Clasifica el trabajo para que el tiempo pueda agruparse después en informes.',1],
    taskPriority:['Prioridad','Úsala para ordenar la atención. Urgente debe reservarse para lo que realmente no puede esperar.',0],
    taskDescription:['Instrucciones','Explica qué debe hacerse y, si aplica, cuándo se considera terminada. Evita instrucciones que solo conozca quien creó la tarea.',0],
    taskAssigned:['Responsable','Persona que realizará la tarea y cuyo reloj podrá contabilizarla.',1],
    taskLocation:['Tienda / centro','Centro donde debe realizarse. Para iniciar el reloj, el fichaje del empleado debe corresponder a la misma tienda.',1],
    taskStart:['Inicio','Momento previsto a partir del cual la tarea debe aparecer como trabajo a realizar.',0],
    taskDue:['Vencimiento','Fecha y hora límite. Si se supera, la tarea aparecerá como vencida y puede generar avisos.',0],
    taskEstimate:['Tiempo estimado','Minutos previstos. El tiempo real nunca se sustituye: sirve para comparar previsión y ejecución.',0],
    taskReminder:['Recordatorio','Minutos de antelación con los que Totus avisará antes del inicio o vencimiento.',0],
    taskEvidenceRequired:['Foto requerida','Actívalo solo cuando sea imprescindible demostrar el resultado con una imagen. Si no, la foto seguirá siendo opcional.',0],
    taskRepeat:['Repetición','Convierte la tarea en recurrente. Configura intervalo, fin y días solo cuando realmente tenga una cadencia repetitiva.',0],
    taskInterval:['Intervalo','Cada cuántas horas, días o semanas se repetirá la tarea, según la frecuencia elegida.',0],
    taskUntil:['Repetir hasta','Último día en el que debe generarse la recurrencia. Déjalo vacío si no hay fecha final.',0],
    taskCount:['Número de ejecuciones','Límite total de repeticiones. 0 significa sin límite, respetando la fecha final si existe.',0],

    buyName:['Producto / concepto','Nombre o referencia suficiente para reconocer después qué compró el empleado.',1],
    buyLocation:['Tienda de la compra','Centro al que se imputa la operación.',1],
    buyDate:['Fecha de compra','Día real de la compra o de la imputación al pedido del proveedor.',1],
    buyKind:['Tipo de compra','En tienda: PVP menos descuento de empleado. En pedido a proveedor: coste más IVA, RE y costes directos, sin margen para la empresa.',1],
    buyQty:['Cantidad','Número real de unidades. El total se recalcula automáticamente.',1],
    buyPvp:['PVP marcado','Precio final de venta al público que tenía el producto en tienda. Totus aplicará el descuento de empleado configurado.',1],
    buyCost:['Coste proveedor','Coste neto por unidad antes de IVA y Recargo de Equivalencia. No introduzcas el PVP.',1],
    buyExtra:['Coste directo por unidad','Transporte u otro gasto directamente atribuible a cada unidad. Si no existe, deja 0.',0],
    buySupplier:['Proveedor','Proveedor del pedido en el que se ha incluido la compra del empleado.',1],
    buyRef:['Ticket / referencia','Dato que permita localizar la operación: número de ticket, pedido o factura.',1],
    buyPayment:['Método de pago','Cómo ha pagado el empleado la compra.',1],
    buyNotes:['Notas','Solo información útil para identificar o justificar la operación. No es obligatorio rellenarlo.',0],

    seasonName:['Nombre de temporada','Nombre fácil de reconocer, por ejemplo “Invierno 2026” o “Horario verano”.',1],
    seasonFrom:['Vigente desde','Primer día en que este horario debe aplicarse.',1],
    seasonTo:['Vigente hasta','Último día de vigencia. Vacío significa que no tiene fecha final definida.',0],
    seasonLocation:['Tienda del horario','Centro al que corresponde esta temporada de turnos.',1],
    targetMonth:['Mes del objetivo','Mes al que se aplicará el objetivo de horas del empleado.',1],
    targetHours:['Objetivo mensual','Horas ordinarias previstas para ese empleado en el mes. Las adicionales se muestran aparte.',1],
    excDate:['Fecha de excepción','Día concreto en que se modifica el turno habitual.',1],
    excShift:['Tramo','Número del tramo del día que se sustituye o anula.',1],
    excStart:['Entrada excepcional','Hora de entrada de ese cambio puntual. No se usa si marcas día libre.',0],
    excEnd:['Salida excepcional','Hora de salida de ese cambio puntual. No se usa si marcas día libre.',0],
    excLoc:['Tienda de la excepción','Centro donde se prestará servicio ese tramo.',0],
    excReason:['Motivo del cambio','Explicación breve para poder entender después por qué se alteró el horario.',0],

    storeName:['Nombre de tienda','Nombre visible del centro en toda la herramienta.',1],
    storeCode:['Código interno','Identificador corto y estable. Se usa internamente y no conviene cambiarlo sin motivo.',1],
    storePostal:['Código postal','Código postal de la tienda. Ayuda a mantener completa la ficha del centro.',0],
    storeAddress:['Dirección','Dirección física del centro.',0],
    storeCity:['Ciudad','Municipio donde está la tienda.',0],
    storeProvince:['Provincia','Provincia de la tienda.',0],
    storeRegion:['Comunidad autónoma','Comunidad autónoma del centro.',0],
    storeCountry:['País','País del centro. Por defecto España.',0],
    storeTimezone:['Zona horaria','Debe mantenerse como Europe/Madrid para estas tiendas salvo que exista un centro en otra zona horaria.',0],
    storeNotes:['Notas de tienda','Observaciones internas del centro. No afectan a fichajes ni cálculos.',0],

    libTitle:['Título del contenido','Nombre con el que el equipo encontrará este tutorial, protocolo o documento.',1],
    libCategory:['Categoría','Ayuda a filtrar y encontrar el contenido en la biblioteca.',1],
    libOrder:['Orden','Número usado para decidir qué contenidos aparecen antes. No afecta al contenido.',0],
    libDescription:['Descripción','Resumen corto de para qué sirve el contenido.',0],
    libContent:['Texto / procedimiento','Explicación completa que podrá consultar el equipo directamente en Totus.',0],
    libUrl:['Enlace externo','Página relacionada. Debe comenzar por http:// o https://.',0],
    libFile:['Archivo','Documento, imagen o vídeo adjunto. Se conservarán las versiones para trazabilidad.',0],
    questionCategory:['Categoría de consulta','Selecciona el tema más cercano para que las preguntas históricas sean fáciles de encontrar.',1],
    questionText:['Pregunta','Describe la duda con información suficiente para que pueda responderse sin tener que preguntar de nuevo.',1],
    questionAnswer:['Respuesta','Respuesta que quedará guardada junto a la consulta para futuras búsquedas.',1],

    repUser:['Usuario del informe','Empleado del que quieres obtener los datos. Administración puede elegir cualquiera.',1],
    repFrom:['Desde','Primer día incluido en el informe.',1],
    repTo:['Hasta','Último día incluido en el informe.',1],
    repLoc:['Tienda','Permite limitar el informe a un centro. Déjalo en todas para ver el conjunto.',0],
    logUser:['Usuario del histórico','Filtra movimientos en los que participa ese usuario.',0],
    logModule:['Módulo del histórico','Limita los movimientos a una zona concreta de Totus.',0],
    logFrom:['Desde','Primer día incluido en el histórico.',1],
    logTo:['Hasta','Último día incluido en el histórico.',1],

    requiredReason:['Motivo','Las correcciones y acciones sensibles exigen una explicación para que el histórico sea comprensible.',1],
    tteReason:['Motivo de corrección','Explica por qué se modifica manualmente un tramo de tiempo. Quedará auditado.',1],
    epAdminNotes:['Motivo de corrección','Describe qué dato de la compra se corrige y por qué. La versión anterior queda registrada.',1]
  };

  function show(id){const x=F[id];if(!x)return;modal(`<div class="section-head"><div><div class="eyebrow">Ayuda del campo</div><h3>${esc(x[0])}</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="field-help-body">${esc(x[1])}</div>${x[2]?'<div class="note" style="margin-top:12px"><b>Obligatorio.</b> No podrás guardar esta operación sin completarlo correctamente.</div>':'<div class="note" style="margin-top:12px">Este campo es opcional salvo que otra selección de la pantalla haga que sea necesario.</div>'}`)}
  window.showFieldHelpV23=show;

  function labelFor(el){const own=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);if(own)return own;const parent=el.parentElement;if(!parent)return null;return [...parent.children].find(x=>x.tagName==='LABEL')||parent.querySelector('label')}
  function empty(el){if(el.type==='checkbox'||el.type==='radio')return !el.checked;return !String(el.value??'').trim()}
  function validate(el){if(el.dataset.totusRequired!=='1')return;const bad=empty(el);el.classList.toggle('field-empty',bad);if(bad)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')}
  function enhanceField(el){if(!el?.id||!F[el.id]||el.dataset.fieldHelpV23==='1')return;const cfg=F[el.id],lab=labelFor(el);if(!lab)return;el.dataset.fieldHelpV23='1';
    if(!lab.querySelector('.field-detail-help')){const b=document.createElement('button');b.type='button';b.className='field-detail-help';b.textContent='?';b.title=`Ayuda: ${cfg[0]}`;b.setAttribute('aria-label',`Ayuda sobre ${cfg[0]}`);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show(el.id)});lab.appendChild(b)}
    if(cfg[2]){el.dataset.totusRequired='1';el.setAttribute('aria-required','true');if(!lab.querySelector('.required-mini')){const s=document.createElement('span');s.className='required-mini';s.textContent='obligatorio';lab.appendChild(s)}el.addEventListener('blur',()=>validate(el));el.addEventListener('input',()=>{if(!empty(el))validate(el)});el.addEventListener('change',()=>validate(el))}
  }
  function enhance(){document.querySelectorAll('input[id],select[id],textarea[id]').forEach(enhanceField)}
  let queued=false;const obs=new MutationObserver(ms=>{if(!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))return;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})});obs.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(enhance);
})();
