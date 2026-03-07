# Database Schema - Cito.mx

## Visión General

Base de datos PostgreSQL alojada en Supabase con 3 tablas principales y relaciones foreign key.

## Diagrama de Relaciones
```
users (1) ──────< availability (*)
  │
  └──────────────< appointments (*)
```

## Tablas

### users

Almacena información de negocios registrados (dentistas, spas, veterinarias, etc.)

**Columnas:**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| email | TEXT | UNIQUE, NOT NULL | Email de login |
| nombre_negocio | TEXT | NOT NULL | Nombre del negocio |
| subdominio | TEXT | UNIQUE, NOT NULL | Subdominio (ej: dentalayala) |
| industry | TEXT | NOT NULL | Tipo de negocio (dentista, spa, etc) |
| logo_url | TEXT | NULLABLE | URL del logo en Storage |
| color_primario | TEXT | NOT NULL | Color hex principal |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de registro |

**Ejemplo:**
```json
{
  "id": "a1b2c3d4-...",
  "email": "contacto@dentalayala.com",
  "nombre_negocio": "Dental Ayala",
  "subdominio": "dentalayala",
  "industry": "dentista",
  "logo_url": null,
  "color_primario": "#3B82F6"
}
```

### availability

Horarios de atención por día de la semana para cada negocio.

**Columnas:**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| user_id | UUID | FK → users.id, NOT NULL | Negocio al que pertenece |
| dia_semana | INT2 | NOT NULL | 0=Dom, 1=Lun ... 6=Sáb |
| hora_inicio | TIME | NOT NULL | Hora de apertura |
| hora_fin | TIME | NOT NULL | Hora de cierre |
| duracion_cita_mins | INT4 | NOT NULL | Duración de cada cita |
| activo | BOOLEAN | NOT NULL, DEFAULT true | Si el horario está activo |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Ejemplo:**
```json
{
  "user_id": "a1b2c3d4-...",
  "dia_semana": 1,
  "hora_inicio": "09:00:00",
  "hora_fin": "18:00:00",
  "duracion_cita_mins": 30,
  "activo": true
}
```

### appointments

Citas agendadas por pacientes.

**Columnas:**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| user_id | UUID | FK → users.id, NOT NULL | Negocio al que pertenece |
| paciente_nombre | TEXT | NOT NULL | Nombre del paciente |
| paciente_telefono | TEXT | NOT NULL | Teléfono (+52...) |
| fecha_hora | TIMESTAMPTZ | NOT NULL | Fecha y hora de la cita |
| motivo | TEXT | NULLABLE | Razón de la cita |
| status | TEXT | NOT NULL | confirmada, cancelada, completada |
| sms_enviado | BOOLEAN | NOT NULL, DEFAULT false | Si se envió SMS |
| sms_sid | TEXT | NULLABLE | ID de Twilio |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Estados posibles:**
- `confirmada` - Cita activa pendiente
- `cancelada` - Cancelada por paciente/negocio
- `completada` - Cita ya ocurrió

**Ejemplo:**
```json
{
  "user_id": "a1b2c3d4-...",
  "paciente_nombre": "María González",
  "paciente_telefono": "+524431234567",
  "fecha_hora": "2026-03-10T10:00:00-06:00",
  "motivo": "Limpieza dental",
  "status": "confirmada",
  "sms_enviado": true,
  "sms_sid": "SM1234..."
}
```

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas.

### Políticas users

1. **Anyone can view users** (SELECT, public)
2. **Users can update own profile** (UPDATE, authenticated)
3. **Anyone can insert users** (INSERT, authenticated)

### Políticas availability

1. **Anyone can view availability** (SELECT, public)
2. **Users can insert own availability** (INSERT, authenticated)
3. **Users can update own availability** (UPDATE, authenticated)
4. **Users can delete own availability** (DELETE, authenticated)

### Políticas appointments

1. **Business owners can view their appointments** (SELECT, authenticated)
2. **Public can view appointments** (SELECT, public) - Temporal
3. **Anyone can insert appointments** (INSERT, public)
4. **Business owners can update** (UPDATE, authenticated)
5. **Business owners can delete** (DELETE, authenticated)

## Índices

### Índices automáticos (Primary Keys):
- `users_pkey` on users(id)
- `availability_pkey` on availability(id)
- `appointments_pkey` on appointments(id)

### Índices de unicidad:
- `users_email_key` on users(email)
- `users_subdominio_key` on users(subdominio)

### Índices recomendados (para agregar en producción):
```sql
CREATE INDEX idx_appointments_user_fecha ON appointments(user_id, fecha_hora);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_availability_user_dia ON availability(user_id, dia_semana);
```

## Estadísticas Actuales (5 Mar 2026)

- **Negocios:** 3
- **Horarios configurados:** 16 días
- **Citas totales:** 16
  - Confirmadas: 14
  - Canceladas: 1
  - Completadas: 1