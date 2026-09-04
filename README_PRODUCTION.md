# Totus Central · Producción

Repositorio activo de Totus Central. La aplicación se publica desde `main` mediante GitHub Pages y usa el proyecto Supabase de Totus Central.

## Punto de entrada
- `index.html`
- `totus-suite.html` se mantiene idéntico como entrada equivalente.

## Núcleo activo
- `totus-team.js` · motor operativo existente.
- `totus-team.css` · estilos base.
- `totus-shell.css` · shell visual único de la nueva construcción.
- `pricing.html` + `totus-pricing-shell.js` · Pricing integrado sin modificar el repositorio original de Totus Pricing.
- `totus-quick-controls.js` · controles rápidos de jornada, tarea, actividad laboral y parada personal.
- `totus-work-activity.js` · actividad laboral computable con o sin tarea.
- `totus-work-activity-present.js` · presentación de estado y actividad del equipo.
- `totus-report-activity.js` · informes exhaustivos de actividad.
- `totus-workspaces.js` · centros/proyectos y asignaciones del equipo.
- `totus-backup.js` · Backup V4 y restauración/rollback compatible con V1/V2/V3.
- `totus-rbac.js` · capacidades y permisos por rol.
- `totus-employee-records.js` · incidencias y documentación privada de empleado.
- `totus-ui.js` · integración de navegación, ayudas y shell.
- `fondo_original.png` · recurso visual.

## Criterio de mantenimiento
No se mantienen copias runtime versionadas ni capas antiguas conectadas “por si acaso”. Git conserva el histórico. Producción debe contener una única ruta activa por responsabilidad y toda función nueva debe entrar con RLS, auditoría, backup y QA.

## QA
El workflow `.github/workflows/qa.yml` comprueba sintaxis, estructura, módulos activos, backup/RBAC, renderizado Chromium, cinco roles y expediente de empleado. El usuario final no tiene que ejecutar pruebas ni scripts.
