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

async function addProductCostColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Agregando columnas de costo a la tabla products...\n');

    // 1. Crear enum para unidades de peso
    const weightUnitEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'weight_unit_enum'
      );
    `);

    if (!weightUnitEnumExists.rows[0].exists) {
      await client.query(`CREATE TYPE weight_unit_enum AS ENUM ('GRAM', 'KILO', 'POUND');`);
      console.log('   ✅ Enum weight_unit_enum creado');
    } else {
      console.log('   ℹ️  Enum weight_unit_enum ya existe');
    }

    // 2. Agregar columna unit_cost
    const unitCostExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'unit_cost'
      );
    `);

    if (!unitCostExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE products
        ADD COLUMN unit_cost DECIMAL(12,2) DEFAULT 0;
      `);
      console.log('   ✅ Columna "unit_cost" agregada');
    } else {
      console.log('   ℹ️  Columna "unit_cost" ya existe');
    }

    // 3. Agregar columna cost_per_gram
    const costPerGramExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'cost_per_gram'
      );
    `);

    if (!costPerGramExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE products
        ADD COLUMN cost_per_gram DECIMAL(12,4) DEFAULT 0;
      `);
      console.log('   ✅ Columna "cost_per_gram" agregada');
    } else {
      console.log('   ℹ️  Columna "cost_per_gram" ya existe');
    }

    // 4. Agregar columna weight_unit
    const weightUnitExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'weight_unit'
      );
    `);

    if (!weightUnitExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE products
        ADD COLUMN weight_unit weight_unit_enum DEFAULT 'GRAM';
      `);
      console.log('   ✅ Columna "weight_unit" agregada');
    } else {
      console.log('   ℹ️  Columna "weight_unit" ya existe');
    }

    // 5. Verificar columnas actuales de la tabla products
    console.log('\n📊 Verificando estructura de la tabla products:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Total de columnas: ${columns.rows.length}`);

    // Mostrar solo las columnas relacionadas con precio y costo
    console.log('\n   Columnas de precio y costo:');
    const priceColumns = columns.rows.filter(col =>
      col.column_name.includes('price') ||
      col.column_name.includes('cost') ||
      col.column_name.includes('weight')
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

addProductCostColumns();
