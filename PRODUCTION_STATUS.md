# Estado de producción · 2026-09-04

## Construcción activa
- La interfaz vigente toma como referencia la base visual aportada: navegación jerárquica, sidebar oscuro, espacio de trabajo claro, controles legibles, jerarquía por bloques y comportamiento responsive.
- `index.html` y `totus-suite.html` permanecen idénticos.
- Solo existen dos capas CSS activas: `totus-team.css` y `totus-shell.css`.
- Los módulos de actividad e informes tienen nombres estables; los antiguos nombres runtime versionados fueron retirados del árbol de producción.
- La navegación tiene una única implementación externa en `totus-ui.js`; `totus-rbac.js` define capacidades y guards, no vuelve a dibujar menús.
- El repositorio original `hortimatic/totus-pricing-demo` no se modifica ni se usa como destino de escritura.

## Funcionalidad conservada y ampliada
Se mantienen Pricing, tareas, recurrencias, evidencias opcionales/obligatorias por tarea, relojes, actividad laboral separada, fichajes, pausas personales, horarios, calendarios, vacaciones/ausencias, compras, tutoriales, consultas internas, avisos, informes, históricos y mantenimiento.

La nueva construcción incorpora además:
- Centros y proyectos genéricos, incluidos trabajos remotos/híbridos y futuros negocios.
- Asignaciones persona ↔ centro/proyecto.
- RBAC operativo: Administrador, Gerente, Encargado, Tendero e Invitado.
- Supervisión por ámbito para Encargado.
- Incidencias de empleado con gravedad, estado, resolución y auditoría inmutable.
- Documentación privada de empleado con caducidad, archivado/reactivación y almacenamiento separado de Tutoriales.
- Histórico general ampliado con los nuevos dominios.

## Seguridad y datos
- Supabase RLS es la autoridad final de acceso; la interfaz refleja las mismas capacidades.
- Las operaciones sensibles permanecen fuera de Encargado/Tendero aunque una ruta se intentara abrir manualmente.
- Los RPC antiguos de alta/corrección manual de fichajes sin centro fueron eliminados.
- También se eliminó la firma antigua de `attendance_clock_in()` sin centro: existe una única entrada válida con `location_id`, y los usuarios no globales solo pueden fichar en centros/proyectos asignados.
- La revisión de RPC operativos no muestra ya sobrecargas duplicadas en las familias auditadas.
- No existe borrado funcional de incidencias ni documentos de empleado. Los cambios quedan auditados.

## Backup
- Formato actual: **Totus Backup V4**.
- V4 añade incidencias, auditorías de incidencias, documentación de empleado, auditorías documentales y bucket privado `employee-documents`.
- Sigue aceptando V1/V2/V3.
- V1/V2 reconstruyen las asignaciones de centros al restaurar.
- Rollback exacto crea copia previa, valida Auth, restaura, sincroniza archivos y verifica el resultado.

## QA actual
El commit de aplicación `be02d0fb3006a7ce601637c557a37e5339082000` ha pasado:
- sintaxis JavaScript;
- QA estructural;
- Backup V4/RBAC/expediente;
- 80 renderizados Chromium de las pantallas existentes en cinco resoluciones;
- simulación Chromium de los cinco roles;
- QA Chromium específica de Incidencias y Documentación por rol.

GitHub Pages desplegó ese commit correctamente en la ejecución `33894751434` y la QA completa terminó correctamente en `33894752400`.

El desarrollo continúa con el mismo criterio: conservar las funciones válidas, absorber las mejoras útiles de la base visual y retirar residuos/duplicidades antes de incorporar más capas.
