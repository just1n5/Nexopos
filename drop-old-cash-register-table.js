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

async function dropOldCashRegisterTable() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Eliminando tabla cash_register (singular) obsoleta...\n');

    // 1. Verificar existencia de ambas tablas
    const tablesCheck = await client.query(`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_register') as old_table,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_registers') as new_table;
    `);

    const { old_table, new_table } = tablesCheck.rows[0];

    console.log(`   Tabla cash_register (vieja): ${old_table ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   Tabla cash_registers (nueva): ${new_table ? '✅ Existe' : '❌ No existe'}\n`);

    if (!old_table) {
      console.log('   ℹ️  No existe la tabla vieja cash_register, no hay nada que eliminar');
      await client.end();
      process.exit(0);
    }

    if (!new_table) {
      console.log('   ⚠️  ADVERTENCIA: La tabla nueva cash_registers no existe!');
      console.log('   ⚠️  No es seguro eliminar cash_register sin que exista cash_registers');
      await client.end();
      process.exit(1);
    }

    // 2. Verificar si hay datos en la tabla vieja
    const oldDataCount = await client.query(`SELECT COUNT(*) FROM cash_register;`);
    const oldCount = parseInt(oldDataCount.rows[0].count);

    const newDataCount = await client.query(`SELECT COUNT(*) FROM cash_registers;`);
    const newCount = parseInt(newDataCount.rows[0].count);

    console.log(`   📊 Datos en cash_register (vieja): ${oldCount} registros`);
    console.log(`   📊 Datos en cash_registers (nueva): ${newCount} registros\n`);

    if (oldCount > 0) {
      console.log('   ⚠️  La tabla vieja cash_register tiene datos!');
      console.log('   ⚠️  Estos datos se perderán al eliminar la tabla');
      console.log('   💡 Si necesitas migrar datos, cancela y créa un script de migración\n');
    }

    // 3. Eliminar foreign keys que apuntan a cash_register
    console.log('🔗 Buscando foreign keys que apuntan a cash_register...');
    const fks = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE ccu.table_name = 'cash_register'
        AND tc.constraint_type = 'FOREIGN KEY';
    `);

    if (fks.rows.length > 0) {
      console.log(`   Encontradas ${fks.rows.length} foreign keys:\n`);
      for (const fk of fks.rows) {
        console.log(`   🗑️  Eliminando FK ${fk.constraint_name} de ${fk.table_name}.${fk.column_name}`);
        await client.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT "${fk.constraint_name}" CASCADE;`);
      }
      console.log('');
    } else {
      console.log('   ℹ️  No se encontraron foreign keys apuntando a cash_register\n');
    }

    // 4. Eliminar la tabla vieja
    console.log('🗑️  Eliminando tabla cash_register...');
    await client.query(`DROP TABLE IF EXISTS cash_register CASCADE;`);
    console.log('   ✅ Tabla cash_register eliminada exitosamente\n');

    // 5. Verificar que solo quede la tabla nueva
    const finalCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cash_registers'
      );
    `);

    if (finalCheck.rows[0].exists) {
      console.log('✅ Verificación final exitosa: cash_registers existe');
    }

    const oldStillExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cash_register'
      );
    `);

    if (!oldStillExists.rows[0].exists) {
      console.log('✅ Verificación final exitosa: cash_register fue eliminada');
    }

    await client.end();
    console.log('\n✅ Limpieza completada exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la eliminación:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

dropOldCashRegisterTable();
