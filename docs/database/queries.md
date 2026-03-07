# Queries Útiles - Cito.mx

## Reportes Básicos

### Citas de hoy por negocio
```sql
SELECT 
  u.nombre_negocio,
  a.paciente_nombre,
  a.fecha_hora,
  a.paciente_telefono,
  a.status
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE DATE(a.fecha_hora) = CURRENT_DATE
  AND a.status = 'confirmada'
ORDER BY u.nombre_negocio, a.fecha_hora;
```

### Citas de la semana
```sql
SELECT 
  u.nombre_negocio,
  COUNT(*) as total_citas,
  COUNT(CASE WHEN a.sms_enviado = false THEN 1 END) as pendientes_sms
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.fecha_hora >= DATE_TRUNC('week', CURRENT_DATE)
  AND a.fecha_hora < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
  AND a.status = 'confirmada'
GROUP BY u.id, u.nombre_negocio;
```

### Citas pendientes de SMS
```sql
SELECT 
  u.nombre_negocio,
  a.paciente_nombre,
  a.paciente_telefono,
  a.fecha_hora
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.sms_enviado = false
  AND a.status = 'confirmada'
  AND a.fecha_hora >= NOW()
ORDER BY a.fecha_hora;
```

### Horarios disponibles por día
```sql
SELECT 
  u.nombre_negocio,
  av.dia_semana,
  av.hora_inicio,
  av.hora_fin,
  av.duracion_cita_mins,
  EXTRACT(EPOCH FROM (av.hora_fin - av.hora_inicio))/60 / av.duracion_cita_mins as slots_disponibles
FROM availability av
JOIN users u ON av.user_id = u.id
WHERE av.activo = true
ORDER BY u.nombre_negocio, av.dia_semana;
```

### Ocupación por negocio (próximos 7 días)
```sql
SELECT 
  u.nombre_negocio,
  COUNT(a.id) as citas_agendadas,
  (
    SELECT COUNT(*)
    FROM availability av
    WHERE av.user_id = u.id
      AND av.activo = true
  ) * 7 as dias_disponibles
FROM users u
LEFT JOIN appointments a ON u.id = a.user_id
  AND a.fecha_hora >= CURRENT_DATE
  AND a.fecha_hora < CURRENT_DATE + INTERVAL '7 days'
  AND a.status = 'confirmada'
GROUP BY u.id, u.nombre_negocio;
```

## Análisis de Negocios

### Tasa de no-shows por negocio
```sql
SELECT 
  u.nombre_negocio,
  COUNT(*) as total_citas,
  COUNT(CASE WHEN a.status = 'cancelada' THEN 1 END) as canceladas,
  ROUND(
    100.0 * COUNT(CASE WHEN a.status = 'cancelada' THEN 1 END) / NULLIF(COUNT(*), 0),
    2
  ) as tasa_cancelacion
FROM users u
LEFT JOIN appointments a ON u.id = a.user_id
GROUP BY u.id, u.nombre_negocio;
```

### Horarios más populares
```sql
SELECT 
  EXTRACT(HOUR FROM a.fecha_hora) as hora,
  COUNT(*) as total_citas
FROM appointments a
WHERE a.status = 'confirmada'
GROUP BY hora
ORDER BY total_citas DESC;
```