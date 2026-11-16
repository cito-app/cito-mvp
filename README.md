# Cito.mx — Bot de citas por WhatsApp

Bot de agendamiento y recordatorios por **WhatsApp** (whatsapp-web.js + Puppeteer/Chromium) con Supabase. No usa Twilio ni SMS.

> La versión web anterior (Next.js + Twilio) está archivada en la rama `legacy-next`.

## Componentes

| Archivo | Qué hace |
|---|---|
| `index.js` | Servidor Express + cliente WhatsApp: flujo de agendado (servicio → fecha/hora), control de cupo, endpoints |
| `services/recordatoriosRunner.js` | Envía los recordatorios de las citas del día |
| `index.html` | Panel de citas (Supabase en el navegador) |
| `login.html` | Acceso de administrador (Supabase Auth) |
| `scripts/` | Utilidades locales: reiniciar la sesión de WhatsApp, detener el servidor |

Tablas en Supabase: `negocios`, `citas`, `servicios`, `configuracion_negocio`.

## Endpoints

| Ruta | Protección | Uso |
|---|---|---|
| `GET /` | `ADMIN_TOKEN` | Muestra el QR para vincular WhatsApp |
| `GET /health` | pública | Estado de WhatsApp/Supabase y memoria |
| `GET /ejecutar-recordatorios` | `ADMIN_TOKEN` | Lo dispara cron-job.org cada 10 min |

El token va en el header `x-admin-token` o como `?token=...`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SUPABASE_URL` | sí | URL del proyecto (`pbdprwul…`) |
| `SUPABASE_KEY` | sí | Llave de Supabase |
| `ADMIN_TOKEN` | recomendada | Si falta, el QR y los recordatorios quedan sin protección |
| `ADMIN_NUMBER` | no | Número que recibe la confirmación al conectar |
| `NODE_OPTIONS` | recomendada en Render | `--max-old-space-size=160` (deja RAM a Chromium) |
| `TZ` | recomendada | `America/Mexico_City` para que "hoy" en los recordatorios sea la fecha de México |
| `WA_WEB_VERSION` | no | Fija una versión de WhatsApp Web; sin ella se usa la que trae la librería |
| `CHROME_PATH` | no | Ruta a Chrome si no se usa el que instala Puppeteer |

## Despliegue (Render, plan gratuito)

- Build: `npm install` (el `postinstall` descarga Chrome).
- Start: `npm start` o `node index.js` con `NODE_OPTIONS` configurado.
- Límites: 512 MB de RAM y **sin disco persistente**. Cada reinicio del contenedor borra la sesión (`.wwebjs_auth/`) y hay que escanear el QR otra vez.
- Los logs `[Memoria]` muestran la RAM del contenedor durante la sincronización (`loading_screen`).

## Local

```bash
cp .env.example .env   # o crea .env con las variables de arriba
npm install
npm start
# abre http://localhost:3000/?token=TU_TOKEN y escanea el QR
```
