'use strict';

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
  return getTodayKeywords().some((keyword) => normalized.includes(keyword));
}

function parsearPlantilla(plantillaBase, cita) {
  let mensaje = plantillaBase;

  if (!mensaje || mensaje.trim() === '') {
    mensaje =
      'Hola {cliente}, te recordamos tu cita de {servicio} programada para el {fecha} a las {hora}. ⏰ ¡Te esperamos!';
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

async function fetchPendingCitasForToday(supabase) {
  const { data: citas, error: errorCitas } = await supabase.from('citas').select('*');

  if (errorCitas) {
    throw new Error(`Error al consultar citas: ${errorCitas.message}`);
  }

  const { data: configs, error: errorConfig } = await supabase
    .from('configuracion_negocio')
    .select('negocio_id, plantilla_recordatorio');

  if (errorConfig) {
    console.warn('[Recordatorio] No se pudo cargar configuracion_negocio:', errorConfig.message);
  }

  const configMap = new Map();
  if (configs) {
    configs.forEach((c) => configMap.set(c.negocio_id, c.plantilla_recordatorio));
  }

  const defaultPlantilla =
    configs && configs.length > 0 ? configs[0].plantilla_recordatorio : null;

  return (citas || [])
    .filter((cita) => {
      const estadoValido = cita.estado === 'pendiente' || cita.estado === 'confirmada';
      return estadoValido && isCitaForToday(cita.fecha_hora);
    })
    .map((cita) => ({
      ...cita,
      plantilla_recordatorio: configMap.get(cita.negocio_id) || defaultPlantilla,
    }));
}

async function sendReminderToChat(whatsappClient, chatId, message, nombre) {
  console.log('[Recordatorio] Destinatario final:', chatId);

  if (chatId.includes('@lid')) {
    await whatsappClient.sendMessage(chatId, message);
    return { sent: true, chatId, nombre };
  }

  const isRegistered = await whatsappClient.isRegisteredUser(chatId);

  if (!isRegistered) {
    console.log(`[Recordatorio] ${nombre} (${chatId}) no está registrado en WhatsApp.`);
    return { sent: false, chatId, nombre, reason: 'not_registered' };
  }

  await whatsappClient.sendMessage(chatId, message);
  return { sent: true, chatId, nombre };
}

async function runRecordatorios({ supabase, whatsappClient }) {
  const citasHoy = await fetchPendingCitasForToday(supabase);

  if (citasHoy.length === 0) {
    return {
      total: 0,
      enviados: 0,
      omitidos: 0,
      detalle: [],
      message: 'No hay citas pendientes o confirmadas para hoy.',
    };
  }

  const detalle = [];
  let enviados = 0;
  let omitidos = 0;

  for (const cita of citasHoy) {
    const nombre = cita.nombre || cita.cliente_nombre || 'Cliente';
    const chatId = formatChatId(cita.telefono || cita.cliente_telefono);

    if (!chatId) {
      omitidos += 1;
      detalle.push({ citaId: cita.id, nombre, sent: false, reason: 'invalid_phone' });
      continue;
    }

    const message = parsearPlantilla(cita.plantilla_recordatorio, cita);

    try {
      const result = await sendReminderToChat(whatsappClient, chatId, message, nombre);
      if (result.sent) {
        enviados += 1;
      } else {
        omitidos += 1;
      }
      detalle.push({ citaId: cita.id, ...result });
    } catch (error) {
      omitidos += 1;
      detalle.push({
        citaId: cita.id,
        nombre,
        chatId,
        sent: false,
        reason: error.message,
      });
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    total: citasHoy.length,
    enviados,
    omitidos,
    detalle,
    message: 'Recordatorios procesados.',
  };
}

module.exports = {
  runRecordatorios,
};
