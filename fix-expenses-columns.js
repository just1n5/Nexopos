const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está configurado');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function fixExpensesColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Agregando columnas faltantes a la tabla expenses...\n');

    // Verificar y agregar columna createdBy
    const createdByExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'expenses'
        AND column_name = 'createdBy'
      );
    `);

    if (!createdByExists.rows[0].exists) {
      // Si existe processedById, usar esos valores como createdBy
      const processedByIdExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'expenses'
          AND column_name = 'processedById'
        );
      `);

      if (processedByIdExists.rows[0].exists) {
        // Agregar la columna como nullable primero
        await client.query(`ALTER TABLE expenses ADD COLUMN "createdBy" UUID;`);
        // Copiar los datos de processedById a createdBy
        await client.query(`UPDATE expenses SET "createdBy" = "processedById" WHERE "processedById" IS NOT NULL;`);
        console.log('   ✅ Columna "createdBy" agregada y poblada desde "processedById"');
      } else {
        // Agregar la columna como nullable
        await client.query(`ALTER TABLE expenses ADD COLUMN "createdBy" UUID;`);
        console.log('   ✅ Columna "createdBy" agregada');
      }
    } else {
      console.log('   ℹ️  Columna "createdBy" ya existe');
    }

    // Verificar y agregar columna approvedBy
    const approvedByExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'expenses'
        AND column_name = 'approvedBy'
      );
    `);

    if (!approvedByExists.rows[0].exists) {
      await client.query(`ALTER TABLE expenses ADD COLUMN "approvedBy" UUID;`);
      console.log('   ✅ Columna "approvedBy" agregada');
    } else {
      console.log('   ℹ️  Columna "approvedBy" ya existe');
    }

    // Verificar y agregar columna approvedAt
    const approvedAtExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'expenses'
        AND column_name = 'approvedAt'
      );
    `);

    if (!approvedAtExists.rows[0].exists) {
      await client.query(`ALTER TABLE expenses ADD COLUMN "approvedAt" TIMESTAMP;`);
      console.log('   ✅ Columna "approvedAt" agregada');
    } else {
      console.log('   ℹ️  Columna "approvedAt" ya existe');
    }

    // Verificar todas las columnas actuales
    console.log('\n📊 Columnas actuales en la tabla expenses:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
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

fixExpensesColumns();
