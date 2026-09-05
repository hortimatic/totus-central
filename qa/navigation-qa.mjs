import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('qa-artifacts',{recursive:true});
const server=spawn('python3',['-m','http.server','4178','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,650));
const browser=await chromium.launch({headless:true});
const issues=[];
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>issues.push('pageerror: '+String(e)));

const now=new Date().toISOString();
const empty={
 team:[],settings:{employee_purchase_rules:{vat_pct:21,re_pct:5.2,store_discount_pct:10}},
 people:[{id:'u1',name:'Diego QA',email:'qa@example.test',role:'admin',active:true,jobTitle:'Administrador / CO'}],
 locations:[{id:'l1',name:'Hortimatic',active:true,timezone:'Europe/Madrid'}],memberLocations:[{user_id:'u1',location_id:'l1',active:true}],
 schedules:[],scheduleExceptions:[],openingHours:[],openingExceptions:[],breakTypes:[],taskCategories:[],targets:[],attendance:[],tasks:[],taskTimes:[],taskTimeAudit:[],interruptions:[],signatures:[],
 purchases:[{id:'p1',user_id:'u1',location_id:'l1',item_name:'Compra QA',purchase_date:now.slice(0,10),purchase_kind:'store_stock',quantity:1,employee_unit_price:9,total:9,status:'pending',external_reference:'QA-1',created_at:now}],purchaseAudit:[],
 breaks:[],attendanceAudit:[],overruns:[],taskAudit:[],adminAudit:[],consultationHistory:[],priceHistory:[],userAudit:[],emailLog:[],
 library:[{id:'lib1',title:'Protocolo QA',category:'protocolo',description:'Documento de prueba',content_text:'Contenido QA',active:true,created_at:now}],libraryAudit:[],
 leaveSettings:[],leavePeriods:[],leaveTypes:[],holidays:[],leaveRequests:[],notifications:[],evidence:[],
 questions:[{id:'q1',asked_by:'u1',category:'procedimiento',question:'Consulta QA',answer:'Respuesta QA',status:'answered',answered_by:'u1',answered_at:now,created_at:now}],
 backups:[],maintenanceLog:[],incidents:[],incidentAudit:[],employeeDocuments:[],employeeDocumentAudit:[]
};

const assert=(cond,msg)=>{if(!cond)issues.push(msg)};
try{
 await page.goto('http://127.0.0.1:4178/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof goRoot==='function'&&typeof renderCurrentRoot==='function'&&typeof renderLibraryModule==='function',{timeout:15000});
 await page.evaluate(mock=>{session={user:{id:'u1',email:'qa@example.test'}};Object.assign(db,mock);document.getElementById('loginView').classList.add('hidden');document.getElementById('appView').classList.remove('hidden');paintUser();},empty);
 await page.waitForTimeout(140);

 async function route(root,sub,needle,title){
   await page.evaluate(([r,s])=>goRoot(r,s),[root,sub]);
   await page.waitForTimeout(100);
   const got=await page.evaluate(()=>({root:state.root,sub:state.sub,text:document.getElementById('main')?.innerText||'',side:[...document.querySelectorAll('#sideSubnav button')].map(x=>({text:x.textContent.trim(),active:x.classList.contains('active')})),mobile:document.querySelector('.subnav-mobile')?.value||'',title:document.getElementById('shellTitle')?.textContent||'',globalEmployee:!!document.getElementById('employeeContextSelect')}));
   assert(got.root===root,`${root}/${sub}: root incorrecto ${got.root}`);
   assert(got.sub===sub,`${root}/${sub}: sub incorrecto ${got.sub}`);
   assert(got.text.includes(needle),`${root}/${sub}: no renderiza ${needle}`);
   assert(got.mobile===sub,`${root}/${sub}: selector móvil desincronizado ${got.mobile}`);
   assert(got.side.some(x=>x.active),`${root}/${sub}: sin subsección activa en lateral`);
   assert(got.title===title,`${root}/${sub}: título superior incorrecto ${got.title}`);
   assert(got.globalEmployee,`${root}/${sub}: falta selector global de empleado para admin`);
   await page.screenshot({path:`qa-artifacts/live_${root}_${sub}.png`,fullPage:true});
 }

 await route('purchases','purchase-overview','Compras','Compras');
 await route('purchases','purchase-history','Movimientos','Compras');
 await route('purchases','purchase-reports','Más filtros','Compras');
 await route('purchases','purchase-audit','Movimientos auditados','Compras');
 await route('library','library-home','Tutoriales y consultas','Ayuda y tutoriales');
 await route('library','questions','Preguntas y respuestas guardadas','Ayuda y tutoriales');
 await route('logs','general-log','Histórico de movimientos','Histórico');
 await route('logs','maintenance','Backup','Histórico');
 await route('tasks','attendance','Control horario','Fichajes');
 await route('tasks','reports','Control de trabajo','Informes');
 await route('tasks','leave','días libres','Días libres');
 await route('tasks','incidents','Incidencias','Incidencias');
 await route('tasks','documents','Documentación','Documentación');

 await page.evaluate(()=>goRoot('users','users-home'));await page.waitForTimeout(120);
 const usersRoute=await page.evaluate(()=>({root:state.root,sub:state.sub,title:document.getElementById('shellTitle')?.textContent||'',text:document.getElementById('main')?.innerText||'',mainHidden:document.getElementById('main')?.classList.contains('hidden'),contextVisible:!!document.querySelector('.shell-top-actions .employee-context-select-wrap:not(.hidden)')}));
 assert(usersRoute.root==='users'&&usersRoute.sub==='users-home','Usuarios: ruta incorrecta');
 assert(usersRoute.title==='Usuarios','Usuarios: título superior incorrecto');
 assert(!usersRoute.mainHidden,'Usuarios: vista nativa queda oculta');
 assert(usersRoute.text.includes('Usuarios'),'Usuarios: ficha nativa no renderiza');
 assert(!usersRoute.contextVisible,'Usuarios: selector global de empleado no debe ocupar la cabecera');
 await page.screenshot({path:'qa-artifacts/live_users_users-home.png',fullPage:true});

 await page.evaluate(()=>goRoot('pricing','home'));await page.waitForTimeout(180);
 const pricing=await page.evaluate(()=>({root:state.root,sub:state.sub,title:document.getElementById('shellTitle')?.textContent||'',frameHidden:document.getElementById('iframeShell')?.classList.contains('hidden'),src:document.getElementById('pricingFrame')?.getAttribute('src')||'',contextVisible:!!document.querySelector('.shell-top-actions .employee-context-select-wrap:not(.hidden)')}));
 assert(pricing.root==='pricing'&&pricing.sub==='home','Pricing: ruta incorrecta');
 assert(pricing.title==='Precios','Pricing: título superior incorrecto');
 assert(!pricing.frameHidden,'Pricing: iframe no visible');
 assert(pricing.src!=='about:blank','Pricing: iframe no iniciado');
 assert(!pricing.contextVisible,'Pricing: selector global de empleado no debe ocupar la cabecera');

 await page.evaluate(()=>goRoot('purchases'));
 await page.waitForTimeout(60);
 const purchaseDefault=await page.evaluate(()=>({sub:state.sub,user:state.purchaseUserId}));
 assert(purchaseDefault.sub==='purchase-overview','Compras: entrada por defecto no abre Resumen');
 assert(purchaseDefault.user==='u1','Compras: el contexto inicial de empleado no se aplica');

 await page.evaluate(()=>goRoot('library'));
 await page.waitForTimeout(60);
 const libraryDefault=await page.evaluate(()=>({sub:state.sub,contextVisible:!!document.querySelector('.shell-top-actions .employee-context-select-wrap:not(.hidden)')}));
 assert(libraryDefault.sub==='library-home','Biblioteca: entrada por defecto no abre Tutoriales y documentos');
 assert(!libraryDefault.contextVisible,'Biblioteca: selector global de empleado innecesario');

 await page.evaluate(()=>{goRoot('purchases','purchase-overview');goSub('history')});
 await page.waitForTimeout(60);
 assert(await page.evaluate(()=>state.sub)==='purchase-history','Compatibilidad: history no se traduce a purchase-history');
 await page.evaluate(()=>{goRoot('library','library-home');goSub('queries')});
 await page.waitForTimeout(60);
 assert(await page.evaluate(()=>state.sub)==='questions','Compatibilidad: queries no se traduce a questions');

 await page.evaluate(()=>goRoot('purchases','purchase-overview'));await page.waitForTimeout(60);
 await page.getByRole('button',{name:'Historial',exact:true}).click();await page.waitForTimeout(70);
 assert(await page.evaluate(()=>state.sub)==='purchase-history','Click lateral: Historial de compras no navega');

 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>goRoot('library','library-home'));await page.waitForTimeout(70);
 await page.locator('.subnav-mobile').selectOption('questions');await page.waitForTimeout(70);
 assert(await page.evaluate(()=>state.sub)==='questions','Selector móvil: Consultas internas no navega');
 await page.screenshot({path:'qa-artifacts/live_mobile_library_questions.png',fullPage:true});
 await page.evaluate(()=>goRoot('purchases','purchase-history'));await page.waitForTimeout(70);
 assert(await page.locator('.purchase-mobile-list').isVisible(),'Compras móvil: historial no usa tarjetas responsive');
 await page.screenshot({path:'qa-artifacts/live_mobile_purchases_history.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});

 for(const [root,sub,selector] of [
   ['tasks','attendance','.section-attendance>.ref-inline-select'],
   ['tasks','incidents','.ref-incidents>.card:first-of-type .form-grid'],
   ['tasks','documents','.ref-documents>.card:first-of-type .form-grid'],
   ['purchases','purchase-history','#main>.head'],
   ['purchases','purchase-audit','#main>.head']
 ]){
   await page.evaluate(([r,s])=>goRoot(r,s),[root,sub]);await page.waitForTimeout(80);
   const duplicate=await page.evaluate(sel=>{
     if(sel.includes('form-grid')){const box=document.querySelector(sel);return box?[...box.children].filter(x=>/^Empleado\b/i.test((x.querySelector('label')?.textContent||'').trim())&&getComputedStyle(x).display!=='none').length:0}
     if(sel==='#main>.head'){const box=document.querySelector(sel);return box?[...box.children].filter(x=>/^Empleado\b/i.test((x.querySelector?.('label')?.textContent||'').trim())&&getComputedStyle(x).display!=='none').length:0}
     const el=document.querySelector(sel);return el&&getComputedStyle(el).display!=='none'?1:0;
   },selector);
   assert(duplicate===0,`${root}/${sub}: selector local de empleado duplicado`);
 }

 await page.evaluate(()=>goRoot('purchases','purchase-reports'));await page.waitForTimeout(80);
 const reportScope=await page.evaluate(()=>({user:document.getElementById('buyRepUser')?.value||'',visible:!!document.querySelector('#buyRepUser:not(.sr-only)')}));
 assert(reportScope.user==='u1','Informes compras: no hereda empleado global');
 assert(!reportScope.visible,'Informes compras: selector de empleado duplicado visible');

 await page.evaluate(()=>goRoot('purchases','purchase-overview'));
 await page.waitForTimeout(60);
 const purchaseScope=await page.locator('#main').innerText();
 assert(purchaseScope.includes('Compra QA'),'Compras: el ámbito del empleado no muestra sus datos');

 await page.evaluate(()=>{db.people[0].role='tendero';paintUser();goRoot('purchases','purchase-overview')});await page.waitForTimeout(80);
 const workerPurchaseTabs=await page.$$eval('#sideSubnav button',xs=>xs.map(x=>x.textContent.trim()));
 assert(!workerPurchaseTabs.includes('Auditoría'),'Tendero: Auditoría de compras visible');
 await page.evaluate(()=>goSub('purchase-audit'));await page.waitForTimeout(60);
 assert(await page.evaluate(()=>state.sub)==='purchase-history','Tendero: puede forzar ruta de Auditoría de compras');
 await page.evaluate(()=>goRoot('users','users-home'));await page.waitForTimeout(60);
 const workerUsers=await page.evaluate(()=>({root:state.root,sub:state.sub,usersHidden:document.querySelector('.nav [data-root="users"]')?.classList.contains('hidden')}));
 assert(workerUsers.root==='tasks'&&workerUsers.sub==='mine','Tendero: puede entrar en Usuarios');
 assert(workerUsers.usersHidden,'Tendero: botón Usuarios visible');
} finally {
 await browser.close();server.kill('SIGTERM');
}
console.log(`Navigation QA · ${issues.length} incidencias`);
if(issues.length){issues.forEach(x=>console.error('✗ '+x));process.exit(1)}
