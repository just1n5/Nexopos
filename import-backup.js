const { Client } = require('pg');
const fs = require('fs');

async function importBackup() {
  const client = new Client({
    host: 'db.vohlomomrskxnuksodmt.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Aguacate41*',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Leer el backup SQL
    console.log('📖 Leyendo archivo de backup...');
    const sqlContent = fs.readFileSync('nexopos_backup.sql', 'utf8');
    console.log(`✅ Archivo leído: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Ejecutar el SQL
    console.log('🚀 Importando datos...');
    console.log('⏳ Esto puede tomar varios minutos...\n');

    await client.query(sqlContent);

    console.log('✅ Importación completada!\n');

    // Verificar las tablas
    console.log('📊 Verificando tablas creadas...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n✅ Total de tablas: ${result.rows.length}`);
    console.log('\nTablas en la base de datos:');
    result.rows.forEach((row, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${row.table_name}`);
    });

    // Verificar datos en tablas importantes
    console.log('\n📈 Verificando datos importados...');
    const tables = ['users', 'tenants', 'products', 'customers', 'sales', 'cash_registers'];

    for (const table of tables) {
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`  ✓ ${table.padEnd(20)}: ${count.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ⚠ ${table.padEnd(20)}: no existe`);
      }
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error durante la importación:');
    console.error(error.message);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    if (error.message.includes('already exists')) {
      console.log('\n💡 Algunas estructuras ya existen en la base de datos.');
      console.log('   Si quieres empezar desde cero, ve a Supabase Dashboard > SQL Editor y ejecuta:');
      console.log('   DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Conexión cerrada');
  }
}

// Ejecutar
importBackup()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
