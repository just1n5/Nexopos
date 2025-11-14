const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function importToSupabase() {
  // Credenciales de Supabase
  const connectionString = 'postgresql://postgres.vohlomomrskxnuksodmt:Aguacate41*@db.vohlomomrskxnuksodmt.supabase.co:5432/postgres';

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Leer el archivo SQL
    console.log('📖 Leyendo archivo de backup...');
    const sqlPath = path.join(__dirname, 'nexopos_backup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ Archivo leído: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Ejecutar el SQL
    console.log('🚀 Ejecutando importación...');
    console.log('⏳ Esto puede tomar unos minutos...\n');

    await client.query(sqlContent);

    console.log('✅ Importación completada exitosamente!\n');

    // Verificar las tablas creadas
    console.log('📊 Verificando tablas creadas...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n✅ Total de tablas: ${result.rows.length}`);
    console.log('\nTablas creadas:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // Verificar datos en algunas tablas clave
    console.log('\n📈 Verificando datos...');
    const tables = ['users', 'products', 'customers', 'sales'];

    for (const table of tables) {
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${count.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ${table}: tabla no existe o vacía`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error durante la importación:');
    console.error(error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Algunas tablas ya existen. Esto es normal si ya ejecutaste el script antes.');
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Conexión cerrada');
  }
}

// Ejecutar
importToSupabase()
  .then(() => {
    console.log('\n🎉 ¡Proceso completado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
