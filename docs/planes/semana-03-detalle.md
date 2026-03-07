# Plan Detallado - Semana 3: Sistema de Registro

**Fechas:** 2-8 Marzo 2026  
**Horas totales:** 9h  
**Objetivo:** Dentistas pueden registrarse en el sistema

---

## Lunes 2 Mar - Día 14 (1h)

### Configurar Supabase Auth

**Tareas:**
1. Habilitar Email Auth en Supabase (10 min)
2. Configurar email templates (15 min)
3. Configurar redirect URLs (10 min)
4. Probar autenticación básica desde consola (15 min)
5. Documentar configuración (10 min)

**Entregables:**
- Auth habilitado
- Email de confirmación personalizado
- Documentación de setup

---

## Martes 3 Mar - Día 15 (1h)

### Crear Página de Registro (UI)

**Tareas:**
1. Crear archivo app/auth/registro/page.tsx (10 min)
2. Layout básico con header (10 min)
3. Form con campos principales (25 min)
   - Email
   - Password
   - Nombre negocio
   - Tipo negocio
   - Subdominio
4. Styling con Tailwind (15 min)

**Entregables:**
- Página de registro visual
- Form estático (sin funcionalidad)

---

## Miércoles 4 Mar - Día 16 (1h)

### Funcionalidad del Formulario

**Tareas:**
1. useState para cada campo (10 min)
2. Handlers de onChange (10 min)
3. Validaciones en tiempo real (20 min)
   - Email válido
   - Password mínimo 8 chars
   - Subdominio sin espacios
4. Mostrar errores al usuario (15 min)
5. Testing manual (5 min)

**Entregables:**
- Form funcional con validaciones
- Feedback visual de errores

---

## Jueves 5 Mar - Día 17 (1h)

### Generación Automática de Subdominio

**Tareas:**
1. Función para sanitizar nombre → subdominio (15 min)
   - Quitar espacios
   - Minúsculas
   - Quitar acentos
   - Solo alfanuméricos
2. Auto-llenar campo subdominio (10 min)
3. Permitir edición manual (5 min)
4. Validar que sea único (query a Supabase) (20 min)
5. Testing con varios casos (10 min)

**Entregables:**
- Subdominio se genera automáticamente
- Validación de unicidad funcional

---

## Viernes 6 Mar - Día 18 (2h)

### HORA 1: Integrar Supabase Auth

**Tareas:**
1. Función handleSubmit (15 min)
2. signUp con Supabase Auth (20 min)
3. Manejo de errores (15 min)
4. Loading state (10 min)

**HORA 2: Crear Registro en DB**

**Tareas:**
1. Después de signUp exitoso, insertar en tabla users (20 min)
2. Manejar user_id de Auth en campo id de users (15 min)
3. Testing completo del flujo (20 min)
4. Edge cases (email duplicado, etc) (5 min)

**Entregables:**
- Registro completo funcional
- Usuario creado en Auth + DB

---

## Sábado 7 Mar - Día 19 (2h)

### HORA 1: Página de Confirmación

**Tareas:**
1. Crear app/auth/bienvenida/page.tsx (15 min)
2. Diseño de página de éxito (20 min)
3. Redirect después de registro (10 min)
4. Mensaje personalizado con nombre negocio (10 min)
5. Link para verificar email (5 min)

**HORA 2: Polish y UX

**Tareas:**
1. Mejorar mensajes de error (15 min)
2. Añadir indicador de fortaleza de password (20 min)
3. Smooth transitions (10 min)
4. Responsive design mobile (15 min)

**Entregables:**
- Página de bienvenida completa
- UX pulida

---

## Domingo 8 Mar - Día 20 (1h)

### Testing End-to-End y Documentación

**Tareas:**
1. Probar flujo completo 3 veces (20 min)
   - Registro exitoso
   - Email duplicado
   - Subdominio duplicado
2. Verificar datos en Supabase (10 min)
3. Documentar flujo de registro (15 min)
4. Screenshots para docs (10 min)
5. Commit y cierre de semana (5 min)

**Entregables:**
- Sistema de registro funcionando 100%
- Documentación completa
- Screenshots del flujo

---

## Criterios de Éxito Semana 3

✅ Usuario puede registrarse con email/password  
✅ Subdominio se genera automáticamente  
✅ Datos se guardan en Auth + users table  
✅ Email de confirmación se envía  
✅ Validaciones funcionan correctamente  
✅ UX es clara y sin errores  
✅ Código documentado y en GitHub

---

## Riesgos y Mitigaciones

**Riesgo 1:** Sincronización entre Auth y tabla users falla  
**Mitigación:** Usar triggers de Supabase o manejar en código

**Riesgo 2:** Generación de subdominio crea duplicados  
**Mitigación:** Agregar número al final si ya existe (dentalayala2)

**Riesgo 3:** Email templates no se personalizan  
**Mitigación:** Usar templates default de Supabase por ahora

---

## Herramientas Nuevas

- Supabase Auth API
- React Hook Form (opcional, evaluar)
- Zod para validaciones (opcional)

Por ahora: useState + validaciones manuales (más simple para aprender)