import fs from 'node:fs';
const root=new URL('../',import.meta.url);const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const files=['src/config.js','src/state.js','src/ui.js','src/api.js','src/app.js','src/views/shared.js','src/views/work.js','src/views/tasks.js','src/views/purchases.js','src/views/pricing.js','src/views/library.js','src/views/history.js','src/views/users.js','src/views/index.js'];
let fail=0;const ok=(name,cond)=>{console.log(`${cond?'PASS':'FAIL'} ${name}`);if(!cond)fail++};
for(const f of files){const s=read(f);ok(`${f} no eval`,!s.includes('eval('));ok(`${f} no document.write`,!s.includes('document.write'));ok(`${f} no TODO/FIXME`,!/(TODO|FIXME)/.test(s));}
const html=read('index.html'),css=read('styles.css'),views=['src/views/work.js','src/views/tasks.js','src/views/purchases.js','src/views/pricing.js','src/views/library.js','src/views/history.js','src/views/users.js'].map(read).join('\n'),api=read('src/api.js');
ok('HTML loads one application entrypoint',(html.match(/src="\.\/src\/app\.js"/g)||[]).length===1);
ok('No legacy Totus JS loaded',!html.includes('totus-team.js')&&!html.includes('pricing.html'));
ok('Responsive 820',css.includes('@media(max-width:820px)'));ok('Responsive 560',css.includes('@media(max-width:560px)'));ok('Mobile inputs 16px',/input,select,textarea,button\{font-size:16px\}/.test(css));
ok('Monthly target is automatic',api.includes('work_month_summary'));ok('Incident adjustment supported',views.includes('hour_adjustment_minutes'));ok('No manual monthly target field',!views.includes('employee_monthly_targets'));
ok('Purchases implement stock 10%',views.includes('unit=pvp*.90'));ok('Purchases implement supplier cost taxes',views.includes('cost*(1+vat/100+re/100)'));
ok('Modal confirmation exists',views.includes('await modal('));ok('No native alert/confirm/prompt',!/(alert\(|confirm\(|prompt\()/.test(views));
process.exitCode=fail?1:0;