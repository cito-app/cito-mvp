# 🦷 Cito.mx - Tu Sitio de Citas

Sistema de agendamiento de citas white-label para negocios mexicanos.

## 🎯 Propuesta de Valor

Plataforma para controlar tus citas con página personalizada y confirmación automática por SMS. Desde $300/mes.

## 📊 Estado del Proyecto

**Fase actual:** Base de Datos Completa (Semana 2/14)

**Progreso:** 15/128 horas (11.7%)

**Inversión:** $690.27 MXN

## 🏗️ Stack Tecnológico

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Pagos:** Stripe
- **SMS:** Twilio
- **Hosting:** Siteground

## 📂 Estructura del Proyecto
```
cito-mvp/
├── app/                    # Next.js pages
├── components/             # Componentes reutilizables
├── lib/                    # Utilidades (supabase client)
├── docs/                   # Documentación
│   ├── database/          # Esquemas y queries
│   ├── api/               # Documentación API
│   └── setup/             # Guías de instalación
├── public/                # Archivos estáticos
└── .env.local            # Variables de entorno
```

## 🗄️ Base de Datos

### Tablas Principales

- **users** - Negocios registrados
- **availability** - Horarios de atención
- **appointments** - Citas agendadas

Ver documentación completa: [docs/database/schema.md](docs/database/schema.md)

## 🚀 Próximos Pasos

**Semana 3:** Sistema de registro y login
**Semana 4:** Dashboard y perfil
**Semana 5-6:** Personalización white-label

## 📝 Documentación

- [Database Schema](docs/database/schema.md)
- [Queries Útiles](docs/database/queries.md)
- [Setup Local](docs/setup/local-dev.md)

## 💰 Modelo de Negocio

**Plan Básico:** $300 MXN/mes
- 40 SMS incluidos
- Página personalizada
- Citas ilimitadas

**Plan Premium:** $600 MXN/mes (Fase 2)
- 100 SMS incluidos
- Dominio personalizado
- Recordatorios múltiples

## 📧 Contacto

Proyecto: Cito.mx - Tu Sitio de Citas