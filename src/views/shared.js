import {state} from '../state.js';
import {setBusy,toast} from '../ui.js';
export const uid=()=>state.me?.id;
export const profile=id=>state.data.profiles.find(x=>x.id===id);
export const location=id=>state.data.locations.find(x=>x.id===id);
export const taskById=id=>state.data.tasks.find(x=>x.id===id);
export const myLocations=()=>state.data.memberLocations.filter(x=>x.user_id===uid()).map(x=>state.data.locations.find(l=>l.id===x.location_id)).filter(Boolean);
export const openAttendance=()=>state.data.attendance.find(x=>x.user_id===uid()&&!x.clock_out);
export const openBreak=()=>state.data.breaks.find(x=>x.user_id===uid()&&!x.ended_at);
export const openTaskTime=()=>state.data.taskTimes.find(x=>x.user_id===uid()&&!x.stopped_at);
export const openInterruption=()=>state.data.interruptions.find(x=>x.user_id===uid()&&!x.ended_at);
export const fmtElapsed=start=>{if(!start)return'00:00:00';const sec=Math.max(0,Math.floor((Date.now()-new Date(start))/1000));return `${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor(sec%3600/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`};
export async function run(fn,label='Guardando…'){try{setBusy(true,label);await fn()}catch(e){toast(e.message||'Error inesperado','bad',7000)}finally{setBusy(false)}}