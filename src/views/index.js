import {renderWork,renderDock} from './work.js';
import {renderTasks} from './tasks.js';
import {renderPurchases} from './purchases.js';
import {renderPricing} from './pricing.js';
import {renderLibrary} from './library.js';
import {renderHistory} from './history.js';
import {renderUsers} from './users.js';
import {emptyState,toast} from '../ui.js';
export {renderDock};
export const NAV=[['work','Trabajo','◷'],['tasks','Tareas','✓'],['purchases','Compras','🛒'],['pricing','Precios','€'],['library','Ayuda','?'],['history','Histórico','≡'],['users','Usuarios','♙']];
export const SUB={work:[['dashboard','Mi panel'],['attendance','Fichajes'],['schedule','Horario'],['reports','Horas del mes']],tasks:[['mine','Mis tareas'],['calendar','Calendario'],['manage','Gestionar']],purchases:[['new','Nueva compra'],['list','Historial']],pricing:[['catalog','Catálogo'],['calculator','Calculadora']],library:[['docs','Documentos'],['questions','Consultas']],history:[['activity','Actividad'],['incidents','Incidencias']],users:[['team','Equipo'],['locations','Centros']]};
export async function render(root,sub){const host=document.getElementById('content');host.innerHTML='<div class="loading-card">Cargando…</div>';try{if(root==='work')return renderWork(sub,host);if(root==='tasks')return renderTasks(sub,host);if(root==='purchases')return renderPurchases(sub,host);if(root==='pricing')return renderPricing(sub,host);if(root==='library')return renderLibrary(sub,host);if(root==='history')return renderHistory(sub,host);if(root==='users')return renderUsers(sub,host);host.innerHTML=emptyState('Zona no disponible','Esta sección no existe.')}catch(e){host.innerHTML=emptyState('No se pudo abrir esta zona',e.message);toast(e.message,'bad')}}