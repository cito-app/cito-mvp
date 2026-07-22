'use strict';

const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const { Client, LocalAuth } = require('whatsapp-web.js');

const SUPABASE_URL = 'https://pbdprwulwnsjrzvolzut.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_Rc6zXAMP7diNd2DHdkPp6Q_IRRUpX9I';

const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--disable-extensions',
];

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

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

function getTodayKeywords() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const monthName = months[month];
  const paddedDay = String(day).padStart(2, '0');
  const paddedMonth = String(month + 1).padStart(2, '0');

  return [
    'hoy',
    `${day}/${month + 1}/${year}`,
    `${paddedDay}/${paddedMonth}/${year}`,
    `${day} de ${monthName}`,
    `${paddedDay} de ${monthName}`,
    monthName,
  ].map(normalizeText);
}

function isCitaForToday(fechaHora) {
  if (!fechaHora) {
    return false;
  }

  const normalized = normalizeText(fechaHora);
  const todayKeywords = getTodayKeywords();

  return todayKeywords.some((keyword) => normalized.includes(keyword));
}

function buildReminderMessage(nombre, servicio) {
  return (
    `¡Hola ${nombre}! Te recordamos tu cita de hoy para el servicio de: ${servicio}. ` +
    '⏰ Te esperamos. Si tienes algún contratiempo, por favor avísanos por este medio.'
  );
}

function normalizeMexicoDigits(digits) {
  if (digits.startsWith('521') && digits.length >= 13) {
    return `52${digits.slice(3)}`;
  }

  return digits;
}

function formatChatId(telefono) {
  if (!telefono) {
    return null;
  }

  const trimmed = String(telefono).trim();

  if (trimmed.includes('@lid')) {
    return trimmed;
  }

  let digits;

  if (trimmed.includes('@c.us')) {
    digits = trimmed.split('@')[0].replace(/\D/g, '');
  } else {
    digits = trimmed.replace(/\D/g, '');
  }

  if (!digits) {
    return null;
  }

  digits = normalizeMexicoDigits(digits);
  return `${digits}@c.us`;
}

const supabase = createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_KEY);

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

async function fetchPendingCitasForToday() {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('estado', 'pendiente');

  if (error) {
    throw new Error(`Error al consultar citas: ${error.message}`);
  }

  const citasHoy = (data || []).filter((cita) => isCitaForToday(cita.fecha_hora));
  return citasHoy;
}

async function sendReminderToChat(chatId, message, nombre) {
  console.log('[Recordatorio] Destinatario final:', chatId);

  if (chatId.includes('@lid')) {
    await whatsappClient.sendMessage(chatId, message);
    console.log(`[Recordatorio] Enviado a ${nombre} (${chatId})`);
    return;
  }

  const isRegistered = await whatsappClient.isRegisteredUser(chatId);

  if (!isRegistered) {
    console.log(
      `[Recordatorio] ${nombre} (${chatId}) no está registrado en WhatsApp.`,
    );
    return;
  }

  await whatsappClient.sendMessage(chatId, message);
  console.log(`[Recordatorio] Enviado a ${nombre} (${chatId})`);
}

async function sendReminders(citas) {
  for (const cita of citas) {
    const nombre = cita.nombre || cita.cliente_nombre || 'Cliente';
    const servicio = cita.servicio || 'tu servicio';
    const chatId = formatChatId(cita.telefono || cita.cliente_telefono);

    if (!chatId) {
      console.warn(`[Recordatorio] Cita ${cita.id} sin teléfono válido. Se omite.`);
      continue;
    }

    const message = buildReminderMessage(nombre, servicio);

    try {
      await sendReminderToChat(chatId, message, nombre);
    } catch (sendError) {
      console.error(`[Recordatorio] Error al enviar a ${nombre} (${chatId}):`, sendError);
    }
  }
}

async function shutdown(exitCode = 0) {
  try {
    await whatsappClient.destroy();
    console.log('[Recordatorio] Cliente de WhatsApp cerrado.');
  } catch (error) {
    console.warn('[Recordatorio] Error al cerrar WhatsApp:', error.message);
  }

  process.exit(exitCode);
}

whatsappClient.on('qr', (qr) => {
  console.log('\nSesión no encontrada. Escanea este código QR con WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('auth_failure', (message) => {
  console.error('[Recordatorio] Fallo de autenticación:', message);
  shutdown(1);
});

whatsappClient.on('ready', async () => {
  console.log('[Recordatorio] Cliente de WhatsApp listo.');

  try {
    const citasHoy = await fetchPendingCitasForToday();

    if (citasHoy.length === 0) {
      console.log('[Recordatorio] No hay citas pendientes para hoy.');
      await shutdown(0);
      return;
    }

    console.log(`[Recordatorio] Enviando ${citasHoy.length} recordatorio(s)...`);
    await sendReminders(citasHoy);
    console.log(
      '[Recordatorio] Esperando 5 segundos para asegurar la entrega de los mensajes...',
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('[Recordatorio] Proceso completado.');
    await shutdown(0);
  } catch (error) {
    console.error('[Recordatorio] Error durante el envío:', error.message);
    await shutdown(1);
  }
});

console.log('[Recordatorio] Iniciando envío de recordatorios de Cito.mx...');
console.log('[Recordatorio] Asegúrate de que index.js no esté corriendo al mismo tiempo.\n');

whatsappClient.initialize().catch(async (error) => {
  console.error('[Recordatorio] Error al iniciar WhatsApp:', error.message);
  await shutdown(1);
});
