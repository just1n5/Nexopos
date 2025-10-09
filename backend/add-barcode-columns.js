const { Client } = require('pg');

const DB_URL = process.env.DB_URL || 'postgresql://nexopos_user:0B13dRjho45aqVdVThYiLGhlsxbv3Q1E@dpg-d3hiuoj3fgac739rg2hg-a.virginia-postgres.render.com/nexopos';

async function addBarcodeColumns() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Agregar columna barcode a products si no existe
    console.log('Agregando columna barcode a products...');
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS barcode VARCHAR(80);
    `);
    console.log('✓ Columna barcode agregada a products');

    // Agregar columna barcode a product_variants si no existe
    console.log('Agregando columna barcode a product_variants...');
    await client.query(`
      ALTER TABLE product_variants
      ADD COLUMN IF NOT EXISTS barcode VARCHAR(80);
    `);
    console.log('✓ Columna barcode agregada a product_variants');

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Desconectado de la base de datos');
  }
}

addBarcodeColumns()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falló:', error);
    process.exit(1);
  });
