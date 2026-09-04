import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server=spawn('python3',['-m','http.server','4174','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,600));
const browser=await chromium.launch({headless:true});
const issues=[];
const roles=[['admin','u1'],['gerente','u2'],['encargado','u3'],['tendero','u4'],['invitado','u5']];
const people=roles.map(([role,id],i)=>({id,name:['Diego','Davinia','Óscar','Tendero QA','Invitado QA'][i],email:`${role}@example.test`,role,active:true,store:role==='gerente'?'TotusCode':'Hortimatic'}));
const empty={team:[],settings:{employee_purchase_rules:{vat_pct:21,re_pct:5.2,store_discount_pct:10}},locations:[{id:'l1',name:'Hortimatic',code:'HORTI',active:true,timezone:'Europe/Madrid',workspace_type:'store',work_mode:'onsite'},{id:'l3',name:'TotusCode',code:'TOTUSCODE',active:true,timezone:'Europe/Madrid',workspace_type:'digital_project',work_mode:'hybrid'}],breakTypes:[],taskCategories:[{id:'c1',code:'other_work',name:'Otro trabajo',active:true,sort_order:1}],targets:[],schedules:[],scheduleExceptions:[],openingHours:[],openingExceptions:[],attendance:[],tasks:[],taskTimes:[],taskTimeAudit:[],interruptions:[],signatures:[],purchases:[],purchaseAudit:[],breaks:[],attendanceAudit:[],overruns:[],taskAudit:[],adminAudit:[],consultationHistory:[],priceHistory:[],userAudit:[],emailLog:[],library:[],libraryAudit:[],leaveSettings:[],leavePeriods:[],leaveTypes:[],holidays:[],leaveRequests:[],notifications:[],evidence:[],questions:[],backups:[],maintenanceLog:[]};
try{
 for(const [role,id] of roles){
  const ctx=await browser.newContext({viewport:{width:1280,height:900},locale:'es-ES',timezoneId:'Europe/Madrid'}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4174/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof canManageTeam==='function'&&typeof renderTasks==='function',{timeout:15000});
  await page.evaluate(({people,empty,id})=>{session={user:{id,email:people.find(x=>x.id===id).email}};Object.assign(db,empty,{people});document.getElementById('loginView').classList.add('hidden');document.getElementById('appView').classList.remove('hidden');paintUser();state.root='tasks';state.sub='mine';renderSubnav();renderTasks();}, {people,empty,id});
  await page.waitForTimeout(120);
  const result=await page.evaluate(()=>({role:currentRole(),system:isSystemAdmin(),manager:canManageTeam(),supervisor:canSuperviseTeam(),usersHidden:document.querySelector('.nav button[data-root="users"]')?.classList.contains('hidden'),taskTabs:[...document.querySelectorAll('#sideSubnav button')].map(x=>x.textContent.trim())}));
  const must=(c,m)=>{if(!c)issues.push(`${role}: ${m}`)};
  must(result.role===role,`rol resuelto ${result.role}`);
  must(result.system===(role==='admin'),'capacidad system admin incorrecta');
  must(result.manager===(role==='admin'||role==='gerente'),'capacidad manager incorrecta');
  must(result.supervisor===['admin','gerente','encargado'].includes(role),'capacidad supervisor incorrecta');
  must(result.usersHidden===(role!=='admin'),'visibilidad Usuarios incorrecta');
  if(role==='admin')must(result.taskTabs.includes('Centros y proyectos'),'admin sin Centros y proyectos');else must(!result.taskTabs.includes('Centros y proyectos'),'no-admin ve Centros y proyectos');
  if(['admin','gerente','encargado'].includes(role))must(result.taskTabs.includes('Equipo'),'supervisor sin Equipo');else must(!result.taskTabs.includes('Equipo'),'operario ve Equipo');
  await page.evaluate(()=>{state.root='logs';state.sub='maintenance';renderSubnav();goSub('maintenance')});await page.waitForTimeout(50);
  const maint=await page.evaluate(()=>state.sub);must((role==='admin'&&maint==='maintenance')||(role!=='admin'&&maint==='general-log'),`guard de mantenimiento incorrecto: ${maint}`);
  await page.evaluate(()=>{state.root='tasks';state.sub='stores';renderSubnav();goSub('stores')});await page.waitForTimeout(50);
  const stores=await page.evaluate(()=>state.sub);must((role==='admin'&&stores==='stores')||(role!=='admin'&&stores==='mine'),`guard de centros incorrecto: ${stores}`);
  if(role==='gerente'||role==='encargado'){await page.evaluate(()=>{state.root='tasks';state.sub='tasks';renderSubnav();renderTasks()});await page.waitForTimeout(60);const text=await page.locator('#main').innerText();must(text.includes('Nueva tarea'),'supervisor no recibe planificación de tareas')}
  if(role==='gerente'){await page.evaluate(()=>{state.root='tasks';state.sub='schedule';renderSubnav();renderTasks()});await page.waitForTimeout(60);const text=await page.locator('#main').innerText();must(text.includes('Empleado'),'gerente sin selector de equipo en Programación');must(!text.includes('Horarios de apertura por temporada'),'gerente ve configuración global de apertura')}
  errors.forEach(e=>issues.push(`${role}: pageerror ${e}`));await ctx.close();
 }
} finally {await browser.close();server.kill('SIGTERM')}
console.log(`Role browser QA · ${roles.length} roles · ${issues.length} incidencias`);if(issues.length){issues.forEach(x=>console.error('✗ '+x));process.exit(1)}
