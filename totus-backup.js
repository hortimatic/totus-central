/* Totus Central · Backup y rollback
   V4 protege expediente operativo/documental y conserva compatibilidad V1/V2/V3. */
(function(){
  const LEGACY_TABLES=[...BACKUP_TABLES];
  const V3_TABLES=(()=>{const x=[...LEGACY_TABLES],i=x.indexOf('team_locations');x.splice(i+1,0,'team_member_locations');return x})();
  const V4_TABLES=(()=>{const x=[...V3_TABLES],i=x.indexOf('internal_questions');x.splice(i+1,0,'employee_incidents','employee_incident_audit_log','employee_documents','employee_document_audit_log');return x})();
  const CURRENT_VERSION=4;
  const V3_BUCKETS=[...BACKUP_FILE_BUCKETS];
  const V4_BUCKETS=[...V3_BUCKETS,'employee-documents'];
  const tablesForVersion=v=>Number(v)>=4?V4_TABLES:Number(v)>=3?V3_TABLES:LEGACY_TABLES;
  const bucketsForVersion=v=>Number(v)>=4?V4_BUCKETS:Number(v)>=2?V3_BUCKETS:['task-evidence','internal-library'];
  const backupRowCount=b=>Object.values(b?.data||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
  const backupFileCount=b=>Array.isArray(b?.files)?b.files.length:0;
  const currentAdminIncluded=b=>{const email=(session?.user?.email||'').toLowerCase(),uid=session?.user?.id;return (b?.data?.team_members||[]).some(x=>String(x.email||'').toLowerCase()===email&&x.role==='admin'&&x.active!==false)&&(b?.data?.profiles||[]).some(x=>x.id===uid)};

  async function readBackupTable(table){
    if(table==='team_member_locations')return qAll(table,'*',x=>x.order('user_id').order('location_id'));
    return qAllBackup(table,'*');
  }
  async function appendEmployeeDocumentFiles(data,files){
    const seen=new Set((files||[]).map(f=>f.bucket+'|'+f.path));
    for(const row of data.employee_documents||[]){
      if(!row.file_path)continue;const key='employee-documents|'+row.file_path;if(seen.has(key))continue;
      const {data:blob,error}=await sb.storage.from('employee-documents').download(row.file_path);if(error||!blob)throw new Error(`Backup incompleto: no se pudo leer employee-documents/${row.file_path}${error?': '+error.message:''}`);
      files.push({bucket:'employee-documents',path:row.file_path,type:row.file_type||blob.type||'application/octet-stream',name:row.file_name||null,data:bytesToBase64(new Uint8Array(await blob.arrayBuffer()))});seen.add(key);
    }
    return files;
  }

  window.buildPortableBackup=async function(){
    if(!isAdmin())throw new Error('Solo administración puede crear backups completos');
    const data={};for(const table of V4_TABLES)data[table]=await readBackupTable(table);
    const files=await appendEmployeeDocumentFiles(data,await collectBackupFiles(data)),rows=backupRowCount({data}),payload={format:'totusbackup',version:CURRENT_VERSION,created_at:new Date().toISOString(),created_by:me().id,scope:'full',manifest:{tables:V4_TABLES.length,rows,files:files.length,buckets:[...new Set(files.map(f=>f.bucket))],features:['workspace_assignments_v3','employee_records_v4','auth_preflight','exact_rollback'],excludes:['Archivo histórico de backups privados (evita copias recursivas)','Contraseñas de Supabase Auth (no exportables)']},data,files};
    payload.checksum=await sha256Text(JSON.stringify(payload));return payload;
  };

  window.validateBackupPayload=function(obj){
    const version=Number(obj?.version);
    if(!obj||obj.format!=='totusbackup'||![1,2,3,4].includes(version))throw new Error('Formato o versión no reconocidos');
    if(!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw new Error('Bloque de datos no válido');
    const expected=tablesForVersion(version),keys=Object.keys(obj.data),allowed=new Set(expected),unknown=keys.filter(k=>!allowed.has(k)),missing=expected.filter(k=>!keys.includes(k));
    if(unknown.length)throw new Error('El backup contiene tablas no autorizadas: '+unknown.join(', '));
    if(missing.length)throw new Error('El backup está incompleto; faltan tablas: '+missing.join(', '));
    for(const table of expected)if(!Array.isArray(obj.data[table]))throw new Error(`Datos no válidos en ${table}`);
    if(!Array.isArray(obj.files))throw new Error('Bloque de archivos no válido');
    const allowedBuckets=new Set(bucketsForVersion(version)),seen=new Set();
    for(const f of obj.files){if(!f||!allowedBuckets.has(f.bucket))throw new Error('Bucket de archivo no autorizado');if(!validBackupPath(f.path))throw new Error('Ruta de archivo no válida');const key=f.bucket+'|'+f.path;if(seen.has(key))throw new Error('Archivo duplicado en backup: '+f.path);seen.add(key);if(typeof f.data!=='string')throw new Error('Contenido binario no válido: '+f.path);try{base64ToBytes(f.data)}catch{throw new Error('Base64 no válido: '+f.path)}}
    return true;
  };

  async function listBucketPaths(bucket,prefix='',depth=0){
    if(depth>20)throw new Error(`Demasiados niveles de carpetas en ${bucket}`);
    const out=[];let offset=0;
    while(true){const {data,error}=await sb.storage.from(bucket).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});if(error)throw new Error(`${bucket}: ${error.message}`);const rows=data||[];for(const item of rows){const p=prefix?`${prefix}/${item.name}`:item.name;if(item.id||item.metadata)out.push(p);else out.push(...await listBucketPaths(bucket,p,depth+1))}if(rows.length<100)break;offset+=100}
    return out;
  }
  async function syncBucketToBackup(bucket,files){const desired=new Set(files.filter(f=>f.bucket===bucket).map(f=>f.path)),current=await listBucketPaths(bucket),extras=current.filter(p=>!desired.has(p));if(extras.length)await removeStoragePaths(bucket,extras);return{before:current.length,removed:extras.length,expected:desired.size}}
  async function uploadBackupFiles(b){const allowedBuckets=new Set(bucketsForVersion(b.version));for(const f of b.files||[]){if(!allowedBuckets.has(f.bucket)||!f.path)continue;const blob=new Blob([base64ToBytes(f.data)],{type:f.type||'application/octet-stream'}),up=await sb.storage.from(f.bucket).upload(f.path,blob,{upsert:true,contentType:f.type||undefined});if(up.error)throw new Error(`Archivo ${f.bucket}/${f.path}: ${up.error.message}`)}}
  async function restoreTables(b){for(const table of tablesForVersion(b.version)){const rows=b.data?.[table];if(!Array.isArray(rows))throw new Error(`Bloque ausente: ${table}`);if(!rows.length)continue;const {error}=await sb.rpc('admin_restore_backup_table',{p_table:table,p_rows:rows});if(error)throw new Error(`${table}: ${error.message}`)}}
  async function rebuildLegacyAssignmentsIfNeeded(b){if(Number(b.version)>=3)return;const {error}=await sb.rpc('admin_rebuild_member_locations_legacy');if(error)throw new Error('No se pudieron reconstruir las asignaciones de centros del backup antiguo: '+error.message)}
  async function tableCount(table){const {count,error}=await sb.from(table).select('*',{count:'exact',head:true});if(error)throw new Error(`${table}: ${error.message}`);return Number(count||0)}
  async function verifyRestoredBackup(b,exact){
    const expectedTables=tablesForVersion(b.version),tableIssues=[];
    for(const table of expectedTables){const expected=(b.data?.[table]||[]).length,actual=await tableCount(table);if(exact?actual!==expected:actual<expected)tableIssues.push(`${table}: ${actual}/${expected}`)}
    if(Number(b.version)<3){const assignments=await tableCount('team_member_locations');if(assignments<1)tableIssues.push('team_member_locations: no reconstruidas')}
    const fileIssues=[];for(const bucket of bucketsForVersion(b.version)){const expected=new Set((b.files||[]).filter(f=>f.bucket===bucket).map(f=>f.path)),actual=new Set(await listBucketPaths(bucket));if(exact&&(actual.size!==expected.size||[...expected].some(p=>!actual.has(p))))fileIssues.push(`${bucket}: ${actual.size}/${expected.size}`);if(!exact&&[...expected].some(p=>!actual.has(p)))fileIssues.push(`${bucket}: faltan archivos`)}
    if(tableIssues.length||fileIssues.length)throw new Error(`Verificación incompleta. ${[...tableIssues,...fileIssues].slice(0,8).join(' · ')}`);return{tables:expectedTables.length,rows:backupRowCount(b),files:backupFileCount(b)};
  }
  async function authPreflight(b){const emails=(b.data?.team_members||[]).map(x=>x.email).filter(Boolean),ids=(b.data?.profiles||[]).map(x=>x.id).filter(Boolean),{data,error}=await sb.rpc('admin_validate_backup_auth',{p_profile_ids:ids,p_member_emails:emails});if(error)throw new Error('No se pudieron verificar las cuentas de acceso: '+error.message);if(data?.ok===false){const missing=(data.missing_emails||[]).slice(0,6).join(', ');throw new Error(`Faltan ${data.missing_email_count||data.missing_profile_count||1} cuentas de acceso de Supabase${missing?': '+missing:''}. Recréala(s) antes de usar rollback exacto; la restauración fusionada sigue disponible.`)}return true}
  async function logRestore(mode,b,v){try{await sb.from('admin_maintenance_log').insert({actor_user_id:me().id,action:mode==='exact'?'ROLLBACK_EXACT':'RESTORE_MERGE',scope:'full',cutoff:new Date().toISOString(),detail:`Backup V${b.version} ${state.backupLoadedName||''} · ${v.rows} registros · ${v.files} archivos · verificado`})}catch{}}

  window.restoreLoadedBackup=function(){
    if(!isAdmin()||!state.backupLoaded)return;const b=state.backupLoaded,rows=backupRowCount(b),files=backupFileCount(b),safe=currentAdminIncluded(b),legacy=Number(b.version)<3;
    modal(`<div class="section-head"><div><div class="eyebrow">Restauración</div><h3>¿Qué tipo de recuperación necesitas?</h3><div class="small">Backup V${Number(b.version||1)} · ${esc(state.backupLoadedName||'cargado')} · ${rows} registros · ${files} archivos</div></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="restore-choice"><button class="secondary" onclick="runLoadedBackupRestore('merge')"><b>Recuperar fusionando</b><span>Repone y actualiza lo guardado sin borrar registros creados después.</span></button><button class="danger exact" ${safe?'':'disabled'} onclick="runLoadedBackupRestore('exact')"><b>Rollback exacto</b><span>Devuelve datos y archivos al estado del backup. Crea una copia previa y verifica el resultado.</span></button></div>${legacy?'<div class="note" style="margin-top:9px"><b>Backup anterior a V3.</b> Totus reconstruirá automáticamente las asignaciones de centros/proyectos al restaurarlo.</div>':''}${safe?'':'<div class="warn-note note" style="margin-top:9px">Rollback exacto bloqueado: el backup no contiene la cuenta/perfil del administrador actual.</div>'}<div class="small" style="margin-top:9px">Las contraseñas de Supabase Auth no forman parte del archivo. Totus comprueba que las cuentas sigan existiendo antes de un rollback exacto.</div>`)
  };
  window.runLoadedBackupRestore=async function(mode){
    if(!isAdmin()||!state.backupLoaded)return;const exact=mode==='exact',b=state.backupLoaded;
    try{validateBackupPayload(b)}catch(e){return notifyMsg('Backup no válido: '+e.message,'bad')}
    if(exact&&!currentAdminIncluded(b))return notifyMsg('Rollback exacto bloqueado: tu cuenta administrativa no existe en este backup.','bad');if(exact){try{await authPreflight(b)}catch(e){return notifyMsg(e.message,'bad',9000)}}
    closeModal();const ok=await askConfirm({title:exact?'Rollback exacto':'Recuperar backup',message:exact?'Totus creará primero una copia V4 completa del estado actual. Después reemplazará datos y archivos por el backup cargado y verificará el resultado.':'Totus creará primero una copia V4 completa del estado actual y después fusionará el backup sin borrar datos posteriores.',confirmText:exact?'EJECUTAR ROLLBACK':'RESTAURAR',danger:exact,requireText:exact?'ROLLBACK EXACTO':'RESTAURAR'});if(!ok)return;
    notifyMsg('Creando copia completa previa…');try{await createSafetyBackup(exact?'PRE_ROLLBACK_EXACT':'PRE_RESTORE')}catch(e){return notifyMsg('Operación cancelada: no se pudo crear la copia previa. '+e.message,'bad')}
    try{if(exact){notifyMsg('Preparando rollback exacto…');const prep=await sb.rpc('admin_prepare_exact_restore');if(prep.error)throw new Error(prep.error.message)}notifyMsg('Restaurando datos…');await restoreTables(b);await rebuildLegacyAssignmentsIfNeeded(b);if(exact){notifyMsg('Sincronizando archivos…');for(const bucket of bucketsForVersion(b.version))await syncBucketToBackup(bucket,b.files||[])}await uploadBackupFiles(b);if(exact){const emails=(b.data.team_members||[]).map(x=>x.email).filter(Boolean),ids=(b.data.profiles||[]).map(x=>x.id).filter(Boolean),fin=await sb.rpc('admin_finalize_exact_restore',{p_member_emails:emails,p_profile_ids:ids});if(fin.error)throw new Error(fin.error.message)}notifyMsg('Verificando integridad…');const verification=await verifyRestoredBackup(b,exact);await logRestore(mode,b,verification);await reloadTeamData();state.backupLoaded=null;state.backupLoadedName='';state.backupLoadedText='';renderGeneralLog();notifyMsg(exact?'Rollback exacto completado y verificado.':'Recuperación completada y verificada.')}catch(e){await reloadTeamData().catch(()=>{});renderGeneralLog();notifyMsg(`${exact?'Rollback':'Restauración'} detenido: ${e.message}. La copia previa permanece guardada en Totus.`,'bad',9000)}
  };
  window.backupCoverageModal=function(){modal(`<div class="section-head"><div><div class="eyebrow">Backup portable V4</div><h3>Qué queda protegido</h3></div><button class="ghost" onclick="closeModal()">Cerrar</button></div><div class="backup-coverage"><div><b>Equipo y permisos</b><span>Usuarios, perfiles, roles y asignaciones de cada persona a centros/proyectos.</span></div><div><b>Configuración</b><span>Centros/proyectos, reglas, horarios, temporadas, excepciones, festivos, categorías y objetivos.</span></div><div><b>Operativa e histórico</b><span>Tareas, tramos, actividades laborales, fichajes, pausas, compras, vacaciones, incidencias, consultas y auditorías.</span></div><div><b>Expediente documental</b><span>Documentos privados de empleados, estado, caducidad, auditoría y sus archivos reales.</span></div><div><b>Pricing</b><span>Marcas, familias, productos, variantes, proveedores, competencia, consultas e históricos.</span></div><div><b>Archivos reales</b><span>Evidencias de tareas, biblioteca/documentos internos, documentos de empleado y avatares.</span></div><div><b>Rollback</b><span>Copia previa automática, verificación Auth, compatibilidad V1/V2/V3 y comprobación final de datos/archivos.</span></div></div><div class="note" style="margin-top:9px"><b>Exclusiones intencionadas:</b> el almacén histórico de backups privados no se copia dentro de sí mismo y las contraseñas Auth no son exportables. Todo el estado operativo y la configuración de Totus sí quedan incluidos.</div>`)};
})();