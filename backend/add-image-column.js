const { Client } = require('pg');

async function addImageColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    // Check if column exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='products'
      AND column_name='imageUrl';
    `;

    const checkResult = await client.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log('✅ La columna imageUrl ya existe en la tabla products');
    } else {
      console.log('📝 Agregando columna imageUrl a la tabla products...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN "imageUrl" VARCHAR(500);
      `);
      console.log('✅ Columna imageUrl agregada exitosamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de la base de datos');
  }
}

addImageColumn();
