const { Client } = require('pg');

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DB_URL o DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

// Tablas que deberían existir según el código
const requiredTables = [
  'expenses',
  'chart_of_accounts',
  'tax_withholdings',
  'journal_entries',
  'journal_entry_lines',
  'fiscal_config'
];

async function checkTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📊 Verificando tablas del módulo de contabilidad:\n');

    const existingTables = [];
    const missingTables = [];

    for (const table of requiredTables) {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        );
      `;

      const result = await client.query(query, [table]);
      const exists = result.rows[0].exists;

      if (exists) {
        console.log(`   ✅ ${table} - EXISTE`);
        existingTables.push(table);
      } else {
        console.log(`   ❌ ${table} - FALTA`);
        missingTables.push(table);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   - Tablas existentes: ${existingTables.length}`);
    console.log(`   - Tablas faltantes: ${missingTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n⚠️  Tablas faltantes que necesitan ser creadas:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    }

    // Si expenses existe, verificar si tiene ocrData
    if (existingTables.includes('expenses')) {
      console.log('\n🔍 Verificando columnas en tabla expenses:');

      const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'expenses'
        ORDER BY ordinal_position;
      `;

      const colResult = await client.query(colQuery);
      const columns = colResult.rows.map(r => r.column_name);

      console.log(`   Columnas encontradas: ${columns.length}`);

      const hasOcrData = columns.includes('ocrData');
      if (hasOcrData) {
        console.log('   ✅ ocrData - EXISTE');
      } else {
        console.log('   ❌ ocrData - FALTA');
      }
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkTables();
