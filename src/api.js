import {CONFIG} from './config.js';
import {state,resetState} from './state.js';

if(!window.supabase) throw new Error('No se pudo cargar Supabase');
export const sb=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

async function rows(table,select='*',builder){let q=sb.from(table).select(select);if(builder)q=builder(q);const {data,error}=await q;if(error)throw new Error(`${table}: ${error.message}`);return data||[]}
async function maybe(table,select='*',builder){try{return await rows(table,select,builder)}catch(e){console.warn(e);return []}}
export async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message);return data}
export async function signIn(email,password){const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;state.session=data.session;return data.session}
export async function signOut(){try{await sb.auth.signOut()}finally{resetState()}}
export async function resetPassword(email){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]});if(error)throw error}
export async function updatePassword(password){const {error}=await sb.auth.updateUser({password});if(error)throw error}
export async function loadSession(){const {data}=await sb.auth.getSession();state.session=data.session;return state.session}

export async function loadCore(){
  if(!state.session)throw new Error('Sesión no disponible');
  const uid=state.session.user.id;
  const [profiles,members,locations,memberLocations,breakTypes,taskCategories,leaveTypes]=await Promise.all([
    rows('profiles','id,email,full_name,role,active,created_at,updated_at'),
    rows('team_members','email,full_name,role,active,store,phone,job_title,employee_notes,avatar_url,avatar_path,updated_at'),
    rows('team_locations','*',q=>q.eq('active',true).order('sort_order')),
    rows('team_member_locations','*',q=>q.eq('active',true)),
    rows('attendance_break_types','*',q=>q.eq('active',true).order('sort_order')),
    rows('task_categories','*',q=>q.eq('active',true).order('sort_order')),
    rows('employee_leave_types','*',q=>q.eq('active',true).order('sort_order')),
  ]);
  Object.assign(state.data,{profiles,members,locations,memberLocations,breakTypes,taskCategories,leaveTypes});
  state.me=profiles.find(x=>x.id===uid)||null;
  if(!state.me?.active)throw new Error('Tu usuario no está activo en Totus Central');
  await loadOperational();
}

export async function loadOperational(){
  const uid=state.session?.user?.id;if(!uid)return;
  const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);const from=new Date(monthStart);from.setMonth(from.getMonth()-2);
  const [schedules,scheduleExceptions,attendance,breaks,tasks,taskTimes,interruptions,purchases,leavePeriods,leaveRequests,holidays,notifications,incidents,library,questions]=await Promise.all([
    maybe('employee_schedules','*',q=>q.eq('active',true).order('weekday').order('shift_index')),
    maybe('employee_schedule_exceptions','*',q=>q.gte('work_date',from.toISOString().slice(0,10)).order('work_date')),
    maybe('attendance_entries','*',q=>q.gte('clock_in',from.toISOString()).order('clock_in',{ascending:false}).limit(1500)),
    maybe('attendance_breaks','*',q=>q.gte('started_at',from.toISOString()).order('started_at',{ascending:false}).limit(2000)),
    maybe('team_tasks','*',q=>q.order('created_at',{ascending:false}).limit(1000)),
    maybe('task_time_entries','*',q=>q.gte('started_at',from.toISOString()).order('started_at',{ascending:false}).limit(2500)),
    maybe('task_interruptions','*',q=>q.gte('started_at',from.toISOString()).order('started_at',{ascending:false}).limit(2500)),
    maybe('employee_purchases','*',q=>q.gte('purchase_date',from.toISOString().slice(0,10)).order('purchase_date',{ascending:false}).limit(1000)),
    maybe('employee_leave_periods','*',q=>q.gte('end_date',from.toISOString().slice(0,10)).order('start_date')),
    maybe('employee_leave_requests','*',q=>q.order('created_at',{ascending:false}).limit(500)),
    maybe('team_holidays','*',q=>q.gte('holiday_date',from.toISOString().slice(0,10)).eq('active',true).order('holiday_date')),
    maybe('team_notifications','*',q=>q.eq('target_user_id',uid).eq('status','active').order('created_at',{ascending:false}).limit(100)),
    maybe('employee_incidents','*',q=>q.gte('incident_date',from.toISOString().slice(0,10)).order('incident_date',{ascending:false}).limit(500)),
    maybe('internal_library','*',q=>q.eq('active',true).order('sort_order').limit(500)),
    maybe('internal_questions','*',q=>q.order('created_at',{ascending:false}).limit(500)),
  ]);
  Object.assign(state.data,{schedules,scheduleExceptions,attendance,breaks,tasks,taskTimes,interruptions,purchases,leavePeriods,leaveRequests,holidays,notifications,incidents,library,questions});
}

export async function loadPricing(){
  const [products,variants,providers,providerPrices,competitors]=await Promise.all([
    maybe('products','*',q=>q.order('updated_at',{ascending:false}).limit(1000)),
    maybe('product_variants','*',q=>q.eq('active',true).limit(3000)),
    maybe('providers','*',q=>q.eq('active',true).order('name')),
    maybe('product_provider_prices','*',q=>q.limit(5000)),
    maybe('product_competitor_prices','*',q=>q.order('capture_date',{ascending:false}).limit(5000)),
  ]);Object.assign(state.data,{products,variants,providers,providerPrices,competitors});
}

export async function monthlySummary(userId,month){return rpc('work_month_summary',{p_user_id:userId,p_month:month})}
export async function clockIn(locationId){return rpc('attendance_clock_in',{p_location_id:locationId})}
export async function clockOut(){return rpc('attendance_clock_out')}
export async function startBreak(type,notes=null){return rpc('attendance_pause_start',{p_break_type:type,p_notes:notes})}
export async function stopBreak(){return rpc('attendance_break_stop')}
export async function startTask(taskId){return rpc('task_timer_start',{p_task_id:taskId})}
export async function stopTask(){return rpc('task_timer_stop')}
export async function completeTask(taskId){return rpc('complete_team_task',{p_task_id:taskId})}
export async function cancelTask(taskId,reason){return rpc('cancel_team_task',{p_task_id:taskId,p_reason:reason})}
export async function markNotification(id,acknowledge=false){return rpc('mark_team_notification',{p_notification_id:id,p_acknowledge:acknowledge})}
export async function insert(table,payload){const {data,error}=await sb.from(table).insert(payload).select().single();if(error)throw new Error(error.message);return data}
export async function update(table,id,payload){const {data,error}=await sb.from(table).update(payload).eq('id',id).select().single();if(error)throw new Error(error.message);return data}
export async function remove(table,id){const {error}=await sb.from(table).delete().eq('id',id);if(error)throw new Error(error.message)}
export async function invokeAdmin(action,payload={}){const {data,error}=await sb.functions.invoke('totus-admin',{body:{action,...payload}});if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);return data}