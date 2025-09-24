// ========================================
// SCRIPT DE VERIFICACIÓN SIMPLIFICADA
// ========================================

const { Client } = require('pg');
const http = require('http');
require('dotenv').config({ path: './backend/.env' });

async function verificarSistemaCompleto() {
  console.log('\n🔍 VERIFICACIÓN DEL SISTEMA NEXOPOS\n');
  console.log('='.repeat(50));

  let todoOk = true;
  const resultados = {
    database: false,
    backend: false,
    frontend: false,
    datos: false
  };

  // 1. VERIFICAR BASE DE DATOS
  console.log('\n📊 Verificando Base de Datos...');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nexopos',
    user: process.env.DB_USER || 'nexopos_user',
    password: process.env.DB_PASSWORD || 'nexopos123',
  });

  try {
    await client.connect();
    console.log('✓ Conexión exitosa a PostgreSQL');
    
    // Verificar tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tablas = tablesResult.rows.map(r => r.table_name);
    console.log(`✓ ${tablas.length} tablas encontradas`);
    
    if (tablas.length > 0) {
      // Verificar si hay usuarios
      try {
        const countResult = await client.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(countResult.rows[0].count);
        
        if (userCount === 0) {
          console.log('⚠ No hay usuarios. Ejecuta: npm run seed');
        } else {
          console.log(`✓ Base de datos con datos (${userCount} usuarios)`);
          resultados.datos = true;
        }
      } catch (e) {
        console.log('⚠ Tabla users no existe. Ejecuta el backend primero');
      }
    } else {
      console.log('⚠ No hay tablas. El backend creará las tablas automáticamente');
    }
    
    resultados.database = true;
  } catch (error) {
    console.log('✗ Error de conexión a la base de datos');
    console.log(`  ${error.message}`);
    todoOk = false;
  } finally {
    await client.end();
  }

  // 2. VERIFICAR BACKEND
  console.log('\n🔧 Verificando Backend...');
  const checkBackend = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
          console.log('✓ Backend funcionando en http://localhost:3000');
          resultados.backend = true;
          resolve(true);
        } else {
          console.log('✗ Backend no responde correctamente');
          console.log('  Ejecuta: cd backend && npm run start:dev');
          resolve(false);
        }
      });

      req.on('error', (err) => {
        console.log('✗ Backend no está corriendo');
        console.log('  Ejecuta: cd backend && npm run start:dev');
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log('✗ Backend timeout');
        resolve(false);
      });

      req.end();
    });
  };

  await checkBackend();
  if (!resultados.backend) {
    todoOk = false;
  }

  // 3. VERIFICAR FRONTEND
  console.log('\n🎨 Verificando Frontend...');
  const checkFrontend = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 5173,
        path: '/',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✓ Frontend funcionando en http://localhost:5173');
          resultados.frontend = true;
          resolve(true);
        } else {
          console.log('✗ Frontend no responde');
          console.log('  Ejecuta: cd frontend && npm run dev');
          resolve(false);
        }
      });

      req.on('error', (err) => {
        console.log('✗ Frontend no está corriendo');
        console.log('  Ejecuta: cd frontend && npm run dev');
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log('✗ Frontend timeout');
        resolve(false);
      });

      req.end();
    });
  };

  await checkFrontend();
  if (!resultados.frontend) {
    todoOk = false;
  }

  // RESUMEN
  console.log('\n📋 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(50));
  
  console.log(`  ${resultados.database ? '✓' : '✗'} Base de Datos`);
  console.log(`  ${resultados.backend ? '✓' : '✗'} Backend API`);
  console.log(`  ${resultados.frontend ? '✓' : '✗'} Frontend React`);
  console.log(`  ${resultados.datos ? '✓' : '✗'} Datos de Prueba`);

  // INSTRUCCIONES FINALES
  if (!todoOk) {
    console.log('\n⚠ ACCIONES REQUERIDAS:');
    
    if (!resultados.backend) {
      console.log('\n1. Iniciar Backend:');
      console.log('   cd backend');
      console.log('   npm install');
      console.log('   npm run start:dev');
    }
    
    if (!resultados.frontend) {
      console.log('\n2. Iniciar Frontend:');
      console.log('   cd frontend');
      console.log('   npm install');
      console.log('   npm run dev');
    }
    
    if (!resultados.datos) {
      console.log('\n3. Cargar datos de prueba:');
      console.log('   cd backend');
      console.log('   npm run seed');
    }
  } else {
    console.log('\n✨ ¡SISTEMA LISTO PARA PRUEBAS!');
    console.log('\n🚀 URLs de Acceso:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   API Docs: http://localhost:3000/api');
    console.log('   Backend:  http://localhost:3000');
    
    console.log('\n👤 Credenciales de Prueba:');
    console.log('   Admin:    admin@nexopos.com / Admin123!');
    console.log('   Cajero:   cajero@nexopos.com / Cajero123!');
    console.log('   Tendero:  tendero@nexopos.com / Tendero123!');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Ejecutar verificación
verificarSistemaCompleto()
  .catch(error => {
    console.error('\n❌ Error durante la verificación:');
    console.error(error.message);
    process.exit(1);
  });
