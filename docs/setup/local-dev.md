# Guía de Desarrollo Local - Cito.mx

## Prerrequisitos

- Node.js 20+ instalado
- Git instalado
- VS Code (recomendado)
- Cuenta en Supabase
- Cuenta en Stripe (modo test)
- Cuenta en Twilio

## Instalación

### 1. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/cito-mvp.git
cd cito-mvp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local` en la raíz:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Obtener credenciales de Supabase:**
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia Project URL y anon public key

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

Abre http://localhost:3000

## Estructura de Base de Datos

La base de datos ya debe estar creada en Supabase.

Si necesitas recrearla, ejecuta los scripts en:
`docs/database/schema.md`

## Comandos Útiles
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción local
npm start

# Linting
npm run lint
```

## Troubleshooting

### Error: "supabaseUrl is required"

**Solución:** Asegúrate que `.env.local` está en la raíz del proyecto y reinicia el servidor.

### Error: Políticas RLS

**Solución:** Verifica que todas las políticas estén creadas en Supabase → Table Editor → [tabla] → Policies

### Error: CORS en local

**Solución:** Normal en desarrollo. Las APIs de Supabase permiten localhost por defecto.

## Próximos Pasos

- Ver [Database Schema](../database/schema.md) para entender la estructura
- Ver [Queries](../database/queries.md) para ejemplos de uso
```

**Guardar archivo**

---

## 📝 Tarea 4: Optimizar .gitignore (10 min)

**Verificar que `.gitignore` incluya:**
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env.production

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db