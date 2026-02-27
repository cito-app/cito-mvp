# Base de Datos Cito.mx

## Tablas

### users
Negocios registrados (dentistas, spas, veterinarias, etc)

Campos:
- id (uuid)
- email (text, unique)
- nombre_negocio (text)
- subdominio (text, unique)
- industry (text)
- logo_url (text, nullable)
- color_primario (text)
- created_at (timestamp)

### availability
Horarios de atención por día de la semana

Campos:
- id (uuid)
- user_id (uuid, FK → users)
- dia_semana (int: 0=Dom, 1=Lun, ..., 6=Sáb)
- hora_inicio (time)
- hora_fin (time)
- duracion_cita_mins (int)
- activo (bool)
- created_at (timestamp)

Ejemplo:
- Dental Ayala: Lun-Vie 9:00-18:00, citas 30min
- Spa Wellness: Lun-Sáb 10:00-20:00, citas 60min

## Relaciones

users (1) → (*) availability
Un negocio tiene múltiples horarios (uno por día)

### appointments
Citas agendadas por los pacientes

Campos:
- id (uuid)
- user_id (uuid, FK → users)
- paciente_nombre (text)
- paciente_telefono (text)
- fecha_hora (timestamptz)
- motivo (text, nullable)
- status (text: confirmada, cancelada, completada)
- sms_enviado (bool)
- sms_sid (text, nullable - ID de Twilio)
- created_at (timestamp)

Estados posibles:
- confirmada: Cita activa
- cancelada: Cancelada por paciente/negocio
- completada: Cita ya ocurrió

Ejemplo:
- María González → Dental Ayala, 25-Feb-2026 10:00, Limpieza
- Laura Sánchez → Spa Wellness, 25-Feb-2026 15:00, Masaje

## Estadísticas de Prueba

Total negocios: 3
- Dental Ayala: 5 días laborales, 4 citas
- Spa Wellness: 6 días laborales, 2 citas
- Clínica Veterinaria: 0 días, 0 citas

Total citas: 6
- Confirmadas: 5
- Canceladas: 1
- Con SMS enviado: 4
- Pendientes SMS: 2

## Seguridad (Row Level Security)

### RLS Habilitado en todas las tablas

Todas las tablas tienen RLS activado para prevenir acceso no autorizado.

### Políticas Implementadas

#### users
- ✅ Lectura pública (para homepage)
- ✅ Solo dueño puede editar su perfil
- ✅ Registro permitido para authenticated

#### availability  
- ✅ Lectura pública (para calendario)
- ✅ Solo dueño puede crear/editar/borrar horarios

#### appointments
- ✅ Lectura para dueño del negocio (sus citas)
- ✅ Lectura pública temporal (MVP)
- ✅ Inserción pública (pacientes agendan)
- ✅ Solo dueño puede actualizar/cancelar

### auth.uid()

Función de Supabase que devuelve el UUID del usuario autenticado.
Se usa en todas las políticas para filtrar por usuario.

Ejemplo:
```sql
USING (user_id = auth.uid())
-- Solo devuelve filas donde user_id = usuario actual
```

### Testing

Todas las políticas probadas con queries SQL.
Actualización sin auth correctamente bloqueada.

### Próximos Pasos (Post-MVP)

- Limitar lectura de appointments solo a paciente/negocio
- Agregar política para que pacientes vean solo sus citas (por teléfono)
- Auditoría de accesos
- Rate limiting