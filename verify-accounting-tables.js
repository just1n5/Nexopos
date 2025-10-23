const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function verifyAccountingTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    console.log('\n📋 Verificando columna journalEntryId en la tabla expenses...');

    const columnQuery = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'expenses'
        AND column_name = 'journalEntryId'
      );
    `;

    const columnResult = await client.query(columnQuery);

    if (columnResult.rows[0].exists) {
      console.log('✅ La columna "journalEntryId" existe en la tabla expenses.');
    } else {
      console.log('❌ La columna "journalEntryId" NO existe en la tabla expenses.');
    }

    console.log('\n📋 Verificando tablas de contabilidad...');

    const accountingTables = [
      'chart_of_accounts',
      'fiscal_configs',
      'journal_entries',
      'journal_entry_lines',
      'expenses',
      'tax_withholdings',
    ];

    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${accountingTables.map(t => `'${t}'`).join(', ')})
      ORDER BY table_name;
    `;

    const result = await client.query(query);

    if (result.rows.length > 0) {
      console.log('✅ Las siguientes tablas de contabilidad existen:');
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('❌ No se encontraron tablas de contabilidad.');
    }


    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la verificación de tablas:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

verifyAccountingTables();
