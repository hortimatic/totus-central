# Totus Central

Aplicación interna de Hortimatic / NewOldSmok reescrita desde cero sobre Supabase.

## Runtime
- `index.html`
- `styles.css`
- `runtime-config.js`
- `src/core.js`
- `src/data.js`
- `src/views.js`
- `src/backup.js`
- `src/app.js`

## QA local
```bash
npm run qa
```

## Backend
Proyecto Supabase: `qgyufbjytcewuevbketz`

La aplicación usa únicamente la clave pública de Supabase en `runtime-config.js`; no contiene service-role keys ni secretos privados.
