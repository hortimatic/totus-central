# Estado de producción · 2026-09-03

- Fuente consolidada, sin capas de compatibilidad, implementaciones heredadas ni dependencias de fuentes anteriores en el frontend activo.
- `index.html` y `totus-suite.html` idénticos.
- Sin `alert()`, `confirm()` o `prompt()` nativos en Central/Precios.
- Sin `service_role`, secretos administrativos, TODO/FIXME, código QA o scripts de prueba en el paquete de producción.
- Responsive y navegación revisados desde 1920 px hasta 320 px.
- Calendario revisado como cuadrícula semanal/mensual real, con casillas por día y agenda accesible al seleccionar una fecha.
- Relojes Jornada / Tarea / Parada compactos, diferenciados por estado y revisados en escritorio, tablet y móvil.
- Formularios y pantallas densas replegados o compactados cuando no necesitan estar abiertos de forma permanente.
- Informes principales compactados; desgloses y exportaciones secundarias quedan disponibles bajo demanda.
- Backup portable: datos operativos, configuración, histórico, auditoría, evidencias, biblioteca y avatares; checksum SHA-256 y fallo explícito si falta cualquier dato/binario necesario.
- Restauración validada mediante lista cerrada de tablas y copia de seguridad automática previa.
- Supabase sin relojes/fichajes abiertos ni residuos QA detectados en la auditoría final.
- QA de cierre sobre la fuente actual: 516 comprobaciones automáticas PASS, además de revisión visual y controles reales de Supabase.

Este paquete contiene únicamente los archivos necesarios para desplegar la aplicación y documentación mínima de producción.
