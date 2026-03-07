# Brand Guide - Cito.mx

**Última actualización:** 2 Marzo 2026  
**Versión:** 1.0 MVP

---

## 🎯 Identidad de Marca

### Nombre
**Cito.mx**

### Slogan
**"Tu Sitio de Citas"**

### Propuesta de Valor
Plataforma para controlar tus citas con página personalizada, confirmación automática por SMS y sin comisiones. Diseñada para PyMEs mexicanas multi-industria.

### Personalidad de Marca

**Atributos principales:**
- ✓ **Confiable** - Colores profesionales, espacios limpios, seguridad garantizada
- ✓ **Accesible** - Lenguaje claro, UI simple, precio justo
- ✓ **Moderno** - Componentes actuales, tech-forward, no anticuado
- ✓ **Local** - Tono mexicano, cercano, enfocado en PyMEs

**Tono de comunicación:**
- Profesional pero amigable
- Directo y claro (no palabrería)
- Enfocado en beneficios, no features técnicos
- Uso de "tú" (cercano)

**Ejemplo:**
- ❌ "Nuestro sistema de gestión empresarial optimiza workflows..."
- ✅ "Tu página de citas 24/7. Simple y efectiva."

---

## 🎨 Paleta de Colores

### Brand Colors

#### Primario - Azul
```
Color: #3B82F6
Tailwind: blue-500
Uso: Botones principales, links, elementos destacados, CTAs
Representa: Confianza, profesionalismo, tech
```

#### Secundario - Morado
```
Color: #8B5CF6
Tailwind: purple-500
Uso: Acentos especiales, badges, features premium, iconografía secundaria
Representa: Innovación, modernidad, diferenciación
```

### State Colors

#### Success - Verde
```
Color: #10B981
Tailwind: green-500
Uso: Confirmaciones, mensajes de éxito, citas completadas
```

#### Error - Rojo
```
Color: #EF4444
Tailwind: red-500
Uso: Errores, validaciones fallidas, cancelaciones
```

#### Warning - Ámbar
```
Color: #F59E0B
Tailwind: amber-500
Uso: Advertencias, citas pendientes, recordatorios
```

#### Info - Azul Claro
```
Color: #60A5FA
Tailwind: blue-400
Uso: Información, tooltips, mensajes informativos
```

### Neutral Colors (Tailwind Gray)
```
Fondos claros:
- gray-50: #F9FAFB (fondos sutiles, secciones alternas)
- gray-100: #F3F4F6 (cards, contenedores)

Bordes:
- gray-200: #E5E7EB (bordes principales)
- gray-300: #D1D5DB (bordes hover, divisores)

Textos:
- gray-500: #6B7280 (texto secundario, placeholders)
- gray-600: #4B5563 (texto secundario oscuro)
- gray-700: #374151 (texto principal)
- gray-800: #1F2937 (headings, énfasis)
- gray-900: #111827 (texto muy oscuro, uso mínimo)

Base:
- white: #FFFFFF (fondo principal)
- black: #000000 (uso mínimo, solo para contraste extremo)
```

### Ejemplos de Uso
```css
/* Botón primario */
background: #3B82F6;
color: #FFFFFF;
hover: #2563EB; /* blue-600 */

/* Botón secundario */
background: #8B5CF6;
color: #FFFFFF;
hover: #7C3AED; /* purple-600 */

/* Card */
background: #FFFFFF;
border: 1px solid #E5E7EB;
shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Input */
background: #FFFFFF;
border: 1px solid #D1D5DB;
focus-border: #3B82F6;
placeholder: #6B7280;
```

---

## 🔤 Tipografía

### Font Family

**Principal: Inter**
```
Font: Inter (sans-serif)
Fuente: Google Fonts
Fallback: system-ui, -apple-system, sans-serif
Uso: Todo (headings, body, botones, forms)
```

### Configuración Tailwind
```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
}
```

### Scale de Tamaños
```css
/* Headings */
H1: text-4xl font-bold (36px, 900 weight)
H2: text-3xl font-bold (30px, 900 weight)
H3: text-2xl font-semibold (24px, 600 weight)
H4: text-xl font-semibold (20px, 600 weight)

/* Body */
Large: text-lg (18px, 400 weight)
Base: text-base (16px, 400 weight)
Small: text-sm (14px, 400 weight)
Tiny: text-xs (12px, 400 weight)

/* Especiales */
Button: text-base font-semibold (16px, 600 weight)
Label: text-sm font-medium (14px, 500 weight)
```

### Jerarquía Visual
```html
<!-- Hero Title -->
<h1 class="text-4xl md:text-5xl font-bold text-gray-900">
  Tu Sitio de Citas
</h1>

<!-- Section Title -->
<h2 class="text-3xl font-bold text-gray-900">
  Negocios Usando Cito.mx
</h2>

<!-- Card Title -->
<h3 class="text-xl font-semibold text-gray-900">
  Dental Ayala
</h3>

<!-- Body Text -->
<p class="text-base text-gray-700">
  Plataforma para controlar tus citas...
</p>

<!-- Secondary Text -->
<p class="text-sm text-gray-500">
  7 días gratis • Sin tarjeta de crédito
</p>
```

---

## 🎨 Estilo Visual

### Componentes UI

#### Bordes Redondeados
```css
Botones: rounded-lg (8px)
Cards: rounded-xl (12px)
Inputs: rounded-lg (8px)
Modals: rounded-2xl (16px)
Avatares: rounded-full (100%)
```

#### Sombras
```css
Subtle (cards): shadow-sm
  0 1px 2px rgba(0,0,0,0.05)

Medium (buttons hover): shadow-md
  0 4px 6px rgba(0,0,0,0.1)

Large (modals): shadow-xl
  0 20px 25px rgba(0,0,0,0.15)

Default: sin sombra (limpio)
```

#### Espaciado
```css
Cards padding: p-6 (24px)
Buttons padding: px-6 py-3 (24px horizontal, 12px vertical)
Sections margin: my-12 (48px vertical)
Grid gap: gap-6 o gap-8 (24px o 32px)

Principio: Espacios generosos, UI respirable
```

#### Bordes
```css
Inputs/Cards: border border-gray-200
Hover: border-gray-300
Focus: border-blue-500 ring-2 ring-blue-500/20
```

### Ejemplos de Componentes

#### Botón Primario
```html
<button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition">
  Comenzar Gratis
</button>
```

#### Botón Secundario
```html
<button class="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition">
  Ver Demo
</button>
```

#### Card
```html
<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
  <h3 class="text-xl font-semibold text-gray-900 mb-2">
    Título
  </h3>
  <p class="text-gray-600">
    Descripción del contenido...
  </p>
</div>
```

#### Input
```html
<input 
  type="text"
  placeholder="Email"
  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
/>
```

---

## 🎯 Logo

### Versiones Disponibles

#### Version A - Icono Solo
```
Archivo: cito-icon.png
Tamaño: 512x512px
Uso: App icon, favicon, redes sociales
Formato: Square, fondo transparente
```

#### Version B - Horizontal Navbar
```
Archivo: cito-logo-h.png
Proporción: Horizontal compacta
Uso: Navbar, headers, email signatures
Altura recomendada: 40-50px
```

#### Version C - Vertical
```
Archivo: cito-logo-v.png
Proporción: Vertical (icono arriba, texto abajo)
Uso: App stores, presentaciones, posters
```

#### Version D - Horizontal Full
```
Archivo: cito-logo-full.png
Proporción: Horizontal con spacing generoso
Uso: Landing page hero, secciones destacadas
```

### Elementos del Logo

**Icono:**
- Calendario azul (#3B82F6) con espirales arriba
- Círculo morado (#8B5CF6) con símbolo "+" en esquina inferior derecha
- Representa: "Agregar cita al calendario"

**Tipografía del logo:**
- En código: Renderizar "Cito.mx" con Inter Bold
- Color texto: gray-900 (#111827)

### Guía de Uso del Logo

**DO ✅**
- Usar sobre fondo blanco o gris muy claro
- Mantener área de respiro: mínimo 20px alrededor
- Usar versión horizontal en navbar
- Usar solo icono cuando espacio < 100px ancho

**DON'T ❌**
- No cambiar colores del logo
- No distorsionar proporciones
- No agregar sombras o efectos
- No usar sobre fondos oscuros sin versión invertida
- No usar con menos de 24px de altura

### Tamaños Mínimos
```
Favicon: 32x32px (solo icono)
Navbar: 40px altura (horizontal)
App Icon: 512x512px (solo icono)
Hero: 200px+ ancho (horizontal full)
```

---

## 📐 Grid y Layout

### Breakpoints (Tailwind)
```css
sm: 640px   (móvil horizontal)
md: 768px   (tablet)
lg: 1024px  (desktop pequeño)
xl: 1280px  (desktop)
2xl: 1536px (desktop grande)
```

### Contenedores
```css
Max-width contenedor: max-w-7xl (1280px)
Padding horizontal: px-4 sm:px-6 lg:px-8
Centrado: mx-auto
```

### Grid
```css
2 columnas: grid grid-cols-1 md:grid-cols-2
3 columnas: grid grid-cols-1 md:grid-cols-3
Gap: gap-6 o gap-8
```

---

## 🎨 Diferenciadores vs Competencia

### vs Doctoralia
```
Ellos: Verde menta, médico, solo salud
Nosotros: Azul+morado, multi-industria, PyMEs
```

### vs Calendly
```
Ellos: Azul corporativo, tech, internacional
Nosotros: Dual-color, accesible, mexicano
```

### Nuestro Espacio Único
```
✓ Multi-industria (no solo salud)
✓ White-label (tu marca, no la nuestra)
✓ Precio accesible ($300 vs $1,500+)
✓ Enfoque local mexicano
✓ Balance profesional-amigable
```

---

## 📝 Ejemplos de Copy

### Hero
```
🦷 Cito.mx
Tu Sitio de Citas

Plataforma para controlar tus citas con página personalizada.
Confirmación automática por SMS. Desde $300/mes.

[Comenzar Gratis]  [Iniciar Sesión]
```

### Features
```
🎨 White Label
Página personalizada con tu marca.
Como dentalayala.cito.mx

📱 SMS Automáticos
Confirmación instantánea.
40 SMS incluidos, $5 por SMS extra.

💰 $300/mes
Precio fijo. Sin comisiones por cita.
Cancela cuando quieras.
```

### CTA
```
Primario: "Comenzar Gratis"
Secundario: "Ver Demo"
Informativo: "Más Información"
```

---

## ✅ Checklist de Implementación

### Día 1 (Mañana - Registro)
- [ ] Logo en navbar (Version B)
- [ ] Colores primario/secundario en botones
- [ ] Tipografía Inter en todo
- [ ] Bordes rounded-lg en inputs/botones
- [ ] Espaciado p-6 en forms

### Semana 1-2
- [ ] Favicon (Version A, 32x32px)
- [ ] Hero con logo full (Version D)
- [ ] Paleta completa de estados
- [ ] Cards con shadow-sm
- [ ] Responsive con breakpoints

### Pre-lanzamiento
- [ ] Email templates con branding
- [ ] Todos los estados visuales (success, error, warning)
- [ ] Guía para clientes white-label
- [ ] Versión dark mode (futuro)

---

## 🔄 Evolución Futura

### Fase 2 (Post-MVP)
- Logo animado para loading
- Ilustraciones custom
- Iconografía propia
- Versión dark mode
- Variantes de logo (invertido, monotone)

### Métricas de Éxito
- Brand recall: 70%+ reconocen logo
- Consistencia visual: 95%+ componentes siguen guía
- Tiempo de implementación: <5 min para developer

---

## 📞 Contacto

**Proyecto:** Cito.mx  
**Versión Brand Guide:** 1.0 MVP  
**Fecha:** 2 Marzo 2026  
**Próxima revisión:** Pre-lanzamiento (Mayo 2026)

---

_Este documento es la referencia oficial para toda implementación visual de Cito.mx. Cualquier desviación debe ser aprobada y documentada._