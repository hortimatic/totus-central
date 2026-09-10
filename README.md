# Totus Central

Reconstrucción limpia iniciada el 10/09/2026.

Aplicación interna para Hortimatic / NewOldSmok: trabajo, fichajes, tareas, calendario, programación, vacaciones, compras de empleados, usuarios, avisos, tutoriales/consultas, trazabilidad, backup y Totus Pricing integrado.

## Arquitectura
- Frontend: HTML/CSS/JavaScript modular, sin framework y sin código heredado.
- Backend: Supabase `qgyufbjytcewuevbketz` (Postgres, Auth y Storage).
- Pricing: lógica reimplementada desde la especificación funcional aprobada; el repositorio independiente `totus-pricing-demo` no se modifica.

## Estado
Construcción activa. No declarar candidato de producción hasta completar conexión Supabase, Auth, Storage, backup físico y QA final responsive/roles.

No hay GitHub Actions habilitadas durante la fase de reconstrucción para evitar ejecuciones y correos automáticos innecesarios.
