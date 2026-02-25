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