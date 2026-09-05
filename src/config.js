export const CONFIG = Object.freeze({
  supabaseUrl: 'https://eeeyebbsafspndnvntty.supabase.co',
  supabaseKey: 'sb_publishable_k3V99M5S8qGh_D-yzQJpxA_oVkznV9a',
  appName: 'Totus Central',
  refreshMs: 60_000,
  timezone: 'Europe/Madrid',
  currency: 'EUR',
});

export const ROLES = Object.freeze({
  admin: {label:'Administrador', level:50},
  gerente: {label:'Gerente', level:40},
  encargado: {label:'Encargado', level:30},
  tendero: {label:'Tendero', level:20},
  invitado: {label:'Invitado', level:10},
});