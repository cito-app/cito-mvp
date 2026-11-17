# Migraciones aplicadas en cito-production (gyfximoxybmkszltzdoj) — 2026-11-17

1. `bot_whatsapp_schema`: tablas `negocios`, `configuracion_negocio`, `servicios`, `citas` con RLS
   (anon sin acceso; el dueño autenticado ve/edita solo lo de su negocio vía `negocios.user_id`).
   RLS activado en `users` y `reservations` (web archivada).
2. `cerrar_acceso_anon`: revoca anon en tablas del bot y anon/authenticated en tablas legacy;
   revoca RPC de `rls_auto_enable()`; `search_path` fijo en `update_updated_at_column()`.

El SQL exacto está en el historial de migraciones de Supabase (Database → Migrations).
