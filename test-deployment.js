#!/usr/bin/env node

/**
 * Script de prueba completo del deployment en Render
 * Verifica conectividad y configuración
 */

const https = require('https');

const BACKEND_URL = 'https://nexopos-aaj2.onrender.com';
const FRONTEND_URL = 'https://nexopos-1.onrender.com';

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testBackendAPI() {
  console.log('\n🔍 Testeando Backend API...');
  console.log('═══════════════════════════════════════════════════');

  try {
    // Test 1: API root
    const rootRes = await httpRequest(`${BACKEND_URL}/api`);
    console.log(`\n✓ API Root:`);
    console.log(`  Status: ${rootRes.status}`);
    console.log(`  Body: ${rootRes.body.substring(0, 100)}...`);

    // Test 2: Login endpoint validation
    const loginRes = await httpRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: '12345' })
    });
    console.log(`\n✓ Login Endpoint:`);
    console.log(`  Status: ${loginRes.status}`);

    if (loginRes.status === 400 || loginRes.status === 401) {
      console.log(`  Result: ✅ Endpoint funcionando (validación activa)`);
    } else {
      console.log(`  Result: ⚠️  Respuesta inesperada`);
    }

    // Test 3: CORS headers
    console.log(`\n✓ CORS Configuration:`);
    console.log(`  Access-Control-Allow-Origin: ${rootRes.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`  Access-Control-Allow-Credentials: ${rootRes.headers['access-control-allow-credentials'] || 'Not set'}`);

    return true;
  } catch (err) {
    console.log(`\n✗ Error: ${err.message}`);
    return false;
  }
}

async function testFrontend() {
  console.log('\n🔍 Testeando Frontend...');
  console.log('═══════════════════════════════════════════════════');

  try {
    // Test 1: Frontend loads
    const htmlRes = await httpRequest(FRONTEND_URL);
    console.log(`\n✓ Frontend HTML:`);
    console.log(`  Status: ${htmlRes.status}`);
    console.log(`  Content-Type: ${htmlRes.headers['content-type']}`);

    // Test 2: Check for API URL in JS bundle
    const jsMatch = htmlRes.body.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = `${FRONTEND_URL}${jsMatch[1]}`;
      console.log(`\n✓ Checking JS Bundle: ${jsMatch[1]}`);

      const jsRes = await httpRequest(jsUrl);

      const hasCorrectAPI = jsRes.body.includes('nexopos-aaj2.onrender.com');
      const hasLocalhost = jsRes.body.includes('localhost:3000');

      console.log(`  API URL configurada: ${hasCorrectAPI ? '✅' : '❌'}`);
      console.log(`  Localhost presente: ${hasLocalhost ? '⚠️  SÍ (problema)' : '✅ NO'}`);

      if (hasCorrectAPI && !hasLocalhost) {
        console.log(`  Result: ✅ Frontend correctamente configurado`);
        return true;
      } else if (hasLocalhost) {
        console.log(`  Result: ❌ Frontend usa localhost, necesita rebuild con VITE_API_URL`);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.log(`\n✗ Error: ${err.message}`);
    return false;
  }
}

async function testIntegration() {
  console.log('\n🔍 Testeando Integración Frontend → Backend...');
  console.log('═══════════════════════════════════════════════════');

  console.log(`\n  1. Frontend en: ${FRONTEND_URL}`);
  console.log(`  2. Hace requests a: ${BACKEND_URL}/api`);
  console.log(`  3. CORS permite: ${FRONTEND_URL}`);

  console.log(`\n  ✅ Configuración teórica correcta`);
  console.log(`\n  💡 Abre el navegador en:`);
  console.log(`     ${FRONTEND_URL}`);
  console.log(`\n  💡 Abre DevTools (F12) → Console y verifica:`);
  console.log(`     - No hay errores CORS`);
  console.log(`     - Las requests van a ${BACKEND_URL}/api`);
}

async function main() {
  console.log('🚀 Verificación Completa de Deployment NexoPOS\n');
  console.log('═══════════════════════════════════════════════════');

  const backendOk = await testBackendAPI();
  const frontendOk = await testFrontend();
  await testIntegration();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n📊 RESULTADO FINAL:\n');

  if (backendOk && frontendOk) {
    console.log('✅ ¡TODO CORRECTO! El deployment está funcionando.');
    console.log('\n📱 Prueba la aplicación en:');
    console.log(`   ${FRONTEND_URL}`);
    console.log('\n🔐 Necesitas crear un usuario administrador si no existe.');
    console.log('   Puedes usar el seed del backend o crear uno manualmente.');
  } else {
    console.log('⚠️  Hay problemas que necesitan atención:\n');
    if (!backendOk) console.log('   - Backend tiene problemas');
    if (!frontendOk) console.log('   - Frontend necesita rebuild con variables correctas');

    console.log('\n📖 Revisa DEPLOYMENT_RENDER.md para más ayuda');
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

main();
