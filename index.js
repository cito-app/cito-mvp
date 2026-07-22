
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const { Client, LocalAuth } = require('whatsapp-web.js');

const SUPABASE_URL = 'https://pbdprwulwnsjrzvolzut.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_Rc6zXAMP7diNd2DHdkPp6Q_IRRUpX9I';

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const supabase = createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

const SUCCESS_MESSAGE =
  '¡Conexión exitosa! 🚀 El motor de Cito.mx está vivo, conectado a Supabase y listo para agendar. ¡Reserva confirmada!';

const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--disable-extensions',
];

function resolveChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  try {
    const puppeteer = require('puppeteer');
    const executablePath = puppeteer.executablePath();
    if (fs.existsSync(executablePath)) {
      return executablePath;
    }
  } catch {
    // Chrome no está en la caché de Puppeteer todavía.
  }

  throw new Error(
    'No se encontró Chrome compatible. Ejecuta: npx puppeteer browsers install chrome',
  );
}

const whatsappClient = new Client({
  authStrategy: new LocalAuth({ clientId: 'cito-mx' }),
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
  },
  puppeteer: {
    headless: true,
    defaultViewport: null,
    args: PUPPETEER_ARGS,
    executablePath: resolveChromeExecutable(),
  },
});

let isWhatsAppReady = false;
let isSupabaseConnected = false;
let confirmationSent = false;

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

  // Número local mexicano de 10 dígitos → agregar código de país
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

whatsappClient.on('qr', (qr) => {
  console.log('\nEscanea este código QR con WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('authenticated', () => {
  console.log('Autenticación de WhatsApp completada.');
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
  const { data, error } = await supabase.from('configuracion_negocio').select('*');

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
      console.log(
        `[WhatsApp] Horario del negocio: ${businessHours.hora_apertura} - ${businessHours.hora_cierre}`,
      );
      console.log(
        `[WhatsApp] Días laborables: ${businessHours.dias_laborables}`,
      );

      const dayValidation = validateWorkingDay(
        msg.body,
        businessHours.dias_laborables,
      );

      if (!dayValidation.valid) {
        console.log(
          `[WhatsApp] Día no laborable detectado en: "${msg.body}"`,
        );
        await msg.reply(dayValidation.reply);
        return;
      }

      const militaryTime = extractMilitaryTime(msg.body);
      if (!militaryTime) {
        console.log(`[WhatsApp] No se detectó hora válida en: "${msg.body}"`);
        await msg.reply(DATE_RETRY_REPLY);
        return;
      }

      console.log(`[WhatsApp] Hora detectada (24h): ${militaryTime}`);

      if (
        !isWithinBusinessHours(
          militaryTime,
          businessHours.hora_apertura,
          businessHours.hora_cierre,
        )
      ) {
        console.log(
          `[WhatsApp] Horario ${militaryTime} fuera de jornada (${businessHours.hora_apertura} - ${businessHours.hora_cierre})`,
        );
        await msg.reply(OUT_OF_HOURS_REPLY);
        return;
      }

      const { error } = await supabase.from('citas').insert({
        cliente_nombre: msg._data?.notifyName || 'Cliente',
        cliente_telefono: msg.from,
        servicio: session.servicio,
        fecha_hora: msg.body,
      });

      if (error) {
        console.error('[WhatsApp] Error al guardar cita en Supabase:', error);
        await msg.reply(
          'No pudimos confirmar tu cita en este momento. Por favor, inténtalo de nuevo en unos minutos.',
        );
        return;
      }

      console.log(
        `[WhatsApp] Cita guardada en Supabase para ${userId}: ${session.servicio}`,
      );

      await msg.reply(buildConfirmationReply(session.servicio, msg.body));
      sessions.delete(msg.from);
      console.log(`[WhatsApp] Sesión eliminada para ${userId}`);
      console.log(`[WhatsApp] Respuesta enviada a ${userId}`);
      return;
    }

    console.log(`[WhatsApp] Estado desconocido (${session.state}), mensaje ignorado.`);
  } catch (error) {
    console.error(`[WhatsApp] Error al responder a ${userId}:`, error.message);
  }
});

whatsappClient.on('ready', async () => {
  isWhatsAppReady = true;
  console.log('Cliente de WhatsApp conectado y listo.');

  try {
    await testSupabaseConnection();
    await sendAdminConfirmation();
  } catch (error) {
    console.error('Error en la conexión inicial:', error.message);
  }
});

whatsappClient.on('disconnected', (reason) => {
  isWhatsAppReady = false;
  console.warn('Cliente de WhatsApp desconectado:', reason);
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cito.mx</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #F3F4F6;
      font-family: 'Inter', sans-serif;
      padding: 24px;
    }

    .card {
      background-color: #FFFFFF;
      border-radius: 8px;
      padding: 48px 56px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      text-align: center;
      max-width: 520px;
      width: 100%;
    }

    .message {
      color: #3B82F6;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main class="card">
    <p class="message">¡Bienvenido a Cito.mx! El motor está en línea.</p>
  </main>
</body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    whatsapp: isWhatsAppReady ? 'connected' : 'disconnected',
    supabase: isSupabaseConnected ? 'connected' : 'disconnected',
    connectedNumber: whatsappClient.info?.wid?.user || null,
    adminNumber: ADMIN_NUMBER ? normalizeDigits(ADMIN_NUMBER) : null,
    confirmationSent,
  });
});

app.post('/resend-confirmation', async (_req, res) => {
  if (!isWhatsAppReady) {
    res.status(503).json({ error: 'WhatsApp no está conectado.' });
    return;
  }

  try {
    await testSupabaseConnection();
    confirmationSent = false;
    await sendAdminConfirmation();
    res.json({ ok: true, confirmationSent, supabase: isSupabaseConnected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function printRecoverySteps() {
  console.error('\nSi el error persiste, ejecuta en orden:');
  console.error('  npm run reset:whatsapp');
  console.error('  npx puppeteer browsers install chrome');
  console.error('  npm start');
}

app.listen(PORT, async () => {
  console.log(`Servidor Cito.mx escuchando en http://localhost:${PORT}`);

  try {
    await testSupabaseConnection();
  } catch (error) {
    console.error('Supabase no respondió al arrancar:', error.message);
  }

  console.log('Iniciando cliente de WhatsApp...\n');

  whatsappClient.initialize().catch((error) => {
    console.error('Error al iniciar WhatsApp:', error.message);
    printRecoverySteps();
    process.exit(1);
  });
});
