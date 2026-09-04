# Estado de producción · 2026-09-04

- Interfaz reconstruida tomando `public(1).rar` como referencia visual oficial: navegación jerárquica, sidebar oscuro, área de trabajo clara, densidad contenida, formularios y tablas legibles.
- `index.html` y `totus-suite.html` se mantienen idénticos.
- Frontend visual consolidado: solo `totus-team.css` como base y `totus-shell.css` como shell de presentación. Las capas visuales antiguas y el archivo temporal de afinado se han eliminado.
- Relojes de jornada, trabajo y parada personal permanecen visibles; las acciones detalladas se abren bajo demanda para no ocupar permanentemente la pantalla.
- Acciones rápidas diseñadas para operaciones habituales en 1–2 pasos, con motivos personales y laborales separados.
- Centros de trabajo ampliados a centros/proyectos: tiendas físicas, proyectos digitales, clientes/externos y futuros negocios; TotusCode está contemplado como proyecto digital/híbrido.
- Catálogo de tareas ampliado para prospección/leads, llamadas comerciales, visitas a clientes, web/desarrollo, diseño, marketing/contenidos, representación de marcas y gestión digital.
- Backup portable protege datos operativos, configuración, históricos, auditorías, evidencias, biblioteca y avatares; restauración fusionada y rollback exacto están separados, con copia previa y verificaciones.
- El rollback exacto valida previamente las cuentas Supabase Auth y se bloquea antes de modificar datos si falta alguna cuenta necesaria.
- Invitaciones y recuperación de usuarios apuntan a Totus Central; no al antiguo `totus-pricing-demo`.
- QA automática incluye sintaxis/estructura y una batería Chromium de 16 pantallas × 5 viewports (80 renderizados) con detección de overflow, microtexto, tarjetas desproporcionadas y errores de navegador.
- La primera pasada visual detectó 23 incidencias reales y generó correcciones. La ronda posterior a la consolidación se ejecuta antes de considerar cerrada la auditoría visual.

Este estado no declara el producto finalizado: la revisión funcional y de permisos por rol continúa hasta cerrar todas las simulaciones solicitadas.
