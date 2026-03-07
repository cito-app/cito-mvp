# Wireframes Semana 3 - Sistema de Registro

## Página 1: Landing / Home
```
┌─────────────────────────────────────────┐
│          🦷 Cito.mx                     │
│      Tu Sitio de Citas                  │
│                                         │
│  Sistema de citas para negocios        │
│  mexicanos con tu marca                 │
│                                         │
│  [  Comenzar Gratis  ]  [ Iniciar Sesión] │
└─────────────────────────────────────────┘
│                                         │
│  🎨 White Label                         │
│  Página con tu marca                    │
│                                         │
│  📱 SMS Automáticos                     │
│  40 SMS incluidos, $5 extra             │
│                                         │
│  💰 $300/mes                            │
│  Sin comisiones por cita                │
│                                         │
└─────────────────────────────────────────┘
```

## Página 2: Registro (/auth/registro)
```
┌─────────────────────────────────────────┐
│  ← Volver      Cito.mx                  │
├─────────────────────────────────────────┤
│                                         │
│     Crea tu cuenta en Cito.mx          │
│                                         │
│  Paso 1 de 3: Información Básica       │
│                                         │
│  Email *                                │
│  ┌───────────────────────────────────┐ │
│  │ tu@ejemplo.com                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Contraseña *                           │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••••                        │ │
│  └───────────────────────────────────┘ │
│  Mínimo 8 caracteres                   │
│                                         │
│  Nombre del Negocio *                   │
│  ┌───────────────────────────────────┐ │
│  │ Dental Ayala                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Tipo de Negocio *                      │
│  ┌───────────────────────────────────┐ │
│  │ 🦷 Dentista            ▼          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Tu página será:                        │
│  dentalayala.cito.mx                    │
│  (Puedes cambiar "dentalayala")         │
│                                         │
│  Subdominio *                           │
│  ┌────────────────┬──────────────────┐ │
│  │ dentalayala    │ .cito.mx         │ │
│  └────────────────┴──────────────────┘ │
│                                         │
│  ☑ Acepto términos y condiciones       │
│                                         │
│  [     Crear mi cuenta     ]           │
│                                         │
│  ¿Ya tienes cuenta? Inicia sesión      │
│                                         │
└─────────────────────────────────────────┘
```

## Página 3: Bienvenida / Onboarding
```
┌─────────────────────────────────────────┐
│                                         │
│         ✨ ¡Bienvenido a Cito! ✨      │
│                                         │
│  Tu cuenta ha sido creada               │
│  exitosamente                           │
│                                         │
│  📧 Revisa tu email para confirmar      │
│     tu cuenta                           │
│                                         │
│  Mientras tanto, completa tu perfil:    │
│                                         │
│  1. ✅ Información básica               │
│  2. ⏳ Personalizar tu página           │
│  3. ⏳ Configurar horarios              │
│                                         │
│  [  Ir a mi Dashboard  ]                │
│                                         │
└─────────────────────────────────────────┘
```

## Flujo de Usuario
```
Landing
  ↓
  [Comenzar Gratis]
  ↓
Registro (Paso 1)
  ↓
  Validar email único
  Generar subdominio automático
  ↓
  [Crear cuenta]
  ↓
Supabase Auth → Crear usuario
  ↓
Insertar en tabla users
  ↓
Página de Bienvenida
  ↓
Dashboard (Semana 4)
```

## Validaciones

### Email
- ✅ Formato válido
- ✅ Único en el sistema
- ✅ Requerido

### Contraseña
- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 número
- ✅ Al menos 1 letra
- ✅ Requerida

### Nombre Negocio
- ✅ Mínimo 3 caracteres
- ✅ Máximo 50 caracteres
- ✅ Requerido

### Subdominio
- ✅ Solo letras minúsculas y números
- ✅ Sin espacios ni caracteres especiales
- ✅ Único en el sistema
- ✅ Auto-generado desde nombre (editable)

### Tipo de Negocio
- ✅ Selección requerida
- ✅ Opciones: dentista, spa, veterinaria, gym, medico, salon, psicologo, otro

## Mensajes de Error

- "Este email ya está registrado"
- "El subdominio ya está en uso"
- "La contraseña debe tener al menos 8 caracteres"
- "Por favor acepta los términos y condiciones"