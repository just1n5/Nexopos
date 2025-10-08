#!/usr/bin/env node

/**
 * Script para crear usuario administrador directamente en la base de datos
 * Sin necesidad de acceder al Shell de Render
 */

const https = require('https');

const BACKEND_URL = 'https://nexopos-aaj2.onrender.com';

async function createAdminUser() {
  console.log('🔐 Creando usuario administrador via API...\n');

  // Intentamos crear el usuario usando el endpoint de registro (si existe)
  // o directamente haciendo el seed via un endpoint público

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // Intentar llamar al endpoint de seed si existe
  console.log('Intentando ejecutar seed via API...');

  const seedData = JSON.stringify({});

  return new Promise((resolve, reject) => {
    const req = https.request(`${BACKEND_URL}/api/seed`, options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('\n✅ Seed ejecutado exitosamente!');
          console.log('\n📝 Credenciales de login:');
          console.log('   Email: admin@nexopos.co');
          console.log('   Password: Admin123!');
          resolve(true);
        } else if (res.statusCode === 404) {
          console.log('\n⚠️  El endpoint /api/seed no existe.');
          console.log('\nOpciones alternativas:');
          console.log('1. Necesitas acceso Shell (plan paid de Render)');
          console.log('2. Conectarse a la DB externamente con psql');
          console.log('3. Crear un endpoint público de seed en el backend');
          resolve(false);
        } else {
          console.log('\n❌ Error ejecutando seed');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('\n❌ Error de conexión:', err.message);
      reject(err);
    });

    req.write(seedData);
    req.end();
  });
}

async function suggestAlternatives() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📋 ALTERNATIVAS PARA CREAR USUARIO ADMINISTRADOR\n');

  console.log('1️⃣  OPCIÓN 1: Upgrade a plan Starter ($7/mes)');
  console.log('   - Te da acceso al Shell');
  console.log('   - Ejecutas: npm run seed');
  console.log('   - Es la forma más fácil\n');

  console.log('2️⃣  OPCIÓN 2: Conexión directa a PostgreSQL');
  console.log('   - Desde Render Dashboard → Database → Connections');
  console.log('   - Copia la "External Database URL"');
  console.log('   - Instala psql en tu máquina');
  console.log('   - Ejecuta el SQL para crear usuario\n');

  console.log('3️⃣  OPCIÓN 3: Crear endpoint público de seed (más seguro)');
  console.log('   - Modificar el backend para tener un endpoint /api/setup');
  console.log('   - Protegerlo con un token secreto');
  console.log('   - Llamarlo una vez para crear datos iniciales\n');

  console.log('4️⃣  OPCIÓN 4: Ejecutar seed desde local');
  console.log('   - Necesitas las credenciales de la DB de Render');
  console.log('   - Configurarlas en .env local');
  console.log('   - Ejecutar npm run seed desde local\n');

  console.log('═══════════════════════════════════════════════════\n');

  console.log('💡 RECOMENDACIÓN:');
  console.log('   Opción 4 es la más rápida ahora mismo.');
  console.log('   Te guío paso a paso:\n');

  console.log('   1. Ve a Render Dashboard → Database → Connections');
  console.log('   2. Copia estos valores:');
  console.log('      - Hostname');
  console.log('      - Port');
  console.log('      - Database');
  console.log('      - Username');
  console.log('      - Password\n');

  console.log('   3. Crea un archivo backend/.env.render con:');
  console.log('      DB_HOST=<hostname>');
  console.log('      DB_PORT=<port>');
  console.log('      DB_NAME=<database>');
  console.log('      DB_USER=<username>');
  console.log('      DB_PASSWORD=<password>');
  console.log('      DB_SCHEMA=public\n');

  console.log('   4. Ejecuta:');
  console.log('      cd backend');
  console.log('      cp .env.render .env');
  console.log('      npm run seed');
  console.log('      rm .env  (no commitear este archivo!)\n');

  console.log('═══════════════════════════════════════════════════\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 SCRIPT DE CREACIÓN DE USUARIO ADMIN - NexoPOS');
  console.log('═══════════════════════════════════════════════════\n');

  const success = await createAdminUser();

  if (!success) {
    await suggestAlternatives();
  }
}

main().catch(console.error);
