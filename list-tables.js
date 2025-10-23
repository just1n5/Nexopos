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

async function listTables() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const result = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog'
        AND schemaname != 'information_schema'
      ORDER BY tablename;
    `);

    console.log(`📋 Tablas en la base de datos (${result.rows.length} total):\n`);
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}`);
    });

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

listTables();
