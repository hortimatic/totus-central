import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const backup=read('totus-backup.js');
const team=read('totus-team.js');
const fail=[];const ok=[];const check=(c,m)=>c?ok.push(m):fail.push(m);
check(/V3_VERSION=3/.test(backup),'Backup portable usa versión 3');
check(/team_member_locations/.test(backup),'Backup V3 incluye asignaciones usuario-centro/proyecto');
check(/\[1,2,3\]/.test(backup),'Validador mantiene compatibilidad V1/V2/V3');
check(/admin_rebuild_member_locations_legacy/.test(backup),'Backups V1/V2 reconstruyen asignaciones heredadas');
check(/admin_validate_backup_auth/.test(backup),'Rollback exacto mantiene preflight de Auth');
check(/createSafetyBackup/.test(backup),'Rollback/restauración crea copia previa');
check(/verifyRestoredBackup/.test(backup),'Rollback/restauración verifica integridad');
check(/user-avatars/.test(team),'Copia de archivos incluye avatares');
check(/task-evidence/.test(team)&&/internal-library/.test(team),'Copia de archivos incluye evidencias y biblioteca');
if(fail.length){console.error('BACKUP/RBAC QA FALLIDA');fail.forEach(x=>console.error('✗ '+x));process.exit(1)}
console.log(`BACKUP/RBAC QA OK · ${ok.length}`);ok.forEach(x=>console.log('✓ '+x));
