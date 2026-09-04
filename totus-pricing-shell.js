/* Totus Central · Pricing Shell V21
   Unifica la apariencia del módulo Pricing con la consola principal. */
(function(){
  function applyPricingShell(){
    const frame=document.getElementById('pricingFrame');
    try{
      const doc=frame?.contentDocument;if(!doc||doc.getElementById('totusPricingShell'))return;
      const st=doc.createElement('style');st.id='totusPricingShell';st.textContent=`
:root{--bg:#f4f7fb;--panel:#fff;--panel2:#fff;--soft:#f8fafc;--line:#e3e8f0;--line2:#d4dbe7;--text:#0f172a;--muted:#64748b;--cyan:#2563eb;--cyan2:#1d4ed8;--green:#16a34a;--amber:#d97706;--red:#dc2626;--r:16px;--shadow:0 14px 34px rgba(15,23,42,.07)}
html,body{background:#f4f7fb!important;color:#0f172a!important}.bg-art,.bg-shade,.top{display:none!important}#appView{z-index:1!important}.main{max-width:none!important;padding:18px 22px 100px!important;background:#f4f7fb!important;color:#0f172a!important}
.head h1,.quick-title h2,.section-head h3,.users-topline h3{color:#0f172a!important}.head p,.small,.muted,.meta,.savestate{color:#64748b!important}.eyebrow{color:#2563eb!important}
.card,.quick,.hero,.team-card,.user-editor,.detail,.metric,.stat,.row,.convert{background:#fff!important;border-color:#e3e8f0!important;box-shadow:0 10px 28px rgba(15,23,42,.055)!important;backdrop-filter:none!important}.hero{background:linear-gradient(135deg,#fff,#f4f8ff)!important}.hero h1{text-shadow:none!important}.quick:after{opacity:.35}
input,select,textarea{background:#fff!important;color:#0f172a!important;border-color:#d4dbe7!important}input:focus,select:focus,textarea:focus{border-color:#7aa2f7!important;box-shadow:0 0 0 3px rgba(37,99,235,.08)!important}input::placeholder,textarea::placeholder{color:#94a3b8!important}select option{background:#fff!important;color:#0f172a!important}label{color:#516176!important}
.primary{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}.secondary{background:#fff!important;border-color:#d4dbe7!important;color:#172033!important}.ghost{color:#315b9f!important}.danger{background:#fff!important;border-color:#fecaca!important;color:#b91c1c!important}.primary:hover,.secondary:hover,.ghost:hover{transform:none!important;filter:none!important}.secondary:hover,.ghost:hover{background:#f8fafc!important}
.metric small,.stat small,th{color:#64748b!important}.metric strong,.stat strong{color:#0f172a!important}.metric.cost strong{color:#1d4ed8!important}.metric.good strong{color:#15803d!important}.metric.warn strong{color:#a16207!important}.metric.bad strong{color:#b91c1c!important}
.verdict{background:#ecfdf3!important;border-color:#d1fae5!important;color:#166534!important}.verdict.warn{background:#fff7ed!important;border-color:#fed7aa!important}.verdict.bad{background:#fff1f2!important;border-color:#fecdd3!important}.note{background:#eff6ff!important;border-color:#dbeafe!important;color:#1e40af!important}.warn-note{background:#fff7ed!important;border-color:#fed7aa!important;color:#9a5b00!important}
.row:hover,.search-item:hover{background:#f8fafc!important}.tabs button{background:#fff!important;border-color:#e3e8f0!important;color:#64748b!important}.tabs button.active{background:#eef4ff!important;border-color:#cadcff!important;color:#174cb7!important}.breadcrumb button{color:#2563eb!important}.badge.info{color:#1d4ed8!important;background:#eef4ff!important;border-color:#dbe7ff!important}.badge.ok{color:#15803d!important;background:#ecfdf3!important;border-color:#d1fae5!important}.badge.warnb{color:#a16207!important;background:#fff7e6!important;border-color:#fde7ba!important}.badge.badb{color:#b91c1c!important;background:#fff1f2!important;border-color:#fecdd3!important}
.table-wrap{border-color:#e3e8f0!important;background:#fff!important}table{background:#fff!important}th{background:#f8fafc!important}th,td{border-color:#e8edf4!important;color:#172033!important}.savebar{background:rgba(255,255,255,.97)!important;border-color:#e3e8f0!important;box-shadow:0 -8px 26px rgba(15,23,42,.06)!important}
.search-results{background:#fff!important;border-color:#d4dbe7!important;color:#172033!important}.search-item{border-color:#e8edf4!important}.team-card.selected{border-color:#8fb1ea!important;box-shadow:0 0 0 1px #dbe7ff inset!important}
@media(max-width:760px){.main{padding:12px 10px 108px!important}.card,.quick,.hero{border-radius:13px!important}}
`;
      doc.head.appendChild(st);
      doc.body?.classList.add('totus-pricing-shell');
    }catch{}
  }
  const baseTune=window.tuneFrame;
  if(typeof baseTune==='function')window.tuneFrame=function(){const r=baseTune.apply(this,arguments);applyPricingShell();return r};
  const frame=document.getElementById('pricingFrame');if(frame)frame.addEventListener('load',()=>setTimeout(applyPricingShell,0));
  window.applyPricingShell=applyPricingShell;
})();
