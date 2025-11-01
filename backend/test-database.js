const { Client } = require('pg');

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DB_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Verificar tablas principales
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 Tablas encontradas: ${tables.rows.length}`);
    console.log('   ', tables.rows.map(r => r.table_name).join(', '));
    console.log('');

    // Contar registros en tablas principales
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM products'),
      client.query('SELECT COUNT(*) as count FROM categories'),
      client.query('SELECT COUNT(*) as count FROM customers'),
      client.query('SELECT COUNT(*) as count FROM sales'),
      client.query('SELECT COUNT(*) as count FROM cash_registers'),
    ]);

    console.log('📈 Registros por tabla:');
    console.log(`   Users: ${counts[0].rows[0].count}`);
    console.log(`   Products: ${counts[1].rows[0].count}`);
    console.log(`   Categories: ${counts[2].rows[0].count}`);
    console.log(`   Customers: ${counts[3].rows[0].count}`);
    console.log(`   Sales: ${counts[4].rows[0].count}`);
    console.log(`   Cash Registers: ${counts[5].rows[0].count}`);
    console.log('');

    // Verificar productos con imágenes rotas
    const brokenImages = await client.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE "imageUrl" IS NOT NULL;
    `);

    console.log('🖼️  Productos con referencias de imagen:', brokenImages.rows[0].count);

    // Verificar productos sin stock
    const noStock = await client.query(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv."productId"
      WHERE p.status = 'ACTIVE';
    `);

    console.log('📦 Productos activos:', noStock.rows[0].count);
    console.log('');

    // Verificar caja abierta
    const openRegister = await client.query(`
      SELECT COUNT(*) as count
      FROM cash_registers
      WHERE status = 'OPEN';
    `);

    console.log('🏦 Cajas abiertas:', openRegister.rows[0].count);

    console.log('\n✅ Prueba de base de datos completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabase();
