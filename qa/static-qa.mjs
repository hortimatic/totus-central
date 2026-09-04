import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=[];
const ok=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const assert=(cond,msg)=>cond?ok.push(msg):fail.push(msg);

for(const f of ['index.html','totus-suite.html','totus-team.js','totus-team.css','totus-ui.css','totus-ui.js','totus-quick-controls.js','totus-quick-controls.css','totus-workspaces.js','totus-backup.js','pricing.html'])assert(exists(f),`Existe ${f}`);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}

const index=read('index.html'),suite=read('totus-suite.html');
assert(index===suite,'index.html y totus-suite.html son idénticos');
assert(!/totus-ui-audit|totus-field-help-v23/.test(index),'No se cargan capas visuales antiguas');

const refs=[...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('about:')&&!x.startsWith('#'));
for(const ref of refs)assert(exists(ref.replace(/^\.\//,'')),`Referencia local disponible: ${ref}`);
assert(new Set(refs).size===refs.length,'No hay CSS/JS locales cargados por duplicado');

const loadedJs=[...index.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')).map(x=>x.replace(/^\.\//,''));
const sourceFiles=[...new Set([...loadedJs,'pricing.html'])];
let all='';for(const f of sourceFiles)all+='\n'+read(f);
const defs=new Set();
for(const m of all.matchAll(/\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g))defs.add(m[1]);
for(const m of all.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g))defs.add(m[1]);
for(const m of all.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g))defs.add(m[1]);

const eventSources=[index,...loadedJs.map(read),read('pricing.html')].join('\n');
const handlers=new Set();
for(const m of eventSources.matchAll(/on(?:click|change|input|submit|blur|focus|keydown|keyup)=["'`]([A-Za-z_$][\w$]*)\s*\(/g))handlers.add(m[1]);
const browserBuiltins=new Set(['alert','confirm','prompt','open','close','print','setTimeout','setInterval']);
const missing=[...handlers].filter(x=>!defs.has(x)&&!browserBuiltins.has(x));
assert(missing.length===0,`Handlers visibles tienen función: ${missing.length?missing.join(', '):'OK'}`);

const ids=[...index.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const dupIds=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
assert(dupIds.length===0,`Sin IDs duplicados en shell: ${dupIds.length?dupIds.join(', '):'OK'}`);

const ui=read('totus-ui.css');
assert(/max-height:84vh/.test(ui),'Modales tienen altura máxima');
assert(/overflow-x:auto/.test(ui),'Móvil dispone de carriles horizontales compactos');
assert(/\.today-trail,.zone-guide\{display:none/.test(ui),'Se eliminan bloques de auditoría visual que añadían ruido');

const backup=read('totus-backup.js'),team=read('totus-team.js');
assert(/runLoadedBackupRestore\('exact'\)/.test(backup),'Rollback exacto disponible');
assert(/createSafetyBackup/.test(backup),'Restauración exige copia previa');
assert(/verifyRestoredBackup/.test(backup),'Restauración verifica integridad');
assert(/BACKUP_FILE_BUCKETS=\['task-evidence','internal-library','user-avatars'\]/.test(team),'Backup incluye evidencias, biblioteca y avatares');
assert(/qAllBackup/.test(team),'Backup usa paginación completa');

const workspaces=read('totus-workspaces.js');
assert(/digital_project/.test(workspaces)&&/client_site/.test(workspaces),'Centros soportan proyectos digitales y clientes');
assert(/if\(!isAdmin\(\)\)/.test(workspaces),'Configuración de centros restringida en interfaz');

if(fail.length){console.error('\nQA FALLIDA');for(const x of fail)console.error('✗ '+x);console.error(`\n${ok.length} comprobaciones superadas antes del fallo.`);process.exit(1)}
console.log(`QA OK · ${ok.length} comprobaciones`);for(const x of ok)console.log('✓ '+x);
