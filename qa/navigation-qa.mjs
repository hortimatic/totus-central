import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','4178','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,650));
const browser=await chromium.launch({headless:true});
const issues=[];
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>issues.push('pageerror: '+String(e)));

const empty={
 team:[],settings:{employee_purchase_rules:{vat_pct:21,re_pct:5.2,store_discount_pct:10}},
 people:[{id:'u1',name:'Diego QA',email:'qa@example.test',role:'admin',active:true,jobTitle:'Administrador / CO'}],
 locations:[{id:'l1',name:'Hortimatic',active:true,timezone:'Europe/Madrid'}],memberLocations:[{user_id:'u1',location_id:'l1',active:true}],
 schedules:[],scheduleExceptions:[],openingHours:[],openingExceptions:[],breakTypes:[],taskCategories:[],targets:[],attendance:[],tasks:[],taskTimes:[],taskTimeAudit:[],interruptions:[],signatures:[],purchases:[],purchaseAudit:[],breaks:[],attendanceAudit:[],overruns:[],taskAudit:[],adminAudit:[],consultationHistory:[],priceHistory:[],userAudit:[],emailLog:[],library:[],libraryAudit:[],leaveSettings:[],leavePeriods:[],leaveTypes:[],holidays:[],leaveRequests:[],notifications:[],evidence:[],questions:[],backups:[],maintenanceLog:[],incidents:[],incidentAudit:[],employeeDocuments:[],employeeDocumentAudit:[]
};

const assert=(cond,msg)=>{if(!cond)issues.push(msg)};
try{
 await page.goto('http://127.0.0.1:4178/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof goRoot==='function'&&typeof renderCurrentRoot==='function'&&typeof renderLibraryModule==='function',{timeout:15000});
 await page.evaluate(mock=>{session={user:{id:'u1',email:'qa@example.test'}};Object.assign(db,mock);document.getElementById('loginView').classList.add('hidden');document.getElementById('appView').classList.remove('hidden');paintUser();},empty);
 await page.waitForTimeout(120);

 async function route(root,sub,needle){
   await page.evaluate(([r,s])=>goRoot(r,s),[root,sub]);
   await page.waitForTimeout(80);
   const got=await page.evaluate(()=>({root:state.root,sub:state.sub,text:document.getElementById('main')?.innerText||'',side:[...document.querySelectorAll('#sideSubnav button')].map(x=>({text:x.textContent.trim(),active:x.classList.contains('active')})),mobile:document.querySelector('.subnav-mobile')?.value||'',title:document.getElementById('shellTitle')?.textContent||''}));
   assert(got.root===root,`${root}/${sub}: root incorrecto ${got.root}`);
   assert(got.sub===sub,`${root}/${sub}: sub incorrecto ${got.sub}`);
   assert(got.text.includes(needle),`${root}/${sub}: no renderiza ${needle}`);
   assert(got.mobile===sub,`${root}/${sub}: selector móvil desincronizado ${got.mobile}`);
   assert(got.side.some(x=>x.active),`${root}/${sub}: sin subsección activa en lateral`);
 }

 await route('purchases','purchase-overview','Compras');
 await route('purchases','purchase-history','Historial íntegro');
 await route('purchases','purchase-reports','Informes de compras');
 await route('purchases','purchase-audit','Auditoría inmutable');
 await route('library','library-home','Tutoriales y consultas');
 await route('library','questions','Preguntas y respuestas guardadas');
 await route('logs','general-log','Histórico de movimientos');
 await route('logs','maintenance','Backup');
 await route('tasks','attendance','Control horario');
 await route('tasks','reports','Control de trabajo');
 await route('tasks','leave','días libres');
 await route('tasks','incidents','Incidencias');
 await route('tasks','documents','Documentación');

 await page.evaluate(()=>goRoot('purchases'));
 await page.waitForTimeout(50);
 const purchaseDefault=await page.evaluate(()=>({sub:state.sub,user:state.purchaseUserId}));
 assert(purchaseDefault.sub==='purchase-overview','Compras: entrada por defecto no abre Resumen');
 assert(purchaseDefault.user==='u1','Compras: el contexto inicial de empleado no se aplica');

 await page.evaluate(()=>goRoot('library'));
 await page.waitForTimeout(50);
 assert(await page.evaluate(()=>state.sub)==='library-home','Biblioteca: entrada por defecto no abre Tutoriales y documentos');

 await page.evaluate(()=>{goRoot('purchases','purchase-overview');goSub('history')});
 await page.waitForTimeout(50);
 assert(await page.evaluate(()=>state.sub)==='purchase-history','Compatibilidad: history no se traduce a purchase-history');
 await page.evaluate(()=>{goRoot('library','library-home');goSub('queries')});
 await page.waitForTimeout(50);
 assert(await page.evaluate(()=>state.sub)==='questions','Compatibilidad: queries no se traduce a questions');
} finally {
 await browser.close();server.kill('SIGTERM');
}
console.log(`Navigation QA · ${issues.length} incidencias`);
if(issues.length){issues.forEach(x=>console.error('✗ '+x));process.exit(1)}
