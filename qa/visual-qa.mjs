import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const out='qa-artifacts'; fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,700));

const now=new Date(), iso=(d=new Date())=>d.toISOString();
const before=(m)=>new Date(Date.now()-m*60000).toISOString();
const mock={
 people:[
  {id:'u1',name:'Diego QA',email:'qa-admin@example.test',role:'admin',store:'Hortimatic',jobTitle:'Administrador / CO',avatarUrl:null},
  {id:'u2',name:'Davinia QA',email:'qa-manager@example.test',role:'gerente',store:'TotusCode',jobTitle:'Gerente',avatarUrl:null},
  {id:'u3',name:'Óscar QA',email:'qa-worker@example.test',role:'encargado',store:'Hortimatic',jobTitle:'Encargado',avatarUrl:null}
 ],team:[],settings:{employee_purchase_rules:{vat_pct:21,re_pct:5.2,store_discount_pct:10}},
 locations:[
  {id:'l1',name:'Hortimatic',code:'HORTI',active:true,timezone:'Europe/Madrid',address:'Azuqueca de Henares',city:'Azuqueca de Henares',province:'Guadalajara',country:'España',notes:'Tienda física',workspace_type:'store',work_mode:'onsite'},
  {id:'l2',name:'NewOldSmok',code:'NOS',active:true,timezone:'Europe/Madrid',address:'Alcalá de Henares',city:'Alcalá de Henares',province:'Madrid',country:'España',notes:'Tienda física',workspace_type:'store',work_mode:'onsite'},
  {id:'l3',name:'TotusCode',code:'TOTUSCODE',active:true,timezone:'Europe/Madrid',address:'',city:'',province:'',country:'España',notes:'Proyecto digital, remoto y visitas a clientes',workspace_type:'digital_project',work_mode:'hybrid'}
 ],
 breakTypes:[
  {code:'smoke',label:'Cigarro',category:'personal',counts_as_work:false,active:true,requires_note:false,sort_order:10},
  {code:'personal_call',label:'Llamada personal',category:'personal',counts_as_work:false,active:true,requires_note:true,sort_order:20},
  {code:'sales_rep_visit',label:'Visita comercial / proveedor',category:'work',counts_as_work:true,active:true,requires_note:false,sort_order:110},
  {code:'colleague_call',label:'Llamada con compañero',category:'work',counts_as_work:true,active:true,requires_note:true,sort_order:120}
 ],
 taskCategories:[
  {id:'c1',code:'customer_service',name:'Atención al cliente',active:true,sort_order:10},
  {id:'c2',code:'lead_prospecting',name:'Prospección / búsqueda de leads',active:true,sort_order:20},
  {id:'c3',code:'web_development',name:'Diseño y desarrollo web',active:true,sort_order:30},
  {id:'c4',code:'supplier_orders',name:'Pedidos a proveedores',active:true,sort_order:40}
 ],targets:[],schedules:[],scheduleExceptions:[],openingHours:[],openingExceptions:[],
 attendance:[{id:'a1',user_id:'u1',location_id:'l1',clock_in:before(310),clock_out:null,created_at:before(310)}],
 tasks:[
  {id:'t1',title:'Revisar pedido de proveedor',description:'Comprobar cantidades y referencias antes de recepción.',assigned_to:'u1',location_id:'l1',category_id:'c4',priority:'high',status:'doing',starts_at:before(250),due_at:iso(new Date(Date.now()+90*60000)),created_at:before(500),updated_at:before(250),estimated_minutes:90,requires_evidence:false,recurrence:{enabled:false}},
  {id:'t2',title:'Prospección de leads Guadalajara',description:'Localizar empresas con presencia digital mejorable y registrar contactos.',assigned_to:'u2',location_id:'l3',category_id:'c2',priority:'normal',status:'pending',starts_at:before(30),due_at:iso(new Date(Date.now()+240*60000)),created_at:before(500),updated_at:before(500),estimated_minutes:120,requires_evidence:false,recurrence:{enabled:false}},
  {id:'t3',title:'Actualizar web de cliente',description:'Cambiar contenidos y validar responsive.',assigned_to:'u1',location_id:'l3',category_id:'c3',priority:'normal',status:'pending',starts_at:iso(new Date(Date.now()+60*60000)),due_at:iso(new Date(Date.now()+360*60000)),created_at:before(500),updated_at:before(500),estimated_minutes:150,requires_evidence:true,recurrence:{enabled:false}},
  {id:'t4',title:'Atención incidencias tienda',description:'Resolver consultas acumuladas de clientes.',assigned_to:'u3',location_id:'l1',category_id:'c1',priority:'urgent',status:'pending',starts_at:before(20),due_at:iso(new Date(Date.now()+30*60000)),created_at:before(500),updated_at:before(500),estimated_minutes:45,requires_evidence:false,recurrence:{enabled:false}}
 ],
 taskTimes:[{id:'tt1',task_id:'t1',user_id:'u1',started_at:before(42),stopped_at:null}],taskTimeAudit:[],interruptions:[],signatures:[],breaks:[],attendanceAudit:[],overruns:[],taskAudit:[],adminAudit:[],
 purchases:[
  {id:'p1',user_id:'u3',location_id:'l1',item_name:'Resistencia Xlim',purchase_date:now.toISOString().slice(0,10),purchase_kind:'store_stock',quantity:2,employee_unit_price:3.6,total:7.2,status:'paid',source_name:'Tienda',external_reference:'TPV-4832',payment_method:'cash',notes:'',admin_notes:'',created_at:before(800)},
  {id:'p2',user_id:'u2',location_id:'l2',item_name:'Dispositivo demo',purchase_date:now.toISOString().slice(0,10),purchase_kind:'supplier_order',quantity:1,employee_unit_price:18.55,total:18.55,status:'pending',source_name:'Proveedor Demo',external_reference:'PED-992',payment_method:'card',notes:'Pedido proveedor',admin_notes:'',created_at:before(500)}
 ],purchaseAudit:[{id:'pa1',purchase_id:'p1',user_id:'u3',actor_user_id:'u1',action:'CREATED',reason:'Alta',old_data:{},new_data:{total:7.2},created_at:before(800)}],
 consultationHistory:[],priceHistory:[],userAudit:[],emailLog:[],
 library:[{id:'lib1',title:'Recepción de pedidos',category:'Procedimientos',description:'Pasos para revisar mercancía.',content:'Revisar unidades, daños y referencias.',status:'active',sort_order:10,created_at:before(900),updated_at:before(900)}],libraryAudit:[],
 leaveSettings:[],leavePeriods:[],leaveTypes:[],holidays:[],leaveRequests:[],
 notifications:[{id:'n1',target_user_id:'u1',title:'Revisar cierre de caja',message:'Comprobar antes de finalizar jornada.',notification_type:'recordatorio',status:'active',requires_ack:false,created_at:before(60)}],evidence:[],
 questions:[{id:'q1',asked_by:'u3',category:'procedimiento',question:'¿Cómo registro una devolución parcial?',answer:'Usa el procedimiento y deja la referencia del ticket.',status:'answered',answered_by:'u1',answered_at:before(300),created_at:before(450)}],
 backups:[{id:'b1',file_name:'AUTO_QA.totusbackup',file_size:542000,file_path:'x',created_at:before(600)}],maintenanceLog:[{id:'m1',action:'BACKUP_CREATED',scope:'full',detail:'Copia automática verificada',created_at:before(600)}]
};
const screens=[['tasks','mine'],['tasks','overview'],['tasks','calendar'],['tasks','tasks'],['tasks','schedule'],['tasks','stores'],['tasks','attendance'],['tasks','reports'],['purchases','purchase-overview'],['purchases','purchase-history'],['purchases','purchase-reports'],['purchases','purchase-audit'],['library','library-home'],['library','questions'],['logs','general-log'],['logs','maintenance']];
const viewports=[['desktop',1440,1000],['laptop',1024,900],['tablet',768,900],['mobile',430,900],['small',390,844]];
const issues=[],metrics=[];
const browser=await chromium.launch({headless:true});
try{
 for(const [label,width,height] of viewports){
  const ctx=await browser.newContext({viewport:{width,height},locale:'es-ES',timezoneId:'Europe/Madrid'}); const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof renderTasks==='function'&&typeof renderPurchasesModule==='function',{timeout:15000});
  await page.evaluate(mock=>{globalThis.__qaMock=mock;(0,eval)(`session={user:{id:'u1',email:'qa-admin@example.test'}};Object.assign(db,globalThis.__qaMock);document.getElementById('loginView').classList.add('hidden');document.getElementById('appView').classList.remove('hidden');paintUser();state.root='tasks';state.sub='mine';renderSubnav();renderTasks();tick();`);},mock);
  await page.waitForTimeout(180);
  for(const [root,sub] of screens){
   try{
    await page.evaluate(([r,s])=>{(0,eval)(`state.root='${r}';state.sub='${s}';document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.root==='${r}'));renderSubnav();if(state.root==='tasks')renderTasks();else if(state.root==='purchases')renderPurchasesModule();else if(state.root==='library')renderLibrary();else if(state.root==='logs')renderGeneralLog();`);},[root,sub]);
    await page.waitForTimeout(120);
    const m=await page.evaluate(()=>{const main=document.getElementById('main'),cards=[...document.querySelectorAll('#main .card')],rects=cards.map(x=>x.getBoundingClientRect()),vw=document.documentElement.clientWidth;let fontMin=99;for(const el of document.querySelectorAll('#main *')){if(!el.textContent?.trim())continue;const s=parseFloat(getComputedStyle(el).fontSize);if(s>0)fontMin=Math.min(fontMin,s)}return{bodyOverflow:document.documentElement.scrollWidth-vw,mainOverflow:main?main.scrollWidth-main.clientWidth:0,maxCardH:rects.length?Math.max(...rects.map(r=>r.height)):0,cardCount:cards.length,fontMin:fontMin===99?0:fontMin,buttons:document.querySelectorAll('#main button').length,fields:document.querySelectorAll('#main input,#main select,#main textarea').length};});
    metrics.push({viewport:label,screen:`${root}/${sub}`,...m});
    if(m.bodyOverflow>3)issues.push(`${label} ${root}/${sub}: overflow body ${m.bodyOverflow}px`);
    if(m.mainOverflow>3)issues.push(`${label} ${root}/${sub}: overflow main ${m.mainOverflow}px`);
    if(m.fontMin&&m.fontMin<9.5)issues.push(`${label} ${root}/${sub}: texto mínimo ${m.fontMin}px`);
    if(m.cardCount>1&&m.maxCardH>height*1.35)issues.push(`${label} ${root}/${sub}: tarjeta excesiva ${Math.round(m.maxCardH)}px`);
    if(label==='desktop'||label==='mobile')await page.screenshot({path:`${out}/${label}_${root}_${sub}.png`,fullPage:true});
   }catch(e){issues.push(`${label} ${root}/${sub}: ${e.message}`)}
  }
  for(const e of errors)issues.push(`${label} pageerror: ${e}`);
  await ctx.close();
 }
} finally {await browser.close();server.kill('SIGTERM')}
fs.writeFileSync(`${out}/visual-metrics.json`,JSON.stringify(metrics,null,2));fs.writeFileSync(`${out}/visual-issues.txt`,issues.join('\n'));
console.log(`Visual QA: ${metrics.length} renders · ${issues.length} incidencias`);if(issues.length){for(const x of issues.slice(0,100))console.error('✗',x);process.exit(1)}
