# Cliente de Supabase - Cito.mx

## Configuración

El cliente se inicializa en `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Uso Básico

### Leer datos
```typescript
import { supabase } from '@/lib/supabase'

// Obtener todos los usuarios
const { data, error } = await supabase
  .from('users')
  .select('*')

// Filtrar por subdominio
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('subdominio', 'dentalayala')
  .single()
```

### Insertar datos
```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    user_id: '...',
    paciente_nombre: 'Juan Pérez',
    paciente_telefono: '+524431234567',
    fecha_hora: '2026-03-15T10:00:00-06:00',
    status: 'confirmada'
  })
```

### Actualizar datos
```typescript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'cancelada' })
  .eq('id', appointmentId)
```

### Eliminar datos
```typescript
const { data, error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId)
```

## Queries Complejas

### JOIN con múltiples tablas
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    users (
      nombre_negocio,
      subdominio
    )
  `)
  .eq('status', 'confirmada')
  .gte('fecha_hora', new Date().toISOString())
```

### Filtros por fecha
```typescript
// Citas de hoy
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .gte('fecha_hora', new Date().setHours(0,0,0,0))
  .lt('fecha_hora', new Date().setHours(23,59,59,999))
```

## Manejo de Errores
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')

if (error) {
  console.error('Error:', error.message)
  // Manejar error
}

// Usar data
```

## Autenticación (Semana 3)
```typescript
// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@ejemplo.com',
  password: 'password123'
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'password123'
})

// Logout
const { error } = await supabase.auth.signOut()

// Usuario actual
const { data: { user } } = await supabase.auth.getUser()
```