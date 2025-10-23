const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addTaxColumn() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Agregando columna tax a la tabla products...\n');

    // 1. Verificar si la columna ya existe
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'tax'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('   ℹ️  Columna "tax" ya existe');
      await client.end();
      process.exit(0);
    }

    // 2. Agregar columna tax con valor por defecto 19.00 (IVA general Colombia)
    await client.query(`
      ALTER TABLE products
      ADD COLUMN tax DECIMAL(5,2) DEFAULT 19.00;
    `);
    console.log('   ✅ Columna "tax" agregada con default 19.00');

    // 3. Actualizar productos existentes con IVA 19%
    const updateResult = await client.query(`
      UPDATE products
      SET tax = 19.00
      WHERE tax IS NULL;
    `);
    console.log(`   ✅ ${updateResult.rowCount} productos actualizados con IVA 19%`);

    // 4. Verificar columnas actuales de la tabla products
    console.log('\n📊 Verificando estructura de la tabla products:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Total de columnas: ${columns.rows.length}`);

    // Mostrar columnas relacionadas con impuestos y precios
    console.log('\n   Columnas de precio, costo e impuestos:');
    const priceColumns = columns.rows.filter(col =>
      col.column_name.includes('price') ||
      col.column_name.includes('cost') ||
      col.column_name.includes('tax')
    );

    priceColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    await client.end();
    console.log('\n✅ Migración completada exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

addTaxColumn();
