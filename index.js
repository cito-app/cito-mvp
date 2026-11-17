'use strict';

const QRCode = require('qrcode');
let qrCodeImageData = ''; // Guardará el QR generado

const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { runRecordatorios } = require('./services/recordatoriosRunner');

process.on('unhandledRejection', (err) => {
  console.error('Error no capturado en promesa:', err.message);
});

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
// Token para proteger /ejecutar-recordatorios y la página del QR.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_KEY en las variables de entorno.');
  process.exit(1);
}

if (!ADMIN_TOKEN) {
  console.warn(
    '⚠️  ADMIN_TOKEN no está configurado: el QR y /ejecutar-recordatorios quedan SIN protección.',
  );
}

// Acepta el token en el header "x-admin-token" o en ?token=...
function requireAdminToken(req, res, next) {
  if (!ADMIN_TOKEN) return next();
  const provided = req.get('x-admin-token') || req.query.token;
  if (provided === ADMIN_TOKEN) return next();
  res.status(401).json({ ok: false, error: 'No autorizado' });
}

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const supabase = createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;
// Negocio al que pertenecen las citas que entran por este número de WhatsApp.
const NEGOCIO_ID = Number(process.env.NEGOCIO_ID || 1);

const SUCCESS_MESSAGE =
  '¡Conexión exitosa! 🚀 El motor de Cito.mx está vivo, conectado a Supabase y listo para agendar. ¡Reserva confirmada!';

const chromeExecutablePath =
  process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)
    ? process.env.CHROME_PATH
    : undefined;

const whatsappClient = new Client({
  authStrategy: new LocalAuth({ clientId: 'cito-mx' }),
  // Sin WA_WEB_VERSION se usa la versión que trae whatsapp-web.js (recomendado con @latest).
  // El remotePath con {version} sin fijar versión puede provocar recargas de página
  // ("Execution context was destroyed") si el HTML cacheado no coincide.
  ...(process.env.WA_WEB_VERSION
    ? {
        webVersion: process.env.WA_WEB_VERSION,
        webVersionCache: {
          type: 'remote',
          remotePath:
            'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
        },
      }
    : { webVersionCache: { type: 'none' } }),
  authTimeoutMs: 120000, // la sincronización inicial en 512 MB es lenta
  takeoverOnConflict: true,
  puppeteer: {
    headless: true,
    defaultViewport: { width: 800, height: 600 },
    protocolTimeout: 180000,
    ...(chromeExecutablePath ? { executablePath: chromeExecutablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--no-first-run',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-background-networking',
      '--disable-component-update',
      '--mute-audio',
      '--disable-software-rasterizer',
      // Un solo proceso renderer: es lo que más RAM ahorra en Chromium.
      '--renderer-process-limit=1',
      '--disable-site-isolation-trials',
      '--disable-features=site-per-process,Translate,MediaRouter,OptimizationHints',
      '--js-flags=--max-old-space-size=256',
    ],
  },
});

// ---- Diagnóstico de memoria (RAM total del contenedor, incluye Chromium) ----
function readContainerMemoryMB() {
  for (const file of ['/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory/memory.usage_in_bytes']) {
    try {
      return Math.round(Number(fs.readFileSync(file, 'utf8').trim()) / 1024 / 1024);
    } catch (_) {
      /* siguiente */
    }
  }
  return null;
}

function logMemory(tag) {
  const nodeMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`[Memoria] ${tag} | Node RSS: ${nodeMB} MB | Contenedor: ${readContainerMemoryMB() ?? 'n/d'} MB`);
}

setInterval(() => logMemory('periódico'), 30000).unref();

let isWhatsAppReady = false;
let isSupabaseConnected = false;
let confirmationSent = false;
let recordatoriosEnProceso = false;
let whatsAppInitializeStarted = false;

async function testSupabaseConnection() {
  const { data, error } = await supabase.from('negocios').select('*').limit(1);

  if (error) {
    isSupabaseConnected = false;
    throw new Error(`Error al consultar Supabase: ${error.message}`);
  }

  isSupabaseConnected = true;
  console.log(
    `Supabase conectado. Consulta a "negocios" exitosa (${data.length} registro(s) en muestra).`,
  );

  return data;
}

function normalizeDigits(number) {
  return String(number).replace(/\D/g, '');
}

function getMexicoNumberVariants(number) {
  let digits = normalizeDigits(number);

  if (digits.length === 10) {
    digits = `521${digits}`;
  }

  const variants = new Set([digits]);

  if (digits.startsWith('521') && digits.length === 13) {
    variants.add(`52${digits.slice(3)}`);
  } else if (digits.startsWith('52') && digits.length === 12) {
    variants.add(`521${digits.slice(2)}`);
  }

  return [...variants];
}

async function resolveWhatsAppContact(number) {
  for (const variant of getMexicoNumberVariants(number)) {
    const contact = await whatsappClient.getNumberId(variant);
    if (contact) {
      return { contact, variant };
    }
  }

  return null;
}

async function sendAdminConfirmation() {
  if (confirmationSent) {
    return;
  }

  if (!ADMIN_NUMBER) {
    console.warn(
      'ADMIN_NUMBER no está configurado. Define la variable de entorno para enviar la confirmación.',
    );
    return;
  }

  const connectedNumber = whatsappClient.info?.wid?.user;
  console.log(`Cuenta conectada: +${connectedNumber || 'desconocida'}`);

  const resolved = await resolveWhatsAppContact(ADMIN_NUMBER);
  if (!resolved) {
    const tried = getMexicoNumberVariants(ADMIN_NUMBER).join(', ');
    console.error(
      `El número ${ADMIN_NUMBER} no está registrado en WhatsApp o el formato es incorrecto.`,
    );
    console.error(`Formatos probados: ${tried}`);
    return;
  }

  const { contact, variant } = resolved;
  const chatId = contact._serialized;

  if (connectedNumber && variant === connectedNumber) {
    console.log(
      'El administrador es la misma cuenta conectada. Revisa el chat "Tú" / "Mensajes contigo mismo" en WhatsApp.',
    );
  }

  const sentMessage = await whatsappClient.sendMessage(chatId, SUCCESS_MESSAGE);
  confirmationSent = true;

  console.log(`Confirmación enviada al administrador (+${variant}).`);
  console.log(`ID del mensaje: ${sentMessage.id._serialized}`);
}

let lastQr = null;
let qrCount = 0;
let readyFallbackTimer = null;

whatsappClient.on('qr', async (qr) => {
  if (qr === lastQr) return; // evita procesar dos veces el mismo QR
  lastQr = qr;
  qrCount += 1;
  console.log(`--- CÓDIGO QR GENERADO (#${qrCount}, pid ${process.pid}) ---`);
  qrCodeImageData = await QRCode.toDataURL(qr);
});

whatsappClient.on('loading_screen', (percent, message) => {
  console.log(`[WhatsApp] Cargando ${percent}% ${message || ''}`);
  logMemory(`sync ${percent}%`);
});

whatsappClient.on('change_state', (state) => {
  console.log(`[WhatsApp] Estado: ${state}`);
});

// Hay versiones de whatsapp-web.js donde 'ready' no llega aunque la sesión ya esté
// CONNECTED. Si pasa, marcamos listo manualmente tras verificar el estado.
function startReadyFallback() {
  if (readyFallbackTimer) return;
  let attempts = 0;
  readyFallbackTimer = setInterval(async () => {
    attempts += 1;
    if (isWhatsAppReady || attempts > 36) {
      clearInterval(readyFallbackTimer);
      readyFallbackTimer = null;
      return;
    }
    try {
      const state = await whatsappClient.getState();
      if (state === 'CONNECTED' && attempts >= 6) {
        console.warn('[WhatsApp] "ready" no se disparó, pero el estado es CONNECTED. Marcando listo.');
        clearInterval(readyFallbackTimer);
        readyFallbackTimer = null;
        onWhatsAppReady('fallback');
      }
    } catch (_) {
      /* página aún navegando; reintenta */
    }
  }, 5000);
}

let isAuthenticated = false;

whatsappClient.on('authenticated', () => {
  isAuthenticated = true;
  console.log('WhatsApp AUTENTICADO');
  qrCodeImageData = '';
  logMemory('authenticated');
  startReadyFallback();
});

whatsappClient.on('auth_failure', (message) => {
  console.error('Fallo de autenticación de WhatsApp:', message);
});

const GREETING_REPLY =
  '¡Hola! Qué gusto saludarte. Soy Cito.mx, tu asistente personal para agendar citas. ¿Qué servicio te gustaría recibir hoy?';

const DATE_REQUEST_REPLY =
  '¡Excelente elección! 📅 ¿Para qué día y hora te gustaría agendar tu cita? (Ejemplo: Mañana a las 4pm o Sábado 10am)';

const STATES = {
  ESPERANDO_SERVICIO: 'ESPERANDO_SERVICIO',
  ESPERANDO_FECHA: 'ESPERANDO_FECHA',
};

const sessions = new Map();

function getSession(userId) {
  return sessions.get(userId) || { state: null, servicio: null };
}

function setSession(userId, session) {
  sessions.set(userId, session);
  console.log(`[WhatsApp] Estado de ${userId}: ${session.state || 'sin estado'}`);
}

function isConversationStarter(text) {
  const normalized = text.toLowerCase().trim();
  return normalized.includes('hola') || normalized.includes('cita');
}

function isOnlyGreeting(text) {
  const normalized = text.toLowerCase().trim();
  return /^(hola|hey|hi|hello|cita|buenas|buenos días|buenas tardes|buenas noches)[\s!.?,]*$/i.test(
    normalized,
  );
}

function isValidServiceMessage(text) {
  const trimmed = text.trim();
  return trimmed.length >= 2 && !isOnlyGreeting(trimmed);
}

function isValidDateMessage(text) {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  if (isOnlyGreeting(trimmed)) return false;
  if (/^(completada|cancelada|pendiente|ok|si|sí|no)$/i.test(trimmed)) return false;
  return true;
}

const SERVICE_RETRY_REPLY =
  'Cuéntame, ¿qué servicio te gustaría recibir? Por ejemplo: Corte de cabello o Limpieza dental.';

const DATE_RETRY_REPLY =
  'Necesito el día y la hora para agendar tu cita. Por ejemplo: Mañana a las 4pm o Sábado 10am.';

const OUT_OF_HOURS_REPLY =
  'Lo sentimos, ese horario está fuera de nuestra jornada de atención. Por favor, elige una hora entre las 9:00 AM y las 2:00 PM.';

const DEFAULT_BUSINESS_HOURS = {
  hora_apertura: '09:00',
  hora_cierre: '14:00',
  dias_laborables: 'Lunes,Martes,Miercoles,Jueves,Viernes,Sabado',
};

const WEEKDAY_DEFINITIONS = [
  { key: 'domingo', label: 'Domingo' },
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectMentionedWeekday(text) {
  const normalized = normalizeText(text);

  for (const day of WEEKDAY_DEFINITIONS) {
    if (normalized.includes(day.key)) {
      return day;
    }
  }

  return null;
}

function parseWorkingDays(diasLaborables) {
  return diasLaborables
    .split(',')
    .map((day) => normalizeText(day.trim()))
    .filter(Boolean);
}

function isWorkingDay(weekday, workingDays) {
  return workingDays.includes(weekday.key);
}

function buildNonWorkingDayReply(dayLabel) {
  return `Lo sentimos, no laboramos los días ${dayLabel}. Por favor, selecciona un día de Lunes a Sábado.`;
}

function validateWorkingDay(messageBody, diasLaborables) {
  const mentionedDay = detectMentionedWeekday(messageBody);

  if (!mentionedDay) {
    return { valid: true };
  }

  const workingDays = parseWorkingDays(diasLaborables);

  if (isWorkingDay(mentionedDay, workingDays)) {
    return { valid: true };
  }

  return {
    valid: false,
    reply: buildNonWorkingDayReply(mentionedDay.label),
  };
}

function normalizeTimeString(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes = '0'] = timeStr.split(':');
  return `${String(parseInt(hours, 10)).padStart(2, '0')}:${String(parseInt(minutes, 10)).padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
  const normalized = normalizeTimeString(timeStr);
  if (!normalized) return null;
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

function extractMilitaryTime(text) {
  const normalized = text.toLowerCase().trim();
  const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);

  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const explicitMeridiem = match[3]?.replace(/\./g, '').toLowerCase();
  const isPm =
    explicitMeridiem === 'pm' ||
    normalized.includes('pm') ||
    normalized.includes('tarde');
  const isAm = explicitMeridiem === 'am' || normalized.includes('am');

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (hours < 1 || hours > 24 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (hours >= 13 && hours <= 24) {
    if (hours === 24) hours = 0;
  } else if (isPm) {
    if (hours !== 12) hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isWithinBusinessHours(militaryTime, openTime, closeTime) {
  const requestedMinutes = timeToMinutes(militaryTime);
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  if (
    requestedMinutes === null ||
    openMinutes === null ||
    closeMinutes === null
  ) {
    return false;
  }

  return requestedMinutes >= openMinutes && requestedMinutes <= closeMinutes;
}

async function getBusinessHours() {
  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('*')
    .eq('negocio_id', NEGOCIO_ID);

  if (error) {
    console.warn(
      `[WhatsApp] Error al consultar configuracion_negocio: ${error.message}. Usando horario por defecto.`,
    );
    return DEFAULT_BUSINESS_HOURS;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[WhatsApp] configuracion_negocio vacía. Usando horario por defecto.');
    return DEFAULT_BUSINESS_HOURS;
  }

  const config = data[0];

  return {
    hora_apertura: config.hora_apertura || DEFAULT_BUSINESS_HOURS.hora_apertura,
    hora_cierre: config.hora_cierre || DEFAULT_BUSINESS_HOURS.hora_cierre,
    dias_laborables:
      config.dias_laborables || DEFAULT_BUSINESS_HOURS.dias_laborables,
  };
}

function buildConfirmationReply(servicio, horarioSolicitado) {
  return (
    '¡Cita Agendada con Éxito! 🎉\n\n' +
    `📝 Servicio: ${servicio}\n` +
    `⏰ Horario solicitado: ${horarioSolicitado}\n\n` +
    'Te esperamos. Si necesitas cancelar, avísanos con tiempo.'
  );
}

// CONTROL DE CUPO Y AFORO
async function agendarCitaConControlDeCupo({ servicioNombre, clienteNombre, clienteTelefono, fechaHoraStr }) {
  try {
    const fechaHoraLimpia = fechaHoraStr.trim().toLowerCase();

    const { data: serviciosData, error: errServicio } = await supabase
      .from('servicios')
      .select('id, capacidad_maxima, nombre')
      .eq('negocio_id', NEGOCIO_ID);

    let capacidadMaxima = 1;
    let servicioId = null;

    if (!errServicio && serviciosData && serviciosData.length > 0) {
      const coincide = serviciosData.find(s => 
        s.nombre.toLowerCase().includes(servicioNombre.toLowerCase().trim()) ||
        servicioNombre.toLowerCase().trim().includes(s.nombre.toLowerCase())
      );
      if (coincide) {
        capacidadMaxima = coincide.capacidad_maxima || 1;
        servicioId = coincide.id;
      }
    }

    const { data: citasExistentes, error: errCitas } = await supabase
      .from('citas')
      .select('id, fecha_hora')
      .eq('negocio_id', NEGOCIO_ID)
      .in('estado', ['pendiente', 'confirmada']);

    if (errCitas) {
      console.error('[Bot] Error al contar citas existentes:', errCitas);
      return { ok: false, message: 'Ocurrió un error al verificar los horarios disponibles.' };
    }

    const ocupados = citasExistentes 
      ? citasExistentes.filter(c => c.fecha_hora && c.fecha_hora.trim().toLowerCase() === fechaHoraLimpia).length 
      : 0;

    console.log(`[Bot Check] Horario: "${fechaHoraStr}" | Ocupados: ${ocupados} / Capacidad Máxima: ${capacidadMaxima}`);

    if (ocupados >= capacidadMaxima) {
      console.log(`[Bot] Cupo lleno para "${fechaHoraStr}". (${ocupados}/${capacidadMaxima})`);
      
      if (capacidadMaxima > 1) {
        return {
          ok: false,
          message: `⚠️ Lo sentimos, el cupo para la clase a las *${fechaHoraStr}* ya está lleno (${ocupados}/${capacidadMaxima} lugares ocupados).\n\nPor favor, selecciona otro horario o fecha.`
        };
      } else {
        return {
          ok: false,
          message: `⚠️ Lo sentimos, el horario de las *${fechaHoraStr}* ya no está disponible.\n\nPor favor, selecciona otra hora.`
        };
      }
    }

    const { error: errInsert } = await supabase.from('citas').insert({
      negocio_id: NEGOCIO_ID,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      servicio: servicioNombre,
      servicio_id: servicioId,
      fecha_hora: fechaHoraStr,
      estado: 'confirmada'
    });

    if (errInsert) {
      console.error('[Bot] Error al insertar cita:', errInsert);
      return { ok: false, message: 'No pudimos confirmar tu cita en este momento. Por favor, inténtalo de nuevo.' };
    }

    return { ok: true, capacidadMaxima, ocupados: ocupados + 1 };

  } catch (error) {
    console.error('[Bot] Error crítico al agendar:', error.message);
    return { ok: false, message: 'Ocurrió un problema técnico al agendar. Por favor intenta de nuevo.' };
  }
}

whatsappClient.on('message', async (msg) => {
  if (msg.fromMe) {
    return;
  }

  const userId = msg.from;
  const messageText = msg.body?.trim() || '';

  if (!messageText) {
    return;
  }

  console.log(`[WhatsApp] Mensaje recibido de ${userId}: "${messageText}"`);

  const session = getSession(userId);

  try {
    if (!session.state) {
      if (!isConversationStarter(messageText)) {
        console.log(`[WhatsApp] Mensaje ignorado (sin flujo activo): "${messageText}"`);
        return;
      }

      setSession(userId, { state: STATES.ESPERANDO_SERVICIO, servicio: null });
      await msg.reply(GREETING_REPLY);
      console.log(`[WhatsApp] Respuesta enviada a ${userId}`);
      return;
    }

    if (session.state === STATES.ESPERANDO_SERVICIO) {
      if (!isValidServiceMessage(messageText)) {
        console.log(`[WhatsApp] Servicio inválido, no se avanza: "${messageText}"`);
        await msg.reply(SERVICE_RETRY_REPLY);
        return;
      }

      setSession(userId, {
        state: STATES.ESPERANDO_FECHA,
        servicio: messageText,
      });
      console.log(`[WhatsApp] Servicio guardado para ${userId}: "${messageText}"`);
      await msg.reply(DATE_REQUEST_REPLY);
      console.log(`[WhatsApp] Respuesta enviada a ${userId}`);
      return;
    }

    if (session.state === STATES.ESPERANDO_FECHA) {
      if (!session.servicio) {
        console.warn(`[WhatsApp] Sesión incompleta para ${userId}, reiniciando flujo.`);
        sessions.delete(userId);
        await msg.reply(GREETING_REPLY);
        return;
      }

      if (!isValidDateMessage(messageText)) {
        console.log(`[WhatsApp] Fecha inválida, no se inserta en Supabase: "${messageText}"`);
        await msg.reply(DATE_RETRY_REPLY);
        return;
      }

      console.log(`[WhatsApp] Fecha indicada por ${userId}: "${msg.body}"`);

      const businessHours = await getBusinessHours();

      const dayValidation = validateWorkingDay(
        msg.body,
        businessHours.dias_laborables,
      );

      if (!dayValidation.valid) {
        await msg.reply(dayValidation.reply);
        return;
      }

      const militaryTime = extractMilitaryTime(msg.body);
      if (!militaryTime) {
        await msg.reply(DATE_RETRY_REPLY);
        return;
      }

      if (
        !isWithinBusinessHours(
          militaryTime,
          businessHours.hora_apertura,
          businessHours.hora_cierre,
        )
      ) {
        await msg.reply(OUT_OF_HOURS_REPLY);
        return;
      }

      const resultado = await agendarCitaConControlDeCupo({
        servicioNombre: session.servicio,
        clienteNombre: msg._data?.notifyName || 'Cliente',
        clienteTelefono: msg.from,
        fechaHoraStr: msg.body
      });

      if (!resultado.ok) {
        await msg.reply(resultado.message);
        return;
      }

      await msg.reply(buildConfirmationReply(session.servicio, msg.body));
      sessions.delete(msg.from);
      return;
    }

  } catch (error) {
    console.error(`[WhatsApp] Error al responder a ${userId}:`, error.message);
  }
});

whatsappClient.on('ready', () => onWhatsAppReady('evento ready'));

async function onWhatsAppReady(origen) {
  if (isWhatsAppReady) return;
  isWhatsAppReady = true;
  console.log(`WhatsApp LISTO (${origen})`);
  logMemory('ready');

  try {
    await testSupabaseConnection();
    await sendAdminConfirmation();
  } catch (error) {
    console.error('Error en la conexión inicial:', error.message);
  }
}

whatsappClient.on('disconnected', (reason) => {
  isWhatsAppReady = false;
  console.warn('Cliente de WhatsApp desconectado:', reason);
  logMemory('disconnected');
});

app.get('/', requireAdminToken, (req, res) => {
    if (qrCodeImageData) {
        res.send(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                <h2>Escanea el código QR con tu WhatsApp:</h2>
                <img src="${qrCodeImageData}" alt="QR Code" style="width:300px;height:300px;"/>
                <p>Actualiza la página si caduca el código.</p>
            </div>
        `);
    } else {
        res.send(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                <h2>Bot conectado / Cargando QR...</h2>
                <p>Si la sesión está activa, el bot ya está funcionando. Si apenas inicia, recarga en unos segundos.</p>
            </div>
        `);
    }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    whatsapp: isWhatsAppReady ? 'connected' : 'disconnected',
    supabase: isSupabaseConnected ? 'connected' : 'disconnected',
    connectedNumber: whatsappClient.info?.wid?.user || null,
    adminNumber: ADMIN_NUMBER ? normalizeDigits(ADMIN_NUMBER) : null,
    confirmationSent,
    recordatoriosEnProceso,
    memoria: {
      nodeRssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      contenedorMB: readContainerMemoryMB(),
    },
  });
});

app.get('/ejecutar-recordatorios', requireAdminToken, async (_req, res) => {
  if (!isWhatsAppReady) {
    res.status(503).json({
      ok: false,
      error: 'WhatsApp no está conectado. Espera a que el cliente esté listo.',
    });
    return;
  }

  if (recordatoriosEnProceso) {
    res.status(409).json({
      ok: false,
      error: 'Ya hay un proceso de recordatorios en ejecución.',
    });
    return;
  }

  recordatoriosEnProceso = true;

  try {
    console.log('[Recordatorio] Inicio manual vía /ejecutar-recordatorios');
    const result = await runRecordatorios({ supabase, whatsappClient });
    console.log('[Recordatorio] Finalizado:', result);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Recordatorio] Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  } finally {
    recordatoriosEnProceso = false;
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor Cito.mx escuchando en http://localhost:${PORT}`);

  try {
    await testSupabaseConnection();
  } catch (error) {
    console.error('Supabase no respondió al arrancar:', error.message);
  }

  if (whatsAppInitializeStarted) {
    console.warn('whatsappClient.initialize() ya fue llamado; no se invoca de nuevo.');
    return;
  }
  whatsAppInitializeStarted = true;

  console.log(`Iniciando cliente de WhatsApp (pid ${process.pid})...\n`);
  logMemory('antes de initialize');
  initializeWhatsApp(1);
});

// Reintenta en el mismo proceso en vez de process.exit(1): un reinicio del
// contenedor en Render borra la sesión (no hay disco) y obliga a escanear otra vez.
const MAX_INIT_ATTEMPTS = 3;

async function initializeWhatsApp(attempt) {
  try {
    await whatsappClient.initialize();
  } catch (error) {
    console.error(`Error al iniciar WhatsApp (intento ${attempt}/${MAX_INIT_ATTEMPTS}):`, error.message);
    // Tras escanear, WhatsApp Web recarga la página y a veces lanza
    // "Execution context was destroyed". Si ya autenticó, no destruimos el
    // cliente: dejamos que termine la sincronización (y el fallback de 'ready').
    if (isWhatsAppReady || isAuthenticated) {
      console.warn('Error tras autenticar; se espera a que termine la sincronización.');
      startReadyFallback();
      return;
    }
    if (attempt >= MAX_INIT_ATTEMPTS) {
      console.error('Se agotaron los reintentos. Saliendo para que Render reinicie.');
      process.exit(1);
    }
    try {
      await whatsappClient.destroy();
    } catch (_) {
      /* el navegador puede ya estar cerrado */
    }
    lastQr = null;
    setTimeout(() => initializeWhatsApp(attempt + 1), 10000);
  }
}

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.message);
});