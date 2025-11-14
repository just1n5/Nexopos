const { Client } = require('pg');
const fs = require('fs');

// Configuración de ambas bases de datos
const dokku = {
  connectionString: 'postgres://postgres:fa0635d1270d9793d5d5fe8969ad2de2@192.168.80.17:5432/nexopos_db'
};

const supabase = {
  connectionString: 'postgresql://postgres.vohlomomrskxnuksodmt:Aguacate41*@aws-0-us-east-2.pooler.supabase.com:6543/postgres'
};

async function migrateDatabase() {
  const dokkuClient = new Client(dokku);
  const supabaseClient = new Client({...supabase, ssl: { rejectUnauthorized: false }});

  try {
    console.log('🔌 Conectando a ambas bases de datos...\n');

    await dokkuClient.connect();
    console.log('✅ Conectado a Dokku');

    await supabaseClient.connect();
    console.log('✅ Conectado a Supabase\n');

    // 1. Leer y ejecutar el SQL del backup
    console.log('📖 Leyendo backup SQL...');
    const sqlContent = fs.readFileSync('nexopos_backup.sql', 'utf8');

    console.log('🚀 Ejecutando SQL en Supabase...');
    console.log('⏳ Esto puede tomar varios minutos...\n');

    // Ejecutar el SQL completo
    await supabaseClient.query(sqlContent);

    console.log('✅ Schema y datos importados exitosamente!\n');

    // Verificar
    console.log('📊 Verificando tablas...');
    const tablesResult = await supabaseClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n✅ Total de tablas: ${tablesResult.rows.length}\n`);

    // Verificar conteo de datos
    const tables = ['users', 'products', 'customers', 'sales', 'cash_registers'];
    console.log('📈 Conteo de registros:');

    for (const table of tables) {
      try {
        const count = await supabaseClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`  ✓ ${table}: ${count.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ⚠ ${table}: no existe o vacía`);
      }
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);

    if (error.message.includes('already exists')) {
      console.log('\n💡 Tip: Las tablas ya existen. Si quieres reiniciar, elimínalas primero desde Supabase Dashboard.');
    }

    process.exit(1);
  } finally {
    await dokkuClient.end();
    await supabaseClient.end();
    console.log('\n👋 Conexiones cerradas');
  }
}

// Ejecutar
migrateDatabase()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
