# TABLA: reservations

## Descripción
Almacena todas las reservas de citas de los negocios en Cito.mx.

## Estructura

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Identificador único |
| user_id | UUID | No | - | FK a users (negocio) |
| cliente_nombre | TEXT | No | - | Nombre completo del cliente |
| cliente_email | TEXT | No | - | Email del cliente |
| cliente_telefono | TEXT | No | - | Teléfono (10 dígitos sin formato) |
| fecha_cita | DATE | No | - | Fecha de la cita |
| hora_cita | TIME | No | - | Hora de inicio |
| duracion_minutos | INTEGER | No | 60 | Duración en minutos |
| status | TEXT | No | 'confirmada' | confirmada/cancelada/completada/no_show |
| notas | TEXT | Sí | NULL | Notas adicionales |
| sms_confirmacion_enviado | BOOLEAN | No | false | Flag SMS confirmación |
| sms_recordatorio_enviado | BOOLEAN | No | false | Flag SMS recordatorio |
| created_at | TIMESTAMPTZ | No | NOW() | Fecha de creación |
| updated_at | TIMESTAMPTZ | No | NOW() | Última actualización |

## Constraints

- **PK:** id
- **FK:** user_id → users(id) ON DELETE CASCADE
- **CHECK:** status IN ('confirmada', 'cancelada', 'completada', 'no_show')

## Índices

1. `idx_reservations_user_id` - Búsqueda por negocio
2. `idx_reservations_fecha_cita` - Búsqueda por fecha
3. `idx_reservations_status` - Filtrado por estado
4. `idx_reservations_user_fecha` - Queries combinadas
5. `idx_reservations_recordatorios` - Cron job recordatorios

## Triggers

- `update_reservations_updated_at` - Actualiza updated_at automáticamente

## RLS Policies

1. **SELECT:** Negocios ven solo sus reservas
2. **INSERT:** Público puede crear (validado en servidor)
3. **UPDATE:** Solo el negocio dueño
4. **DELETE:** Solo el negocio dueño
5. **Service Role:** Acceso completo para cron jobs

## Ejemplos de Uso

Ver archivo para queries completos.