#!/usr/bin/env node

/**
 * Script de verificación de servicios en Render
 * Uso: node check-render.js
 */

const https = require('https');

const BACKEND_URL = 'https://nexopos-aaj2.onrender.com/api';
const FRONTEND_URL = 'https://nexopos-1.onrender.com';

function checkUrl(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;

      console.log(`\n✓ ${name}`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${status}`);
      console.log(`  Response Time: ${responseTime}ms`);

      if (status >= 200 && status < 400) {
        console.log(`  Result: ✅ OK`);
      } else {
        console.log(`  Result: ⚠️  Warning (status ${status})`);
      }

      resolve({ name, status, responseTime, ok: status >= 200 && status < 400 });
    }).on('error', (err) => {
      console.log(`\n✗ ${name}`);
      console.log(`  URL: ${url}`);
      console.log(`  Error: ${err.message}`);
      console.log(`  Result: ❌ FAILED`);

      resolve({ name, error: err.message, ok: false });
    });
  });
}

async function main() {
  console.log('🔍 Verificando servicios de NexoPOS en Render...\n');
  console.log('═══════════════════════════════════════════════════');

  const results = await Promise.all([
    checkUrl(BACKEND_URL, 'Backend API'),
    checkUrl(FRONTEND_URL, 'Frontend')
  ]);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n📊 RESUMEN:');

  const allOk = results.every(r => r.ok);

  if (allOk) {
    console.log('\n✅ Todos los servicios están funcionando correctamente');
  } else {
    console.log('\n⚠️  Algunos servicios tienen problemas:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'HTTP ' + r.status}`);
    });
  }

  console.log('\n💡 NOTAS:');
  console.log('   - Los servicios Free de Render se suspenden tras 15 min de inactividad');
  console.log('   - El primer request puede tardar 30-60 segundos en despertar el servicio');
  console.log('   - Si el backend responde pero el frontend no conecta, verifica VITE_API_URL');

  process.exit(allOk ? 0 : 1);
}

main();
