'use strict';

require('dotenv').config();

const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const { Client, LocalAuth } = require('whatsapp-web.js');


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;


// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pbdprwulwnsjrzvolzut.supabase.co/rest/v1/';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_Rc6zXAMP7diNd2DHdkPp6Q_IRRUpX9I';

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
  if (!text) return '';
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
  if (!fechaHora) return false;

  const normalized = normalizeText(fechaHora);
  const todayKeywords = getTodayKeywords();

  return todayKeywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Extrae la plantilla del negocio y reemplaza las etiquetas dinámicas por valores reales.
 */
function parsearPlantilla(plantillaBase, cita) {
  let mensaje = plantillaBase;

  // Plantilla por defecto si no viene de Supabase
  if (!mensaje || mensaje.trim() === '') {
    mensaje = 'Hola {cliente}, te recordamos tu cita de {servicio} programada para el {fecha} a las {hora}. ⏰ ¡Te esperamos!';
  }

  const nombreCliente = cita.cliente_nombre || cita.nombre || 'Cliente';
  const nombreServicio = cita.servicio || 'tu cita';

  let fechaFormateada = cita.fecha_hora || 'hoy';
  let horaFormateada = '';

  if (cita.fecha_hora && cita.fecha_hora.includes(' ')) {
    const partes = cita.fecha_hora.split(' ');
    fechaFormateada = partes[0];
    horaFormateada = partes.slice(1).join(' ');
  } else {
    horaFormateada = cita.fecha_hora || '';
  }

  // Reemplazos ampliados para soportar {cliente} y {nombre}
  mensaje = mensaje.replace(/{cliente}/g, nombreCliente);
  mensaje = mensaje.replace(/{nombre}/g, nombreCliente);
  mensaje = mensaje.replace(/{servicio}/g, nombreServicio);
  mensaje = mensaje.replace(/{fecha}/g, fechaFormateada);
  mensaje = mensaje.replace(/{hora}/g, horaFormateada);

  return mensaje;
}

function normalizeMexicoDigits(digits) {
  if (digits.startsWith('521') && digits.length >= 13) {
    return `52${digits.slice(3)}`;
  }
  return digits;
}

function formatChatId(telefono) {
  if (!telefono) return null;

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

  if (!digits) return null;

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

/**
 * Consulta las citas uniendo con configuracion_negocio para obtener plantilla_recordatorio.
 */
async function fetchPendingCitasForToday() {
  // 1. Obtenemos las citas
  const { data: citas, error: errorCitas } = await supabase
    .from('citas')
    .select('*');

  if (errorCitas) {
    throw new Error(`Error al consultar citas: ${errorCitas.message}`);
  }

  // 2. Obtenemos las plantillas de configuracion_negocio
  const { data: configs, error: errorConfig } = await supabase
    .from('configuracion_negocio')
    .select('negocio_id, plantilla_recordatorio');

  if (errorConfig) {
    console.warn('[Recordatorio] No se pudo cargar configuracion_negocio:', errorConfig.message);
  }

  // Mapa rápido de plantillas por negocio_id
  const configMap = new Map();
  if (configs) {
    configs.forEach((c) => configMap.set(c.negocio_id, c.plantilla_recordatorio));
  }

  // Plantilla global por defecto (si la cita no tiene negocio_id asignado)
  const defaultPlantilla = configs && configs.length > 0 ? configs[0].plantilla_recordatorio : null;

  // 3. Cruzar datos y filtrar para el día de hoy
  const citasHoy = (citas || []).filter((cita) => {
    const estadoValido = cita.estado === 'pendiente' || cita.estado === 'confirmada';
    return estadoValido && isCitaForToday(cita.fecha_hora);
  }).map((cita) => {
    // Asignar plantilla correspondiente
    const plantilla = configMap.get(cita.negocio_id) || defaultPlantilla;
    return {
      ...cita,
      plantilla_recordatorio: plantilla
    };
  });

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
    const chatId = formatChatId(cita.telefono || cita.cliente_telefono);

    if (!chatId) {
      console.warn(`[Recordatorio] Cita ID ${cita.id} sin teléfono válido. Se omite.`);
      continue;
    }

    // Tomar la plantilla asociada que extrajimos de configuracion_negocio
    const message = parsearPlantilla(cita.plantilla_recordatorio, cita);

    console.log(`[Recordatorio] Mensaje generado: "${message}"`);

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
      console.log('[Recordatorio] No hay citas pendientes/confirmadas para hoy.');
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