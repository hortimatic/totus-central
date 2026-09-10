import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';
import { nowIso, safeName, uuid, pricingRealCost, purchaseUnit } from './core.js';

const cfg = window.TOTUS_CONFIG || {};
if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error('Falta runtime-config.js');

export const supabase = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
  auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true },
  global: { headers: { 'x-application-name':'totus-central' } },
});

const q = async (promise, fallback=[]) => {
  const {data,error}=await promise;
  if(error) throw error;
  return data ?? fallback;
};

export const Auth = {
  async session(){ return (await supabase.auth.getSession()).data.session; },
  async signIn(email,password){
    const {data,error}=await supabase.auth.signInWithPassword({email:String(email).trim().toLowerCase(),password});
    if(error) throw error; return data.session;
  },
  async signOut(){ const {error}=await supabase.auth.signOut(); if(error) throw error; },
  async reset(email){
    const target=`${location.origin}${location.pathname}`;
    const {error}=await supabase.auth.resetPasswordForEmail(String(email).trim().toLowerCase(),{redirectTo:target}); if(error) throw error;
  },
  async authorized(email){ const {data,error}=await supabase.rpc('is_team_email_authorized',{p_email:String(email).trim().toLowerCase()}); if(error) throw error; return !!data; },
  async activate(email,password){
    const e=String(email).trim().toLowerCase();
    if(!(await this.authorized(e))) throw new Error('Este email no está autorizado en Totus Central.');
    if(String(password||'').length<8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    const {data,error}=await supabase.auth.signUp({email:e,password}); if(error) throw error;
    if(data.session){ await supabase.rpc('bind_my_team_account'); }
    return data;
  },
  onChange(cb){ return supabase.auth.onAuthStateChange((_event,session)=>cb(session)); },
};

export async function currentContext(session){
  if(!session?.user) return null;
  let members=await q(supabase.from('team_members').select('*').eq('auth_user_id',session.user.id).limit(1));
  if(!members.length){
    const {error}=await supabase.rpc('bind_my_team_account');
    if(error && !/not found|no member|unauthorized/i.test(error.message||'')) throw error;
    members=await q(supabase.from('team_members').select('*').eq('auth_user_id',session.user.id).limit(1));
  }
  const member=members[0];
  if(!member || !member.active) throw new Error('La cuenta no está activa en Totus Central.');
  const [locations,links]=await Promise.all([
    q(supabase.from('team_locations').select('*').eq('active',true).order('name')),
    q(supabase.from('member_locations').select('*').eq('member_id',member.id)),
  ]);
  const allowed=new Set(links.map(x=>x.location_id));
  return {session,member,locations:locations.filter(x=>allowed.has(x.id)),allLocations:locations};
}

const TABLE_LOADERS = {
  members:()=>supabase.from('team_members').select('*').order('name'),
  memberLocations:()=>supabase.from('member_locations').select('*'),
  attendance:()=>supabase.from('attendance_sessions').select('*').order('clock_in_at',{ascending:false}).limit(400),
  breaks:()=>supabase.from('personal_breaks').select('*').order('start_at',{ascending:false}).limit(400),
  interruptions:()=>supabase.from('work_interruptions').select('*').order('start_at',{ascending:false}).limit(400),
  tasks:()=>supabase.from('team_tasks').select('*').order('created_at',{ascending:false}).limit(500),
  evidence:()=>supabase.from('task_evidence').select('*').order('created_at',{ascending:false}).limit(500),
  taskTimers:()=>supabase.from('task_timers').select('*').order('start_at',{ascending:false}).limit(500),
  employeeSchedule:()=>supabase.from('employee_schedule').select('*').order('weekday'),
  openingHours:()=>supabase.from('location_opening_hours').select('*').order('weekday'),
  scheduleExceptions:()=>supabase.from('schedule_exceptions').select('*').order('exception_date',{ascending:true}),
  openingExceptions:()=>supabase.from('opening_exceptions').select('*').order('exception_date',{ascending:true}),
  leaveSettings:()=>supabase.from('leave_settings').select('*'),
  leaveRequests:()=>supabase.from('leave_requests').select('*').order('created_at',{ascending:false}).limit(400),
  leavePeriods:()=>supabase.from('leave_periods').select('*').order('from_date',{ascending:false}).limit(400),
  holidays:()=>supabase.from('team_holidays').select('*').order('holiday_date',{ascending:true}),
  purchases:()=>supabase.from('employee_purchases').select('*').order('created_at',{ascending:false}).limit(500),
  notifications:()=>supabase.from('team_notifications').select('*').order('created_at',{ascending:false}).limit(300),
  library:()=>supabase.from('internal_library').select('*').order('created_at',{ascending:false}).limit(300),
  questions:()=>supabase.from('internal_questions').select('*').order('created_at',{ascending:false}).limit(300),
  documents:()=>supabase.from('employee_documents').select('*').order('created_at',{ascending:false}).limit(300),
  incidents:()=>supabase.from('employee_incidents').select('*').order('created_at',{ascending:false}).limit(300),
  pricingSettings:()=>supabase.from('pricing_settings').select('*').limit(1),
  brands:()=>supabase.from('pricing_brands').select('*').order('name'),
  families:()=>supabase.from('pricing_families').select('*').order('name'),
  products:()=>supabase.from('pricing_products').select('*').order('updated_at',{ascending:false}).limit(1000),
  variants:()=>supabase.from('pricing_variants').select('*').order('created_at'),
  providers:()=>supabase.from('pricing_providers').select('*').order('name'),
  providerPrices:()=>supabase.from('pricing_provider_prices').select('*').order('created_at',{ascending:false}).limit(1500),
  competitors:()=>supabase.from('pricing_competitor_prices').select('*').order('created_at',{ascending:false}).limit(1500),
  consultations:()=>supabase.from('pricing_consultations').select('*').order('updated_at',{ascending:false}).limit(1000),
  pricingHistory:()=>supabase.from('pricing_history').select('*').order('created_at',{ascending:false}).limit(1500),
  audit:()=>supabase.from('audit_log').select('*').order('created_at',{ascending:false}).limit(1000),
  backups:()=>supabase.from('backup_archives').select('*').order('created_at',{ascending:false}).limit(100),
};

export async function loadSnapshot(){
  const entries=Object.entries(TABLE_LOADERS);
  const settled=await Promise.all(entries.map(async([key,loader])=>{
    try { return [key,await q(loader())]; }
    catch(err){
      if(/permission|row-level|policy|not allowed/i.test(err.message||'')) return [key,[]];
      throw err;
    }
  }));
  return Object.fromEntries(settled);
}

export async function audit(action,detail='',entity_type=null,entity_id=null,member_id=null){
  const payload={action,detail,entity_type,entity_id}; if(member_id) payload.member_id=member_id;
  const {error}=await supabase.from('audit_log').insert(payload); if(error) throw error;
}

export const Work = {
  async clockIn(memberId,locationId){
    const open=await q(supabase.from('attendance_sessions').select('id').eq('member_id',memberId).is('clock_out_at',null).limit(1));
    if(open.length) throw new Error('Ya existe una jornada abierta.');
    const row=await q(supabase.from('attendance_sessions').insert({member_id:memberId,location_id:locationId}).select().single(),null);
    await audit('clock_in','Inicio de jornada','attendance',row.id,memberId); return row;
  },
  async clockOut(memberId){
    const now=nowIso();
    await Promise.all([
      supabase.from('personal_breaks').update({end_at:now}).eq('member_id',memberId).is('end_at',null),
      supabase.from('work_interruptions').update({end_at:now}).eq('member_id',memberId).is('end_at',null),
      supabase.from('task_timers').update({end_at:now}).eq('member_id',memberId).is('end_at',null),
    ]);
    const {data,error}=await supabase.rpc('clock_out_current'); if(error) throw error;
    await audit('clock_out','Fin de jornada','attendance',null,memberId); return data;
  },
  async startBreak(memberId,attendanceId,reason='other',expected=10){
    const existing=await q(supabase.from('personal_breaks').select('id').eq('member_id',memberId).is('end_at',null).limit(1)); if(existing.length) throw new Error('Ya hay una pausa personal activa.');
    const row=await q(supabase.from('personal_breaks').insert({member_id:memberId,attendance_id:attendanceId,reason,expected_minutes:expected}).select().single(),null);
    await audit('break_start',reason,'personal_break',row.id,memberId); return row;
  },
  async stopBreak(memberId){ const now=nowIso(); const rows=await q(supabase.from('personal_breaks').update({end_at:now}).eq('member_id',memberId).is('end_at',null).select()); if(rows.length) await audit('break_stop','Pausa finalizada','personal_break',rows[0].id,memberId); return rows[0]; },
  async startInterruption(memberId,attendanceId,reason){
    const existing=await q(supabase.from('work_interruptions').select('id').eq('member_id',memberId).is('end_at',null).limit(1)); if(existing.length) throw new Error('Ya hay una interrupción laboral activa.');
    const row=await q(supabase.from('work_interruptions').insert({member_id:memberId,attendance_id:attendanceId,reason:String(reason||'Interrupción laboral')}).select().single(),null);
    await audit('work_interruption_start',reason,'work_interruption',row.id,memberId); return row;
  },
  async stopInterruption(memberId){ const now=nowIso(); const rows=await q(supabase.from('work_interruptions').update({end_at:now}).eq('member_id',memberId).is('end_at',null).select()); if(rows.length) await audit('work_interruption_stop','Interrupción finalizada','work_interruption',rows[0].id,memberId); return rows[0]; },
};

export const Tasks = {
  async create(actorId,payload){ const row=await q(supabase.from('team_tasks').insert({...payload,created_by:actorId}).select().single(),null); await audit('task_create',payload.title,'task',row.id,actorId); return row; },
  async update(actorId,id,payload){ const row=await q(supabase.from('team_tasks').update(payload).eq('id',id).select().single(),null); await audit('task_update',row.title,'task',id,actorId); return row; },
  async start(memberId,id){ const row=await q(supabase.from('task_timers').insert({member_id:memberId,task_id:id}).select().single(),null); await supabase.from('team_tasks').update({status:'in_progress'}).eq('id',id); await audit('task_start','Tarea iniciada','task',id,memberId); return row; },
  async stop(memberId,id){ const now=nowIso(); const rows=await q(supabase.from('task_timers').update({end_at:now}).eq('member_id',memberId).eq('task_id',id).is('end_at',null).select()); if(rows.length) await audit('task_stop','Temporizador detenido','task',id,memberId); return rows[0]; },
  async complete(memberId,id){ await this.stop(memberId,id); const row=await q(supabase.from('team_tasks').update({status:'completed',completed_at:nowIso()}).eq('id',id).select().single(),null); await audit('task_complete',row.title,'task',id,memberId); return row; },
  async evidence(memberId,id,file,caption=''){
    if(!file) throw new Error('Selecciona una foto o archivo.'); const path=`${id}/${uuid()}-${safeName(file.name)}`;
    const {error:up}=await supabase.storage.from('task-evidence').upload(path,file,{upsert:false,contentType:file.type||undefined}); if(up) throw up;
    try{ const row=await q(supabase.from('task_evidence').insert({task_id:id,storage_path:path,file_name:file.name,mime_type:file.type||null,caption,created_by:memberId}).select().single(),null); await audit('task_evidence',file.name,'task',id,memberId); return row; }
    catch(err){ await supabase.storage.from('task-evidence').remove([path]); throw err; }
  },
};

export const Schedule = {
  async employeePlan(payload){ const {data,error}=await supabase.rpc('replace_employee_schedule_plan',{p_member_id:payload.member_id,p_valid_from:payload.valid_from,p_location_id:payload.location_id,p_rows:payload.rows}); if(error) throw error; return data; },
  async storePlan(payload){ const {data,error}=await supabase.rpc('replace_location_opening_period',{p_location_id:payload.location_id,p_valid_from:payload.valid_from,p_valid_to:payload.valid_to||null,p_season_name:payload.season_name||null,p_rows:payload.rows}); if(error) throw error; return data; },
  async employeeException(payload,id=null){ const query=id?supabase.from('schedule_exceptions').update(payload).eq('id',id):supabase.from('schedule_exceptions').insert(payload); const row=await q(query.select().single(),null); await audit(id?'schedule_exception_update':'schedule_exception_create',payload.reason||'', 'schedule_exception',row.id,payload.created_by); return row; },
  async storeException(payload,id=null){ const query=id?supabase.from('opening_exceptions').update(payload).eq('id',id):supabase.from('opening_exceptions').insert(payload); const row=await q(query.select().single(),null); await audit(id?'opening_exception_update':'opening_exception_create',payload.reason||'', 'opening_exception',row.id,payload.created_by); return row; },
  async deleteException(table,id){ const {error}=await supabase.from(table).delete().eq('id',id); if(error) throw error; await audit('schedule_exception_delete','Excepción eliminada',table,id); },
};

export const Leave = {
  async request(memberId,payload){ const row=await q(supabase.from('leave_requests').insert({...payload,member_id:memberId,created_by:memberId}).select().single(),null); await audit('leave_request',payload.leave_type,'leave_request',row.id,memberId); return row; },
  async resolve(requestId,status){ const {data,error}=await supabase.rpc('resolve_leave_request',{p_request_id:requestId,p_status:status}); if(error) throw error; return data; },
  async gift(memberId,date,reason){ const {data,error}=await supabase.rpc('grant_gift_day',{p_member_id:memberId,p_date:date,p_reason:reason||'Día regalado'}); if(error) throw error; return data; },
  async holiday(payload,id=null){ const query=id?supabase.from('team_holidays').update(payload).eq('id',id):supabase.from('team_holidays').insert(payload); const row=await q(query.select().single(),null); await audit(id?'holiday_update':'holiday_create',payload.name,'holiday',row.id,payload.created_by); return row; },
  async settings(memberId,year,accrual,maxAnnual){ const {data,error}=await supabase.from('leave_settings').upsert({member_id:memberId,year,accrual_per_month:accrual,max_annual:maxAnnual}).select().single(); if(error) throw error; return data; },
};

export const Purchases = {
  async create(actorId,payload){
    const unit=purchaseUnit(payload); const row=await q(supabase.from('employee_purchases').insert({...payload,unit_price:unit,total:unit*Number(payload.quantity||1),created_by:actorId}).select().single(),null);
    await audit('purchase_create',payload.product_name,'purchase',row.id,actorId); return row;
  },
  async status(actorId,id,status){ const row=await q(supabase.from('employee_purchases').update({status,resolved_at:['delivered','cancelled'].includes(status)?nowIso():null}).eq('id',id).select().single(),null); await audit('purchase_status',status,'purchase',id,actorId); return row; },
};

export const Notices = {
  async create(actorId,payload){ const row=await q(supabase.from('team_notifications').insert({...payload,created_by:actorId}).select().single(),null); await audit('notification_create',payload.title,'notification',row.id,actorId); return row; },
  async mark(id,ack=false){ const {data,error}=await supabase.rpc('mark_team_notification',{p_id:id,p_acknowledge:!!ack}); if(error) throw error; return data; },
  async cancel(id,reason='Cancelado por administración'){ const {data,error}=await supabase.rpc('cancel_team_notification',{p_id:id,p_reason:reason}); if(error) throw error; return data; },
};

async function uploadAndRecord(bucket,table,actorId,record,file,pathPrefix){
  if(!file) throw new Error('Selecciona un archivo.');
  const path=`${pathPrefix}/${uuid()}-${safeName(file.name)}`;
  const {error:up}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined}); if(up) throw up;
  try{
    const row=await q(supabase.from(table).insert({...record,storage_path:path,file_name:file.name,mime_type:file.type||null,created_by:actorId}).select().single(),null);
    await audit(`${table}_upload`,file.name,table,row.id,actorId); return row;
  }catch(err){ await supabase.storage.from(bucket).remove([path]); throw err; }
}
export const Docs = {
  library(actorId,record,file){ return uploadAndRecord('internal-library','internal_library',actorId,record,file,'library'); },
  employee(actorId,memberId,record,file){ return uploadAndRecord('employee-documents','employee_documents',actorId,{...record,member_id:memberId},file,memberId); },
  async signed(bucket,path,name){ const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,60,{download:name||true}); if(error) throw error; return data.signedUrl; },
  async remove(bucket,table,id,path){ const {error}=await supabase.from(table).delete().eq('id',id); if(error) throw error; if(path) await supabase.storage.from(bucket).remove([path]); await audit(`${table}_delete`,'Documento eliminado',table,id); },
};

export const Questions = {
  async ask(memberId,text){ const row=await q(supabase.from('internal_questions').insert({member_id:memberId,question:String(text).trim()}).select().single(),null); await audit('question_create',String(text).slice(0,120),'question',row.id,memberId); return row; },
  async answer(actorId,id,answer){ const row=await q(supabase.from('internal_questions').update({answer:String(answer).trim(),status:'resolved',answered_at:nowIso(),answered_by:actorId}).eq('id',id).select().single(),null); await audit('question_answer','Consulta respondida','question',id,actorId); return row; },
};

export const Incidents = {
  async create(actorId,payload){ const row=await q(supabase.from('employee_incidents').insert({...payload,created_by:actorId}).select().single(),null); await audit('incident_create',payload.title,'incident',row.id,actorId); return row; },
  async resolve(actorId,id,resolved=true){ const row=await q(supabase.from('employee_incidents').update({status:resolved?'resolved':'open',resolved_by:resolved?actorId:null,resolved_at:resolved?nowIso():null}).eq('id',id).select().single(),null); await audit(resolved?'incident_resolve':'incident_reopen',row.title,'incident',id,actorId); return row; },
};

export const Pricing = {
  async consultation(actorId,payload,id=null){ const body={...payload,created_by:actorId,updated_at:nowIso()}; if(id) delete body.created_by; const query=id?supabase.from('pricing_consultations').update(body).eq('id',id):supabase.from('pricing_consultations').insert(body); const row=await q(query.select().single(),null); await audit(id?'pricing_consultation_update':'pricing_consultation_create',payload.name,'pricing_consultation',row.id,actorId); return row; },
  async reopen(actorId,id){ const row=await q(supabase.from('pricing_consultations').update({status:'open',last_reopened_at:nowIso(),updated_at:nowIso()}).eq('id',id).select().single(),null); await audit('pricing_consultation_reopen',row.name,'pricing_consultation',id,actorId); return row; },
  async convertConsultation(id,payload){ const {data,error}=await supabase.rpc('convert_pricing_consultation',{p_consultation_id:id,p_sku:payload.sku,p_brand_id:payload.brand_id||null,p_family_id:payload.family_id||null,p_provider_id:payload.provider_id||null}); if(error) throw error; return data; },
  async linkConsultation(actorId,id,productId){ const row=await q(supabase.from('pricing_consultations').update({linked_product_id:productId,status:'converted',updated_at:nowIso()}).eq('id',id).select().single(),null); await audit('pricing_consultation_link',row.name,'pricing_consultation',id,actorId); return row; },
  async brand(name,id=null){ const query=id?supabase.from('pricing_brands').update({name}).eq('id',id):supabase.from('pricing_brands').insert({name}); return q(query.select().single(),null); },
  async family(brandId,name,id=null){ const query=id?supabase.from('pricing_families').update({brand_id:brandId,name}).eq('id',id):supabase.from('pricing_families').insert({brand_id:brandId,name}); return q(query.select().single(),null); },
  async provider(name,id=null){ const query=id?supabase.from('pricing_providers').update({name}).eq('id',id):supabase.from('pricing_providers').insert({name}); return q(query.select().single(),null); },
  async product(actorId,payload,id=null){ const body={...payload,updated_at:nowIso()}; if(!id) body.created_by=actorId; const query=id?supabase.from('pricing_products').update(body).eq('id',id):supabase.from('pricing_products').insert(body); const row=await q(query.select().single(),null); await audit(id?'pricing_product_update':'pricing_product_create',payload.name,'pricing_product',row.id,actorId); return row; },
  async variant(payload,id=null){ const query=id?supabase.from('pricing_variants').update(payload).eq('id',id):supabase.from('pricing_variants').insert(payload); return q(query.select().single(),null); },
  async providerPrice(payload,id=null){ const body={...payload}; body.net_cost=Number(body.net_cost||0); body.provider_discount=Number(body.provider_discount||0); body.shipping=Number(body.shipping||0); body.special_tax=body.apply_special_tax?Number(body.special_tax||0):0; const query=id?supabase.from('pricing_provider_prices').update(body).eq('id',id):supabase.from('pricing_provider_prices').insert(body); return q(query.select().single(),null); },
  async competitor(payload,id=null){ const query=id?supabase.from('pricing_competitor_prices').update(payload).eq('id',id):supabase.from('pricing_competitor_prices').insert(payload); return q(query.select().single(),null); },
  async history(actorId,productId,variantId,snapshot){ return q(supabase.from('pricing_history').insert({member_id:actorId,product_id:productId||null,variant_id:variantId||null,snapshot}).select().single(),null); },
  async remove(table,id){ const {error}=await supabase.from(table).delete().eq('id',id); if(error) throw error; },
  realCost(row){ return pricingRealCost(row); },
};

export const Users = {
  async admin(action,payload){ const {data,error}=await supabase.functions.invoke('team-admin',{body:{action,...payload}}); if(error) throw error; if(data?.error) throw new Error(data.error); return data; },
};

export const Maintenance = {
  async reset(reason){ const {data,error}=await supabase.rpc('reset_operational_data',{p_reason:reason}); if(error) throw error; return data; },
};
