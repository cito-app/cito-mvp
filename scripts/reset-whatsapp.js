'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const sessionDirs = ['.wwebjs_auth', '.wwebjs_cache'];
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Espera activa breve mientras se liberan archivos bloqueados.
  }
}

function removeWithRetry(fullPath, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log(`Eliminado: ${label}`);
      return;
    } catch (error) {
      const isLocked = error.code === 'EPERM' || error.code === 'EBUSY';

      if (!isLocked || attempt === MAX_RETRIES) {
        throw error;
      }

      console.log(`Esperando a liberar ${label}... (${attempt}/${MAX_RETRIES})`);
      sleep(RETRY_DELAY_MS);
    }
  }
}

console.log('Reiniciando sesión de WhatsApp...\n');

try {
  execSync('node scripts/stop-server.js', {
    cwd: projectRoot,
    stdio: 'inherit',
  });
} catch {
  // stop-server puede fallar si no hay procesos; continuar con el reset.
}

console.log('');

for (const dir of sessionDirs) {
  const fullPath = path.join(projectRoot, dir);

  if (!fs.existsSync(fullPath)) {
    console.log(`No existía: ${dir}`);
    continue;
  }

  try {
    removeWithRetry(fullPath, dir);
  } catch (error) {
    console.error(`\nNo se pudo eliminar ${dir}: ${error.message}`);
    console.error('\nCierra manualmente:');
    console.error('  1. Todas las terminales donde corra node index.js');
    console.error('  2. Ventanas de Chrome abiertas por el bot');
    console.error('  3. Vuelve a ejecutar: npm run reset:whatsapp');
    process.exit(1);
  }
}

console.log('\nSesión de WhatsApp reiniciada. Ejecuta npm start de nuevo.');
