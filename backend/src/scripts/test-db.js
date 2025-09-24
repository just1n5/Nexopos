// Script para verificar la conexión a PostgreSQL

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nexopos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔄 Intentando conectar a PostgreSQL...\n');
    console.log('Configuración:');
    console.log(`  Host: ${client.host}`);
    console.log(`  Puerto: ${client.port}`);
    console.log(`  Base de datos: ${client.database}`);
    console.log(`  Usuario: ${client.user}`);
    console.log(`  Password: ${client.password ? '****' : '(no configurado)'}\n`);

    await client.connect();
    
    console.log('✅ ¡Conexión exitosa a PostgreSQL!\n');
    
    // Verificar versión
    const result = await client.query('SELECT version()');
    console.log('📊 Información del servidor:');
    console.log(`  ${result.rows[0].version}\n`);
    
    // Verificar que podemos crear tablas
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Permisos de creación de tablas: OK');
    
    // Limpiar
    await client.query('DROP TABLE IF EXISTS test_connection');
    
    console.log('\n🎉 ¡Todo está configurado correctamente!');
    console.log('   Puedes ejecutar: npm run start:dev');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:\n');
    console.error(error.message);
    
    console.log('\n📝 Posibles soluciones:');
    
    if (error.message.includes('password authentication failed')) {
      console.log('   1. Verifica que la contraseña en .env sea correcta');
      console.log('   2. Verifica el nombre de usuario');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('   1. Crea la base de datos "nexopos" en PostgreSQL');
      console.log('   2. Usa pgAdmin o psql para crearla');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   1. Verifica que PostgreSQL esté corriendo');
      console.log('   2. Inicia el servicio de PostgreSQL');
      console.log('   3. En Windows: Servicios → PostgreSQL → Iniciar');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   1. Verifica que DB_HOST sea "localhost" o "127.0.0.1"');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar el test
testConnection();
