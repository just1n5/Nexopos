const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL o DB_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function renameCashRegisterTable() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Renombrando tabla cash_register a cash_registers...\n');

    // 1. Verificar si existe cash_register (singular)
    const oldTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cash_register'
      );
    `);

    // 2. Verificar si existe cash_registers (plural)
    const newTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cash_registers'
      );
    `);

    if (!oldTableExists.rows[0].exists) {
      console.log('   ℹ️  La tabla cash_register no existe, no hay nada que renombrar');

      if (!newTableExists.rows[0].exists) {
        console.log('   ⚠️  Tampoco existe cash_registers, debes crear las tablas primero');
      } else {
        console.log('   ✅ La tabla cash_registers ya existe correctamente');
      }

      await client.end();
      process.exit(0);
    }

    if (newTableExists.rows[0].exists) {
      console.log('   ⚠️  La tabla cash_registers ya existe!');
      console.log('   ⚠️  Existe tanto cash_register como cash_registers');
      console.log('   ⚠️  Debes decidir cuál eliminar manualmente');
      await client.end();
      process.exit(1);
    }

    // 3. Renombrar tabla
    console.log('   🔄 Renombrando cash_register -> cash_registers...');
    await client.query(`ALTER TABLE cash_register RENAME TO cash_registers;`);
    console.log('   ✅ Tabla renombrada exitosamente');

    // 4. Actualizar constraint names si es necesario
    console.log('\n📝 Verificando constraints...');
    const constraints = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'cash_registers';
    `);

    console.log(`   Encontrados ${constraints.rows.length} constraints:`);
    constraints.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}`);
    });

    // 5. Verificar índices
    console.log('\n📝 Verificando índices...');
    const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'cash_registers';
    `);

    console.log(`   Encontrados ${indexes.rows.length} índices:`);
    indexes.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    // 6. Verificar estructura final
    console.log('\n📊 Verificando estructura final de cash_registers:');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cash_registers'
      ORDER BY ordinal_position;
    `);

    console.log(`\n   Total de columnas: ${finalColumns.rows.length}\n`);
    finalColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await client.end();
    console.log('\n✅ Tabla cash_register renombrada exitosamente a cash_registers\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante el renombre:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

renameCashRegisterTable();
