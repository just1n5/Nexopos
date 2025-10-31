const { Client } = require('pg');

async function clearImageUrls() {
  const client = new Client({
    connectionString: process.env.DB_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    // Limpiar todas las URLs de imágenes
    console.log('📝 Limpiando referencias de imágenes...');
    const result = await client.query(`
      UPDATE products
      SET "imageUrl" = NULL
      WHERE "imageUrl" IS NOT NULL;
    `);

    console.log(`✅ ${result.rowCount} productos actualizados`);
    console.log('✅ Todas las referencias de imágenes han sido limpiadas');
    console.log('💡 Ahora los productos mostrarán el ícono de placeholder');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de la base de datos');
  }
}

clearImageUrls();
