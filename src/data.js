import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.TOTUS_CONFIG||{};
export const supabase=createClient(cfg.supabaseUrl,cfg.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const T={members:'team_members',locations:'team_locations',memberLocations:'member_locations',attendance:'attendance_sessions',breaks:'personal_breaks',interruptions:'work_interruptions',tasks:'team_tasks',evidence:'task_evidence',timers:'task_timers',schedule:'employee_schedule',opening:'location_opening_hours',scheduleEx:'schedule_exceptions',openingEx:'opening_exceptions',leaveSettings:'leave_settings',holidays:'team_holidays',leaveReq:'leave_requests',leavePeriods:'leave_periods',purchases:'employee_purchases',notifications:'team_notifications',library:'internal_library',questions:'internal_questions',documents:'employee_documents',incidents:'employee_incidents',pricingSettings:'pricing_settings',brands:'pricing_brands',families:'pricing_families',products:'pricing_products',variants:'pricing_variants',providers:'pricing_providers',providerPrices:'pricing_provider_prices',competitors:'pricing_competitor_prices',consultations:'pricing_consultations',history:'pricing_history',audit:'audit_log',backups:'backup_archives'};
const q=(table)=>supabase.from(table);
export async function session(){return (await supabase.auth.getSession()).data.session||null}
export async function signIn(email,password){return supabase.auth.signInWithPassword({email,password})}
export async function signOut(){return supabase.auth.signOut()}
export async function sendOtp(email){const e=String(email||'').trim().toLowerCase();const ok=await rpc('is_team_email_authorized',{p_email:e});if(!ok)return {error:new Error('Este email no está autorizado en Totus Central.')};return supabase.auth.signInWithOtp({email:e,options:{shouldCreateUser:true}})}
export async function activate(email,password){const e=String(email||'').trim().toLowerCase();if(String(password||'').length<8)return {error:new Error('La contraseña debe tener al menos 8 caracteres.')};const ok=await rpc('is_team_email_authorized',{p_email:e});if(!ok)return {error:new Error('Este email no está autorizado en Totus Central.')};return supabase.auth.signUp({email:e,password})}
export async function resetPassword(email){return supabase.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]})}
export async function currentMember(){const s=await session();if(!s)return null;let {data,error}=await q(T.members).select('*').or(`auth_user_id.eq.${s.user.id},email.ilike.${s.user.email}`).eq('active',true).limit(1).maybeSingle();if(error)throw error;if(data&&!data.auth_user_id){await supabase.rpc('bind_my_team_account');({data,error}=await q(T.members).select('*').eq('id',data.id).single());if(error)throw error}return data}
export async function all(table,order='created_at',asc=false){let x=q(table).select('*');if(order)x=x.order(order,{ascending:asc});const {data,error}=await x;if(error)throw error;return data||[]}
export async function one(table,id){const {data,error}=await q(table).select('*').eq('id',id).single();if(error)throw error;return data}
export async function insert(table,payload){const {data,error}=await q(table).insert(payload).select().single();if(error)throw error;return data}
export async function update(table,id,payload){const {data,error}=await q(table).update(payload).eq('id',id).select().single();if(error)throw error;return data}
export async function remove(table,id){const {error}=await q(table).delete().eq('id',id);if(error)throw error;return true}
export async function upsert(table,payload,onConflict){const {data,error}=await q(table).upsert(payload,{onConflict}).select();if(error)throw error;return data}
export async function rpc(name,args={}){const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
export async function dashboard(member){const uid=member.id,now=new Date().toISOString();const [attendance,tasks,notices,breaks,timers,interruptions]=await Promise.all([
 q(T.attendance).select('*').eq('member_id',uid).is('clock_out_at',null).order('clock_in_at',{ascending:false}).limit(1),
 q(T.tasks).select('*').eq('assigned_to',uid).neq('status','completed').order('due_at',{ascending:true}),
 q(T.notifications).select('*').eq('target_member_id',uid).eq('status','active').order('created_at',{ascending:false}),
 q(T.breaks).select('*').eq('member_id',uid).is('end_at',null).order('start_at',{ascending:false}).limit(1),
 q(T.timers).select('*').eq('member_id',uid).is('end_at',null).order('start_at',{ascending:false}).limit(1),
 q(T.interruptions).select('*').eq('member_id',uid).is('end_at',null).order('start_at',{ascending:false}).limit(1)
]);for(const r of [attendance,tasks,notices,breaks,timers,interruptions])if(r.error)throw r.error;return {attendance:attendance.data?.[0]||null,tasks:tasks.data||[],notices:(notices.data||[]).filter(n=>!n.expires_at||n.expires_at>now),break:breaks.data?.[0]||null,timer:timers.data?.[0]||null,interruption:interruptions.data?.[0]||null}}
export async function loadBase(){const [members,locations,memberLocations]=await Promise.all([all(T.members,'name',true),all(T.locations,'name',true),all(T.memberLocations,null)]);return {members,locations,memberLocations}}
export async function clockIn(memberId,locationId){return insert(T.attendance,{member_id:memberId,location_id:locationId,clock_in_at:new Date().toISOString()})}
export async function clockOut(){return rpc('clock_out_current')}
export async function startBreak(memberId,attendanceId,reason,expected){return insert(T.breaks,{member_id:memberId,attendance_id:attendanceId,reason,expected_minutes:+expected||0,start_at:new Date().toISOString()})}
export async function stopBreak(id){return update(T.breaks,id,{end_at:new Date().toISOString()})}
export async function startInterruption(memberId,attendanceId,reason){return insert(T.interruptions,{member_id:memberId,attendance_id:attendanceId,reason,start_at:new Date().toISOString()})}
export async function stopInterruption(id){return update(T.interruptions,id,{end_at:new Date().toISOString()})}
export async function startTask(memberId,taskId){return insert(T.timers,{member_id:memberId,task_id:taskId,start_at:new Date().toISOString()})}
export async function stopTask(timerId){return update(T.timers,timerId,{end_at:new Date().toISOString()})}
export async function completeTask(taskId){return update(T.tasks,taskId,{status:'completed',completed_at:new Date().toISOString()})}
export async function upload(bucket,path,file){const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false});if(error)throw error;return path}
export async function download(bucket,path){const {data,error}=await supabase.storage.from(bucket).download(path);if(error)throw error;return data}
export async function signedUrl(bucket,path,seconds=120){const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,seconds);if(error)throw error;return data.signedUrl}
export async function deleteStorage(bucket,path){const {error}=await supabase.storage.from(bucket).remove([path]);if(error)throw error}
export async function admin(action,payload={}){const {data,error}=await supabase.functions.invoke('team-admin',{body:{action,...payload}});if(error)throw error;if(data?.error)throw new Error(data.error);return data}
export async function saveMember(payload){return payload.id?admin('update',{memberId:payload.id,...payload}):admin('invite',payload)}
export async function deactivateMember(id){return admin('delete',{memberId:id})}
export async function setMemberLocations(memberId,ids){await q(T.memberLocations).delete().eq('member_id',memberId);if(ids.length){const {error}=await q(T.memberLocations).insert(ids.map(location_id=>({member_id:memberId,location_id})));if(error)throw error}}
export async function replaceEmployeeSchedule(memberId,validFrom,locationId,rows){return rpc('replace_employee_schedule_plan',{p_member_id:memberId,p_valid_from:validFrom,p_location_id:locationId||null,p_rows:rows})}
export async function replaceOpening(locationId,validFrom,validTo,seasonName,rows){return rpc('replace_location_opening_period',{p_location_id:locationId,p_valid_from:validFrom,p_valid_to:validTo||null,p_season_name:seasonName||'',p_rows:rows})}
export async function grantGift(memberId,date,reason){return rpc('grant_gift_day',{p_member_id:memberId,p_date:date,p_reason:reason})}
export async function resolveLeave(id,status){return rpc('resolve_leave_request',{p_request_id:id,p_status:status})}
export async function markNotice(id,ack=false){return rpc('mark_team_notification',{p_id:id,p_acknowledge:ack})}
export async function cancelNotice(id,reason){return rpc('cancel_team_notification',{p_id:id,p_reason:reason})}
export async function convertConsultation(id,sku,brandId,familyId,providerId){return rpc('convert_pricing_consultation',{p_consultation_id:id,p_sku:sku,p_brand_id:brandId||null,p_family_id:familyId||null,p_provider_id:providerId||null})}
