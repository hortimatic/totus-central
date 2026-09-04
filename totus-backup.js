/* Totus Central · Backup y rollback
   Dos modos: recuperación fusionada y rollback exacto con copia previa y verificación. */
(function(){
  function backupRowCount(b){return Object.values(b?.data||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0)}
  function backupFileCount(b){return Array.isArray(b?.files)?b.files.length:0}
  function currentAdminIncluded(b){const email=(session?.user?.email||'').toLowerCase(),uid=session?.user?.id;return (b?.data?.team_members||[]).some(x=>String(x.email||'').toLowerCase()===email&&x.role==='admin'&&x.active!==false)&&(b?.data?.profiles||[]).some(x=>x.id===uid)}

  async function listBucketPaths(bucket,prefix='',depth=0){
    if(depth>20)throw new Error(`Demasiados niveles de carpetas en ${bucket}`);
    const out=[];let offset=0;
    while(true){
      const {data,error}=await sb.storage.from(bucket).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});if(error)throw new Error(`${bucket}: ${error.message}`);
      const rows=data||[];
      for(const item of rows){const p=prefix?`${prefix}/${item.name}`:item.name;if(item.id||item.metadata)out.push(p);else out.push(...await listBucketPaths(bucket,p,depth+1))}
      if(rows.length<100)break;offset+=100;
    }
    return out;
  }

  async function syncBucketToBackup(bucket,files){
    const desired=new Set(files.filter(f=>f.bucket===bucket).map(f=>f.path)),current=await listBucketPaths(bucket),extras=current.filter(p=>!desired.has(p));
    if(extras.length)await removeStoragePaths(bucket,extras);
    return {before:current.length,removed:extras.length,expected:desired.size};
  }

  async function uploadBackupFiles(b){
    const allowedBuckets=new Set(Number(b.version)>=2?BACKUP_FILE_BUCKETS:['task-evidence','internal-library']);
    for(const f of b.files||[]){
      if(!allowedBuckets.has(f.bucket)||!f.path)continue;
      const blob=new Blob([base64ToBytes(f.data)],{type:f.type||'application/octet-stream'}),up=await sb.storage.from(f.bucket).upload(f.path,blob,{upsert:true,contentType:f.type||undefined});
      if(up.error)throw new Error(`Archivo ${f.bucket}/${f.path}: ${up.error.message}`);
    }
  }

  async function restoreTables(b){
    for(const table of BACKUP_TABLES){const rows=b.data?.[table];if(!Array.isArray(rows))throw new Error(`Bloque ausente: ${table}`);if(!rows.length)continue;const {error}=await sb.rpc('admin_restore_backup_table',{p_table:table,p_rows:rows});if(error)throw new Error(`${table}: ${error.message}`)}
  }

  async function tableCount(table){const {count,error}=await sb.from(table).select('*',{count:'exact',head:true});if(error)throw new Error(`${table}: ${error.message}`);return Number(count||0)}
  async function verifyRestoredBackup(b,exact){
    const tableIssues=[];
    for(const table of BACKUP_TABLES){const expected=(b.data?.[table]||[]).length,actual=await tableCount(table);if(exact?actual!==expected:actual<expected)tableIssues.push(`${table}: ${actual}/${expected}`)}
    const fileIssues=[],buckets=Number(b.version)>=2?BACKUP_FILE_BUCKETS:['task-evidence','internal-library'];
    for(const bucket of buckets){const expected=new Set((b.files||[]).filter(f=>f.bucket===bucket).map(f=>f.path)),actual=new Set(await listBucketPaths(bucket));if(exact&&(actual.size!==expected.size||[...expected].some(p=>!actual.has(p))))fileIssues.push(`${bucket}: ${actual.size}/${expected.size}`);if(!exact&&[...expected].some(p=>!actual.has(p)))fileIssues.push(`${bucket}: faltan archivos`)}
    if(tableIssues.length||fileIssues.length)throw new Error(`Verificación incompleta. ${[...tableIssues,...fileIssues].slice(0,8).join(' · ')}`);
    return {tables:BACKUP_TABLES.length,rows:backupRowCount(b),files:backupFileCount(b)};
  }

  async function authPreflight(b){
    const emails=(b.data?.team_members||[]).map(x=>x.email).filter(Boolean),ids=(b.data?.profiles||[]).map(x=>x.id).filter(Boolean);
    const {data,error}=await sb.rpc('admin_validate_backup_auth',{p_profile_ids:ids,p_member_emails:emails});
    if(error)throw new Error('No se pudo verificar las cuentas de acceso: '+error.message);
    if(data?.ok===false){const missing=(data.missing_emails||[]).slice(0,6).join(', ');throw new Error(`Faltan ${data.missing_email_count||data.missing_profile_count||1} cuentas de acceso de Supabase${missing?': '+missing:''}. Recréala(s) antes de usar rollback exacto; la restauración fusionada sigue disponible.`)}
    return true;
  }

  async function logRestore(mode,b,verification){
    try{await sb.from('admin_maintenance_log').insert({actor_user_id:me().id,action:mode==='exact'?'ROLLBACK_EXACT':'RESTORE_MERGE',scope:'full',cutoff:new Date().toISOString(),detail:`Backup ${state.backupLoadedName||''} · ${verification.rows} registros · ${verification.files} archivos · verificado`})}catch{}
  }

  window.restoreLoadedBackup=function(){
    if(!isAdmin()||!state.backupLoaded)return;
    const b=state.backupLoaded,rows=backupRowCount(b),files=backupFileCount(b),safe=currentAdminIncluded(b);
    modal(`<div class="section-head"><div><div class="eyebrow">Restauración</div><h3>¿Qué tipo de recuperación necesitas?</h3><div class="small">Backup ${esc(state.backupLoadedName||'cargado')} · ${rows} registros · ${files} archivos</div></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="restore-choice"><button class="secondary" onclick="runLoadedBackupRestore('merge')"><b>Recuperar fusionando</b><span>Repone y actualiza lo guardado sin borrar registros creados después. Es la opción normal para recuperar información.</span></button><button class="danger exact" ${safe?'':'disabled'} onclick="runLoadedBackupRestore('exact')"><b>Rollback exacto</b><span>Devuelve datos y archivos al estado del backup, eliminando lo posterior. Siempre crea una copia completa previa y verifica las cuentas de acceso.</span></button></div>${safe?'':'<div class="warn-note note" style="margin-top:9px">Rollback exacto bloqueado: el backup no contiene la cuenta/perfil del administrador que está ejecutando la operación. La recuperación fusionada sigue disponible.</div>'}<div class="small" style="margin-top:9px">Las contraseñas de Supabase Auth no pueden formar parte del .totusbackup. Antes de un rollback exacto Totus comprueba que todas las cuentas del backup sigan existiendo; si falta alguna, no toca los datos.</div>`)
  };

  window.runLoadedBackupRestore=async function(mode){
    if(!isAdmin()||!state.backupLoaded)return;const exact=mode==='exact',b=state.backupLoaded;
    try{validateBackupPayload(b)}catch(e){return notifyMsg('Backup no válido: '+e.message,'bad')}
    if(exact&&!currentAdminIncluded(b))return notifyMsg('Rollback exacto bloqueado: tu cuenta administrativa no existe en este backup.','bad');
    if(exact){try{await authPreflight(b)}catch(e){return notifyMsg(e.message,'bad',9000)}}
    closeModal();
    const ok=await askConfirm({title:exact?'Rollback exacto':'Recuperar backup',message:exact?'Se creará primero una copia completa del estado actual. Después Totus reemplazará datos y archivos por el contenido exacto del backup y verificará el resultado.':'Se creará primero una copia completa del estado actual y después se fusionará la información del backup sin borrar datos posteriores.',confirmText:exact?'EJECUTAR ROLLBACK':'RESTAURAR',danger:exact,requireText:exact?'ROLLBACK EXACTO':'RESTAURAR'});if(!ok)return;
    notifyMsg('Creando copia completa previa…');
    try{await createSafetyBackup(exact?'PRE_ROLLBACK_EXACT':'PRE_RESTORE')}catch(e){return notifyMsg('Operación cancelada: no se pudo crear la copia previa. '+e.message,'bad')}
    try{
      if(exact){notifyMsg('Preparando rollback exacto…');const prep=await sb.rpc('admin_prepare_exact_restore');if(prep.error)throw new Error(prep.error.message)}
      notifyMsg('Restaurando datos…');await restoreTables(b);
      if(exact){notifyMsg('Sincronizando archivos…');const buckets=Number(b.version)>=2?BACKUP_FILE_BUCKETS:['task-evidence','internal-library'];for(const bucket of buckets)await syncBucketToBackup(bucket,b.files||[])}
      await uploadBackupFiles(b);
      if(exact){const emails=(b.data.team_members||[]).map(x=>x.email).filter(Boolean),ids=(b.data.profiles||[]).map(x=>x.id).filter(Boolean);const fin=await sb.rpc('admin_finalize_exact_restore',{p_member_emails:emails,p_profile_ids:ids});if(fin.error)throw new Error(fin.error.message)}
      notifyMsg('Verificando integridad…');const verification=await verifyRestoredBackup(b,exact);await logRestore(mode,b,verification);
      await reloadTeamData();state.backupLoaded=null;state.backupLoadedName='';state.backupLoadedText='';renderGeneralLog();notifyMsg(exact?'Rollback exacto completado y verificado.':'Recuperación completada y verificada.');
    }catch(e){await reloadTeamData().catch(()=>{});renderGeneralLog();notifyMsg(`${exact?'Rollback':'Restauración'} detenido: ${e.message}. La copia previa permanece guardada en Totus.`,'bad',9000)}
  };

  window.backupCoverageModal=function(){
    modal(`<div class="section-head"><div><div class="eyebrow">Backup portable</div><h3>Qué queda protegido</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="backup-coverage"><div><b>Configuración</b><span>Usuarios/perfiles, roles, centros/proyectos, reglas, horarios, temporadas, excepciones, festivos y objetivos.</span></div><div><b>Operativa e histórico</b><span>Tareas, tramos, actividades laborales, fichajes, pausas, compras, vacaciones, consultas y auditorías.</span></div><div><b>Pricing</b><span>Marcas, familias, productos, variantes, proveedores, competencia, consultas e históricos de precios.</span></div><div><b>Archivos reales</b><span>Evidencias de tareas, biblioteca/documentos internos y avatares; no solo sus rutas.</span></div><div><b>Integridad</b><span>Checksum SHA-256, validación previa y comprobación de tablas/archivos tras restaurar.</span></div><div><b>Rollback</b><span>Copia automática previa, verificación Auth y sustitución exacta del estado operativo cuando es seguro hacerlo.</span></div></div><div class="note" style="margin-top:9px"><b>No se copia de forma recursiva el almacén de backups privados.</b> Es intencionado: esas copias se conservan aparte para que siempre exista una salida de emergencia. Las contraseñas de Supabase Auth no son recuperables ni exportables; Totus verifica que las cuentas sigan existiendo antes del rollback exacto.</div>`)
  };
})();
