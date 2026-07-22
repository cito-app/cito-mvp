'use strict';

const { execSync } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, '..');

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

function stopSilent(command) {
  try {
    execSync(command, { stdio: 'ignore', shell: true });
  } catch {
    // Ignorar si el proceso ya no existe.
  }
}

console.log('Deteniendo servidor y Chrome de WhatsApp...\n');

const netstat = run('netstat -ano');
const pids = new Set();

for (const line of netstat.split('\n')) {
  if (!line.includes(`:${PORT}`) || !line.includes('LISTENING')) {
    continue;
  }

  const pid = line.trim().split(/\s+/).pop();
  if (pid && /^\d+$/.test(pid) && pid !== '0') {
    pids.add(pid);
  }
}

for (const pid of pids) {
  stopSilent(`taskkill /PID ${pid} /F /T`);
  console.log(`Detenido proceso ${pid} (puerto ${PORT}).`);
}

const wwebjsPath = projectRoot.replace(/\\/g, '\\\\');
const chromeFilter = `Name = 'chrome.exe' AND CommandLine LIKE '%wwebjs%'`;
const chromeProcesses = run(
  `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"${chromeFilter}\\" | Select-Object -ExpandProperty ProcessId"`,
);

for (const pid of chromeProcesses.split('\n')) {
  const trimmed = pid.trim();
  if (!/^\d+$/.test(trimmed)) {
    continue;
  }

  stopSilent(`taskkill /PID ${trimmed} /F /T`);
  console.log(`Detenido Chrome de WhatsApp (PID ${trimmed}).`);
}

if (pids.size === 0 && !chromeProcesses.trim()) {
  console.log('No se encontraron procesos activos del servidor.');
} else {
  console.log('\nProcesos detenidos.');
}
