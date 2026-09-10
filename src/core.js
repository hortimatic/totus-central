export const ROLE_RANK = Object.freeze({ invitado: 1, tendero: 2, encargado: 3, gerente: 4, admin: 5 });
export const ROLE_LABEL = Object.freeze({ admin:'Administrador', gerente:'Gerente', encargado:'Encargado', tendero:'Tendero', invitado:'Invitado' });
export const ROUTES = Object.freeze([
  ['panel','▦','Mi panel','Resumen personal, jornada, tareas y avisos','invitado'],
  ['calendar','▣','Calendario','Tareas, festivos, vacaciones y agenda','invitado'],
  ['tasks','✓','Tareas','Trabajo pendiente, en curso e histórico','tendero'],
  ['schedule','◷','Programación','Horarios de equipo, tiendas y excepciones','invitado'],
  ['hours','◴','Fichajes','Jornadas, pausas e interrupciones','invitado'],
  ['leave','☀','Vacaciones','Saldo, solicitudes, regalos y festivos','invitado'],
  ['purchases','🛒','Compras','Compras de empleados e histórico','tendero'],
  ['pricing','€','Precios','Totus Pricing integrado','tendero'],
  ['library','▤','Tutoriales','Documentos, protocolos y consultas','invitado'],
  ['people','♙','Usuarios','Equipo, permisos y expediente','gerente'],
  ['reports','▥','Informes','Horas, tareas, pausas, compras y ausencias','gerente'],
  ['audit','⌁','Log','Actividad y trazabilidad','admin'],
  ['maintenance','⚙','Mantenimiento','Backup, restauración y operaciones críticas','admin'],
]);
export const SUBROUTES = Object.freeze({
  calendar:[['month','Mes'],['agenda','Agenda']],
  tasks:[['open','Abiertas'],['history','Histórico']],
  schedule:[['employee','Empleado'],['store','Tienda'],['exceptions','Excepciones']],
  leave:[['overview','Saldo y solicitudes'],['calendar','Calendario']],
  purchases:[['open','Compras'],['history','Histórico']],
  pricing:[['quick','Precio rápido'],['catalog','Catálogo'],['consultations','Consultas']],
  library:[['docs','Tutoriales / documentos'],['questions','Consultas internas']],
  people:[['users','Usuarios'],['documents','Documentación'],['incidents','Incidencias']],
});

export const esc = (value='') => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const attr = esc;
export const num = (value, fallback=0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const normalized = String(value ?? '').trim().replace(/\s/g,'').replace(',', '.');
  const out = Number(normalized);
  return Number.isFinite(out) ? out : fallback;
};
export const int = (value, fallback=0) => Math.trunc(num(value, fallback));
export const eur = (value) => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(num(value));
export const pct = (value) => `${num(value).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
export const localDate = (date=new Date()) => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const fmtDate = (value) => value ? new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${String(value).slice(0,10)}T12:00:00+02:00`)) : '—';
export const fmtDateTime = (value) => value ? new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
export const fmtTime = (value) => value ? new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
export const minutesBetween = (start,end=new Date()) => start ? Math.max(0,Math.round((new Date(end)-new Date(start))/60000)) : 0;
export const duration = (minutes=0) => {
  const m=Math.max(0,Math.round(num(minutes))); const h=Math.floor(m/60); const rest=m%60;
  return h ? `${h} h ${String(rest).padStart(2,'0')} min` : `${rest} min`;
};
export const secondsClock = (start) => {
  if(!start) return '00:00:00';
  const s=Math.max(0,Math.floor((Date.now()-new Date(start).getTime())/1000));
  return [Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(v=>String(v).padStart(2,'0')).join(':');
};
export const can = (role, minimum) => (ROLE_RANK[role]||0) >= (ROLE_RANK[minimum]||99);
export const roleLabel = role => ROLE_LABEL[role] || role || 'Sin rol';
export const routeMeta = key => ROUTES.find(r=>r[0]===key) || ROUTES[0];
export const safeName = name => String(name||'archivo').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(0,120);
export const uuid = () => crypto.randomUUID();
export const todayStart = () => `${localDate()}T00:00:00+02:00`;
export const nowIso = () => new Date().toISOString();
export const monthKey = (date=new Date()) => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit'}).format(date);
export const monthName = (ym) => {
  const [y,m]=String(ym).split('-').map(Number); return new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));
};
export const monthDays = (ym) => { const [y,m]=String(ym).split('-').map(Number); return new Date(y,m,0).getDate(); };
export const isoDay = (ym,day) => `${ym}-${String(day).padStart(2,'0')}`;
export const naturalDays = (from,to) => {
  if(!from||!to) return 0; const a=new Date(`${from}T12:00:00Z`), b=new Date(`${to}T12:00:00Z`); return Math.max(0,Math.round((b-a)/86400000)+1);
};
export const purchaseUnit = ({mode,pvp,net_cost,direct_costs}) => mode==='store' ? num(pvp)*0.9 : num(net_cost)*1.262+num(direct_costs);
export const pricingRealCost = ({net_cost=0,provider_discount=0,shipping=0,apply_special_tax=false,special_tax=0}) => {
  const discounted = num(net_cost)*(1-num(provider_discount)/100);
  const taxable = discounted + (apply_special_tax ? num(special_tax) : 0);
  return taxable*1.262 + num(shipping);
};
export const pricingMetrics = ({cost=0,pvp=0,competitors=[]}, settings={}) => {
  const real=num(cost), sale=num(pvp), margin=sale-real, marginPct=sale?margin/sale*100:0, markup=real?margin/real*100:0;
  const avail=(competitors||[]).map(x=>num(x.price)*(1-num(x.discount)/100)+num(x.shipping)).filter(v=>v>0);
  const cmin=avail.length?Math.min(...avail):0, cmax=avail.length?Math.max(...avail):0, cavg=avail.length?avail.reduce((a,b)=>a+b,0)/avail.length:0;
  const critical=num(settings.critical,15), tight=num(settings.tight,25), healthy=num(settings.healthy,35);
  const marginState=marginPct<0?'PÉRDIDA':marginPct<critical?'CRÍTICO':marginPct<tight?'AJUSTADO':marginPct<healthy?'SANO':'EXCELENTE';
  const tolerance=num(settings.market_tolerance,3);
  let market='SIN DATOS'; if(cavg){ const d=(sale-cavg)/cavg*100; market=d>tolerance?'POR ENCIMA':d<-tolerance?'POR DEBAJO':'EN MERCADO'; }
  return {real,sale,margin,marginPct,markup,cmin,cmax,cavg,count:avail.length,marginState,market};
};
export const discountRows = (pvp,cost,settings={}) => {
  const minPromo=num(settings.min_promo,18), tight=num(settings.tight,25);
  return Array.from({length:11},(_,i)=>i*5).map(discount=>{
    const price=num(pvp)*(1-discount/100), gain=price-num(cost), marginPct=price?gain/price*100:0;
    const status=marginPct<0?'PÉRDIDA':marginPct<minPromo?'NO RECOMENDADO':marginPct<tight?'AJUSTADO':'SANO';
    return {discount,price,gain,marginPct,status};
  });
};
export const badgeClass = value => {
  const v=String(value||'').toLowerCase();
  if(/complet|aprob|sano|excel|activo|resuelt|entregado|accepted/.test(v)) return 'success';
  if(/urg|pérd|cancel|rechaz|crít|inactivo/.test(v)) return 'danger';
  if(/ajust|pend|aviso|warning|ordenado|curso/.test(v)) return 'warning';
  if(/info|abierto|open|mercado/.test(v)) return 'info';
  return 'neutral';
};
export const humanStatus = value => ({pending:'Pendiente',in_progress:'En curso',completed:'Completada',cancelled:'Cancelada',approved:'Aprobada',delivered:'Entregada',rejected:'Rechazada',active:'Activo',resolved:'Resuelta',open:'Abierta',closed:'Cerrada',accepted:'Aceptado',inactive:'Inactivo',ordered:'Pedido'}[value] || value || '—');
export const priorityLabel = value => ({low:'Baja',normal:'Normal',high:'Alta',urgent:'Urgente'}[value] || value || 'Normal');
export const empty = (title,text='') => `<div class="empty"><strong>${esc(title)}</strong>${text?`<span>${esc(text)}</span>`:''}</div>`;
export const badge = (text,cls=badgeClass(text)) => `<span class="badge ${cls}">${esc(text)}</span>`;
export const option = (value,label,current) => `<option value="${attr(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;
export const debounce = (fn,delay=250) => { let t; return (...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),delay)}; };
