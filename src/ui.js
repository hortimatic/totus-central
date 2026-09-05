import {CONFIG,ROLES} from './config.js';
import {state} from './state.js';

export const esc = (v='') => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
export const money = v => new Intl.NumberFormat('es-ES',{style:'currency',currency:CONFIG.currency}).format(Number(v)||0);
export const dateText = v => v ? new Date(v).toLocaleDateString('es-ES') : '—';
export const dateTimeText = v => v ? new Date(v).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}) : '—';
export const duration = mins => { const n=Math.max(0,Math.round(Number(mins)||0)); return `${Math.floor(n/60)} h ${String(n%60).padStart(2,'0')} min`; };
export const roleLabel = r => ROLES[r]?.label || r || 'Usuario';
export const roleAtLeast = r => (ROLES[state.me?.role]?.level||0) >= (ROLES[r]?.level||999);
export const fmtInputDT = v => {if(!v)return'';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
export const isoInput = v => v ? new Date(v).toISOString() : null;
export function parseDecimal(v,{allowEmpty=true,min=null,max=null}={}){
  let s=String(v??'').trim().replace(/\s/g,''); if(!s) return allowEmpty?null:NaN;
  if(s.includes(',')&&s.includes('.')) s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,''); else s=s.replace(',','.');
  const n=Number(s); if(!Number.isFinite(n))return NaN; if(min!==null&&n<min)return NaN;if(max!==null&&n>max)return NaN;return n;
}
export function toast(message,type='info',ttl=4200){
  const host=document.getElementById('toastHost'); if(!host)return;
  const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<b>${type==='bad'?'Atención':type==='ok'?'Hecho':'Totus'}</b><span>${esc(message)}</span>`;host.prepend(el);
  while(host.children.length>3)host.lastElementChild.remove(); setTimeout(()=>el.remove(),ttl);
}
export function setBusy(on,label='Trabajando…'){
  state.loading=on; document.body.classList.toggle('busy',on);
  let veil=document.getElementById('busyVeil'); if(on&&!veil){veil=document.createElement('div');veil.id='busyVeil';veil.className='busy-veil';veil.innerHTML=`<div class="busy-card"><span class="spinner"></span><b>${esc(label)}</b></div>`;document.body.appendChild(veil)} else if(!on&&veil) veil.remove();
}
export function modal({title,message,html='',confirmText='Aceptar',cancelText='Cancelar',danger=false,requireText=''}){
  return new Promise(resolve=>{
    const host=document.getElementById('modalHost'); const id='m'+crypto.randomUUID();
    host.innerHTML=`<div class="modal-backdrop" id="${id}"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="${id}t"><div class="modal-head"><h2 id="${id}t">${esc(title)}</h2><button type="button" class="icon-btn" data-cancel aria-label="Cerrar">×</button></div>${message?`<p>${esc(message)}</p>`:''}${html}${requireText?`<label class="confirm-label">Escribe <b>${esc(requireText)}</b><input data-confirm-text autocomplete="off"></label>`:''}<div class="modal-actions"><button type="button" class="secondary" data-cancel>${esc(cancelText)}</button><button type="button" class="${danger?'danger':'primary'}" data-confirm>${esc(confirmText)}</button></div></section></div>`;
    const root=document.getElementById(id), finish=v=>{root?.remove();resolve(v)}; root.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>finish(false));root.querySelector('[data-confirm]').onclick=()=>{if(requireText&&root.querySelector('[data-confirm-text]').value.trim()!==requireText){toast('El texto de confirmación no coincide.','bad');return}finish(true)};root.addEventListener('click',e=>{if(e.target===root)finish(false)});root.querySelector('input,button')?.focus();
  });
}
export function emptyState(title,text,action=''){return `<div class="empty"><div class="empty-icon">◌</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`}
export function card(title,body,opts={}){return `<section class="card ${opts.className||''}">${opts.eyebrow?`<div class="eyebrow">${esc(opts.eyebrow)}</div>`:''}<div class="card-head"><h2>${esc(title)}</h2>${opts.action||''}</div>${body}</section>`}
export function stat(label,value,sub=''){return `<div class="stat"><span>${esc(label)}</span><b>${esc(value)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`}